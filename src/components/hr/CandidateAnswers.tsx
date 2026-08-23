// A candidate's own written interview answers, shown to employers they
// applied to — and only with the candidate's explicit consent.
//
// This is the most persuasive artifact in the product, and the reason is
// that it requires no trust in us at all. Every other signal asks a
// recruiter to believe our scoring; this one hands them the candidate's
// actual reasoning and lets them judge it the way they would in a room.
//
// It renders nothing when there's nothing to show. A component that said
// "this candidate has not shared their answers" would turn a free choice
// into something a candidate is visibly penalised for declining, which
// would make the consent meaningless.

import { useState } from "react";
import { MessageSquareText, ChevronDown } from "lucide-react";
import { CandidateAnswer } from "@/lib/amsce/candidateEvidence";
import { INTERVIEW_QUESTIONS } from "@/data/interviewQuestions";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { cn } from "@/lib/utils";

function questionText(questionId: string): string | null {
  for (const list of Object.values(INTERVIEW_QUESTIONS)) {
    const found = (list as any[]).find(q => q.id === questionId);
    if (found) return found.question;
  }
  return null;
}

function questionSkills(questionId: string): string[] {
  for (const list of Object.values(INTERVIEW_QUESTIONS)) {
    const found = (list as any[]).find(q => q.id === questionId);
    if (found) return found.skills ?? [];
  }
  return [];
}

export function CandidateAnswers({ answers }: { answers: CandidateAnswer[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  if (answers.length === 0) return null;

  const visible = showAll ? answers : answers.slice(0, 3);

  return (
    <div className="bg-[--ag-surface] border border-[--ag-border] p-5 space-y-3">
      <div>
        <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-[--ag-accent]" /> In Their Own Words
        </h2>
        <p className="text-[11px] text-[--ag-muted] mt-1">
          Practice interview answers this candidate chose to share. Unedited, and
          written before they applied to you.
        </p>
      </div>

      <div className="divide-y divide-[--ag-border]">
        {visible.map(a => {
          const q = questionText(a.questionId);
          const skills = questionSkills(a.questionId);
          const isOpen = expanded === a.questionId;
          const path = CAREER_PATHS[a.careerPath as CareerPathKey];

          return (
            <div key={a.questionId} className="py-2.5">
              <button
                onClick={() => setExpanded(isOpen ? null : a.questionId)}
                className="w-full flex items-start gap-2 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[--ag-text] font-medium">
                    {q ?? "Interview question"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {path && (
                      <span className="text-[10px] text-[--ag-muted]">{path.label}</span>
                    )}
                    {skills.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 border border-[--ag-border] text-[--ag-muted]">
                        {s}
                      </span>
                    ))}
                    <span className="text-[10px] text-[--ag-muted] font-['JetBrains_Mono']">
                      {a.answerText.trim().split(/\s+/).length} words
                    </span>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-[--ag-muted] shrink-0 transition-transform",
                  isOpen && "rotate-180",
                )} />
              </button>

              {isOpen && (
                <p className="mt-2 text-xs text-[--ag-muted] leading-relaxed whitespace-pre-wrap border-l-2 border-[--ag-accent]/30 pl-3">
                  {a.answerText}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {answers.length > 3 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="text-xs font-bold text-[--ag-accent] hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${answers.length} answers`}
        </button>
      )}
    </div>
  );
}
