"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

export function UserAvatar() {
  const { user } = useAuth();

  if (!user) return null;

  // 이니셜을 생성하는 함수
  const getInitials = () => {
    // 사용자 이름이 있는 경우
    if (user.full_name) {
      const nameParts = user.full_name
        .split(" ")
        .filter((part) => part.length > 0);
      if (nameParts.length >= 2) {
        // 이름과 성의 첫 글자를 조합
        return `${nameParts[0][0]}${
          nameParts[nameParts.length - 1][0]
        }`.toUpperCase();
      } else if (nameParts.length === 1) {
        // 이름만 있는 경우 첫 글자만 사용
        return nameParts[0][0].toUpperCase();
      }
    }
    // 이름이 없으면 이메일 첫 글자 사용
    return user.email ? user.email.charAt(0).toUpperCase() : "?";
  };

  const initials = getInitials();

  return (
    <Avatar className="h-8 w-8 border border-gray-200">
      <AvatarImage src={user.avatar_url || ""} alt={user.email || "User"} />
      <AvatarFallback className="bg-blue-100 text-blue-800">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
