import { Inter } from "next/font/google";
import "./globals.css";
import ClientToaster from "@/components/ClientToaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Thumbtory - 블로거를 위한 썸네일 제작 툴",
  description:
    "블로그 플랫폼별 최적화된 썸네일을 쉽게 제작하고 SEO 최적화까지 지원하는 도구",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
        <ClientToaster />
      </body>
    </html>
  );
}
