// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// import.meta.env.VITE_〜 を使って .env ファイルから読み込みます
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// ここで1回だけ作成して、みんなに貸し出す(export)
export const supabase = createClient(supabaseUrl, supabaseKey);