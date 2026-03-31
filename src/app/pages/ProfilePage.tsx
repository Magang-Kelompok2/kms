import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, User, Mail, Calendar, Shield } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleSave = () => {
    // In real app, this would call an API to update user data
    alert("Profil berhasil diperbarui!");
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Dashboard
        </Button>

        {/* Profile Header */}
        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-normal mb-2">{user?.name}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {user?.email}
                  </span>
                </div>
                <Badge variant={user?.role === "superadmin" ? "default" : "secondary"}>
                  {user?.role === "superadmin" ? "Super Admin" : "Student"}
                </Badge>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
            >
              {isEditing ? "Batal" : "Edit Profil"}
            </Button>
          </div>
        </Card>

        {/* Profile Information */}
        <Card className="p-8">
          <h2 className="text-2xl font-normal mb-6">Informasi Profil</h2>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role (read-only) */}
            <div>
              <Label htmlFor="role">Role</Label>
              <div className="relative mt-2">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="role"
                  value={user?.role === "superadmin" ? "Super Admin" : "Student"}
                  disabled
                  className="pl-10 bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>

            {/* Created Date (read-only) */}
            <div>
              <Label htmlFor="created">Tanggal Bergabung</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="created"
                  value={new Date().toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  disabled
                  className="pl-10 bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  Simpan Perubahan
                </Button>
                <Button
                  onClick={() => {
                    setFormData({
                      name: user?.name || "",
                      email: user?.email || "",
                    });
                    setIsEditing(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Security Section */}
        <Card className="p-8 mt-6">
          <h2 className="text-2xl font-normal mb-4">Keamanan</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Jaga keamanan akun Anda dengan mengubah password secara berkala.
          </p>
          <Button variant="outline">Ubah Password</Button>
        </Card>
      </div>
    </div>
  );
}
