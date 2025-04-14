"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/auth/UserAvatar";

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className="w-8 h-8 rounded-full">
        <span className="animate-pulse">•••</span>
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => router.push("/login")}
        className="text-sm"
      >
        로그인
      </Button>
    );
  }

  // 사용자 정보에서 이름 가져오기
  const displayName =
    user.user_metadata?.name ||
    user.user_metadata?.preferred_username ||
    user.email?.split("@")[0] ||
    "사용자";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
          aria-label="사용자 메뉴"
        >
          <UserAvatar user={user} className="h-8 w-8" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>내 계정</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href="/editor">에디터</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href="/templates">내 템플릿</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 cursor-pointer"
          onClick={signOut}
        >
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
