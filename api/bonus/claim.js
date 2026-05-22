import {
  addXpToPlayer,
  buildPublicPlayer,
  findPlayerByTelegramId,
  requireServerConfig,
  secondsUntil,
  sendMethodNotAllowed,
  toNumber,
  updatePlayerByColumn,
  verifyTelegramInitData
} from "../_reward-utils.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const BONUS_STARS = 1;
const BONUS_XP = 50;

function getLastBonusClaimMs(player) {
  const value = player?.last_bonus_claim_at || player?.lastBonusClaimAt || player?.bonus_claimed_at;
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
        message: "Player must be authenticated before claiming Daily Bonus."
      });
    }

    const now = Date.now();
    const lastClaimMs = getLastBonusClaimMs(player);
    const nextClaimAtMs = lastClaimMs + DAY_MS;

    if (lastClaimMs && nextClaimAtMs > now) {
      const nextClaimAt = new Date(nextClaimAtMs).toISOString();
      return res.status(429).json({
        ok: false,
        error: "DAILY_BONUS_ALREADY_CLAIMED",
        nextClaimAt,
        secondsLeft: secondsUntil(nextClaimAt)
      });
    }

    const xpPatch = addXpToPlayer(player, BONUS_XP);
    const currentStars = Math.max(0, toNumber(player.stars ?? player.coins, 0));
    const newStars = currentStars + BONUS_STARS;
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
      last_bonus_claim_at: claimedAt
    };

    const updatedPlayer = await updatePlayerByColumn({
      idColumn,
      userId: auth.userId,
      patch,
      eligibilityOr: `last_bonus_claim_at.is.null,last_bonus_claim_at.lt.${cooldownBoundary}`
    });

    if (!updatedPlayer) {
      return res.status(409).json({
        ok: false,
        error: "DAILY_BONUS_ALREADY_CLAIMED",
        nextClaimAt,
        secondsLeft: secondsUntil(nextClaimAt)
      });
    }

    return res.status(200).json({
      ok: true,
      reward: { stars: BONUS_STARS, xp: BONUS_XP },
      nextClaimAt,
      player: buildPublicPlayer(updatedPlayer)
    });
  } catch (error) {
    console.error("Daily Bonus claim error:", error?.data || error?.message || error);
    return res.status(500).json({ ok: false, error: "DAILY_BONUS_CLAIM_FAILED" });
  }
}
