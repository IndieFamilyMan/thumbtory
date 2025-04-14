"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/store/editor";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
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
  } = useEditorStore();
  const imageInputRef = useRef(null);
  const backgroundImageInputRef = useRef(null);

  // 선택된 요소 정보 추적
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // 텍스트 요소 추가 핸들러
  const handleAddText = () => {
    // 텍스트 추가 및 옵션 패널 열기
    const newTextElement = addTextElement({
      text: "텍스트를 입력하세요",
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

    console.log("텍스트 요소 생성 완료", {
      id: newTextElement.id,
      text: newTextElement.text,
      properties: newTextElement,
    });

    // New text was added via store, now select it on canvas
    setTimeout(() => {
      if (window.fabricCanvasInstance) {
        const fabricCanvas = window.fabricCanvasInstance;
        const objects = fabricCanvas.getObjects();
        const textObject = objects.find((obj) => obj.id === newTextElement.id);

        if (textObject) {
          // 현재 스타일 설정 적용
          textObject.set({
            fontFamily: "Arial",
            fontSize: 30,
            fill: "#000000",
            fontWeight: "bold",
            fontStyle: "normal",
            underline: false,
            textAlign: "left",
            // 상호작용 속성 명시적 설정
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            editable: true,
            lockMovementX: false,
            lockMovementY: false,
          });

          fabricCanvas.setActiveObject(textObject);
          fabricCanvas.renderAll();

          // Enter edit mode
          setTimeout(() => {
            textObject.enterEditing();
            fabricCanvas.renderAll();
          }, 200);
        } else {
          console.log("텍스트 객체를 찾을 수 없음:", newTextElement.id);
        }
      }
    }, 500);
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

  // 이미지 파일 선택 핸들러
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("이미지 파일 선택됨:", file.name, file.type);

      // 이미지 파일 형식 확인
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 선택할 수 있습니다.");
        return;
      }

      // 파일 크기 제한 (20MB)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        alert(
          "이미지 파일 크기가 너무 큽니다. 20MB 이하의 파일을 선택해주세요."
        );
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const imageDataUrl = event.target.result;
        console.log("이미지 로드 완료, 데이터 길이:", imageDataUrl.length);

        // 이미지 미리 로드하여 크기 확인
        const img = new Image();
        img.onload = () => {
          console.log("이미지 크기 확인:", img.width, "x", img.height);

          // 최적의 크기 계산 (너무 크지 않게)
          let width = img.width;
          let height = img.height;

          const maxDimension = 800;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              const ratio = height / width;
              width = maxDimension;
              height = Math.round(maxDimension * ratio);
            } else {
              const ratio = width / height;
              height = maxDimension;
              width = Math.round(maxDimension * ratio);
            }
            console.log("이미지 크기 조정:", width, "x", height);
          }

          // 이미지 요소 추가
          addElement({
            type: "image",
            x: 100,
            y: 100,
            width: width,
            height: height,
            rotation: 0,
            opacity: 1,
            src: imageDataUrl,
            alt: file.name || "업로드된 이미지",
            objectFit: "cover",
            scaleX: 1,
            scaleY: 1,
          });

          console.log("이미지 요소 추가 완료");
        };

        img.onerror = (error) => {
          console.error("이미지 크기 확인 중 오류:", error);
          alert("이미지 로드 중 오류가 발생했습니다.");
        };

        img.src = imageDataUrl;
      };

      reader.onerror = (error) => {
        console.error("이미지 파일 읽기 오류:", error);
        alert("이미지 파일을 읽는 중 오류가 발생했습니다.");
      };

      reader.readAsDataURL(file);
      // 선택 상태 초기화 (동일한 파일을 다시 선택할 수 있도록)
      e.target.value = null;
    }
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

  // 도형 요소 추가 핸들러
  const handleAddShape = () => {
    // 도형 정보 객체 생성
    const shapeElement = {
      type: "shape",
      shape: "rectangle", // 기본 도형 유형
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      fill: "#3b82f6",
      stroke: "#1d4ed8",
      strokeWidth: 0,
    };

    // 에디터 스토어에 도형 요소 추가
    addElement(shapeElement);

    // 추가된 도형을 캔버스에 직접 그리기 시도
    setTimeout(() => {
      const canvas = window.fabricCanvasInstance;
      if (canvas) {
        try {
          // 마지막에 추가된 요소 ID 가져오기
          const addedElement = useEditorStore.getState().elements.slice(-1)[0];
          if (addedElement && addedElement.type === "shape") {
            console.log("도형 요소 추가 완료:", addedElement.id);

            // 캔버스에서 해당 요소 찾기
            const objects = canvas.getObjects();
            const shapeObject = objects.find(
              (obj) => obj.id === addedElement.id
            );

            if (shapeObject) {
              // 도형 요소 선택
              canvas.setActiveObject(shapeObject);
              canvas.renderAll();
            } else {
              console.error(
                "추가된 도형 요소를 찾을 수 없음:",
                addedElement.id
              );
            }
          }
        } catch (error) {
          console.error("도형 요소 선택 중 오류:", error);
        }
      }
    }, 500);
  };

  // 아이콘 요소 추가 핸들러
  const handleAddIcon = () => {
    addElement({
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
  };

  // 요소를 위로 이동 핸들러 (시각적으로 위로 = z-index 증가 = 배열에서는 앞으로)
  const handleMoveElementUp = () => {
    if (selectedElementId) {
      useEditorStore.getState().moveElementDown(selectedElementId);
    }
  };

  // 요소를 아래로 이동 핸들러 (시각적으로 아래로 = z-index 감소 = 배열에서는 뒤로)
  const handleMoveElementDown = () => {
    if (selectedElementId) {
      useEditorStore.getState().moveElementUp(selectedElementId);
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
                onClick={() => {
                  removeElement(selectedElementId);
                  setSelectedElementId(null);
                }}
                title="선택된 요소 삭제"
              >
                <Trash2 className="h-4 w-4" />
                <span>삭제</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
