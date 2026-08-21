// Reports whether AMSCE's confidence scores actually track hiring
// outcomes for this employer.
//
// The panel is as much a disclosure as a metric. It states plainly that
// weights are never adjusted automatically, and it refuses to draw a
// conclusion from a small sample rather than showing a number that
// invites over-reading. "Not enough decisions yet" is the honest answer
// for most employers most of the time, and presenting it as an answer —
// rather than as an empty state to be filled — is the point.

import { useEffect, useState } from "react";
import { BarChart3, Info, Loader2 } from "lucide-react";
import { buildCalibrationReport, CalibrationReport } from "@/lib/amsce/outcomeFeedback";
import { cn } from "@/lib/utils";

export function CalibrationPanel({ employerId }: { employerId: string | undefined }) {
  const [report, setReport] = useState<CalibrationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employerId) return;
    setLoading(true);
    buildCalibrationReport(employerId)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [employerId]);

  if (loading) {
    return (
      <div className="bg-[--ag-surface] border border-[--ag-border] p-5 flex items-center gap-2 text-[--ag-muted]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking score calibration…</span>
      </div>
    );
  }

  if (!report) return null;

  const pct = (v: number | null) => v === null ? "—" : `${Math.round(v * 100)}%`;

  return (
    <div className="bg-[--ag-surface] border border-[--ag-border] p-5 space-y-3">
      <div>
        <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[--ag-accent]" /> Score Calibration
        </h2>
        <p className="text-[11px] text-[--ag-muted] mt-1">
          Whether higher AMSCE confidence has gone with better outcomes in your own hiring.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Decisions" value={String(report.sampleSize)} />
        <Stat label="Avg · hired" value={pct(report.meanConfidenceHired)} />
        <Stat label="Avg · rejected" value={pct(report.meanConfidenceRejected)} />
      </div>

      {report.interpretable && report.separation !== null && (
        <p className={cn(
          "text-xs font-bold",
          report.separation > 0 ? "text-[--ag-success]" : "text-[--ag-warning]",
        )}>
          {report.separation > 0
            ? `Candidates you hired scored ${Math.round(report.separation * 100)} points higher on average.`
            : `Confidence did not separate your hires from your rejections here.`}
        </p>
      )}

      <p className="text-[11px] text-[--ag-muted]">{report.note}</p>

      <div className="flex items-start gap-1.5 pt-2 border-t border-[--ag-border]">
        <Info className="h-3 w-3 mt-0.5 shrink-0 text-[--ag-muted]" />
        <p className="text-[11px] text-[--ag-muted]">
          Module weights are <span className="font-bold text-[--ag-text]">never tuned automatically</span> from
          these outcomes. Hiring data encodes whatever preferences a process already
          had, and optimising a score to predict past decisions would reproduce them
          behind a number that looks objective. Changes stay a deliberate human call.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[--ag-bg] border border-[--ag-border] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[--ag-muted]">{label}</p>
      <p className="text-lg font-['JetBrains_Mono'] font-extrabold text-[--ag-text] leading-tight">{value}</p>
    </div>
  );
}
