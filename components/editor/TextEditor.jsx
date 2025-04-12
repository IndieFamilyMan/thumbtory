"use client";

import React, { useEffect, useRef, useState } from "react";
import { Textbox } from "fabric";
import { useEditorStore } from "@/store/editor";
import styles from "./TextEditor.module.css";
import { Type, TextCursorInput } from "lucide-react";

export default function TextEditor({ canvas, onTextUpdated, className = "" }) {
  const {
    selectedElementId,
    updateElementProperty,
    saveState,
    addTextElement,
  } = useEditorStore();

  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(30);
  const [fontColor, setFontColor] = useState("#000000");
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState("left");

  // 옵션 변경 추적 및 자동 적용을 위한 상태
  const [optionsUpdated, setOptionsUpdated] = useState(false);

  // Font family options
  const fontFamilies = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Tahoma",
    "Noto Sans KR",
  ];

  // 전역 canvas 인스턴스 참조를 위한 상태 추가
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
      // 캔버스가 드로잉 모드에 있을 경우 비활성화
      if (canvas.isDrawingMode) {
        canvas.isDrawingMode = false;
        canvas.renderAll();
      }
    }
  }, [canvas]);

  // 만약 localCanvas가 없고 window.fabricCanvasInstance가 있다면 업데이트하는 간격 설정
  useEffect(() => {
    if (!localCanvas) {
      const intervalId = setInterval(() => {
        if (window.fabricCanvasInstance) {
          const canvas = window.fabricCanvasInstance;
          // 드로잉 모드 비활성화
          if (canvas.isDrawingMode) {
            canvas.isDrawingMode = false;
            canvas.renderAll();
          }
          setLocalCanvas(canvas);
          clearInterval(intervalId);
        }
      }, 300);

      return () => clearInterval(intervalId);
    }
  }, [localCanvas]);

  // 옵션 상태가 변경될 때마다 선택된 객체에 적용
  useEffect(() => {
    // 옵션이 변경되었음을 표시
    setOptionsUpdated(true);

    // 선택된 텍스트 객체에 설정 적용
    applyCurrentSettingsToSelected();
  }, [
    fontFamily,
    fontSize,
    fontColor,
    isBold,
    isItalic,
    isUnderline,
    textAlign,
  ]);

  // 현재 에디터 설정을 선택된 객체에 적용
  const applyCurrentSettingsToSelected = () => {
    if (!localCanvas) return;

    const textObject = getSelectedTextObject();
    if (!textObject) return;

    // 모든 설정 적용
    textObject.set({
      fontFamily: fontFamily,
      fontSize: fontSize,
      fill: fontColor,
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
      underline: isUnderline,
      textAlign: textAlign,
    });

    // 캔버스 렌더링
    localCanvas.renderAll();

    // 스토어에 변경된 속성 저장
    if (textObject.id) {
      updateElementProperty(textObject.id, "fontFamily", fontFamily);
      updateElementProperty(textObject.id, "fontSize", fontSize);
      updateElementProperty(textObject.id, "fill", fontColor);
      updateElementProperty(textObject.id, "color", fontColor);
      updateElementProperty(
        textObject.id,
        "fontWeight",
        isBold ? "bold" : "normal"
      );
      updateElementProperty(
        textObject.id,
        "fontStyle",
        isItalic ? "italic" : "normal"
      );
      updateElementProperty(textObject.id, "underline", isUnderline);
      updateElementProperty(textObject.id, "textAlign", textAlign);
    }
  };

  // Add text to canvas
  const handleAddText = () => {
    const currentCanvas = localCanvas;
    if (!currentCanvas) {
      console.warn("Canvas not available. Using store method instead.");
      // Use the store method as fallback
      const newTextElement = addTextElement({
        text: "텍스트를 입력하세요",
        x: 100,
        y: 100,
        width: 300, // 텍스트 너비를 더 넓게 설정
        fontSize: fontSize,
        fontFamily: fontFamily,
        fill: fontColor,
        textAlign: textAlign,
        fontWeight: isBold ? "bold" : "normal",
        fontStyle: isItalic ? "italic" : "normal",
        underline: isUnderline,
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

      console.log("TextEditor: 스토어 메서드로 텍스트 객체 생성 완료", {
        id: newTextElement.id,
        text: newTextElement.text,
        properties: newTextElement,
      });

      // New text was added via store, now select it on canvas
      setTimeout(() => {
        if (window.fabricCanvasInstance) {
          const fabricCanvas = window.fabricCanvasInstance;
          const objects = fabricCanvas.getObjects();
          const textObject = objects.find(
            (obj) => obj.id === newTextElement.id
          );

          if (textObject) {
            // 현재 스타일 설정 적용
            textObject.set({
              fontFamily: fontFamily,
              fontSize: fontSize,
              fill: fontColor,
              fontWeight: isBold ? "bold" : "normal",
              fontStyle: isItalic ? "italic" : "normal",
              underline: isUnderline,
              textAlign: textAlign,
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
          }
        }
      }, 500);

      return;
    }

    try {
      const id = `text_${Date.now()}`;

      // Textbox를 사용하여 더 나은 텍스트 렌더링 및 자동 줄바꿈 지원
      const newText = new Textbox("텍스트를 입력하세요", {
        left: 100,
        top: 100,
        fontFamily: fontFamily,
        fontSize: fontSize,
        fill: fontColor,
        fontWeight: isBold ? "bold" : "normal",
        fontStyle: isItalic ? "italic" : "normal",
        underline: isUnderline,
        textAlign: textAlign,
        id: id,
        customType: "text",
        width: 300, // 텍스트 너비를 더 넓게 설정
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
        lockUniScaling: false,
        hasRotatingPoint: true,
        objectCaching: false, // 이동 시 해상도 유지를 위해 캐싱 비활성화
        hoverCursor: "pointer",
        moveCursor: "text",
        cornerColor: "#0084ff",
        borderColor: "#0084ff",
        cornerSize: 8,
        transparentCorners: false,
        originX: "left",
        originY: "top",
        padding: 10, // 패딩 증가
        centeredScaling: false,
        centeredRotation: true,
        splitByGrapheme: false, // 글자 단위 분할 비활성화
        breakWords: true, // 단어 단위 줄바꿈 활성화
        charSpacing: 0, // 글자 간격
        lineHeight: 1.2, // 줄 높이
        minWidth: 20, // 최소 너비
        fixedWidth: true, // 너비 고정 - 자동 줄바꿈 보장
        // 텍스트 렌더링 품질 개선 설정
        cacheProperties: [
          "fill",
          "stroke",
          "strokeWidth",
          "width",
          "height",
          "strokeDashArray",
          "strokeLineCap",
          "strokeDashOffset",
          "strokeLineJoin",
          "strokeMiterLimit",
          "fontSize",
          "fontWeight",
          "fontFamily",
          "fontStyle",
          "lineHeight",
          "underline",
          "overline",
          "linethrough",
          "textAlign",
          "text",
          "charSpacing",
          "styles",
          "direction",
          "path",
          "pathStartOffset",
          "pathSide",
        ],
        noScaleCache: true, // 스케일링 시 캐시 사용 비활성화
        // 텍스트 렌더링 안티앨리어싱 개선 설정
        statefullCache: true,
        strokeUniform: true,
        miterLimit: 10, // 텍스트 모서리 부드럽게 처리
        paintFirst: "fill",
        shadow: null, // 그림자 효과 제거 (텍스트 선명도 향상)
        textRendering: "optimizeLegibility", // 텍스트 렌더링 최적화
      });

      console.log("TextEditor: 새 텍스트 객체 생성 완료", {
        id,
        selectable: newText.selectable,
        evented: newText.evented,
        hasControls: newText.hasControls,
        hasBorders: newText.hasBorders,
        editable: newText.editable,
      });

      currentCanvas.add(newText);
      currentCanvas.setActiveObject(newText);
      updateTextControls(newText);
      currentCanvas.renderAll();

      // Update the store with the new text element - 정확히 동일한 속성으로
      addTextElement({
        id: id,
        text: "텍스트를 입력하세요",
        x: 100,
        y: 100,
        width: 300, // 텍스트 너비를 더 넓게 설정
        fontSize: fontSize,
        fontFamily: fontFamily,
        fill: fontColor,
        textAlign: textAlign,
        fontWeight: isBold ? "bold" : "normal",
        fontStyle: isItalic ? "italic" : "normal",
        underline: isUnderline,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        editable: true,
        lockMovementX: false,
        lockMovementY: false,
        padding: 10, // 패딩 증가
        splitByGrapheme: false, // 글자 단위 분할 비활성화
        // 텍스트 렌더링 품질 개선 설정
        objectCaching: false, // 이동 시 해상도 유지를 위해 캐싱 비활성화
        noScaleCache: true,
        statefullCache: true,
        strokeUniform: true,
        miterLimit: 10,
        paintFirst: "fill",
        shadow: null, // 그림자 효과 제거
        textRendering: "optimizeLegibility", // 텍스트 렌더링 최적화
      });

      // Automatically enter edit mode
      setTimeout(() => {
        try {
          newText.enterEditing();
          if (newText.hiddenTextarea) {
            newText.hiddenTextarea.focus();
          }
          // 텍스트 객체 크기 자동 조정
          newText.set({
            width: Math.max(300, newText.width + 50), // 기본 너비보다 최소 50px 더 크게
          });
          currentCanvas.renderAll();
        } catch (err) {
          console.error("텍스트 편집 모드 진입 중 오류:", err);
        }
      }, 100);
    } catch (error) {
      console.error("텍스트 추가 중 오류:", error);
    }
  };

  // 선택된 텍스트 객체를 가져오는 유틸리티 함수
  const getSelectedTextObject = () => {
    if (!localCanvas) return null;

    const activeObject = localCanvas.getActiveObject();
    if (
      activeObject &&
      (activeObject.type === "i-text" || activeObject.type === "textbox")
    ) {
      return activeObject;
    }
    return null;
  };

  // Bring selected object forward
  const handleBringForward = () => {
    if (!localCanvas) return;

    const activeObject = localCanvas.getActiveObject();
    if (activeObject) {
      localCanvas.bringForward(activeObject);
      localCanvas.renderAll();
      saveState();
    }
  };

  // Send selected object backward
  const handleSendBackward = () => {
    if (!localCanvas) return;

    const activeObject = localCanvas.getActiveObject();
    if (activeObject) {
      localCanvas.sendBackwards(activeObject);
      localCanvas.renderAll();
      saveState();
    }
  };

  // Clear canvas
  const handleClearCanvas = () => {
    if (!localCanvas) return;

    localCanvas.clear();
    localCanvas.renderAll();
    saveState();
  };

  // Handle text content change
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);

    const textObject = getSelectedTextObject();
    if (textObject) {
      textObject.set("text", newText);
      localCanvas.renderAll();

      if (textObject.id) {
        updateElementProperty(textObject.id, "text", newText);
      }
    }
  };

  // Handle font family change
  const handleFontFamilyChange = (e) => {
    const newFontFamily = e.target.value;
    setFontFamily(newFontFamily);

    const textObject = getSelectedTextObject();
    if (textObject) {
      textObject.set("fontFamily", newFontFamily);
      localCanvas.renderAll();

      if (textObject.id) {
        updateElementProperty(textObject.id, "fontFamily", newFontFamily);
      }
    }
  };

  // Handle font size change
  const handleFontSizeChange = (e) => {
    const newFontSize = parseInt(e.target.value, 10);
    setFontSize(newFontSize);

    const textObject = getSelectedTextObject();
    if (textObject) {
      textObject.set("fontSize", newFontSize);
      localCanvas.renderAll();

      if (textObject.id) {
        updateElementProperty(textObject.id, "fontSize", newFontSize);
      }
    }
  };

  // Handle font color change
  const handleFontColorChange = (e) => {
    const newColor = e.target.value;
    setFontColor(newColor);

    const textObject = getSelectedTextObject();
    if (textObject) {
      textObject.set("fill", newColor);
      localCanvas.renderAll();

      if (textObject.id) {
        updateElementProperty(textObject.id, "fill", newColor);
        updateElementProperty(textObject.id, "color", newColor);
      }
    }
  };

  // Handle text alignment change
  const handleTextAlignChange = (align) => {
    setTextAlign(align);

    const textObject = getSelectedTextObject();
    if (textObject) {
      textObject.set("textAlign", align);
      localCanvas.renderAll();

      if (textObject.id) {
        updateElementProperty(textObject.id, "textAlign", align);
      }
    }
  };

  // Toggle bold text
  const handleToggleBold = () => {
    const newBoldState = !isBold;
    setIsBold(newBoldState);

    const textObject = getSelectedTextObject();
    if (textObject) {
      textObject.set("fontWeight", newBoldState ? "bold" : "normal");
      localCanvas.renderAll();

      if (textObject.id) {
        updateElementProperty(
          textObject.id,
          "fontWeight",
          newBoldState ? "bold" : "normal"
        );
      }
    }
  };

  // Toggle italic text
  const handleToggleItalic = () => {
    const newItalicState = !isItalic;
    setIsItalic(newItalicState);

    const textObject = getSelectedTextObject();
    if (textObject) {
      textObject.set("fontStyle", newItalicState ? "italic" : "normal");
      localCanvas.renderAll();

      if (textObject.id) {
        updateElementProperty(
          textObject.id,
          "fontStyle",
          newItalicState ? "italic" : "normal"
        );
      }
    }
  };

  // Toggle underline text
  const handleToggleUnderline = () => {
    const newUnderlineState = !isUnderline;
    setIsUnderline(newUnderlineState);

    const textObject = getSelectedTextObject();
    if (textObject) {
      textObject.set("underline", newUnderlineState);
      localCanvas.renderAll();

      if (textObject.id) {
        updateElementProperty(textObject.id, "underline", newUnderlineState);
      }
    }
  };

  // Update text controls based on selected object
  const updateTextControls = (textObject) => {
    if (
      textObject &&
      (textObject.type === "i-text" || textObject.type === "textbox")
    ) {
      setText(textObject.text || "");
      setFontFamily(textObject.fontFamily || "Arial");
      setFontSize(textObject.fontSize || 20);
      setFontColor(textObject.fill || "#000000");
      setIsBold(textObject.fontWeight === "bold");
      setIsItalic(textObject.fontStyle === "italic");
      setIsUnderline(textObject.underline || false);
      setTextAlign(textObject.textAlign || "left");
    }
  };

  // 선택된 객체 변경 시 텍스트 컨트롤 업데이트
  useEffect(() => {
    if (!localCanvas) return;

    console.log("TextEditor: 캔버스 이벤트 리스너 설정");

    // 마우스 다운 이벤트에 로그 추가
    const handleMouseDown = (e) => {
      console.log("TextEditor: 캔버스 mouse:down 이벤트 발생", {
        target: e.target ? `${e.target.type} (id: ${e.target.id})` : "없음",
        pointer: e.pointer,
        button: e.button,
      });

      // 텍스트 객체에 대한 상호작용 속성 확인 및 수정
      if (
        e.target &&
        (e.target.type === "i-text" || e.target.type === "textbox")
      ) {
        // 선택된 텍스트 객체의 상호작용 속성 확인
        console.log("TextEditor: 텍스트 객체 상호작용 속성 확인", {
          id: e.target.id,
          selectable: e.target.selectable,
          evented: e.target.evented,
          hasControls: e.target.hasControls,
          editable: e.target.editable,
          lockMovementX: e.target.lockMovementX,
          lockMovementY: e.target.lockMovementY,
        });

        // 필요한 경우 상호작용 속성 강제 설정
        if (!e.target.selectable || !e.target.evented) {
          console.log("TextEditor: 텍스트 객체 상호작용 속성 강제 수정");
          e.target.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            editable: true,
            lockMovementX: false,
            lockMovementY: false,
          });
          localCanvas.renderAll();
        }
      }
    };

    // 객체 선택 시도 시 로그 추가
    const handleBeforeSelection = (e) => {
      console.log("TextEditor: 객체 선택 시도 (before:selection)", {
        target: e.target ? `${e.target.type} (id: ${e.target.id})` : "없음",
      });
    };

    const handleSelectionCreated = (options) => {
      console.log("TextEditor: selection:created 이벤트 발생", {
        selected: options.selected
          ? options.selected.map((obj) => `${obj.type} (id: ${obj.id})`)
          : "없음",
      });

      if (options.selected && options.selected[0]) {
        const selectedObject = options.selected[0];

        // 텍스트 객체의 상호작용 속성 확인 및 수정
        if (
          selectedObject.type === "i-text" ||
          selectedObject.type === "textbox"
        ) {
          // 선택된 텍스트 객체의 상호작용 속성 설정
          selectedObject.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
            editable: true,
            lockMovementX: false,
            lockMovementY: false,
          });
          localCanvas.renderAll();
        }

        updateTextControls(selectedObject);
      }
    };

    const handleSelectionUpdated = (options) => {
      console.log("TextEditor: selection:updated 이벤트 발생", {
        selected: options.selected
          ? options.selected.map((obj) => `${obj.type} (id: ${obj.id})`)
          : "없음",
      });

      if (options.selected && options.selected[0]) {
        updateTextControls(options.selected[0]);
      }
    };

    const handleSelectionCleared = (e) => {
      console.log("TextEditor: selection:cleared 이벤트 발생");
      // 선택 해제 시 마지막 상태 유지 (새 텍스트 추가 시 이 설정 사용)
      // 상태는 유지하지만 UI에 활성 상태 표시는 안함

      // 선택 해제 후에도 모든 텍스트 객체가 선택 가능하도록 유지
      if (localCanvas) {
        localCanvas.getObjects().forEach((obj) => {
          if (obj.type === "i-text" || obj.type === "textbox") {
            obj.set({
              selectable: true,
              evented: true,
            });
          }
        });
        localCanvas.renderAll();
      }
    };

    // 객체 수정 시 실시간 업데이트
    const handleObjectModified = (e) => {
      console.log("TextEditor: object:modified 이벤트 발생", {
        target: e.target ? `${e.target.type} (id: ${e.target.id})` : "없음",
      });

      if (
        e.target &&
        (e.target.type === "i-text" || e.target.type === "textbox")
      ) {
        updateTextControls(e.target);
      }
    };

    // 텍스트 변경 시 실시간 업데이트
    const handleTextChanged = (e) => {
      console.log("TextEditor: text:changed 이벤트 발생", {
        target: e.target ? `${e.target.type} (id: ${e.target.id})` : "없음",
        text: e.target ? e.target.text : "없음",
      });

      if (
        e.target &&
        (e.target.type === "i-text" || e.target.type === "textbox")
      ) {
        // 텍스트 내용만 업데이트 (다른 속성은 유지)
        setText(e.target.text || "");

        // 스토어 상태 업데이트
        if (e.target.id) {
          updateElementProperty(e.target.id, "text", e.target.text);
        }
      }
    };

    // 캔버스 전체 상태 로깅
    console.log(
      "TextEditor: 현재 캔버스 객체 목록",
      localCanvas.getObjects().map((obj) => ({
        type: obj.type,
        id: obj.id,
        selectable: obj.selectable,
        evented: obj.evented,
        visible: obj.visible,
      }))
    );

    localCanvas.on("mouse:down", handleMouseDown);
    localCanvas.on("before:selection:cleared", handleBeforeSelection);
    localCanvas.on("selection:created", handleSelectionCreated);
    localCanvas.on("selection:updated", handleSelectionUpdated);
    localCanvas.on("selection:cleared", handleSelectionCleared);
    localCanvas.on("object:modified", handleObjectModified);
    localCanvas.on("text:changed", handleTextChanged);

    // Cleanup
    return () => {
      console.log("TextEditor: 캔버스 이벤트 리스너 제거");
      localCanvas.off("mouse:down", handleMouseDown);
      localCanvas.off("before:selection:cleared", handleBeforeSelection);
      localCanvas.off("selection:created", handleSelectionCreated);
      localCanvas.off("selection:updated", handleSelectionUpdated);
      localCanvas.off("selection:cleared", handleSelectionCleared);
      localCanvas.off("object:modified", handleObjectModified);
      localCanvas.off("text:changed", handleTextChanged);
    };
  }, [localCanvas, updateElementProperty]);

  // 텍스트 편집 시작/종료 처리
  useEffect(() => {
    if (!localCanvas) return;

    const handleTextEditStarted = (e) => {
      console.log("TextEditor: 텍스트 편집 시작", {
        target: e.target ? `${e.target.type} (id: ${e.target.id})` : "없음",
      });

      if (
        e.target &&
        (e.target.type === "i-text" || e.target.type === "textbox")
      ) {
        // 편집 시작 시 텍스트 컨트롤 업데이트
        updateTextControls(e.target);

        // 편집 중인 텍스트 객체가 상호작용 가능한지 확인
        e.target.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          editable: true,
          lockMovementX: false,
          lockMovementY: false,
        });
        localCanvas.renderAll();
      }
    };

    const handleTextEditExited = (e) => {
      console.log("TextEditor: 텍스트 편집 종료", {
        target: e.target ? `${e.target.type} (id: ${e.target.id})` : "없음",
        text: e.target ? e.target.text : "없음",
      });

      if (
        e.target &&
        (e.target.type === "i-text" || e.target.type === "textbox")
      ) {
        // 편집 종료 시 텍스트 객체의 크기 조정 (텍스트가 짤리지 않도록)
        const textWidth = e.target.width;
        e.target.set({
          width: Math.max(
            e.target.width,
            e.target.text.length * (e.target.fontSize * 0.6)
          ),
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          editable: true,
          lockMovementX: false,
          lockMovementY: false,
        });
        localCanvas.renderAll();

        // 편집 종료 시 상태 저장
        saveState();

        if (e.target.id && e.target.text) {
          updateElementProperty(e.target.id, "text", e.target.text);
        }

        if (onTextUpdated) {
          onTextUpdated(e.target);
        }
      }
    };

    localCanvas.on("text:editing:entered", handleTextEditStarted);
    localCanvas.on("text:editing:exited", handleTextEditExited);

    return () => {
      localCanvas.off("text:editing:entered", handleTextEditStarted);
      localCanvas.off("text:editing:exited", handleTextEditExited);
    };
  }, [localCanvas, onTextUpdated, saveState, updateElementProperty]);

  return (
    <div className={`${styles["text-editor"]} ${className}`}>
      <div className={`${styles.controls} flex flex-col`}>
        <button
          onClick={handleAddText}
          className="flex items-center gap-1 mb-2"
        >
          <TextCursorInput className="h-4 w-4" />
          텍스트 추가
        </button>

        <button onClick={handleClearCanvas}>캔버스 초기화</button>
      </div>

      <div className={styles["text-controls"]}>
        <div>
          <label htmlFor="text-content">텍스트:</label>
          <input
            type="text"
            id="text-content"
            value={text}
            onChange={handleTextChange}
            placeholder="텍스트 내용"
          />
        </div>
        <div>
          <label htmlFor="font-family">글꼴:</label>
          <select
            id="font-family"
            value={fontFamily}
            onChange={handleFontFamilyChange}
          >
            {fontFamilies.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="font-size">크기:</label>
          <input
            type="number"
            id="font-size"
            value={fontSize}
            onChange={handleFontSizeChange}
            min="1"
            max="100"
          />
        </div>
        <div className={styles["color-picker"]}>
          <label htmlFor="font-color">색상:</label>
          <input
            type="color"
            id="font-color"
            value={fontColor}
            onChange={handleFontColorChange}
          />
        </div>
        <div>
          <button
            id="bold-text"
            className={isBold ? styles.active : ""}
            onClick={handleToggleBold}
          >
            굵게
          </button>
          <button
            id="italic-text"
            className={isItalic ? styles.active : ""}
            onClick={handleToggleItalic}
          >
            기울임
          </button>
          <button
            id="underline-text"
            className={isUnderline ? styles.active : ""}
            onClick={handleToggleUnderline}
          >
            밑줄
          </button>
        </div>
        <div>
          <label>정렬:</label>
          <div className={styles["text-align-group"]}>
            <button
              className={textAlign === "left" ? styles.active : ""}
              onClick={() => handleTextAlignChange("left")}
            >
              좌측
            </button>
            <button
              className={textAlign === "center" ? styles.active : ""}
              onClick={() => handleTextAlignChange("center")}
            >
              중앙
            </button>
            <button
              className={textAlign === "right" ? styles.active : ""}
              onClick={() => handleTextAlignChange("right")}
            >
              우측
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
