# Thumbtory - 블로거를 위한 썸네일 제작 도구

Thumbtory(썸크래프트)는 블로거와 콘텐츠 크리에이터를 위한 간편한 썸네일 제작 도구입니다. 다양한 플랫폼에 맞는 썸네일을 한 번에 제작하고, SEO 최적화 요소를 손쉽게 적용할 수 있도록 지원합니다.

## 주요 기능

- **플랫폼별 썸네일 크기 자동 최적화**

  - 네이버 블로그, 티스토리, 브런치 등 주요 플랫폼 지원
  - 하나의 디자인으로 다양한 사이즈 생성

- **SEO 최적화 파일명 설정**

  - 키워드 기반 파일명 자동 생성
  - 검색 엔진 최적화 지원

- **템플릿 저장 및 관리**

  - 자주 사용하는 디자인을 템플릿으로 저장
  - 브랜드 일관성 유지 지원

- **직관적인 편집 인터페이스**
  - 드래그 앤 드롭으로 요소 배치
  - 텍스트, 이미지, 도형, 아이콘 등 다양한 요소 지원

## 기술 스택

- **프론트엔드**: Next.js, React, TypeScript, TailwindCSS
- **상태 관리**: Zustand
- **캔버스 조작**: 구현 예정 (Fabric.js 또는 Konva.js)
- **이미지 처리**: 구현 예정 (Canvas API, Sharp)

## 개발 환경 설정

### 요구 사항

- Node.js 18.0.0 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/yourusername/Thumbtory.git
cd Thumbtory

# 의존성 설치
npm install
# 또는
yarn install

# 개발 서버 실행
npm run dev
# 또는
yarn dev
```

## 프로젝트 구조

```
Thumbtory/
├── app/                      # App Router 라우트 폴더
│ ├── editor/                 # 썸네일 에디터 페이지
│ └── page.tsx                # 홈페이지
├── components/               # 공통 컴포넌트 모음
│ ├── editor/                 # 에디터 관련 컴포넌트
│ ├── layout/                 # 레이아웃 관련 컴포넌트
│ └── ui/                     # 기본 UI 컴포넌트
├── store/                    # 상태 관리 관련 폴더
│ └── editor.ts               # 에디터 상태 관리
├── lib/                      # 유틸리티 함수 모음
├── public/                   # 정적 파일
└── ...
```

## 로드맵

- [ ] 캔버스 기본 편집 기능 구현
- [ ] 플랫폼별 썸네일 크기 최적화
- [ ] 텍스트 및 이미지 추가/편집
- [ ] 템플릿 저장 및 불러오기
- [ ] 내보내기 기능 구현
- [ ] SEO 최적화 기능 강화
- [ ] 사용자 계정 및 저장 기능

## 라이선스

[MIT License](LICENSE)
