import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { quizzes, userProgress } from "../data/mockData";
import { ArrowLeft, Clock, CheckCircle, Award, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export function QuizViewPage() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);

  const quiz = quizzes.find((q) => q.id === quizId);
  const progress = userProgress.find(
    (p) => p.userId === user?.id && p.classId === quiz?.classId
  );

  useEffect(() => {
    if (isStarted && !isFinished && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isStarted, isFinished, timeLeft]);

  if (!quiz) {
    return <div>Quiz not found</div>;
  }

  // Check if user has access
  const userLevel = progress?.currentLevel || 1;
  const hasAccess = user?.role === "superadmin" || quiz.level <= userLevel;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <Card className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Akses Ditolak</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Anda perlu menyelesaikan tingkatan sebelumnya untuk mengakses kuis ini.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Kembali ke Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const handleStart = () => {
    setIsStarted(true);
    setTimeLeft(quiz.duration * 60); // Convert minutes to seconds
  };

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    setAnswers({ ...answers, [questionIndex]: answerIndex });
  };

  const handleFinish = () => {
    // Calculate score
    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    const finalScore = (correctCount / quiz.questions.length) * 100;
    setScore(finalScore);
    setIsFinished(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start Screen
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto px-4 md:px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/class/${quiz.classId}`)}
            className="mb-4 text-base"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Kembali ke Kelas
          </Button>

          <div className="max-w-3xl mx-auto">
            <Card className="p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-2 justify-center mb-3">
                  <Badge variant="secondary" className="text-sm">
                    Pertemuan {quiz.meetingNumber}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    Level {quiz.level}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6 space-y-4">
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-600 dark:text-gray-400">Jumlah Soal</span>
                  <span className="font-bold">{quiz.questions.length} pertanyaan</span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-600 dark:text-gray-400">Durasi</span>
                  <span className="font-bold flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {quiz.duration} menit
                  </span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-gray-600 dark:text-gray-400">Passing Grade</span>
                  <span className="font-bold">70%</span>
                </div>
              </div>

              <Card className="p-5 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                      Perhatian!
                    </h3>
                    <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                      <li>Kuis hanya dapat dikerjakan satu kali</li>
                      <li>Timer akan mulai berjalan setelah Anda klik "Mulai Kuis"</li>
                      <li>Jawaban akan otomatis tersubmit saat waktu habis</li>
                      <li>Pastikan koneksi internet stabil</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Button onClick={handleStart} className="w-full text-base py-6">
                Mulai Kuis
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Result Screen
  if (isFinished) {
    const isPassed = score >= 70;
    const correctCount = Math.round((score / 100) * quiz.questions.length);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto px-4 md:px-6 py-6">
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 text-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isPassed
                    ? "bg-green-100 dark:bg-green-900/20"
                    : "bg-red-100 dark:bg-red-900/20"
                }`}
              >
                {isPassed ? (
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                )}
              </div>

              <h1 className="text-3xl font-bold mb-2">
                {isPassed ? "Selamat! Anda Lulus!" : "Belum Berhasil"}
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-8">
                {isPassed
                  ? "Anda telah menyelesaikan kuis dengan baik"
                  : "Jangan menyerah, tingkatkan pemahaman Anda dan coba lagi"}
              </p>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 mb-8">
                <div className="text-6xl font-bold mb-2">{score.toFixed(0)}%</div>
                <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
                  Skor Anda
                </p>
                <div className="grid grid-cols-2 gap-4 text-base">
                  <div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {correctCount}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Benar</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {quiz.questions.length - correctCount}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Salah</div>
                  </div>
                </div>
              </div>

              {/* Answer Review */}
              <div className="text-left mb-8">
                <h2 className="text-xl font-bold mb-4">Review Jawaban</h2>
                <div className="space-y-4">
                  {quiz.questions.map((question, index) => {
                    const userAnswer = answers[index];
                    const isCorrect = userAnswer === question.correctAnswer;
                    return (
                      <Card
                        key={question.id}
                        className={`p-4 ${
                          isCorrect
                            ? "border-green-300 dark:border-green-700"
                            : "border-red-300 dark:border-red-700"
                        }`}
                      >
                        <div className="flex gap-3">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-base mb-2">
                              {index + 1}. {question.question}
                            </p>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Jawaban Anda:
                                </span>{" "}
                                <span
                                  className={
                                    isCorrect
                                      ? "text-green-600 dark:text-green-400 font-semibold"
                                      : "text-red-600 dark:text-red-400 font-semibold"
                                  }
                                >
                                  {userAnswer !== undefined
                                    ? question.options[userAnswer]
                                    : "Tidak dijawab"}
                                </span>
                              </p>
                              {!isCorrect && (
                                <p>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Jawaban Benar:
                                  </span>{" "}
                                  <span className="text-green-600 dark:text-green-400 font-semibold">
                                    {question.options[question.correctAnswer]}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => navigate(`/class/${quiz.classId}`)}
                  className="flex-1 text-base py-6"
                >
                  Kembali ke Kelas
                </Button>
                {!isPassed && (
                  <Button
                    onClick={() => {
                      setIsStarted(false);
                      setIsFinished(false);
                      setAnswers({});
                      setCurrentQuestion(0);
                      setScore(0);
                    }}
                    variant="outline"
                    className="flex-1 text-base py-6"
                  >
                    Coba Lagi
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Screen
  const question = quiz.questions[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Timer and Progress */}
        <div className="max-w-4xl mx-auto mb-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold">{quiz.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pertanyaan {currentQuestion + 1} dari {quiz.questions.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span
                  className={`text-xl font-bold ${
                    timeLeft < 60
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Question */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 mb-6">
            <h3 className="text-2xl font-bold mb-6">
              {currentQuestion + 1}. {question.question}
            </h3>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(currentQuestion, index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all text-base ${
                    answers[currentQuestion] === index
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        answers[currentQuestion] === index
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {answers[currentQuestion] === index && (
                        <CheckCircle className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              disabled={currentQuestion === 0}
              className="text-base py-6"
            >
              Sebelumnya
            </Button>
            {currentQuestion < quiz.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex-1 text-base py-6"
              >
                Selanjutnya
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                className="flex-1 text-base py-6 bg-green-600 hover:bg-green-700"
              >
                Selesai
              </Button>
            )}
          </div>

          {/* Question Navigator */}
          <Card className="mt-6 p-5">
            <h3 className="text-base font-bold mb-3">Navigasi Soal</h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {quiz.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-full aspect-square rounded-lg border-2 font-semibold text-sm transition-all ${
                    currentQuestion === index
                      ? "border-blue-500 bg-blue-500 text-white"
                      : answers[index] !== undefined
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              {Object.keys(answers).length} dari {quiz.questions.length} soal telah dijawab
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}