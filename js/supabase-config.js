/* =========================================================
   SUPABASE CONFIG

   Uses the project's publishable key (new-style equivalent
   of the legacy "anon" key). Safe to ship in client-side JS
   only because Row Level Security policies are configured on
   every table (see the SQL migration in the project plan).
========================================================= */

const SUPABASE_URL = "https://opdwpgezipwagjflremz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TMqag45be3H-aYDxFz1bAA_V6JqmCH0";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
