"use client";

import React, { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editor";
import TextEditor from "./TextEditor";
import ShapeEditor from "./ShapeEditor";

export default function EditorPanel({ canvas, className = "" }) {
  const { selectedElementId, elements } = useEditorStore();
  const [editorType, setEditorType] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);

  // 선택된 요소의 타입에 따라 에디터 타입 결정
  useEffect(() => {
    if (!selectedElementId) {
      setEditorType(null);
      setSelectedElement(null);
      return;
    }

    const element = elements.find((el) => el.id === selectedElementId);
    if (!element) {
      setEditorType(null);
      setSelectedElement(null);
      return;
    }

    setSelectedElement(element);

    if (element.type === "text") {
      setEditorType("text");
    } else if (element.type === "shape") {
      setEditorType("shape");
    } else {
      setEditorType(null);
    }
  }, [selectedElementId, elements]);

  // 편집기 컴포넌트 렌더링
  const renderEditor = () => {
    if (!editorType) {
      return (
        <div className="p-6 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-500">텍스트나 도형을 선택하거나 추가하세요</p>
        </div>
      );
    }

    switch (editorType) {
      case "text":
        return <TextEditor canvas={canvas} className={className} />;
      case "shape":
        return <ShapeEditor canvas={canvas} className={className} />;
      default:
        return (
          <div className="p-6 bg-gray-100 rounded-lg text-center">
            <p className="text-gray-500">지원되지 않는 요소 유형입니다</p>
          </div>
        );
    }
  };

  return <div className="w-full">{renderEditor()}</div>;
}
