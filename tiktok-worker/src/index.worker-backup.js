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
          return json({ ok: false, error: "URL TikTok kosong" }, 400);
        }

        const response = await fetch(input, {
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html"
          }
        });

        const html = await response.text();

        return json({
          ok: true,
          status: response.status,
          finalUrl: response.url,
          length: html.length,
          message: "TikTok berhasil diakses dari Worker"
        });
      } catch (error) {
        return json({
          ok: false,
          error: error.message || "Gagal mengakses TikTok"
        }, 500);
      }
    }

    return json({ ok: false, error: "not found" }, 404);
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
