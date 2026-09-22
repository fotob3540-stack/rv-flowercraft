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
              "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
            "Accept":
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
          }
        });

        const html = await response.text();

        const marker = "__UNIVERSAL_DATA_FOR_REHYDRATION__";
        const markerPos = html.indexOf(marker);

        if (markerPos === -1) {
          throw new Error(
            `Data TikTok tidak ditemukan (${html.length} bytes)`
          );
        }

        const scriptStart = html.lastIndexOf(
          "<script",
          markerPos
        );

        const tagEnd = html.indexOf(">", scriptStart);

        const scriptEnd = html.indexOf(
          "</script>",
          tagEnd
        );

        if (
          scriptStart === -1 ||
          tagEnd === -1 ||
          scriptEnd === -1
        ) {
          throw new Error("Script data TikTok tidak lengkap");
        }

        const blob = html.slice(
          tagEnd + 1,
          scriptEnd
        ).trim();

        let data;

        try {
          data = JSON.parse(blob);
        } catch {
          throw new Error(
            "Data TikTok bukan JSON yang valid"
          );
        }

        const detail =
          data?.__DEFAULT_SCOPE__?.[
            "webapp.video-detail"
          ];

        const item =
          detail?.itemInfo?.itemStruct;

        if (!item) {
          throw new Error(
            "Data video tidak ditemukan"
          );
        }

        const thumbnail =
          item.video?.cover ||
          item.video?.originCover ||
          item.video?.dynamicCover ||
          null;

        if (!thumbnail) {
          throw new Error(
            "Thumbnail video tidak tersedia"
          );
        }

        return json({
          ok: true,
          thumbnail,
          title:
            item.desc ||
            "Video TikTok",
          author:
            item.author?.uniqueId ||
            "",
          id:
            item.id ||
            "",
          finalUrl:
            response.url
        });

      } catch (error) {
        return json({
          ok: false,
          error:
            error.message ||
            "Gagal memeriksa video"
        }, 400);
      }
    }

    if (
      url.pathname === "/api/download" &&
      request.method === "POST"
    ) {
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
    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type"
  };
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
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
