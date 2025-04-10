"use client";

import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/store/editor";
import { useToast } from "@/hooks/use-toast";
import { PlatformPreview } from "./PlatformPreview";

export function Footer() {
  const { undo, redo, saveTemplate, platforms, seo, setSeo, background } =
    useEditorStore();
  const { toast } = useToast();
  const [showSeoDialog, setShowSeoDialog] = useState(false);
  const [showPlatformPreview, setShowPlatformPreview] = useState(false);
  const dialogRef = useRef(null);
  const platformPreviewRef = useRef(null);

  // SEO 정보 입력 다이얼로그
  const SeoDialog = ({ onClose, onConfirm }) => {
    const [seoInfo, setSeoInfo] = useState({
      filename: seo.filename || "",
      altText: seo.altText || "",
      keywords: seo.keywords ? seo.keywords.join(", ") : "",
      description: seo.description || "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const keywords = seoInfo.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);
      setSeo({
        ...seoInfo,
        keywords,
      });
      onConfirm();

      // SEO 정보 업데이트 후 미리보기 재생성
      if (showPlatformPreview && platformPreviewRef.current) {
        // 약간의 지연 후 미리보기 재생성 (상태 업데이트 후)
        setTimeout(() => {
          platformPreviewRef.current.generatePreviews();
        }, 300);
      }
    };

    return (
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={(e) => e.target === dialogRef.current && onClose()}
      >
        <div
          className="bg-background p-6 rounded-lg shadow-lg w-[400px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-4">이미지 SEO 설정</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">파일명</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={seoInfo.filename}
                  onChange={(e) =>
                    setSeoInfo({ ...seoInfo, filename: e.target.value })
                  }
                  placeholder="파일명 (예: my-blog-thumbnail)"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">대체 텍스트 (alt)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={seoInfo.altText}
                  onChange={(e) =>
                    setSeoInfo({ ...seoInfo, altText: e.target.value })
                  }
                  placeholder="이미지 설명 (예: 2024 봄 패션 트렌드)"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  키워드 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={seoInfo.keywords}
                  onChange={(e) =>
                    setSeoInfo({ ...seoInfo, keywords: e.target.value })
                  }
                  placeholder="패션, 트렌드, 봄"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">설명</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md"
                  value={seoInfo.description}
                  onChange={(e) =>
                    setSeoInfo({ ...seoInfo, description: e.target.value })
                  }
                  placeholder="이미지에 대한 상세 설명"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
                onClick={onClose}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                확인
              </button>
            </div>
          </form>
        </div>
      </dialog>
    );
  };

  // 컴포넌트가 마운트될 때 기본적으로 미리보기 표시
  useEffect(() => {
    // 기본적으로 미리보기 표시
    setShowPlatformPreview(true);

    // 로컬 스토리지에서 미리보기 표시 설정을 불러옴
    const savedPreviewState = localStorage.getItem("showPlatformPreview");
    if (savedPreviewState !== null) {
      setShowPlatformPreview(savedPreviewState === "true");
    }
  }, []);

  // 미리보기 상태가 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("showPlatformPreview", showPlatformPreview.toString());
  }, [showPlatformPreview]);

  // 템플릿 저장 처리 함수
  const handleSaveTemplate = () => {
    const templateName = prompt("템플릿 이름을 입력하세요:");
    if (templateName) {
      saveTemplate(templateName);
      toast({
        title: "템플릿 저장 완료",
        description: "템플릿이 성공적으로 저장되었습니다.",
      });
    }
  };

  // 미리보기 토글 함수
  const togglePlatformPreview = () => {
    setShowPlatformPreview(!showPlatformPreview);
  };

  // SEO 설정 다이얼로그 표시
  const handleShowSeoDialog = () => {
    setShowSeoDialog(true);
  };

  return (
    <div className="border-t border-border bg-muted/10">
      <div className="container mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            className="p-1 rounded-md text-xs hover:bg-muted flex items-center gap-1"
            onClick={undo}
            title="실행 취소"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7v6h6"></path>
              <path d="M3 13c3.8-5 8.8-7 14-4"></path>
            </svg>
            <span className="hidden sm:inline">실행 취소</span>
          </button>
          <button
            className="p-1 rounded-md text-xs hover:bg-muted flex items-center gap-1"
            onClick={redo}
            title="다시 실행"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 7v6h-6"></path>
              <path d="M21 13c-3.8-5-8.8-7-14-4"></path>
            </svg>
            <span className="hidden sm:inline">다시 실행</span>
          </button>
          <div className="h-4 border-r border-border mx-1 hidden sm:block"></div>
          <button
            className="p-1 rounded-md text-xs hover:bg-muted flex items-center gap-1"
            onClick={handleSaveTemplate}
            title="템플릿 저장"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span className="hidden sm:inline">템플릿 저장</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-1 rounded-md text-xs hover:bg-muted flex items-center gap-1"
            onClick={handleShowSeoDialog}
            title="SEO 설정"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 17V5h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path>
              <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"></path>
              <line x1="8" y1="9" x2="16" y2="9"></line>
              <line x1="8" y1="13" x2="12" y2="13"></line>
            </svg>
            <span className="hidden sm:inline">SEO 설정</span>
          </button>
          <button
            className={`p-1 rounded-md text-xs flex items-center gap-1 ${
              showPlatformPreview
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={togglePlatformPreview}
            title={showPlatformPreview ? "미리보기 숨기기" : "미리보기 표시"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span className="hidden sm:inline">
              {showPlatformPreview ? "미리보기 접기" : "플랫폼별 미리보기"}
            </span>
          </button>
        </div>
      </div>

      {showPlatformPreview && <PlatformPreview ref={platformPreviewRef} />}

      {showSeoDialog && (
        <SeoDialog
          onClose={() => setShowSeoDialog(false)}
          onConfirm={() => setShowSeoDialog(false)}
        />
      )}
    </div>
  );
}
