"use client";

import Link from "next/link";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-primary">
          Thumbtory
        </Link>

        {/* 모바일 메뉴 버튼 */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="18" x2="20" y2="18"></line>
              </>
            )}
          </svg>
        </button>

        {/* 데스크톱 메뉴 */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/templates"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            템플릿
          </Link>
          <Link
            href="/help"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            도움말
          </Link>
          <div className="w-px h-6 bg-border mx-2" />
          <Link
            href="/profile"
            className="text-sm text-foreground hover:text-primary"
          >
            내 계정
          </Link>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col space-y-3">
              <Link
                href="/templates"
                className="text-sm text-muted-foreground hover:text-foreground px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                템플릿
              </Link>
              <Link
                href="/help"
                className="text-sm text-muted-foreground hover:text-foreground px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                도움말
              </Link>
              <div className="w-full h-px bg-border my-1" />
              <Link
                href="/profile"
                className="text-sm text-foreground hover:text-primary px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                내 계정
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
