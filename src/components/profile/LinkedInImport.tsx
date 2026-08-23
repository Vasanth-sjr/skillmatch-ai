// LinkedIn import: upload → review → apply.
//
// The review step is not optional politeness. An import that silently
// replaced a curated profile would destroy work the user can't get back,
// and would move AMSCE confidence scores with no visible cause — the
// Resume Context Analyzer reads exactly the experience and project text
// this would overwrite. So nothing is written until the user has seen
// what changes and agreed to it.
//
// Items that already exist are shown but unticked by default, so the
// safe path is also the default path.

import { useState, useRef } from "react";
import {
  Linkedin, Upload, Loader2, ChevronDown, AlertCircle, Info, Check, X,
} from "lucide-react";
import { parseLinkedInArchive, LinkedInImport as ParsedImport, MAX_ARCHIVE_BYTES } from "@/lib/linkedin/linkedinImport";
import { buildMergePlan, MergePlan, MergeItem, countSelected } from "@/lib/linkedin/mergePlan";
import { CERT_ISSUER_LABELS } from "@/data/certificateIssuers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LinkedInImportPanel({
  currentProfile, onApply, applying,
}: {
  currentProfile: any;
  onApply: (plan: MergePlan) => Promise<void>;
  applying: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [plan, setPlan] = useState<MergePlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > MAX_ARCHIVE_BYTES) {
      setError(`That archive is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 25 MB.`);
      return;
    }

    setParsing(true);
    try {
      const result = parseLinkedInArchive(await file.arrayBuffer());
      setParsed(result);
      setPlan(buildMergePlan(result, currentProfile ?? {}, CERT_ISSUER_LABELS));
    } catch (err: any) {
      setError(err?.message ?? "Couldn't read that archive.");
      setParsed(null);
      setPlan(null);
    } finally {
      setParsing(false);
    }
  };

  const toggle = (section: keyof MergePlan, index: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      const list = [...(next[section] as any[])];
      list[index] = { ...list[index], selected: !list[index].selected };
      (next as any)[section] = list;
      return next;
    });
  };

  const reset = () => { setParsed(null); setPlan(null); setError(null); };

  return (
    <div className="bg-[--ag-surface] border border-[--ag-border]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-4 text-left"
      >
        <Linkedin className="h-4 w-4 text-[#0A66C2]" />
        <span className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide flex-1">
          Import from LinkedIn
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[--ag-muted] transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-[--ag-border] pt-3">
          {!plan && (
            <>
              <div className="text-[11px] text-[--ag-muted] space-y-1.5">
                <p className="flex items-start gap-1.5">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  LinkedIn doesn't let apps read your profile directly, so this uses
                  the archive <em>you</em> download from them.
                </p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1">
                  <li>
                    On LinkedIn: <span className="font-bold text-[--ag-text]">Settings → Data Privacy → Get a copy of your data</span>
                  </li>
                  <li>Pick <span className="font-bold text-[--ag-text]">"Want something in particular?"</span> and tick Positions, Education, Skills, Certifications, Projects</li>
                  <li>They email you a .zip — upload it below, still zipped</li>
                </ol>
              </div>

              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                className="border border-dashed border-[--ag-border] hover:border-[#0A66C2]/50 p-5 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {parsing ? (
                  <div className="flex items-center justify-center gap-2 text-[--ag-muted] text-xs">
                    <Loader2 className="h-4 w-4 animate-spin" /> Reading your archive…
                  </div>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-[--ag-muted] mx-auto mb-1.5" />
                    <p className="text-xs text-[--ag-text] font-medium">Upload your LinkedIn archive</p>
                    <p className="text-[11px] text-[--ag-muted] mt-0.5">The .zip file, exactly as LinkedIn sent it</p>
                  </>
                )}
              </div>
            </>
          )}

          {error && (
            <p className="text-[11px] text-[--ag-danger] flex items-start gap-1.5">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" /> {error}
            </p>
          )}

          {parsed?.warnings.map((w, i) => (
            <p key={i} className="text-[11px] text-[--ag-warning] flex items-start gap-1.5">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" /> {w}
            </p>
          ))}

          {plan && (
            <div className="space-y-3">
              <p className="text-[11px] text-[--ag-muted] flex items-start gap-1.5 border border-[--ag-border] bg-[--ag-bg] p-2">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Nothing is saved until you apply. Items already on your profile are
                unticked — your existing entries won't be overwritten.
              </p>

              {plan.fillable.length > 0 && (
                <Section title="Profile details">
                  {plan.fillable.map((f, i) => (
                    <Row
                      key={f.key}
                      label={f.label}
                      sublabel={f.value}
                      selected={f.selected}
                      duplicate={false}
                      onToggle={() => toggle("fillable" as any, i)}
                    />
                  ))}
                </Section>
              )}

              <PlanSection title="Certifications" items={plan.certificates} onToggle={i => toggle("certificates", i)}
                note="Imported as self-reported — we'll verify each one with the issuer after saving." />
              <PlanSection title="Experience" items={plan.experience} onToggle={i => toggle("experience", i)} />
              <PlanSection title="Education" items={plan.education} onToggle={i => toggle("education", i)} />
              <PlanSection title="Projects" items={plan.projects} onToggle={i => toggle("projects", i)} />
              <PlanSection title="Skills" items={plan.skills} onToggle={i => toggle("skills", i)} compact />

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => onApply(plan)}
                  disabled={applying || countSelected(plan) === 0}
                  className="rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest text-xs"
                >
                  {applying
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Importing…</>
                    : <><Check className="h-3.5 w-3.5 mr-1" /> Import {countSelected(plan)} items</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={reset} className="rounded-none text-[--ag-muted]">
                  Start over
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlanSection({ title, items, onToggle, note, compact }: {
  title: string;
  items: MergeItem<any>[];
  onToggle: (index: number) => void;
  note?: string;
  compact?: boolean;
}) {
  if (items.length === 0) return null;
  const selected = items.filter(i => i.selected).length;

  return (
    <Section title={`${title} (${selected}/${items.length})`} note={note}>
      <div className={cn(compact && "flex flex-wrap gap-1.5")}>
        {items.map((item, i) =>
          compact ? (
            <button
              key={i}
              onClick={() => onToggle(i)}
              className={cn(
                "text-[11px] px-2 py-0.5 border transition-colors",
                item.selected
                  ? "bg-[--ag-accent]/10 border-[--ag-accent]/40 text-[--ag-accent]"
                  : "bg-[--ag-bg] border-[--ag-border] text-[--ag-muted] line-through",
              )}
              title={item.duplicate ? "Already on your profile" : undefined}
            >
              {item.label}
            </button>
          ) : (
            <Row
              key={i}
              label={item.label}
              sublabel={item.sublabel}
              selected={item.selected}
              duplicate={item.duplicate}
              onToggle={() => onToggle(i)}
            />
          ),
        )}
      </div>
    </Section>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[--ag-muted] mb-1">{title}</p>
      {note && <p className="text-[11px] text-[--ag-muted] mb-1.5">{note}</p>}
      {children}
    </div>
  );
}

function Row({ label, sublabel, selected, duplicate, onToggle }: {
  label: string; sublabel: string; selected: boolean; duplicate: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-start gap-2 py-1.5 text-left border-b border-[--ag-border] last:border-0"
    >
      <span className={cn(
        "w-4 h-4 border flex items-center justify-center shrink-0 mt-0.5",
        selected ? "bg-[--ag-accent] border-[--ag-accent]" : "border-[--ag-border]",
      )}>
        {selected ? <Check className="h-3 w-3 text-white" /> : <X className="h-2.5 w-2.5 text-[--ag-muted]" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-xs truncate", selected ? "text-[--ag-text]" : "text-[--ag-muted]")}>
          {label}
        </span>
        {sublabel && <span className="block text-[11px] text-[--ag-muted] truncate">{sublabel}</span>}
      </span>
      {duplicate && (
        <span className="text-[10px] text-[--ag-muted] border border-[--ag-border] px-1 py-0.5 shrink-0">
          already added
        </span>
      )}
    </button>
  );
}
