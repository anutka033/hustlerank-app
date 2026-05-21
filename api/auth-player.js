export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true
    });
  }

  try {
    const { initData, player } = req.body || {};

    if (!initData) {
      return res.status(400).json({
        error: "No initData"
      });
    }

    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");

    if (!userRaw) {
      return res.status(400).json({
        error: "No user"
      });
    }

    const user = JSON.parse(userRaw);
    const telegramId = String(user.id);

    const getPlayerRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/players?username=eq.${telegramId}&select=*`,
      {
        method: "GET",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    const existingPlayers = await getPlayerRes.json();
    const existingPlayer = existingPlayers[0] || null;

    let payload;

    if (existingPlayer) {
      payload = {
        username: telegramId
      };

      if (player) {
        if (player.level !== undefined) payload.level = Number(player.level) || 1;
        if (player.xp !== undefined) payload.xp = Number(player.xp) || 0;
        if (player.coins !== undefined) payload.coins = Number(player.coins) || 0;
        if (player.gems !== undefined) payload.gems = Number(player.gems) || 0;
      }
    } else {
      payload = {
        username: telegramId,
        level: Number(player?.level) || 1,
        xp: Number(player?.xp) || 0,
        coins: Number(player?.coins) || 0,
        gems: Number(player?.gems) || 0
      };
    }

    const saveRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/players?on_conflict=username`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation"
        },
        body: JSON.stringify(payload)
      }
    );

    const saveText = await saveRes.text();

    if (!saveRes.ok) {
      return res.status(500).json({
        error: saveText
      });
    }

    const savedPlayer = saveText ? JSON.parse(saveText)[0] : null;

    return res.status(200).json({
      success: true,
      player: savedPlayer || existingPlayer
    });

  } catch (error) {
    return res.status(500).json({
      error: String(error)
    });
  }
}