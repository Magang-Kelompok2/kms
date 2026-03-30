import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Lock, Mail, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 p-4">
      <Card className="w-full max-w-md p-8 bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'Coolvetica, sans-serif' }}>TaxaCore</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
            Sign in to access your learning materials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
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

          <Button type="submit" className="w-full" size="lg">
            Sign In
          </Button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-semibold mb-2">Demo Accounts:</p>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Admin:</strong> admin@example.com / admin123
            </p>
            <p>
              <strong>User:</strong> user@example.com / user123
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}