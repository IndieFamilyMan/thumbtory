"use client";

import { useState, useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editor";

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
    if (selectedElement) {
      removeElement(selectedElement.id);
    }
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
    <aside
      className={`${
        isMobileView
          ? "w-full p-2 bg-background"
          : "w-[300px] border-l p-4 flex flex-col h-[calc(100vh-57px)] overflow-y-auto md:static absolute right-0 bg-background z-10 transition-transform transform sm:transform-none"
      }`}
    >
      {selectedElement ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium text-lg">요소 속성</h2>
            <button
              className="p-1 rounded-md hover:bg-muted"
              onClick={handleDeleteElement}
              title="요소 삭제"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>

          {/* 요소 타입별 속성 패널 */}
          {renderTextProperties()}
          {renderImageProperties()}
          {renderShapeProperties()}
          {/* 아이콘 요소 속성 패널은 필요 시 추가 */}
        </div>
      ) : (
        <div>
          <h2 className="font-medium text-lg mb-4">디자인 설정</h2>

          <div className="bg-muted/20 rounded-lg p-4 mb-6 border border-border">
            <h3 className="font-medium text-sm mb-3 flex items-center">
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
                className="mr-2"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <path d="M3 9h18" />
              </svg>
              배경 설정
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm block mb-2 text-muted-foreground">
                  배경 색상 선택
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    className={`w-8 h-8 rounded-full border-2 ${
                      background.type === "color" &&
                      background.value === "#ffffff"
                        ? "border-primary"
                        : "border-border"
                    }`}
                    style={{ background: "#ffffff" }}
                    onClick={() => handleBackgroundColorChange("#ffffff")}
                  />
                  <button
                    className={`w-8 h-8 rounded-full border-2 ${
                      background.type === "color" &&
                      background.value === "#f8f9fa"
                        ? "border-primary"
                        : "border-border"
                    }`}
                    style={{ background: "#f8f9fa" }}
                    onClick={() => handleBackgroundColorChange("#f8f9fa")}
                  />
                  <button
                    className={`w-8 h-8 rounded-full border-2 ${
                      background.type === "color" &&
                      background.value === "#212529"
                        ? "border-primary"
                        : "border-border"
                    }`}
                    style={{ background: "#212529" }}
                    onClick={() => handleBackgroundColorChange("#212529")}
                  />
                  <button
                    className={`w-8 h-8 rounded-full border-2 ${
                      background.type === "color" &&
                      background.value === "#0d6efd"
                        ? "border-primary"
                        : "border-border"
                    }`}
                    style={{ background: "#0d6efd" }}
                    onClick={() => handleBackgroundColorChange("#0d6efd")}
                  />
                  <button
                    className={`w-8 h-8 rounded-full border-2 ${
                      background.type === "color" &&
                      background.value === "#dc3545"
                        ? "border-primary"
                        : "border-border"
                    }`}
                    style={{ background: "#dc3545" }}
                    onClick={() => handleBackgroundColorChange("#dc3545")}
                  />
                </div>
                <input
                  type="color"
                  className="w-full h-10 p-1 rounded-md border cursor-pointer"
                  value={
                    background.type === "color" ? background.value : "#ffffff"
                  }
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-muted-foreground">
                    배경 이미지
                  </label>
                  {background.type === "image" && (
                    <button
                      className="text-xs text-red-500 hover:underline"
                      onClick={() =>
                        setBackground({ type: "color", value: "#ffffff" })
                      }
                    >
                      제거
                    </button>
                  )}
                </div>

                {background.type === "image" ? (
                  <div className="relative rounded-lg overflow-hidden mb-2 border">
                    <img
                      src={background.value}
                      alt="배경 이미지"
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        className="px-3 py-1 bg-white text-black rounded-md text-sm shadow-md"
                        onClick={handleImageUploadClick}
                      >
                        변경
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 transition-colors"
                    onClick={handleImageUploadClick}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mb-2"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span className="text-sm font-medium">이미지 업로드</span>
                    <span className="text-xs mt-1">
                      또는 여기에 이미지를 끌어다 놓으세요
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </div>

          <div className="bg-muted/20 rounded-lg p-4 border border-border">
            <h3 className="font-medium text-sm mb-3 flex items-center">
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
                className="mr-2"
              >
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              SEO 최적화
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm block mb-1 text-muted-foreground">
                  파일명
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                  placeholder="예: my-blog-thumbnail"
                  value={seo.filename || ""}
                  onChange={handleFilenameChange}
                />
              </div>
              <div>
                <label className="text-sm block mb-1 text-muted-foreground">
                  키워드 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                  placeholder="예: 블로그, 썸네일, 디자인"
                  value={seo.keywords ? seo.keywords.join(", ") : ""}
                  onChange={handleKeywordsChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  검색 노출에 도움이 되는 키워드를 쉼표로 구분하여 입력하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
