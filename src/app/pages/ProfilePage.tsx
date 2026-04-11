import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { User, Mail, Calendar } from "lucide-react";
import { useState } from "react";

export function ProfilePage() {
  const { user } = useAuth();
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
    <div className="max-w-2xl space-y-6">
      {/* Profile Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Profil</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kelola informasi akun Anda
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
            size="sm"
          >
            {isEditing ? "Batal" : "Edit"}
          </Button>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Nama Lengkap
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isEditing}
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!isEditing}
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role" className="text-sm font-medium">
              Role
            </Label>
            <div className="mt-1.5">
              <Badge
                variant={user?.role === "superadmin" ? "default" : "secondary"}
              >
                {user?.role === "superadmin" ? "Super Admin" : "Student"}
              </Badge>
            </div>
          </div>

          {/* Joined Date */}
          <div>
            <Label htmlFor="joined" className="text-sm font-medium">
              Tanggal Bergabung
            </Label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="joined"
                value={new Date().toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                disabled
                className="pl-9 text-sm bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} className="flex-1" size="sm">
                Simpan
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
                size="sm"
              >
                Batal
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
