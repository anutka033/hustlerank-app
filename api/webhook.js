export default async function handler(req, res) {
  const BOT_TOKEN = process.env.BOT_TOKEN;

  const update = req.body;

  if (update.pre_checkout_query) {
    const queryId = update.pre_checkout_query.id;

    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pre_checkout_query_id: queryId,
          ok: true,
        }),
      }
    );

    return res.status(200).send("ok");
  }

  if (update.message?.successful_payment) {
    const payload = JSON.parse(
  update.message.successful_payment.invoice_payload
);

const starsAmount = payload.starsAmount;

console.log("Успешная покупка:", starsAmount);
    const chatId = update.message.chat.id;

    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: "⭐ Оплата прошла успешно! Звёзды начислены.",
        }),
      }
    );

    return res.status(200).send("payment received");
  }

  return res.status(200).send("ok");
}