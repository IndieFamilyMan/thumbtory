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
  isMobile,
}) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const canvasDOMRef = useRef(null);
  const cleanupTimerRef = useRef(null);
  const prevPlatformIdRef = useRef(null);
  const isResizingRef = useRef(false);
  const platformChangeTimerRef = useRef(null);
  const platformChangeCountRef = useRef(0);
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasEmpty, setCanvasEmpty] = useState(true);
  const [canvasKey, setCanvasKey] = useState(Date.now());
  const [isMounted, setIsMounted] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isOnMobile, setIsOnMobile] = useState(false);
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

  // 텍스트 편집 중인지 확인하는 함수
  const isEditingText = useCallback(() => {
    if (!fabricCanvasRef.current) return false;

    // 활성 객체가 텍스트이고 편집 모드인지 확인
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (
      activeObject &&
      (activeObject.type === "textbox" || activeObject.type === "i-text")
    ) {
      return activeObject.isEditing;
    }

    return false;
  }, []);

  // 안전하게 브러시 속성에 접근하는 헬퍼 함수
  const safeSetBrushProperty = (canvas, property, value) => {
    if (!canvas) return;

    // 브러시 초기화 재시도 횟수 제한을 위한 정적 변수
    if (!window.__BRUSH_INIT_ATTEMPTS__) {
      window.__BRUSH_INIT_ATTEMPTS__ = 0;
    }

    try {
      // 최대 재시도 횟수를 초과한 경우 무한 경고 방지
      if (window.__BRUSH_INIT_ATTEMPTS__ > 5) {
        return; // 재시도 중단
      }

      // 먼저 drawing mode를 활성화하여 브러시 생성 보장
      const previousDrawingMode = canvas.isDrawingMode;

      // 브러시 생성 보장을 위해 drawing mode 활성화
      canvas.isDrawingMode = true;

      // 작은 지연 후 브러시 초기화 시도
      setTimeout(() => {
        try {
          // 최대 재시도 횟수 확인
          window.__BRUSH_INIT_ATTEMPTS__++;

          // 브러시 객체가 생성되었는지 확인
          if (!canvas.freeDrawingBrush) {
            // 최대 재시도 횟수에 따라 로그 레벨 조정
            if (window.__BRUSH_INIT_ATTEMPTS__ <= 3) {
              console.log("정보: freeDrawingBrush 초기화 진행 중...");
            } else {
              console.log(
                "정보: freeDrawingBrush 초기화 재시도 (시도 " +
                  window.__BRUSH_INIT_ATTEMPTS__ +
                  "/5)"
              );
            }

            // 기본 브러시 클래스 확인
            if (typeof fabric !== "undefined" && fabric.PencilBrush) {
              canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            }
          } else {
            // 브러시가 초기화되면 카운터 초기화
            window.__BRUSH_INIT_ATTEMPTS__ = 0;
          }

          // 속성 설정
          if (canvas.freeDrawingBrush && property && value !== undefined) {
            canvas.freeDrawingBrush[property] = value;
          }

          // 이전 drawing mode 상태로 복원 (중요: 항상 false로 설정)
          canvas.isDrawingMode = previousDrawingMode === true ? true : false;

          // 강제로 false로 설정하는 타이머 추가 (안전장치)
          setTimeout(() => {
            if (canvas && canvas.isDrawingMode === true) {
              console.log("drawing mode 강제 비활성화 (안전장치)");
              canvas.isDrawingMode = false;
              canvas.renderAll();
            }
          }, 300);
        } catch (innerErr) {
          // 오류 발생해도 조용히 처리
          if (window.__BRUSH_INIT_ATTEMPTS__ <= 3) {
            console.log("정보: 브러시 속성 설정 재시도 중");
          }
        }
      }, 200); // 조금 더 긴 지연 시간
    } catch (e) {
      // 치명적인 오류가 아닌 경우 조용히 무시
      if (window.__BRUSH_INIT_ATTEMPTS__ <= 3) {
        console.log(`정보: 브러시 ${property} 속성 설정 지연됨`);
      }
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
    if (!canvasReady || !fabricCanvasRef.current) return;

    // 이미 처리 중이면 중복 처리 방지
    if (isResizingRef.current) {
      console.log("플랫폼 변경 처리 중 - 요청 무시");
      return;
    }

    console.log("플랫폼 ID 변경 감지:", activePlatformId);

    // 캔버스가 이미 초기화된 상태인지 확인
    if (fabricCanvasRef.current) {
      try {
        // 크기 변경을 위한 타이머 설정 (React 렌더링 사이클 밖에서 처리)
        setTimeout(() => {
          try {
            if (!fabricCanvasRef.current) return;

            // 캔버스 크기 업데이트
            const { width, height } =
              SocialMediaLayouts[activePlatformId] ||
              SocialMediaLayouts.instagram;

            // 배경 이미지 임시 저장 (있는 경우)
            const oldBackgroundImage = fabricCanvasRef.current.backgroundImage;

            // 크기 설정 (canvasEl이 실제 DOM 요소)
            fabricCanvasRef.current.setWidth(width);
            fabricCanvasRef.current.setHeight(height);
            fabricCanvasRef.current.calcOffset();

            // 배경 이미지가 있으면 중앙 위치로 복원
            if (oldBackgroundImage) {
              oldBackgroundImage.left = width / 2;
              oldBackgroundImage.top = height / 2;
              fabricCanvasRef.current.backgroundImage = oldBackgroundImage;
            }

            // 요소 다시 렌더링
            fabricCanvasRef.current.renderAll();

            // 스케일 업데이트 트리거 - 지연 처리로 DOM 업데이트 충돌 방지
            setTimeout(() => {
              if (canvasContainerRef.current) {
                window.dispatchEvent(new Event("resize"));
              }
            }, 50);
          } catch (e) {
            console.log("플랫폼 변경 후 캔버스 업데이트 중 오류(무시됨):", e);
          }
        }, 100);
      } catch (e) {
        console.log("플랫폼 변경 초기화 중 오류(무시됨):", e);
      }
    }
  }, [activePlatformId, canvasReady]);

  // 컴포넌트 정리 - 캔버스 및 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      console.log("Canvas 컴포넌트 언마운트 - 정리 시작");

      // DOM 조작 충돌 방지를 위해 정리 작업 지연
      setTimeout(() => {
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

          // Fabric 캔버스 인스턴스 정리
          if (fabricCanvasRef.current) {
            // 1. 이벤트 제거
            fabricCanvasRef.current.off();

            // 2. 객체 제거
            fabricCanvasRef.current.clear();

            // 3. DOM 요소 참조 유지하면서 dispose (DOM은 React가 제거하도록 함)
            const originalEl = fabricCanvasRef.current.lowerCanvasEl;
            if (originalEl && originalEl.parentNode) {
              try {
                // lowerCanvasEl을 일시적으로 null로 설정하여 dispose 중 DOM 조작 방지
                fabricCanvasRef.current.lowerCanvasEl = null;
                fabricCanvasRef.current.upperCanvasEl = null;
                fabricCanvasRef.current.wrapperEl = null;
                fabricCanvasRef.current.dispose();
              } catch (e) {
                console.log("Fabric 캔버스 dispose 중 오류(무시됨):", e);
              }
            } else {
              try {
                fabricCanvasRef.current.dispose();
              } catch (e) {
                console.log("Fabric 캔버스 dispose 중 오류(무시됨):", e);
              }
            }

            // 참조 정리
            fabricCanvasRef.current = null;
          }

          // 전역 참조 제거
          if (window.fabricCanvasInstance) {
            window.fabricCanvasInstance = null;
          }
          if (document.__EDITOR_FABRIC_CANVAS__) {
            document.__EDITOR_FABRIC_CANVAS__ = null;
          }

          console.log("Canvas 컴포넌트 정리 완료");
        } catch (e) {
          console.log("캔버스 정리 중 오류(무시됨):", e);
        }
      }, 50);
    };
  }, []);

  // 디바운스된 플랫폼 변경 핸들러
  const debouncedPlatformChangeHandler = useCallback(
    (newPlatformId) => {
      // 이미 동일한 ID로 처리 중이면 무시
      if (
        isResizingRef.current &&
        prevPlatformIdRef.current === newPlatformId
      ) {
        console.log("이미 처리 중인 플랫폼 변경 요청(중복):", newPlatformId);
        return;
      }

      // 이전 플랫폼 ID와 같으면 불필요한 처리 건너뛰기
      if (prevPlatformIdRef.current === newPlatformId) {
        console.log("동일한 플랫폼으로 변경 요청 - 처리 생략:", newPlatformId);
        return;
      }

      // 처리 중 플래그 활성화
      isResizingRef.current = true;

      try {
        // 변경 횟수 증가 (디버그용)
        platformChangeCountRef.current += 1;
        console.log(
          `플랫폼 변경 #${platformChangeCountRef.current}: ${prevPlatformIdRef.current} → ${newPlatformId}`
        );

        const { width, height } =
          SocialMediaLayouts[newPlatformId] || SocialMediaLayouts.instagram;

        // 이전 타이머 취소
        if (platformChangeTimerRef.current) {
          clearTimeout(platformChangeTimerRef.current);
        }

        // 캔버스 준비 안 된 경우 빠르게 처리 종료
        if (!fabricCanvasRef.current || !canvasReady) {
          console.log("캔버스 미준비 상태에서 플랫폼 변경 - 상태만 업데이트");
          prevPlatformIdRef.current = newPlatformId;
          isResizingRef.current = false;
          return;
        }

        // 지연 실행으로 DOM 업데이트 시간 확보
        platformChangeTimerRef.current = setTimeout(() => {
          if (!fabricCanvasRef.current || !canvasReady) {
            prevPlatformIdRef.current = newPlatformId;
            isResizingRef.current = false;
            return;
          }

          try {
            // 캔버스 DOM 요소 확인
            if (fabricCanvasRef.current.lowerCanvasEl) {
              // 배경 이미지 임시 저장
              const oldBackgroundImage =
                fabricCanvasRef.current.backgroundImage;

              // 크기 변경
              fabricCanvasRef.current.setWidth(width);
              fabricCanvasRef.current.setHeight(height);
              fabricCanvasRef.current.calcOffset();

              // 배경 복원
              if (oldBackgroundImage) {
                oldBackgroundImage.left = width / 2;
                oldBackgroundImage.top = height / 2;
                fabricCanvasRef.current.backgroundImage = oldBackgroundImage;
              }

              // 렌더링
              fabricCanvasRef.current.renderAll();

              // 완료 로그 (디버그용)
              console.log(
                `플랫폼 변경 #${platformChangeCountRef.current} 완료: ${width}x${height}`
              );
            }
          } catch (error) {
            console.log("정보: 캔버스 크기 조정 실패 (무시됨)");
          } finally {
            // 상태 업데이트 및 플래그 초기화
            prevPlatformIdRef.current = newPlatformId;
            isResizingRef.current = false;

            // resize 이벤트는 별도 setTimeout으로 분리하여 React 렌더링과 충돌 방지
            setTimeout(() => {
              try {
                if (canvasContainerRef.current) {
                  window.dispatchEvent(new Event("resize"));
                }
              } catch (e) {
                // 이벤트 에러는 무시
              }
            }, 100);
          }
        }, 300);
      } catch (e) {
        // 오류 발생 시 플래그 초기화
        prevPlatformIdRef.current = newPlatformId;
        isResizingRef.current = false;
      }
    },
    [canvasReady]
  );

  // 플랫폼 변경 감지 및 처리
  useEffect(() => {
    // 마운트 시 첫 실행이거나 실제 변경이 없으면 무시
    if (prevPlatformIdRef.current === activePlatformId) {
      return;
    }

    // 텍스트 편집 중이면 플랫폼 변경 처리 건너뛰기
    if (isEditingText()) {
      prevPlatformIdRef.current = activePlatformId;
      return;
    }

    // 디바운스 핸들러 호출
    debouncedPlatformChangeHandler(activePlatformId);

    // 클린업 함수
    return () => {
      if (platformChangeTimerRef.current) {
        clearTimeout(platformChangeTimerRef.current);
      }
    };
  }, [activePlatformId, debouncedPlatformChangeHandler, isEditingText]);

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

  // 캔버스 초기화 실행
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log("캔버스 DOM 준비됨, 초기화 시작");

    // 이미 초기화된 캔버스가 있으면 리턴
    if (fabricCanvasRef.current) {
      console.log("캔버스가 이미 초기화되어 있음, 건너뜀");
      return;
    }

    // 명시적으로 마운트 상태를 먼저 설정
    setIsMounted(true);

    // 약간의 지연 후 캔버스 초기화 (DOM이 완전히 준비되도록)
    setTimeout(() => {
      // 캔버스 초기화
      const canvas = initializeCanvas();

      if (canvas) {
        // 이벤트 리스너 설정
        setupCanvasEventListeners(canvas);

        // 캔버스 크기 변경 적용
        setTimeout(() => {
          // 에디터 스토어에 캔버스 설정 - 중복 호출로 확실하게 설정
          try {
            useEditorStore.getState().setCanvas(canvas);
            console.log(
              "캔버스 스토어 설정 완료",
              canvas.width,
              "x",
              canvas.height
            );

            // 배경 적용
            if (background) {
              applyBackground(background, canvas);
            }

            // 캔버스 크기 조정 트리거
            window.dispatchEvent(new Event("resize"));

            // 마지막으로 선택된 플랫폼 ID 초기화
            prevPlatformIdRef.current = activePlatformId;
          } catch (e) {
            console.error("캔버스 스토어 설정 중 오류:", e);
          }
        }, 200);
      }
    }, 100);

    return () => {
      // 클린업 로직...
    };
  }, [canvasRef.current]); // 캔버스 DOM 참조가 변경될 때만 실행

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

      try {
        // 컨테이너 크기 측정
        const containerWidth = canvasContainerRef.current.clientWidth;
        const containerHeight = canvasContainerRef.current.clientHeight;

        // 패딩 여백 설정
        const padding = 20;
        const availableWidth = containerWidth - padding * 2;
        const availableHeight = containerHeight - padding * 2;

        // 현재 선택된 플랫폼 크기
        const { width, height } =
          SocialMediaLayouts[activePlatformId] || SocialMediaLayouts.instagram;

        // 비율 계산 (가로 세로 비율 유지)
        let scale;

        // 수평 및 수직 스케일 계산
        const scaleX = availableWidth / width;
        const scaleY = availableHeight / height;

        // 더 작은 스케일 적용하여 컨테이너에 맞추기
        scale = Math.min(scaleX, scaleY);

        console.log("스케일 계산:", {
          containerSize: `${containerWidth}x${containerHeight}`,
          availableSize: `${availableWidth}x${availableHeight}`,
          platformSize: `${width}x${height}`,
          scaleX,
          scaleY,
          appliedScale: scale,
        });

        // 스케일 범위 제한
        const minScale = 0.1;
        const maxScale = 2.0;
        scale = Math.max(minScale, Math.min(maxScale, scale));

        // 캔버스 스케일 설정
        setCanvasScale(scale);

        // 캔버스 렌더링 갱신
        setTimeout(() => {
          if (fabricCanvasRef.current) {
            fabricCanvasRef.current.renderAll();
          }
        }, 50);
      } catch (err) {
        console.error("캔버스 크기 조정 중 오류:", err);
      }
    };

    // 초기 사이즈 설정
    if (fabricCanvasRef.current && canvasReady) {
      setTimeout(updateCanvasSize, 100);
    }

    // 리사이즈 이벤트 핸들러
    const handleResize = debounce(() => {
      if (fabricCanvasRef.current && canvasReady && !isEditingText()) {
        updateCanvasSize();
      }
    }, 200);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activePlatformId, canvasReady, isEditingText]);

  // 캔버스 초기화 함수
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    console.log("캔버스 초기화 시작");

    try {
      // Fabric 캔버스 생성
      const newCanvas = new FabricCanvas(canvasRef.current, {
        width: width,
        height: height,
        backgroundColor: backgroundColor,
        preserveObjectStacking: true,
        selection: true,
        stopContextMenu: true,
        fireRightClick: true,
        enableRetinaScaling: true,
        devicePixelRatio: Math.max(window.devicePixelRatio || 1, 2),
      });

      // 캔버스 설정
      newCanvas.selection = true;
      newCanvas.uniformScaling = false;
      newCanvas.centeredScaling = false;
      newCanvas.centeredRotation = true;

      // 명시적으로 drawing mode 비활성화
      newCanvas.isDrawingMode = false;

      // 브러시 설정
      safeSetBrushProperty(newCanvas, "width", strokeWidth);
      safeSetBrushProperty(newCanvas, "color", strokeColor);

      // 캔버스 인스턴스 저장
      fabricCanvasRef.current = newCanvas;
      setCanvas(newCanvas);

      // 전역 참조 설정
      window.fabricCanvasInstance = newCanvas;
      document.__EDITOR_FABRIC_CANVAS__ = newCanvas;

      // 에디터 스토어에 캔버스 설정 - 이 부분이 중요함
      useEditorStore.getState().setCanvas(newCanvas);

      // 캔버스 상태 업데이트
      setCanvasReady(true);
      setIsMounted(true);

      // 다시 한번 drawing mode 비활성화 확인 (안전장치)
      setTimeout(() => {
        if (newCanvas && newCanvas.isDrawingMode === true) {
          console.log("drawing mode 강제 비활성화 (안전장치 2)");
          newCanvas.isDrawingMode = false;
          newCanvas.renderAll();
        }
      }, 500);

      // 콜백 실행
      if (onCanvasReady && typeof onCanvasReady === "function") {
        onCanvasReady(newCanvas);
      }

      // 캔버스 참조 전달
      if (setCanvasRef && typeof setCanvasRef === "function") {
        setCanvasRef(newCanvas);
      }

      console.log("캔버스 초기화 완료", { width, height });
      return newCanvas;
    } catch (error) {
      console.error("캔버스 초기화 오류:", error);
      return null;
    }
  }, [
    width,
    height,
    backgroundColor,
    strokeWidth,
    strokeColor,
    onCanvasReady,
    setCanvasRef,
  ]);

  // 배경 적용 함수
  const applyBackground = useCallback(
    (background, targetCanvas = null) => {
      const canvas = targetCanvas || fabricCanvasRef.current;

      if (!canvas) {
        console.error("배경 적용 실패: 캔버스가 존재하지 않음");
        return;
      }

      console.log("배경 적용 시작:", background?.type, background);

      // 캔버스 확인 및 메서드 검증
      if (!canvas.renderAll || typeof canvas.renderAll !== "function") {
        console.error("캔버스 인스턴스가 올바르지 않음: renderAll 메서드 없음");
        return;
      }

      // 배경 객체가 없거나 타입이 없는 경우
      if (!background || !background.type) {
        canvas.backgroundColor = "#ffffff";
        canvas.renderAll();
        return;
      }

      // 배경 색상 적용
      if (background.type === "color") {
        canvas.backgroundColor = background.value || "#ffffff";
        canvas.renderAll();
        console.log("배경 색상 적용 완료:", background.value);
        setCanvasEmpty(false);
        return;
      }

      // 배경 이미지 적용
      if (background.type === "image" && background.url) {
        console.log("배경 이미지 적용 시작:", background.url);

        try {
          // 실제 객체로 이미지 먼저 로드
          const imgElement = new Image();
          imgElement.crossOrigin = "anonymous";

          imgElement.onload = function () {
            console.log(
              "원본 이미지 로드 성공:",
              imgElement.width,
              "x",
              imgElement.height
            );

            try {
              // 캔버스 크기 가져오기
              const canvasWidth = canvas.width || width;
              const canvasHeight = canvas.height || height;

              // FabricImage 객체 직접 생성
              const fabricImg = new FabricImage(imgElement);

              // 이미지 속성 설정
              fabricImg.set({
                originX: "left",
                originY: "top",
                left: canvasWidth / 2,
                top: canvasHeight / 2,
              });

              // 이미지 크기 조정 (캔버스를 채우도록)
              const scaleX = canvasWidth / imgElement.width;
              const scaleY = canvasHeight / imgElement.height;
              const scale = Math.max(scaleX, scaleY); // 더 큰 스케일 선택하여 캔버스 전체 채우기

              fabricImg.scale(scale);

              console.log("이미지 스케일링:", {
                canvasSize: `${canvasWidth}x${canvasHeight}`,
                imageSize: `${imgElement.width}x${imgElement.height}`,
                scale: scale,
              });

              // 캔버스에 이미지 설정 (backgroundImage 속성 직접 설정)
              canvas.backgroundImage = fabricImg;

              // 캔버스 강제 다시 그리기
              canvas.renderAll();

              console.log("배경 이미지 적용 성공");
              setCanvasEmpty(false);
            } catch (err) {
              console.error("이미지 객체 설정 중 오류:", err);
              fallbackToWhiteBackground(canvas);
            }
          };

          imgElement.onerror = function (err) {
            console.error("이미지 로드 실패:", err);
            fallbackToWhiteBackground(canvas);
          };

          // 이미지 로드 시작
          imgElement.src = background.url;
          console.log("이미지 로드 요청됨:", background.url);
        } catch (err) {
          console.error("배경 이미지 프로세스 오류:", err);
          fallbackToWhiteBackground(canvas);
        }

        return;
      }

      // 기본 흰색 배경 적용
      fallbackToWhiteBackground(canvas);
    },
    [width, height]
  );

  // 흰색 배경 적용 헬퍼 함수
  const fallbackToWhiteBackground = (canvas) => {
    if (!canvas) return;

    try {
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
      console.log("기본 흰색 배경으로 대체");
    } catch (err) {
      console.error("기본 배경 적용 오류:", err);
    }
  };

  // 캔버스 이벤트 리스너 설정
  const setupCanvasEventListeners = useCallback(
    (canvas) => {
      if (!canvas) return;

      // 텍스트 편집 관련 이벤트 핸들러
      // 텍스트 편집 시작
      canvas.on("text:editing:entered", (e) => {
        if (!e.target) return;

        console.log("Canvas: 텍스트 편집 시작", e.target.id);

        if (setIsTextEditing) setIsTextEditing(true);
        if (onTextEdit) onTextEdit(true);
        if (setShowTextToolbar) setShowTextToolbar(true);
      });

      // 텍스트 편집 종료
      canvas.on("text:editing:exited", (e) => {
        if (!e.target) return;

        console.log("Canvas: 텍스트 편집 종료", e.target.id);

        if (setIsTextEditing) setIsTextEditing(false);
        if (onTextEdit) onTextEdit(false);
        if (setShowTextToolbar) setShowTextToolbar(false);

        // 스토어 상태 업데이트 및 저장
        if (e.target.id) {
          updateElementProperty(e.target.id, "text", e.target.text);
          saveState();
        }
      });

      // 더블 클릭으로 텍스트 편집
      canvas.on("mouse:dblclick", (e) => {
        if (!e.target) return;

        if (e.target.type === "textbox" || e.target.type === "i-text") {
          try {
            e.target.enterEditing();
            canvas.renderAll();
          } catch (err) {
            console.error("텍스트 편집 모드 진입 오류:", err);
          }
        }
      });

      // 명시적으로 selection과 selectable 설정
      canvas.selection = true;
      canvas.isDrawingMode = false;

      // 객체 추가 이벤트 - 모든 객체가 선택 가능하도록 설정
      canvas.on("object:added", (e) => {
        if (!e.target) return;

        // 객체의 selectable 속성 확인 및 설정
        if (
          e.target.selectable === false &&
          !e.target.id?.startsWith("grid-")
        ) {
          console.log("객체 선택 가능하도록 속성 설정:", e.target.type);
          e.target.selectable = true;
          e.target.evented = true;
          canvas.renderAll();
        }

        // 그리드나 가이드 요소가 아닌 경우에만 상태 저장
        if (e.target.id && !e.target.id.startsWith("grid-")) {
          console.log("객체 추가 후 상태 저장:", e.target.type);
          saveState();
        }
      });

      // 키보드 단축키 처리를 위한 전역 이벤트 리스너
      const handleKeyDown = (e) => {
        // 텍스트 편집 중이면 키보드 단축키 처리하지 않음
        if (isEditingText()) return;

        // Ctrl+Z: Undo
        if (e.ctrlKey && !e.shiftKey && e.key === "z") {
          e.preventDefault();
          console.log("Undo 실행");
          undo();
        }

        // Ctrl+Y 또는 Ctrl+Shift+Z: Redo
        if (
          (e.ctrlKey && e.key === "y") ||
          (e.ctrlKey && e.shiftKey && e.key === "z")
        ) {
          e.preventDefault();
          console.log("Redo 실행");
          redo();
        }
      };

      // 전역 이벤트 리스너 등록
      document.addEventListener("keydown", handleKeyDown);

      // 전역 이벤트 핸들러를 window 객체에 저장 (언마운트 시 정리용)
      window.__EDITOR_EVENT_HANDLERS__ = {
        handleKeyDown,
      };

      // 마우스 이벤트
      canvas.on("mouse:down", (e) => {
        // drawing 모드 확인 및 필요시 비활성화
        if (canvas.isDrawingMode && !isDrawMode) {
          console.log("마우스 이벤트에서 drawing mode 비활성화");
          canvas.isDrawingMode = false;
        }

        if (!e.target) return;

        console.log("Canvas: 객체 선택", e.target.type);

        // 텍스트 객체 처리 - bringObjectToFront 제거
        if (e.target.type === "textbox" || e.target.type === "i-text") {
          setSelectedElementId(e.target.id);
        }
      });

      // 객체 선택 이벤트
      canvas.on("selection:created", (e) => {
        if (!e.selected || !e.selected.length) return;

        const selectedObj = e.selected[0];
        console.log("객체 선택됨:", selectedObj.type);

        if (selectedObj.id) {
          setSelectedElementId(selectedObj.id);
        }
      });

      // 객체 선택 해제 이벤트
      canvas.on("selection:cleared", () => {
        setSelectedElementId(null);
      });

      // 객체 수정 이벤트
      canvas.on("object:modified", (e) => {
        if (!e.target || !e.target.id) return;

        console.log("객체 수정됨:", e.target.type);

        // 위치 업데이트
        updateElementProperty(e.target.id, "x", e.target.left);
        updateElementProperty(e.target.id, "y", e.target.top);

        // 회전 및 크기 업데이트
        if (e.target.angle !== 0) {
          updateElementProperty(e.target.id, "rotation", e.target.angle);
        }

        if (e.target.scaleX !== 1) {
          updateElementProperty(e.target.id, "scaleX", e.target.scaleX);
        }

        if (e.target.scaleY !== 1) {
          updateElementProperty(e.target.id, "scaleY", e.target.scaleY);
        }

        // 상태 저장
        saveState();
      });

      // 객체 제거 이벤트 추가
      canvas.on("object:removed", (e) => {
        if (!e.target || !e.target.id || e.target.id.startsWith("grid-"))
          return;

        console.log("객체 삭제됨:", e.target.type);
        saveState();
      });

      // 마우스 아웃 시 isDrawingMode 체크 및 수정
      canvas.on("mouse:out", () => {
        if (canvas.isDrawingMode && !isDrawMode) {
          console.log("마우스 아웃 시 drawing mode 비활성화");
          canvas.isDrawingMode = false;
          canvas.renderAll();
        }
      });
    },
    [
      updateElementProperty,
      saveState,
      setSelectedElementId,
      setIsTextEditing,
      onTextEdit,
      setShowTextToolbar,
      isDrawMode,
      undo,
      redo,
      isEditingText,
    ]
  );

  // 배경 변경 감지
  useEffect(() => {
    if (!fabricCanvasRef.current || !canvasReady) return;

    console.log("배경 변경 감지:", background?.type);

    // setTimeout으로 다음 렌더링 사이클에서 처리
    setTimeout(() => {
      if (fabricCanvasRef.current) {
        // Drawing 모드 확인 및 비활성화
        if (fabricCanvasRef.current.isDrawingMode === true) {
          console.log("배경 적용 전 drawing mode 비활성화");
          fabricCanvasRef.current.isDrawingMode = false;
        }

        applyBackground(background, fabricCanvasRef.current);
      }
    }, 100);
  }, [background, canvasReady, applyBackground]);

  // 요소 변경 감지 및 drawing 모드 확인
  useEffect(() => {
    if (!fabricCanvasRef.current || !canvasReady) return;

    // 요소가 추가/변경될 때 drawing 모드 확인
    if (fabricCanvasRef.current.isDrawingMode === true && !isDrawMode) {
      console.log("요소 변경 시 drawing mode 비활성화");
      fabricCanvasRef.current.isDrawingMode = false;

      // canvas.selection이 false인 경우도 확인
      if (fabricCanvasRef.current.selection === false) {
        console.log("요소 변경 시 selection 활성화");
        fabricCanvasRef.current.selection = true;
      }

      // 캔버스 내 객체들의 selectable 속성 확인 및 수정
      fabricCanvasRef.current.getObjects().forEach((obj) => {
        if (obj.selectable === false && !obj.id?.startsWith("grid-")) {
          console.log("객체 선택 가능하도록 속성 재설정:", obj.type);
          obj.selectable = true;
          obj.evented = true;
        }
      });

      fabricCanvasRef.current.renderAll();
    }
  }, [elements, canvasReady, isDrawMode]);

  // 요소와 캔버스 객체 동기화 (추가된 요소를 캔버스에 렌더링)
  useEffect(() => {
    if (!fabricCanvasRef.current || !canvasReady) return;

    // 현재 캔버스의 객체 ID 목록
    const canvasObjectIds = fabricCanvasRef.current
      .getObjects()
      .map((obj) => obj.id)
      .filter(Boolean);

    // elements 배열에 있지만 캔버스에 없는 요소들 찾기
    const newElements = elements.filter(
      (el) => el.id && !canvasObjectIds.includes(el.id)
    );

    if (newElements.length > 0) {
      console.log(`캔버스에 추가할 새 요소: ${newElements.length}개`);

      // 새 요소들을 캔버스에 추가
      newElements.forEach((element) => {
        try {
          if (element.type === "image" && element.src) {
            // 이미지 요소 추가
            const img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = () => {
              // Fabric Image 객체 생성
              const fabricImage = new FabricImage(img);

              // 요소 속성 설정
              fabricImage.set({
                id: element.id,
                left: element.x,
                top: element.y,
                scaleX: element.scaleX || 1,
                scaleY: element.scaleY || 1,
                angle: element.rotation || 0,
                opacity: element.opacity || 1,
                selectable: true,
                evented: true,
              });

              // 캔버스에 이미지 추가
              const canvas = fabricCanvasRef.current;
              canvas.add(fabricImage);

              // 이미지 요소를 맨 앞으로 가져오기 (시각적으로 맨 위)
              canvas.setActiveObject(fabricImage);
              canvas.bringObjectToFront(fabricImage);
              canvas.renderAll();
              console.log("이미지 요소가 캔버스에 추가됨:", element.id);
            };

            img.onerror = (error) => {
              console.error("이미지 로드 실패:", error);
            };

            // 이미지 로드 시작
            img.src = element.src;
          } else if (element.type === "text") {
            // 텍스트 요소 생성 및 추가
            const textOptions = {
              id: element.id,
              text: element.text || "텍스트를 입력하세요",
              left: element.x,
              top: element.y,
              width: element.width || 300,
              fontSize: element.fontSize || 30,
              fontFamily: element.fontFamily || "Arial",
              fill: element.fill || "#000000",
              textAlign: element.textAlign || "left",
              fontWeight: element.fontWeight || "bold",
              fontStyle: element.fontStyle || "normal",
              underline: element.underline || false,
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
              cornerColor: "#0084ff",
              borderColor: "#0084ff",
              padding: 10,
              originX: "left",
              originY: "top",
              splitByGrapheme: false,
              objectCaching: false,
              strokeWidth: element.strokeWidth || 0,
              stroke: element.stroke || "",
              scaleX: element.scaleX || 1,
              scaleY: element.scaleY || 1,
              angle: element.rotation || 0,
              opacity: element.opacity !== undefined ? element.opacity : 1,
            };

            const textObject = new Textbox(textOptions.text, textOptions);

            // 캔버스에 텍스트 추가
            const textCanvas = fabricCanvasRef.current;
            textCanvas.add(textObject);

            // 텍스트 요소를 맨 앞으로 가져오기 (시각적으로 맨 위)
            textCanvas.setActiveObject(textObject);
            textCanvas.bringObjectToFront(textObject);
            textCanvas.renderAll();

            // 요소가 선택되어 있었다면 선택 상태로 설정
            if (element.id === selectedElementId) {
              textCanvas.setActiveObject(textObject);
            }

            console.log("텍스트 요소가 캔버스에 추가됨:", element.id);
          } else if (element.type === "shape") {
            const shapeObj = createShapeObject(element);
            if (shapeObj) {
              const shapeCanvas = fabricCanvasRef.current;
              shapeCanvas.add(shapeObj);

              // 도형 요소를 맨 앞으로 가져오기 (시각적으로 맨 위)
              shapeCanvas.setActiveObject(shapeObj);
              shapeCanvas.bringObjectToFront(shapeObj);

              // 요소 ID 선택 상태 확인
              if (element.id === selectedElementId) {
                shapeCanvas.setActiveObject(shapeObj);
              }
            }
          } else if (element.type === "icon") {
            // 아이콘 요소는 기존 로직에서 처리됨
          }
        } catch (error) {
          console.error(`요소 추가 중 오류 (${element.type}):`, error);
        }
      });
    }

    // 요소 순서 동기화
    syncElementsOrder();
  }, [elements, canvasReady]);

  // 요소 순서 동기화 함수
  const syncElementsOrder = () => {
    if (!fabricCanvasRef.current || !canvasReady) return;

    try {
      const canvas = fabricCanvasRef.current;

      // 스토어에서 현재 요소 목록 가져오기
      const { elements } = useEditorStore.getState();

      // 요소가 없으면 처리하지 않음
      if (!elements || elements.length === 0) return;

      // 캔버스 객체 중 요소 ID가 있는 것만 필터링
      const validObjects = canvas.getObjects().filter((obj) => obj.id);

      // 매핑: 요소 ID에 대한 인덱스 저장
      const elementIndexMap = {};
      elements.forEach((element, index) => {
        if (element.id) {
          elementIndexMap[element.id] = index;
        }
      });

      // 모든 객체를 Z-index 기준으로 재정렬
      // elements 배열의 인덱스가 낮을수록 아래에 위치 (먼저 그려짐)
      const sortedObjects = [...validObjects].sort((a, b) => {
        const aIndex =
          elementIndexMap[a.id] !== undefined ? elementIndexMap[a.id] : -1;
        const bIndex =
          elementIndexMap[b.id] !== undefined ? elementIndexMap[b.id] : -1;
        return aIndex - bIndex;
      });

      // 현재 선택된 객체의 ID를 저장 (있는 경우)
      const activeObject = canvas.getActiveObject();
      const activeObjectId = activeObject ? activeObject.id : null;

      // 먼저 캔버스에서 선택 해제
      canvas.discardActiveObject();

      // 모든 오브젝트를 캔버스에서 제거 (배경 설정은 유지됨)
      validObjects.forEach((obj) => {
        canvas.remove(obj);
      });

      // 정렬된 순서대로 다시 객체 추가
      sortedObjects.forEach((obj) => {
        canvas.add(obj);
      });

      // 선택 상태 복원 (ID 기반으로 새로 추가된 객체를 찾음)
      if (activeObjectId) {
        const newObjects = canvas.getObjects();
        const objectToSelect = newObjects.find(
          (obj) => obj.id === activeObjectId
        );
        if (objectToSelect) {
          canvas.setActiveObject(objectToSelect);
        }
      }

      // 변경사항 반영
      canvas.requestRenderAll();
    } catch (error) {
      console.error("요소 순서 동기화 중 오류:", error);
    }
  };

  // 화면 크기에 따라 모바일 여부 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsOnMobile(window.innerWidth < 768);
    };

    // 초기 체크
    checkMobile();

    // isMobile prop이 명시적으로 전달된 경우 그 값을 사용
    if (isMobile !== undefined) {
      setIsOnMobile(isMobile);
    }

    // 창 크기 변경 이벤트에 대응
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [isMobile]);

  // 도형 객체 생성 함수
  const createShapeObject = (element) => {
    let shapeObject;

    // 도형 유형에 따라 객체 생성
    if (element.shape === "rectangle") {
      shapeObject = new Rect({
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        fill: element.fill || "#3b82f6",
        stroke: element.stroke || "#1d4ed8",
        strokeWidth: element.strokeWidth || 0,
        rx: element.cornerRadius || 0,
        ry: element.cornerRadius || 0,
        angle: element.rotation || 0,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        id: element.id,
        customType: "shape",
        selectable: true,
        hasControls: true,
        hasBorders: true,
        centeredScaling: false, // 비대칭 스케일링을 위해 false로 설정
        centeredRotation: true, // 회전은 중앙 기준으로 유지
        originX: "left", // 왼쪽을 기준점으로 설정
        originY: "top", // 위쪽을 기준점으로 설정
        lockUniScaling: false, // 비율 고정 해제
        transparentCorners: false,
        cornerColor: "#0084ff",
        borderColor: "#0084ff",
        cornerSize: 8,
        padding: 5,
      });
    } else if (element.shape === "circle") {
      shapeObject = new Circle({
        left: element.x,
        top: element.y,
        radius: Math.min(element.width, element.height) / 2,
        fill: element.fill || "#3b82f6",
        stroke: element.stroke || "#1d4ed8",
        strokeWidth: element.strokeWidth || 0,
        angle: element.rotation || 0,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        id: element.id,
        customType: "shape",
        selectable: true,
        hasControls: true,
        hasBorders: true,
        centeredScaling: false, // 비대칭 스케일링을 위해 false로 설정
        centeredRotation: true, // 회전은 중앙 기준으로 유지
        originX: "left", // 왼쪽을 기준점으로 설정
        originY: "top", // 위쪽을 기준점으로 설정
        lockUniScaling: false, // 비율 고정 해제
        transparentCorners: false,
        cornerColor: "#0084ff",
        borderColor: "#0084ff",
        cornerSize: 8,
        padding: 5,
      });
    } else if (element.shape === "triangle") {
      shapeObject = new Triangle({
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        fill: element.fill || "#3b82f6",
        stroke: element.stroke || "#1d4ed8",
        strokeWidth: element.strokeWidth || 0,
        angle: element.rotation || 0,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        id: element.id,
        customType: "shape",
        selectable: true,
        hasControls: true,
        hasBorders: true,
        centeredScaling: false, // 비대칭 스케일링을 위해 false로 설정
        centeredRotation: true, // 회전은 중앙 기준으로 유지
        originX: "left", // 왼쪽을 기준점으로 설정
        originY: "top", // 위쪽을 기준점으로 설정
        lockUniScaling: false, // 비율 고정 해제
        transparentCorners: false,
        cornerColor: "#0084ff",
        borderColor: "#0084ff",
        cornerSize: 8,
        padding: 5,
      });
    }

    return shapeObject;
  };

  // 캔버스 UI 렌더링
  return (
    <div
      id="canvasContainer"
      ref={canvasContainerRef}
      className={backgroundColor ? "hasBackgroundColor" : ""}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "1",
        overflow: "hidden",
        pointerEvents: "auto",
        padding: isOnMobile ? "5px" : "20px",
        boxSizing: "border-box",
      }}
    >
      <style jsx>{`
        @media (max-width: 768px) {
          #canvasContainer {
            padding: 5px !important;
          }
        }
      `}</style>
      {/* 캔버스 컨테이너 */}
      <div
        style={{
          transform: `scale(${canvasScale})`,
          transformOrigin: "center center",
          transition: "transform 0.2s ease-out",
          boxShadow: isOnMobile
            ? "0 1px 3px rgba(0, 0, 0, 0.08)"
            : "0 2px 8px rgba(0, 0, 0, 0.1)",
          borderRadius: isOnMobile ? "2px" : "4px",
          position: "relative",
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: "#f5f5f5",
          border: isOnMobile
            ? "0.5px solid rgba(0, 0, 0, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* 실제 캔버스 엘리먼트 */}
        <canvas
          key={canvasKey}
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      {/* 디버그 정보 - 개발 중에만 표시 */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "absolute",
            bottom: "5px",
            left: "5px",
            fontSize: "10px",
            color: "#888",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "2px 5px",
            borderRadius: "2px",
            pointerEvents: "none",
          }}
        ></div>
      )}
    </div>
  );
}
