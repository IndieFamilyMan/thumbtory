import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function EditorLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
