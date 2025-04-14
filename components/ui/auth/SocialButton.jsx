"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

export function SocialButton({
  provider,
  onClick,
  label,
  icon,
  className,
  disabled,
}) {
  return (
    <Button
      variant="outline"
      className={`w-full flex items-center justify-center gap-2 py-5 ${
        className || ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && (
        <Image
          src={icon}
          alt={`${provider} 로그인`}
          width={24}
          height={24}
          className="w-5 h-5"
        />
      )}
      <span>{label || `${provider}로 계속하기`}</span>
    </Button>
  );
}
