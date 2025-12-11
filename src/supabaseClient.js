import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://wjvqkejtkloolvxrkfyb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdnFrZWp0a2xvb2x2eHJrZnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NzUxMjIsImV4cCI6MjA3MDQ1MTEyMn0.HKGc2V3EhiUz8s447cEA-pNK7CwvviKAfCp0-9V6K0I"
);

// Expor globalmente para testes no console
window.supabase = supabase;