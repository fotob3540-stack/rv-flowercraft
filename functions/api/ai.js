export async function onRequestPost(context) {
  try {
    const apiKey = context.env.GROQ_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "GROQ_API_KEY belum dipasang."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
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
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content.slice(0, 3000)
      }));

    if (!safeMessages.length) {
      return new Response(
        JSON.stringify({ error: "Pesan kosong." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const systemPrompt = `
Kamu adalah SkyBot, asisten virtual RV FLOWERCRAFT.

Gunakan Bahasa Indonesia.
Jawab ramah, natural, singkat, dan langsung.
Biasanya cukup 1 sampai 4 kalimat.

Bantu pengguna mengenai:
- RV FLOWERCRAFT
- bunga
- buket
- katalog
- pemesanan
- informasi toko

Jangan mengarang harga, stok, produk, atau informasi toko.
Jika tidak tahu, katakan bahwa informasinya belum tersedia.

Data toko:
Nama: RV FLOWERCRAFT
Alamat: Peranap, Pandan Wangi
Jam buka: Setiap hari
Instagram: @rv flowercraft
WhatsApp: +6285119984813
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            ...safeMessages
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);

      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "Groq gagal memberikan jawaban."
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const answer =
      data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return new Response(
        JSON.stringify({
          error: "Groq tidak mengembalikan jawaban."
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ answer }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {
    console.error("SkyBot Groq:", error);

    return new Response(
      JSON.stringify({
        error: "SkyBot tidak dapat terhubung ke Groq."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
