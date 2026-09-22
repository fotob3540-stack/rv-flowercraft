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
      return json({
        ok: false,
        error: "CHECK BELUM DIPINDAHKAN"
      }, 501);
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
