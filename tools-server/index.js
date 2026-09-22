const http = require("http");

const PORT = 8787;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });

  res.end(JSON.stringify({
    status: "online",
    service: "RV FLOWERCRAFT TOOLS"
  }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`RV FLOWERCRAFT Tools Server berjalan di port ${PORT}`);
});
