/* =========================================================
   SUPABASE CONFIG

   TODO: replace SUPABASE_URL and SUPABASE_ANON_KEY below with
   your real Supabase project values (Project Settings → API).
   The anon key is a PUBLIC key by design — it is safe to ship
   in client-side JS only because Row Level Security policies
   are configured on every table (see the SQL migration in the
   project plan / README).
========================================================= */

const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co"; // TODO: replace with your Supabase project URL
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";          // TODO: replace with your Supabase anon/public API key

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
