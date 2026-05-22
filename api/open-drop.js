const DROP_PRICES = {
  common: 10,
  rare: 25,
  epic: 60,
  legendary: 150,
  mythic: 400,
  limited: 1000
};

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

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function rollCard() {
  const roll = Math.random();

  if (roll < 0.55) {
    return randomFrom([
      CASE_CARDS[0],
      CASE_CARDS[1],
      CASE_CARDS[2]
    ]);
  }

  if (roll < 0.80) {
    return randomFrom([
      CASE_CARDS[3],
      CASE_CARDS[4],
      CASE_CARDS[5]
    ]);
  }

  if (roll < 0.93) {
    return CASE_CARDS[6];
  }

  if (roll < 0.985) {
    return CASE_CARDS[7];
  }

  if (roll < 0.998) {
    return CASE_CARDS[8];
  }

  return CASE_CARDS[9];
}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true
    });
  }

  try {

    const { initData } = req.body || {};

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
      return res.status(404).json({
        error: "Player not found"
      });
    }

    const dropPrice = 100;

    if ((player.coins || 0) < dropPrice) {
      return res.status(400).json({
        error: "Not enough coins"
      });
    }

    const winner = rollCard();

    const cardsRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/player_cards?player_username=eq.${telegramId}&card_id=eq.${winner.id}&select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    const existingCards = await cardsRes.json();

    const duplicate = existingCards.length > 0;

    let newCoins = Number(player.coins || 0) - dropPrice;

    let compensation = 0;

    if (duplicate) {

      compensation = DROP_PRICES[winner.rarity] || 0;

      newCoins += compensation;

    } else {

      await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/player_cards`,
        {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            player_username: telegramId,
            card_id: winner.id,
            amount: 1
          })
        }
      );

    }

    const updateRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/players?username=eq.${telegramId}`,
      {
        method: "PATCH",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json"
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
      duplicate,
      compensation,
      cardId: winner.id,
      rarity: winner.rarity,
      coins: newCoins
    });

  } catch (e) {

    return res.status(500).json({
      error: String(e)
    });

  }
}