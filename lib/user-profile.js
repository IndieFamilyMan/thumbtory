import { supabase } from "./supabase";

// 새 사용자 프로필 생성 (소셜 로그인 후)
export async function createUserProfile(userId, userData) {
  try {
    // 기존 프로필 확인
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // 이미 프로필이 있으면 업데이트하지 않음
    if (existingProfile) return existingProfile;

    // 프로필 생성
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        username: userData.username || `user_${userId.slice(0, 6)}`,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("프로필 생성 오류:", error);
    return null;
  }
}

// 프로필 데이터 가져오기
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("프로필 조회 오류:", error);
    return null;
  }
}

// 프로필 업데이트
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("프로필 업데이트 오류:", error);
    return null;
  }
}
