import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthenticatedRequest extends Request {
  user: any;
}

export async function verifySupabaseToken(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  try {
    // Verify JWT with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return res.status(401).json({ error: 'Token tidak valid' });
    }

    // Get user data from our database
    const { data: userData, error: dbError } = await supabase
      .from('user')
      .select('*')
      .eq('email', data.user.email)
      .single();

    if (dbError) {
      return res.status(500).json({ error: 'Terjadi kesalahan database' });
    }

    if (!userData) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Attach user data to request
    req.user = { ...data.user, ...userData };
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Autentikasi gagal' });
  }
}