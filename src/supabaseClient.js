// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// あなたのキーを設定
const supabaseUrl = 'https://tyojqejahwmlsiafhcea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5b2pxZWphaHdtbHNpYWZoY2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTIxMzEsImV4cCI6MjA4MzcyODEzMX0.Hv0FN4GAZ3Id3RMx1igiKNvaEU5XzVhG1xJGqPLQo4g';

// ここで1回だけ作成して、みんなに貸し出す(export)
export const supabase = createClient(supabaseUrl, supabaseKey);