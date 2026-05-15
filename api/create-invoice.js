export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { starsAmount, priceStars } = req.body;

    const BOT_TOKEN = process.env.BOT_TOKEN;

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: `${starsAmount} игровых звёзд`,
          description: `Покупка ${starsAmount} звёзд в Hustle Rank`,
          payload: JSON.stringify({
            starsAmount
          }),
          currency: "XTR",
          prices: [
            {
              label: `${starsAmount} звёзд`,
              amount: priceStars
            }
          ]
        })
      }
    );

    const result = await response.json();

    if (!result.ok) {
      return res.status(500).json({
        error: result.description
      });
    }

    return res.status(200).json({
      invoiceLink: result.result
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}