import {
  buildPublicPlayer,
  requireServerConfig,
  sendMethodNotAllowed,
  supabaseRequest,
  toNumber,
  updatePlayerByColumn,
  verifyTelegramInitData
} from "./_reward-utils.js";

function cleanDisplayName(user, fallback = "") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || fallback;
  return String(name).slice(0, 80);
}

function buildPlayerPatch(player = {}, user = {}) {
  const patch = {
    username: String(user.id),
    display_name: cleanDisplayName(user, player.display_name)
  };

  if (player.level !== undefined) patch.level = Math.max(1, toNumber(player.level, 1));
  if (player.xp !== undefined) patch.xp = Math.max(0, toNumber(player.xp, 0));
  if (player.max_xp !== undefined || player.maxXp !== undefined) {
    const maxXp = Math.max(100, toNumber(player.max_xp ?? player.maxXp, 100));
    patch.max_xp = maxXp;
    patch.maxXp = maxXp;
  }
  if (player.stars !== undefined || player.coins !== undefined) {
    const stars = Math.max(0, toNumber(player.stars ?? player.coins, 0));
    patch.stars = stars;
    patch.coins = stars;
  }
  if (player.crystals !== undefined || player.gems !== undefined) {
    const crystals = Math.max(0, toNumber(player.crystals ?? player.gems, 0));
    patch.crystals = crystals;
    patch.gems = crystals;
  }
  if (player.vip !== undefined) patch.vip = Boolean(player.vip);
  if (player.vip_until !== undefined || player.vipUntil !== undefined) {
    const vipUntil = Math.max(0, toNumber(player.vip_until ?? player.vipUntil, 0));
    patch.vip_until = vipUntil;
    patch.vipUntil = vipUntil;
  }
  if (player.star_farm && typeof player.star_farm === "object") patch.star_farm = player.star_farm;
  if (player.farm_level !== undefined) patch.farm_level = Math.max(1, toNumber(player.farm_level, 1));
  if (player.farm_energy !== undefined) patch.farm_energy = Math.max(0, toNumber(player.farm_energy, 0));
  if (player.farm_dust !== undefined) patch.farm_dust = Math.max(0, toNumber(player.farm_dust, 0));
  if (player.farm_planet_rarity !== undefined) patch.farm_planet_rarity = Math.max(1, toNumber(player.farm_planet_rarity, 1));
  if (player.farm_total_energy !== undefined) patch.farm_total_energy = Math.max(0, toNumber(player.farm_total_energy, 0));

  return patch;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendMethodNotAllowed(res);

  const config = requireServerConfig();
  if (!config.ok) return res.status(500).json({ ok: false, error: config.error });

  const { initData, player } = req.body || {};
  const auth = verifyTelegramInitData(initData);
  if (!auth.ok) return res.status(401).json({ ok: false, error: auth.error });

  try {
    const telegramId = String(auth.userId);
    const rows = await supabaseRequest(`players?select=*&username=eq.${encodeURIComponent(telegramId)}&limit=1`, {
      method: "GET"
    });
    const existingPlayer = Array.isArray(rows) ? rows[0] || null : null;

    if (existingPlayer) {
      const patch = buildPlayerPatch(player || {}, auth.user);
      const updatedPlayer = await updatePlayerByColumn({
        idColumn: "username",
        userId: telegramId,
        patch
      });
      return res.status(200).json({ ok: true, success: true, player: buildPublicPlayer(updatedPlayer || existingPlayer) });
    }

    const insertPayload = {
      username: telegramId,
      level: Math.max(1, toNumber(player?.level, 1)),
      xp: Math.max(0, toNumber(player?.xp, 0)),
      coins: Math.max(0, toNumber(player?.coins ?? player?.stars, 0)),
      gems: Math.max(0, toNumber(player?.gems ?? player?.crystals, 0)),
      display_name: cleanDisplayName(auth.user, telegramId)
    };

    const inserted = await supabaseRequest("players?select=*", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(insertPayload)
    });

    return res.status(200).json({
      ok: true,
      success: true,
      player: buildPublicPlayer(Array.isArray(inserted) ? inserted[0] : inserted)
    });
  } catch (error) {
    console.error("Auth player error:", error?.data || error?.message || error);
    return res.status(500).json({ ok: false, error: "AUTH_PLAYER_FAILED" });
  }
}
