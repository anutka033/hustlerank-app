import {
  addXpToPlayer,
  buildPublicPlayer,
  findPlayerByTelegramId,
  requireServerConfig,
  sendMethodNotAllowed,
  supabaseRequest,
  toNumber,
  updatePlayerByColumn,
  verifyTelegramInitData
} from "../_reward-utils.js";

const TASK_REWARDS = {
  tg_channel: { xp: 500, crystals: 20, stars: 0 },
  daily_checkin: { xp: 200, crystals: 5, stars: 1 },
  card_collector: { xp: 1000, crystals: 50, stars: 5 },
  invite_friends: { xp: 1500, crystals: 100, stars: 10 }
};

function cleanTaskId(value) {
  return String(value || "").trim().replace(/[^a-z0-9_\-]/gi, "").slice(0, 64);
}

function encodeFilterValue(value) {
  return encodeURIComponent(String(value));
}

async function insertTaskClaim(userId, taskId, reward) {
  try {
    const rows = await supabaseRequest("player_task_claims?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        player_id: String(userId),
        task_id: taskId,
        reward_xp: reward.xp || 0,
        reward_crystals: reward.crystals || 0,
        reward_stars: reward.stars || 0
      })
    });

    return Array.isArray(rows) ? rows[0] || null : null;
  } catch (error) {
    if (error?.status === 409 || String(error?.message || "").includes("duplicate key")) {
      const duplicate = new Error("TASK_ALREADY_CLAIMED");
      duplicate.status = 409;
      throw duplicate;
    }
    throw error;
  }
}

async function rollbackTaskClaim(userId, taskId) {
  try {
    await supabaseRequest(
      `player_task_claims?player_id=eq.${encodeFilterValue(userId)}&task_id=eq.${encodeFilterValue(taskId)}`,
      { method: "DELETE" }
    );
  } catch (error) {
    console.warn("Task claim rollback failed:", error?.data || error?.message || error);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendMethodNotAllowed(res);

  const config = requireServerConfig();
  if (!config.ok) return res.status(500).json({ ok: false, error: config.error });

  const { initData, userId: clientUserId, taskId: rawTaskId } = req.body || {};
  const taskId = cleanTaskId(rawTaskId);
  const reward = TASK_REWARDS[taskId];

  if (!reward) {
    return res.status(400).json({ ok: false, error: "UNKNOWN_TASK" });
  }

  const auth = verifyTelegramInitData(initData, clientUserId);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  try {
    const { player, idColumn } = await findPlayerByTelegramId(auth.userId);

    if (!player) {
      return res.status(404).json({
        ok: false,
        error: "PLAYER_NOT_FOUND",
        message: "Player must be authenticated before claiming task reward."
      });
    }

    await insertTaskClaim(auth.userId, taskId, reward);

    const xpPatch = addXpToPlayer(player, reward.xp || 0);
    const currentStars = Math.max(0, toNumber(player.stars ?? player.coins, 0));
    const currentCrystals = Math.max(0, toNumber(player.crystals ?? player.gems, 0));
    const newStars = currentStars + Math.max(0, toNumber(reward.stars, 0));
    const newCrystals = currentCrystals + Math.max(0, toNumber(reward.crystals, 0));

    const patch = {
      stars: newStars,
      coins: newStars,
      crystals: newCrystals,
      gems: newCrystals,
      xp: xpPatch.xp,
      level: xpPatch.level,
      max_xp: xpPatch.max_xp,
      maxXp: xpPatch.maxXp
    };

    let updatedPlayer = null;
    try {
      updatedPlayer = await updatePlayerByColumn({
        idColumn,
        userId: auth.userId,
        patch
      });
    } catch (error) {
      await rollbackTaskClaim(auth.userId, taskId);
      throw error;
    }

    if (!updatedPlayer) {
      await rollbackTaskClaim(auth.userId, taskId);
      return res.status(404).json({ ok: false, error: "PLAYER_NOT_FOUND" });
    }

    return res.status(200).json({
      ok: true,
      taskId,
      reward,
      player: buildPublicPlayer(updatedPlayer)
    });
  } catch (error) {
    if (error?.status === 409 || error?.message === "TASK_ALREADY_CLAIMED") {
      return res.status(409).json({ ok: false, error: "TASK_ALREADY_CLAIMED", taskId });
    }

    console.error("Task claim error:", error?.data || error?.message || error);
    return res.status(500).json({ ok: false, error: "TASK_CLAIM_FAILED" });
  }
}
