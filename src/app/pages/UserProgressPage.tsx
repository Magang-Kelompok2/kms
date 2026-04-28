import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useClasses } from "../hooks/useClasses";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  FileText,
  X,
  Filter,
  PlusCircle,
  Edit3
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface SubmissionItem {
  id: number;
  classId: string;
  className: string;
  title: string;
  file: { name: string; url: string } | null;
  user_pengumpulan: {
    score: number | null;
    feedback: string | null;
  };
}

export function UserProgressPage() {
  const { userId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { classes } = useClasses();

  const [targetUser, setTargetUser] = useState<UserData | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  // State untuk Preview File
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);

  // State untuk Modal Penilaian
  const [scoringOpen, setScoringOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [inputScore, setInputScore] = useState("");
  const [inputFeedback, setInputFeedback] = useState("");

  useEffect(() => {
    if (!token || user?.role !== "superadmin" || !userId) return;

    const fetchData = async () => {
      try {
        const [uRes, sRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/pengumpulan/user/${userId}`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
        ]);

        const uJson = await uRes.json();
        const sJson = await sRes.json();

        setTargetUser(uJson.data);
        
        const mappedSubmissions = (sJson.data || []).map((s: any) => ({
          ...s,
          className: classes.find(c => String(c.id) === String(s.classId))?.name || "Kelas",
          user_pengumpulan: s.user_pengumpulan || { score: null, feedback: null }
        }));
        
        setSubmissions(mappedSubmissions);
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, token, user, classes]);

  const handleUpdateScore = async () => {
    if (!selectedSub || !token || !userId) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pengumpulan/score/${userId}/${selectedSub.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          score: inputScore !== "" ? Number(inputScore) : null, 
          feedback: inputFeedback 
        })
      });

      if (res.ok) {
        // Update state lokal agar UI langsung berubah tanpa refresh halaman
        setSubmissions(prev => prev.map(s => s.id === selectedSub.id 
          ? { ...s, user_pengumpulan: { score: inputScore !== "" ? Number(inputScore) : null, feedback: inputFeedback } } 
          : s
        ));
        setScoringOpen(false);
      } else {
        const errData = await res.json();
        alert("Gagal menyimpan nilai: " + (errData.error || "Unknown Error"));
      }
    } catch (err) {
      console.error("Error updating score:", err);
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (selectedClassId === "all") return submissions;
    return submissions.filter(s => String(s.classId) === selectedClassId);
  }, [submissions, selectedClassId]);

  if (loading) return <AppLayout><div className="p-10 text-center text-blue-600 font-bold animate-pulse">Memuat Data...</div></AppLayout>;

  return (
    <AppLayout>
      <Button variant="ghost" onClick={() => navigate("/users")} className="mb-6 hover:bg-slate-100">
        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar User
      </Button>

      {/* Profile Header */}
      <Card className="p-6 mb-8 flex items-center gap-5 border-none shadow-sm bg-white rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-[#0C4E8C] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200">
          {targetUser?.username?.[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">{targetUser?.username}</h1>
          <p className="text-slate-500 font-medium text-sm">{targetUser?.email} • <span className="capitalize">{targetUser?.role}</span></p>
        </div>
      </Card>

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">Daftar Pengumpulan</h2>
          <p className="text-xs text-slate-400 font-bold">Total: {filteredSubmissions.length} Tugas</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-80">
          <Filter className="h-4 w-4 text-[#0C4E8C]" />
          <select 
            className="text-sm font-bold w-full outline-none bg-transparent cursor-pointer text-slate-600"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="all">Semua Mata Kuliah</option>
            {classes.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSubmissions.length > 0 ? (
          filteredSubmissions.map((sub) => {
            const currentScore = sub.user_pengumpulan?.score;
            const hasScore = currentScore !== null && currentScore !== undefined;
            
            const badgeStyle = !hasScore 
              ? "bg-amber-100 text-amber-700" 
              : Number(currentScore) >= 75 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
            
            return (
              <Card key={sub.id} className="flex flex-col overflow-hidden min-h-[350px] shadow-xl shadow-slate-200/50 border-none rounded-3xl transition-transform hover:-translate-y-1">
                {/* Header Card */}
                <div className="h-32 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] p-6 flex flex-col justify-between relative">
                  <div className="flex justify-between items-start">
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Submission</span>
                    
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-black shadow-inner min-w-[50px] justify-center ${badgeStyle}`}>
                      {hasScore ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span className="leading-none">{currentScore}</span> 
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          <span className="leading-none text-[11px]">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                  <h3 className="text-white font-black text-xl line-clamp-2 leading-tight drop-shadow-sm">{sub.title}</h3>
                </div>

                {/* Body Card */}
                <div className="p-6 flex flex-col flex-1 gap-5 bg-white">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-wider">Mata Kuliah</p>
                    <p className="text-sm font-bold text-slate-700">{sub.className}</p>
                  </div>

                  {sub.file && (
                    <div 
                      onClick={() => { setPreviewFile(sub.file); setFilePreviewOpen(true); }}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-blue-50 border border-slate-100 transition-all group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        </div>
                        <span className="text-xs truncate font-bold text-slate-600">{sub.file.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 opacity-0 group-hover:opacity-100 uppercase tracking-tighter">Preview</span>
                    </div>
                  )}
                  
                  {sub.user_pengumpulan?.feedback && (
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-wider">Feedback Mentor</p>
                      <p className="text-xs text-slate-600 italic line-clamp-2">"{sub.user_pengumpulan.feedback}"</p>
                    </div>
                  )}

                  {/* Tombol Input/Edit Nilai - DI SINI PERUBAHANNYA */}
                  <div className="mt-auto pt-4 border-t border-slate-50">
                    <Button 
                      onClick={() => {
                        setSelectedSub(sub);
                        setInputScore(sub.user_pengumpulan.score?.toString() || "");
                        setInputFeedback(sub.user_pengumpulan.feedback || "");
                        setScoringOpen(true);
                      }}
                      className="w-full rounded-2xl font-black bg-[#0C4E8C] hover:bg-[#093d6d] shadow-md shadow-blue-100 py-6"
                    >
                      {hasScore ? (
                        <><Edit3 className="mr-2 h-4 w-4" /> Edit Nilai</>
                      ) : (
                        <><PlusCircle className="mr-2 h-4 w-4" /> Input Nilai</>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <p className="text-slate-400 font-bold">Belum ada tugas yang dikumpulkan.</p>
          </div>
        )}
      </div>

      {/* Modal Penilaian (Input/Edit) */}
      {scoringOpen && selectedSub && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl bg-white border-none animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Penilaian Tugas</h3>
              <Button variant="ghost" size="icon" onClick={() => setScoringOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Skor (0-100)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={inputScore}
                  onChange={(e) => setInputScore(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="Masukkan skor..."
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Feedback Mentor</label>
                <textarea 
                  value={inputFeedback}
                  onChange={(e) => setInputFeedback(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all h-32 resize-none"
                  placeholder="Tulis masukan mentor di sini..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                variant="ghost" 
                className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50" 
                onClick={() => setScoringOpen(false)}
              >
                Batal
              </Button>
              <Button 
                className="flex-1 h-14 rounded-2xl font-black bg-[#0C4E8C] hover:bg-[#093d6d] shadow-lg shadow-blue-100" 
                onClick={handleUpdateScore}
              >
                Simpan Nilai
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {filePreviewOpen && previewFile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 md:p-10">
          <div className="bg-white rounded-[2.5rem] w-full max-w-6xl h-full flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FileText className="h-6 w-6 text-[#0C4E8C]" />
                </div>
                <h3 className="font-black text-slate-700 truncate max-w-xs md:max-w-xl">{previewFile.name}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFilePreviewOpen(false)} className="rounded-full h-12 w-12 hover:bg-rose-50 hover:text-rose-500">
                <X className="h-8 w-8" />
              </Button>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe 
                src={`${previewFile.url}#toolbar=0&navpanes=0`} 
                className="w-full h-full border-none" 
                title="Admin Preview"
              />
            </div>
            <div className="p-6 border-t flex justify-center bg-white">
              <Button className="px-12 h-12 rounded-full font-black bg-slate-800" onClick={() => setFilePreviewOpen(false)}>Tutup Pratinjau</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}