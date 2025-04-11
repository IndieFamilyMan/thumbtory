"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useEditorStore } from "@/store/editor";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
  const [showGuide, setShowGuide] = useState(true);

  // 선택된 요소 정보 추적
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // 요소가 추가되면 가이드 메시지 숨기기
  useEffect(() => {
    if (elements.length > 0 || (background && background.type === "image")) {
      setShowGuide(false);
    } else {
      setShowGuide(true);
    }
  }, [elements, background]);

  // 텍스트 요소 추가 핸들러
  const handleAddText = () => {
    // 텍스트 추가 및 옵션 패널 열기
    const newTextElement = addTextElement({
      text: "텍스트를 입력하세요",
      x: 100,
      y: 100,
      width: 200,
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
      textAlign: "left",
    });

    setShowTextOptions(true);

    // 새로 추가된 텍스트 요소를 즉시 선택 및 편집 모드로 전환
    setTimeout(() => {
      const canvas = window.fabricCanvasInstance;
      if (canvas) {
        try {
          // 생성된 텍스트 요소 찾기
          const objects = canvas.getObjects();
          const textObject = objects.find(
            (obj) => obj.id === newTextElement.id
          );

          if (textObject) {
            console.log("새 텍스트 요소 활성화:", newTextElement.id);

            // 기존 선택 객체가 있다면 선택 해제
            canvas.discardActiveObject();

            // 텍스트 요소 맨 앞으로 가져오기
            canvas.bringObjectToFront(textObject);

            // 텍스트 요소 선택
            canvas.setActiveObject(textObject);
            canvas.renderAll();

            // 포커스가 확보된 후 편집 모드 진입 (지연 설정)
            setTimeout(() => {
              try {
                // 텍스트 편집 모드 활성화
                textObject.enterEditing();

                // 히든 텍스트 영역에 포커스 확보
                if (textObject.hiddenTextarea) {
                  textObject.hiddenTextarea.focus();
                }

                // 텍스트 전체 선택
                if (typeof textObject.selectAll === "function") {
                  textObject.selectAll();
                }

                // 캔버스 다시 렌더링
                canvas.renderAll();
              } catch (err) {
                console.error("텍스트 편집 모드 진입 중 오류:", err);
              }
            }, 200); // 시간을 늘려 안정성 확보
          } else {
            console.error("텍스트 요소를 찾을 수 없음:", newTextElement.id);
          }
        } catch (error) {
          console.error("텍스트 요소 편집 모드 설정 중 오류:", error);
        }
      }
    }, 500); // 텍스트 요소가 캔버스에 추가될 충분한 시간 확보
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

  // 배경 이미지 파일 선택 핸들러
  const handleBackgroundImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("배경 이미지 파일 선택됨:", file.name, file.type);

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

        // 이미지 미리 로드하여 크기 확인 및 최적화
        const img = new Image();
        img.onload = () => {
          console.log("배경 이미지 크기 확인:", img.width, "x", img.height);

          // 너무 큰 이미지는 리사이징하여 성능 개선
          let finalImageDataUrl = imageDataUrl;

          // 이미지 크기가 너무 크면 캔버스를 사용해 크기 조정
          if (img.width > 2000 || img.height > 2000) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // 최대 크기 지정 (원래 비율 유지)
            const maxDimension = 2000;
            let newWidth = img.width;
            let newHeight = img.height;

            if (img.width > img.height) {
              // 가로가 더 긴 경우
              newWidth = maxDimension;
              newHeight = Math.round(img.height * (maxDimension / img.width));
            } else {
              // 세로가 더 긴 경우
              newHeight = maxDimension;
              newWidth = Math.round(img.width * (maxDimension / img.height));
            }

            canvas.width = newWidth;
            canvas.height = newHeight;

            // 이미지 그리기
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // 새 이미지 데이터 URL 생성 (JPEG 품질 0.9)
            finalImageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
            console.log("이미지 크기 조정 완료:", newWidth, "x", newHeight);
          }

          // 배경 이미지 설정
          setBackground({
            type: "image",
            value: finalImageDataUrl,
          });

          console.log("배경 이미지 상태 업데이트 완료");
        };

        img.onerror = (error) => {
          console.error("배경 이미지 로드 중 오류:", error);
          alert("이미지 로드 중 오류가 발생했습니다.");
        };

        img.src = imageDataUrl;
      };

      reader.onerror = (error) => {
        console.error("이미지 파일 읽기 오류:", error);
        alert("이미지 파일을 읽는 중 오류가 발생했습니다.");
      };

      reader.readAsDataURL(file);
      e.target.value = null;
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
    addElement({
      type: "shape",
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
      shape: "rectangle",
      fill: "#3b82f6",
      stroke: "#1d4ed8",
      strokeWidth: 0,
    });
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

  return (
    <aside className="w-full p-4 flex flex-col">
      {/* 요소 추가 가이드 메시지 */}
      {showGuide && (
        <div className="mb-3 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
          <p className="text-sm text-muted-foreground">
            요소를 추가하여 디자인을 시작하세요
          </p>
        </div>
      )}

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
            onChange={handleBackgroundImageUpload}
          />
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

        {/* 삭제 버튼을 별도 행에 배치 - 전체 너비로 확장 */}
        {selectedElementId && (
          <div className="w-full px-1">
            <Button
              variant="destructive"
              className="w-full flex items-center justify-center gap-2 py-2"
              onClick={() => {
                removeElement(selectedElementId);
                setSelectedElementId(null);
              }}
              title="선택된 요소 삭제"
            >
              <Trash2 className="h-4 w-4" />
              <span>선택한 요소 삭제</span>
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
