import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, UserPlus } from "lucide-react";

export function CreateUserPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  if (user?.role !== "superadmin") {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call an API
    console.log("Creating user:", formData);
    alert("User created successfully!");
    navigate("/users");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/users")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Laman Pengguna
        </Button>

        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-linear-to-br from-[#0C4E8C] to-[#11C4D4] rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-normal">Buat Akun Baru</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Buat Akun untuk Pengguna Baru
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Initial Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Buat kata sandi"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <p className="text-xs text-red-500">
                Pastikan untuk memberikan password yang mudah diingat kepada pengguna.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/users")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
