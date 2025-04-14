import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 클래스 이름을 병합하는 유틸리티 함수
 * @param  {...string} inputs - 병합할 클래스명들
 * @returns {string} 병합된 클래스명
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
