import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(200).json({
      ok: true
    });
  }

  try {

    const { initData } = req.body || {};

    if (!initData) {
      return res.status(400).json({
        error: "No initData"
      });
    }

    const params = new URLSearchParams(initData);

    const userRaw = params.get("user");

    if (!userRaw) {
      return res.status(400).json({
        error: "No user"
      });
    }

    const user = JSON.parse(userRaw);

    const telegramId = String(user.id);

    const { data, error } = await supabase
      .from("players")
      .upsert(
        {
          username: telegramId,
          level: 1,
          xp: 0
        },
        {
          onConflict: "username"
        }
      );

    if (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (e) {

    console.error(e);

    return res.status(500).json({
      error: String(e)
    });
  }
}