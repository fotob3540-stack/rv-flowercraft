export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // =========================
    // HOME
    // =========================
    if (url.pathname === "/") {
      return json({
        ok: true,
        status: "online",
        service: "RV FLOWERCRAFT TIKTOK",
        endpoints: [
          "POST /api/check",
          "POST /api/download"
        ]
      });
    }

    // =========================
    // CHECK TIKTOK
    // =========================
    if (url.pathname === "/api/check" && request.method === "POST") {
      try {
        const body = await request.json();
        const input = String(body.input || "").trim();

        if (!input) {
          return json({
            ok: false,
            error: "URL TikTok kosong"
          }, 400);
        }

        const target = validateTikTokUrl(input);

        if (!target.ok) {
          return json({
            ok: false,
            error: target.error
          }, 400);
        }

        const result = await fetchTikTokPage(target.url);

        if (!result.ok) {
          return json({
            ok: false,
            status: result.status,
            finalUrl: result.finalUrl,
            error: "Gagal mengambil halaman TikTok"
          }, 502);
        }

        const parsed = parseTikTokHTML(result.html);

        return json({
          ok: true,
          status: result.status,
          finalUrl: result.finalUrl,
          length: result.html.length,
          found: parsed.found,
          video: parsed.video,
          message: parsed.found
            ? "Data video TikTok berhasil ditemukan"
            : "TikTok berhasil diakses tetapi data video tidak ditemukan"
        });

      } catch (error) {
        return json({
          ok: false,
          error: error.message || "Gagal memproses TikTok"
        }, 500);
      }
    }

    // =========================
    // DOWNLOAD INFO
    // =========================
    if (url.pathname === "/api/download" && request.method === "POST") {
      try {
        const body = await request.json();
        const input = String(body.input || "").trim();

        if (!input) {
          return json({
            ok: false,
            error: "URL TikTok kosong"
          }, 400);
        }

        const target = validateTikTokUrl(input);

        if (!target.ok) {
          return json({
            ok: false,
            error: target.error
          }, 400);
        }

        const result = await fetchTikTokPage(target.url);

        if (!result.ok) {
          return json({
            ok: false,
            status: result.status,
            error: "Gagal mengambil halaman TikTok"
          }, 502);
        }

        const parsed = parseTikTokHTML(result.html);

        if (!parsed.found) {
          return json({
            ok: false,
            error: "Data video tidak ditemukan di halaman TikTok"
          }, 404);
        }

        return json({
          ok: true,
          type: "video",
          sourceUrl: target.url,
          finalUrl: result.finalUrl,
          video: parsed.video,
          message: "URL media berhasil ditemukan"
        });

      } catch (error) {
        return json({
          ok: false,
          error: error.message || "Gagal mengambil data video"
        }, 500);
      }
    }

    return json({
      ok: false,
      error: "not found"
    }, 404);
  }
};


// ======================================================
// VALIDASI URL
// ======================================================

function validateTikTokUrl(input) {
  try {
    const url = new URL(input);

    if (!["http:", "https:"].includes(url.protocol)) {
      return {
        ok: false,
        error: "Protocol URL tidak valid"
      };
    }

    const hostname = url.hostname.toLowerCase();

    const allowed =
      hostname === "tiktok.com" ||
      hostname.endsWith(".tiktok.com");

    if (!allowed) {
      return {
        ok: false,
        error: "URL harus berasal dari TikTok"
      };
    }

    return {
      ok: true,
      url: url.toString()
    };

  } catch {
    return {
      ok: false,
      error: "URL TikTok tidak valid"
    };
  }
}


// ======================================================
// FETCH HALAMAN TIKTOK
// ======================================================

async function fetchTikTokPage(input) {
  const response = await fetch(input, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36",

      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

      "Accept-Language":
        "en-US,en;q=0.9"
    }
  });

  const html = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    finalUrl: response.url,
    html
  };
}


// ======================================================
// PARSER TIKTOK HTML
// ======================================================

function parseTikTokHTML(html) {
  const documents = [];

  // --------------------------------------------------
  // UNIVERSAL DATA
  // --------------------------------------------------

  const universalMatch = html.match(
    /<script[^>]+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i
  );

  if (universalMatch) {
    const data = safeJSONParse(universalMatch[1]);

    if (data) {
      documents.push(data);
    }
  }

  // --------------------------------------------------
  // SIGI STATE
  // --------------------------------------------------

  const sigiMatch = html.match(
    /<script[^>]+id=["']SIGI_STATE["'][^>]*>([\s\S]*?)<\/script>/i
  );

  if (sigiMatch) {
    const data = safeJSONParse(sigiMatch[1]);

    if (data) {
      documents.push(data);
    }
  }

  // --------------------------------------------------
  // NEXT DATA
  // --------------------------------------------------

  const nextMatch = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );

  if (nextMatch) {
    const data = safeJSONParse(nextMatch[1]);

    if (data) {
      documents.push(data);
    }
  }

  // --------------------------------------------------
  // CARI OBJEK VIDEO
  // --------------------------------------------------

  for (const document of documents) {
    const item = findVideoObject(document);

    if (item) {
      const video = normalizeVideo(item);

      if (video.playUrl || video.downloadUrl || video.cover) {
        return {
          found: true,
          video
        };
      }
    }
  }

  // --------------------------------------------------
  // FALLBACK: CARI playAddr / downloadAddr
  // --------------------------------------------------

  const fallback = extractMediaFromHTML(html);

  if (fallback.playUrl || fallback.downloadUrl) {
    return {
      found: true,
      video: fallback
    };
  }

  return {
    found: false,
    video: null
  };
}


// ======================================================
// CARI ITEM VIDEO SECARA REKURSIF
// ======================================================

function findVideoObject(value, depth = 0) {
  if (depth > 12 || value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  // Kandidat langsung
  if (
    value.video &&
    typeof value.video === "object" &&
    (
      value.video.playAddr ||
      value.video.downloadAddr ||
      value.video.playApi ||
      value.video.downloadApi ||
      value.video.bitrateInfo
    )
  ) {
    return value;
  }

  // itemStruct TikTok
  if (
    value.itemStruct &&
    typeof value.itemStruct === "object" &&
    value.itemStruct.video
  ) {
    return value.itemStruct;
  }

  // Kalau object sendiri punya video
  if (
    value.video &&
    typeof value.video === "object"
  ) {
    const v = value.video;

    if (
      v.playAddr ||
      v.downloadAddr ||
      v.playApi ||
      v.downloadApi ||
      v.bitrateInfo
    ) {
      return value;
    }
  }

  // Rekursif
  for (const key of Object.keys(value)) {
    try {
      const found = findVideoObject(value[key], depth + 1);

      if (found) {
        return found;
      }
    } catch {
      // lanjut
    }
  }

  return null;
}


// ======================================================
// NORMALISASI DATA VIDEO
// ======================================================

function normalizeVideo(item) {
  const video = item.video || {};

  const playUrl =
    firstString([
      video.playAddr,
      video.playApi,
      video.playUrl
    ]);

  const downloadUrl =
    firstString([
      video.downloadAddr,
      video.downloadApi,
      video.downloadUrl
    ]);

  const cover =
    firstString([
      video.cover,
      video.originCover,
      video.dynamicCover
    ]);

  const dynamicCover =
    firstString([
      video.dynamicCover,
      video.cover,
      video.originCover
    ]);

  const duration =
    Number(video.duration || 0);

  const width =
    Number(video.width || 0);

  const height =
    Number(video.height || 0);

  return {
    id: item.id || null,

    desc:
      item.desc ||
      null,

    author:
      item.author?.uniqueId ||
      item.author?.nickname ||
      null,

    duration:
      duration || null,

    width:
      width || null,

    height:
      height || null,

    cover:
      cover || null,

    dynamicCover:
      dynamicCover || null,

    playUrl:
      cleanUrl(playUrl),

    downloadUrl:
      cleanUrl(downloadUrl)
  };
}


// ======================================================
// FALLBACK PARSER
// ======================================================

function extractMediaFromHTML(html) {
  let playUrl = null;
  let downloadUrl = null;
  let cover = null;

  const playPatterns = [
    /"playAddr"\s*:\s*"([^"]+)"/,
    /"playUrl"\s*:\s*"([^"]+)"/,
    /"playApi"\s*:\s*"([^"]+)"/
  ];

  const downloadPatterns = [
    /"downloadAddr"\s*:\s*"([^"]+)"/,
    /"downloadUrl"\s*:\s*"([^"]+)"/,
    /"downloadApi"\s*:\s*"([^"]+)"/
  ];

  const coverPatterns = [
    /"originCover"\s*:\s*"([^"]+)"/,
    /"dynamicCover"\s*:\s*"([^"]+)"/,
    /"cover"\s*:\s*"([^"]+)"/
  ];

  for (const pattern of playPatterns) {
    const match = html.match(pattern);

    if (match) {
      playUrl = decodeEscaped(match[1]);
      break;
    }
  }

  for (const pattern of downloadPatterns) {
    const match = html.match(pattern);

    if (match) {
      downloadUrl = decodeEscaped(match[1]);
      break;
    }
  }

  for (const pattern of coverPatterns) {
    const match = html.match(pattern);

    if (match) {
      cover = decodeEscaped(match[1]);
      break;
    }
  }

  return {
    playUrl: cleanUrl(playUrl),
    downloadUrl: cleanUrl(downloadUrl),
    cover: cleanUrl(cover)
  };
}


// ======================================================
// HELPER
// ======================================================

function safeJSONParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    try {
      return JSON.parse(
        value
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, "&")
      );
    } catch {
      return null;
    }
  }
}


function decodeEscaped(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value
      .replace(/\\u002F/gi, "/")
      .replace(/\\u0026/gi, "&")
      .replace(/\\\//g, "/")
      .replace(/\\"/g, '"');
  }
}


function cleanUrl(value) {
  if (!value) {
    return null;
  }

  const decoded = decodeEscaped(String(value));

  if (!decoded) {
    return null;
  }

  if (
    decoded.startsWith("http://") ||
    decoded.startsWith("https://")
  ) {
    return decoded;
  }

  return null;
}


function firstString(values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}


// ======================================================
// CORS
// ======================================================

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}


// ======================================================
// JSON RESPONSE
// ======================================================

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...corsHeaders()
      }
    }
  );
}
