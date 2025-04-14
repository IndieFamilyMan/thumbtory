"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SocialButton } from "@/components/ui/auth/SocialButton";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Google 로그인
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=/editor`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        title: "로그인 오류",
        description: error.message || "Google 로그인 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Kakao 로그인
  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=/editor`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        title: "로그인 오류",
        description: error.message || "Kakao 로그인 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Thumbtory 로그인</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          소셜 계정으로 간편하게 로그인하세요
        </p>
      </div>

      <div className="space-y-3">
        <SocialButton
          provider="Google"
          label="Google로 로그인"
          icon="/icons/google.svg"
          onClick={handleGoogleLogin}
          disabled={loading}
        />

        <SocialButton
          provider="Kakao"
          label="Kakao로 로그인"
          icon="/icons/kakao.svg"
          onClick={handleKakaoLogin}
          disabled={loading}
          className="bg-[#FEE500] text-black hover:bg-[#F6DC00] border-[#FEE500]"
        />
      </div>

      {loading && (
        <div className="text-center mt-4 text-sm text-gray-500">
          로그인 처리 중입니다...
        </div>
      )}
    </div>
  );
}
