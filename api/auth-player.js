import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const { initData } = req.body;

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

    const playerId = String(user.id);

    const { data, error } = await supabase
      .from("players")
      .upsert(
        {
          username: playerId,
          level: 1,
          xp: 0
        },
        {
          onConflict: "username"
        }
      )
      .select()
      .single();

    if (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      player: data
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}