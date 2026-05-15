export default async function handler(req, res) {
  const BOT_TOKEN = process.env.BOT_TOKEN;

  const webhookUrl =
    "https://hustlerank-app.vercel.app/api/webhook";

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${webhookUrl}`
  );

  const result = await response.json();

  return res.status(200).json(result);
}