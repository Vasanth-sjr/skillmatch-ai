// Opt-in control for showing interview answers to employers.
//
// Placed on the Mock Interviews page rather than buried in Settings,
// because consent asked in context is meaningfully more informed than a
// checkbox someone ticks months earlier next to unrelated preferences.
// The person deciding is looking at the answers the decision covers.
//
// Default is OFF and stays OFF until deliberately changed. Nobody should
// discover after the fact that what they wrote as practice was shown to
// a recruiter — so the copy states plainly who can see it and what the
// limits are, rather than nudging toward yes.

import { useState } from "react";
import { Eye, EyeOff, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnswerSharingConsent({
  enabled, onChange,
}: {
  enabled: boolean;
  onChange: (next: boolean) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    try {
      await onChange(!enabled);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn(
      "border p-4",
      enabled
        ? "bg-[--ag-accent]/5 border-[--ag-accent]/30"
        : "bg-[--ag-surface] border-[--ag-border]",
    )}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {enabled
            ? <Eye className="h-4 w-4 text-[--ag-accent]" />
            : <EyeOff className="h-4 w-4 text-[--ag-muted]" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[--ag-text]">
            {enabled ? "Employers can read your answers" : "Your answers are private"}
          </p>
          <p className="text-[11px] text-[--ag-muted] mt-1">
            {enabled
              ? "Employers you've applied to can read what you wrote. No one else can — not other employers, not other candidates."
              : "Only you can see what you wrote. Employers see the skill score derived from it, never the text."}
          </p>

          <p className="text-[11px] text-[--ag-muted] mt-2 flex items-start gap-1.5">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            Your written reasoning is the strongest evidence you have — a recruiter
            can judge it directly instead of trusting a number. Sharing is entirely
            your choice, and you can switch it off again at any time.
          </p>
        </div>

        <button
          onClick={toggle}
          disabled={saving}
          className={cn(
            "shrink-0 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all",
            saving && "opacity-50 cursor-wait",
            enabled
              ? "bg-[--ag-surface] border-[--ag-border] text-[--ag-muted] hover:border-[--ag-danger]/40 hover:text-[--ag-danger]"
              : "bg-[--ag-accent] border-[--ag-accent] text-white",
          )}
        >
          {saving
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : enabled ? "Stop sharing" : "Share answers"}
        </button>
      </div>
    </div>
  );
}
