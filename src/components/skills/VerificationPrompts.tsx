// Turns AMSCE's "this isn't well corroborated" finding into something
// the user can act on.
//
// The previous panel listed skills under "Low Evidence, High Rating" and
// stopped there — a diagnosis with no treatment. Each skill now carries
// the single highest-leverage action, ranked by the confidence gain the
// engine projects for it, so the advice is specific rather than a
// general exhortation to do more.
//
// Tone matters here. The prompt is addressed to someone who has just
// been told their self-assessment outruns the evidence, which is easy to
// make feel accusatory. It isn't an accusation: in almost every case it
// means they haven't done the activity yet, not that they lied.

import { Link } from "react-router-dom";
import { ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { VerificationTrigger } from "@/lib/amsce/verificationTrigger";
import { TriggerLogRow } from "@/lib/amsce/triggerLog";
import { cn } from "@/lib/utils";

export function VerificationPrompts({
  triggers, log, onAct,
}: {
  triggers: VerificationTrigger[];
  log: Record<string, TriggerLogRow>;
  onAct: (skill: string, module: string) => void;
}) {
  if (triggers.length === 0) return null;

  const conflicts = triggers.filter(t => t.reason === "conflicting_evidence");
  const thin = triggers.filter(t => t.reason === "thin_evidence");

  return (
    <div className="space-y-4">
      {conflicts.length > 0 && (
        <div className="rounded-none bg-[--ag-surface] border border-[--ag-warning]/40 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-warning] mb-1 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Sources Disagree
          </p>
          <p className="text-[11px] text-[--ag-muted] mb-3">
            Different parts of your profile tell different stories about these skills.
            Worth a look — one of them is probably out of date.
          </p>
          <div className="space-y-3">
            {conflicts.map(t => (
              <TriggerRow key={t.skill} trigger={t} log={log[t.skill]} onAct={onAct} tone="warning" />
            ))}
          </div>
        </div>
      )}

      {thin.length > 0 && (
        <div className="rounded-none bg-[--ag-surface] border border-[--ag-danger]/30 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-danger] mb-1 flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5" /> Strengthen These Claims
          </p>
          <p className="text-[11px] text-[--ag-muted] mb-3">
            You rated these highly but there's little for an employer to go on yet.
            Here's the fastest way to fix that for each.
          </p>
          <div className="space-y-3">
            {thin.map(t => (
              <TriggerRow key={t.skill} trigger={t} log={log[t.skill]} onAct={onAct} tone="danger" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TriggerRow({
  trigger, log, onAct, tone,
}: {
  trigger: VerificationTrigger;
  log: TriggerLogRow | undefined;
  onAct: (skill: string, module: string) => void;
  tone: "warning" | "danger";
}) {
  const best = trigger.actions[0];
  const acted = Boolean(log?.actedAt);

  return (
    <div className="border-l-2 pl-3" style={{
      borderColor: tone === "warning" ? "var(--ag-warning)" : "var(--ag-danger)",
    }}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold text-[--ag-text]">{trigger.skill}</p>
        <span className="text-[10px] font-['JetBrains_Mono'] text-[--ag-muted] shrink-0">
          rated {trigger.selfRating}
        </span>
      </div>

      {!best ? (
        <p className="text-[11px] text-[--ag-muted] mt-1">
          Every evidence source is already covered — nothing further to add here.
        </p>
      ) : acted ? (
        <p className="text-[11px] text-[--ag-success] mt-1 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> You're on it — the score updates once the evidence lands.
        </p>
      ) : (
        <>
          <Link
            to={best.href}
            onClick={() => onAct(trigger.skill, best.module)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[--ag-accent] hover:underline"
          >
            {best.label} <ArrowRight className="h-3 w-3" />
          </Link>
          <p className="text-[11px] text-[--ag-muted]">{best.detail}</p>
          <p className={cn(
            "text-[10px] font-['JetBrains_Mono'] mt-0.5",
            best.projectedGain >= 0.15 ? "text-[--ag-success]" : "text-[--ag-muted]",
          )}>
            projected +{Math.round(best.projectedGain * 100)}% confidence
          </p>
        </>
      )}
    </div>
  );
}
