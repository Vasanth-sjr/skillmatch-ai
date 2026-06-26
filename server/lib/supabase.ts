import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
