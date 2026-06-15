import {
  findPlayerByTelegramId,
  requireServerConfig,
  toNumber,
  updatePlayerByColumn
} from "./_reward-utils.js";

async function telegramRequest(method, payload) {
  const token = process.env.BOT_TOKEN;
  if (!token) return null;
  return fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function parsePayload(rawPayload) {
  try {
    const payload = JSON.parse(rawPayload || "{}");
    return {
      playerId: payload.playerId ? String(payload.playerId) : "",
      starsAmount: Math.max(0, Math.floor(toNumber(payload.starsAmount, 0)))
    };
  } catch (error) {
    return { playerId: "", starsAmount: 0 };
  }
}

export default async function handler(req, res) {
  const update = req.body || {};

  if (update.pre_checkout_query) {
    await telegramRequest("answerPreCheckoutQuery", {
      pre_checkout_query_id: update.pre_checkout_query.id,
      ok: true
    });
    return res.status(200).send("ok");
  }

  if (update.message?.successful_payment) {
    const config = requireServerConfig();
    const chatId = update.message.chat.id;
    const { playerId, starsAmount } = parsePayload(update.message.successful_payment.invoice_payload);

    if (config.ok && playerId && starsAmount > 0) {
      try {
        const { player, idColumn } = await findPlayerByTelegramId(playerId);
        if (player) {
          const currentStars = Math.max(0, toNumber(player.stars ?? player.coins, 0));
          const newStars = currentStars + starsAmount;
          await updatePlayerByColumn({
            idColumn,
            userId: playerId,
            patch: {
              stars: newStars,
              coins: newStars
            }
          });
        }
      } catch (error) {
        console.error("Payment credit error:", error?.data || error?.message || error);
      }
    }

    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: starsAmount > 0
        ? `⭐ Оплата прошла успешно. Начислено ${starsAmount} игровых звёзд.`
        : "⭐ Оплата прошла успешно."
    });

    return res.status(200).send("payment received");
  }

  return res.status(200).send("ok");
}
