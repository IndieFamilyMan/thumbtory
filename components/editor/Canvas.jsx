"use client";

import {
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  Canvas as FabricCanvas,
  Rect,
  Circle,
  Triangle,
  Line,
  Image as FabricImage,
  Text,
  Textbox,
  Pattern,
} from "fabric";
import { useEditorStore } from "@/store/editor";
import { SocialMediaLayouts } from "@/lib/social-media-layouts";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from "nanoid";
import html2canvas from "html2canvas";
import debounce from "lodash/debounce";

export default function Canvas({
  onCanvasReady,
  backgroundColor = "#ffffff",
  guideGrid,
  hideGrid,
  onObjectsSelected,
  editMode,
  onSetEditMode,
  onTextEdit,
  setIsTextEditing,
  setShowTextToolbar,
  showGuides,
  setShowGuides,
  customCanvasProps,
  customEventManager,
  onZoomChange,
  onPanChange,
  isTextEditing,
  setCanvasRef,
  setCanvasImage,
  removeElement,
}) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const canvasDOMRef = useRef(null);
  const cleanupTimerRef = useRef(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasEmpty, setCanvasEmpty] = useState(true);
  const [canvasKey, setCanvasKey] = useState(Date.now());
  const [isMounted, setIsMounted] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const imageCache = useRef({});
  const [canvas, setCanvas] = useState(null);
  const isDrawingRef = useRef(false);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isSelectable, setIsSelectable] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const {
    elements,
    addElement,
    updateElement,
    editElement,
    setEditElement,
    undo,
    redo,
    undoStack,
    redoStack,
    background,
    setBackground,
    font,
    fonts,
    selectedElementId,
    setSelectedElementId,
    designSettings,
    activePlatformId,
    saveState,
    updateElementProperty,
    addHistoryItem,
  } = useEditorStore();
  const { theme } = useTheme();
  const { width, height } =
    SocialMediaLayouts[activePlatformId] || SocialMediaLayouts.instagram;
  const { toast } = useToast();

  // 안전하게 브러시 속성에 접근하는 헬퍼 함수
  const safeSetBrushProperty = (canvas, property, value) => {
    if (!canvas) return;

    try {
      // 먼저 drawing mode를 활성화하여 브러시 생성 보장
      const previousDrawingMode = canvas.isDrawingMode;

      // 브러시 생성 보장을 위해 drawing mode 활성화
      canvas.isDrawingMode = true;

      // 작은 지연 후 브러시 초기화 시도
      setTimeout(() => {
        try {
          // 브러시 객체가 생성되었는지 확인
          if (!canvas.freeDrawingBrush) {
            console.warn(
              "freeDrawingBrush가 준비되지 않았습니다. 초기화를 재시도합니다."
            );
            // 기본 브러시 클래스 확인
            if (typeof fabric !== "undefined" && fabric.PencilBrush) {
              canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            }
          }

          // 속성 설정
          if (canvas.freeDrawingBrush && property && value !== undefined) {
            canvas.freeDrawingBrush[property] = value;
            console.log(`브러시 ${property} 속성 설정 완료:`, value);
          }

          // 이전 drawing mode 상태로 복원
          canvas.isDrawingMode = previousDrawingMode;
        } catch (innerErr) {
          console.error(`브러시 속성 설정 재시도 중 오류:`, innerErr);
        }
      }, 100);
    } catch (e) {
      console.error(`브러시 속성 ${property} 설정 중 오류:`, e);
    }
  };

  // 가이드 그리드 제거 함수
  const removeGuideGrid = () => {
    if (!fabricCanvasRef.current) return;

    try {
      // 그리드 관련 객체 찾기
      const gridObjects = fabricCanvasRef.current
        .getObjects()
        .filter(
          (obj) =>
            obj.id &&
            (obj.id.startsWith("grid-") ||
              obj.id === "guide-text" ||
              obj.id === "drop-icon")
        );

      // 그리드 객체 제거
      gridObjects.forEach((obj) => {
        fabricCanvasRef.current.remove(obj);
      });

      // 캔버스 렌더링 갱신
      fabricCanvasRef.current.requestRenderAll();
    } catch (e) {
      console.error("가이드 그리드 제거 중 오류:", e);
    }
  };

  // 가이드 그리드 그리기 함수
  const drawGuideGrid = () => {
    if (!fabricCanvasRef.current) return;

    try {
      // 기존 그리드 제거
      removeGuideGrid();

      const canvas = fabricCanvasRef.current;
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      // 그리드 간격 설정
      const gridSize = 50;

      // 가로 그리드 선
      for (let i = gridSize; i < canvasHeight; i += gridSize) {
        const line = new Line([0, i, canvasWidth, i], {
          stroke: "#e0e0e0",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          id: `grid-h-${i}`,
          hoverCursor: "default",
        });
        canvas.add(line);
        // 맨 뒤로 보내기
        try {
          if (typeof line.sendToBack === "function") {
            line.sendToBack();
          } else if (typeof canvas.sendToBack === "function") {
            canvas.sendToBack(line);
          } else if (typeof canvas.moveTo === "function") {
            canvas.moveTo(line, 0);
          }
        } catch (err) {
          console.log("그리드 선 배치 중 오류, 무시됨", err);
        }
      }

      // 세로 그리드 선
      for (let i = gridSize; i < canvasWidth; i += gridSize) {
        const line = new Line([i, 0, i, canvasHeight], {
          stroke: "#e0e0e0",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          id: `grid-v-${i}`,
          hoverCursor: "default",
        });
        canvas.add(line);
        // 맨 뒤로 보내기
        try {
          if (typeof line.sendToBack === "function") {
            line.sendToBack();
          } else if (typeof canvas.sendToBack === "function") {
            canvas.sendToBack(line);
          } else if (typeof canvas.moveTo === "function") {
            canvas.moveTo(line, 0);
          }
        } catch (err) {
          console.log("그리드 선 배치 중 오류, 무시됨", err);
        }
      }

      // 캔버스 렌더링 갱신
      canvas.requestRenderAll();
    } catch (e) {
      console.error("가이드 그리드 그리기 중 오류:", e);
    }
  };

  // 가이드 그리드 업데이트 함수
  const updateGuideGrid = (show) => {
    if (!fabricCanvasRef.current) return;

    try {
      // 기존 그리드 제거
      removeGuideGrid();

      // 표시 옵션이 true인 경우에만 그리드 생성
      if (show) {
        // 여기에 그리드 생성 로직이 들어갈 수 있음
        drawGuideGrid();
      }
    } catch (e) {
      console.error("가이드 그리드 업데이트 중 오류:", e);
    }
  };

  // React 생명주기에 맞춘 DOM 참조 관리
  useLayoutEffect(() => {
    if (canvasRef.current) {
      canvasDOMRef.current = canvasRef.current;
      setIsMounted(true);

      // DOM이 실제로 마운트되었는지 확인
      setTimeout(() => {
        if (canvasRef.current && canvasRef.current.parentNode) {
          setCanvasReady(true);
        }
      }, 50);

      // 전역 상태 핸들러 설정 (다른 컴포넌트에서 접근 가능)
      window.__EDITOR_STATE_HANDLER__ = {
        setPreviewMode: (isPreview) => {
          setIsPreviewMode(isPreview);

          // 미리보기 모드일 때 가이드 그리드 제거
          if (isPreview && fabricCanvasRef.current) {
            removeGuideGrid();
          }
        },
      };
    }

    return () => {
      // 언마운트 시 모든 타이머 정리
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }

      // 모든 상태 초기화
      setIsMounted(false);
      setCanvasReady(false);

      // 전역 상태 핸들러 제거
      if (window.__EDITOR_STATE_HANDLER__) {
        window.__EDITOR_STATE_HANDLER__ = null;
      }

      // Canvas 참조 정리
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.off();
          fabricCanvasRef.current.clear();
          fabricCanvasRef.current.dispose();
        } catch (e) {
          console.error("언마운트 시 캔버스 정리 오류:", e);
        }
        fabricCanvasRef.current = null;
      }
    };
  }, [canvasKey]);

  // 플랫폼 변경 시 안전하게 캔버스 재설정
  useEffect(() => {
    // 캔버스 클린업
    const cleanup = () => {
      if (fabricCanvasRef.current) {
        try {
          console.log("플랫폼 변경: 이전 캔버스 정리");
          fabricCanvasRef.current.off();
          fabricCanvasRef.current.clear();
          fabricCanvasRef.current.dispose();
        } catch (e) {
          console.error("플랫폼 변경 시 캔버스 정리 중 오류:", e);
        } finally {
          fabricCanvasRef.current = null;
        }
      }
    };

    // 기존 캔버스 정리
    cleanup();

    // 안전하게 상태 초기화 후 새 키 설정
    setCanvasReady(false);
    setIsMounted(false);

    // 지연 후 새 캔버스 생성 준비
    cleanupTimerRef.current = setTimeout(() => {
      setCanvasKey(Date.now());
    }, 100);

    return () => {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
    };
  }, [activePlatformId]);

  // 캔버스 초기화 - 안전한 초기화를 위한 조건 개선
  useEffect(() => {
    if (!canvasRef.current || !isMounted || !canvasReady) return;

    // 자식 노드 존재 여부 확인
    if (!canvasRef.current.parentNode) {
      console.warn("캔버스 요소에 부모 노드가 없습니다. 초기화를 건너뜁니다.");
      return;
    }

    // 캔버스 이벤트 리스너 설정 함수
    const setupCanvasEventListeners = (canvas) => {
      if (!canvas) return;

      // 기본 마우스 이벤트 처리
      canvas.on("mouse:down", (e) => {
        console.log("Canvas: mouse:down 이벤트 발생", {
          target: e.target ? `${e.target.type} (id: ${e.target.id})` : "없음",
          isTextEditing: isEditingText(),
          pointer: e.pointer,
          button: e.button,
        });

        if (!e.target) return;

        // 텍스트 객체 선택 시 처리
        if (e.target.type === "textbox" || e.target.type === "i-text") {
          console.log("Canvas: 텍스트 객체 선택됨", e.target.id);
          // 선택된 텍스트 객체를 앞으로 가져오기
          canvas.bringObjectToFront(e.target);
          setSelectedElementId(e.target.id);
          canvas.renderAll();
        }
      });

      // 마우스 오버 이벤트 - 선택 가능한 객체 강조 표시
      canvas.on("mouse:over", (e) => {
        if (!e.target) return;

        console.log("Canvas: mouse:over 이벤트 발생", {
          target: `${e.target.type} (id: ${e.target.id})`,
          selectable: e.target.selectable,
          evented: e.target.evented,
        });

        // 텍스트 객체에 대한 특별 처리
        if (e.target.type === "textbox" || e.target.type === "i-text") {
          e.target.set("borderColor", "#00aaff");
          e.target.set("cornerColor", "#00aaff");
          canvas.requestRenderAll();
        }
      });

      // 마우스 아웃 이벤트 - 강조 표시 제거
      canvas.on("mouse:out", (e) => {
        if (!e.target) return;

        // 텍스트 객체에 대한 특별 처리
        if (e.target.type === "textbox" || e.target.type === "i-text") {
          e.target.set("borderColor", "#0084ff");
          e.target.set("cornerColor", "#0084ff");
          canvas.requestRenderAll();
        }
      });

      // 객체 선택 이벤트 처리
      canvas.on("selection:created", (e) => {
        console.log("Canvas: selection:created 이벤트 발생", {
          selected: e.selected
            ? e.selected.map((obj) => `${obj.type} (id: ${obj.id})`)
            : "없음",
        });
        handleObjectChange(e);
      });

      canvas.on("selection:updated", (e) => {
        console.log("Canvas: selection:updated 이벤트 발생", {
          selected: e.selected
            ? e.selected.map((obj) => `${obj.type} (id: ${obj.id})`)
            : "없음",
        });
        handleObjectChange(e);
      });

      canvas.on("selection:cleared", (e) => {
        console.log("Canvas: selection:cleared 이벤트 발생");
        handleObjectChange(e);
        setSelectedElementId(null);
      });

      // 더블 클릭으로 텍스트 편집 모드 진입
      canvas.on("mouse:dblclick", (e) => {
        console.log("Canvas: mouse:dblclick 이벤트 발생", {
          target: e.target ? `${e.target.type} (id: ${e.target.id})` : "없음",
        });

        if (
          e.target &&
          (e.target.type === "textbox" || e.target.type === "i-text")
        ) {
          console.log("Canvas: 텍스트 더블클릭 - 편집 모드 진입:", e.target.id);
          try {
            // 텍스트 객체를 최상위로 이동
            canvas.bringObjectToFront(e.target);

            // 텍스트 편집 모드 진입
            e.target.enterEditing();

            // 텍스트 전체 선택
            if (typeof e.target.selectAll === "function") {
              e.target.selectAll();
            }

            canvas.renderAll();
          } catch (err) {
            console.error("텍스트 편집 모드 진입 중 오류:", err);
          }
        }
      });

      // 캔버스 전체 상태 로깅
      console.log(
        "Canvas: 현재 캔버스 객체 목록",
        canvas.getObjects().map((obj) => ({
          type: obj.type,
          id: obj.id,
          selectable: obj.selectable,
          evented: obj.evented,
          visible: obj.visible,
        }))
      );

      // 캔버스 설정 확인
      console.log("Canvas: 캔버스 설정", {
        selection: canvas.selection,
        skipTargetFind: canvas.skipTargetFind,
        selectionKey: canvas.selectionKey,
        selectionFullyContained: canvas.selectionFullyContained,
        selectionColor: canvas.selectionColor,
        selectionBorderColor: canvas.selectionBorderColor,
      });
    };

    // 텍스트 편집 이벤트 설정 함수
    const setupTextEditingEvents = (canvas) => {
      if (!canvas) return;

      // 텍스트 편집 시작 시 이벤트
      canvas.on("text:editing:entered", (e) => {
        try {
          const textObject = e.target;
          if (textObject) {
            console.log("텍스트 편집 시작:", textObject.id);

            // 편집 상태 설정
            setIsTextEditing(true);
            if (onTextEdit && typeof onTextEdit === "function") {
              onTextEdit(true);
            }
            if (
              setShowTextToolbar &&
              typeof setShowTextToolbar === "function"
            ) {
              setShowTextToolbar(true);
            }

            // 텍스트 객체 선택 상태 유지
            setSelectedElementId(textObject.id);

            // 객체를 앞으로 가져오기
            canvas.bringObjectToFront(textObject);
            canvas.renderAll();
          }
        } catch (err) {
          console.error("텍스트 편집 시작 처리 중 오류:", err);
        }
      });

      // 텍스트 편집 종료 시 이벤트
      canvas.on("text:editing:exited", (e) => {
        try {
          const textObject = e.target;
          if (textObject) {
            console.log("텍스트 편집 종료:", textObject.id, textObject.text);

            // 편집 상태 해제
            setIsTextEditing(false);
            if (onTextEdit && typeof onTextEdit === "function") {
              onTextEdit(false);
            }
            if (
              setShowTextToolbar &&
              typeof setShowTextToolbar === "function"
            ) {
              setShowTextToolbar(false);
            }

            // 텍스트 내용 업데이트
            if (textObject.id) {
              updateElementProperty(textObject.id, "text", textObject.text);
              saveState();
            }

            canvas.renderAll();
          }
        } catch (err) {
          console.error("텍스트 편집 종료 처리 중 오류:", err);
        }
      });

      // 텍스트 변경 시 이벤트
      canvas.on("text:changed", (e) => {
        try {
          const textObject = e.target;
          if (textObject && textObject.id) {
            console.log("텍스트 변경:", textObject.id, textObject.text);

            // 텍스트 내용 즉시 업데이트
            updateElementProperty(textObject.id, "text", textObject.text);
          }
        } catch (err) {
          console.error("텍스트 변경 처리 중 오류:", err);
        }
      });

      // IME 입력 처리
      const onCompositionStart = () => {
        if (
          canvas.getActiveObject() &&
          canvas.getActiveObject().type === "text"
        ) {
          canvas.getActiveObject().isEditing = true;
        }
      };

      const onCompositionEnd = () => {
        if (
          canvas.getActiveObject() &&
          canvas.getActiveObject().type === "text"
        ) {
          const textObject = canvas.getActiveObject();
          updateElementProperty(textObject.id, "text", textObject.text);
          textObject.isEditing = false;
          canvas.renderAll();
        }
      };

      // IME 이벤트 리스너 등록
      document.addEventListener("compositionstart", onCompositionStart);
      document.addEventListener("compositionend", onCompositionEnd);

      return () => {
        document.removeEventListener("compositionstart", onCompositionStart);
        document.removeEventListener("compositionend", onCompositionEnd);
      };
    };

    // 객체 이동 이벤트 설정 함수
    const setupObjectMovementEvents = (canvas) => {
      if (!canvas) return;

      // 객체 선택 시 이벤트
      canvas.on("selection:created", (e) => {
        const selectedObject = e.selected[0];
        if (selectedObject) {
          setSelectedElementId(selectedObject.id);
        }
      });

      // 객체 선택 해제 시 이벤트
      canvas.on("selection:cleared", () => {
        setSelectedElementId(null);
      });

      // 객체 이동 시작 시 이벤트
      canvas.on("object:moving", (e) => {
        const movingObject = e.target;
        if (movingObject) {
          // 실시간으로 위치 업데이트
          updateElementProperty(
            movingObject.id,
            "x",
            Math.round(movingObject.left)
          );
          updateElementProperty(
            movingObject.id,
            "y",
            Math.round(movingObject.top)
          );
        }
      });

      // 객체 이동 완료 시 이벤트
      canvas.on("object:modified", (e) => {
        const modifiedObject = e.target;
        if (modifiedObject) {
          // 최종 위치 저장 및 상태 업데이트
          updateElementProperty(
            modifiedObject.id,
            "x",
            Math.round(modifiedObject.left)
          );
          updateElementProperty(
            modifiedObject.id,
            "y",
            Math.round(modifiedObject.top)
          );
          saveState();
        }
      });

      // 객체 크기 조절 시 이벤트
      canvas.on("object:scaling", (e) => {
        const scalingObject = e.target;
        if (scalingObject) {
          const { scaleX, scaleY } = scalingObject;
          updateElementProperty(scalingObject.id, "scaleX", scaleX);
          updateElementProperty(scalingObject.id, "scaleY", scaleY);
        }
      });

      // 객체 회전 시 이벤트
      canvas.on("object:rotating", (e) => {
        const rotatingObject = e.target;
        if (rotatingObject) {
          updateElementProperty(
            rotatingObject.id,
            "angle",
            rotatingObject.angle
          );
        }
      });
    };

    // Initialize canvas
    if (fabricCanvasRef.current) {
      try {
        // 모든 이벤트 리스너 제거
        fabricCanvasRef.current.off();
        // 모든 객체 제거
        fabricCanvasRef.current.clear();
        // 캔버스 dispose
        fabricCanvasRef.current.dispose();
      } catch (e) {
        console.error("캔버스 dispose 중 오류:", e);
      }
      fabricCanvasRef.current = null;
    }

    // 캔버스 옵션 설정
    let canvas;
    try {
      // DOM 요소가 여전히 유효한지 다시 확인
      if (!canvasRef.current || !canvasRef.current.parentNode) {
        console.error("캔버스 DOM 요소가 더 이상 유효하지 않습니다.");
        return;
      }

      canvas = new FabricCanvas(canvasRef.current, {
        width: width,
        height: height,
        preserveObjectStacking: true,
        selection: true,
        backgroundColor: "#ffffff",
        renderOnAddRemove: true,
        stateful: true,
        fireRightClick: false,
        stopContextMenu: true,
        skipTargetFind: false,
        interactive: true,
        enableRetinaScaling: true,
        allowTouchScrolling: false,
        imageSmoothingEnabled: true,
        perPixelTargetFind: false,
        selectionColor: "rgba(0, 132, 255, 0.3)",
        selectionBorderColor: "rgba(0, 132, 255, 0.8)",
        selectionLineWidth: 1,
        hoverCursor: "pointer",
        defaultCursor: "default",
      });

      // 캔버스 참조 저장
      fabricCanvasRef.current = canvas;
      setCanvas(canvas);

      // 전역 접근을 위한 인스턴스 저장 (내보내기에서 사용)
      window.fabricCanvasInstance = canvas;
      document.__EDITOR_FABRIC_CANVAS__ = canvas;

      // 캔버스 이벤트 리스너 설정
      setupCanvasEventListeners(canvas);
      setupTextEditingEvents(canvas);
      setupObjectMovementEvents(canvas);

      // 한글 IME 처리 개선을 위한 설정
      try {
        // 브러시 초기화 확인 - 수정된 코드
        canvas.isDrawingMode = true;

        // 브러시 타입이 설정되어 있지 않으면 PencilBrush 사용
        if (
          typeof fabric !== "undefined" &&
          fabric.PencilBrush &&
          !canvas.freeDrawingBrush
        ) {
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        }

        // 브러시 속성 설정
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = "#000000";
          canvas.freeDrawingBrush.width = 2;
          console.log("브러시 직접 초기화 성공");
        } else {
          // 안전한 방식으로 지연 초기화
          setTimeout(() => {
            safeSetBrushProperty(canvas, "color", "#000000");
            safeSetBrushProperty(canvas, "width", 2);
          }, 200);
        }

        // 이전 모드로 복원
        canvas.isDrawingMode = false;
      } catch (e) {
        console.error("freeDrawingBrush 설정 중 오류:", e);
      }

      // 텍스트 입력 시 IME 한글 문제 개선을 위한 이벤트 핸들러 함수
      const handleKeyDown = function (e) {
        const activeObject = canvas.getActiveObject();
        if (
          !activeObject ||
          activeObject.type !== "textbox" ||
          !activeObject.isEditing
        ) {
          return;
        }

        // 키 이벤트 정보 저장
        activeObject._lastKeyEvent = {
          key: e.key,
          isComposing: e.isComposing,
          timestamp: Date.now(),
        };

        // 현재 상태와 커서 위치 저장
        if (activeObject.hiddenTextarea) {
          try {
            activeObject._prevText = activeObject.text;
            activeObject._savedSelectionStart =
              activeObject.hiddenTextarea.selectionStart;
            activeObject._savedSelectionEnd =
              activeObject.hiddenTextarea.selectionEnd;
          } catch (err) {
            console.error("커서 위치 저장 오류:", err);
          }
        }

        // IME 이벤트 감지 및 처리
        if (e.key === "Process" || e.key === "Unidentified" || e.isComposing) {
          // 이벤트 전파 중지
          e.stopPropagation();

          // 조합 상태 설정
          activeObject._isComposing = true;
          window.__EDITOR_IME_COMPOSING__ = true;

          // 캔버스 컴포지션 모드 설정
          if (canvas) {
            canvas._isCompositionMode = true;
          }

          // 포커스 유지 확인
          if (
            activeObject.hiddenTextarea &&
            document.activeElement !== activeObject.hiddenTextarea
          ) {
            activeObject.hiddenTextarea.focus();
          }

          // 조합 중 렌더링
          canvas.renderAll();
        }

        // 특수 키 처리 - Escape 키는 조합 중에는 무시
        if (e.key === "Escape" && activeObject._isComposing) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      const handleKeyUp = function (e) {
        const activeObject = canvas.getActiveObject();
        if (
          !activeObject ||
          activeObject.type !== "textbox" ||
          !activeObject.isEditing
        ) {
          return;
        }

        // 키 이벤트 저장 - 한글 조합 완료 감지에 도움
        activeObject._lastKeyUpEvent = {
          key: e.key,
          isComposing: e.isComposing,
          timestamp: Date.now(),
        };

        // IME 조합 중이 아닌 일반 키 처리
        if (e.key !== "Process" && e.key !== "Unidentified" && !e.isComposing) {
          window.__EDITOR_IME_COMPOSING__ = false;

          // Enter 키 처리 - 편집 종료 대신 줄바꿈만 처리
          if (e.key === "Enter") {
            // 메타키(Ctrl, Cmd 등)와 함께 눌렀을 때만 편집 종료
            if (e.ctrlKey || e.metaKey) {
              try {
                // 조합 중이 아닐 때만 편집 종료
                if (!activeObject._isComposing) {
                  // 한글 조합 완전히 끝난 후에만 편집 종료
                  setTimeout(() => {
                    if (!activeObject._isComposing) {
                      // 상태 업데이트 후 편집 종료
                      updateElementProperty(
                        activeObject.id,
                        "text",
                        activeObject.text
                      );
                      saveState();

                      try {
                        activeObject.exitEditing();
                        canvas.renderAll();
                      } catch (err) {
                        console.error("편집 종료 중 오류:", err);
                      }
                    }
                  }, 50);
                }
              } catch (err) {
                console.error("Enter 키 처리 오류:", err);
              }
            } else {
              // 일반 Enter키는 줄바꿈만 처리하고 포커스 유지
              // 텍스트 내용이 바뀌었으면 업데이트
              if (activeObject._prevText !== activeObject.text) {
                updateElementProperty(
                  activeObject.id,
                  "text",
                  activeObject.text
                );

                // 변경된 텍스트로 이전 텍스트 업데이트
                activeObject._prevText = activeObject.text;
                canvas.renderAll();
              }
            }
            return;
          }

          // 일반 키 입력 시 상태 업데이트
          if (activeObject._prevText !== activeObject.text) {
            updateElementProperty(activeObject.id, "text", activeObject.text);

            // 변경된 텍스트로 이전 텍스트 업데이트
            activeObject._prevText = activeObject.text;

            // 현재 커서 위치 저장
            if (activeObject.hiddenTextarea) {
              try {
                activeObject._savedSelectionStart =
                  activeObject.hiddenTextarea.selectionStart;
                activeObject._savedSelectionEnd =
                  activeObject.hiddenTextarea.selectionEnd;
              } catch (err) {
                console.error("커서 위치 저장 오류:", err);
              }
            }

            // 캔버스 렌더링
            canvas.renderAll();
          }
          return;
        }

        // IME 이벤트 감지 및 처리
        if (e.key === "Process" || e.key === "Unidentified" || e.isComposing) {
          // 이벤트 전파 중지
          e.stopPropagation();

          // 특수 케이스: IME 입력 중에 선택한 후보 문자 처리
          if (activeObject._isComposing) {
            // 입력 처리 지연
            setTimeout(() => {
              try {
                // 포커스가 유지되는지 확인
                if (
                  activeObject.hiddenTextarea &&
                  document.activeElement !== activeObject.hiddenTextarea
                ) {
                  activeObject.hiddenTextarea.focus();
                }

                // 렌더링 갱신으로 시각적 업데이트
                canvas.renderAll();
              } catch (err) {
                console.error("IME 키 업 이벤트 처리 오류:", err);
              }
            }, 10);
          }
        } else {
          // 조합이 끝났을 때 플래그 초기화
          activeObject._isComposing = false;
          window.__EDITOR_IME_COMPOSING__ = false;

          // 텍스트 업데이트
          if (activeObject._prevText !== activeObject.text) {
            updateElementProperty(activeObject.id, "text", activeObject.text);
          }

          // 렌더링
          canvas.renderAll();
        }
      };

      // 이벤트 리스너 등록
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);

      // 전역 변수에 이벤트 핸들러 저장
      window.__EDITOR_EVENT_HANDLERS__ = {
        handleKeyDown,
        handleKeyUp,
      };
    } catch (error) {
      console.error("캔버스 초기화 중 오류:", error);
    }

    // 초기화 후 배경 적용
    if (background) {
      console.log("초기화 후 배경 적용 시도:", background.type);
      const bgTimer = setTimeout(() => {
        if (fabricCanvasRef.current && isMounted && canvasReady) {
          applyBackground(background, fabricCanvasRef.current);
        }
      }, 100);
    }

    // 컴포넌트 언마운트 시 캔버스 정리
    return () => {
      // DOM 조작 충돌 방지를 위해 정리 작업 지연
      cleanupTimerRef.current = setTimeout(() => {
        try {
          // 전역 이벤트 리스너 제거
          if (window.__EDITOR_EVENT_HANDLERS__) {
            document.removeEventListener(
              "keydown",
              window.__EDITOR_EVENT_HANDLERS__.handleKeyDown
            );
            document.removeEventListener(
              "keyup",
              window.__EDITOR_EVENT_HANDLERS__.handleKeyUp
            );
            window.__EDITOR_EVENT_HANDLERS__ = null;
          }

          if (fabricCanvasRef.current) {
            // 이벤트 핸들러 정리
            fabricCanvasRef.current.off();
            // 모든 객체 제거
            fabricCanvasRef.current.clear();
            // Fabric 캔버스 제거
            fabricCanvasRef.current.dispose();
            // 참조 제거
            fabricCanvasRef.current = null;

            // 전역 참조 제거
            if (window.fabricCanvasInstance) {
              window.fabricCanvasInstance = null;
            }
            if (document.__EDITOR_FABRIC_CANVAS__) {
              document.__EDITOR_FABRIC_CANVAS__ = null;
            }
          }
        } catch (e) {
          console.error("캔버스 정리 중 오류:", e);
        }
      }, 50);
    };
  }, [canvasRef, width, height, isMounted, canvasReady]);

  // 텍스트 편집 상태 확인 유틸리티 함수
  const isEditingText = () => {
    // 전역 변수 확인
    if (window.__EDITOR_TEXT_EDITING__ === true) {
      return true;
    }

    // 캔버스 객체 확인
    if (fabricCanvasRef.current) {
      const activeObject = fabricCanvasRef.current.getActiveObject();
      return activeObject?.type === "textbox" && activeObject?.isEditing;
    }

    return isTextEditing;
  };

  // 캔버스 비어있는지 확인 및 미리보기 상태 추적
  useEffect(() => {
    // 텍스트 편집 중이면 상태 업데이트 건너뛰기
    if (isEditingText()) return;

    const isEmpty = elements.length === 0 && !background;
    setCanvasEmpty(isEmpty);

    // 요소가 있거나 배경이 있으면 미리보기 모드 활성화 (가이드 숨기기)
    const hasContent = elements.length > 0 || background;

    if (hasContent) {
      setIsPreviewMode(true);
    }

    if (fabricCanvasRef.current && isMounted && canvasReady) {
      // 미리보기 모드에서는 항상 가이드 그리드 숨기기
      if (hasContent) {
        removeGuideGrid();
      } else {
      }
    }
  }, [elements, background, isMounted, canvasReady, isPreviewMode]);

  // 반응형 캔버스 크기 조정
  useEffect(() => {
    // 텍스트 편집 중이면 처리하지 않음
    if (isEditingText()) return;

    const updateCanvasSize = () => {
      if (
        !canvasContainerRef.current ||
        !fabricCanvasRef.current ||
        !canvasReady
      )
        return;

      // 텍스트 편집 중인 경우 크기 조정 건너뛰기
      if (isEditingText()) return;

      const containerWidth = canvasContainerRef.current.clientWidth;
      const containerHeight = canvasContainerRef.current.clientHeight;

      const { width, height } =
        SocialMediaLayouts[activePlatformId] || SocialMediaLayouts.instagram;

      // 컨테이너에 맞추기 위한 스케일 계산 (패딩 고려)
      const paddingX = 20; // 좌우 패딩
      const paddingY = 20; // 상하 패딩
      const availableWidth = containerWidth - paddingX;
      const availableHeight = containerHeight - paddingY;

      // 가로, 세로 비율 유지하면서 최대한 크게 표시
      let scale = Math.min(
        availableWidth / width,
        availableHeight / height,
        1 // 최대 스케일은 1로 제한 (원본 크기 이상으로 커지지 않도록)
      );

      // 너무 작아지지 않도록 최소 스케일 설정
      scale = Math.max(scale, 0.3);

      // 이전 scale과 같으면 불필요한 리렌더링 방지
      if (scale !== canvasScale) {
        setCanvasScale(scale);

        // 캔버스 줌 조정
        fabricCanvasRef.current.setZoom(scale);
        fabricCanvasRef.current.setWidth(width * scale);
        fabricCanvasRef.current.setHeight(height * scale);

        fabricCanvasRef.current.renderAll();
      }
    };

    // 초기 사이즈 설정
    if (isMounted && canvasReady) {
      updateCanvasSize();
    }

    // 리사이즈 이벤트 디바운스 처리
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (isMounted && canvasReady) {
          // 텍스트 편집 중인 경우 크기 조정 건너뛰기
          const activeObject = fabricCanvasRef.current?.getActiveObject();
          if (activeObject?.type === "textbox" && activeObject?.isEditing) {
            return;
          }
          updateCanvasSize();
        }
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [activePlatformId, canvasEmpty, canvasScale, isMounted, canvasReady]);

  // 플랫폼 변경 시 캔버스 사이즈 조정
  useEffect(() => {
    if (!fabricCanvasRef.current || !isMounted || !canvasReady) return;

    // 텍스트 편집 중이면 처리하지 않음
    if (isEditingText()) return;

    try {
      console.log("플랫폼 변경 후 캔버스 크기 조정 시작");

      const { width, height } =
        SocialMediaLayouts[activePlatformId] || SocialMediaLayouts.instagram;

      // 캔버스 크기 업데이트
      fabricCanvasRef.current.setWidth(width * canvasScale);
      fabricCanvasRef.current.setHeight(height * canvasScale);

      fabricCanvasRef.current.renderAll();
      console.log("플랫폼 변경 후 캔버스 크기 조정 완료");
    } catch (e) {
      console.error("캔버스 크기 조정 중 오류:", e);
    }
  }, [activePlatformId, canvasScale, isMounted, canvasReady]);

  // 테마 변경 시 캔버스 배경 조정
  useEffect(() => {
    if (!fabricCanvasRef.current || !isMounted || !canvasReady) return;

    // 텍스트 편집 중이면 처리하지 않음
    if (isEditingText()) return;

    // 배경 이미지가 있는 경우 배경색을 변경하지 않음
    if (fabricCanvasRef.current.backgroundImage) {
      console.log("테마 변경: 배경 이미지가 존재하여 배경색 변경 생략");
      return;
    }

    const bgColor = theme === "dark" ? "#1a1a1a" : "#f5f5f5";
    console.log("테마 변경으로 배경색 업데이트:", bgColor);
    fabricCanvasRef.current.set("backgroundColor", bgColor);
    fabricCanvasRef.current.renderAll();
  }, [theme, isMounted, canvasReady]);

  // 배경 적용
  useEffect(() => {
    if (!fabricCanvasRef.current || !isMounted || !canvasReady) return;

    // 텍스트 편집 중이면 처리하지 않음
    const textBeingEdited =
      window.__EDITOR_TEXT_EDITING__ === true ||
      (fabricCanvasRef.current &&
        fabricCanvasRef.current.getActiveObject()?.type === "textbox" &&
        fabricCanvasRef.current.getActiveObject()?.isEditing);

    if (textBeingEdited) return;

    console.log("배경 useEffect 트리거됨:", background?.type);

    if (background) {
      applyBackground(background, fabricCanvasRef.current);
    } else {
      // 배경이 없는 경우 기본 배경 설정
      fabricCanvasRef.current.set("backgroundColor", "#ffffff");
      fabricCanvasRef.current.backgroundImage = null;
      fabricCanvasRef.current.renderAll();
    }
  }, [background, isMounted, canvasReady]);

  // 디자인 설정 적용
  useEffect(() => {
    if (
      !fabricCanvasRef.current ||
      !designSettings ||
      !isMounted ||
      !canvasReady
    )
      return;

    // 텍스트 편집 중이면 처리하지 않음
    if (isEditingText()) return;

    // 디자인 설정에 따라 캔버스 속성 변경
    if (designSettings.backgroundColor) {
      fabricCanvasRef.current.set(
        "backgroundColor",
        designSettings.backgroundColor
      );
      fabricCanvasRef.current.renderAll();
    }

    // 테두리 적용
    if (designSettings.borderWidth > 0) {
      // 기존 테두리 제거
      const existingBorder = fabricCanvasRef.current
        .getObjects()
        .find((obj) => obj.id === "canvas-border");
      if (existingBorder) {
        fabricCanvasRef.current.remove(existingBorder);
      }

      // 새 테두리 추가
      const border = new Rect({
        id: "canvas-border",
        width: fabricCanvasRef.current.width,
        height: fabricCanvasRef.current.height,
        fill: "transparent",
        stroke: designSettings.borderColor || "#000000",
        strokeWidth: designSettings.borderWidth,
        selectable: false,
        evented: false,
        hoverCursor: "default",
        type: "border", // 타입 추가
      });

      // 테두리를 맨 뒤로 보내기
      fabricCanvasRef.current.add(border);
      try {
        if (typeof border.sendToBack === "function") {
          border.sendToBack();
        } else if (typeof fabricCanvasRef.current.sendToBack === "function") {
          fabricCanvasRef.current.sendToBack(border);
        } else if (typeof fabricCanvasRef.current.moveTo === "function") {
          fabricCanvasRef.current.moveTo(border, 0);
        }
      } catch (err) {
        console.log("테두리 배치 중 오류, 무시됨", err);
      }
      fabricCanvasRef.current.renderAll();
    } else {
      // 테두리 제거
      const existingBorder = fabricCanvasRef.current
        .getObjects()
        .find((obj) => obj.id === "canvas-border");
      if (existingBorder) {
        fabricCanvasRef.current.remove(existingBorder);
        fabricCanvasRef.current.renderAll();
      }
    }
  }, [designSettings, isMounted, canvasReady]);

  // 요소들을 캔버스에 렌더링
  useEffect(() => {
    if (!fabricCanvasRef.current || !isMounted || !canvasReady) return;

    // 텍스트 편집 중이면 처리하지 않음
    if (isEditingText()) return;

    try {
      console.log(
        "요소 렌더링 시작, 요소 수:",
        elements.length,
        "배경:",
        background?.type
      );
      const canvas = fabricCanvasRef.current;

      // 텍스트 편집 중인 객체 ID 찾기
      const editingTextId = (() => {
        const activeObject = canvas.getActiveObject();
        if (activeObject?.type === "textbox" && activeObject?.isEditing) {
          return activeObject.id;
        }
        return null;
      })();

      // 이전 객체 제거 (텍스트 편집 중인 객체, 그리드, 가이드 제외)
      canvas.getObjects().forEach((obj) => {
        if (
          obj.id &&
          obj.id !== "canvas-border" &&
          !obj.id.startsWith("grid-") &&
          obj.id !== "guide-text" &&
          obj.id !== "drop-icon" &&
          obj.id !== editingTextId
        ) {
          canvas.remove(obj);
        }
      });

      // 먼저 비-텍스트 요소들을 캔버스에 추가
      elements.forEach((element) => {
        // 편집 중인 텍스트는 건너뛰기 (이미 존재)
        if (element.id === editingTextId) return;

        // 텍스트가 아닌 요소만 먼저 추가
        if (element.type !== "text") {
          switch (element.type) {
            case "image":
              FabricImage.fromURL(
                element.src,
                (img) => {
                  img.set({
                    id: element.id,
                    left: element.x,
                    top: element.y,
                    angle: element.rotation || 0,
                    opacity:
                      element.opacity !== undefined ? element.opacity : 1,
                    scaleX: element.scaleX || 1,
                    scaleY: element.scaleY || 1,
                    customType: "image",
                    setSrc: element.src, // 원본 src 저장
                  });
                  canvas.add(img);
                  canvas.renderAll();
                },
                { crossOrigin: "anonymous" }
              );
              break;

            case "shape":
              let shapeObj;

              if (element.shape === "rectangle") {
                shapeObj = new Rect({
                  width: element.width,
                  height: element.height,
                });
              } else if (element.shape === "circle") {
                shapeObj = new Circle({
                  radius: Math.min(element.width, element.height) / 2,
                });
              } else if (element.shape === "triangle") {
                shapeObj = new Triangle({
                  width: element.width,
                  height: element.height,
                });
              }

              if (shapeObj) {
                shapeObj.set({
                  id: element.id,
                  left: element.x,
                  top: element.y,
                  fill: element.backgroundColor || "#3b82f6",
                  stroke: element.borderColor || "#1d4ed8",
                  strokeWidth: element.borderWidth || 0,
                  angle: element.rotation || 0,
                  scaleX: element.scaleX || 1,
                  scaleY: element.scaleY || 1,
                  opacity: element.opacity !== undefined ? element.opacity : 1,
                  customType: "shape",
                  shape: element.shape,
                });
                canvas.add(shapeObj);
              }
              break;
          }
        }
      });

      // 그 다음 텍스트 요소들을 추가 (최상위 레이어에 위치하도록)
      elements.forEach((element) => {
        // 편집 중인 텍스트는 건너뛰기 (이미 존재)
        if (element.id === editingTextId) return;

        // 텍스트 요소만 처리
        if (element.type === "text") {
          try {
            const textbox = new Textbox(element.text || "텍스트를 입력하세요", {
              id: element.id,
              left: element.x,
              top: element.y,
              width: element.width || 200,
              fontSize: element.fontSize || 24,
              fontFamily: element.fontFamily || "Arial",
              fill: element.fill || "#000000",
              stroke: element.stroke,
              strokeWidth: element.strokeWidth || 0,
              textAlign: element.textAlign || "left",
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              angle: element.rotation || 0,
              scaleX: element.scaleX || 1,
              scaleY: element.scaleY || 1,
              opacity: element.opacity !== undefined ? element.opacity : 1,
              customType: "text",
              selectable: true,
              editable: true,
              hasControls: true,
              hasBorders: true,
              perPixelTargetFind: false,
              hoverCursor: "text",
              borderColor: "#0084ff",
              cornerColor: "#0084ff",
              cornerSize: 8,
              transparentCorners: false,
              lockUniScaling: false,
              originX: "left",
              originY: "top",
              padding: 7,
              snapAngle: 45,
              splitByGrapheme: false, // 한글 입력을 위한 설정
              lockMovementX: false,
              lockMovementY: false,
              hasRotatingPoint: true,
              centeredRotation: true,
              charSpacing: 0,
              lineHeight: 1.2,
              erasable: false,
              dirty: true,
              __corner: 0,
            });

            // 텍스트 요소를 캔버스에 추가
            canvas.add(textbox);

            // 텍스트 요소를 다른 요소보다 앞으로 배치
            if (typeof canvas.bringObjectToFront === "function") {
              canvas.bringObjectToFront(textbox);
            } else if (typeof canvas.bringForward === "function") {
              canvas.bringForward(textbox, true);
            }

            // 선택된 요소인 경우 자동으로 선택 상태로 설정
            if (element.id === selectedElementId) {
              setTimeout(() => {
                canvas.setActiveObject(textbox);
                canvas.renderAll();
              }, 50);
            }
          } catch (err) {
            console.error("텍스트 요소 생성 중 오류:", err);
          }
        }
      });

      // 캔버스 렌더링
      canvas.renderAll();
      console.log("요소 렌더링 완료");
    } catch (e) {
      console.error("요소 렌더링 중 오류:", e);
    }
  }, [elements, isMounted, canvasReady, background]);

  // canvas와 필요한 메소들을 부모에게 전달
  useEffect(() => {
    if (fabricCanvasRef.current && setCanvasRef) {
      const canvasInstance = fabricCanvasRef.current;

      setCanvasRef({
        canvas: canvasInstance,
        setCanvasImage,
        exportToImage: () => {
          try {
            if (!canvasInstance) return null;
            return canvasInstance.toDataURL({
              format: "png",
              quality: 1,
              multiplier: window.devicePixelRatio || 1,
            });
          } catch (error) {
            console.error("Canvas export error:", error);
            return null;
          }
        },
        deleteSelectedObject: () => {
          try {
            if (!canvasInstance) return;
            const activeObject = canvasInstance.getActiveObject();
            if (activeObject) {
              canvasInstance.remove(activeObject);
              canvasInstance.renderAll();
              // 요소 상태도 함께 업데이트
              if (activeObject.id && typeof removeElement === "function") {
                removeElement(activeObject.id);
              }
            }
          } catch (error) {
            console.error("Delete object error:", error);
          }
        },
        clear: () => {
          try {
            if (!canvasInstance) return;
            // 모든 객체 제거
            canvasInstance.getObjects().forEach((obj) => {
              if (obj.id !== "canvas-border" && obj.type !== "border") {
                canvasInstance.remove(obj);
              }
            });
            canvasInstance.renderAll();
          } catch (error) {
            console.error("Canvas clear error:", error);
          }
        },
      });
    }
  }, [setCanvasRef, setCanvasImage, removeElement]);

  // 드로잉 모드 변경 감지 및 처리
  useEffect(() => {
    if (!fabricCanvasRef.current || !canvasReady) return;

    const canvas = fabricCanvasRef.current;

    try {
      // 드로잉 모드 상태에 따라 캔버스 속성 업데이트
      canvas.isDrawingMode = isDrawMode;

      // 드로잉 모드 활성화 시 브러시 속성 초기화
      if (isDrawMode) {
        // 브러시가 없는 경우 생성 보장
        if (!canvas.freeDrawingBrush) {
          console.log("드로잉 모드 활성화: 브러시 초기화");
          // 브러시가 생성될 때까지 약간 대기
          setTimeout(() => {
            if (canvas.freeDrawingBrush) {
              // 브러시 속성 설정
              safeSetBrushProperty(canvas, "color", strokeColor);
              safeSetBrushProperty(canvas, "width", strokeWidth);
            }
          }, 50);
        } else {
          // 브러시가 이미 존재하는 경우 속성 직접 설정
          safeSetBrushProperty(canvas, "color", strokeColor);
          safeSetBrushProperty(canvas, "width", strokeWidth);
        }

        // 객체 선택 불가 설정
        canvas.selection = false;
        canvas.forEachObject((obj) => {
          obj.selectable = false;
          obj.evented = false;
        });
      } else {
        // 드로잉 모드 비활성화 시 객체 선택 가능하게 설정
        canvas.selection = true;
        canvas.forEachObject((obj) => {
          if (obj.id !== "canvas-border" && obj.type !== "border") {
            obj.selectable = true;
            obj.evented = true;
          }
        });
      }

      // 캔버스 다시 렌더링
      canvas.requestRenderAll();
    } catch (e) {
      console.error("드로잉 모드 설정 중 오류:", e);
    }
  }, [isDrawMode, strokeColor, strokeWidth, canvasReady]);

  // 브러시 속성 변경 감지 및 처리
  useEffect(() => {
    if (!fabricCanvasRef.current || !canvasReady) return;

    // 드로잉 모드가 활성화된 경우에만 처리
    if (isDrawMode) {
      try {
        // 브러시 색상 및 굵기 업데이트
        safeSetBrushProperty(fabricCanvasRef.current, "color", strokeColor);
        safeSetBrushProperty(fabricCanvasRef.current, "width", strokeWidth);
      } catch (e) {
        console.error("브러시 속성 업데이트 중 오류:", e);
      }
    }
  }, [strokeColor, strokeWidth, isDrawMode, canvasReady]);

  // 객체 변경 이벤트 핸들러
  const handleObjectChange = (e) => {
    try {
      if (!fabricCanvasRef.current) return;

      console.log("Canvas: handleObjectChange 호출됨", {
        eventType: e.type,
        target: e.target
          ? {
              type: e.target.type,
              id: e.target.id,
              customType: e.target.customType,
              selectable: e.target.selectable,
            }
          : "없음",
        selected: e.selected
          ? e.selected.map((obj) => ({
              type: obj.type,
              id: obj.id,
              customType: obj.customType,
            }))
          : "없음",
      });

      // 이벤트 타입에 따른 처리
      if (e.type === "textEditing") {
        // 텍스트 편집 시작 시
        if (onTextEdit && typeof onTextEdit === "function") {
          onTextEdit(true);
        }
        if (setShowTextToolbar && typeof setShowTextToolbar === "function") {
          setShowTextToolbar(true);
        }

        // 텍스트 편집 중인 객체 앞으로 가져오기
        if (e.target) {
          fabricCanvasRef.current.bringObjectToFront(e.target);
          fabricCanvasRef.current.renderAll();
        }
      } else if (
        e.target &&
        (e.target.type === "textbox" || e.target.type === "i-text")
      ) {
        console.log("Canvas: 텍스트 요소 선택됨", e.target.id);
        // 텍스트 요소 선택 시
        if (onSetEditMode) {
          onSetEditMode("text");
        }
        if (setShowTextToolbar && typeof setShowTextToolbar === "function") {
          setShowTextToolbar(true);
        }

        // 선택된 텍스트 객체 ID 상태 업데이트
        setSelectedElementId(e.target.id);

        // 선택된 텍스트 객체 앞으로 가져오기
        fabricCanvasRef.current.bringObjectToFront(e.target);
        fabricCanvasRef.current.renderAll();
      } else if (e.target && e.target.customType === "image") {
        // 이미지 요소 선택 시
        if (onSetEditMode) {
          onSetEditMode("image");
        }
        if (setShowTextToolbar && typeof setShowTextToolbar === "function") {
          setShowTextToolbar(false);
        }

        // 선택된 이미지 객체 ID 상태 업데이트
        setSelectedElementId(e.target.id);
      } else if (e.target && e.target.type === "rect") {
        // 사각형 요소 선택 시
        if (onSetEditMode) {
          onSetEditMode("shape");
        }
        if (setShowTextToolbar && typeof setShowTextToolbar === "function") {
          setShowTextToolbar(false);
        }

        // 선택된 도형 객체 ID 상태 업데이트
        setSelectedElementId(e.target.id);
      } else if (
        e.target &&
        (e.target.type === "circle" || e.target.type === "triangle")
      ) {
        // 기타 도형 요소 선택 시
        if (onSetEditMode) {
          onSetEditMode("shape");
        }
        if (setShowTextToolbar && typeof setShowTextToolbar === "function") {
          setShowTextToolbar(false);
        }

        // 선택된 도형 객체 ID 상태 업데이트
        setSelectedElementId(e.target.id);
      } else if (e.selected && e.selected.length > 1) {
        console.log(
          "Canvas: 다중 요소 선택됨",
          e.selected.map((obj) => obj.id)
        );
        // 다중 요소 선택 시
        if (onSetEditMode) {
          onSetEditMode("group");
        }
        if (setShowTextToolbar && typeof setShowTextToolbar === "function") {
          setShowTextToolbar(false);
        }

        // 다중 선택 시 선택 ID는 null로 설정 (그룹 선택 상태)
        setSelectedElementId(null);
      } else {
        console.log("Canvas: 선택 해제 또는 기타 상황");
        // 선택 해제 시
        if (onSetEditMode) {
          onSetEditMode(null);
        }
        if (setShowTextToolbar && typeof setShowTextToolbar === "function") {
          setShowTextToolbar(false);
        }

        // 선택 해제 시 선택 ID도 초기화
        setSelectedElementId(null);
      }

      // 선택된 객체들 정보 콜백
      if (onObjectsSelected && typeof onObjectsSelected === "function") {
        try {
          // 텍스트 편집 중이면 편집 중인 상태 정보 전달
          if (e.type === "textEditing") {
            const activeObj = fabricCanvasRef.current?.getActiveObject();
            if (
              activeObj &&
              (activeObj.type === "textbox" || activeObj.type === "i-text")
            ) {
              onObjectsSelected([activeObj], "editing");
            }
          }
          // 일반 선택 시 객체 정보 전달
          else if (e.selected) {
            onObjectsSelected(e.selected, "selected");
          }
          // 단일 객체 선택 시
          else if (e.target) {
            onObjectsSelected([e.target], "selected");
          }
          // 선택 해제 시
          else {
            onObjectsSelected([], "none");
          }
        } catch (err) {
          console.error("객체 선택 정보 전달 중 오류:", err);
        }
      }
    } catch (error) {
      console.error("객체 변경 이벤트 처리 중 오류:", error);
    }
  };

  // 선택한 요소에 배경 이미지 적용하는 함수
  const applyBackgroundToElement = (element, background, canvas) => {
    if (!canvas || !background || !element) return;

    try {
      console.log(
        "요소에 배경 적용 시작:",
        background.type,
        "요소 ID:",
        element.id
      );

      const activeObject = canvas
        .getObjects()
        .find((obj) => obj.id === element.id);
      if (!activeObject) {
        console.error("선택한 요소를 찾을 수 없습니다.");
        return;
      }

      if (background.type === "color") {
        // 색상 배경인 경우 요소의 배경색 변경
        activeObject.set("fill", background.value);
        canvas.renderAll();
        console.log("요소에 배경색 적용 완료");
      } else if (background.type === "image" && background.value) {
        // 이미지 배경인 경우 패턴 생성 후 적용
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = function () {
          console.log(
            "요소 배경 이미지 로드 성공:",
            img.width,
            "x",
            img.height
          );

          try {
            // FabricImage 생성
            const fabricImage = new FabricImage(img);

            // 패턴 생성
            const pattern = new Pattern({
              source: img,
              repeat: "no-repeat",
            });

            // 요소의 크기
            const objectWidth = activeObject.width * activeObject.scaleX;
            const objectHeight = activeObject.height * activeObject.scaleY;

            // 캔버스와 이미지 비율 계산
            const objectRatio = objectWidth / objectHeight;
            const imgRatio = img.width / img.height;

            console.log("=== 이미지 크기 디버깅 ===");
            console.log("원본 이미지 크기:", img.width, "x", img.height);
            console.log("캔버스 크기:", objectWidth, "x", objectHeight);

            // 가로와 세로 중 더 큰 비율을 사용하여 캔버스를 완전히 채움
            const scaleToWidth = objectWidth / img.width;
            const scaleToHeight = objectHeight / img.height;
            let scaleX, scaleY;
            scaleX = Math.max(scaleToWidth, scaleToHeight);
            scaleY = scaleX; // 비율 유지

            console.log("계산된 스케일 - X:", scaleX, "Y:", scaleY);

            // 추가 확대 적용
            const extraScale = 1.0; // 추가 확대 없이 원본 비율 유지
            scaleX *= extraScale;
            scaleY *= extraScale;

            console.log(
              "최종 스케일 (extraScale 적용 후) - X:",
              scaleX,
              "Y:",
              scaleY
            );
            console.log(
              "최종 이미지 크기:",
              img.width * scaleX,
              "x",
              img.height * scaleY
            );

            // 패턴 스케일 및 오프셋 설정
            pattern.scaleX = scaleX / activeObject.scaleX;
            pattern.scaleY = scaleY / activeObject.scaleY;
            pattern.offsetX = objectWidth / 2;
            pattern.offsetY = objectHeight / 2;

            // 요소에 패턴 적용
            activeObject.set("fill", pattern);

            // 요소의 clipPath 제거하여 이미지가 잘리지 않도록 함
            activeObject.clipPath = null;

            // 캔버스 렌더링
            canvas.renderAll();
            console.log("요소에 배경 이미지 적용 완료");

            // 상태 업데이트
            updateElement({
              ...element,
              fill: pattern,
              backgroundImage: background.value,
            });
          } catch (err) {
            console.error("요소 배경 이미지 설정 중 오류:", err);
          }
        };

        img.onerror = function (err) {
          console.error("요소 배경 이미지 로드 실패:", err);
        };

        img.src = background.value;
      }
    } catch (e) {
      console.error("요소에 배경 적용 중 오류:", e);
    }
  };

  // 기존 배경 적용 함수 (전체 캔버스에 적용)
  const applyBackground = (background, canvas) => {
    if (!canvas || !background) return;

    try {
      console.log("배경 적용 시작:", background.type);

      // 선택된 요소가 있는지 확인
      const activeObject = canvas.getActiveObject();
      if (activeObject && selectedElementId) {
        // 선택된 요소가 있으면 해당 요소에 배경 적용
        const selectedElement = elements.find(
          (el) => el.id === selectedElementId
        );
        if (selectedElement) {
          applyBackgroundToElement(selectedElement, background, canvas);
          return;
        }
      }

      // 선택된 요소가 없으면 캔버스 전체에 배경 적용
      if (background.type === "color") {
        console.log("배경 색상 적용:", background.value);

        // 배경색 적용
        canvas.set("backgroundColor", background.value);

        // 배경 이미지가 있다면 제거
        canvas.backgroundImage = null;

        // 캔버스 렌더링
        canvas.renderAll();
        console.log("배경색 적용 완료");
      } else if (background.type === "image" && background.value) {
        console.log("배경 이미지 적용 시도:", typeof background.value);

        // 기본 배경색 설정 (이미지 로딩 전)
        canvas.set("backgroundColor", "#ffffff");

        try {
          console.log("배경 이미지 설정 - 직접 방식 사용");
          // setBackgroundImage 대신 직접 이미지 객체 생성 후 설정
          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = function () {
            try {
              // 캔버스 크기
              const canvasWidth = canvas.width;
              const canvasHeight = canvas.height;

              console.log("=== 이미지 크기 디버깅 ===");
              console.log("원본 이미지 크기:", img.width, "x", img.height);
              console.log("캔버스 크기:", canvasWidth, "x", canvasHeight);

              // 캔버스와 이미지 비율 계산
              const canvasRatio = canvasWidth / canvasHeight;
              const imgRatio = img.width / img.height;

              console.log("비율 - 캔버스:", canvasRatio, "이미지:", imgRatio);

              // 이미지 객체 생성
              const fabricImage = new FabricImage(img);

              // 이미지를 캔버스에 꽉 차게 표시 (CSS의 cover 방식)
              let scaleX, scaleY;

              // 항상 캔버스 너비에 맞추어 스케일 계산
              scaleX = canvasWidth / img.width;
              scaleY = scaleX; // 비율 유지

              console.log("계산된 스케일 - X:", scaleX, "Y:", scaleY);

              // 추가 확대 적용
              const extraScale = 1.1; // 50% 추가 확대로 여백 없이 채움
              scaleX *= extraScale;
              scaleY *= extraScale;

              console.log(
                "최종 스케일 (extraScale 적용 후) - X:",
                scaleX,
                "Y:",
                scaleY
              );
              console.log(
                "최종 이미지 크기:",
                img.width * scaleX,
                "x",
                img.height * scaleY
              );

              // 배경 이미지 속성 설정
              fabricImage.set({
                originX: "center",
                originY: "center",
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                scaleX: scaleX,
                scaleY: scaleY,
                selectable: false,
                evented: false,
              });

              // clipPath 제거하여 배경 이미지가 캔버스 경계에 제한되지 않도록 함
              canvas.clipPath = null;

              // 배경 이미지로 직접 설정
              canvas.backgroundImage = fabricImage;

              // 배경 이미지의 위치를 오른쪽으로 조정
              canvas.backgroundImage.left = canvasWidth / 2 + 10; // 오른쪽으로 100px 이동
              canvas.backgroundImage.top = canvasHeight / 2 + 20;
              canvas.backgroundImage.originX = "center";
              canvas.backgroundImage.originY = "center";

              console.log("=== 이미지 설정 완료 ===");
              console.log(
                "최종 배경 이미지 위치:",
                canvas.backgroundImage.left,
                "x",
                canvas.backgroundImage.top
              );
              console.log(
                "최종 배경 이미지 크기:",
                canvas.backgroundImage.width * canvas.backgroundImage.scaleX,
                "x",
                canvas.backgroundImage.height * canvas.backgroundImage.scaleY
              );

              canvas.renderAll();
            } catch (innerErr) {
              console.error("배경 이미지 설정 중 오류:", innerErr);
              canvas.set("backgroundColor", "#f5f5f5");
              canvas.renderAll();
            }
          };

          img.onerror = function (err) {
            console.error("이미지 로드 실패:", err);
            canvas.set("backgroundColor", "#f5f5f5");
            canvas.renderAll();
          };

          img.src = background.value;
        } catch (err) {
          console.error("배경 이미지 초기화 실패:", err);

          // 기본 배경색으로 대체
          canvas.set("backgroundColor", "#f5f5f5");
          canvas.renderAll();
        }
      }
    } catch (e) {
      console.error("배경 적용 중 오류:", e);
      if (canvas) {
        canvas.set("backgroundColor", "#f0f0f0");
        canvas.renderAll();
      }
    }
  };

  useEffect(() => {
    if (!canvas) return;

    canvas.on("mouse:down", (e) => {
      if (e.target && e.target.customType === "text") {
        // 선택된 객체가 텍스트인 경우 selectedElementId 업데이트
        setSelectedElementId(e.target.id);
      }
    });

    canvas.on("text:changed", (e) => {
      if (e.target) {
        const updatedText = e.target.text;
        // 텍스트 변경 시 상태 업데이트
        updateElement(e.target.id, { text: updatedText });
      }
    });

    canvas.on("object:modified", (e) => {
      if (e.target && e.target.customType === "text") {
        const obj = e.target;
        // 위치, 크기 등이 변경되었을 때 상태 업데이트
        updateElement(obj.id, {
          x: obj.left,
          y: obj.top,
          width: obj.width * obj.scaleX,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          rotation: obj.angle,
        });
      }
    });

    return () => {
      canvas.off("mouse:down");
      canvas.off("text:changed");
      canvas.off("object:modified");
    };
  }, [canvas]);

  return (
    <div
      ref={canvasContainerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{
        zIndex: 20,
        minHeight: "400px",
        maxHeight: "80vh",
        height: "80%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        style={{
          zIndex: 30,
          pointerEvents: "auto",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas
          ref={canvasRef}
          className="border border-gray-200 dark:border-gray-700 rounded-md shadow-sm"
          style={{
            pointerEvents: "auto",
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "cover",
            borderWidth: "2px",
            overflow: "hidden",
            touchAction: "none", // 모바일 터치 동작 방지
          }}
        />
      </div>
    </div>
  );
}
