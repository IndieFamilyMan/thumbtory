import { create } from "zustand";

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
  seo: { filename: "", keywords: [], altText: "" },
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

  setActivePlatform: (id) => set({ activePlatformId: id }),

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
      const { elements } = get();
      set({
        elements: elements.filter((e) => e.id !== id),
      });
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
}));
