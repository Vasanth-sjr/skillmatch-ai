// Upload control for a certificate document, with the analysis result
// shown inline.
//
// The copy here is deliberately careful. Uploading a file must never read
// as "now it's verified" — it reads as "we checked the document against
// what you entered". Overstating this would be the single easiest way to
// make the whole feature dishonest.

import { useRef, useState } from "react";
import { Upload, FileText, Loader2, X, Eye } from "lucide-react";
import { DocumentAnalysis, DocumentConsistency } from "@/lib/certificates/certificateDocument";
import { cn } from "@/lib/utils";

const CONSISTENCY_PRESENTATION: Record<DocumentConsistency, { label: string; classes: string }> = {
  strong: {
    label: "Document matches",
    classes: "bg-[--ag-success]/10 border-[--ag-success]/40 text-[--ag-success]",
  },
  partial: {
    label: "Partly matches",
    classes: "bg-[--ag-warning]/10 border-[--ag-warning]/40 text-[--ag-warning]",
  },
  weak: {
    label: "Doesn't match",
    classes: "bg-[--ag-danger]/10 border-[--ag-danger]/40 text-[--ag-danger]",
  },
  unreadable: {
    label: "Couldn't read file",
    classes: "bg-[--ag-border]/40 border-[--ag-border] text-[--ag-muted]",
  },
};

export function CertificateUpload({
  fileName, analysis, busy, onSelect, onRemove, onView,
}: {
  fileName: string | null;
  analysis: DocumentAnalysis | null;
  busy: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
  onView?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onSelect(file);
  };

  if (busy) {
    return (
      <div className="flex items-center gap-2 p-3 border border-[--ag-border] bg-[--ag-surface] text-xs text-[--ag-muted]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Reading the certificate…
      </div>
    );
  }

  if (fileName) {
    const p = analysis ? CONSISTENCY_PRESENTATION[analysis.consistency] : null;
    return (
      <div className="border border-[--ag-border] bg-[--ag-surface] p-3 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[--ag-accent] shrink-0" />
          <span className="text-xs text-[--ag-text] font-medium truncate flex-1">{fileName}</span>
          {onView && (
            <button onClick={onView} title="View certificate"
              className="text-[--ag-muted] hover:text-[--ag-accent] transition-colors">
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onRemove} title="Remove certificate"
            className="text-[--ag-muted] hover:text-[--ag-danger] transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {p && (
          <span className={cn(
            "inline-block px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border",
            p.classes,
          )}>
            {p.label}
          </span>
        )}

        {analysis && analysis.notes.length > 0 && (
          <ul className="space-y-0.5 border-l-2 border-[--ag-border] pl-2">
            {analysis.notes.map((n, i) => (
              <li key={i} className="text-[11px] text-[--ag-muted]">{n}</li>
            ))}
          </ul>
        )}

        {analysis?.consistency === "strong" && (
          <p className="text-[11px] text-[--ag-muted] italic">
            This checks the document against what you entered — it isn't confirmation from the issuer.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border border-dashed p-4 text-center cursor-pointer transition-colors",
        dragging
          ? "border-[--ag-accent] bg-[--ag-accent]/5"
          : "border-[--ag-border] hover:border-[--ag-accent]/50 bg-[--ag-surface]",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <Upload className="h-4 w-4 text-[--ag-muted] mx-auto mb-1.5" />
      <p className="text-xs text-[--ag-text] font-medium">Upload the certificate</p>
      <p className="text-[11px] text-[--ag-muted] mt-0.5">
        PDF preferred — we'll read the credential ID off it automatically
      </p>
    </div>
  );
}
