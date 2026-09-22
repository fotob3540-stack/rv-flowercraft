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
        status: "online",
        service: "RV FLOWERCRAFT TIKTOK WORKER"
      });
    }

    if (url.pathname === "/api/check" && request.method === "POST") {
      try {
        const body = await request.json();
        const input = String(body.input || "").trim();

        if (!input) {
          throw new Error("URL TikTok kosong");
        }

        const response = await fetch(input, {
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36",
            "Accept": "text/html"
          }
        });

        const html = await response.text();

        const marker =
          'id="__UNIVERSAL_DATA_FOR_REHYDRATION__"';

        const start = html.indexOf(marker);

        if (start === -1) {
          throw new Error(
            `video data not in page (${html.length} bytes)`
          );
        }

        const contentStart = html.indexOf(">", start);
        const contentEnd = html.indexOf(
          "</script>",
          contentStart
        );

        if (contentStart === -1 || contentEnd === -1) {
          throw new Error("UNIVERSAL DATA tidak lengkap");
        }

        const blob = html.slice(
          contentStart + 1,
          contentEnd
        );

        const data = JSON.parse(blob);

        const detail =
          data?.__DEFAULT_SCOPE__?.["webapp.video-detail"];

        const item = detail?.itemInfo?.itemStruct;

        if (!item) {
          throw new Error("Data video tidak ditemukan");
        }

        const thumbnail =
          item.video?.cover ||
          item.video?.originCover ||
          item.video?.dynamicCover ||
          null;

        return json({
          ok: true,
          thumbnail,
          title: item.desc || "Video TikTok",
          author: item.author?.uniqueId || "",
          id: item.id || "",
          finalUrl: response.url
        });

      } catch (error) {
        return json({
          ok: false,
          error: error.message || "Gagal memeriksa video"
        }, 400);
      }
    }

    if (url.pathname === "/api/download" && request.method === "POST") {
      return json({
        ok: false,
        error: "DOWNLOAD BELUM DIPINDAHKAN"
      }, 501);
    }

    return json({
      error: "not found"
    }, 404);
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}
