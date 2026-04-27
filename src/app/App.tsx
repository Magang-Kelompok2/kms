import { AuthProvider } from "./context/AuthContext";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </AuthProvider>
  );
}
