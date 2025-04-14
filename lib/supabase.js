import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables. Check your .env.local file."
  );
}

// 기본 Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

// 인증 토큰을 포함한 클라이언트 생성 (서버 컴포넌트용)
export const createClientWithAuth = (authToken) => {
  return createClient(supabaseUrl || "", supabaseAnonKey || "", {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  });
};

export default supabase;
