import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase";

const router = Router();

// Gunakan fallback agar tidak crash saat dev, tapi log warning
const JWT_SECRET = process.env.JWT_SECRET ?? "taxacore_secret_key_dev_only";
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET tidak diset di .env, menggunakan fallback dev key");
}

const SALT_ROUNDS = 10;

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email dan password wajib diisi" });
  }

  try {
    const { data: user, error } = await supabase
      .from("user")
      .select("id_user, username, email, password, role, id_kelas, created_at")
      .eq("email", email)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ success: false, error: "Email atau password salah" });
    }

    // Cek password - support plain text lama DAN bcrypt baru
    let isValid = false;
    const isHashed = user.password?.startsWith("$2");

    if (isHashed) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Password lama plain text
      isValid = user.password === password;
      if (isValid) {
        // Auto-upgrade: hash dan simpan password lama
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        await supabase
          .from("user")
          .update({ password: hashed })
          .eq("id_user", user.id_user);
        console.log(`✅ Password auto-upgraded for ${email}`);
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, error: "Email atau password salah" });
    }

    // Buat JWT token
    const token = jwt.sign(
      { id: user.id_user, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: String(user.id_user),
        name: user.username,
        email: user.email,
        role: user.role ?? "user",
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, error: "Terjadi kesalahan server" });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ success: false, error: "Semua field wajib diisi" });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: "Password minimal 6 karakter" });
  }

  try {
    // Cek email sudah ada
    const { data: existing } = await supabase
      .from("user")
      .select("id_user")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, error: "Email sudah terdaftar" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Simpan user baru dengan role default "user"
    const { data: newUser, error } = await supabase
      .from("user")
      .insert({ username, email, password: hashedPassword, role: "user" })
      .select("id_user, username, email, role, created_at")
      .single();

    if (error || !newUser) {
      console.error("Register DB error:", error);
      return res.status(500).json({ success: false, error: "Gagal membuat akun" });
    }

    // Buat JWT token
    const token = jwt.sign(
      { id: newUser.id_user, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: String(newUser.id_user),
        name: newUser.username,
        email: newUser.email,
        role: newUser.role ?? "user",
        createdAt: newUser.created_at,
      },
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, error: "Terjadi kesalahan server" });
  }
});

// POST /api/auth/logout (opsional - client cukup hapus token)
router.post("/logout", (_req, res) => {
  return res.json({ success: true, message: "Logout berhasil" });
});

export default router;