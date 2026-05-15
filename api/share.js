export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.body;

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const BOT_USERNAME = "HustleRank033Bot";

    const referralLink = `https://t.me/${BOT_USERNAME}?startapp=ref_${userId}`;

    const text =
`🔥 Hustle Rank

Играй вместе со мной,
открывай карточки,
выполняй задания
и забирай награды!

👇 Жми кнопку ниже`;

    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/savePreparedInlineMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          result: {
            type: "article",
            id: `ref_${userId}`,
            title: "Hustle Rank",
            description: "Играй, выполняй задания и забирай награды!",
            thumbnail_url: "https://hustlerank-app.vercel.app/images/ref-preview.png",
            input_message_content: {
              message_text: text
            },
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🚀 Запустить",
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
        referralLink
      });
    }

    return res.status(200).json({
      preparedMessageId: result.result.id,
      text,
      referralLink
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}