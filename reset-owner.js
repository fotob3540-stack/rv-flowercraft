const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://ftnarupbhwxzaitfzczq.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("SERVICE_ROLE_KEY belum diset.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await supabase.auth.admin.updateUserById(
    "cd341ed2-476d-4bff-9d5a-c7df7cf9659c",
    { password: "admin1234" }
  );

  if (error) {
    console.error("GAGAL:", error.message);
    process.exit(1);
  }

  console.log("BERHASIL: password owner sudah diubah.");
})();
