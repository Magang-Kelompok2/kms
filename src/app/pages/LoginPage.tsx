import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Lock, User, AlertCircle, Loader } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import React from "react";

const loginImage =
  "https://images.unsplash.com/photo-1724985284026-dd2451e4857a?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setSuccess("");

    // const result = await login(email, password);
    // if (result.success) {
    //   setSuccess("Login berhasil! Mengarahkan ke halaman dashboard...");
    //   navigate("/dashboard");
    // } else {
    //   setError(result.error || "Email atau password salah");
    // }

    try {
      const response = await login(email, password);
      setSuccess("Login berhasil! Mengarahkan ke halaman dashboard...");
      console.log("Login successfull:", response);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login gagal. Email atau password salah.";
      setError(errorMessage);
      console.log("Login failed", err)
    } finally {
      setIsLoading(false);
    }

  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div>
              <h1
                className="text-3xl font-semibold tracking-tight text-foreground"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
              >
                Masuk
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Silakan login untuk melanjutkan ke dashboard.
              </p>
            </div>

            <Card className="border shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg">Akun Anda</CardTitle>
                <CardDescription>
                  Gunakan email dan password yang terdaftar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 pl-9"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-9"
                      required
                    />
                  </div>

                  {error ? (
                    <Alert variant="destructive">
                      <AlertCircle />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ) : null}

                  <Button 
                    type="submit" 
                    disabled={isLoading || !!success} 
                    className="h-11 w-full" 
                    size="lg">
                    {isLoading ? <Loader className="animate-spin"/> : "Masuk"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* <Card className="border-dashed bg-muted/30 shadow-none">
              <CardContent className="pt-6 text-xs text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">
                  Demo (development)
                </p>
                <p>
                  <span className="font-medium">Admin:</span>{" "}
                  admin@example.com / admin123
                </p>
                <p>
                  <span className="font-medium">User:</span> user@example.com /
                  user123
                </p>
              </CardContent>
            </Card> */}
          </div>
        </div>

        <div className="relative hidden flex-1 lg:block">
          <img
            src={loginImage}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-primary/20 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 text-primary-foreground">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-lg border border-white/20 bg-card p-2 shadow-lg">
                <img src="/LogoAlpha.svg" alt="TaxaCore" className="size-10" />
              </div>
              <div>
                <p
                  className="text-2xl font-semibold"
                  style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                  KMS MHCorp
                </p>
                <p className="text-sm text-white/90">
                  Sistem Informasi Pengetahuan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
