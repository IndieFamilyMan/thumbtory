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
  const [wordpressFillScreen, setWordpressFillScreen] = useState(true); // 워드프레스 화면 꽉 채우기 옵션 (기본값 true)
  const previewsRef = useRef({});
  const generationAttemptRef = useRef(0);
  const loadingTypeRef = useRef(null); // 현재 어떤 타입의 버튼이 로딩 중인지 추적

  // 중요: 워드프레스 이동 디버깅용 플래그
  const debugWordpressMove = useRef(true);

  // 다크 모드 배경색 값 (globals.css에서 가져온 값)
  const darkBgColor = "#0F172A"; // RGB 15 23 42 값의 헥스 코드

  // 워드프레스 플랫폼 화면 꽉 채우기 모드 변경
  const handleWordpressFillChange = (e) => {
    const newValue = e.target.checked;
    setWordpressFillScreen(newValue);

    // 워드프레스 모드를 전역 상태에 저장
    if (window.__EDITOR_STATE_HANDLER__ === undefined) {
      window.__EDITOR_STATE_HANDLER__ = {};
    }

    // 워드프레스 모드 감지 함수 추가
    window.__EDITOR_STATE_HANDLER__.isWordpressMode = () => {
      return newValue;
    };

    // 워드프레스 모드의 fitMode 반환 함수 추가
    window.__EDITOR_STATE_HANDLER__.getWordpressFitMode = () => {
      return newValue ? "cover" : "contain";
    };

    // 설정 로컬 스토리지에 저장
    localStorage.setItem("wordpressFillScreen", newValue.toString());

    // 모드 변경 후 미리보기 업데이트
    if (platforms.some((p) => p.id === "wordpress" && p.enabled)) {
      toast({
        title: newValue
          ? "워드프레스 화면 꽉 채우기 활성화"
          : "워드프레스 화면 꽉 채우기 비활성화",
        description: "미리보기를 업데이트합니다.",
      });

      // 워드프레스 플랫폼만 다시 생성
      setTimeout(() => {
        generatePreviews(["wordpress"], newValue ? "cover" : "contain", bgMode);
      }, 100);
    }
  };

  // 초기화 시 전역 상태에 워드프레스 모드 설정 및 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    // 로컬 스토리지에서 설정 불러오기
    const savedWordpressFill = localStorage.getItem("wordpressFillScreen");
    if (savedWordpressFill !== null) {
      setWordpressFillScreen(savedWordpressFill === "true");
    }

    // 전역 상태에 워드프레스 모드 설정
    if (window.__EDITOR_STATE_HANDLER__ === undefined) {
      window.__EDITOR_STATE_HANDLER__ = {};
    }

    window.__EDITOR_STATE_HANDLER__.isWordpressMode = () => {
      return wordpressFillScreen;
    };

    // 워드프레스 모드의 fitMode 반환 함수 추가
    window.__EDITOR_STATE_HANDLER__.getWordpressFitMode = () => {
      return wordpressFillScreen ? "cover" : "contain";
    };
  }, []);

  // 요소 이동을 위한 대상 객체 찾기 함수
  const findTargetObjects = (canvas, excludeBackgroundImage = true) => {
    if (!canvas || !canvas.getObjects) {
      console.error("❌ 유효하지 않은 캔버스 객체");
      return [];
    }

    try {
      // 모든 캔버스 객체
      const allObjects = canvas.getObjects();
      console.log(`🔎 캔버스에서 총 ${allObjects.length}개 객체 발견`);

      // 배경 이미지 찾기
      const backgroundImage = excludeBackgroundImage
        ? canvas.backgroundImage
        : null;

      // 제외할 객체 ID 패턴 목록
      const excludedIdPatterns = [
        "grid-",
        "guide-",
        "canvas-border",
        "drop-icon",
        "size-info",
      ];

      // 이동 가능한 객체 필터링
      const moveableObjects = allObjects.filter((obj) => {
        // 객체가 유효한지 확인
        if (!obj) return false;

        // 보이지 않는 객체 제외
        if (obj.visible === false) return false;

        // 배경 이미지와 동일한 객체 제외
        if (backgroundImage && obj === backgroundImage) return false;

        // 특정 ID 패턴을 가진 객체 제외
        if (obj.id) {
          for (const pattern of excludedIdPatterns) {
            if (obj.id.startsWith(pattern)) return false;
          }
        }

        // 이미지, 텍스트, 도형 등의 실제 컨텐츠 요소만 포함
        return true;
      });

      console.log(`✅ 이동 가능한 객체 ${moveableObjects.length}개 찾음`);

      // 디버깅 정보 로깅
      moveableObjects.forEach((obj, index) => {
        console.log(`🔹 이동 가능 객체 #${index}: ${obj.type}`, {
          id: obj.id || "ID 없음",
          위치: { left: obj.left, top: obj.top },
          크기: {
            width: obj.width * (obj.scaleX || 1),
            height: obj.height * (obj.scaleY || 1),
          },
          visible: obj.visible,
        });
      });

      return moveableObjects;
    } catch (err) {
      console.error("❌ 이동 가능 객체 찾기 중 오류:", err);
      return [];
    }
  };

  // 워드프레스 플랫폼에 대한 특별 처리 함수 수정
  const applyWordpressStyle = (canvas, platform) => {
    try {
      console.log(`👋 워드프레스 스타일 적용 시작 - 플랫폼 ID: ${platform.id}`);

      // 워드프레스에서는 배경 이미지를 화면에 꽉 채움
      const backgroundImage = canvas.backgroundImage;

      // 디버깅: 배경 이미지 확인
      if (backgroundImage) {
        console.log("✅ 배경 이미지 찾음", {
          width: backgroundImage.width,
          height: backgroundImage.height,
          scaleX: backgroundImage.scaleX,
          scaleY: backgroundImage.scaleY,
        });
      } else {
        console.log("❌ 배경 이미지 없음");
      }

      if (backgroundImage) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // 이미지와 캔버스 비율 계산
        const imgWidth = backgroundImage.width * (backgroundImage.scaleX || 1);
        const imgHeight =
          backgroundImage.height * (backgroundImage.scaleY || 1);
        const canvasRatio = canvasWidth / canvasHeight;
        const imgRatio = imgWidth / imgHeight;

        // 비율에 따라 이미지 스케일 조정
        let scaleX, scaleY;

        // 항상 꽉채움(cover) 모드로 처리
        if (canvasRatio > imgRatio) {
          // 캔버스가 이미지보다 가로로 넓은 경우, 너비에 맞춤
          scaleX = canvasWidth / backgroundImage.width;
          scaleY = scaleX; // 비율 유지

          // 이미지가 가로로 꽉 차도록 추가 확대
          const extraScale = 1.5; // 50% 추가 확대하여 완전히 채움
          scaleX *= extraScale;
          scaleY *= extraScale;
        } else {
          // 캔버스가 이미지보다 세로로 긴 경우, 높이에 맞춤
          scaleY = canvasHeight / backgroundImage.height;
          scaleX = scaleY; // 비율 유지

          // 이미지가 세로로 꽉 차도록 추가 확대
          const extraScale = 1.5; // 50% 추가 확대하여 완전히 채움
          scaleX *= extraScale;
          scaleY *= extraScale;
        }

        // 이미지 스케일 업데이트
        backgroundImage.set({
          scaleX: scaleX,
          scaleY: scaleY,
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: "center",
          originY: "center",
        });

        // 캔버스 업데이트
        canvas.renderAll();
      }

      // 워드프레스 플랫폼인 경우 요소 이동 정보만 계산 (실제 이동은 하지 않음)
      if (platform.id === "wordpress") {
        console.log("🔍 워드프레스 요소 이동 계산 시작", {
          플랫폼: platform.id,
          캔버스크기: { width: canvas.width, height: canvas.height },
          객체수: canvas.getObjects().length,
        });

        // 안전 영역 계산 (캔버스 크기의 15%)
        const safeZoneX = canvas.width * 0.15;
        const safeZoneY = canvas.height * 0.15;

        // 모든 객체 정보 출력하여 디버깅
        const allObjects = canvas.getObjects();
        console.log(`📋 캔버스에 있는 총 객체 수: ${allObjects.length}`);

        // 이동 가능한 객체 필터링
        const moveableObjects = findTargetObjects(canvas);
        console.log(`🚶 이동 가능한 객체 수: ${moveableObjects.length}`);

        if (moveableObjects.length === 0) {
          console.log("⚠️ 이동 가능한 요소가 없습니다");
        } else {
          // 안전 영역 계산 (워드프레스 플랫폼 크기의 15% - 미리보기와 동일한 비율)
          const safeZoneX = canvas.width * 0.15;
          const safeZoneY = canvas.height * 0.15;

          // 이동 정보 계산 (실제로 요소를 이동시키지 않음)
          const moveInfo = [];

          // 모든 요소 처리
          moveableObjects.forEach((obj) => {
            // 객체가 null이거나 필수 속성이 없는 경우 건너뜀
            if (!obj || obj.width === undefined || obj.height === undefined) {
              console.log("⚠️ 유효하지 않은 객체 발견:", obj);
              return;
            }

            // scaleX와 scaleY가 undefined인 경우 기본값 1 사용
            const objScaleX = obj.scaleX !== undefined ? obj.scaleX : 1;
            const objScaleY = obj.scaleY !== undefined ? obj.scaleY : 1;

            // 객체 크기 계산 - NaN 방지를 위한 안전한 계산
            const objWidth = obj.width * objScaleX;
            const objHeight = obj.height * objScaleY;

            // left와 top이 숫자인지 확인
            if (
              typeof obj.left !== "number" ||
              typeof obj.top !== "number" ||
              isNaN(obj.left) ||
              isNaN(obj.top)
            ) {
              console.log("⚠️ 유효하지 않은 위치 값을 가진 객체:", obj);
              return;
            }

            // 원래 위치 저장 (위치 비교용)
            const originalPosition = {
              left: obj.left,
              top: obj.top,
            };

            // 각 가장자리에 대한 거리 계산
            const distToLeft = obj.left;
            const distToRight = canvas.width - (obj.left + objWidth);
            const distToTop = obj.top;
            const distToBottom = canvas.height - (obj.top + objHeight);

            // 안전 영역 이탈 확인 및 이동 거리 계산
            let moveX = 0;
            let moveY = 0;

            if (distToLeft < safeZoneX) moveX = safeZoneX - distToLeft;
            else if (distToRight < safeZoneX)
              moveX = -(safeZoneX - distToRight);

            if (distToTop < safeZoneY) moveY = safeZoneY - distToTop;
            else if (distToBottom < safeZoneY)
              moveY = -(safeZoneY - distToBottom);

            // 이동이 필요한 경우에만 정보 저장
            if (moveX !== 0 || moveY !== 0) {
              console.log(`🔄 요소 이동 계산 (실제 이동 없음): ${obj.type}`, {
                id: obj.id || "없음",
                이동전: { left: obj.left, top: obj.top },
                이동량: { x: moveX, y: moveY },
                이동후예상: { left: obj.left + moveX, top: obj.top + moveY },
              });

              // 이동 정보만 저장 (실제 요소는 이동시키지 않음)
              moveInfo.push({
                id: obj.id,
                type: obj.type,
                originalLeft: obj.left,
                originalTop: obj.top,
                moveX: moveX,
                moveY: moveY,
                newLeft: obj.left + moveX,
                newTop: obj.top + moveY,
              });
            }
          });

          console.log(
            `🎯 워드프레스 플랫폼 요소 이동 계산 완료: ${moveInfo.length}개 요소`
          );

          // 이미지 생성 시 참조할 수 있도록 전역 변수에 저장
          window.__WORDPRESS_MOVE_INFO__ = moveInfo;
        }
      }

      return canvas;
    } catch (error) {
      console.error("워드프레스 스타일 적용 중 오류:", error);
      return canvas;
    }
  };

  // 미리보기 이미지 생성 함수에서 플랫폼별 처리 추가
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

      // 워드프레스 플랫폼에 대한 특별 처리
      const hasWordpress = platformsToGenerate.includes("wordpress");

      if (hasWordpress) {
        console.log("워드프레스 플랫폼 특별 처리:", {
          fillScreen: true, // 항상 꽉채움 모드 사용
          fitMode: "cover", // 항상 cover 모드 적용
        });
      }

      const platformSizeInfo = {}; // 각 플랫폼별 크기 정보 저장을 위한 객체

      const platformImagePromises = platformsToGenerate.map(
        async (platformId) => {
          try {
            // 플랫폼 정보 가져오기
            const platform = platforms.find((p) => p.id === platformId);
            if (!platform) {
              console.error(`플랫폼 정보를 찾을 수 없음: ${platformId}`);
              return null;
            }

            // 플랫폼별 이미지 생성을 위한 설정 결정
            // 워드프레스는 항상 꽉채움 모드 사용
            const currentFitMode =
              platformId === "wordpress" ? "cover" : fitModeParam;

            // 플랫폼별 이미지 생성
            const imageUrl = await generateFullSizeImage(
              platform,
              currentFitMode,
              bgModeParam
            );

            // 이미지 생성 성공 시에만 처리
            if (imageUrl) {
              // 워드프레스 플랫폼 특별 처리
              if (platformId === "wordpress") {
                // 이미지 URL 저장 전에 요소 위치 확인
                console.log("워드프레스 플랫폼 이미지 생성 전 처리:", {
                  platformId,
                  fitMode: "cover", // 항상 cover 모드 적용
                  moveInfo: window.__WORDPRESS_MOVE_INFO__ || [],
                });

                // 저장된 이동 정보가 있으면 활용 (이 부분에서 실제 이미지에 적용)
                if (
                  window.__WORDPRESS_MOVE_INFO__ &&
                  window.__WORDPRESS_MOVE_INFO__.length > 0
                ) {
                  console.log(
                    `📐 이미지 생성을 위해 ${window.__WORDPRESS_MOVE_INFO__.length}개 요소 위치 조정`
                  );

                  // fabric.js 캔버스 참조 가져오기
                  const activeCanvas =
                    window.fabricCanvasInstance ||
                    document.__EDITOR_FABRIC_CANVAS__;

                  if (activeCanvas) {
                    // 이미지 생성용 임시 캔버스 복제
                    const tempCanvas = activeCanvas.toJSON([
                      "id",
                      "type",
                      "originX",
                      "originY",
                      "left",
                      "top",
                      "width",
                      "height",
                      "fill",
                      "stroke",
                      "strokeWidth",
                      "angle",
                      "opacity",
                      "scaleX",
                      "scaleY",
                      "flipX",
                      "flipY",
                      "skewX",
                      "skewY",
                      "text",
                      "fontSize",
                      "fontFamily",
                      "fontWeight",
                      "fontStyle",
                      "lineHeight",
                      "underline",
                      "overline",
                      "linethrough",
                      "textAlign",
                      "backgroundColor",
                      "textBackgroundColor",
                      "charSpacing",
                      "styles",
                      "direction",
                      "path",
                      "pathOffset",
                      "radius",
                    ]);

                    // JSON을 파싱하여 이동 정보 적용
                    if (tempCanvas && tempCanvas.objects) {
                      window.__WORDPRESS_MOVE_INFO__.forEach((moveItem) => {
                        const objIndex = tempCanvas.objects.findIndex(
                          (obj) => obj.id === moveItem.id
                        );

                        if (objIndex !== -1) {
                          // 임시 JSON에만 이동 정보 적용
                          tempCanvas.objects[objIndex].left = moveItem.newLeft;
                          tempCanvas.objects[objIndex].top = moveItem.newTop;
                        }
                      });

                      // 임시 캔버스 JSON 저장 (이미지 생성에 활용)
                      window.__WORDPRESS_TEMP_CANVAS__ = tempCanvas;
                    }
                  } else {
                    console.log("⚠️ fabric.js 캔버스 참조를 찾을 수 없습니다");
                  }
                }

                newPreviews[platformId] = {
                  dataUrl: imageUrl,
                  fitMode: "cover", // 항상 꽉채움 모드 사용
                };
              } else {
                // 다른 플랫폼들은 기존 방식대로 처리
                newPreviews[platformId] = imageUrl;
              }
            }

            return platformId;
          } catch (error) {
            console.error(
              `Error generating preview for platform ${platformId}:`,
              error
            );
            return null;
          }
        }
      );

      const results = await Promise.all(platformImagePromises);

      setPreviews(newPreviews);
      previewsRef.current = newPreviews;
      setFileInfos(platformSizeInfo);
    } catch (error) {
      console.error("미리보기 생성 중 오류 발생:", error);
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
            objectsToHide.push({
              object: obj,
              wasVisible: obj.visible,
            });
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
    // 미리보기가 있는지 확인 (워드프레스 형식 또는 일반 형식)
    const hasPreview =
      previewsRef.current[platformId] &&
      (typeof previewsRef.current[platformId] === "string" ||
        (typeof previewsRef.current[platformId] === "object" &&
          previewsRef.current[platformId].dataUrl));

    if (hasPreview) {
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

    // 워드프레스 플랫폼 특별 처리 플래그
    const isWordpress = platformId === "wordpress";

    try {
      generationAttemptRef.current++;
      const currentAttempt = generationAttemptRef.current;

      // 캔버스 요소를 여러 방법으로 찾기 시도
      let canvasElement = document.getElementById("canvas");

      // fabric.js 캔버스를 직접 참조 시도
      const activeCanvas =
        window.fabricCanvasInstance || document.__EDITOR_FABRIC_CANVAS__;

      if (activeCanvas && activeCanvas.lowerCanvasEl) {
        canvasElement = activeCanvas.lowerCanvasEl;
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

      try {
        const activeCanvas =
          window.fabricCanvasInstance || document.__EDITOR_FABRIC_CANVAS__;

        if (activeCanvas) {
          // 가이드 그리드와 텍스트를 찾아 임시로 숨김
          console.log("activeCanvas 액티브", activeCanvas);
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

          console.log("isWordpress", isWordpress);
          console.log("activeCanvas:", activeCanvas);

          // 워드프레스 플랫폼인 경우 특별 처리 (요소들을 안전 영역으로 이동)
          if (isWordpress && activeCanvas) {
            try {
              console.log("🔄 워드프레스 플랫폼 요소 이동 시작", {
                플랫폼ID: platform.id,
                캔버스유효: !!activeCanvas,
                캔버스크기: `${activeCanvas.width}x${activeCanvas.height}`,
              });

              // fabric.js 캔버스 확인 및 요소 이동 처리
              if (
                activeCanvas &&
                typeof activeCanvas.getObjects === "function"
              ) {
                // 이동 가능한 객체 찾기
                const moveableObjects = findTargetObjects(activeCanvas);

                if (moveableObjects.length === 0) {
                  console.log("⚠️ 이동 가능한 요소가 없습니다");
                } else {
                  // 안전 영역 계산 (워드프레스 플랫폼 크기의 15% - 미리보기와 동일한 비율)
                  const safeZoneX = activeCanvas.width * 0.15;
                  const safeZoneY = activeCanvas.height * 0.15;

                  // 이동 정보 계산 (실제로 요소를 이동시키지 않음)
                  const moveInfo = [];

                  // 모든 요소 처리
                  moveableObjects.forEach((obj) => {
                    // 객체가 null이거나 필수 속성이 없는 경우 건너뜀
                    if (
                      !obj ||
                      obj.width === undefined ||
                      obj.height === undefined
                    ) {
                      console.log("⚠️ 유효하지 않은 객체 발견:", obj);
                      return;
                    }

                    // scaleX와 scaleY가 undefined인 경우 기본값 1 사용
                    const objScaleX = obj.scaleX !== undefined ? obj.scaleX : 1;
                    const objScaleY = obj.scaleY !== undefined ? obj.scaleY : 1;

                    // 객체 크기 계산 - NaN 방지를 위한 안전한 계산
                    const objWidth = obj.width * objScaleX;
                    const objHeight = obj.height * objScaleY;

                    // left와 top이 숫자인지 확인
                    if (
                      typeof obj.left !== "number" ||
                      typeof obj.top !== "number" ||
                      isNaN(obj.left) ||
                      isNaN(obj.top)
                    ) {
                      console.log("⚠️ 유효하지 않은 위치 값을 가진 객체:", obj);
                      return;
                    }

                    // 원래 위치 저장 (위치 비교용)
                    const originalPosition = {
                      left: obj.left,
                      top: obj.top,
                    };

                    // 각 가장자리에 대한 거리 계산
                    const distToLeft = obj.left;
                    const distToRight =
                      activeCanvas.width - (obj.left + objWidth);
                    const distToTop = obj.top;
                    const distToBottom =
                      activeCanvas.height - (obj.top + objHeight);

                    // 안전 영역 이탈 확인 및 이동 거리 계산
                    let moveX = 0;
                    let moveY = 0;

                    if (distToLeft < safeZoneX) moveX = safeZoneX - distToLeft;
                    else if (distToRight < safeZoneX)
                      moveX = -(safeZoneX - distToRight);

                    if (distToTop < safeZoneY) moveY = safeZoneY - distToTop;
                    else if (distToBottom < safeZoneY)
                      moveY = -(safeZoneY - distToBottom);

                    // 이동이 필요한 경우에만 정보 저장
                    if (moveX !== 0 || moveY !== 0) {
                      console.log(
                        `🔄 요소 이동 계산 (실제 이동 없음): ${obj.type}`,
                        {
                          id: obj.id || "없음",
                          이동전: { left: obj.left, top: obj.top },
                          이동량: { x: moveX, y: moveY },
                          이동후예상: {
                            left: obj.left + moveX,
                            top: obj.top + moveY,
                          },
                        }
                      );

                      // 이동 정보만 저장 (실제 요소는 이동시키지 않음)
                      moveInfo.push({
                        id: obj.id,
                        type: obj.type,
                        originalLeft: obj.left,
                        originalTop: obj.top,
                        moveX: moveX,
                        moveY: moveY,
                        newLeft: obj.left + moveX,
                        newTop: obj.top + moveY,
                      });
                    }
                  });

                  console.log(
                    `🎯 워드프레스 플랫폼 요소 이동 계산 완료: ${moveInfo.length}개 요소`
                  );

                  // 이미지 생성 시 참조할 수 있도록 전역 변수에 저장
                  window.__WORDPRESS_MOVE_INFO__ = moveInfo;
                }
              } else {
                console.error("❌ 유효하지 않은 Fabric.js 캔버스 객체");
              }
            } catch (wpError) {
              console.error("❌ 워드프레스 요소 이동 처리 중 오류:", wpError);
            }
          }

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
          }, 1000);
        }
      } catch (e) {
        console.error("가이드 숨기기 중 오류:", e);
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
        if (activeCanvas) {
          try {
            console.log("fabric.js로 직접 이미지 생성 시도");

            // 가이드 요소 숨기기
            hideGuideElements();

            // 현재 캔버스 상태 저장
            const originalState = {
              zoom: activeCanvas.getZoom(),
              width: activeCanvas.getWidth(),
              height: activeCanvas.getHeight(),
              viewportTransform: [...activeCanvas.viewportTransform],
              backgroundColor: activeCanvas.backgroundColor,
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
              activeCanvas.set("backgroundColor", darkBgColor);
            } else if (bgModeParam !== "transparent") {
              activeCanvas.set("backgroundColor", "#FFFFFF");
            }

            // 원본 비율 계산 (줌 상태 포함)
            const effectiveWidth = originalState.width / originalState.zoom;
            const effectiveHeight = originalState.height / originalState.zoom;
            const originalRatio = effectiveWidth / effectiveHeight;
            const targetRatio = platformWidth / platformHeight;

            // 캔버스 렌더링 (현재 줌 상태 유지)
            activeCanvas.renderAll();

            // 현재 보이는 화면 그대로 캡처
            const viewportData = activeCanvas.toDataURL({
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

                // 워드프레스 플랫폼인 경우 특별 처리 (완전히 꽉 채우기)
                if (platformId === "wordpress") {
                  console.log("워드프레스 플랫폼 특별 처리 - 완전 꽉채움 모드");

                  try {
                    // 이동 정보가 있는지 확인
                    const hasMoveInfo =
                      window.__WORDPRESS_MOVE_INFO__ &&
                      window.__WORDPRESS_MOVE_INFO__.length > 0;

                    if (hasMoveInfo) {
                      console.log(
                        `적용할 이동 정보: ${window.__WORDPRESS_MOVE_INFO__.length}개 요소`
                      );

                      // fabric.js 캔버스 참조 가져오기
                      const activeCanvas =
                        window.fabricCanvasInstance ||
                        document.__EDITOR_FABRIC_CANVAS__;

                      if (activeCanvas && window.__WORDPRESS_TEMP_CANVAS__) {
                        console.log(
                          "이동된 요소들이 적용된 임시 캔버스 정보 사용"
                        );
                      }
                    }

                    // 소스 이미지 크기
                    const sourceWidth = img.width;
                    const sourceHeight = img.height;

                    // 대상 캔버스 크기
                    const targetWidth = platformWidth;
                    const targetHeight = platformHeight;

                    // 소스와 대상의 비율 계산
                    const sourceRatio = sourceWidth / sourceHeight;
                    const targetRatio = targetWidth / targetHeight;

                    let drawWidth, drawHeight;

                    if (sourceRatio > targetRatio) {
                      // 이미지가 타겟보다 가로로 더 넓은 경우
                      // 높이에 맞추고 가로는 중앙 크롭
                      drawHeight = targetHeight;
                      drawWidth = targetHeight * sourceRatio;

                      // 화면 꽉 채우기 위해 추가 확대
                      const scale = 1.5; // 50% 더 크게 확대하여 완전히 채움
                      drawWidth *= scale;
                      drawHeight *= scale;

                      // 중앙에 배치하여 가로 여백 없이 채움
                      const offsetX = (targetWidth - drawWidth) / 2;
                      tempCtx.drawImage(
                        img,
                        0,
                        0,
                        sourceWidth,
                        sourceHeight,
                        offsetX,
                        0,
                        drawWidth,
                        drawHeight
                      );

                      // 여기에서 이동된 요소들 그리기
                      if (hasMoveInfo && window.__WORDPRESS_TEMP_CANVAS__) {
                        // 임시 캔버스에 이동 정보가 적용된 객체들을 개별적으로 렌더링
                        // 실제로는 이 부분이 더 복잡해질 수 있으며,
                        // fabric.js의 loadFromJSON 같은 메서드를 사용해야 할 수 있음
                        console.log("이동된 요소들을 이미지에 적용");

                        // 여기서 fabric.js 캔버스를 생성하고 JSON을 로드할 수 있지만,
                        // 성능 및 복잡성 문제로 현재는 기본 이미지만 사용
                        try {
                          const activeCanvas =
                            window.fabricCanvasInstance ||
                            document.__EDITOR_FABRIC_CANVAS__;
                          if (
                            activeCanvas &&
                            window.__WORDPRESS_TEMP_CANVAS__
                          ) {
                            // 이미 이동 정보가 적용된 임시 JSON을 사용
                            // 실제 구현에서는 이 JSON으로 새 캔버스를 만들어 렌더링할 수 있음
                            console.log(
                              "임시 캔버스 JSON 사용 가능:",
                              window.__WORDPRESS_TEMP_CANVAS__.objects.length +
                                "개 객체"
                            );
                          }
                        } catch (err) {
                          console.error("이동된 요소 적용 중 오류:", err);
                        }
                      }
                    } else {
                      // 이미지가 타겟보다 세로로 더 긴 경우
                      // 너비에 맞추고 세로는 중앙 크롭
                      drawWidth = targetWidth;
                      drawHeight = targetWidth / sourceRatio;

                      // 화면 꽉 채우기 위해 추가 확대
                      const scale = 1; // 50% 더 크게 확대하여 완전히 채움
                      drawWidth *= scale;
                      drawHeight *= scale;

                      // 중앙에 배치하여 세로 여백 없이 채움
                      const offsetY = (targetHeight - drawHeight) / 2;
                      tempCtx.drawImage(
                        img,
                        0,
                        0,
                        sourceWidth,
                        sourceHeight,
                        0,
                        offsetY,
                        drawWidth,
                        drawHeight
                      );

                      // 여기에서 이동된 요소들 그리기
                      if (hasMoveInfo && window.__WORDPRESS_TEMP_CANVAS__) {
                        // 임시 캔버스에 이동 정보가 적용된 객체들을 개별적으로 렌더링
                        console.log("이동된 요소들을 이미지에 적용");
                      }
                    }
                  } catch (wpError) {
                    console.error("워드프레스 이미지 처리 중 오류:", wpError);
                  }
                } else if (fitModeParam === "contain") {
                  // 기존 contain 모드 처리 코드...
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
                activeCanvas.setZoom(originalState.zoom);
                activeCanvas.setDimensions({
                  width: originalState.width,
                  height: originalState.height,
                });
                activeCanvas.viewportTransform =
                  originalState.viewportTransform;
                activeCanvas.set(
                  "backgroundColor",
                  originalState.backgroundColor
                );
                activeCanvas.renderAll();

                resolve(resultImage);
              };

              img.onerror = () => {
                console.error("이미지 로딩 실패");
                // 원래 캔버스 상태 복원
                activeCanvas.setZoom(originalState.zoom);
                activeCanvas.set(
                  "backgroundColor",
                  originalState.backgroundColor
                );
                activeCanvas.renderAll();

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
          isMobileView ? "flex-col space-y-2" : "items-center justify-between"
        } mb-4 rounded-lg bg-muted/50 p-3`}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <label
              htmlFor="fit-mode"
              className="text-xs font-medium text-muted-foreground"
            >
              표시:
            </label>
            <select
              id="fit-mode"
              className="text-xs p-1.5 border rounded-md bg-background"
              value={fitMode}
              onChange={(e) => handleFitModeChange(e.target.value)}
              disabled={isGenerating}
            >
              <option value="contain">원본비율</option>
              <option value="cover">꽉채움</option>
            </select>
          </div>
          <div className="flex items-center space-x-1.5">
            <label
              htmlFor="bg-mode"
              className="text-xs font-medium text-muted-foreground"
            >
              배경:
            </label>
            <select
              id="bg-mode"
              className="text-xs p-1.5 border rounded-md bg-background"
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
          <button
            className={`text-xs px-2.5 py-1.5 rounded-md ml-2 ${
              isGenerating && loadingTypeRef.current === "preview"
                ? "bg-muted text-muted-foreground"
                : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            }`}
            onClick={handleRefreshPreviews}
            disabled={isGenerating}
          >
            {isGenerating && loadingTypeRef.current === "preview"
              ? "생성 중..."
              : "새로고침"}
          </button>
        </div>
        <button
          className={`text-xs px-3 py-1.5 rounded-md font-medium ${
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
      </div>

      {/* 미리보기 영역 - 그리드 레이아웃 적용 */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
          isMobileView ? "max-h-60 overflow-y-auto" : ""
        }`}
      >
        {platforms
          .filter((platform) => platform.enabled)
          .map((platform) => (
            <div
              key={platform.id}
              className="border rounded-lg shadow-sm p-3 bg-card"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <h3 className="text-sm font-semibold text-card-foreground">
                    {platform.name}
                  </h3>
                  {platform.id === "wordpress" && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded-sm">
                      꽉채움
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    onClick={() => handleExportPlatform(platform.id)}
                    disabled={
                      isGenerating ||
                      !(
                        previews[platform.id] &&
                        (typeof previews[platform.id] === "string" ||
                          (typeof previews[platform.id] === "object" &&
                            previews[platform.id].dataUrl))
                      )
                    }
                  >
                    내보내기
                  </button>
                </div>
              </div>

              {/* 미리보기 컨테이너 */}
              <div
                className="relative overflow-hidden cursor-pointer rounded-md"
                style={{
                  aspectRatio: `${platform.width} / ${platform.height}`,
                  width: "100%",
                  maxWidth: "100%",
                  margin: "0 auto",
                  backgroundColor:
                    bgMode === "dark"
                      ? "#121212"
                      : bgMode === "transparent"
                      ? "transparent"
                      : "#FFFFFF",
                  backgroundImage:
                    bgMode === "transparent"
                      ? "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC45bDN+TgAAAEFJREFUOE9j+P//P0UYzmhpaXnPwMAwHz0uA2pg2dzcfB5kALohRGOgHqyhBDQApyhJGOgHLJeQhUFuJgtD/PADAKSXnAJxtJCbAAAAAElFTkSuQmCC')"
                      : "none",
                  backgroundRepeat: "repeat",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                  border: `1px solid ${
                    bgMode === "transparent" ? "rgba(0,0,0,0.1)" : "transparent"
                  }`,
                }}
                onClick={() => setActivePlatform(platform.id)}
              >
                {/* 이미지 프리뷰 */}
                {previews[platform.id] ? (
                  <div
                    className="w-full h-full flex justify-center items-center"
                    style={{
                      width: "100%",
                      height: "100%",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      src={
                        typeof previews[platform.id] === "object" &&
                        previews[platform.id].dataUrl
                          ? previews[platform.id].dataUrl
                          : previews[platform.id]
                      }
                      alt={`Preview for ${platform.name}`}
                      className={`${
                        // 워드프레스는 항상 꽉 채움, 다른 플랫폼은 설정된 fitMode 사용
                        platform.id === "wordpress"
                          ? "w-full h-full object-cover"
                          : fitMode === "cover"
                          ? "w-full h-full object-cover"
                          : "max-w-full max-h-full object-contain"
                      }`}
                      style={{
                        width:
                          platform.id === "wordpress" || fitMode === "cover"
                            ? "100%"
                            : "auto",
                        height:
                          platform.id === "wordpress" || fitMode === "cover"
                            ? "100%"
                            : "auto",
                        objectFit:
                          platform.id === "wordpress" ? "cover" : fitMode,
                        display: "block",
                        objectPosition: "center",
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

                {/* 플랫폼 사이즈 뱃지 */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-medium">
                  {platform.width}×{platform.height}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
});
