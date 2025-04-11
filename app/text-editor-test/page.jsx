"use client";

import { useState, useEffect, useRef } from "react";
import { Canvas as FabricCanvas } from "fabric";
import TextEditor from "@/components/editor/TextEditor";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TextEditorTestPage() {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [canvasReady, setCanvasReady] = useState(false);

  // Initialize canvas when component mounts
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 500,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
      selectionColor: "rgba(0, 132, 255, 0.3)",
      selectionBorderColor: "rgba(0, 132, 255, 0.8)",
      selectionLineWidth: 1,
      hoverCursor: "pointer",
      defaultCursor: "default",
      fireRightClick: false,
      stopContextMenu: true,
      skipTargetFind: false,
      interactive: true,
      enableRetinaScaling: true,
      perPixelTargetFind: false,
    });

    // 드로잉 모드 비활성화 - 이것이 "+" 커서가 표시되는 원인
    fabricCanvas.isDrawingMode = false;

    // 캔버스 클릭 이벤트 설정 - 오브젝트 상호작용 디버깅용
    fabricCanvas.on("mouse:down", (e) => {
      console.log("캔버스 클릭:", e.pointer);
      if (e.target) {
        console.log("선택된 객체:", {
          type: e.target.type,
          id: e.target.id,
          selectable: e.target.selectable,
          evented: e.target.evented,
          hasControls: e.target.hasControls,
        });
      }
    });

    // Set canvas reference
    setCanvas(fabricCanvas);
    window.fabricCanvasInstance = fabricCanvas;
    setCanvasReady(true);

    // Cleanup
    return () => {
      fabricCanvas.dispose();
      window.fabricCanvasInstance = null;
    };
  }, []);

  return (
    <div className="min-h-screen p-4">
      <header className="flex items-center mb-6">
        <Link
          href="/"
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          돌아가기
        </Link>
        <h1 className="text-2xl font-bold ml-4">
          Fabric.js 텍스트 에디터 테스트
        </h1>
      </header>

      <div className="container mx-auto">
        <div className="mb-6">
          <div
            className="border border-gray-300 rounded-md mx-auto mb-4"
            style={{ width: "800px", height: "500px" }}
          >
            <canvas ref={canvasRef} width={800} height={500} />
          </div>

          <div className="mt-8">
            <p className="mb-4 text-gray-700">
              <strong>사용법:</strong>
              <br />
              1. "텍스트 추가" 버튼을 클릭하여 새 텍스트를 추가합니다.
              <br />
              2. 텍스트를 선택하고 드래그하여 이동합니다.
              <br />
              3. 텍스트를 선택한 후 아래의 컨트롤을 사용하여 내용이나 스타일을
              편집합니다.
              <br />
              4. 텍스트 외부를 클릭하여 선택을 해제합니다.
            </p>
          </div>

          {canvasReady && <TextEditor canvas={canvas} />}
        </div>
      </div>
    </div>
  );
}
