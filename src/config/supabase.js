const { createClient } = require("@supabase/supabase-js");
const config = require("./index");

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Initialize Supabase client with anon key for public operations
const supabaseAnon = createClient(config.supabase.url, config.supabase.anonKey);

module.exports = {
  supabase,
  supabaseAnon,
};
