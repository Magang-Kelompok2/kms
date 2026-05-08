import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import ws from "ws"; // 1. Tambahkan import ws
dotenv.config();

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    // 2. Beritahu Supabase untuk menggunakan library ws untuk fitur realtime
    realtime: {
      transport: ws as any,
    },
  },
);
