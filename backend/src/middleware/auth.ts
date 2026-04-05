import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase";

// HARUS sama persis dengan yang di routes/auth.ts
const JWT_SECRET = process.env.JWT_SECRET ?? "taxacore_secret_key_dev_only";

export interface AuthenticatedRequest extends Request {
  user: any;
}

export async function verifySupabaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token tidak ditemukan" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
    };

    // Ambil data user terbaru dari DB
    const { data: userData, error } = await supabase
      .from("user")
      .select("*")
      .eq("id_user", decoded.id)
      .maybeSingle();

    if (error || !userData) {
      return res.status(401).json({ error: "User tidak ditemukan" });
    }

    req.user = userData;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token tidak valid atau sudah expired" });
  }
}