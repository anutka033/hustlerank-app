const STAR_PACKS = new Map([
  [150, 5],
  [500, 15],
  [1200, 30],
  [3500, 80],
  [12000, 250],
  [40000, 450]
]);

function cleanPlayerId(value) {
  return String(value || "").replace(/[^\d]/g, "").slice(0, 32);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { playerId, starsAmount } = req.body || {};
    const amount = Math.floor(Number(starsAmount) || 0);
    const priceStars = STAR_PACKS.get(amount);
    const safePlayerId = cleanPlayerId(playerId);

    if (!safePlayerId || !priceStars) {
      return res.status(400).json({ ok: false, error: "INVALID_STAR_PACK" });
    }

    if (!process.env.BOT_TOKEN) {
      return res.status(500).json({ ok: false, error: "BOT_TOKEN is not configured" });
    }

    const response = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/createInvoiceLink`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${amount} игровых звёзд`,
          description: `Покупка ${amount} звёзд в Hustle Rank`,
          payload: JSON.stringify({
            playerId: safePlayerId,
            starsAmount: amount
          }),
          provider_token: "",
          currency: "XTR",
          prices: [{ label: `${amount} звёзд`, amount: priceStars }]
        })
      }
    );

    const result = await response.json();

    if (!result.ok) {
      return res.status(502).json({ ok: false, error: result.description || "TELEGRAM_INVOICE_FAILED" });
    }

    return res.status(200).json({ ok: true, invoiceLink: result.result });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "CREATE_INVOICE_FAILED" });
  }
}
