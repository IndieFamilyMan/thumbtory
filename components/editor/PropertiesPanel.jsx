"use client";

import { useState, useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editor";
import { PlatformSelector } from "./PlatformSelector";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";

export function PropertiesPanel({ isMobileView = false }) {
  const {
    elements,
    background,
    setBackground,
    updateElement,
    setSeo,
    seo,
    removeElement,
  } = useEditorStore();
  const [selectedElement, setSelectedElement] = useState(null);
  const fileInputRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const [localTextValue, setLocalTextValue] = useState("");

  // 선택된 요소 업데이트 감지
  useEffect(() => {
    const selected = elements.find((el) => el.selected);
    setSelectedElement(selected || null);

    // 선택된 요소가 텍스트인 경우 로컬 상태 업데이트
    if (selected && selected.type === "text") {
      setLocalTextValue(selected.text);
    }
  }, [elements]);

  // 로컬 텍스트 값이 변경될 때 요소 업데이트
  useEffect(() => {
    if (
      selectedElement &&
      selectedElement.type === "text" &&
      localTextValue !== selectedElement.text
    ) {
      updateElement(selectedElement.id, { text: localTextValue });
    }
  }, [localTextValue]);

  // 배경 색상 변경 핸들러
  const handleBackgroundColorChange = (color) => {
    setBackground({ type: "color", value: color });
  };

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  // 파일 선택 후 이미지 업로드 핸들러
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackground({
          type: "image",
          value: event.target.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // 파일명 변경 핸들러
  const handleFilenameChange = (e) => {
    setSeo({ filename: e.target.value });
  };

  // 키워드 변경 핸들러
  const handleKeywordsChange = (e) => {
    const keywords = e.target.value.split(",").map((k) => k.trim());
    setSeo({ keywords });
  };

  // 선택된 요소의 속성 변경 핸들러
  const handleElementPropertyChange = (property, value) => {
    if (selectedElement) {
      updateElement(selectedElement.id, { [property]: value });
    }
  };

  // 요소 삭제 핸들러
  const handleDeleteElement = () => {
    removeElement(selectedElement.id);
  };

  const handleMoveElementUp = () => {
    useEditorStore.getState().moveElementUp(selectedElement.id);
  };

  const handleMoveElementDown = () => {
    useEditorStore.getState().moveElementDown(selectedElement.id);
  };

  // 요소가 맨 위인지 확인
  const isElementAtTop = () => {
    if (!selectedElement) return false;
    const elements = useEditorStore.getState().elements;
    const index = elements.findIndex((e) => e.id === selectedElement.id);
    return index === 0;
  };

  // 요소가 맨 아래인지 확인
  const isElementAtBottom = () => {
    if (!selectedElement) return false;
    const elements = useEditorStore.getState().elements;
    const index = elements.findIndex((e) => e.id === selectedElement.id);
    return index === elements.length - 1;
  };

  // 요소의 현재 순서 정보 텍스트 생성
  const getElementOrderInfo = () => {
    if (!selectedElement) return "";

    const elements = useEditorStore.getState().elements;
    const index = elements.findIndex((e) => e.id === selectedElement.id);
    const total = elements.length;

    if (index === -1) return "";

    // 순서는 1부터 시작하도록 표시 (사용자에게 친숙하게)
    return `레이어 ${total - index}/${total} (${
      index === 0 ? "맨 위" : index === total - 1 ? "맨 아래" : "중간"
    })`;
  };

  // 텍스트 요소 속성 패널 렌더링
  const renderTextProperties = () => {
    if (!selectedElement || selectedElement.type !== "text") return null;

    const textElement = selectedElement;

    return (
      <div className="mb-4">
        <h3 className="font-medium mb-2">텍스트 속성</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm block mb-1">내용</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md text-sm"
              value={localTextValue}
              onChange={(e) => setLocalTextValue(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm block mb-1">글꼴</label>
            <select
              className="w-full px-3 py-2 border rounded-md text-sm"
              value={textElement.fontFamily}
              onChange={(e) =>
                handleElementPropertyChange("fontFamily", e.target.value)
              }
            >
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">크기</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md text-sm"
              value={textElement.fontSize}
              onChange={(e) =>
                handleElementPropertyChange("fontSize", Number(e.target.value))
              }
            />
          </div>
          <div>
            <label className="text-sm block mb-1">정렬</label>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 border rounded-md flex-1 ${
                  textElement.textAlign === "left"
                    ? "bg-primary text-white"
                    : ""
                }`}
                onClick={() => handleElementPropertyChange("textAlign", "left")}
              >
                좌측
              </button>
              <button
                className={`px-3 py-1 border rounded-md flex-1 ${
                  textElement.textAlign === "center"
                    ? "bg-primary text-white"
                    : ""
                }`}
                onClick={() =>
                  handleElementPropertyChange("textAlign", "center")
                }
              >
                중앙
              </button>
              <button
                className={`px-3 py-1 border rounded-md flex-1 ${
                  textElement.textAlign === "right"
                    ? "bg-primary text-white"
                    : ""
                }`}
                onClick={() =>
                  handleElementPropertyChange("textAlign", "right")
                }
              >
                우측
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm block mb-1">색상</label>
            <input
              type="color"
              className="w-full"
              value={textElement.color}
              onChange={(e) =>
                handleElementPropertyChange("color", e.target.value)
              }
            />
          </div>
          <div>
            <label className="text-sm block mb-1">크기 조절</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">
                  너비 (px)
                </label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  min="50"
                  max="1000"
                  value={textElement.width}
                  onChange={(e) =>
                    handleElementPropertyChange("width", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  높이 (px)
                </label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border rounded-md"
                  min="20"
                  max="1000"
                  value={textElement.height}
                  onChange={(e) =>
                    handleElementPropertyChange(
                      "height",
                      Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 이미지 요소 속성 패널 렌더링
  const renderImageProperties = () => {
    if (!selectedElement || selectedElement.type !== "image") return null;

    const imageElement = selectedElement;

    // 이미지 변경 버튼 클릭 핸들러
    const handleChangeImageClick = () => {
      imageFileInputRef.current.click();
    };

    // 이미지 파일 선택 핸들러
    const handleImageFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          handleElementPropertyChange("src", event.target.result);
          handleElementPropertyChange("alt", file.name || "업로드된 이미지");
        };
        reader.readAsDataURL(file);
        // 선택 상태 초기화 (동일한 파일을 다시 선택할 수 있도록)
        e.target.value = null;
      }
    };

    return (
      <div className="mb-4">
        <h3 className="font-medium mb-2">이미지 속성</h3>
        <div className="space-y-3">
          <div>
            <img
              src={imageElement.src}
              alt={imageElement.alt}
              className="w-full h-32 object-contain mb-2 border rounded"
            />
            <button
              className="w-full py-2 px-3 border rounded-md text-sm bg-blue-50 hover:bg-blue-100 mb-2"
              onClick={handleChangeImageClick}
            >
              이미지 변경
            </button>
            <input
              type="file"
              ref={imageFileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageFileSelect}
            />
          </div>
          <div>
            <label className="text-sm block mb-1">대체 텍스트 (ALT)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md text-sm"
              value={imageElement.alt}
              onChange={(e) =>
                handleElementPropertyChange("alt", e.target.value)
              }
            />
          </div>
          <div>
            <label className="text-sm block mb-1">이미지 맞춤</label>
            <select
              className="w-full px-3 py-2 border rounded-md text-sm"
              value={imageElement.objectFit}
              onChange={(e) =>
                handleElementPropertyChange("objectFit", e.target.value)
              }
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">투명도</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              className="w-full"
              value={imageElement.opacity}
              onChange={(e) =>
                handleElementPropertyChange("opacity", Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>
    );
  };

  // 도형 요소 속성 패널 렌더링
  const renderShapeProperties = () => {
    if (!selectedElement || selectedElement.type !== "shape") return null;

    const shapeElement = selectedElement;

    return (
      <div className="mb-4">
        <h3 className="font-medium mb-2">도형 속성</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm block mb-1">모양</label>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 border rounded-md flex-1 ${
                  shapeElement.shape === "rectangle"
                    ? "bg-primary text-white"
                    : ""
                }`}
                onClick={() =>
                  handleElementPropertyChange("shape", "rectangle")
                }
              >
                사각형
              </button>
              <button
                className={`px-3 py-1 border rounded-md flex-1 ${
                  shapeElement.shape === "circle" ? "bg-primary text-white" : ""
                }`}
                onClick={() => handleElementPropertyChange("shape", "circle")}
              >
                원형
              </button>
              <button
                className={`px-3 py-1 border rounded-md flex-1 ${
                  shapeElement.shape === "triangle"
                    ? "bg-primary text-white"
                    : ""
                }`}
                onClick={() => handleElementPropertyChange("shape", "triangle")}
              >
                삼각형
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm block mb-1">채우기 색상</label>
            <input
              type="color"
              className="w-full"
              value={shapeElement.backgroundColor || "#3b82f6"}
              onChange={(e) =>
                handleElementPropertyChange("backgroundColor", e.target.value)
              }
            />
          </div>
          <div>
            <label className="text-sm block mb-1">테두리 색상</label>
            <input
              type="color"
              className="w-full"
              value={shapeElement.borderColor || "#1d4ed8"}
              onChange={(e) =>
                handleElementPropertyChange("borderColor", e.target.value)
              }
            />
          </div>
          <div>
            <label className="text-sm block mb-1">테두리 너비</label>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              className="w-full"
              value={shapeElement.borderWidth || 0}
              onChange={(e) =>
                handleElementPropertyChange(
                  "borderWidth",
                  Number(e.target.value)
                )
              }
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>없음</span>
              <span>10px</span>
            </div>
          </div>
          <div>
            <label className="text-sm block mb-1">투명도</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              className="w-full"
              value={shapeElement.opacity || 1}
              onChange={(e) =>
                handleElementPropertyChange("opacity", Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-card p-4 ${
        isMobileView
          ? "w-full h-full overflow-y-auto"
          : "h-full border-l overflow-y-auto"
      }`}
    >
      <PlatformSelector />

      <div className="mb-4">
        <h3 className="font-medium mb-2">일반 속성</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm block mb-1">파일명</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md text-sm"
              value={seo.filename}
              onChange={handleFilenameChange}
              placeholder="파일명을 입력하세요"
            />
          </div>
          <div>
            <label className="text-sm block mb-1">키워드</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md text-sm"
              value={seo.keywords?.join(", ")}
              onChange={handleKeywordsChange}
              placeholder="키워드를 쉼표로 구분하여 입력하세요"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">배경</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm block mb-1">배경 색상</label>
            <input
              type="color"
              className="w-full"
              value={background.type === "color" ? background.value : "#ffffff"}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm block mb-1">배경 이미지</label>
            <button
              className="w-full px-3 py-2 border rounded-md text-sm hover:bg-muted transition-colors"
              onClick={handleImageUploadClick}
            >
              이미지 업로드
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        </div>
      </div>

      {selectedElement && (
        <div className="mb-4">
          <h3 className="font-medium mb-2">요소 속성</h3>
          {selectedElement.type === "text" && renderTextProperties()}
          {selectedElement.type === "image" && renderImageProperties()}
          {selectedElement.type === "shape" && renderShapeProperties()}
          <div className="mt-4">
            <div className="text-center mb-2 text-xs text-muted-foreground">
              {getElementOrderInfo()}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center justify-center"
                onClick={handleMoveElementUp}
                title="위로 이동"
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                위로
              </button>
              <button
                className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center justify-center"
                onClick={handleMoveElementDown}
                title="아래로 이동"
              >
                <ChevronDown className="w-4 h-4 mr-1" />
                아래로
              </button>
              <button
                className="w-full px-3 py-2 bg-destructive text-destructive-foreground rounded-md text-sm flex items-center justify-center"
                onClick={handleDeleteElement}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
