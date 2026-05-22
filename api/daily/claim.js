import {
  addXpToPlayer,
  buildPublicPlayer,
  findPlayerByTelegramId,
  isVipActive,
  requireServerConfig,
  secondsUntil,
  sendMethodNotAllowed,
  toNumber,
  updatePlayerByColumn,
  verifyTelegramInitData
} from "../_reward-utils.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_STARS = 50;
const VIP_STARS = 100;
const BASE_XP = 500;

function getLastClaimMs(player) {
  const value = player?.last_daily_claim_at || player?.lastDailyClaimAt || player?.daily_claimed_at;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendMethodNotAllowed(res);

  const config = requireServerConfig();
  if (!config.ok) return res.status(500).json({ ok: false, error: config.error });

  const { initData, userId: clientUserId } = req.body || {};
  const auth = verifyTelegramInitData(initData, clientUserId);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  try {
    const { player, idColumn } = await findPlayerByTelegramId(auth.userId);

    if (!player) {
      return res.status(404).json({
        ok: false,
        error: "PLAYER_NOT_FOUND",
        message: "Player must be authenticated before claiming Daily Drop."
      });
    }

    const now = Date.now();
    const lastClaimMs = getLastClaimMs(player);
    const nextClaimAtMs = lastClaimMs + DAY_MS;

    if (lastClaimMs && nextClaimAtMs > now) {
      const nextClaimAt = new Date(nextClaimAtMs).toISOString();
      return res.status(429).json({
        ok: false,
        error: "DAILY_DROP_ALREADY_CLAIMED",
        nextClaimAt,
        secondsLeft: secondsUntil(nextClaimAt)
      });
    }

    const vipActive = isVipActive(player);
    const gainedStars = vipActive ? VIP_STARS : BASE_STARS;
    const gainedXp = vipActive ? Math.floor(BASE_XP * 1.25) : BASE_XP;
    const xpPatch = addXpToPlayer(player, gainedXp);
    const currentStars = Math.max(0, toNumber(player.stars ?? player.coins, 0));
    const newStars = currentStars + gainedStars;
    const cooldownBoundary = new Date(now - DAY_MS).toISOString();
    const claimedAt = new Date(now).toISOString();
    const nextClaimAt = new Date(now + DAY_MS).toISOString();

    const patch = {
      stars: newStars,
      coins: newStars,
      xp: xpPatch.xp,
      level: xpPatch.level,
      max_xp: xpPatch.max_xp,
      maxXp: xpPatch.maxXp,
      last_daily_claim_at: claimedAt
    };

    const updatedPlayer = await updatePlayerByColumn({
      idColumn,
      userId: auth.userId,
      patch,
      eligibilityOr: `last_daily_claim_at.is.null,last_daily_claim_at.lt.${cooldownBoundary}`
    });

    if (!updatedPlayer) {
      return res.status(409).json({
        ok: false,
        error: "DAILY_DROP_ALREADY_CLAIMED",
        nextClaimAt,
        secondsLeft: secondsUntil(nextClaimAt)
      });
    }

    return res.status(200).json({
      ok: true,
      reward: { stars: gainedStars, xp: gainedXp },
      nextClaimAt,
      player: buildPublicPlayer(updatedPlayer)
    });
  } catch (error) {
    console.error("Daily Drop claim error:", error?.data || error?.message || error);
    return res.status(500).json({ ok: false, error: "DAILY_DROP_CLAIM_FAILED" });
  }
}
