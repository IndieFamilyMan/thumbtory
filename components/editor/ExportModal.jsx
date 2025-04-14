"use client";

import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/store/editor";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

export function ExportModal({ onClose, onExport }) {
  const dialogRef = useRef(null);
  const { seo, setSeo, canvas, activePlatformId } = useEditorStore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState("png");

  const [metaData, setMetaData] = useState({
    filename: seo.filename || "",
    altText: seo.altText || "",
    keywords: seo.keywords ? seo.keywords.join(", ") : "",
    description: seo.description || "",
    title: seo.title || "",
    author: seo.author || "",
    copyright: seo.copyright || "",
  });

  // 모달이 열릴 때 다이얼로그를 표시
  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }

    // 키보드 이벤트 리스너 (ESC로 닫기)
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 입력값 유효성 검사
      if (!metaData.filename.trim()) {
        toast({
          title: "파일명을 입력해주세요",
          variant: "destructive",
        });
        return;
      }

      // 내보내기 상태 설정
      setIsExporting(true);

      // 메타데이터를 SEO 상태에 저장
      const keywords = metaData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);

      const updatedSeo = {
        ...metaData,
        keywords,
      };

      // SEO 정보 업데이트
      setSeo(updatedSeo);

      // 내보내기 진행
      const result = await exportCanvasWithMetadata(updatedSeo);

      if (result) {
        toast({
          title: "내보내기 완료",
          description: "이미지가 성공적으로 내보내졌습니다.",
        });
        onClose();
      }
    } catch (error) {
      console.error("내보내기 중 오류 발생:", error);
      toast({
        title: "내보내기 실패",
        description: "이미지를 내보내는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 캔버스 가이드 요소 숨기는 함수
  const hideGuideElements = () => {
    try {
      if (!canvas) return;

      const objectsToHide = [];

      // 내보내기 시 숨겨야 할 요소들
      canvas.getObjects().forEach((obj) => {
        if (
          obj.id &&
          (obj.id.startsWith("grid-") ||
            obj.id === "guide-text" ||
            obj.id === "drop-icon" ||
            obj.id === "size-info" ||
            obj.id === "canvas-border")
        ) {
          objectsToHide.push({
            object: obj,
            wasVisible: obj.visible,
          });
          obj.visible = false;
        }
      });

      // 즉시 렌더링
      canvas.renderAll();

      // 미리보기 모드 설정
      if (
        window.__EDITOR_STATE_HANDLER__ &&
        typeof window.__EDITOR_STATE_HANDLER__.setPreviewMode === "function"
      ) {
        window.__EDITOR_STATE_HANDLER__.setPreviewMode(true);
      }

      return objectsToHide;
    } catch (e) {
      console.error("가이드 요소 숨기기 실패:", e);
      return [];
    }
  };

  // 숨긴 요소들 복원 함수
  const restoreHiddenElements = (hiddenElements) => {
    try {
      if (!canvas || !hiddenElements) return;

      // 숨겨진 요소들 복원
      hiddenElements.forEach(({ object, wasVisible }) => {
        if (object) {
          object.visible = wasVisible;
        }
      });

      // 다시 렌더링
      canvas.renderAll();
    } catch (e) {
      console.error("요소 복원 중 오류 발생:", e);
    }
  };

  // 메타데이터를 포함한 캔버스 내보내기
  const exportCanvasWithMetadata = async (metadata) => {
    if (!canvas) {
      toast({
        title: "내보내기 실패",
        description: "캔버스를 찾을 수 없습니다.",
        variant: "destructive",
      });
      return false;
    }

    // 가이드 요소 숨기기
    const hiddenElements = hideGuideElements();

    try {
      // 파일명 생성 (타임스탬프 추가)
      const timestamp = new Date().toISOString().split("T")[0];
      const sanitizedFilename = metadata.filename
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // 포맷 설정
      const format = exportFormat.toLowerCase();
      const mimeType =
        format === "png"
          ? "image/png"
          : format === "webp"
          ? "image/webp"
          : "image/jpeg";

      // SEO 최적화를 위한 품질 설정
      // - JPEG: 0.85 (웹 최적화 권장 품질, 파일 크기와 시각적 품질의 균형)
      // - WebP: 0.85 (파일 크기 절약하면서 높은 품질 유지)
      // - PNG: 압축률 대신 색상 수 조절 (8비트 vs 24비트)
      const quality = format === "jpeg" || format === "webp" ? 0.85 : 1.0;

      // 파일명
      const fileName = `${sanitizedFilename}-${timestamp}.${format}`;

      // 캔버스를 데이터 URL로 변환 (디바이스 픽셀 비율 고려한 고품질 출력)
      const dataURL = canvas.toDataURL({
        format: format,
        quality: quality,
        multiplier: format === "jpeg" ? 1.5 : 2, // JPEG는 파일 크기 제한을 위해 1.5배, 나머지는 2배 해상도
        enableRetinaScaling: true, // 레티나 디스플레이 지원
      });

      // 메타데이터를 포함한 이미지 데이터 생성
      const img = new Image();
      img.src = dataURL;

      // SEO 최적화를 위한 이미지 메타데이터 설정
      if (metadata.altText) {
        img.alt = metadata.altText;
      }
      if (metadata.description) {
        img.setAttribute("data-description", metadata.description);
        // Open Graph 메타데이터 지원
        img.setAttribute("data-og-description", metadata.description);
      }
      if (metadata.keywords && metadata.keywords.length > 0) {
        img.setAttribute("data-keywords", metadata.keywords.join(","));
      }
      if (metadata.title) {
        img.setAttribute("data-title", metadata.title);
        // Open Graph 메타데이터 지원
        img.setAttribute("data-og-title", metadata.title);
      }
      if (metadata.author) {
        img.setAttribute("data-author", metadata.author);
      }
      if (metadata.copyright) {
        img.setAttribute("data-copyright", metadata.copyright);
      }

      // 다운로드 링크 생성 및 클릭
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error("내보내기 오류:", error);
      return false;
    } finally {
      // 숨긴 요소들 복원
      restoreHiddenElements(hiddenElements);
    }
  };

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
      onClick={(e) =>
        e.target === dialogRef.current && !isExporting && onClose()
      }
    >
      <div
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full mx-auto overflow-auto"
        style={{
          maxWidth: "450px",
          maxHeight: "calc(90vh - 2rem)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          이미지 내보내기
        </h2>
        <form onSubmit={handleSubmit}>
          <div
            className="space-y-5 overflow-y-auto mb-6"
            style={{ maxHeight: "60vh" }}
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                파일명 *
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors dark:bg-gray-700 dark:text-white"
                value={metaData.filename}
                onChange={(e) =>
                  setMetaData({ ...metaData, filename: e.target.value })
                }
                placeholder="파일명 (예: my-blog-thumbnail)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                파일 형식
              </label>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="png"
                    checked={exportFormat === "png"}
                    onChange={() => setExportFormat("png")}
                    className="mr-2"
                  />
                  PNG (투명도 지원)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="jpeg"
                    checked={exportFormat === "jpeg"}
                    onChange={() => setExportFormat("jpeg")}
                    className="mr-2"
                  />
                  JPEG (SEO 최적화)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="webp"
                    checked={exportFormat === "webp"}
                    onChange={() => setExportFormat("webp")}
                    className="mr-2"
                  />
                  WebP (최신 최적화)
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                SEO 최적화를 위해서는 JPEG 형식(85% 품질)이 권장됩니다. 웹
                페이지 로딩 속도 개선을 위한 최적의 압축률로 설정되어 있습니다.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className="px-4 py-2.5 min-w-[100px] text-sm font-medium flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 shadow-sm cursor-pointer"
              onClick={onClose}
              disabled={isExporting}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 min-w-[120px] text-sm font-medium flex items-center justify-center gap-2 bg-blue-600 text-white rounded-md transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed border border-blue-700 shadow-sm cursor-pointer"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  내보내는 중...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-download"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  내보내기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
