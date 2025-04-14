import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* 히어로 섹션 */}
      <section className="py-16 md:py-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Thumbtory</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          블로그와 소셜 미디어를 위한 최적의 썸네일 제작 도구
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/editor"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-300"
          >
            지금 시작하기
          </Link>
          <Link
            href="/demos"
            className="inline-block px-8 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
          >
            데모 보기
          </Link>
        </div>
        <div className="max-w-5xl mx-auto bg-gray-100 dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="relative h-[300px] md:h-[450px] w-full">
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <p className="text-gray-500 dark:text-gray-400">
                썸네일 에디터 미리보기 이미지
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 썸네일 카테고리 섹션 */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              다양한 템플릿으로 시작하세요
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              블로그, SNS, 유튜브 등 다양한 플랫폼에 최적화된 템플릿을
              제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 블로그 썸네일 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  블로그 썸네일 예시
                </p>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">블로그</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  티스토리, 벨로그, 미디엄 등 다양한 블로그 플랫폼에 최적화된
                  썸네일을 제작하세요.
                </p>
                <Link
                  href="/editor?template=blog"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  템플릿 사용하기 →
                </Link>
              </div>
            </div>

            {/* SNS 썸네일 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  SNS 썸네일 예시
                </p>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">SNS</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  인스타그램, 페이스북, 트위터 등 소셜 미디어에 최적화된
                  이미지를 제작하세요.
                </p>
                <Link
                  href="/editor?template=sns"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  템플릿 사용하기 →
                </Link>
              </div>
            </div>

            {/* 유튜브 썸네일 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  유튜브 썸네일 예시
                </p>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">유튜브</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  조회수를 높이는 매력적인 유튜브 썸네일을 쉽고 빠르게
                  제작하세요.
                </p>
                <Link
                  href="/editor?template=youtube"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  템플릿 사용하기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">주요 기능</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Thumbtory는 전문가 수준의 썸네일을 쉽게 만들 수 있는 모든 기능을
              제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* 기능 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-2xl text-blue-600 dark:text-blue-400">
                  ✏️
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">직관적인 에디터</h3>
              <p className="text-gray-600 dark:text-gray-300">
                드래그 앤 드롭으로 쉽게 사용할 수 있는 깔끔하고 강력한 편집
                도구를 제공합니다.
              </p>
            </div>

            {/* 기능 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-2xl text-blue-600 dark:text-blue-400">
                  🎨
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">다양한 템플릿</h3>
              <p className="text-gray-600 dark:text-gray-300">
                수백 개의 전문적인 템플릿으로 빠르게 디자인을 시작하세요.
              </p>
            </div>

            {/* 기능 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-2xl text-blue-600 dark:text-blue-400">
                  🔄
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">SEO 최적화</h3>
              <p className="text-gray-600 dark:text-gray-300">
                검색엔진에 최적화된 메타데이터를 포함한 이미지를 만들어 노출을
                극대화합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 사용자 후기 섹션 */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">사용자 후기</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              수많은 블로거와 크리에이터들이 Thumbtory를 사용하고 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 후기 1 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                "Thumbtory로 블로그 썸네일을 제작한 뒤 클릭률이 30% 이상
                증가했어요. 누구나 쉽게 전문적인 썸네일을 만들 수 있어요."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                <div>
                  <p className="font-semibold">김민지</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    블로거
                  </p>
                </div>
              </div>
            </div>

            {/* 후기 2 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                "유튜브 채널 운영에 Thumbtory는 필수 도구가 되었습니다. 몇 분
                만에 매력적인 썸네일을 만들어 영상 조회수가 크게 증가했어요."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                <div>
                  <p className="font-semibold">이준호</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    유튜버
                  </p>
                </div>
              </div>
            </div>

            {/* 후기 3 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                "디자인 지식이 없어도 Thumbtory로 인스타그램 게시물을 전문적으로
                꾸밀 수 있어요. 팔로워들의 반응이 이전보다 훨씬 좋아졌습니다."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                <div>
                  <p className="font-semibold">박서연</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    인플루언서
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 px-4 bg-blue-600 dark:bg-blue-800 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-xl mb-8">
            무료로 시작하고 멋진 썸네일을 만들어보세요
          </p>
          <Link
            href="/editor"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-md hover:bg-gray-100 transition-colors duration-300"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>
    </main>
  );
}
