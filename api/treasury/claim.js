import {
  buildPublicPlayer,
  findPlayerByTelegramId,
  requireServerConfig,
  secondsUntil,
  sendMethodNotAllowed,
  toNumber,
  updatePlayerByColumn,
  verifyTelegramInitData
} from "../_reward-utils.js";

const TREASURY_PER_HOUR = 60;
const TREASURY_MAX = 100;
const HOUR_MS = 60 * 60 * 1000;
const MS_PER_CRYSTAL = HOUR_MS / TREASURY_PER_HOUR;

function getLastTreasuryClaimMs(player) {
  const value = player?.last_treasury_claim_at || player?.lastTreasuryClaimAt;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getTreasuryAmount(lastClaimMs, now) {
  if (!lastClaimMs) return TREASURY_MAX;

  const elapsedMs = Math.max(0, now - lastClaimMs);
  const amount = Math.floor(elapsedMs / MS_PER_CRYSTAL);
  return Math.max(0, Math.min(TREASURY_MAX, amount));
}

function getNextCrystalAt(lastClaimMs, now) {
  if (!lastClaimMs) return new Date(now).toISOString();

  const elapsedMs = Math.max(0, now - lastClaimMs);
  const remainderMs = elapsedMs % MS_PER_CRYSTAL;
  const waitMs = remainderMs === 0 ? MS_PER_CRYSTAL : MS_PER_CRYSTAL - remainderMs;
  return new Date(now + waitMs).toISOString();
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
        message: "Player must be authenticated before claiming Treasury."
      });
    }

    const now = Date.now();
    const lastClaimMs = getLastTreasuryClaimMs(player);
    const rewardCrystals = getTreasuryAmount(lastClaimMs, now);

    if (rewardCrystals <= 0) {
      const nextClaimAt = getNextCrystalAt(lastClaimMs, now);
      return res.status(429).json({
        ok: false,
        error: "TREASURY_NOT_READY",
        nextClaimAt,
        secondsLeft: secondsUntil(nextClaimAt),
        reward: { crystals: 0 }
      });
    }

    const currentCrystals = Math.max(0, toNumber(player.crystals ?? player.gems, 0));
    const newCrystals = currentCrystals + rewardCrystals;
    const claimedAt = new Date(now).toISOString();
    const nextClaimAt = new Date(now + MS_PER_CRYSTAL).toISOString();
    const fullAt = new Date(now + TREASURY_MAX * MS_PER_CRYSTAL).toISOString();

    const patch = {
      crystals: newCrystals,
      gems: newCrystals,
      last_treasury_claim_at: claimedAt
    };

    const eligibilityOr = lastClaimMs
      ? `last_treasury_claim_at.eq.${new Date(lastClaimMs).toISOString()}`
      : "last_treasury_claim_at.is.null";

    const updatedPlayer = await updatePlayerByColumn({
      idColumn,
      userId: auth.userId,
      patch,
      eligibilityOr
    });

    if (!updatedPlayer) {
      return res.status(409).json({
        ok: false,
        error: "TREASURY_ALREADY_CLAIMED",
        nextClaimAt,
        secondsLeft: secondsUntil(nextClaimAt),
        reward: { crystals: 0 }
      });
    }

    return res.status(200).json({
      ok: true,
      reward: { crystals: rewardCrystals },
      treasury: {
        perHour: TREASURY_PER_HOUR,
        max: TREASURY_MAX,
        claimedAt,
        nextClaimAt,
        fullAt
      },
      player: buildPublicPlayer(updatedPlayer)
    });
  } catch (error) {
    console.error("Treasury claim error:", error?.data || error?.message || error);
    return res.status(500).json({ ok: false, error: "TREASURY_CLAIM_FAILED" });
  }
}
