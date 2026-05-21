const CASE_CARDS = [
  { id: "common01", rarity: "common" },
  { id: "common02", rarity: "common" },
  { id: "common03", rarity: "common" },
  { id: "rare01", rarity: "rare" },
  { id: "rare02", rarity: "rare" },
  { id: "rare03", rarity: "rare" },
  { id: "epic02", rarity: "epic" },
  { id: "legendary01", rarity: "legendary" },
  { id: "mythic01", rarity: "mythic" },
  { id: "limited01", rarity: "limited" }
];

function rollCard() {
  const roll = Math.random();

  if (roll < 0.55) return randomFrom(["common01", "common02", "common03"]);
  if (roll < 0.80) return randomFrom(["rare01", "rare02", "rare03"]);
  if (roll < 0.93) return "epic02";
  if (roll < 0.985) return "legendary01";
  if (roll < 0.998) return "mythic01";

  return "limited01";
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const { initData } = req.body || {};

    if (!initData) {
      return res.status(400).json({ error: "No initData" });
    }

    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");

    if (!userRaw) {
      return res.status(400).json({ error: "No user" });
    }

    const user = JSON.parse(userRaw);
    const telegramId = String(user.id);

    const playerRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/players?username=eq.${telegramId}&select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    const players = await playerRes.json();
    const player = players[0];

    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    const price = 100;

    if ((player.coins || 0) < price) {
      return res.status(400).json({ error: "Not enough coins" });
    }

    const cardId = rollCard();

    const newCoins = Number(player.coins || 0) - price;

    const updateRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/players?username=eq.${telegramId}`,
      {
        method: "PATCH",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          coins: newCoins
        })
      }
    );

    if (!updateRes.ok) {
      return res.status(500).json({
        error: await updateRes.text()
      });
    }

    return res.status(200).json({
      success: true,
      cardId,
      coins: newCoins
    });

  } catch (e) {
    return res.status(500).json({
      error: String(e)
    });
  }
}