"use client";

import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/store/editor";
import { useToast } from "@/hooks/use-toast";
import { PlatformPreview } from "./PlatformPreview";
import { ExportModal } from "./ExportModal";
import { Undo, Redo, ImageDown } from "lucide-react";

export function Footer() {
  const { undo, redo, saveTemplate, platforms, seo, setSeo, background } =
    useEditorStore();
  const { toast } = useToast();
  const [showSeoDialog, setShowSeoDialog] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
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

    useEffect(() => {
      if (dialogRef.current) {
        dialogRef.current.showModal();
      }

      // ESC 키로 모달 닫기 기능 추가
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [onClose]);

    return (
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 m-auto p-0 border-none outline-none bg-black/50 max-w-md w-full max-h-[90vh] overflow-visible"
        style={{
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          margin: "auto",
          height: "fit-content",
          width: "100vw",
          maxWidth: "100vw",
        }}
        onClick={(e) => e.target === dialogRef.current && onClose()}
      >
        <div
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full mx-auto overflow-auto"
          style={{
            maxWidth: "420px",
            maxHeight: "calc(90vh - 2rem)",
          }}
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

  // SEO 설정 다이얼로그 표시
  const handleShowSeoDialog = () => {
    setShowSeoDialog(true);
  };

  // 파일 내보내기 모달 표시
  const handleShowExportModal = () => {
    setShowExportModal(true);
  };

  return (
    <div className="border-t border-border bg-muted/10">
      <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-4 justify-center">
          <button
            className="p-3 sm:p-2 rounded-md text-base hover:bg-muted flex items-center gap-2"
            onClick={handleShowExportModal}
            title="SEO 설정 및 이미지 다운로드"
          >
            <ImageDown className="w-10 h-10 sm:w-8 sm:h-8" />
            SEO 설정 및 이미지 다운로드
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

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
