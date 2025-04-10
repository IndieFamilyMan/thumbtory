"use client";

import React from "react";
import { ChevronUp, RotateCw, Type, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TextOptions({ options, onOptionChange, onClose }) {
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

  return (
    <div className="w-full mt-2 p-3 bg-white border rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium flex items-center gap-1">
          <Type className="h-4 w-4" />
          텍스트 스타일
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onClose}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* 글자 크기 설정 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs">글자 크기</label>
            <span className="text-xs">{options.fontSize}px</span>
          </div>
          <input
            type="range"
            value={options.fontSize}
            min={8}
            max={72}
            step={1}
            onChange={(e) =>
              onOptionChange("fontSize", parseInt(e.target.value))
            }
            className="w-full"
          />
        </div>

        {/* 폰트 선택 */}
        <div className="space-y-1">
          <label className="text-xs">폰트</label>
          <select
            value={options.fontFamily}
            onChange={(e) => onOptionChange("fontFamily", e.target.value)}
            className="w-full p-2 text-xs border rounded-md"
          >
            {fontFamilies.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* 글자 색상 */}
        <div className="space-y-1">
          <label className="text-xs flex items-center gap-1">
            <Palette className="h-3 w-3" />
            글자 색상
          </label>
          <div className="flex">
            <input
              type="color"
              value={options.color}
              onChange={(e) => {
                // 색상 변경 시 텍스트 에디터의 포커스가 유지되도록 함
                const activeElement = document.activeElement;
                onOptionChange("color", e.target.value);

                // 포커스가 텍스트 편집 필드에 있었다면 포커스 복원
                if (
                  activeElement &&
                  (activeElement.tagName === "TEXTAREA" ||
                    activeElement.tagName === "INPUT" ||
                    activeElement.getAttribute("contenteditable") === "true")
                ) {
                  setTimeout(() => {
                    activeElement.focus();
                  }, 0);
                }
              }}
              className="h-8 w-8 rounded border p-0 cursor-pointer"
            />
            <input
              type="text"
              value={options.color}
              onChange={(e) => onOptionChange("color", e.target.value)}
              className="flex-1 ml-2 text-xs border rounded px-2"
            />
          </div>
        </div>

        {/* 외곽선 설정 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs">외곽선</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={options.hasStroke}
                onChange={(e) => onOptionChange("hasStroke", e.target.checked)}
                className="mr-1"
              />
              <span className="text-xs ml-1">
                {options.hasStroke ? "켜짐" : "꺼짐"}
              </span>
            </div>
          </div>

          {options.hasStroke && (
            <>
              {/* 외곽선 색상 */}
              <div className="ml-2 mt-2 space-y-1">
                <label className="text-xs">외곽선 색상</label>
                <div className="flex">
                  <input
                    type="color"
                    value={options.strokeColor}
                    onChange={(e) =>
                      onOptionChange("strokeColor", e.target.value)
                    }
                    className="h-8 w-8 rounded border p-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={options.strokeColor}
                    onChange={(e) =>
                      onOptionChange("strokeColor", e.target.value)
                    }
                    className="flex-1 ml-2 text-xs border rounded px-2"
                  />
                </div>
              </div>

              {/* 외곽선 두께 */}
              <div className="ml-2 mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs">외곽선 두께</label>
                  <span className="text-xs">{options.strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  value={options.strokeWidth}
                  min={1}
                  max={10}
                  step={1}
                  onChange={(e) =>
                    onOptionChange("strokeWidth", parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>

        {/* 회전 설정 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs flex items-center gap-1">
              <RotateCw className="h-3 w-3" />
              회전
            </label>
            <span className="text-xs">{options.rotation}°</span>
          </div>
          <input
            type="range"
            value={options.rotation}
            min={0}
            max={360}
            step={5}
            onChange={(e) =>
              onOptionChange("rotation", parseInt(e.target.value))
            }
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
