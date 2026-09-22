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
        service: "RV FLOWERCRAFT TIKTOK"
      });
    }

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

        const response = await fetch(input, {
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36",
            "Accept":
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.tiktok.com/"
          }
        });

        const html = await response.text();

        const marker =
          'id="__UNIVERSAL_DATA_FOR_REHYDRATION__"';

        const start = html.indexOf(marker);

        if (start === -1) {
          return json({
            ok: false,
            status: response.status,
            finalUrl: response.url,
            length: html.length,
            error: "Data TikTok tidak ditemukan di halaman Worker"
          }, 400);
        }

        const contentStart = html.indexOf(">", start);
        const contentEnd = html.indexOf("</script>", contentStart);

        if (contentStart === -1 || contentEnd === -1) {
          return json({
            ok: false,
            error: "Data TikTok tidak lengkap"
          }, 400);
        }

        const blob = html.slice(
          contentStart + 1,
          contentEnd
        );

        let data;

        try {
          data = JSON.parse(blob);
        } catch {
          return json({
            ok: false,
            error: "Data TikTok gagal dibaca"
          }, 400);
        }

        const detail =
          data?.__DEFAULT_SCOPE__?.["webapp.video-detail"];

        const item =
          detail?.itemInfo?.itemStruct;

        if (!item) {
          return json({
            ok: false,
            error: "Data video tidak ditemukan"
          }, 400);
        }

        const thumbnail =
          item?.video?.cover ||
          item?.video?.originCover ||
          item?.video?.dynamicCover ||
          null;

        return json({
          ok: true,
          status: response.status,
          finalUrl: response.url,
          id: item.id || "",
          title: item.desc || "Video TikTok",
          author: item.author?.uniqueId || "",
          nickname: item.author?.nickname || "",
          thumbnail,
          message: "Data video TikTok berhasil dibaca"
        });

      } catch (error) {
        return json({
          ok: false,
          error: error.message || "Gagal mengakses TikTok"
        }, 500);
      }
    }

    if (url.pathname === "/api/download" && request.method === "POST") {
      return json({
        ok: false,
        error: "Endpoint download belum diaktifkan"
      }, 501);
    }

    return json({
      ok: false,
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
