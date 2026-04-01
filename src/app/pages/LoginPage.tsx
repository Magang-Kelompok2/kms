import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Lock, User, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import React from "react";

const loginImage = "https://images.unsplash.com/photo-1724985284026-dd2451e4857a?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = login(email, password);
    if (success) {
      navigate("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-5xl font-bold mb-3" style={{ fontFamily: 'Coolvetica, sans-serif' }}>
              Login
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Silahkan lakukan Login terlebih dahulu
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-300 dark:border-gray-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-gray-300 dark:border-gray-700"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-[#0C81E4] hover:bg-[#0C4E8C] text-white font-semibold text-base"
            >
              Login
            </Button>
          </form>

          {/* Demo Accounts - Hidden in production */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <p>
                <strong>Admin:</strong> admin@example.com / admin123
              </p>
              <p>
                <strong>User:</strong> user@example.com / user123
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image and Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src={loginImage}
          alt="TaxaCore Building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay with branding */}
        <div className="absolute inset-0 bg-linear-to-t from-blue-900/40 via-transparent to-transparent" />
        
        {/* Logo and Text at Bottom */}
        <div className="absolute bottom-12 left-12 right-12">
          <div className="flex items-center gap-4 text-white">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
              <img src="/LogoAlpha.svg" alt="TaxaCore Logo" width={64} height={64} />
            </div>
            <div>
              <h2 className="text-3xl font-normal" style={{ fontFamily: 'Coolvetica, sans-serif' }}>
                TaxaCore
              </h2>
              <p className="text-lg text-white/90">
                Sistem Informasi Pengetahuan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
