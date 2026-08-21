// Renders the outcome of a certificate verification.
//
// The five states are deliberately distinct. "Couldn't check" and
// "Unconfirmed" are NOT softened versions of "Invalid" — they mean we
// genuinely don't know, and the UI says so rather than implying doubt
// about the credential. Only "Invalid" asserts the issuer denied it.

import { BadgeCheck, ShieldX, ShieldQuestion, ShieldAlert, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { VerificationStatus } from "@/lib/certificates/verifyCertificate";
import { cn } from "@/lib/utils";

export type BadgeState = VerificationStatus | "checking" | "unchecked";

const PRESENTATION: Record<string, { label: string; icon: React.ElementType; classes: string }> = {
  verified: {
    label: "Verified",
    icon: BadgeCheck,
    classes: "bg-[--ag-success]/10 border-[--ag-success]/40 text-[--ag-success]",
  },
  invalid: {
    label: "Invalid",
    icon: ShieldX,
    classes: "bg-[--ag-danger]/10 border-[--ag-danger]/40 text-[--ag-danger]",
  },
  inconclusive: {
    label: "Unconfirmed",
    icon: ShieldQuestion,
    classes: "bg-[--ag-warning]/10 border-[--ag-warning]/40 text-[--ag-warning]",
  },
  unreachable: {
    label: "Couldn't check",
    icon: ShieldAlert,
    classes: "bg-[--ag-border]/40 border-[--ag-border] text-[--ag-muted]",
  },
  unsupported: {
    label: "Manual check only",
    icon: ShieldQuestion,
    classes: "bg-[--ag-border]/40 border-[--ag-border] text-[--ag-muted]",
  },
  unchecked: {
    label: "Not checked",
    icon: ShieldQuestion,
    classes: "bg-[--ag-border]/40 border-[--ag-border] text-[--ag-muted]",
  },
};

export function CertificateVerificationBadge({
  state, message, manualUrl, issuerLabel, onRecheck,
}: {
  state: BadgeState;
  message?: string;
  manualUrl: string | null;
  issuerLabel: string;
  onRecheck?: () => void;
}) {
  if (state === "checking") {
    return (
      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[--ag-muted]">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking with {issuerLabel}…</span>
      </div>
    );
  }

  const p = PRESENTATION[state] ?? PRESENTATION.unchecked;
  const Icon = p.icon;

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border",
          p.classes,
        )}>
          <Icon className="h-3 w-3" /> {p.label}
        </span>

        {manualUrl && (
          <a
            href={manualUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-[--ag-accent] hover:underline"
          >
            Check for yourself <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}

        {onRecheck && state !== "unsupported" && (
          <button
            onClick={onRecheck}
            className="inline-flex items-center gap-1 text-xs text-[--ag-muted] hover:text-[--ag-accent] transition-colors"
          >
            <RefreshCw className="h-2.5 w-2.5" /> Re-check
          </button>
        )}
      </div>

      {message && <p className="text-[11px] text-[--ag-muted]">{message}</p>}
    </div>
  );
}
