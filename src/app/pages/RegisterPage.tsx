import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Lock, User, Mail, AlertCircle } from "lucide-react";
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

const registerImage =
  "https://images.unsplash.com/photo-1724985284026-dd2451e4857a?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await register(email, password, username);
    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Terjadi kesalahan saat registrasi");
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
                Daftar
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Buat akun baru untuk memulai pembelajaran.
              </p>
            </div>

            <Card className="border shadow-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-lg">Data akun</CardTitle>
                <CardDescription>
                  Lengkapi informasi di bawah ini.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 pl-9"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                      placeholder="Password (min. 6 karakter)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-9"
                      required
                      minLength={6}
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
                    className="h-11 w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Mendaftar..." : "Daftar"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>

        <div className="relative hidden flex-1 lg:block">
          <img
            src={registerImage}
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
                  TaxaCore
                </p>
                <p className="text-sm text-white/90">
                  Sistem informasi pengetahuan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
