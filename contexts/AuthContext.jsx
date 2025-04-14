"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createUserProfile } from "@/lib/user-profile";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 초기 세션 확인
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user || null);

        // 로그인 상태이고, 프로필이 필요하면 생성
        if (session?.user) {
          try {
            const userData = {
              username:
                session.user.user_metadata?.name ||
                session.user.user_metadata?.preferred_username,
              full_name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url,
            };
            if (typeof createUserProfile === "function") {
              await createUserProfile(session.user.id, userData);
            }
          } catch (err) {
            console.error("프로필 생성 오류:", err);
          }
        }
      } catch (error) {
        console.error("세션 확인 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);

      // 새로운 사용자가 로그인한 경우 프로필 생성
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const userData = {
            username:
              session.user.user_metadata?.name ||
              session.user.user_metadata?.preferred_username,
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
          };
          if (typeof createUserProfile === "function") {
            await createUserProfile(session.user.id, userData);
          }
        } catch (err) {
          console.error("프로필 생성 오류:", err);
        }
      }

      // 로그아웃 시 리디렉션
      if (event === "SIGNED_OUT" && pathname.startsWith("/editor")) {
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  // 로그아웃 함수
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내에서만 사용할 수 있습니다");
  }
  return context;
};
