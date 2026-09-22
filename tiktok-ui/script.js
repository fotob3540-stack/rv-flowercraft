const API =
  "https://rv-flowercraft-tiktok.fotob3540.workers.dev";

const input = document.getElementById("tiktokUrl");
const checkBtn = document.getElementById("checkBtn");
const statusBox = document.getElementById("status");

const result = document.getElementById("result");
const cover = document.getElementById("cover");
const author = document.getElementById("author");
const description = document.getElementById("description");
const duration = document.getElementById("duration");
const resolution = document.getElementById("resolution");
const videoId = document.getElementById("videoId");
const watchBtn = document.getElementById("watchBtn");
const downloadBtn = document.getElementById("downloadBtn");

function setStatus(text) {
  statusBox.textContent = text;
}

function formatDuration(seconds) {
  seconds = Number(seconds || 0);

  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;

  return `${min}:${String(sec).padStart(2, "0")}`;
}

checkBtn.addEventListener("click", async () => {

  const url = input.value.trim();

  if (!url) {
    setStatus("Masukkan link TikTok terlebih dahulu.");
    return;
  }

  checkBtn.disabled = true;
  result.classList.add("hidden");
  setStatus("Mengambil data TikTok...");

  try {

    const response = await fetch(`${API}/api/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: url
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error || "Gagal mengambil data TikTok."
      );
    }

    if (!data.video) {
      throw new Error(
        "Data video tidak ditemukan."
      );
    }

    const video = data.video;

    author.textContent =
      video.author || "Tidak diketahui";

    description.textContent =
      video.desc || "Tidak ada deskripsi";

    duration.textContent =
      formatDuration(video.duration);

    resolution.textContent =
      `${video.width || "-"} × ${video.height || "-"}`;

    videoId.textContent =
      video.id || "-";

    if (video.cover) {
      cover.src = video.cover;
      cover.style.display = "block";
    } else {
      cover.style.display = "none";
    }

    watchBtn.href =
      data.finalUrl || url;

    downloadBtn.disabled = true;

    result.classList.remove("hidden");

    setStatus(
      "Data TikTok berhasil ditemukan."
    );

  } catch (error) {

    console.error(error);

    setStatus(
      error.message || "Terjadi kesalahan."
    );

  } finally {

    checkBtn.disabled = false;
  }
});

input.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    checkBtn.click();
  }
});
