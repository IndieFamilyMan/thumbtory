import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Thumbtory - 썸네일 에디터",
  description: "블로그와 소셜 미디어를 위한 최적의 썸네일 제작 도구",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
