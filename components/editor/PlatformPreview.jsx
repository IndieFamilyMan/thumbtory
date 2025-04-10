"use client";

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useEditorStore } from "@/store/editor";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

export const PlatformPreview = forwardRef(function PlatformPreview(
  { onExport, standalone = false, isMobileView = false },
  ref
) {
  const {
    platforms,
    activePlatformId,
    elements,
    background,
    togglePlatform,
    setActivePlatform,
    seo,
    selectedPlatforms = [],
  } = useEditorStore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [previews, setPreviews] = useState({});
  const [fitMode, setFitMode] = useState("contain"); // 'contain' 또는 'cover' 모드
  const [bgMode, setBgMode] = useState("white"); // 'white', 'transparent', 'dark', 'webp' 모드
  const [fileInfos, setFileInfos] = useState({});
  const previewsRef = useRef({});
  const generationAttemptRef = useRef(0);
  const loadingTypeRef = useRef(null); // 현재 어떤 타입의 버튼이 로딩 중인지 추적

  // 다크 모드 배경색 값 (globals.css에서 가져온 값)
  const darkBgColor = "#0F172A"; // RGB 15 23 42 값의 헥스 코드

  // 미리보기 이미지 생성 함수
  const generatePreviews = async (
    platformIds = [],
    fitModeParam = fitMode,
    bgModeParam = bgMode
  ) => {
    if (isGenerating) return;

    setIsGenerating(true);
    loadingTypeRef.current = "preview"; // 로딩 타입 설정

    try {
      const newPreviews = { ...previews };

      // 플랫폼 ID 선택 로직 개선
      let platformsToGenerate = [];

      if (platformIds && platformIds.length > 0) {
        // 명시적으로 제공된 플랫폼 ID 사용
        platformsToGenerate = platformIds;
      } else if (selectedPlatforms && selectedPlatforms.length > 0) {
        // selectedPlatforms에서 ID 추출
        platformsToGenerate = selectedPlatforms.map((p) => p.id);
      } else {
        // 활성화된 모든 플랫폼 사용
        platformsToGenerate = platforms
          .filter((p) => p.enabled)
          .map((p) => p.id);
      }

      console.log("생성할 미리보기 플랫폼:", platformsToGenerate);

      // 생성할 플랫폼이 없으면 알림
      if (platformsToGenerate.length === 0) {
        toast({
          title: "미리보기 생성 실패",
          description: "활성화된 플랫폼이 없습니다.",
          variant: "destructive",
        });
        setIsGenerating(false);
        loadingTypeRef.current = null;
        return;
      }

      const platformSizeInfo = {}; // 각 플랫폼별 크기 정보 저장을 위한 객체

      for (const platformId of platformsToGenerate) {
        try {
          // 플랫폼별 이미지 생성
          const imageUrl = await generateFullSizeImage(
            platformId,
            fitModeParam,
            bgModeParam
          );

          // 이미지 생성 성공 시에만 처리
          if (imageUrl) {
            newPreviews[platformId] = imageUrl;

            // 파일 크기 및 포맷 정보 계산
            const base64Data = imageUrl.split(",")[1];
            const decodedSize = Math.ceil((base64Data.length * 3) / 4);
            const estimatedKB = Math.ceil(decodedSize / 1024);
            const format =
              bgModeParam === "transparent"
                ? "PNG"
                : bgModeParam === "webp"
                ? "WEBP"
                : "JPEG";

            // 해당 플랫폼 찾기
            const platform = platforms.find((p) => p.id === platformId);

            // 플랫폼별 크기 정보 저장
            platformSizeInfo[platformId] = {
              format: format,
              size: estimatedKB,
              maxSize: platform?.maxSize || 1000,
            };
          } else {
            console.warn(
              `${platformId} 플랫폼의 미리보기 생성에 실패했습니다. 대체 방법을 시도합니다.`
            );

            // 이미지 생성에 실패한 경우 html2canvas로 다시 시도
            try {
              const canvasElement = document.getElementById("canvas");
              if (canvasElement) {
                const html2canvasOptions = {
                  backgroundColor:
                    bgModeParam === "dark" ? darkBgColor : "#FFFFFF",
                  allowTaint: true,
                  useCORS: true,
                  scale: 1,
                  logging: false,
                };

                if (bgModeParam === "transparent") {
                  html2canvasOptions.backgroundColor = null;
                }

                const canvas = await html2canvas(
                  canvasElement,
                  html2canvasOptions
                );
                const format =
                  bgModeParam === "transparent"
                    ? "image/png"
                    : bgModeParam === "webp"
                    ? "image/webp"
                    : "image/jpeg";

                const fallbackImageUrl = canvas.toDataURL(format, 0.9);
                if (fallbackImageUrl && fallbackImageUrl !== "data:,") {
                  newPreviews[platformId] = fallbackImageUrl;
                  console.log(
                    `${platformId} 플랫폼의 미리보기를 대체 방법으로 생성했습니다.`
                  );
                }
              }
            } catch (fallbackError) {
              console.error(
                `${platformId} 플랫폼 미리보기 대체 생성 실패:`,
                fallbackError
              );
            }
          }
        } catch (error) {
          console.error(
            `Error generating preview for platform ${platformId}:`,
            error
          );
        }
      }

      setPreviews(newPreviews);
      previewsRef.current = newPreviews;

      // 플랫폼별 크기 정보 저장을 위한 상태 업데이트
      setFileInfos(platformSizeInfo);
    } catch (error) {
      console.error("Error generating previews:", error);
      toast({
        title: "미리보기 생성 오류",
        description: "미리보기 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      loadingTypeRef.current = null;
      generationAttemptRef.current = 0;
    }
  };

  // 외부에서 참조할 수 있도록 함수 노출
  useImperativeHandle(ref, () => ({
    generatePreviews,
  }));

  // 요소나 배경 변경 시 미리보기 업데이트
  useEffect(() => {
    // 요소나 배경이 있는 경우에만 미리보기 생성
    if (elements.length > 0 || (background && background.value)) {
      const debounceTimer = setTimeout(() => {
        try {
          generatePreviews();
        } catch (error) {
          console.error("Error in auto preview generation:", error);
        }
      }, 1000); // 1초 디바운스 (더 안정적인 생성을 위해 시간 증가)

      return () => clearTimeout(debounceTimer);
    }
  }, [elements, background]);

  // 기존 코드에 독립적으로 동작할 수 있도록 useEffect 추가
  useEffect(() => {
    // 컴포넌트가 독립적으로 사용될 때 초기 미리보기 생성
    if (
      standalone &&
      (elements.length > 0 || (background && background.value))
    ) {
      const initialTimer = setTimeout(() => {
        try {
          generatePreviews();
        } catch (error) {
          console.error("Error in initial preview generation:", error);
        }
      }, 800);

      return () => clearTimeout(initialTimer);
    }
  }, [standalone]);

  // 모든 플랫폼 내보내기 핸들러
  const handleExportAll = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    loadingTypeRef.current = "export";

    // 내보내기 전에 안내 요소 숨기기
    hideGuideElements();

    // 내보내기 상태 메시지 표시
    toast({
      title: "이미지 내보내기 준비 중",
      description: "썸네일을 생성하는 중입니다. 잠시만 기다려주세요.",
    });

    const enabledPlatforms = platforms.filter((p) => p.enabled);

    if (enabledPlatforms.length === 0) {
      toast({
        title: "내보내기 실패",
        description: "활성화된 플랫폼이 없습니다.",
        variant: "destructive",
      });
      return;
    }

    // 미리보기가 없는 플랫폼이 있는지 확인
    const missingPreviews = enabledPlatforms.some(
      (platform) => !previewsRef.current[platform.id]
    );

    if (missingPreviews) {
      toast({
        title: "내보내기 준비 중",
        description:
          "일부 미리보기가 아직 생성 중입니다. 잠시 후 다시 시도해주세요.",
      });
      // 미리보기 재생성
      generatePreviews();
      return;
    }

    const promises = enabledPlatforms.map((platform) => {
      return generateFullSizeImage(platform, fitMode, bgMode)
        .then((imageUrl) => {
          if (!imageUrl) {
            throw new Error(`Failed to generate image for ${platform.name}`);
          }

          // SEO 최적화된 파일명 생성
          const timestamp = new Date().toISOString().split("T")[0];
          const sanitizedFilename = (seo.filename || "thumbtory")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          // 파일 확장자 결정 (jpeg 또는 png)
          const extension =
            bgMode === "transparent"
              ? "png"
              : bgMode === "webp"
              ? "webp"
              : platform.format || "jpeg";

          const fileName = `${sanitizedFilename}-${platform.name
            .replace(/\s+/g, "-")
            .toLowerCase()}-${platform.width}x${
            platform.height
          }-${timestamp}.${extension}`;

          // 다운로드 트리거
          const link = document.createElement("a");
          link.href = imageUrl;
          link.download = fileName;

          // 이미지 메타데이터 설정
          if (seo.altText) {
            const img = new Image();
            img.src = imageUrl;
            img.alt = seo.altText;
            if (seo.description) {
              img.setAttribute("data-description", seo.description);
            }
            if (seo.keywords && seo.keywords.length > 0) {
              img.setAttribute("data-keywords", seo.keywords.join(","));
            }
          }

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          return platform.name;
        })
        .catch((error) => {
          console.error(`이미지 내보내기 실패 (${platform.name}):`, error);
          return null;
        });
    });

    Promise.all(promises)
      .then((results) => {
        const successCount = results.filter(Boolean).length;

        toast({
          title: "일괄 내보내기 완료",
          description: `${successCount}/${enabledPlatforms.length} 플랫폼의 썸네일이 내보내기 되었습니다.`,
          variant: successCount > 0 ? "default" : "destructive",
        });
      })
      .catch((error) => {
        console.error("일괄 내보내기 중 오류 발생:", error);
        toast({
          title: "내보내기 실패",
          description: "일부 썸네일을 생성하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsGenerating(false);
        loadingTypeRef.current = null;
      });
  };

  // 가이드 요소(그리드, 텍스트 등) 숨기는 함수
  const hideGuideElements = () => {
    try {
      const activeCanvas =
        window.fabricCanvasInstance || document.__EDITOR_FABRIC_CANVAS__;

      if (activeCanvas) {
        const objectsToHide = [];

        // 내보내기 시 숨겨야 할 요소들
        activeCanvas.getObjects().forEach((obj) => {
          if (
            obj.id &&
            (obj.id.startsWith("grid-") ||
              obj.id === "guide-text" ||
              obj.id === "drop-icon" ||
              obj.id === "size-info" ||
              obj.id === "canvas-border")
          ) {
            obj.visible = false;
          }
        });

        // 즉시 렌더링
        activeCanvas.renderAll();

        // 미리보기 모드 설정 (전역 상태에 접근 가능하다면)
        if (
          window.__EDITOR_STATE_HANDLER__ &&
          typeof window.__EDITOR_STATE_HANDLER__.setPreviewMode === "function"
        ) {
          window.__EDITOR_STATE_HANDLER__.setPreviewMode(true);
        }

        console.log("내보내기 준비: 안내 요소 숨김 처리 완료");
      }
    } catch (e) {
      console.error("가이드 요소 숨기기 실패:", e);
    }
  };

  // 내보내기 전에 호출되는 함수
  const prepareExport = (platformId) => {
    // 가이드 요소 숨기기
    hideGuideElements();

    return true;
  };

  // 단일 플랫폼 내보내기 핸들러
  const handleExportPlatform = (platformId) => {
    if (previewsRef.current[platformId]) {
      // 내보내기 준비
      prepareExport(platformId);

      const platform =
        (selectedPlatforms || []).find((p) => p.id === platformId) ||
        platforms.find((p) => p.id === platformId);
      if (!platform) return;

      // 원본 크기의 고품질 이미지 생성
      generateFullSizeImage(platform, fitMode, bgMode)
        .then((imageUrl) => {
          const link = document.createElement("a");

          // SEO 최적화된 파일명 생성
          const timestamp = new Date().toISOString().split("T")[0];
          const sanitizedFilename = (seo.filename || "thumbtory")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          // 파일 확장자 결정 (jpeg 또는 png)
          const extension =
            bgMode === "transparent"
              ? "png"
              : bgMode === "webp"
              ? "webp"
              : platform.format || "jpeg";

          const fileName = `${sanitizedFilename}-${platform.name
            .replace(/\s+/g, "-")
            .toLowerCase()}-${platform.width}x${
            platform.height
          }-${timestamp}.${extension}`;

          link.href = imageUrl;
          link.download = fileName;

          // 이미지 메타데이터 설정 (HTML에서 지원되는 한도 내에서)
          if (seo.altText) {
            const img = new Image();
            img.src = imageUrl;
            img.alt = seo.altText;
            if (seo.description) {
              img.setAttribute("data-description", seo.description);
            }
            if (seo.keywords && seo.keywords.length > 0) {
              img.setAttribute("data-keywords", seo.keywords.join(","));
            }
          }

          link.click();

          toast({
            title: "이미지 내보내기 완료",
            description: `${platform.name} 썸네일(${platform.width}x${platform.height})이 다운로드되었습니다.`,
          });
        })
        .catch((error) => {
          console.error("이미지 내보내기 실패:", error);
          toast({
            title: "내보내기 실패",
            description: "이미지 생성 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        });
    } else {
      toast({
        title: "내보내기 실패",
        description:
          "미리보기 이미지가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  // 원본 크기의 고품질 이미지 생성 함수
  const generateFullSizeImage = async (
    platformParam,
    fitModeParam = fitMode,
    bgModeParam = bgMode
  ) => {
    // 플랫폼 설정 가져오기
    const platform =
      typeof platformParam === "object"
        ? platformParam
        : platforms.find((p) => p.id === platformParam);

    if (!platform) {
      console.error("유효하지 않은 플랫폼:", platformParam);
      return null;
    }

    const platformId = platform.id;
    const platformWidth = platform.width;
    const platformHeight = platform.height;

    try {
      generationAttemptRef.current++;
      const currentAttempt = generationAttemptRef.current;

      // 캔버스 요소를 여러 방법으로 찾기 시도
      let canvasElement = document.getElementById("canvas");

      // fabric.js 캔버스를 직접 참조 시도
      const fabricCanvas =
        window.fabricCanvasInstance || document.__EDITOR_FABRIC_CANVAS__;

      if (fabricCanvas && fabricCanvas.lowerCanvasEl) {
        canvasElement = fabricCanvas.lowerCanvasEl;
        console.log("fabric.js 캔버스의 lowerCanvasEl을 찾았습니다.");
      } else if (!canvasElement) {
        console.warn("Canvas element not found by ID");
        // 여러 선택자로 시도
        canvasElement =
          document.querySelector("canvas.upper-canvas") ||
          document.querySelector("canvas.lower-canvas") ||
          document.querySelector("canvas");

        if (!canvasElement) {
          throw new Error("어떤 선택자로도 캔버스 요소를 찾을 수 없습니다.");
        }
        console.log("대체 선택자로 캔버스 요소를 찾았습니다.");
      }

      // 캔버스 참조가 유효한지 확인
      if (!canvasElement || !canvasElement.getContext) {
        console.error("캔버스 참조가 유효하지 않습니다.");
        throw new Error("유효한 캔버스 요소를 찾을 수 없습니다.");
      }

      console.log("미리보기 생성에 사용할 캔버스:", canvasElement);

      // 가이드 텍스트와 그리드를 임시로 제거
      const canvasWithNoGuides = document.getElementById("canvas");
      if (canvasWithNoGuides) {
        try {
          const activeCanvas =
            window.fabricCanvasInstance || document.__EDITOR_FABRIC_CANVAS__;

          if (activeCanvas) {
            // 가이드 그리드와 텍스트를 찾아 임시로 숨김
            const objectsToHide = [];
            activeCanvas.getObjects().forEach((obj) => {
              if (
                obj.id &&
                (obj.id.startsWith("grid-") ||
                  obj.id === "guide-text" ||
                  obj.id === "drop-icon" ||
                  obj.id === "size-info")
              ) {
                objectsToHide.push({
                  object: obj,
                  wasVisible: obj.visible,
                });
                obj.visible = false;
              }
            });

            // 캔버스 다시 렌더링
            activeCanvas.renderAll();

            // 이미지 생성 후 나중에 복원하기 위해 timeout 설정
            setTimeout(() => {
              objectsToHide.forEach((item) => {
                if (item.object && typeof item.wasVisible !== "undefined") {
                  item.object.visible = item.wasVisible;
                }
              });
              if (activeCanvas) {
                activeCanvas.renderAll();
              }
            }, 500);
          }
        } catch (e) {
          console.error("가이드 숨기기 중 오류:", e);
        }
      }

      // 캔버스 현재 스타일 저장
      const originalStyle = {
        width: canvasElement.style.width,
        height: canvasElement.style.height,
        transform: canvasElement.style.transform,
        background: canvasElement.style.background,
      };

      // Fit 모드에 따라 캔버스 스타일 조정
      const canvasWidth = canvasElement.offsetWidth;
      const canvasHeight = canvasElement.offsetHeight;

      // 캔버스와 플랫폼 크기 비율 계산
      let scale = 1;
      let offsetX = 0;
      let offsetY = 0;

      if (fitModeParam === "contain") {
        // contain 모드: 이미지 전체가 보이도록 맞춤
        const widthRatio = platformWidth / canvasWidth;
        const heightRatio = platformHeight / canvasHeight;
        scale = Math.min(widthRatio, heightRatio);

        // 중앙 정렬을 위한 오프셋 계산
        offsetX = (platformWidth - canvasWidth * scale) / 2;
        offsetY = (platformHeight - canvasHeight * scale) / 2;
      } else {
        // cover 모드: 공간을 채우도록 맞춤 (일부 잘릴 수 있음)
        const widthRatio = platformWidth / canvasWidth;
        const heightRatio = platformHeight / canvasHeight;
        scale = Math.max(widthRatio, heightRatio);

        // 중앙 정렬을 위한 오프셋 계산
        offsetX = (platformWidth - canvasWidth * scale) / 2;
        offsetY = (platformHeight - canvasHeight * scale) / 2;
      }

      // 배경 색상 설정
      let backgroundColor = "#FFFFFF"; // 기본 흰색 배경
      let backgroundOpacity = 1;

      if (bgModeParam === "dark") {
        backgroundColor = "#121212"; // 다크 모드 배경색
      } else if (bgModeParam === "transparent") {
        backgroundOpacity = 0; // 투명 배경
      }

      // 원래 캔버스 스타일 복원
      Object.assign(canvasElement.style, originalStyle);

      // 새 캔버스 생성 (플랫폼 크기에 맞춤)
      const newCanvas = document.createElement("canvas");
      newCanvas.width = platformWidth;
      newCanvas.height = platformHeight;
      const ctx = newCanvas.getContext("2d");

      // 배경 채우기
      ctx.fillStyle = backgroundColor;
      ctx.globalAlpha = backgroundOpacity;
      ctx.fillRect(0, 0, platformWidth, platformHeight);
      ctx.globalAlpha = 1;

      // html2canvas 옵션 설정
      const html2canvasOptions = {
        backgroundColor: backgroundColor,
        allowTaint: true,
        useCORS: true,
        scale: window.devicePixelRatio || 1,
        logging: false,
        ignoreElements: (element) => {
          // 불필요한 요소 무시 (성능 향상)
          return (
            element.classList &&
            (element.classList.contains("toast-container") ||
              element.classList.contains("fixed") ||
              element.nodeName === "BUTTON")
          );
        },
        onclone: (clonedDoc) => {
          // 필요한 경우 클론된 문서 수정
          const clonedCanvas = clonedDoc.querySelector("canvas");
          if (clonedCanvas) {
            // 캔버스에 적용된 transform 제거 (더 정확한 렌더링을 위해)
            clonedCanvas.style.transform = "none";
          }
          return clonedDoc;
        },
      };

      if (bgModeParam === "transparent") {
        html2canvasOptions.backgroundColor = null;
      }

      try {
        // 먼저 fabric.js 캔버스를 사용하여 직접 이미지 생성 시도
        if (fabricCanvas) {
          try {
            console.log("fabric.js로 직접 이미지 생성 시도");

            // 가이드 요소 숨기기
            hideGuideElements();

            // 현재 캔버스 상태 저장
            const originalState = {
              zoom: fabricCanvas.getZoom(),
              width: fabricCanvas.getWidth(),
              height: fabricCanvas.getHeight(),
              viewportTransform: [...fabricCanvas.viewportTransform],
              backgroundColor: fabricCanvas.backgroundColor,
            };

            // 편집 화면에서 보이는 상태 그대로 캡처하기 위한 임시 설정
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");

            // format 결정
            let format = "jpeg";
            if (bgModeParam === "transparent") {
              format = "png";
            } else if (bgModeParam === "webp") {
              format = "webp";
            }

            // 배경색 설정
            if (bgModeParam === "dark") {
              fabricCanvas.set("backgroundColor", darkBgColor);
            } else if (bgModeParam !== "transparent") {
              fabricCanvas.set("backgroundColor", "#FFFFFF");
            }

            // 원본 비율 계산 (줌 상태 포함)
            const effectiveWidth = originalState.width / originalState.zoom;
            const effectiveHeight = originalState.height / originalState.zoom;
            const originalRatio = effectiveWidth / effectiveHeight;
            const targetRatio = platformWidth / platformHeight;

            // 캔버스 렌더링 (현재 줌 상태 유지)
            fabricCanvas.renderAll();

            // 현재 보이는 화면 그대로 캡처
            const viewportData = fabricCanvas.toDataURL({
              format: format,
              quality: 0.95,
              multiplier: 1,
              enableRetinaScaling: true,
            });

            // 이미지로 변환하여 적절한 비율로 조정
            const img = new Image();
            img.src = viewportData;

            // 비동기 처리를 위한 Promise 반환
            return new Promise((resolve) => {
              img.onload = () => {
                tempCanvas.width = platformWidth;
                tempCanvas.height = platformHeight;

                if (fitModeParam === "contain") {
                  // 비율 유지하면서 이미지 전체가 보이도록
                  let drawWidth, drawHeight, offsetX, offsetY;

                  if (originalRatio > targetRatio) {
                    // 너비에 맞추기
                    drawWidth = platformWidth;
                    drawHeight = drawWidth / originalRatio;
                    offsetX = 0;
                    offsetY = (platformHeight - drawHeight) / 2;
                  } else {
                    // 높이에 맞추기
                    drawHeight = platformHeight;
                    drawWidth = drawHeight * originalRatio;
                    offsetX = (platformWidth - drawWidth) / 2;
                    offsetY = 0;
                  }

                  // 배경색 채우기
                  tempCtx.fillStyle =
                    bgModeParam === "dark" ? darkBgColor : "#FFFFFF";
                  tempCtx.fillRect(0, 0, platformWidth, platformHeight);

                  // 이미지 그리기
                  tempCtx.drawImage(
                    img,
                    offsetX,
                    offsetY,
                    drawWidth,
                    drawHeight
                  );
                } else {
                  // 공간을 채우도록 (일부 잘릴 수 있음)
                  let sourceWidth, sourceHeight, sourceX, sourceY;

                  if (originalRatio > targetRatio) {
                    // 높이 기준으로 잘라내기
                    sourceHeight = img.height;
                    sourceWidth = img.height * targetRatio;
                    sourceX = (img.width - sourceWidth) / 2;
                    sourceY = 0;
                  } else {
                    // 너비 기준으로 잘라내기
                    sourceWidth = img.width;
                    sourceHeight = img.width / targetRatio;
                    sourceX = 0;
                    sourceY = (img.height - sourceHeight) / 2;
                  }

                  tempCtx.drawImage(
                    img,
                    sourceX,
                    sourceY,
                    sourceWidth,
                    sourceHeight,
                    0,
                    0,
                    platformWidth,
                    platformHeight
                  );
                }

                // 결과 이미지 생성
                const resultImage = tempCanvas.toDataURL(
                  format === "webp"
                    ? "image/webp"
                    : format === "png"
                    ? "image/png"
                    : "image/jpeg",
                  0.95
                );

                // 원래 캔버스 상태 복원
                fabricCanvas.setZoom(originalState.zoom);
                fabricCanvas.setDimensions({
                  width: originalState.width,
                  height: originalState.height,
                });
                fabricCanvas.viewportTransform =
                  originalState.viewportTransform;
                fabricCanvas.set(
                  "backgroundColor",
                  originalState.backgroundColor
                );
                fabricCanvas.renderAll();

                resolve(resultImage);
              };

              img.onerror = () => {
                console.error("이미지 로딩 실패");
                // 원래 캔버스 상태 복원
                fabricCanvas.setZoom(originalState.zoom);
                fabricCanvas.set(
                  "backgroundColor",
                  originalState.backgroundColor
                );
                fabricCanvas.renderAll();

                // 실패 시 대체 방법으로 생성
                resolve(null);
              };
            });
          } catch (fabricError) {
            console.error("fabric.js 이미지 생성 실패:", fabricError);
            // fabric.js 방식이 실패하면 html2canvas로 대체
          }
        }

        // fabric.js 직접 방식이 실패했거나 사용할 수 없는 경우 html2canvas 사용
        const canvas = await html2canvas(canvasElement, html2canvasOptions);

        // 렌더링된 캔버스를 새 캔버스에 맞게 그리기
        if (fitModeParam === "contain") {
          // contain 모드: 이미지 전체가 보이도록 맞춤
          const scaledWidth = canvasWidth * scale;
          const scaledHeight = canvasHeight * scale;
          ctx.drawImage(
            canvas,
            0,
            0,
            canvas.width,
            canvas.height,
            offsetX,
            offsetY,
            scaledWidth,
            scaledHeight
          );
        } else {
          // cover 모드: 공간을 채우도록 맞춤 (일부 잘릴 수 있음)
          const scaledWidth = canvasWidth * scale;
          const scaledHeight = canvasHeight * scale;

          // 중앙에서 크롭하기 위한 소스 위치 계산
          const sourceX = Math.max(
            0,
            (canvas.width - platformWidth / scale) / 2
          );
          const sourceY = Math.max(
            0,
            (canvas.height - platformHeight / scale) / 2
          );
          const sourceWidth = Math.min(canvas.width, platformWidth / scale);
          const sourceHeight = Math.min(canvas.height, platformHeight / scale);

          ctx.drawImage(
            canvas,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            platformWidth,
            platformHeight
          );
        }

        // 최종 이미지 생성
        let imageUrl = "";
        try {
          if (bgModeParam === "webp") {
            imageUrl = newCanvas.toDataURL("image/webp", 0.9);
          } else if (bgModeParam === "transparent") {
            imageUrl = newCanvas.toDataURL("image/png");
          } else {
            imageUrl = newCanvas.toDataURL("image/jpeg", 0.9);
          }

          if (!imageUrl || imageUrl === "data:,") {
            throw new Error("이미지 URL 생성 실패");
          }

          return imageUrl;
        } catch (dataUrlError) {
          console.error("toDataURL 변환 중 오류:", dataUrlError);

          // fallback으로 PNG 시도
          try {
            return newCanvas.toDataURL("image/png");
          } catch (pngError) {
            console.error("PNG 변환도 실패:", pngError);
            throw new Error("이미지 형식 변환 실패");
          }
        }
      } catch (error) {
        console.error("Error generating full size image:", error);
        toast({
          title: "이미지 생성 오류",
          description: `이미지 생성 중 오류가 발생했습니다: ${
            error.message || "알 수 없는 오류"
          }`,
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error("Error generating full size image:", error);
      toast({
        title: "이미지 생성 오류",
        description: `이미지 생성 중 오류가 발생했습니다: ${
          error.message || "알 수 없는 오류"
        }`,
        variant: "destructive",
      });
      return null;
    }
  };

  // 미리보기 수동 새로고침
  const handleRefreshPreviews = () => {
    try {
      // 활성화된 플랫폼 ID 배열 가져오기
      const enabledPlatformIds = platforms
        .filter((p) => p.enabled)
        .map((p) => p.id);

      // 활성화된 플랫폼이 없는 경우
      if (enabledPlatformIds.length === 0) {
        toast({
          title: "새로고침 실패",
          description: "활성화된 플랫폼이 없습니다.",
          variant: "destructive",
        });
        return;
      }

      // 미리보기 생성 함수 호출
      generatePreviews(enabledPlatformIds, fitMode, bgMode);

      toast({
        title: "미리보기 새로고침",
        description: "미리보기 이미지를 새로 생성합니다.",
      });
    } catch (error) {
      console.error("Error refreshing previews:", error);
      toast({
        title: "새로고침 실패",
        description: "미리보기 새로고침 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 캔버스에 요소가 없는 경우 안내 메시지 표시
  const showEmptyCanvasMessage =
    elements.length === 0 &&
    (!background ||
      (background.type === "color" && background.value === "#ffffff"));

  // 이미지 맞춤 모드 변경 핸들러
  const handleFitModeChange = (mode) => {
    loadingTypeRef.current = `fit-${mode}`;
    setFitMode(mode);
    try {
      generatePreviews(
        (selectedPlatforms || []).map((p) => p.id),
        mode,
        bgMode
      );
    } catch (error) {
      console.error("Error in preview generation:", error);
      toast({
        title: "미리보기 생성 오류",
        description: "미리보기 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 파일 유형 변경 핸들러
  const handleBgModeChange = (mode) => {
    loadingTypeRef.current = `bg-${mode}`;
    setBgMode(mode);
    try {
      generatePreviews(
        (selectedPlatforms || []).map((p) => p.id),
        fitMode,
        mode
      );
    } catch (error) {
      console.error("Error in preview generation:", error);
      toast({
        title: "미리보기 생성 오류",
        description: "미리보기 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`${isMobileView ? "w-full" : ""}`}>
      {/* 옵션 컨트롤 */}
      <div
        className={`flex ${
          isMobileView ? "flex-col space-y-2" : "justify-between"
        } mb-3`}
      >
        <div className="flex space-x-2">
          <div className="flex items-center space-x-1">
            <label htmlFor="fit-mode" className="text-xs">
              표시:
            </label>
            <select
              id="fit-mode"
              className="text-xs p-1 border rounded-md bg-background"
              value={fitMode}
              onChange={(e) => handleFitModeChange(e.target.value)}
              disabled={isGenerating}
            >
              <option value="contain">원본비율</option>
              <option value="cover">꽉채움</option>
            </select>
          </div>
          <div className="flex items-center space-x-1">
            <label htmlFor="bg-mode" className="text-xs">
              배경:
            </label>
            <select
              id="bg-mode"
              className="text-xs p-1 border rounded-md bg-background"
              value={bgMode}
              onChange={(e) => handleBgModeChange(e.target.value)}
              disabled={isGenerating}
            >
              <option value="white">하얀색</option>
              <option value="transparent">투명</option>
              <option value="dark">어두움</option>
              <option value="webp">WEBP</option>
            </select>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            className={`text-xs px-2 py-1 rounded-md ${
              isGenerating && loadingTypeRef.current === "export-all"
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
            onClick={handleExportAll}
            disabled={isGenerating}
          >
            {isGenerating && loadingTypeRef.current === "export-all"
              ? "처리 중..."
              : "모두 내보내기"}
          </button>
          <button
            className={`text-xs px-2 py-1 rounded-md ${
              isGenerating && loadingTypeRef.current === "preview"
                ? "bg-muted text-muted-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
            onClick={handleRefreshPreviews}
            disabled={isGenerating}
          >
            {isGenerating && loadingTypeRef.current === "preview"
              ? "생성 중..."
              : "새로고침"}
          </button>
        </div>
      </div>

      {/* 미리보기 영역 */}
      <div
        className={`space-y-4 ${
          isMobileView ? "max-h-48 overflow-y-auto" : ""
        }`}
      >
        {platforms
          .filter((platform) => platform.enabled)
          .map((platform) => (
            <div key={platform.id} className="border rounded-md p-2 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">{platform.name}</h3>
                <span className="text-xs text-muted-foreground">
                  {platform.width} × {platform.height}
                </span>
              </div>
              <div
                className="relative border overflow-hidden cursor-pointer rounded"
                style={{
                  aspectRatio: `${platform.width} / ${platform.height}`,
                  width: "100%",
                  maxWidth: "100%",
                  margin: "0 auto",
                }}
                onClick={() => setActivePlatform(platform.id)}
              >
                {/* 여기서 실제 미리보기 렌더링 */}
                {previews[platform.id] ? (
                  <div
                    className={`w-full h-full flex justify-center items-center ${
                      bgMode === "dark" ? "bg-gray-900" : "bg-white"
                    }`}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={previews[platform.id]}
                      alt={`Preview for ${platform.name}`}
                      className={`${
                        fitMode === "contain"
                          ? "max-w-full max-h-full object-contain"
                          : "w-full h-full object-cover"
                      }`}
                      style={{
                        maxWidth: fitMode === "contain" ? "98%" : "100%",
                        maxHeight: fitMode === "contain" ? "98%" : "100%",
                        width: fitMode === "cover" ? "100%" : "auto",
                        height: fitMode === "cover" ? "100%" : "auto",
                        objectFit: fitMode === "contain" ? "contain" : "cover",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="flex justify-center items-center h-full text-muted-foreground text-xs"
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {isGenerating && loadingTypeRef.current === "preview"
                      ? "미리보기 생성 중..."
                      : "요소를 추가하여 미리보기를 생성하세요"}
                  </div>
                )}
              </div>
              {/* 옵션으로 내보내기 버튼 추가 */}
              <div className="flex justify-end mt-2">
                <button
                  className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
                  onClick={() => handleExportPlatform(platform.id)}
                  disabled={isGenerating || !previews[platform.id]}
                >
                  내보내기
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
});
