export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const { initData } = req.body || {};
    if (!initData) return res.status(400).json({ error: "No initData" });
const player = req.body?.player || null;
    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");
    if (!userRaw) return res.status(400).json({ error: "No user" });

    const user = JSON.parse(userRaw);
    const telegramId = String(user.id);

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/players?on_conflict=username`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation"
        },
       body: JSON.stringify({
  username: telegramId,
  level: player?.level ?? 1,
  xp: player?.xp ?? 0,
  coins: player?.coins ?? 0,
  gems: player?.gems ?? 0
})
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return res.status(500).json({
        error: text
      });
    }

    return res.status(200).json({
      success: true,
      player: text ? JSON.parse(text)[0] : null
    });

  } catch (e) {
    return res.status(500).json({
      error: String(e)
    });
  }
}