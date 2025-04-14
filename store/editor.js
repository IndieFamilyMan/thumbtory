import { create } from "zustand";
import { SocialMediaLayouts } from "@/lib/social-media-layouts";

// 지원하는 플랫폼 및 크기 정의
// 캔버스 요소 유형
// 요소 기본 속성
// 템플릿 정보
// 초기 상태 값
const defaultPlatforms = [
  {
    id: "naver",
    name: "네이버 블로그",
    width: 600,
    height: 400,
    enabled: true,
    format: "jpeg",
    quality: 0.85,
    maxSize: 150, // KB
    description: "네이버 블로그 썸네일 최적 크기",
  },
  {
    id: "tistory",
    name: "티스토리",
    width: 900,
    height: 600,
    enabled: true,
    format: "jpeg",
    quality: 0.85,
    maxSize: 150, // KB
    description: "티스토리 블로그 썸네일 최적 크기",
  },
  {
    id: "wordpress",
    name: "워드프레스",
    width: 1200,
    height: 628,
    enabled: true,
    format: "jpeg",
    quality: 0.85,
    maxSize: 150, // KB
    description: "워드프레스 및 소셜미디어 공유 최적 크기",
  },
  {
    id: "brunch",
    name: "브런치",
    width: 1200,
    height: 900,
    enabled: false,
    format: "jpeg",
    quality: 0.85,
    maxSize: 150, // KB
    description: "브런치 썸네일 최적 크기",
  },
];

// 초기 상태
const initialState = {
  platforms: defaultPlatforms,
  activePlatformId: "naver",
  elements: [],
  background: { type: "color", value: "#ffffff" },
  seo: {
    filename: "",
    keywords: [],
    altText: "",
    description: "",
    title: "",
    author: "",
    copyright: "",
  },
  templates: [],
  history: {
    past: [],
    future: [],
  },
  mobileLeftOpen: false,
  mobileRightOpen: false,
  showPlatformPreview: true,
  canvas: null,
  selectedElementId: null,
  designSettings: {
    backgroundColor: null,
    borderColor: "#000000",
    borderWidth: 0,
  },
};

// 유니크 ID 생성 함수
const generateId = () => Math.random().toString(36).substr(2, 9);

// Zustand 스토어 생성
export const useEditorStore = create((set, get) => ({
  ...initialState,

  // Canvas 설정
  setCanvas: (canvas) => {
    console.log(
      "캔버스 참조 설정됨:",
      canvas ? "canvas가 존재함" : "canvas가 null임"
    );
    if (canvas) {
      // canvas 요소에 id 설정 (이미지 생성 과정에서 찾기 쉽도록)
      try {
        const canvasElement = canvas.getElement();
        if (canvasElement && !canvasElement.id) {
          canvasElement.id = "canvas";
          console.log("캔버스 요소에 ID 설정됨");
        }
      } catch (e) {
        console.error("캔버스 요소 ID 설정 중 오류:", e);
      }
    }
    set({ canvas });
  },

  // 선택된 요소 ID 설정
  setSelectedElementId: (id) => {
    // null이 아닌 경우에만 상태 업데이트
    if (id !== null && id !== undefined) {
      set({
        selectedElementId: id,
        // 선택된 요소의 속성 정보도 함께 업데이트
        selectedElement: get().elements.find((el) => el.id === id) || null,
      });
    } else {
      // id가 null일 경우 선택 해제 상태로 설정
      set({
        selectedElementId: null,
        selectedElement: null,
      });
    }
  },

  // 상태 저장 함수
  saveState: () => {
    const { elements, background, history } = get();

    // 이미 history에 저장된 상태이면 중복 저장 방지
    if (history.past.length > 0) {
      const lastState = history.past[history.past.length - 1];
      const sameElements =
        JSON.stringify(lastState.elements) === JSON.stringify(elements);
      const sameBackground =
        JSON.stringify(lastState.background) === JSON.stringify(background);

      // 이전 상태와 동일하면 저장하지 않음
      if (sameElements && sameBackground) return;
    }

    set({
      history: {
        past: [...history.past, { elements, background }],
        future: [],
      },
    });
  },

  // 요소 속성 변경 함수
  updateElementProperty: (id, propName, value) => {
    const { elements } = get();

    // 이동 중인 객체의 속성은 즉시 업데이트하지만 상태 리렌더링은 하지 않음
    if (propName === "x" || propName === "y") {
      const element = elements.find((e) => e.id === id);
      if (element) {
        element[propName] = value;
      }
    } else if (propName === "text") {
      // 텍스트 변경 시에는 요소의 text 속성을 즉시 업데이트
      const updatedElements = elements.map((e) =>
        e.id === id ? { ...e, [propName]: value } : e
      );

      // 상태 업데이트 (배치로 처리하여 성능 개선)
      set({
        elements: updatedElements,
        selectedElementId: id, // 선택 상태 명시적 유지
      });

      // 현재 선택된 요소가 있는지 확인하고, 없으면 현재 편집 중인 요소를 선택
      const { selectedElementId } = get();
      if (!selectedElementId) {
        set({ selectedElementId: id });
      }
    } else {
      // 다른 속성들은 일반적인 방식으로 업데이트
      set({
        elements: elements.map((e) =>
          e.id === id ? { ...e, [propName]: value } : e
        ),
      });
    }
  },

  // 상태 변경 전 히스토리에 현재 상태 저장하는 헬퍼 함수
  saveToHistory: (callback) => {
    const { elements, background, history } = get();

    set({
      history: {
        past: [...history.past, { elements, background }],
        future: [],
      },
    });

    callback();
  },

  // 디자인 설정 변경
  setDesignSettings: (settings) =>
    set({
      designSettings: { ...get().designSettings, ...settings },
    }),

  // 플랫폼 설정
  setPlatforms: (platforms) => set({ platforms }),

  togglePlatform: (id, enabled) => {
    const { platforms } = get();
    set({
      platforms: platforms.map((p) => (p.id === id ? { ...p, enabled } : p)),
    });
  },

  // 플랫폼 변경
  setActivePlatform: (platformId) => {
    console.log("플랫폼 변경:", platformId);

    // 유효한 플랫폼 ID 확인
    const isValidPlatform =
      Object.keys(SocialMediaLayouts).includes(platformId);
    if (!isValidPlatform) {
      console.log("잘못된 플랫폼 ID, 기본값으로 설정:", platformId);
      platformId = "instagram"; // 기본 플랫폼
    }

    // 캔버스 인스턴스 확인
    const canvas = get().canvas;

    // 플랫폼 ID가 변경되지 않았으면 무시
    if (get().activePlatformId === platformId) {
      console.log("동일한 플랫폼으로의 변경 요청 무시:", platformId);
      return;
    }

    // 플랫폼 데이터 가져오기
    const platformData = SocialMediaLayouts[platformId];
    const { width, height } = platformData;

    // 상태 업데이트 - 캔버스 없어도 상태는 업데이트
    set({ activePlatformId: platformId });

    // 캔버스가 정의되지 않은 경우 처리
    if (!canvas) {
      console.log("캔버스 인스턴스가 없습니다. 플랫폼만 변경합니다.");
      return;
    }

    try {
      // 캔버스 크기 변경
      canvas.setWidth(width);
      canvas.setHeight(height);

      // 요소들의 위치 조정
      const elements = get().elements;
      const updatedElements = elements.map((el) => {
        // 텍스트 또는 이미지 요소의 위치 조정 로직
        // 중앙 위치에 놓이도록 조정
        const newEl = { ...el };

        // 요소 위치 보정이 필요한 경우 추가할 수 있음

        return newEl;
      });

      // 업데이트된 요소들 저장
      set({ elements: updatedElements });

      // 캔버스 다시 그리기
      canvas.renderAll();

      console.log("플랫폼 변경 완료:", { platformId, width, height });
    } catch (error) {
      console.log("플랫폼 변경 중 오류(무시됨):", error);
    }
  },

  // 요소 관리
  addElement: (elementData) => {
    get().saveToHistory(() => {
      const { elements } = get();

      // 이미지 요소인 경우 추가 처리
      if (elementData.type === "image") {
        // 이미지 로그 출력 제거
      }

      const newElement = {
        ...elementData,
        id: generateId(),
        selected: true,
      };

      set({
        elements: [
          ...elements.map((e) => ({ ...e, selected: false })),
          newElement,
        ],
        selectedElementId: newElement.id,
      });

      // 최소한의 로그만 유지
      console.log(`요소 추가 완료: ${elementData.type}`);
    });
  },

  updateElement: (idOrElement, properties) => {
    get().saveToHistory(() => {
      const { elements } = get();

      // ID로 호출되는 경우와 객체로 호출되는 경우를 모두 처리
      const id = typeof idOrElement === "object" ? idOrElement.id : idOrElement;
      const props = typeof idOrElement === "object" ? idOrElement : properties;

      if (!id) {
        console.error("유효하지 않은 요소 ID:", id);
        return null;
      }

      // 텍스트 요소 업데이트 시 특별 처리
      const elementToUpdate = elements.find((e) => e.id === id);
      if (
        elementToUpdate &&
        elementToUpdate.type === "text" &&
        props &&
        props.text !== undefined
      ) {
        // 텍스트 변경 시 로그 제거됨
      }

      // 요소 업데이트 및 업데이트된 요소 반환
      const updatedElements = elements.map((e) =>
        e.id === id ? { ...e, ...props } : e
      );

      // 상태 업데이트
      set({ elements: updatedElements });

      // 업데이트된 요소 반환 (호출자가 확인할 수 있도록)
      return updatedElements.find((e) => e.id === id) || null;
    });
  },

  removeElement: (id) => {
    get().saveToHistory(() => {
      const { elements, canvas } = get();

      // 1. Zustand 스토어에서 요소 제거
      set({
        elements: elements.filter((e) => e.id !== id),
        // 만약 현재 선택된 요소가 삭제되는 요소라면 선택 해제
        selectedElementId:
          get().selectedElementId === id ? null : get().selectedElementId,
        selectedElement:
          get().selectedElementId === id ? null : get().selectedElement,
      });

      // 2. Fabric.js 캔버스에서도 요소 제거
      try {
        // 캔버스 참조 가져오기 - 여러 방법으로 시도
        const fabricCanvas =
          canvas ||
          window.fabricCanvasInstance ||
          document.__EDITOR_FABRIC_CANVAS__;

        if (fabricCanvas) {
          // ID로 객체 찾기
          const objectToRemove = fabricCanvas
            .getObjects()
            .find((obj) => obj.id === id);

          if (objectToRemove) {
            // 객체 제거
            fabricCanvas.remove(objectToRemove);
            // 캔버스 렌더링 갱신
            fabricCanvas.requestRenderAll();
            console.log(`캔버스에서 요소 제거 완료: ${id}`);
          }
        }
      } catch (error) {
        console.error("캔버스에서 요소 제거 중 오류:", error);
      }
    });
  },

  selectElement: (id) => {
    const { elements } = get();
    set({
      elements: elements.map((e) => ({
        ...e,
        selected: e.id === id,
      })),
    });
  },

  // 요소를 위로 이동 (시각적으로 위로 = z-index 증가 = 배열에서는 뒤로)
  moveElementUp: (id) => {
    get().saveToHistory(() => {
      const { elements } = get();
      const index = elements.findIndex((e) => e.id === id);

      // 이미 맨 위에 있으면 아무것도 하지 않음
      if (index <= 0) return;

      // 요소 순서 변경
      const newElements = [...elements];
      const temp = newElements[index];
      newElements[index] = newElements[index - 1];
      newElements[index - 1] = temp;

      // 캔버스에서도 순서 반영
      try {
        const canvas = window.fabricCanvasInstance;
        if (canvas) {
          // 캔버스 업데이트는 요소 배열을 설정한 후에 Canvas 컴포넌트의
          // syncElementsOrder 함수에서 처리됨
          canvas.requestRenderAll();
        }
      } catch (error) {
        console.error("캔버스에서 요소 순서 변경 중 오류:", error);
      }

      set({ elements: newElements });
    });
  },

  // 요소를 아래로 이동 (시각적으로 아래로 = z-index 감소 = 배열에서는 앞으로)
  moveElementDown: (id) => {
    get().saveToHistory(() => {
      const { elements } = get();
      const index = elements.findIndex((e) => e.id === id);

      // 이미 맨 아래에 있으면 아무것도 하지 않음
      if (index === -1 || index >= elements.length - 1) return;

      // 요소 순서 변경
      const newElements = [...elements];
      const temp = newElements[index];
      newElements[index] = newElements[index + 1];
      newElements[index + 1] = temp;

      // 캔버스에서도 순서 반영
      try {
        const canvas = window.fabricCanvasInstance;
        if (canvas) {
          // 캔버스 업데이트는 요소 배열을 설정한 후에 Canvas 컴포넌트의
          // syncElementsOrder 함수에서 처리됨
          canvas.requestRenderAll();
        }
      } catch (error) {
        console.error("캔버스에서 요소 순서 변경 중 오류:", error);
      }

      set({ elements: newElements });
    });
  },

  clearSelection: () => {
    const { elements } = get();
    set({
      elements: elements.map((e) => ({
        ...e,
        selected: false,
      })),
    });
  },

  // 배경 설정
  setBackground: (background) => {
    get().saveToHistory(() => {
      set({ background });
    });
  },

  // SEO 정보 설정
  setSeo: (seoData) => {
    const { seo } = get();
    set({
      seo: { ...seo, ...seoData },
    });
  },

  // 템플릿 관리
  saveTemplate: (name) => {
    const { elements, background, templates } = get();
    const newTemplate = {
      id: generateId(),
      name,
      thumbnail: "", // TODO: 썸네일 생성 로직 추가
      background,
      elements,
    };

    set({
      templates: [...templates, newTemplate],
    });
  },

  loadTemplate: (id) => {
    get().saveToHistory(() => {
      const { templates } = get();
      const template = templates.find((t) => t.id === id);

      if (template) {
        set({
          elements: template.elements,
          background: template.background,
        });
      }
    });
  },

  // 실행 취소/다시 실행
  undo: () => {
    const { history } = get();

    if (history.past.length === 0) return;

    const newPast = [...history.past];
    const lastState = newPast.pop();

    if (lastState) {
      const { elements, background } = get();

      set({
        elements: lastState.elements,
        background: lastState.background,
        history: {
          past: newPast,
          future: [{ elements, background }, ...history.future],
        },
      });
    }
  },

  redo: () => {
    const { history } = get();

    if (history.future.length === 0) return;

    const [nextState, ...newFuture] = history.future;

    if (nextState) {
      const { elements, background } = get();

      set({
        elements: nextState.elements,
        background: nextState.background,
        history: {
          past: [...history.past, { elements, background }],
          future: newFuture,
        },
      });
    }
  },

  // UI 상태 관리 함수 추가
  setMobileLeftOpen: (isOpen) => set({ mobileLeftOpen: isOpen }),
  setMobileRightOpen: (isOpen) => set({ mobileRightOpen: isOpen }),
  togglePlatformPreview: () =>
    set((state) => ({ showPlatformPreview: !state.showPlatformPreview })),

  // 텍스트 요소 추가
  addTextElement: (textProps = {}) => {
    const state = get();

    // 텍스트 요소의 기본 속성과 전달받은 속성 병합
    const newTextElement = {
      id: generateId(),
      type: "text",
      text: textProps.text || "텍스트를 입력하세요",
      x: textProps.x !== undefined ? textProps.x : 100,
      y: textProps.y !== undefined ? textProps.y : 100,
      width: textProps.width || 200,
      fontSize: textProps.fontSize || 24,
      fontFamily: textProps.fontFamily || "Arial",
      fill: textProps.fill || "#000000",
      textAlign: textProps.textAlign || "left",
      fontWeight: textProps.fontWeight || "normal",
      fontStyle: textProps.fontStyle || "normal",
      stroke: textProps.stroke || "",
      strokeWidth: textProps.strokeWidth || 0,
      opacity: textProps.opacity !== undefined ? textProps.opacity : 1,
      scaleX: textProps.scaleX || 1,
      scaleY: textProps.scaleY || 1,
      rotation: textProps.rotation || 0,
      ...textProps,
    };

    // 요소 배열에 새 텍스트 요소 추가
    const updatedElements = [...state.elements, newTextElement];

    // 상태 업데이트 및 히스토리에 저장
    set({
      elements: updatedElements,
      selectedElementId: newTextElement.id, // 추가된 텍스트 요소를 자동 선택
    });

    // 상태 저장
    setTimeout(() => {
      get().saveState();
    }, 100);

    return newTextElement;
  },

  // 이미지 요소 추가
  addImageElement: (imageProps = {}) => {
    const state = get();

    // 이미지 요소의 기본 속성과 전달받은 속성 병합
    const newImageElement = {
      id: generateId(),
      type: "image",
      src: imageProps.src,
      x: imageProps.x !== undefined ? imageProps.x : 100,
      y: imageProps.y !== undefined ? imageProps.y : 100,
      width: imageProps.width || 200,
      height: imageProps.height || 200,
      scaleX: imageProps.scaleX || 1,
      scaleY: imageProps.scaleY || 1,
      rotation: imageProps.rotation || 0,
      opacity: imageProps.opacity !== undefined ? imageProps.opacity : 1,
      ...imageProps,
    };

    // 요소 배열에 새 이미지 요소 추가
    const updatedElements = [...state.elements, newImageElement];

    // 상태 업데이트 및 히스토리에 저장
    set({
      elements: updatedElements,
      selectedElementId: newImageElement.id, // 추가된 이미지 요소를 자동 선택
    });

    // 상태 저장
    setTimeout(() => {
      get().saveState();
    }, 100);

    return newImageElement;
  },

  // 배경 이미지 설정
  setBackgroundFromImage: (file) => {
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);

      // 배경 객체 구조 명확하게 설정
      set({
        background: {
          type: "image",
          url: url,
          file: file,
          filename: file.name,
          size: file.size,
        },
      });

      console.log("배경 이미지 설정됨:", file.name, url);
    } catch (error) {
      console.error("배경 이미지 설정 오류:", error);
    }
  },

  // 배경 색상 설정
  setBackgroundColor: (color) => {
    if (!color) return;

    // 배경 객체 구조 명확하게 설정
    set({
      background: {
        type: "color",
        value: color,
      },
    });

    console.log("배경 색상 설정됨:", color);
  },
}));
