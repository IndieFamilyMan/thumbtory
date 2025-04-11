import Link from "next/link";

<div className="space-y-4">
  <Link
    href="/editor"
    className="block p-4 bg-white border rounded-md shadow-sm hover:shadow-md transition-shadow"
  >
    <h2 className="text-xl font-semibold mb-2">에디터 시작하기</h2>
    <p className="text-sm text-gray-500">썸네일과 그래픽 편집을 시작하세요</p>
  </Link>

  <Link
    href="/text-editor-test"
    className="block p-4 bg-white border rounded-md shadow-sm hover:shadow-md transition-shadow"
  >
    <h2 className="text-xl font-semibold mb-2">텍스트 에디터 테스트</h2>
    <p className="text-sm text-gray-500">Fabric.js 텍스트 에디터 기능 테스트</p>
  </Link>
</div>;
