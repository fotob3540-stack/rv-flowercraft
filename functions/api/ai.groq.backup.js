export async function onRequestPost(context) {
  try {
    const apiKey = context.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "OPENROUTER_API_KEY belum dipasang."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const body = await context.request.json();

    const messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    const safeMessages = messages
      .filter(m =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
      )
      .slice(-8)
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 2500)
      }));

    if (!safeMessages.length) {
      return new Response(
        JSON.stringify({
          error: "Pesan kosong."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const systemPrompt = `
Kamu adalah SkyBot, asisten virtual RV FLOWERCRAFT.

Jawab dalam Bahasa Indonesia.
Jawaban harus singkat, jelas, ramah, dan langsung ke inti.
Biasanya cukup 1 sampai 4 kalimat.

Kamu membantu pengunjung tentang:
- RV FLOWERCRAFT
- buket dan bunga
- katalog
- cara pemesanan
- informasi toko

Jangan mengarang harga, stok, produk, atau informasi toko.
Jika tidak tahu, katakan bahwa informasi tersebut belum tersedia.

Data toko:
Nama: RV FLOWERCRAFT
Alamat: Peranap, Pandan Wangi
Jam buka: Setiap hari
Instagram: @rv flowercraft
WhatsApp: +6285119984813
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": context.request.url,
          "X-Title": "RV FLOWERCRAFT SkyBot"
        },

        body: JSON.stringify({
          model: "openrouter/free",

          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            ...safeMessages
          ],

          temperature: 0.2,

          max_tokens: 300
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);

      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "OpenRouter gagal memberikan jawaban."
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    let answer =
      data?.choices?.[0]?.message?.content;

    /*
     * Beberapa model OpenRouter gratis bisa menghabiskan
     * token untuk reasoning. Kalau content kosong,
     * berikan pesan yang jelas daripada membuat frontend
     * mengira koneksi gagal.
     */

    if (!answer || !String(answer).trim()) {

      console.error(
        "SkyBot kosong:",
        JSON.stringify(data)
      );

      return new Response(
        JSON.stringify({
          error:
            "Model AI tidak mengembalikan jawaban teks. Coba kirim pesan lagi."
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    answer = String(answer).trim();

    return new Response(
      JSON.stringify({
        answer
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {

    console.error("SkyBot error:", error);

    return new Response(
      JSON.stringify({
        error:
          "SkyBot sedang tidak dapat terhubung ke layanan AI."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
