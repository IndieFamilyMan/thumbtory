"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/store/editor";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronUp, ChevronDown, Undo2, Redo2 } from "lucide-react";
import { TextOptions } from "./TextOptions";

export function ToolbarLeft({ isMobileView = false }) {
  const {
    platforms,
    togglePlatform,
    addElement,
    elements,
    background,
    setBackground,
    removeElement,
    selectedElementId,
    setSelectedElementId,
    updateElementProperty,
    addTextElement,
    addImageElement,
    undo,
    redo,
    undoStack = [],
    redoStack = [],
    saveState,
  } = useEditorStore();
  const imageInputRef = useRef(null);
  const backgroundImageInputRef = useRef(null);

  // 선택된 요소 정보 추적
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // 텍스트 요소 추가 핸들러
  const handleAddText = () => {
    // 텍스트 추가 및 옵션 패널 열기
    const id = `text_${Date.now()}`; // 명시적인 ID 생성

    // 텍스트 요소 추가
    const newTextElement = addTextElement({
      id,
      text: "", // 공백으로 시작하여 중복 텍스트 방지
      x: 100,
      y: 100,
      width: 300, // 텍스트 너비를 더 넓게 설정
      fontSize: 30,
      fontFamily: "Arial",
      fill: "#000000",
      textAlign: "left",
      fontWeight: "bold",
      fontStyle: "normal",
      underline: false,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      editable: true,
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      hasRotatingPoint: true,
      objectCaching: false, // 이동 시 해상도 유지를 위해 캐싱 비활성화
      cornerColor: "#0084ff",
      borderColor: "#0084ff",
      padding: 10, // 패딩 증가
      originX: "left",
      originY: "top",
      splitByGrapheme: false, // 글자 단위 분할 비활성화
      // 텍스트 렌더링 품질 개선 설정
      noScaleCache: true,
      statefullCache: true,
      strokeUniform: true,
      miterLimit: 10,
      paintFirst: "fill",
      shadow: null, // 그림자 효과 제거
      textRendering: "optimizeLegibility", // 텍스트 렌더링 최적화
    });

    // 상태 저장 (실행 취소/다시 실행용)
    saveState();

    // 바로 선택 상태로 설정
    setSelectedElementId(id);

    console.log("텍스트 요소 생성 완료", {
      id,
    });

    // 텍스트 객체는 생성 직후에 편집 모드로 진입해야 함
    setTimeout(() => {
      if (window.fabricCanvasInstance) {
        const fabricCanvas = window.fabricCanvasInstance;
        const objects = fabricCanvas.getObjects();
        const textObject = objects.find((obj) => obj.id === id);

        if (textObject) {
          // 기존 선택 해제
          fabricCanvas.discardActiveObject();

          // 명시적으로 텍스트 업데이트 - "텍스트를 입력하세요"를 기본으로 표시
          textObject.set({
            text: "텍스트를 입력하세요", // 여기서 기본 텍스트 설정
            fontFamily: "Arial",
            fontSize: 30,
            fill: "#000000",
            fontWeight: "bold",
            fontStyle: "normal",
            underline: false,
            textAlign: "left",
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            editable: true,
            lockMovementX: false,
            lockMovementY: false,
          });

          // 스토어에 텍스트 내용도 업데이트
          updateElementProperty(id, "text", "텍스트를 입력하세요");

          // 텍스트 객체 선택 및 렌더링
          fabricCanvas.setActiveObject(textObject);
          fabricCanvas.requestRenderAll();

          // 편집 모드 진입 (타이밍 문제 방지를 위해 충분한 지연 설정)
          setTimeout(() => {
            try {
              // 텍스트 객체를 다시 한 번 최신 상태로 참조
              const updatedObjects = fabricCanvas.getObjects();
              const updatedTextObject = updatedObjects.find(
                (obj) => obj.id === id
              );

              if (updatedTextObject) {
                // 편집 모드 진입
                updatedTextObject.enterEditing();

                // 전체 텍스트 선택 - 바로 입력 가능하도록
                if (updatedTextObject.selectAll) {
                  updatedTextObject.selectAll();
                }

                fabricCanvas.requestRenderAll();
              }
            } catch (err) {
              console.error("텍스트 편집 모드 진입 오류:", err);
            }
          }, 300);
        } else {
          console.log("텍스트 객체를 찾을 수 없음:", id);
        }
      }
    }, 100); // 지연 시간을 줄여 더 빠르게 반응하도록 함
  };

  // 텍스트 옵션 변경 핸들러
  const handleTextOptionChange = (option, value) => {
    if (!selectedElementId) return;

    const newOptions = { ...textOptions, [option]: value };
    setTextOptions(newOptions);

    // 특별한 처리가 필요한 속성들
    if (option === "hasStroke") {
      // 외곽선 유무에 따라 두께 설정
      updateElementProperty(
        selectedElementId,
        "strokeWidth",
        value ? textOptions.strokeWidth : 0
      );
    } else if (option === "strokeWidth" && textOptions.hasStroke) {
      // 외곽선이 활성화된 경우에만 두께 업데이트
      updateElementProperty(selectedElementId, option, value);
    } else if (option === "color") {
      // 색상 업데이트 - 두 속성 모두 업데이트
      updateElementProperty(selectedElementId, "fill", value);
      updateElementProperty(selectedElementId, "color", value);

      // 현재 편집 중인 텍스트 객체의 색상도 즉시 변경
      const canvas = window.fabricCanvasInstance;
      if (canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === "textbox") {
          // 색상 설정
          activeObject.set("fill", value);
          // 캔버스 새로고침
          canvas.requestRenderAll();
        }
      }
    } else if (option === "strokeColor") {
      // 외곽선 색상 업데이트
      updateElementProperty(selectedElementId, "stroke", value);

      // 현재 편집 중인 텍스트 객체의 외곽선 색상도 즉시 변경
      const canvas = window.fabricCanvasInstance;
      if (canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === "textbox") {
          // 외곽선 색상 설정
          activeObject.set("stroke", value);
          // 캔버스 새로고침
          canvas.requestRenderAll();
        }
      }
    } else {
      // 일반 속성 업데이트
      updateElementProperty(selectedElementId, option, value);

      // 현재 편집 중인 텍스트 객체의 속성도 즉시 변경
      const canvas = window.fabricCanvasInstance;
      if (canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === "textbox") {
          // 속성 설정 - 회전, 폰트, 폰트 크기 등
          activeObject.set(option, value);
          // 캔버스 새로고침
          canvas.requestRenderAll();
        }
      }
    }
  };

  // 폰트 목록
  const fontFamilies = [
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Helvetica",
    "Comic Sans MS",
    "Impact",
    "Tahoma",
    "Trebuchet MS",
  ];

  // 이미지 버튼 클릭 핸들러
  const handleImageButtonClick = () => {
    imageInputRef.current.click();
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.includes("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    // 파일 크기 검증 (10MB 이하)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("이미지 크기는 10MB 이하여야 합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target.result;

      // 에디터 스토어에 이미지 추가
      const newImage = addImageElement({
        src,
        x: 100,
        y: 100,
        width: 200,
        height: 200,
      });

      // 상태 저장 (실행 취소/다시 실행용)
      saveState();

      // 새로 추가된 이미지를 선택
      setTimeout(() => {
        if (window.fabricCanvasInstance) {
          const canvas = window.fabricCanvasInstance;
          const objects = canvas.getObjects();
          const imgObj = objects.find((obj) => obj.id === newImage.id);
          if (imgObj) {
            // 기존 선택 해제
            canvas.discardActiveObject();

            // 선택만 하고 맨 위로 가져오지 않음
            canvas.setActiveObject(imgObj);
            canvas.renderAll();
            setSelectedElementId(newImage.id);
          }
        }
      }, 500);
    };

    reader.readAsDataURL(file);
  };

  // 배경 이미지 설정 함수
  const handleImageBgSelect = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      const file = e.target.files[0];
      console.log("배경 이미지 파일 선택됨:", file.name, file.type);

      // 이미지 형식 및 크기 검증
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 선택할 수 있습니다.");
        return;
      }

      // 파일 크기 제한 (20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(
          "이미지 파일 크기가 너무 큽니다. 20MB 이하의 파일을 선택해주세요."
        );
        return;
      }

      // URL 생성 및 이미지 로드
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        console.log("이미지 로드 완료, 크기:", img.width, "x", img.height);

        // 배경 정보 객체 생성
        const backgroundInfo = {
          type: "image",
          url: objectUrl,
          file: file,
          width: img.width,
          height: img.height,
          filename: file.name,
        };

        // 에디터 스토어에 배경 정보 설정
        setBackground(backgroundInfo);
        console.log("배경 이미지 설정 완료:", file.name);

        // 파일 선택 필드 초기화
        e.target.value = null;
      };

      img.onerror = () => {
        console.error("이미지 로드 실패:", file.name);
        alert("이미지 로드에 실패했습니다. 다른 이미지를 선택해주세요.");
        e.target.value = null;
      };

      // 이미지 로드 시작
      img.src = objectUrl;
    } catch (error) {
      console.error("배경 이미지 처리 중 오류:", error);
      alert("이미지 처리 중 오류가 발생했습니다.");
    }
  };

  // 배경 이미지 업로드 버튼 클릭 핸들러
  const handleBackgroundImageButtonClick = () => {
    backgroundImageInputRef.current.click();
  };

  // 배경 색상 변경 핸들러
  const handleBackgroundColorChange = (color) => {
    setBackground({ type: "color", value: color });
  };

  // 요소를 위로 이동 핸들러 (시각적으로 위로 = z-index 증가 = 배열에서는 앞으로)
  const handleMoveElementUp = () => {
    if (selectedElementId) {
      // 실제 객체 순서를 변경 (하단으로 옮기면 위로 올라가는 효과)
      if (window.fabricCanvasInstance) {
        const canvas = window.fabricCanvasInstance;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          // Fabric 캔버스에서의 객체 순서 변경
          canvas.bringObjectForward(activeObject);
          canvas.renderAll();

          // 스토어에서 직접 undo/saveState 함수만 호출
          // 요소 순서는 Canvas에서 관리하고, 스토어에는 저장만 함
          saveState();
        }
      }
    }
  };

  // 요소를 아래로 이동 핸들러 (시각적으로 아래로 = z-index 감소 = 배열에서는 뒤로)
  const handleMoveElementDown = () => {
    if (selectedElementId) {
      // 실제 객체 순서를 변경 (위로 옮기면 아래로 내려가는 효과)
      if (window.fabricCanvasInstance) {
        const canvas = window.fabricCanvasInstance;
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          // Fabric 캔버스에서의 객체 순서 변경
          canvas.sendObjectBackwards(activeObject);
          canvas.renderAll();

          // 스토어에서 직접 undo/saveState 함수만 호출
          // 요소 순서는 Canvas에서 관리하고, 스토어에는 저장만 함
          saveState();
        }
      }
    }
  };

  // 요소가 맨 위인지 확인 (z-index 기준에서는 배열의 끝)
  const isElementAtTop = () => {
    if (!selectedElementId) return false;
    const index = elements.findIndex((e) => e.id === selectedElementId);
    return index === elements.length - 1;
  };

  // 요소가 맨 아래인지 확인 (z-index 기준에서는 배열의 시작)
  const isElementAtBottom = () => {
    if (!selectedElementId) return false;
    const index = elements.findIndex((e) => e.id === selectedElementId);
    return index === 0;
  };

  // 히스토리 기능 - Undo/Redo
  const handleUndo = () => {
    console.log("실행 취소");
    undo();
  };

  const handleRedo = () => {
    console.log("다시 실행");
    redo();
  };

  // 선택된 요소 삭제 핸들러
  const handleDelete = () => {
    if (!selectedElementId) return;

    console.log("요소 삭제:", selectedElementId);

    // 캔버스에서 객체 삭제
    if (window.fabricCanvasInstance) {
      const canvas = window.fabricCanvasInstance;
      const objects = canvas.getObjects();
      const obj = objects.find((o) => o.id === selectedElementId);
      if (obj) {
        canvas.remove(obj);
        canvas.renderAll();
      }
    }

    // 스토어에서 요소 삭제
    removeElement(selectedElementId);

    // 상태 저장 (실행 취소/다시 실행용)
    saveState();

    // 선택 해제
    setSelectedElementId(null);
  };

  // 도형 요소 추가 핸들러
  const handleAddShape = () => {
    console.log("도형 추가");
    const id = `shape_${Date.now()}`;

    // addElement 사용하여 도형 추가
    addElement({
      id,
      type: "shape",
      shape: "rectangle", // 현재는 사각형만 지원
      x: 100,
      y: 100,
      width: 150,
      height: 100,
      fill: "#3b82f6", // 파란색
      stroke: "#1d4ed8", // 테두리 색상
      strokeWidth: 0, // 테두리 두께
    });

    // 상태 저장 (실행 취소/다시 실행용)
    saveState();

    // 자동으로 새 요소 선택
    setTimeout(() => {
      if (window.fabricCanvasInstance) {
        const canvas = window.fabricCanvasInstance;
        const objects = canvas.getObjects();
        const shapeObject = objects.find((obj) => obj.id === id);
        if (shapeObject) {
          // 기존 선택 해제
          canvas.discardActiveObject();

          // 선택만 하고 맨 위로 가져오지 않음
          canvas.setActiveObject(shapeObject);
          canvas.renderAll();
          setSelectedElementId(id);
        }
      }
    }, 100);
  };

  // 아이콘 요소 추가 핸들러
  const handleAddIcon = () => {
    const id = `icon_${Date.now()}`;

    // addElement 사용하여 아이콘 추가
    addElement({
      id,
      type: "icon",
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      rotation: 0,
      opacity: 1,
      iconName: "star",
      color: "#f59e0b",
    });

    // 상태 저장 (실행 취소/다시 실행용)
    saveState();
  };

  return (
    <aside className="w-full p-4 flex flex-col">
      {/* 한 줄로 모든 버튼 표시 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-nowrap w-full px-1 py-3 gap-3">
          <button
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-md hover:bg-muted/30 min-w-[70px]"
            onClick={handleImageButtonClick}
          >
            <span className="text-xs">이미지</span>
          </button>
          <input
            type="file"
            ref={imageInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleImageUpload}
          />
          <input
            type="file"
            ref={backgroundImageInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleImageBgSelect}
          />
          <button
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-md hover:bg-muted/30 min-w-[70px]"
            onClick={handleAddText}
          >
            <span className="text-xs">텍스트</span>
          </button>
          <button
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-md hover:bg-muted/30 min-w-[70px]"
            onClick={handleAddShape}
          >
            <span className="text-xs">도형</span>
          </button>
          <button
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-md hover:bg-muted/30 min-w-[70px]"
            onClick={handleAddIcon}
          >
            <span className="text-xs">아이콘</span>
          </button>
          {/* 배경 색상 변경 버튼 */}
          <div className="flex-1 relative min-w-[70px]">
            <input
              type="color"
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              value={
                background && background.type === "color"
                  ? background.value
                  : "#ffffff"
              }
              onChange={(e) =>
                setBackground({ type: "color", value: e.target.value })
              }
            />
            <button className="w-full h-full flex flex-col items-center justify-center p-3 bg-white border rounded-md hover:bg-muted/30">
              <span className="text-xs">배경색</span>
            </button>
          </div>
          {/* 배경 이미지 업로드 버튼 */}
          <button
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-md hover:bg-muted/30 min-w-[70px]"
            onClick={handleBackgroundImageButtonClick}
          >
            <span className="text-xs">배경</span>
          </button>
        </div>

        {/* 선택된 요소 컨트롤 버튼들 */}
        {selectedElementId && (
          <div className="w-full px-1">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 flex items-center justify-center gap-1 py-2"
                onClick={handleMoveElementUp}
                disabled={isElementAtTop()}
                title="선택한 요소를 위로 이동"
              >
                <ChevronUp className="h-4 w-4" />
                <span>위로</span>
              </Button>
              <Button
                variant="secondary"
                className="flex-1 flex items-center justify-center gap-1 py-2"
                onClick={handleMoveElementDown}
                disabled={isElementAtBottom()}
                title="선택한 요소를 아래로 이동"
              >
                <ChevronDown className="h-4 w-4" />
                <span>아래로</span>
              </Button>
              <Button
                variant="destructive"
                className="flex-1 flex items-center justify-center gap-1 py-2"
                onClick={handleDelete}
                title="선택된 요소 삭제"
              >
                <Trash2 className="h-4 w-4" />
                <span>삭제</span>
              </Button>
            </div>
          </div>
        )}

        {/* 히스토리 버튼 추가 */}
        <div className="flex flex-nowrap w-full px-1 py-3 gap-3">
          <button
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-md hover:bg-muted/30 min-w-[70px]"
            onClick={handleUndo}
            disabled={!undoStack || undoStack.length === 0}
            title="실행 취소 (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5 mb-1" />
            <span className="text-xs">실행취소</span>
          </button>
          <button
            className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-md hover:bg-muted/30 min-w-[70px]"
            onClick={handleRedo}
            disabled={!redoStack || redoStack.length === 0}
            title="다시 실행 (Ctrl+Y)"
          >
            <Redo2 className="w-5 h-5 mb-1" />
            <span className="text-xs">다시실행</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
