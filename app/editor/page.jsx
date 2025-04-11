"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { ToolbarLeft } from "@/components/editor/ToolbarLeft";
import Canvas from "@/components/editor/Canvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { PlatformPreview } from "@/components/editor/PlatformPreview";
import TextEditor from "@/components/editor/TextEditor";
import { useEditorStore } from "@/store/editor";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DndContext } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import Link from "next/link";
import { ChevronLeft, Save } from "lucide-react";

export default function EditorPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showSeoDialog, setShowSeoDialog] = useState(false);
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
    mobileRightOpen,
    showPlatformPreview,
    setMobileRightOpen,
    togglePlatformPreview,
  } = useEditorStore();
  const { toast } = useToast();
  const platformPreviewRef = useRef(null);
  const [showEmptyMessage, setShowEmptyMessage] = useState(true);
  const router = useRouter();

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

  // SEO 설정 다이얼로그 표시
  const handleShowSeoDialog = () => {
    setShowSeoDialog(true);
  };

  // 에디터 페이지를 떠날 때 리셋
  useEffect(() => {
    return () => {
      // 여기에 리셋 로직을 추가할 수 있습니다.
    };
  }, []);

  const handleExport = () => {
    toast({
      title: "내보내기 기능",
      description: "이미지 내보내기 기능은 현재 개발 중입니다.",
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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-3 border-b">
        <Link href="/" className="flex items-center">
          <ChevronLeft className="h-5 w-5 mr-1" />
          돌아가기
        </Link>
        <h1 className="text-lg font-semibold">썸네일 에디터</h1>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-md hover:bg-muted"
            onClick={handleSaveTemplate}
          >
            <Save className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 모바일, 데스크탑 모두 동일한 수직 레이아웃 사용 */}
      <div className="flex flex-col flex-1 overflow-auto pb-16">
        {/* 툴바 */}
        <Toolbar />

        {/* 이미지 편집 - 툴바 */}
        <div className="p-6 border-b">
          <h2 className="font-medium text-lg mb-4">이미지 편집</h2>
          <ToolbarLeft isMobileView={isMobile} />
        </div>

        {/* 텍스트, 요소 - 캔버스 */}
        <div className="p-6 border-b">
          <div
            className="aspect-video flex items-center justify-center"
            style={{ height: "450px" }}
          >
            <Canvas
              setCanvasRef={setCanvasRef}
              setShowTextToolbar={() => {}}
              onTextEdit={() => {}}
              setIsTextEditing={() => {}}
              onCanvasReady={(canvasInstance) => {
                setFabricCanvas(canvasInstance);
                console.log("캔버스가 준비되었습니다.");
              }}
            />
          </div>
        </div>

        {/* 텍스트 에디터 영역 */}
        <div className="p-6 border-b">
          <h2 className="font-medium text-lg mb-4">텍스트 에디터</h2>
          <TextEditor
            canvas={fabricCanvas}
            onTextUpdated={(textObject) => {
              console.log("텍스트 업데이트됨:", textObject?.text);
              // 캔버스 상태 저장 및 기타 필요한 처리
            }}
          />
        </div>

        {/* 플랫폼 설정 */}
        <div className="p-6 border-b">
          <h2 className="font-medium text-lg mb-4">플랫폼 설정</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {platforms.map((platform) => (
              <div key={platform.id} className="flex items-center py-2 mr-6">
                <input
                  type="checkbox"
                  id={`platform-${platform.id}`}
                  checked={platform.enabled}
                  onChange={(e) =>
                    togglePlatform(platform.id, e.target.checked)
                  }
                  className="mr-3 w-4 h-4"
                />
                <label
                  htmlFor={`platform-${platform.id}`}
                  className="text-sm cursor-pointer"
                >
                  {platform.name} ({platform.width}×{platform.height})
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 미리보기 */}
        <div className="p-6 border-b">
          <h2 className="font-medium text-lg mb-4">미리보기</h2>
          <div className="overflow-auto" style={{ height: "400px" }}>
            <Preview isMobileView={isMobile} />
          </div>
        </div>
      </div>

      {showSeoDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-[90%] max-w-[400px]">
            <h2 className="text-lg font-semibold mb-4">이미지 SEO 설정</h2>
            <p className="text-sm text-muted-foreground mb-4">
              SEO 설정은 오른쪽 속성 패널의 "디자인 설정" 영역에서 편집하실 수
              있습니다.
            </p>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                onClick={() => setShowSeoDialog(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
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
