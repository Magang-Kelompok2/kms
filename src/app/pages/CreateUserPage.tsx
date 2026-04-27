import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useClasses } from "../hooks/useClasses";
import { useLevels } from "../hooks/useLevels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ArrowLeft, CheckCircle2, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

type SelectedAccess = {
  classId: string;
  className: string;
  levelId: string;
  levelName: string;
};

export function CreateUserPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { classes, loading: classesLoading, error: classesError } = useClasses();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedAccesses, setSelectedAccesses] = useState<SelectedAccess[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeClassId = selectedClassId ? Number(selectedClassId) : undefined;
  const { levels, loading: levelsLoading, error: levelsError } =
    useLevels(activeClassId);

  const availableLevels = useMemo(
    () =>
      levels.map((level) => ({
        id: String(level.level),
        name: level.namaLevel,
      })),
    [levels],
  );

  useEffect(() => {
    if (!selectedLevelId) return;
    const levelExists = availableLevels.some((level) => level.id === selectedLevelId);
    if (!levelExists) {
      setSelectedLevelId("");
    }
  }, [availableLevels, selectedLevelId]);

  if (user?.role !== "superadmin") {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setErrorMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (selectedAccesses.length === 0) {
      setErrorMessage("Minimal harus ada 1 kelas yang dipilih.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password,
          role: "user",
          accesses: selectedAccesses.map((access) => ({
            id_kelas: Number(access.classId),
            id_tingkatan: Number(access.levelId),
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Gagal membuat user");
      }

      toast.custom(
        () => (
          <div className="flex w-[360px] items-center gap-2.5 rounded-xl border border-border bg-background px-4 py-3 shadow-lg">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <p className="line-clamp-1 text-sm text-foreground">
              User {formData.name} telah dibuat
            </p>
          </div>
        ),
        { duration: 3500 },
      );
      navigate("/users");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAccess = () => {
    if (!selectedClassId || !selectedLevelId) {
      setErrorMessage("Pilih kelas dan tingkatan terlebih dahulu.");
      return;
    }

    const selectedClass = classes.find((kelas) => String(kelas.id) === selectedClassId);
    const selectedLevel = availableLevels.find((level) => level.id === selectedLevelId);

    if (!selectedClass || !selectedLevel) {
      setErrorMessage("Pilihan kelas atau tingkatan tidak valid.");
      return;
    }

    setSelectedAccesses((prev) => {
      const nextAccess = {
        classId: selectedClassId,
        className: selectedClass.name,
        levelId: selectedLevelId,
        levelName: selectedLevel.name,
      };

      const existingIndex = prev.findIndex(
        (access) => access.classId === selectedClassId,
      );

      if (existingIndex === -1) {
        return [...prev, nextAccess];
      }

      const updated = [...prev];
      updated[existingIndex] = nextAccess;
      return updated;
    });

    setSelectedLevelId("");
    setErrorMessage(null);
  };

  const handleRemoveAccess = (classId: string) => {
    setSelectedAccesses((prev) =>
      prev.filter((access) => access.classId !== classId),
    );
  };

  return (
    <AppLayout className="max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/users")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Laman Pengguna
        </Button>

        <Card className="p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UserPlus className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Buat Akun Baru
              </h1>
              <p className="text-sm text-muted-foreground">
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

            <div className="space-y-2">
              <Label htmlFor="class">Pilih Kelas</Label>
              <Select
                value={selectedClassId}
                onValueChange={(value) => {
                  setSelectedClassId(value);
                  setSelectedLevelId("");
                }}
                disabled={classesLoading || classes.length === 0}
              >
                <SelectTrigger id="class">
                  <SelectValue
                    placeholder={
                      classesLoading ? "Memuat kelas..." : "Pilih kelas"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((kelas) => (
                    <SelectItem key={kelas.id} value={String(kelas.id)}>
                      {kelas.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {classesError && (
                <p className="text-xs text-red-500">{classesError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Pilih Tingkatan Tertinggi</Label>
              <Select
                value={selectedLevelId}
                onValueChange={setSelectedLevelId}
                disabled={!selectedClassId || levelsLoading || availableLevels.length === 0}
              >
                <SelectTrigger id="level">
                  <SelectValue
                    placeholder={
                      !selectedClassId
                        ? "Pilih kelas terlebih dahulu"
                        : levelsLoading
                          ? "Memuat tingkatan..."
                          : "Pilih tingkatan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {levelsError && (
                <p className="text-xs text-red-500">{levelsError}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddAccess}
                disabled={!selectedClassId || !selectedLevelId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Simpan Akses Kelas
              </Button>
            </div>

            <div className="space-y-3">
              <Label>Akses Kelas User</Label>
              {selectedAccesses.length === 0 ? (
                <div className="rounded-md border border-dashed px-3 py-4 text-sm text-gray-500">
                  Belum ada kelas yang ditambahkan.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedAccesses.map((access, index) => (
                    <div
                      key={access.classId}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="text-sm">
                        <span className="font-medium">Kelas {index + 1}</span>
                        <p className="text-gray-600 dark:text-gray-400">
                          {access.className} - akses sampai {access.levelName}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAccess(access.classId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Satu kelas cukup dipilih sekali. Jika Anda memilih tingkatan yang lebih tinggi, semua tingkatan di bawahnya pada kelas tersebut akan ikut terbuka.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={submitting}>
                <UserPlus className="h-4 w-4 mr-2" />
                {submitting ? "Menyimpan..." : "Create User"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/users")}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
    </AppLayout>
  );
}
