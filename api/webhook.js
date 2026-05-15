export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const update = req.body;

    const payment = update.message?.successful_payment;

    if (!payment) {
      return res.status(200).json({ ok: true });
    }

    const payload = JSON.parse(payment.invoice_payload);

    console.log("PAID:", payload.playerId, payload.starsAmount);

    return res.status(200).json({ ok: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}