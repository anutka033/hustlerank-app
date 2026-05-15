export default async function handler(req, res) {

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { userId } = req.body;

        const BOT_TOKEN =
            process.env.BOT_TOKEN;

        const BOT_USERNAME =
            "HustleRank033Bot";

        const imageUrl =
            "https://hustlerank-app.vercel.app/images/ref-preview.png";

        const referralLink =
`https://t.me/${BOT_USERNAME}?startapp=ref_${userId};`

        const text =
`🔥 Hustle Rank

Играй вместе со мной,
открывай карточки,
выполняй задания
и забирай награды!

👇 Жми кнопку ниже`;

        return res.status(200).json({
            imageUrl,
            text,
            referralLink
        });

    } catch (error) {

        return res.status(500).json({
            error: error.message
        });
    }
}