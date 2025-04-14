"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { ToolbarLeft } from "@/components/editor/ToolbarLeft";
import Canvas from "@/components/editor/Canvas";

import { PlatformPreview } from "@/components/editor/PlatformPreview";
import { Footer } from "@/components/editor/Footer";
import EditorPanel from "@/components/editor/EditorPanel";
import { useEditorStore } from "@/store/editor";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DndContext } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import Link from "next/link";
import { House, FolderDot } from "lucide-react";
import { SocialMediaLayouts } from "@/lib/social-media-layouts";
import debounce from "lodash/debounce";

export default function EditorPage() {
  const [isMobile, setIsMobile] = useState(false);

  const [canvasRef, setCanvasRef] = useState(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const {
    elements,
    background,
    undo,
    redo,
    saveTemplate,
    mobileLeftOpen,
    setMobileLeftOpen,
    platforms,
    togglePlatform,
    activePlatformId,
    setActivePlatform,
    mobileRightOpen,
    showPlatformPreview,
    setMobileRightOpen,
    togglePlatformPreview,
  } = useEditorStore();
  const { toast } = useToast();
  const platformPreviewRef = useRef(null);
  const [showEmptyMessage, setShowEmptyMessage] = useState(true);
  const router = useRouter();
  const [showSeoDialog, setShowSeoDialog] = useState(false);

  // Add SEO options form below the text editor
  const [seoData, setSeoData] = useState({
    filename: "",
    altText: "",
    description: "",
    keywords: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSeoData((prevData) => ({ ...prevData, [name]: value }));
  };

  // 화면 크기에 따라 모바일 여부 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 컴포넌트가 마운트될 때 기본적으로 미리보기 표시
  useEffect(() => {
    // 로컬 스토리지에서 미리보기 표시 설정을 불러옴
    const savedPreviewState = localStorage.getItem("showPlatformPreview");
    if (savedPreviewState !== null) {
      useEditorStore.setState({
        showPlatformPreview: savedPreviewState === "true",
      });
    }
  }, []);

  // 요소 추가 시 안내 메시지 감추기
  useEffect(() => {
    if (elements.length > 0 || (background && background.type === "image")) {
      setShowEmptyMessage(false);
    } else {
      setShowEmptyMessage(true);
    }
  }, [elements, background]);

  // 미리보기 상태가 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("showPlatformPreview", showPlatformPreview.toString());
  }, [showPlatformPreview]);

  // 미리보기 토글 핸들러 - 이제 스토어 함수를 사용하므로 필요 없음
  // const togglePlatformPreview = () => {
  //   setShowPlatformPreview(!showPlatformPreview);
  // };

  // 템플릿 저장 처리 함수
  const handleSaveTemplate = () => {
    const templateName = prompt("템플릿 이름을 입력하세요:", "새 템플릿");
    if (templateName) {
      saveTemplate(templateName);
      toast({
        title: "템플릿 저장 완료",
        description: "템플릿이 성공적으로 저장되었습니다.",
      });
    }
  };

  // 에디터 페이지를 떠날 때 리셋
  useEffect(() => {
    return () => {
      // 여기에 리셋 로직을 추가할 수 있습니다.
    };
  }, []);

  // Update export logic to use form values
  const handleExport = () => {
    // Use seoData for exporting
    toast({
      title: "내보내기 기능",
      description: `이미지 내보내기 기능은 현재 개발 중입니다. 파일명: ${seoData.filename}`,
    });
  };

  const handleSave = () => {
    toast({
      title: "저장 성공",
      description: "프로젝트가 저장되었습니다.",
    });
  };

  // 캔버스 인스턴스를 관리하기 위한 useEffect 추가
  useEffect(() => {
    // 글로벌 캔버스 인스턴스가 설정되었는지 확인하는 함수
    const checkFabricCanvasInstance = () => {
      if (window.fabricCanvasInstance) {
        setFabricCanvas(window.fabricCanvasInstance);
        return true;
      }
      return false;
    };

    // 초기 확인
    if (!checkFabricCanvasInstance()) {
      // 캔버스가 아직 준비되지 않은 경우, 간격을 두고 확인
      const intervalId = setInterval(() => {
        if (checkFabricCanvasInstance()) {
          clearInterval(intervalId);
        }
      }, 500);

      // 클린업 함수
      return () => clearInterval(intervalId);
    }
  }, []);

  // 플랫폼 변경 처리를 위한 debounce 함수 - 연속 호출 방지
  const debouncedPlatformChange = useRef(
    debounce((newPlatformId) => {
      if (!SocialMediaLayouts[newPlatformId]) {
        console.warn("유효하지 않은 플랫폼 ID:", newPlatformId);
        return;
      }

      console.log("플랫폼 변경 시작(debounced):", newPlatformId);
      setActivePlatform(newPlatformId);
    }, 300)
  ).current;

  // 컴포넌트 언마운트 시 디바운스 함수 취소
  useEffect(() => {
    return () => {
      debouncedPlatformChange.cancel();
    };
  }, [debouncedPlatformChange]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-3 border-b">
        <Link href="/" className="flex items-center">
          <House className="h-5 w-5 mr-1" />
        </Link>
        <h1 className="text-lg font-semibold">썸토리</h1>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-md hover:bg-muted"
            onClick={handleSaveTemplate}
          >
            <FolderDot className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 모바일, 데스크탑 모두 동일한 수직 레이아웃 사용 */}
      <div className="flex flex-col flex-1 overflow-auto pb-16">
        {/* 플랫폼 설정 */}
        <div className="p-6 border-b">
          <h2 className="font-medium text-lg mb-4">플랫폼 설정</h2>
          <div className="flex flex-col">
            <div className="relative w-full max-w-md mb-4">
              <div className="relative">
                <select
                  className="appearance-none block w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  value={activePlatformId}
                  onChange={(e) => {
                    try {
                      // 플랫폼 변경 전 확인
                      const newPlatformId = e.target.value;
                      debouncedPlatformChange(newPlatformId);
                    } catch (err) {
                      // 오류가 발생해도 사용자에게 노출되지 않도록 처리
                      console.warn(
                        "플랫폼 변경 중 오류 발생 (무시됨):",
                        err.message
                      );
                    }
                  }}
                >
                  {Object.entries(SocialMediaLayouts).map(([id, platform]) => (
                    <option key={id} value={id}>
                      {id === "naver"
                        ? "네이버 블로그"
                        : id === "tistory"
                        ? "티스토리"
                        : id === "wordpress"
                        ? "워드프레스"
                        : id === "brunch"
                        ? "브런치"
                        : id === "instagram"
                        ? "인스타그램 게시물"
                        : id === "instagram_story"
                        ? "인스타그램 스토리"
                        : id === "facebook"
                        ? "페이스북"
                        : id === "twitter"
                        ? "트위터(X)"
                        : id === "youtube"
                        ? "유튜브"
                        : id === "linkedin"
                        ? "링크드인"
                        : id === "custom"
                        ? "사용자 지정"
                        : id}
                      ({platform.width}×{platform.height})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="ml-4 flex-1">
                <div className="mt-3 flex items-center"></div>
              </div>
            </div>
          </div>
        </div>
        {/* 이미지 편집 - 툴바 */}
        <div className="p-6 border-b">
          <ToolbarLeft isMobileView={isMobile} />
        </div>

        {/* 텍스트, 요소 - 캔버스 */}
        <div className="p-6 border-b">
          <h2 className="font-medium text-lg mb-4">캔버스</h2>
          <div
            className="flex items-center justify-center bg-muted/20 rounded-md p-4"
            style={{
              height: "500px",
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            <div
              className="canvas-container w-full h-full flex items-center justify-center overflow-hidden"
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                position: "relative",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                borderRadius: "0.375rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f8f9fa",
              }}
            >
              <Canvas
                setCanvasRef={setCanvasRef}
                setShowTextToolbar={() => {}}
                onTextEdit={() => {}}
                setIsTextEditing={() => {}}
                isMobile={isMobile}
                onCanvasReady={(canvasInstance) => {
                  setFabricCanvas(canvasInstance);
                  console.log("캔버스가 준비되었습니다.");
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer 컴포넌트 추가 */}
        <Footer />
        {/* 요소 편집기 영역 - 선택된 요소 타입에 따라 적절한 편집기가 표시됨 */}
        <div className="p-6 border-b">
          <h2 className="font-medium text-lg mb-4">요소 편집</h2>
          <EditorPanel
            canvas={fabricCanvas}
            onElementUpdated={(element) => {
              console.log("요소 업데이트됨:", element);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Sidebar 컴포넌트 - ToolbarLeft 컴포넌트를 래핑
function Sidebar() {
  const { mobileLeftOpen, setMobileLeftOpen } = useEditorStore();
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기에 따라 모바일 여부 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return <div className="h-full border-r">{!isMobile && <ToolbarLeft />}</div>;
}

// 상단 툴바 컴포넌트
function Toolbar() {
  const { undo, redo } = useEditorStore();

  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <button
        className="p-2 rounded-md hover:bg-muted"
        onClick={undo}
        title="실행 취소"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7v6h6"></path>
          <path d="M21 17a9 9 0 0 0-9-9H3"></path>
        </svg>
      </button>
      <button
        className="p-2 rounded-md hover:bg-muted"
        onClick={redo}
        title="다시 실행"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 7v6h-6"></path>
          <path d="M3 17a9 9 0 0 1 9-9h9"></path>
        </svg>
      </button>
      <div className="h-6 w-px bg-muted mx-2"></div>
      <div className="text-base ml-2">에디터</div>
    </div>
  );
}

// 미리보기 컴포넌트
function Preview({ isMobileView }) {
  const { togglePlatformPreview, showPlatformPreview } = useEditorStore();
  const platformPreviewRef = useRef(null);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">미리보기</h3>
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            if (platformPreviewRef.current) {
              platformPreviewRef.current.generatePreviews();
            }
          }}
        >
          새로고침
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <PlatformPreview
          ref={platformPreviewRef}
          standalone={true}
          isMobileView={isMobileView}
        />
      </div>
    </div>
  );
}
