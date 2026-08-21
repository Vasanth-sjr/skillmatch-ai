// The employer's view of a candidate's corroborated skills.
//
// The copy here is doing fairness work, not just decoration. AMSCE's
// confidence score measures how much evidence this platform has
// gathered, which is NOT the same as how truthful the candidate is — but
// a recruiter skimming a list will conflate the two unless the interface
// stops them. So this component leads with the evidence that exists
// ("verified certificate", "demonstrated in interview") and describes
// sparse evidence as sparse evidence, never as doubt about the person.
//
// Concretely: a skill with little backing reads "1 of 4 sources", not
// "Low confidence". The distinction matters because most gaps are
// candidates who simply haven't taken a mock interview yet.

import { useState } from "react";
import { ShieldCheck, ChevronDown, Award, Info, Clock } from "lucide-react";
import { CandidateSkillEvidence, CandidateCertificate } from "@/lib/amsce/candidateEvidence";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { oldestAssessment } from "@/lib/amsce/confidenceStaleness";
import { cn } from "@/lib/utils";

const TRUST_PRESENTATION: Record<CandidateCertificate["trustLevel"], { label: string; classes: string }> = {
  verified: {
    label: "Issuer verified",
    classes: "bg-[--ag-success]/10 border-[--ag-success]/40 text-[--ag-success]",
  },
  corroborated: {
    label: "Document checked",
    classes: "bg-[--ag-accent]/10 border-[--ag-accent]/40 text-[--ag-accent]",
  },
  self_reported: {
    label: "Self-reported",
    classes: "bg-[--ag-border]/40 border-[--ag-border] text-[--ag-muted]",
  },
  disputed: {
    label: "Could not confirm",
    classes: "bg-[--ag-danger]/10 border-[--ag-danger]/40 text-[--ag-danger]",
  },
};

function EvidenceBar({ withEvidence, total }: { withEvidence: number; total: number }) {
  return (
    <span className="inline-flex items-center gap-1" title={`${withEvidence} of ${total} evidence sources`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "block w-1.5 h-3",
            i < withEvidence ? "bg-[--ag-accent]" : "bg-[--ag-border]",
          )}
        />
      ))}
      <span className="text-[11px] font-['JetBrains_Mono'] text-[--ag-muted] ml-1">
        {withEvidence}/{total}
      </span>
    </span>
  );
}

function SkillRow({ evidence }: { evidence: CandidateSkillEvidence }) {
  const [open, setOpen] = useState(false);
  const hasSupport = evidence.supportingEvidence.length > 0;

  return (
    <div className="py-2.5 border-b border-[--ag-border] last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[--ag-text] font-medium truncate">{evidence.skill}</p>
          <div className="flex items-center gap-2 mt-1">
            <EvidenceBar withEvidence={evidence.sourcesWithEvidence} total={evidence.totalSources} />
            <span className="text-[11px] text-[--ag-muted]">
              {evidence.sourcesWithEvidence === 0
                ? "no independent evidence yet"
                : `${evidence.sourcesWithEvidence === 1 ? "source" : "sources"} corroborating`}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className={cn(
            "text-lg font-['JetBrains_Mono'] font-extrabold leading-none",
            evidence.skillScore >= 4 ? "text-[--ag-success]" :
            evidence.skillScore >= 3 ? "text-[--ag-accent]" :
            evidence.skillScore >= 2 ? "text-[--ag-warning]" : "text-[--ag-muted]",
          )}>
            {evidence.skillScore.toFixed(1)}
          </div>
          {evidence.selfRating !== null && (
            <div className="text-[10px] text-[--ag-muted] mt-0.5">
              self-rated {evidence.selfRating}
            </div>
          )}
        </div>

        {hasSupport && (
          <button
            onClick={() => setOpen(o => !o)}
            className="text-[--ag-muted] hover:text-[--ag-accent] transition-colors shrink-0"
            aria-label="Show supporting evidence"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>

      {open && hasSupport && (
        <ul className="mt-2 space-y-1 border-l-2 border-[--ag-accent]/30 pl-3">
          {evidence.supportingEvidence.map((line, i) => (
            <li key={i} className="text-[11px] text-[--ag-muted]">{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VerifiedEvidence({
  skills, certificates,
}: {
  skills: CandidateSkillEvidence[];
  certificates: CandidateCertificate[];
}) {
  const [showAll, setShowAll] = useState(false);

  if (skills.length === 0 && certificates.length === 0) return null;

  // Lead with what's actually corroborated — that's what a recruiter is
  // scanning for. Unevidenced skills stay available but don't crowd it out.
  const corroborated = skills.filter(s => s.sourcesWithEvidence > 0);
  const unevidenced = skills.filter(s => s.sourcesWithEvidence === 0);
  const visible = showAll ? [...corroborated, ...unevidenced] : corroborated.slice(0, 8);

  const pathLabel = (key: string) =>
    CAREER_PATHS[key as CareerPathKey]?.label ?? key;

  // Scores are cached and only recomputed when the candidate revisits, so
  // an employer can be reading a months-old assessment. Disclose the age
  // rather than silently adjusting the number — the evidence timestamps
  // have already been discounted once, and discounting again by elapsed
  // time would double-count the same ageing.
  const staleness = oldestAssessment(skills.map(s => s.lastComputedAt));

  return (
    <div className="bg-[--ag-surface] border border-[--ag-border] p-5 space-y-4">
      <div>
        <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[--ag-accent]" /> Evidence Summary
        </h2>
        <p className="text-[11px] text-[--ag-muted] mt-1 flex items-start gap-1.5">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          Shows what this platform could independently corroborate. Sparse evidence
          usually means a candidate hasn't completed those activities yet — it isn't
          a judgement about them.
        </p>
      </div>

      {skills.length > 0 && staleness.level !== "fresh" && (
        <p className={cn(
          "text-[11px] flex items-start gap-1.5 px-2 py-1.5 border",
          staleness.level === "stale"
            ? "bg-[--ag-warning]/10 border-[--ag-warning]/30 text-[--ag-warning]"
            : "bg-[--ag-border]/30 border-[--ag-border] text-[--ag-muted]",
        )}>
          <Clock className="h-3 w-3 mt-0.5 shrink-0" />
          Last assessed {staleness.label}. Skills and evidence may have moved on since.
        </p>
      )}

      {certificates.length > 0 && (
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-muted] mb-2 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" /> Certifications
          </p>
          <div className="space-y-1.5">
            {certificates.map((c, i) => {
              const p = TRUST_PRESENTATION[c.trustLevel];
              return (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-[--ag-text] truncate">{c.name}</p>
                    {c.issuer && <p className="text-[10px] text-[--ag-muted]">{c.issuer}</p>}
                  </div>
                  <span className={cn(
                    "text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 border shrink-0",
                    p.classes,
                  )}>
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {visible.length > 0 && (
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-muted] mb-1">
            Assessed Skills
            {skills[0] && (
              <span className="font-normal normal-case tracking-normal ml-1">
                · {pathLabel(skills[0].careerPath)}
              </span>
            )}
          </p>
          <div>
            {visible.map(s => <SkillRow key={`${s.careerPath}-${s.skill}`} evidence={s} />)}
          </div>
        </div>
      )}

      {corroborated.length === 0 && unevidenced.length > 0 && !showAll && (
        <p className="text-xs text-[--ag-muted]">
          This candidate has self-assessed {unevidenced.length} skills, but hasn't yet
          completed activities the platform can corroborate against.
        </p>
      )}

      {(corroborated.length > 8 || unevidenced.length > 0) && (
        <button
          onClick={() => setShowAll(a => !a)}
          className="text-xs font-bold text-[--ag-accent] hover:underline"
        >
          {showAll
            ? "Show less"
            : `Show all ${skills.length} assessed skills`}
        </button>
      )}
    </div>
  );
}
