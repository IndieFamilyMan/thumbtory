import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "로그인 | Thumbtory",
  description: "소셜 계정으로 간편하게 로그인하세요",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  );
}
