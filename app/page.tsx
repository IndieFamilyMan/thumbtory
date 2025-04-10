import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">Thumbtory</div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/features"
              className="text-foreground hover:text-primary"
            >
              기능
            </Link>
            <Link
              href="/pricing"
              className="text-foreground hover:text-primary"
            >
              요금제
            </Link>
            <Link href="/faq" className="text-foreground hover:text-primary">
              FAQ
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              로그인
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  블로거를 위한{" "}
                  <span className="text-primary">최적의 썸네일</span> 제작 도구
                </h1>
                <p className="text-lg mb-8 text-muted-foreground">
                  한 번의 디자인으로 다양한 플랫폼에 맞는 썸네일을 자동
                  생성하고, SEO 최적화까지 한 번에 해결하세요.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/editor"
                    className="px-6 py-3 bg-primary text-white rounded-md text-center font-medium hover:bg-primary/90"
                  >
                    무료로 시작하기
                  </Link>
                  <Link
                    href="/demo"
                    className="px-6 py-3 border border-input rounded-md text-center font-medium hover:bg-muted"
                  >
                    데모 보기
                  </Link>
                </div>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-lg font-medium">
                    썸네일 에디터 미리보기 이미지
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-16">
              블로거를 위한 핵심 기능
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">플랫폼별 최적화</h3>
                <p className="text-muted-foreground">
                  네이버 블로그, 티스토리, 브런치 등 다양한 플랫폼에 맞는 크기를
                  한 번에 생성하세요.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <polyline points="4 7 4 4 20 4 20 7"></polyline>
                    <line x1="9" y1="20" x2="15" y2="20"></line>
                    <line x1="12" y1="4" x2="12" y2="20"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">SEO 최적화</h3>
                <p className="text-muted-foreground">
                  키워드 기반 파일명을 자동 생성하고 검색 엔진 최적화를 위한
                  설정을 쉽게 적용하세요.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">텍스트 자유 배치</h3>
                <p className="text-muted-foreground">
                  드래그 앤 드롭으로 텍스트를 자유롭게 배치하고 다양한 스타일을
                  적용하세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요</h2>
            <p className="text-lg mb-10 text-muted-foreground max-w-2xl mx-auto">
              복잡한 디자인 도구 없이도 전문적인 썸네일을 제작하고 블로그
              브랜딩을 일관되게 유지하세요.
            </p>
            <Link
              href="/editor"
              className="px-8 py-4 bg-primary text-white rounded-md text-lg font-medium hover:bg-primary/90"
            >
              무료로 시작하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="mb-8 md:mb-0">
              <div className="text-xl font-bold text-primary mb-4">
                Thumbtory
              </div>
              <p className="text-muted-foreground max-w-xs">
                블로거를 위한 간편하고 강력한 썸네일 제작 도구
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">제품</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/features"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      기능
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pricing"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      요금제
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/roadmap"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      로드맵
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">회사</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/about"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      소개
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/blog"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      블로그
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      문의하기
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">지원</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/faq"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      가이드
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/support"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      고객지원
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Thumbtory. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                이용약관
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
