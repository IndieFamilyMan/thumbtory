/**
 * 소셜 미디어 및 블로그 플랫폼별 권장 썸네일 크기 정의
 */

export const SocialMediaLayouts = {
  // 블로그 플랫폼
  naver: {
    width: 600,
    height: 400,
    description: "네이버 블로그 썸네일 최적 크기",
  },
  tistory: {
    width: 900,
    height: 600,
    description: "티스토리 블로그 썸네일 최적 크기",
  },
  wordpress: {
    width: 1200,
    height: 628,
    description: "워드프레스 및 소셜미디어 공유 최적 크기",
  },
  brunch: {
    width: 1200,
    height: 900,
    description: "브런치 썸네일 최적 크기",
  },

  // 소셜 미디어 플랫폼
  instagram: {
    width: 1080,
    height: 1080,
    description: "인스타그램 정사각형 게시물",
  },
  instagram_story: {
    width: 1080,
    height: 1920,
    description: "인스타그램 스토리",
  },
  facebook: {
    width: 1200,
    height: 630,
    description: "페이스북 공유 이미지",
  },
  twitter: {
    width: 1200,
    height: 675,
    description: "트위터(X) 공유 이미지",
  },
  youtube: {
    width: 1280,
    height: 720,
    description: "유튜브 썸네일",
  },
  linkedin: {
    width: 1200,
    height: 627,
    description: "링크드인 공유 이미지",
  },

  // 기본 크기 (사용자 지정)
  custom: {
    width: 800,
    height: 600,
    description: "사용자 지정 크기",
  },
};
