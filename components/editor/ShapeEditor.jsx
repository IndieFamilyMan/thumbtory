"use client";

import React, { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editor";
import {
  Square,
  Circle,
  Triangle,
  CornerDownRight,
  PenTool,
  Paintbrush,
  Maximize2,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShapeEditor({
  canvas,
  onShapeUpdated,
  className = "",
}) {
  const { selectedElementId, updateElementProperty, saveState } =
    useEditorStore();

  const [shapeType, setShapeType] = useState("rectangle");
  const [fillColor, setFillColor] = useState("#3b82f6");
  const [strokeColor, setStrokeColor] = useState("#1d4ed8");
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);

  // 전역 canvas 인스턴스 참조를 위한 상태
  const [localCanvas, setLocalCanvas] = useState(null);

  // canvas prop이 없으면 전역 인스턴스를 사용
  useEffect(() => {
    if (canvas) {
      setLocalCanvas(canvas);
    } else if (window.fabricCanvasInstance) {
      setLocalCanvas(window.fabricCanvasInstance);
    }
  }, [canvas]);

  // canvas prop이 변경되면 localCanvas 업데이트
  useEffect(() => {
    if (canvas) {
      setLocalCanvas(canvas);
    }
  }, [canvas]);

  // 선택된 도형 객체를 가져오는 유틸리티 함수
  const getSelectedShapeObject = () => {
    if (!localCanvas) return null;

    const activeObject = localCanvas.getActiveObject();
    if (activeObject && activeObject.customType === "shape") {
      return activeObject;
    }
    return null;
  };

  // 현재 선택된 요소가 도형인지 확인하고 컨트롤 업데이트
  useEffect(() => {
    if (!localCanvas) return;

    const handleSelectionCreated = (options) => {
      const selectedObject = options.selected?.[0];
      if (selectedObject && selectedObject.customType === "shape") {
        updateShapeControls(selectedObject);
      }
    };

    const handleSelectionUpdated = (options) => {
      const selectedObject = options.selected?.[0];
      if (selectedObject && selectedObject.customType === "shape") {
        updateShapeControls(selectedObject);
      }
    };

    const handleObjectModified = (e) => {
      const target = e.target;
      if (target && target.customType === "shape") {
        updateShapeControls(target);

        // 객체가 수정되면 스토어에 변경 사항 저장
        if (target.id) {
          if (target.width !== undefined)
            updateElementProperty(
              target.id,
              "width",
              target.width * target.scaleX
            );
          if (target.height !== undefined)
            updateElementProperty(
              target.id,
              "height",
              target.height * target.scaleY
            );
          if (target.left !== undefined)
            updateElementProperty(target.id, "x", target.left);
          if (target.top !== undefined)
            updateElementProperty(target.id, "y", target.top);
          if (target.angle !== undefined)
            updateElementProperty(target.id, "rotation", target.angle);
          saveState();
        }
      }
    };

    localCanvas.on("selection:created", handleSelectionCreated);
    localCanvas.on("selection:updated", handleSelectionUpdated);
    localCanvas.on("object:modified", handleObjectModified);

    return () => {
      localCanvas.off("selection:created", handleSelectionCreated);
      localCanvas.off("selection:updated", handleSelectionUpdated);
      localCanvas.off("object:modified", handleObjectModified);
    };
  }, [localCanvas, updateElementProperty, saveState]);

  // 도형 컨트롤 업데이트
  const updateShapeControls = (shapeObject) => {
    if (!shapeObject) return;

    setShapeType(shapeObject.shape || "rectangle");
    setFillColor(shapeObject.fill || "#3b82f6");
    setStrokeColor(shapeObject.stroke || "#1d4ed8");
    setStrokeWidth(
      shapeObject.strokeWidth !== undefined ? shapeObject.strokeWidth : 0
    );
    setOpacity(shapeObject.opacity !== undefined ? shapeObject.opacity : 1);

    // 크기 정보 업데이트 (크기에 스케일 값 적용)
    if (shapeObject.width !== undefined && shapeObject.scaleX !== undefined) {
      setWidth(Math.round(shapeObject.width * shapeObject.scaleX));
    }

    if (shapeObject.height !== undefined && shapeObject.scaleY !== undefined) {
      setHeight(Math.round(shapeObject.height * shapeObject.scaleY));
    }
  };

  // 색상 변경 핸들러
  const handleFillColorChange = (e) => {
    const newColor = e.target.value;
    setFillColor(newColor);

    const shapeObject = getSelectedShapeObject();
    if (shapeObject) {
      shapeObject.set("fill", newColor);
      localCanvas.renderAll();

      if (shapeObject.id) {
        updateElementProperty(shapeObject.id, "fill", newColor);
      }
    }
  };

  // 테두리 색상 변경 핸들러
  const handleStrokeColorChange = (e) => {
    const newColor = e.target.value;
    setStrokeColor(newColor);

    const shapeObject = getSelectedShapeObject();
    if (shapeObject) {
      shapeObject.set("stroke", newColor);
      localCanvas.renderAll();

      if (shapeObject.id) {
        updateElementProperty(shapeObject.id, "stroke", newColor);
      }
    }
  };

  // 테두리 두께 변경 핸들러
  const handleStrokeWidthChange = (e) => {
    const newWidth = parseInt(e.target.value, 10);
    setStrokeWidth(newWidth);

    const shapeObject = getSelectedShapeObject();
    if (shapeObject) {
      shapeObject.set("strokeWidth", newWidth);
      localCanvas.renderAll();

      if (shapeObject.id) {
        updateElementProperty(shapeObject.id, "strokeWidth", newWidth);
      }
    }
  };

  // 투명도 변경 핸들러
  const handleOpacityChange = (e) => {
    const newOpacity = parseFloat(e.target.value);
    setOpacity(newOpacity);

    const shapeObject = getSelectedShapeObject();
    if (shapeObject) {
      shapeObject.set("opacity", newOpacity);
      localCanvas.renderAll();

      if (shapeObject.id) {
        updateElementProperty(shapeObject.id, "opacity", newOpacity);
      }
    }
  };

  // 너비 변경 핸들러
  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value, 10);
    setWidth(newWidth);

    const shapeObject = getSelectedShapeObject();
    if (shapeObject && shapeObject.width) {
      const originalWidth = shapeObject.width;
      const scale = newWidth / originalWidth;

      shapeObject.set({
        scaleX: scale,
      });
      localCanvas.renderAll();

      if (shapeObject.id) {
        updateElementProperty(shapeObject.id, "width", newWidth);
      }
    }
  };

  // 높이 변경 핸들러
  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value, 10);
    setHeight(newHeight);

    const shapeObject = getSelectedShapeObject();
    if (shapeObject && shapeObject.height) {
      const originalHeight = shapeObject.height;
      const scale = newHeight / originalHeight;

      shapeObject.set({
        scaleY: scale,
      });
      localCanvas.renderAll();

      if (shapeObject.id) {
        updateElementProperty(shapeObject.id, "height", newHeight);
      }
    }
  };

  return (
    <div className={cn("font-sans", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 p-6 bg-gray-100 rounded-lg">
        {/* 도형 색상 */}
        <div className="space-y-2.5 p-2">
          <label htmlFor="fill-color" className="text-sm font-medium block">
            도형 색상:
          </label>
          <input
            type="color"
            id="fill-color"
            value={fillColor}
            onChange={handleFillColorChange}
            className="h-10 w-full cursor-pointer rounded-md border border-input"
          />
        </div>

        {/* 테두리 색상 */}
        <div className="space-y-2.5 p-2">
          <label htmlFor="stroke-color" className="text-sm font-medium block">
            테두리 색상:
          </label>
          <input
            type="color"
            id="stroke-color"
            value={strokeColor}
            onChange={handleStrokeColorChange}
            className="h-10 w-full cursor-pointer rounded-md border border-input"
          />
        </div>

        {/* 테두리 두께 */}
        <div className="space-y-2.5 p-2">
          <label htmlFor="stroke-width" className="text-sm font-medium block">
            테두리 두께:
          </label>
          <input
            type="range"
            id="stroke-width"
            min="0"
            max="20"
            step="1"
            value={strokeWidth}
            onChange={handleStrokeWidthChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{strokeWidth}</span>
            <span>20</span>
          </div>
        </div>

        {/* 투명도 */}
        <div className="space-y-2.5 p-2">
          <label htmlFor="opacity" className="text-sm font-medium block">
            투명도:
          </label>
          <input
            type="range"
            id="opacity"
            min="0.1"
            max="1"
            step="0.1"
            value={opacity}
            onChange={handleOpacityChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.1</span>
            <span>{opacity.toFixed(1)}</span>
            <span>1.0</span>
          </div>
        </div>

        {/* 크기 조절 */}
        <div className="space-y-2.5 p-2">
          <label htmlFor="width" className="text-sm font-medium block">
            너비:
          </label>
          <input
            type="number"
            id="width"
            min="10"
            max="1000"
            value={width}
            onChange={handleWidthChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2.5 p-2">
          <label htmlFor="height" className="text-sm font-medium block">
            높이:
          </label>
          <input
            type="number"
            id="height"
            min="10"
            max="1000"
            value={height}
            onChange={handleHeightChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
