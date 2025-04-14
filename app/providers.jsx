"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import ClientToaster from "@/components/ClientToaster";

export function Providers({ children }) {
  const [mounted, setMounted] = useState(false);

  // 클라이언트 측에서만 마운트 상태 업데이트
  useEffect(() => {
    setMounted(true);
  }, []);

  // 기본 테마 처리
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <ClientToaster />
    </ThemeProvider>
  );
}
