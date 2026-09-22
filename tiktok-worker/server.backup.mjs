import http from "node:http";
import worker from "./src/index.js";

const PORT = 8787;

const server = http.createServer(async (req, res) => {
  try {
    const url = `http://127.0.0.1:${PORT}${req.url}`;

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body = Buffer.concat(chunks);

    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: body.length > 0 ? body : undefined,
    });

    const response = await worker.fetch(request, {}, {});

    res.statusCode = response.status;

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const responseBody = Buffer.from(await response.arrayBuffer());
    res.end(responseBody);

  } catch (err) {
    console.error("SERVER ERROR:", err);

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");

    res.end(JSON.stringify({
      ok: false,
      error: "Local Node server error",
      message: err?.message || String(err)
    }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("================================");
  console.log(" RV FLOWERCRAFT TIKTOK LOCAL");
  console.log("================================");
  console.log(`Server: http://127.0.0.1:${PORT}`);
  console.log("");
  console.log("Endpoints:");
  console.log("POST /api/check");
  console.log("POST /api/download");
  console.log("");
  console.log("Server berjalan...");
  console.log("================================");
});
