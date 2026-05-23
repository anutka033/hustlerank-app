import crypto from "crypto";

export const SUPABASE_URL = (process.env.SUPABASE_URL || "https://yxwsgvsejgmzocgnuukn.supabase.co").replace(/\/$/, "");
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
export const BOT_TOKEN = process.env.BOT_TOKEN;

const PLAYER_ID_COLUMNS = ["username"];

export function sendMethodNotAllowed(res) {
  res.setHeader("Allow", "POST");
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}

export function parseInitData(initData) {
  const params = new URLSearchParams(initData || "");
  const userRaw = params.get("user");
  let user = null;

  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch (error) {
      user = null;
    }
  }

  return {
    params,
    hash: params.get("hash") || "",
    user,
    userId: user?.id ? String(user.id) : ""
  };
}

export function verifyTelegramInitData(initData, expectedUserId = "") {
  if (!BOT_TOKEN) {
    return { ok: false, error: "BOT_TOKEN is not configured" };
  }

  if (!initData) {
    return { ok: false, error: "Telegram initData is required" };
  }

  const parsed = parseInitData(initData);

  if (!parsed.hash || !parsed.userId) {
    return { ok: false, error: "Invalid Telegram initData" };
  }

  if (expectedUserId && String(expectedUserId) !== parsed.userId) {
    return { ok: false, error: "Telegram user mismatch" };
  }

  const pairs = [];
  for (const [key, value] of parsed.params.entries()) {
    if (key !== "hash") pairs.push(`${key}=${value}`);
  }
  pairs.sort();

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const expectedHash = crypto.createHmac("sha256", secretKey).update(pairs.join("\n")).digest("hex");

  try {
    const actual = Buffer.from(parsed.hash, "hex");
    const expected = Buffer.from(expectedHash, "hex");

    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      return { ok: false, error: "Invalid Telegram signature" };
    }
  } catch (error) {
    return { ok: false, error: "Invalid Telegram signature" };
  }

  return { ok: true, userId: parsed.userId, user: parsed.user };
}

export function requireServerConfig() {
  if (!SUPABASE_SERVICE_KEY) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured" };
  }

  if (!BOT_TOKEN) {
    return { ok: false, error: "BOT_TOKEN is not configured" };
  }

  return { ok: true };
}

export async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  if (!response.ok) {
    const message = typeof data === "object" && data ? data.message || data.details || data.hint : text;
    const error = new Error(message || `Supabase request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function isVipActive(player) {
  const vip = player?.vip === true || player?.vip === "true";
  const vipUntil = toNumber(player?.vip_until ?? player?.vipUntil, 0);
  return vip && (!vipUntil || vipUntil > Date.now());
}

export function addXpToPlayer(player, amount) {
  let xp = Math.max(0, toNumber(player?.xp, 0) + Math.max(0, toNumber(amount, 0)));
  let level = Math.max(1, toNumber(player?.level, 1));
  let maxXp = Math.max(100, toNumber(player?.max_xp ?? player?.maxXp, 100));

  while (maxXp > 0 && xp >= maxXp) {
    xp -= maxXp;
    level += 1;
    maxXp = Math.floor(maxXp * 2);
    if (!maxXp || maxXp < 1) maxXp = 100;
  }

  return { xp, level, max_xp: maxXp, maxXp };
}

export async function findPlayerByTelegramId(userId) {
  const encodedUserId = encodeURIComponent(String(userId));
  let lastError = null;

  for (const column of PLAYER_ID_COLUMNS) {
    try {
      const rows = await supabaseRequest(`players?select=*&${column}=eq.${encodedUserId}&limit=1`, {
        method: "GET"
      });

      if (Array.isArray(rows) && rows.length > 0) {
        return { player: rows[0], idColumn: column };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    console.warn("Player lookup warning:", lastError.message || lastError);
  }

  return { player: null, idColumn: "telegram_id" };
}

function encodeFilterValue(value) {
  return encodeURIComponent(String(value));
}

function extractMissingColumn(error) {
  const message = String(error?.message || error?.data?.message || error?.data?.details || "");
  const patterns = [
    /Could not find the ['\"]([A-Za-z0-9_]+)['\"] column/i,
    /['\"]([A-Za-z0-9_]+)['\"] column of ['\"]?players['\"]?/i,
    /(?:column|Column) ['\"]?([A-Za-z0-9_]+)['\"]?/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}


export async function updatePlayerByColumn({ idColumn, userId, patch, eligibilityOr = "" }) {
  const queryParts = [
    `${idColumn}=eq.${encodeFilterValue(userId)}`,
    "select=*"
  ];

  if (eligibilityOr) queryParts.push(`or=${encodeURIComponent(`(${eligibilityOr})`)}`);

  const optionalAliasColumns = new Set(["stars", "coins", "crystals", "gems", "max_xp", "maxXp", "vipUntil"]);

  let currentPatch = { ...patch };

  for (let attempt = 0; attempt < 12; attempt += 1) {

    try {
      const rows = await supabaseRequest(`players?${queryParts.join("&")}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(currentPatch)
      });

      return Array.isArray(rows) ? rows[0] || null : null;
    } catch (error) {
      const missingColumn = extractMissingColumn(error);

      if (missingColumn && optionalAliasColumns.has(missingColumn) && Object.prototype.hasOwnProperty.call(currentPatch, missingColumn)) {
        const nextPatch = { ...currentPatch };
        delete nextPatch[missingColumn];
        currentPatch = nextPatch;
        continue;
      }

      throw error;
    }
  }

  return null;
}

export function buildPublicPlayer(player) {
  if (!player) return null;

  return {
    ...player,
    maxXp: player.maxXp ?? player.max_xp,
    coins: player.coins ?? player.stars,
    gems: player.gems ?? player.crystals,
    vipUntil: player.vipUntil ?? player.vip_until
  };
}

export function secondsUntil(date) {
  const target = new Date(date).getTime();
  if (!Number.isFinite(target)) return 0;
  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
}
