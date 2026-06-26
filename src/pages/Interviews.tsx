import { useState, useMemo, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { INTERVIEW_QUESTIONS, InterviewQuestion, Difficulty } from "@/data/interviewQuestions";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { cn } from "@/lib/utils";
import { Brain, Lightbulb, RotateCcw, Trophy, Send, ChevronRight } from "lucide-react";

type Rating = "need_practice" | "good" | "nailed";
type QuestionState = "unanswered" | "submitted";

const DIFF_STYLES: Record<Difficulty, string> = {
  Easy:   "bg-[--ag-success]/10 text-[--ag-success] border border-[--ag-success]/20",
  Medium: "bg-[--ag-warning]/10 text-[--ag-warning] border border-[--ag-warning]/20",
  Hard:   "bg-[--ag-danger]/10 text-[--ag-danger] border border-[--ag-danger]/20",
};

const RATINGS: { key: Rating; label: string; icon: string }[] = [
  { key: "need_practice", label: "Need Practice", icon: "🔴" },
  { key: "good",          label: "Good",           icon: "🟡" },
  { key: "nailed",        label: "Nailed It",      icon: "🟢" },
];

const RATING_BORDER: Record<Rating, string> = {
  need_practice: "border-l-[--ag-danger]",
  good:          "border-l-[--ag-warning]",
  nailed:        "border-l-[--ag-success]",
};

const RATING_BTN: Record<Rating, string> = {
  need_practice: "border-[--ag-danger]/40 text-[--ag-danger] bg-[--ag-danger]/10",
  good:          "border-[--ag-warning]/40 text-[--ag-warning] bg-[--ag-warning]/10",
  nailed:        "border-[--ag-success]/40 text-[--ag-success] bg-[--ag-success]/10",
};

function lsKey(userId: string, path: CareerPathKey) {
  return `skillmatch_interview_${userId}_${path}`;
}
function loadRatings(userId: string, path: CareerPathKey): Record<string, Rating> {
  try { return JSON.parse(localStorage.getItem(lsKey(userId, path)) || "{}"); }
  catch { return {}; }
}
function saveRatings(userId: string, path: CareerPathKey, r: Record<string, Rating>) {
  localStorage.setItem(lsKey(userId, path), JSON.stringify(r));
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({
  q, rating, onRate, state, onSubmit,
}: {
  q: InterviewQuestion;
  rating?: Rating;
  onRate: (r: Rating) => void;
  state: QuestionState;
  onSubmit: (answer: string) => void;
}) {
  const [userAnswer, setUserAnswer] = useState("");

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;
    onSubmit(userAnswer.trim());
  };

  // skip: reveal without typing
  const handleSkip = () => onSubmit("");

  return (
    <div
      className={cn(
        "rounded-none border border-[--ag-border] bg-[--ag-surface] transition-all duration-200",
        rating ? "border-l-4 " + RATING_BORDER[rating] : "",
      )}
    >
      <div className="p-5 space-y-4">
        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", DIFF_STYLES[q.difficulty])}>
            {q.difficulty}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[--ag-bg] border border-[--ag-border] text-[--ag-muted]">
            {q.category}
          </span>
          {rating && (
            <span className={cn("ml-auto px-2 py-0.5 text-[10px] font-bold border", RATING_BTN[rating])}>
              {RATINGS.find(r => r.key === rating)?.icon}{" "}
              {RATINGS.find(r => r.key === rating)?.label}
            </span>
          )}
        </div>

        {/* Question */}
        <p className="text-[--ag-text] font-bold text-base leading-relaxed">{q.question}</p>

        {/* Before submit: textarea + submit */}
        {state === "unanswered" ? (
          <div className="space-y-3">
            <textarea
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Type your answer here… explain your thinking as you would in a real interview."
              rows={4}
              className="w-full bg-[--ag-bg] border border-[--ag-border] text-[--ag-text] text-sm px-3 py-2.5 placeholder:text-[--ag-muted]/60 focus:outline-none focus:border-[--ag-accent] resize-none leading-relaxed font-['JetBrains_Mono']"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-[--ag-accent] text-[#07080F] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-3.5 w-3.5" /> Submit Answer
              </button>
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[--ag-muted] border border-[--ag-border] hover:border-[--ag-accent]/40 hover:text-[--ag-text] transition-colors"
              >
                Skip — Just Show Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Side-by-side: your answer vs ideal */}
            <div className={userAnswer ? "grid md:grid-cols-2 gap-3" : ""}>
              {/* Your answer — only shown if they typed something */}
              {userAnswer && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[--ag-muted] mb-1.5">Your Answer</p>
                  <div className="p-3 bg-[--ag-bg] border border-[--ag-border] min-h-[80px]">
                    <p className="text-xs text-[--ag-text] leading-relaxed font-['JetBrains_Mono'] whitespace-pre-wrap">{userAnswer}</p>
                  </div>
                </div>
              )}
              {/* Ideal answer */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[--ag-success] mb-1.5">Ideal Answer</p>
                <div className="p-3 bg-[--ag-success]/5 border border-[--ag-success]/20 min-h-[80px]">
                  <p className="text-xs text-[--ag-text] leading-relaxed">{q.answer}</p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="flex gap-2">
              <Lightbulb className="h-4 w-4 text-[--ag-warning] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[--ag-muted] mb-1">Tips</p>
                {q.tips.map((tip, i) => (
                  <p key={i} className="text-xs text-[--ag-muted]">• {tip}</p>
                ))}
              </div>
            </div>

            {/* Rate yourself */}
            <div className="pt-3 border-t border-[--ag-border]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[--ag-muted] mb-2">
                Compare your answer to the ideal — how did you do?
              </p>
              <div className="flex gap-2">
                {RATINGS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => onRate(key)}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border transition-all",
                      rating === key
                        ? RATING_BTN[key] + " ring-1 ring-offset-1 ring-offset-[--ag-surface]"
                        : "bg-[--ag-bg] border-[--ag-border] text-[--ag-muted] hover:border-[--ag-accent]/40",
                    )}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const Interviews = () => {
  const { user, profile } = useAuth();

  const [selectedPath, setSelectedPath] = useState<CareerPathKey>(
    (profile?.career_goal as CareerPathKey) || "frontend_dev",
  );
  const [diffFilter, setDiffFilter] = useState<Difficulty | "All">("All");
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  // Track which questions have been submitted (answer revealed)
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) setRatings(loadRatings(user.id, selectedPath));
    setSubmittedAnswers({});
  }, [selectedPath, user?.id]);

  useEffect(() => {
    if (profile?.career_goal) setSelectedPath(profile.career_goal as CareerPathKey);
  }, [profile?.career_goal]);

  const questions = INTERVIEW_QUESTIONS[selectedPath] || [];

  const filtered = useMemo(
    () => (diffFilter === "All" ? questions : questions.filter(q => q.difficulty === diffFilter)),
    [questions, diffFilter],
  );

  const rateQuestion = (qId: string, r: Rating) => {
    const next = { ...ratings, [qId]: r };
    setRatings(next);
    if (user) saveRatings(user.id, selectedPath, next);
  };

  const submitAnswer = (qId: string, answer: string) => {
    setSubmittedAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const nailed = Object.values(ratings).filter(r => r === "nailed").length;
  const good   = Object.values(ratings).filter(r => r === "good").length;
  const needs  = Object.values(ratings).filter(r => r === "need_practice").length;
  const total  = questions.length;
  const readinessPct =
    total === 0 ? 0 : Math.round((nailed * 100 + good * 60 + needs * 10) / total);

  const resetAll = () => {
    setRatings({});
    setSubmittedAnswers({});
    if (user) saveRatings(user.id, selectedPath, {});
  };

  const pathInfo = CAREER_PATHS[selectedPath];

  return (
    <div className="min-h-screen bg-[--ag-bg]">
      <DashboardSidebar />
      <div className="pl-64 min-h-screen transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight flex items-center gap-3">
                <Brain className="h-8 w-8 text-[--ag-accent]" />
                Mock Interview Practice
              </h1>
              <p className="text-sm text-[--ag-muted] mt-1">
                Type your answer · Submit to reveal ideal answer · Compare and rate yourself
              </p>
            </div>
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[--ag-muted] border border-[--ag-border] hover:border-[--ag-danger]/40 hover:text-[--ag-danger] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset All
            </button>
          </div>

          {/* How it works banner */}
          <div className="rounded-none bg-[--ag-surface] border border-[--ag-accent]/20 p-4">
            <div className="flex items-center gap-6 text-xs text-[--ag-muted]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[--ag-accent] text-[#07080F] text-[10px] font-extrabold flex items-center justify-center shrink-0">1</span>
                Read the question
              </div>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[--ag-accent] text-[#07080F] text-[10px] font-extrabold flex items-center justify-center shrink-0">2</span>
                Type your answer honestly
              </div>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[--ag-accent] text-[#07080F] text-[10px] font-extrabold flex items-center justify-center shrink-0">3</span>
                Compare with ideal answer
              </div>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[--ag-accent] text-[#07080F] text-[10px] font-extrabold flex items-center justify-center shrink-0">4</span>
                Rate yourself to track readiness
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[--ag-muted]">Path</label>
              <select
                value={selectedPath}
                onChange={e => setSelectedPath(e.target.value as CareerPathKey)}
                className="bg-[--ag-surface] border border-[--ag-border] text-[--ag-text] text-sm px-3 py-1.5 focus:outline-none focus:border-[--ag-accent] cursor-pointer"
              >
                {Object.entries(CAREER_PATHS).map(([key, path]) => (
                  <option key={key} value={key}>{path.emoji} {path.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              {(["All", "Easy", "Medium", "Hard"] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all",
                    diffFilter === d
                      ? "bg-[--ag-accent] text-[#07080F] border-[--ag-accent]"
                      : "bg-[--ag-surface] border-[--ag-border] text-[--ag-muted] hover:border-[--ag-accent]/40",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Readiness Card */}
          <div className="rounded-none bg-[--ag-surface] border border-[--ag-border] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-[--ag-accent]" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted]">Interview Readiness</p>
                  <p className="text-sm font-bold text-[--ag-text]">{pathInfo.emoji} {pathInfo.label}</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "text-3xl font-['JetBrains_Mono'] font-extrabold",
                    readinessPct >= 70 ? "text-[--ag-success]" : readinessPct >= 40 ? "text-[--ag-warning]" : "text-[--ag-accent]",
                  )}
                >
                  {readinessPct}%
                </span>
                <p className="text-[10px] text-[--ag-muted] mt-0.5">
                  {Object.keys(ratings).length}/{total} rated
                </p>
              </div>
            </div>

            <div className="h-2 bg-[--ag-bg] border border-[--ag-border] overflow-hidden mb-3">
              <div
                className={cn(
                  "h-full transition-all duration-700",
                  readinessPct >= 70 ? "bg-[--ag-success]" : readinessPct >= 40 ? "bg-[--ag-warning]" : "bg-[--ag-accent]",
                )}
                style={{ width: `${readinessPct}%` }}
              />
            </div>

            <div className="flex gap-6">
              {RATINGS.map(({ key, label, icon }) => {
                const count = Object.values(ratings).filter(r => r === key).length;
                return (
                  <span key={key} className="text-xs text-[--ag-muted] flex items-center gap-1.5">
                    {icon}
                    <span className="font-['JetBrains_Mono'] font-bold text-[--ag-text]">{count}</span>
                    {label}
                  </span>
                );
              })}
              <span className="ml-auto text-xs text-[--ag-muted] flex items-center gap-1.5">
                <span className="font-['JetBrains_Mono'] font-bold text-[--ag-text]">
                  {Object.keys(submittedAnswers).length}
                </span>
                answered this session
              </span>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted]">
              {filtered.length} question{filtered.length !== 1 ? "s" : ""}
              {diffFilter !== "All" ? ` · ${diffFilter}` : ""}
            </p>
            {filtered.map(q => (
              <QuestionCard
                key={q.id}
                q={q}
                rating={ratings[q.id]}
                onRate={r => rateQuestion(q.id, r)}
                state={submittedAnswers.hasOwnProperty(q.id) ? "submitted" : "unanswered"}
                onSubmit={answer => submitAnswer(q.id, answer)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Interviews;
