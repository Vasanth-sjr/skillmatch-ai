import { useState } from "react";
import { CAREER_PATHS, QUIZ_QUESTIONS, CareerPathKey } from "@/data/careerPaths";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Sparkles, RotateCcw } from "lucide-react";

interface Props {
  onComplete: (chosen: CareerPathKey) => void;
  onBack: () => void;
}

interface Result {
  key: CareerPathKey;
  score: number;
  pct: number;
}

const RESULTS_STEP = QUIZ_QUESTIONS.length;

export function CareerQuiz({ onComplete, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const currentQ = QUIZ_QUESTIONS[step];
  const isLastQuestion = step === QUIZ_QUESTIONS.length - 1;

  const calcScores = (finalAnswers: number[]): Result[] => {
    const scores: Partial<Record<CareerPathKey, number>> = {};
    QUIZ_QUESTIONS.forEach((q, qi) => {
      const chosen = q.options[finalAnswers[qi]];
      if (!chosen) return;
      Object.entries(chosen.weights).forEach(([path, w]) => {
        scores[path as CareerPathKey] = (scores[path as CareerPathKey] ?? 0) + w;
      });
    });
    const entries = Object.entries(scores) as [CareerPathKey, number][];
    const maxScore = Math.max(...entries.map(([, s]) => s));
    return entries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key, score]) => ({ key, score, pct: Math.round((score / maxScore) * 100) }));
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (isLastQuestion) {
      setAnalyzing(true);
      const computed = calcScores(newAnswers);
      setTimeout(() => {
        setResults(computed);
        setAnalyzing(false);
        setStep(RESULTS_STEP);
      }, 1800);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) {
      onBack();
    } else if (step === RESULTS_STEP) {
      const prev = answers[answers.length - 1];
      setResults([]);
      setAnswers(a => a.slice(0, -1));
      setSelectedOption(prev);
      setStep(QUIZ_QUESTIONS.length - 1);
    } else {
      const prev = answers[answers.length - 1];
      setAnswers(a => a.slice(0, -1));
      setSelectedOption(prev);
      setStep(s => s - 1);
    }
  };

  const retake = () => {
    setStep(0);
    setAnswers([]);
    setSelectedOption(null);
    setResults([]);
  };

  // ── Analyzing ──
  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 border-2 border-[--ag-accent]/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-[--ag-accent] rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-['Syne'] font-bold text-[--ag-text]">Analyzing your answers…</p>
          <p className="text-sm text-[--ag-muted]">Finding careers that match how you think</p>
        </div>
      </div>
    );
  }

  // ── Results ──
  if (step === RESULTS_STEP && results.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[--ag-accent]" />
          <h2 className="text-2xl font-['Syne'] font-extrabold text-[--ag-text]">Your Top Matches</h2>
        </div>
        <p className="text-sm text-[--ag-muted]">
          Based on your answers, these careers fit how you think and what drives you. Pick the one that resonates.
        </p>

        <div className="space-y-3">
          {results.map((r, i) => {
            const path = CAREER_PATHS[r.key];
            return (
              <div
                key={r.key}
                className={`border p-5 transition-all ${i === 0 ? "border-[--ag-accent] bg-[--ag-accent-dim]" : "border-[--ag-border] bg-[--ag-surface]"}`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl leading-none mt-0.5">{path.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-bold text-[--ag-text]">{path.label}</h3>
                      {i === 0 && (
                        <span className="text-xs font-bold text-[--ag-accent] border border-[--ag-accent]/30 px-2 py-0.5">
                          Best match
                        </span>
                      )}
                      <span className="ml-auto text-xl font-extrabold text-[--ag-accent]">{r.pct}%</span>
                    </div>
                    <p className="text-xs text-[--ag-muted] mb-3">{path.tagline}</p>
                    <div className="h-1 bg-[--ag-border] w-full mb-3">
                      <div className="h-full bg-[--ag-accent] transition-all" style={{ width: `${r.pct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {path.coreSkills.slice(0, 3).map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 bg-[--ag-bg] border border-[--ag-border] text-[--ag-muted]">
                          {s}
                        </span>
                      ))}
                    </div>
                    <Button
                      onClick={() => onComplete(r.key)}
                      className={`w-full rounded-none font-bold uppercase tracking-widest text-xs h-10 ${
                        i === 0
                          ? "bg-[--ag-accent] text-white hover:brightness-110"
                          : "bg-transparent border border-[--ag-border] text-[--ag-text] hover:border-[--ag-accent] hover:text-[--ag-accent]"
                      }`}
                    >
                      Choose {path.label} <ArrowRight className="h-3.5 w-3.5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={retake}
          className="flex items-center gap-1.5 text-sm text-[--ag-muted] hover:text-[--ag-text] transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retake quiz
        </button>
      </div>
    );
  }

  // ── Question ──
  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex gap-1">
        {QUIZ_QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 transition-all duration-300 ${
              i < step ? "bg-[--ag-accent]" : i === step ? "bg-[--ag-accent]/50" : "bg-[--ag-border]"
            }`}
          />
        ))}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[--ag-accent] mb-1">
          Question {step + 1} of {QUIZ_QUESTIONS.length}
        </p>
        <h2 className="text-2xl font-['Syne'] font-extrabold text-[--ag-text]">{currentQ.question}</h2>
        <p className="text-sm text-[--ag-muted] mt-1">{currentQ.context}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentQ.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelectedOption(i)}
            className={`text-left p-4 border transition-all ${
              selectedOption === i
                ? "border-[--ag-accent] bg-[--ag-accent-dim]"
                : "border-[--ag-border] bg-[--ag-surface] hover:border-[--ag-accent]/50"
            }`}
          >
            <p className="font-semibold text-[--ag-text] text-sm leading-snug">{opt.text}</p>
            <p className="text-xs text-[--ag-muted] mt-1 leading-snug">{opt.sub}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="gap-2 text-[--ag-muted] hover:text-[--ag-text]"
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 0 ? "Back" : "Previous"}
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedOption === null}
          className="gap-2 rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-40"
        >
          {isLastQuestion ? "See my matches" : "Next"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
