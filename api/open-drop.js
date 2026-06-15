import {
  buildPublicPlayer,
  findPlayerByTelegramId,
  requireServerConfig,
  sendMethodNotAllowed,
  supabaseRequest,
  toNumber,
  updatePlayerByColumn,
  verifyTelegramInitData
} from "./_reward-utils.js";

const DROP_PRICE = 100;
const COMPENSATION = {
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
  if (roll < 0.55) return randomFrom(CASE_CARDS.slice(0, 3));
  if (roll < 0.80) return randomFrom(CASE_CARDS.slice(3, 6));
  if (roll < 0.93) return CASE_CARDS[6];
  if (roll < 0.985) return CASE_CARDS[7];
  if (roll < 0.998) return CASE_CARDS[8];
  return CASE_CARDS[9];
}

function encodeFilterValue(value) {
  return encodeURIComponent(String(value));
}

async function getExistingCard(userId, cardId) {
  const rows = await supabaseRequest(
    `player_cards?player_username=eq.${encodeFilterValue(userId)}&card_id=eq.${encodeFilterValue(cardId)}&select=*&limit=1`,
    { method: "GET" }
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function insertCard(userId, cardId) {
  await supabaseRequest("player_cards", {
    method: "POST",
    body: JSON.stringify({
      player_username: String(userId),
      card_id: cardId,
      amount: 1
    })
  });
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
    if (!player) return res.status(404).json({ ok: false, error: "PLAYER_NOT_FOUND" });

    const currentStars = Math.max(0, toNumber(player.stars ?? player.coins, 0));
    if (currentStars < DROP_PRICE) {
      return res.status(400).json({ ok: false, error: "NOT_ENOUGH_STARS" });
    }

    const winner = rollCard();
    const duplicate = Boolean(await getExistingCard(auth.userId, winner.id));
    const compensation = duplicate ? COMPENSATION[winner.rarity] || 0 : 0;
    const newStars = currentStars - DROP_PRICE + compensation;

    if (!duplicate) {
      await insertCard(auth.userId, winner.id);
    }

    const updatedPlayer = await updatePlayerByColumn({
      idColumn,
      userId: auth.userId,
      patch: {
        stars: newStars,
        coins: newStars
      }
    });

    if (!updatedPlayer) return res.status(404).json({ ok: false, error: "PLAYER_NOT_FOUND" });

    return res.status(200).json({
      ok: true,
      success: true,
      duplicate,
      compensation,
      cardId: winner.id,
      rarity: winner.rarity,
      stars: newStars,
      coins: newStars,
      player: buildPublicPlayer(updatedPlayer)
    });
  } catch (error) {
    console.error("Open drop error:", error?.data || error?.message || error);
    return res.status(500).json({ ok: false, error: "OPEN_DROP_FAILED" });
  }
}
