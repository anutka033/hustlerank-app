export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.body;

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const BOT_USERNAME = "HustleRank033Bot";
    const APP_URL = "https://hustlerank-app.vercel.app";

    const referralLink = `https://t.me/${BOT_USERNAME}?startapp=ref_${userId}`;

    const text =
`🔥 HustleRank — заходь у гру разом зі мною!

Відкривай картки, виконуй завдання, прокачуй рівень і забирай бонуси.
Запрошуй друзів, збирай нагороди та піднімайся вище у рейтингу.

👇 Натискай нижче та стартуй зі мною`;

    const imageUrl = `${APP_URL}/images/friends-banner.png`;

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/savePreparedInlineMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: Number(userId ),
          result: {
            type: "photo",
            id: `ref_${userId}_${Date.now()}`,
            photo_url: imageUrl,
            thumbnail_url: imageUrl,
            title: "HustleRank",
            description: "Відкривай картки, виконуй завдання та забирай бонуси разом із друзями!",
            caption: text,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🚀 Відкрити HustleRank",
                    url: referralLink
                  }
                ]
              ]
            }
          },
          allow_user_chats: true,
          allow_bot_chats: true,
          allow_group_chats: true,
          allow_channel_chats: true
        })
      }
    );

    const result = await response.json();

    if (!result.ok) {
      return res.status(500).json({
        error: result.description,
        fallback: true,
        text,
        referralLink,
        imageUrl
      });
    }

    return res.status(200).json({
      preparedMessageId: result.result.id,
      text,
      referralLink,
      imageUrl
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
