import { useState, useEffect } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { supabase } from "../utils/supabase";

// --- 1. KOMPONEN HALAMAN UTAMA (Logika Supabase di sini) ---
function DashboardKMS() {
  const [dataKelas, setDataKelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getKMSData() {
      setLoading(true);
      // Mengambil data dari tabel 'kelas' (sesuai schema Supabase kamu)
      const { data, error } = await supabase.from("kelas").select("*");

      if (error) {
        console.error("Error fetching data:", error.message);
      } else if (data) {
        setDataKelas(data);
      }
      setLoading(false);
    }

    getKMSData();
  }, []);

  if (loading) return <div style={{ padding: "20px" }}>Memuat data KMS...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Daftar Kelas KMS - Taxacore</h1>
      <ul>
        {dataKelas.length > 0 ? (
          dataKelas.map((item) => (
            <li key={item.id_kelas}>
              <strong>{item.nama_kelas}</strong>
            </li>
          ))
        ) : (
          <p>Data kelas kosong atau RLS belum diatur.</p>
        )}
      </ul>
    </div>
  );
}

// --- 2. KONFIGURASI ROUTER ---
// Jika kamu sudah punya file 'routes.tsx' sendiri,
// pastikan komponen DashboardKMS di atas dipanggil di dalamnya.
const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardKMS />,
  },
  // Tambahkan path lain di sini jika perlu
]);

// --- 3. KOMPONEN ROOT APP ---
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
