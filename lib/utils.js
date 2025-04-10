import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * TailwindCSS 클래스 병합 유틸리티 함수
 * clsx와 tailwind-merge를 결합하여 클래스명 충돌 없이 TailwindCSS 클래스를 병합
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
