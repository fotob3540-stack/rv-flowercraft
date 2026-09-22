const TIKTOK_UA =
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

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

    if (url.pathname === "/api/check" && request.method === "POST") {
      return handleCheck(request);
    }

    if (url.pathname === "/api/download" && request.method === "POST") {
      return handleDownload(request);
    }

    return json({
      ok: false,
      error: "not found"
    }, 404);
  }
};

async function handleCheck(request) {
  try {
    const body = await request.json();
    const input = String(body.input || "").trim();

    validateTikTokUrl(input);

    const result = await getTikTokData(input);

    return json({
      ok: true,
      status: result.status,
      finalUrl: result.finalUrl,
      length: result.html.length,
      found: !!result.video,
      video: result.video || null,
      message: result.video
        ? "Data video TikTok berhasil ditemukan"
        : "Halaman TikTok berhasil diakses tetapi data video tidak ditemukan"
    });

  } catch (error) {
    return json({
      ok: false,
      error: error.message || "Gagal memproses TikTok"
    }, 400);
  }
}

async function handleDownload(request) {
  try {
    const body = await request.json();
    const input = String(body.input || "").trim();

    validateTikTokUrl(input);

    const result = await getTikTokData(input);

    if (!result.video) {
      return json({
        ok: false,
        error: "Data video TikTok tidak ditemukan"
      }, 404);
    }

    const candidates = [];

    if (result.video.downloadUrl) {
      candidates.push({
        name: "downloadUrl",
        url: result.video.downloadUrl
      });
    }

    if (
      result.video.playUrl &&
      result.video.playUrl !== result.video.downloadUrl
    ) {
      candidates.push({
        name: "playUrl",
        url: result.video.playUrl
      });
    }

    let lastStatus = 0;
    let lastType = "";

    for (const candidate of candidates) {
      try {
        const mediaResponse = await fetch(candidate.url, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent": TIKTOK_UA,
            "Accept": "video/mp4,video/*,*/*;q=0.8",
            "Referer": "https://www.tiktok.com/",
            "Origin": "https://www.tiktok.com",
            "Range": "bytes=0-"
          }
        });

        lastStatus = mediaResponse.status;
        lastType = mediaResponse.headers.get("content-type") || "";

        if (mediaResponse.ok) {
          const headers = new Headers(mediaResponse.headers);

          headers.set(
            "Content-Disposition",
            `attachment; filename="tiktok-${result.video.id}.mp4"`
          );

          headers.set(
            "Content-Type",
            "video/mp4"
          );

          headers.set(
            "Access-Control-Allow-Origin",
            "*"
          );

          return new Response(mediaResponse.body, {
            status: 200,
            headers
          });
        }
      } catch (_) {
        // Coba URL berikutnya.
      }
    }

    return json({
      ok: false,
      error: "CDN TikTok menolak pengambilan MP4",
      upstreamStatus: lastStatus,
      upstreamType: lastType,
      video: {
        id: result.video.id,
        author: result.video.author,
        duration: result.video.duration,
        width: result.video.width,
        height: result.video.height
      },
      message:
        "Metadata berhasil ditemukan, tetapi CDN TikTok menolak proxy download."
    }, 502);

  } catch (error) {
    return json({
      ok: false,
      error: error.message || "Gagal melakukan download"
    }, 400);
  }
}

async function getTikTokData(input) {
  const response = await fetch(input, {
    redirect: "follow",
    headers: {
      "User-Agent": TIKTOK_UA,
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Referer": "https://www.tiktok.com/",
      "Cache-Control": "no-cache"
    }
  });

  const html = await response.text();

  const video = parseTikTokHtml(html, input);

  return {
    status: response.status,
    finalUrl: response.url,
    html,
    video
  };
}

function parseTikTokHtml(html, input) {
  const videoId =
    extractVideoId(input) ||
    matchFirst(
      html,
      /"itemId"\s*:\s*"(\d+)"/
    );

  let data = null;

  const universalMatch = html.match(
    /<script[^>]+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i
  );

  if (universalMatch) {
    try {
      data = JSON.parse(
        decodeHtmlEntities(universalMatch[1])
      );
    } catch (_) {}
  }

  if (!data) {
    const nextMatch = html.match(
      /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
    );

    if (nextMatch) {
      try {
        data = JSON.parse(
          decodeHtmlEntities(nextMatch[1])
        );
      } catch (_) {}
    }
  }

  let item = findVideoObject(data, videoId);

  if (!item) {
    item = findVideoObjectInHtml(html, videoId);
  }

  if (!item && !videoId) {
    return null;
  }

  const id =
    videoId ||
    item?.id ||
    item?.itemId ||
    item?.video?.id ||
    null;

  if (!id) {
    return null;
  }

  const author =
    item?.author?.uniqueId ||
    item?.author?.unique_id ||
    item?.author?.nickname ||
    item?.author ||
    extractAuthor(input) ||
    "";

  const desc =
    item?.desc ||
    item?.description ||
    "";

  const video =
    item?.video ||
    item?.videoInfo ||
    {};

  const duration =
    Number(
      video?.duration ||
      item?.duration ||
      0
    );

  const width =
    Number(
      video?.width ||
      0
    );

  const height =
    Number(
      video?.height ||
      0
    );

  const cover =
    video?.cover ||
    video?.originCover ||
    video?.dynamicCover ||
    "";

  const dynamicCover =
    video?.dynamicCover ||
    "";

  const downloadUrl =
    firstUrl(
      video?.downloadAddr,
      video?.download_addr,
      video?.downloadUrl,
      item?.downloadUrl
    );

  const playUrl =
    firstUrl(
      video?.playAddr,
      video?.play_addr,
      video?.playUrl,
      item?.playUrl
    );

  return {
    id: String(id),
    desc: String(desc || ""),
    author: String(author || ""),
    duration,
    width,
    height,
    cover: String(cover || ""),
    dynamicCover: String(dynamicCover || ""),
    playUrl: playUrl || "",
    downloadUrl: downloadUrl || ""
  };
}

function findVideoObject(data, videoId) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const visited = new Set();

  function walk(value, depth = 0) {
    if (
      !value ||
      typeof value !== "object" ||
      depth > 18
    ) {
      return null;
    }

    if (visited.has(value)) {
      return null;
    }

    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = walk(item, depth + 1);
        if (found) return found;
      }

      return null;
    }

    const id =
      value.id ||
      value.itemId ||
      value.item_id ||
      null;

    const hasVideo =
      value.video ||
      value.videoInfo ||
      value.playAddr ||
      value.play_addr ||
      value.downloadAddr ||
      value.download_addr;

    if (
      id &&
      hasVideo &&
      (!videoId || String(id) === String(videoId))
    ) {
      return value;
    }

    for (const key of Object.keys(value)) {
      const found = walk(
        value[key],
        depth + 1
      );

      if (found) return found;
    }

    return null;
  }

  return walk(data);
}

function findVideoObjectInHtml(html, videoId) {
  if (!html) return null;

  const escapedId = videoId
    ? escapeRegex(videoId)
    : "\\d{10,25}";

  const patterns = [
    new RegExp(
      `"itemStruct"\\s*:\\s*(\\{[\\s\\S]{0,120000}?"id"\\s*:\\s*"${escapedId}"[\\s\\S]{0,120000}?\\})`,
      "i"
    ),
    new RegExp(
      `"itemInfo"\\s*:\\s*(\\{[\\s\\S]{0,120000}?"id"\\s*:\\s*"${escapedId}"[\\s\\S]{0,120000}?\\})`,
      "i"
    )
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (_) {}
    }
  }

  return null;
}

function firstUrl(...values) {
  for (const value of values) {
    if (!value) continue;

    if (typeof value === "string") {
      if (
        value.startsWith("http://") ||
        value.startsWith("https://")
      ) {
        return value;
      }
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = firstUrl(item);

        if (result) return result;
      }
    }

    if (typeof value === "object") {
      const result = firstUrl(
        value.url,
        value.urlList,
        value.url_list
      );

      if (result) return result;
    }
  }

  return "";
}

function extractVideoId(input) {
  const match = String(input).match(
    /\/video\/(\d{10,25})/
  );

  return match ? match[1] : null;
}

function extractAuthor(input) {
  const match = String(input).match(
    /tiktok\.com\/@([^/]+)/i
  );

  return match ? match[1] : "";
}

function matchFirst(text, regex) {
  const match = String(text).match(regex);
  return match ? match[1] : null;
}

function escapeRegex(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function validateTikTokUrl(input) {
  if (!input) {
    throw new Error("URL TikTok kosong");
  }

  let parsed;

  try {
    parsed = new URL(input);
  } catch (_) {
    throw new Error("URL tidak valid");
  }

  const host = parsed.hostname.toLowerCase();

  if (
    host !== "tiktok.com" &&
    !host.endsWith(".tiktok.com")
  ) {
    throw new Error("URL harus berasal dari TikTok");
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type"
  };
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        ...corsHeaders()
      }
    }
  );
}
