import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card, CardContent, CardHeader } from "../components/ui/card";
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
    <AppLayout className="max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Kembali ke Dashboard
        </Button>

        <Card className="mb-6 shadow-sm">
          <CardHeader className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="size-12" />
              </div>
              <div>
                <h1 className="mb-2 text-2xl font-semibold tracking-tight">
                  {user?.name}
                </h1>
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-4 shrink-0" />
                  <span>{user?.email}</span>
                </div>
                <Badge
                  variant={
                    user?.role === "superadmin" ? "default" : "secondary"
                  }
                >
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
          </CardHeader>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <h2 className="text-lg font-semibold tracking-tight">
              Informasi Profil
            </h2>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">

            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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

            <div>
              <Label htmlFor="role">Role</Label>
              <div className="relative mt-2">
                <Shield className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="role"
                  value={user?.role === "superadmin" ? "Super Admin" : "Student"}
                  disabled
                  className="bg-muted/50 pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="created">Tanggal Bergabung</Label>
              <div className="relative mt-2">
                <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="created"
                  value={new Date().toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  disabled
                  className="bg-muted/50 pl-10"
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
          </CardContent>
        </Card>
    </AppLayout>
  );
}

