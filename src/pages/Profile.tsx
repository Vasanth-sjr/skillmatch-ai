import { useState, useEffect, useRef } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { SKILL_POOLS } from "@/data/skillPools";
import { CERT_ISSUER_LABELS, getIssuer } from "@/data/certificateIssuers";
import { checkCredentialFormat, manualVerifyUrl } from "@/lib/certificates/certificateValidator";
import {
  loadCachedVerifications, verifyCertificate, cacheKey,
  VerificationResult,
} from "@/lib/certificates/verifyCertificate";
import { CertificateVerificationBadge, BadgeState } from "@/components/profile/CertificateVerificationBadge";
import { CertificateUpload } from "@/components/profile/CertificateUpload";
import {
  extractPdfText, analyzeCertificateDocument, validateCertificateFile,
  DocumentAnalysis,
} from "@/lib/certificates/certificateDocument";
import {
  uploadCertificateFile, saveDocumentAnalysis, loadDocumentAnalyses,
  deleteCertificateFile, removeDocumentAnalysis, getCertificateSignedUrl,
  downloadCertificateFile, StoredCertificateDocument,
} from "@/lib/certificates/certificateStorage";
import { assessCredentialTrust } from "@/lib/certificates/credentialTrust";
import {
  User, MapPin, Briefcase, GraduationCap, Link2,
  Award, Edit3, Check, X, Plus, Trash2,
  Linkedin, Github, Globe, ChevronDown,
  FolderOpen, BadgeCheck, ExternalLink, AlertCircle, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExpEntry {
  id: string;
  title: string;
  company: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
  description: string;
}

interface EduEntry {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startYear: string;
  endYear: string;
}

interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  techStack: string;
  url: string;
  githubUrl: string;
}

interface CertEntry {
  id: string;
  name: string;
  issuer: string;
  credentialId: string;
  issueDate: string;
  expiryDate: string;
  /** Storage path of the uploaded certificate document, if any. */
  filePath?: string;
  fileName?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CUR_YEAR = new Date().getFullYear();
const YEARS_PAST = Array.from({ length: 30 }, (_, i) => String(CUR_YEAR - i));
const GRAD_YEARS = [
  ...Array.from({ length: 4 }, (_, i) => String(CUR_YEAR + 1 + i)),
  ...YEARS_PAST,
];
const DEGREES = [
  "B.Tech / B.E.", "B.Sc", "B.Com", "B.A.", "BCA", "BBA",
  "M.Tech / M.E.", "M.Sc", "M.Com", "MBA", "MCA",
  "Ph.D", "Diploma", "12th / HSC", "10th / SSLC", "Other",
];

// Issuer list and per-issuer verification behaviour now live in the shared
// registry at src/data/certificateIssuers.ts, which the server-side
// verifier reads from too.
const CERT_ISSUERS = CERT_ISSUER_LABELS;

function genId() { return Math.random().toString(36).slice(2, 9); }

function normalizeExp(raw: any[]): ExpEntry[] {
  return (raw ?? []).map((e: any, i: number) => ({
    id: e.id ?? String(i),
    title: e.title ?? "",
    company: e.company ?? "",
    startMonth: e.startMonth ?? "",
    startYear: e.startYear ?? "",
    endMonth: e.endMonth ?? "",
    endYear: e.endYear ?? "",
    current: e.current ?? false,
    description: e.description ?? (typeof e.duration === "string" ? e.duration : ""),
  }));
}

function normalizeEdu(raw: any[]): EduEntry[] {
  return (raw ?? []).map((e: any, i: number) => ({
    id: e.id ?? String(i),
    degree: e.degree ?? "",
    fieldOfStudy: e.fieldOfStudy ?? "",
    institution: e.institution ?? "",
    startYear: e.startYear ?? "",
    endYear: e.endYear ?? e.year ?? "",
  }));
}

function normalizeProj(raw: any[]): ProjectEntry[] {
  return (raw ?? []).map((p: any, i: number) => ({
    id: p.id ?? String(i),
    title: p.title ?? "",
    description: p.description ?? "",
    techStack: Array.isArray(p.techStack) ? p.techStack.join(", ") : (p.techStack ?? ""),
    url: p.url ?? "",
    githubUrl: p.githubUrl ?? "",
  }));
}

/** Re-hydrates a persisted document check into the shape the form renders,
 *  so re-opening a saved certificate shows what we found last time rather
 *  than a blank slate. */
function storedAsAnalysis(stored: StoredCertificateDocument | undefined): DocumentAnalysis | null {
  if (!stored) return null;
  return {
    readable: stored.consistency !== "unreadable",
    foundIssuerUrl: Boolean(stored.extractedId),
    extractedCredentialId: stored.extractedId,
    matchesEnteredId: null,
    holderNameMatches: stored.nameMatched,
    expectedTermsFound: [],
    consistency: stored.consistency,
    notes: stored.notes,
  };
}

function normalizeCert(raw: any[]): CertEntry[] {
  return (raw ?? []).map((c: any, i: number) => ({
    id: c.id ?? String(i),
    name: c.name ?? "",
    issuer: c.issuer ?? "",
    credentialId: c.credentialId ?? "",
    issueDate: c.issueDate ?? "",
    expiryDate: c.expiryDate ?? "",
    filePath: c.filePath ?? undefined,
    fileName: c.fileName ?? undefined,
  }));
}

function expDuration(e: ExpEntry) {
  const start = [e.startMonth, e.startYear].filter(Boolean).join(" ");
  const end = e.current ? "Present" : [e.endMonth, e.endYear].filter(Boolean).join(" ");
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" – ");
}

function calcCompletion(p: {
  full_name?: string | null; headline?: string | null; bio?: string | null;
  career_goal?: string | null; skills?: string[]; experience?: any[];
  education?: any[]; linkedin_url?: string | null; github_url?: string | null;
  portfolio_url?: string | null; projects?: any[]; certifications?: any[];
}) {
  const items: [boolean, string][] = [
    [!!p.full_name, "Name"],
    [!!p.headline, "Headline"],
    [!!p.bio, "About"],
    [!!p.career_goal, "Career Goal"],
    [(p.skills?.length ?? 0) >= 3, "3+ Skills"],
    [(p.experience?.length ?? 0) >= 1, "Experience"],
    [(p.education?.length ?? 0) >= 1, "Education"],
    [(p.projects?.length ?? 0) >= 1, "Projects"],
    [(p.certifications?.length ?? 0) >= 1, "Certifications"],
    [!!(p.linkedin_url || p.github_url || p.portfolio_url), "Social Link"],
  ];
  const done = items.filter(([v]) => v).length;
  return { score: Math.round((done / items.length) * 100), missing: items.filter(([v]) => !v).map(([, l]) => l) };
}

// ─── Reusable select ─────────────────────────────────────────────────────────

function Sel({ value, onChange, options, placeholder, className }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-10 rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 pr-8 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] appearance-none">
        <option value="">{placeholder ?? "Select…"}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[--ag-muted] pointer-events-none" />
    </div>
  );
}

// ─── Experience form ──────────────────────────────────────────────────────────

function ExpForm({ draft, onChange, saving, onSave, onDelete, onCancel }: {
  draft: ExpEntry; onChange: (d: ExpEntry) => void; saving: boolean;
  onSave: () => void; onDelete: (() => void) | null; onCancel: () => void;
}) {
  const upd = (k: keyof ExpEntry, v: string | boolean) => onChange({ ...draft, [k]: v });
  return (
    <div className="border border-[--ag-accent]/40 bg-[--ag-bg] p-4 space-y-3 mt-2">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Job Title *</Label>
          <Input value={draft.title} onChange={e => upd("title", e.target.value)} placeholder="e.g. Frontend Intern"
            className="rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent] text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Company *</Label>
          <Input value={draft.company} onChange={e => upd("company", e.target.value)} placeholder="e.g. Infosys"
            className="rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent] text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Start Date</Label>
          <div className="flex gap-2">
            <Sel value={draft.startMonth} onChange={v => upd("startMonth", v)} options={MONTHS} placeholder="Month" className="flex-1" />
            <Sel value={draft.startYear} onChange={v => upd("startYear", v)} options={YEARS_PAST} placeholder="Year" className="flex-1" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">End Date</Label>
          {draft.current ? (
            <div className="h-10 flex items-center"><span className="text-sm font-bold text-[--ag-accent]">Present</span></div>
          ) : (
            <div className="flex gap-2">
              <Sel value={draft.endMonth} onChange={v => upd("endMonth", v)} options={MONTHS} placeholder="Month" className="flex-1" />
              <Sel value={draft.endYear} onChange={v => upd("endYear", v)} options={YEARS_PAST} placeholder="Year" className="flex-1" />
            </div>
          )}
          <label className="flex items-center gap-2 text-xs text-[--ag-muted] cursor-pointer select-none mt-1">
            <input type="checkbox" checked={draft.current} onChange={e => upd("current", e.target.checked)} className="accent-[--ag-accent]" />
            Currently working here
          </label>
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Description</Label>
          <textarea rows={2} value={draft.description} onChange={e => upd("description", e.target.value)}
            placeholder="Key responsibilities or achievements…"
            className="w-full rounded-none border border-[--ag-border] bg-[--ag-surface] px-3 py-2 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] resize-none" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={saving || !draft.title.trim() || !draft.company.trim()}
            className="rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest text-xs">
            {saving ? "Saving…" : <><Check className="h-3.5 w-3.5 mr-1" />Save</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="rounded-none text-[--ag-muted]">Cancel</Button>
        </div>
        {onDelete && (
          <button onClick={onDelete} className="flex items-center gap-1 text-xs text-[--ag-muted] hover:text-[--ag-danger] transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Education form ───────────────────────────────────────────────────────────

function EduForm({ draft, onChange, saving, onSave, onDelete, onCancel }: {
  draft: EduEntry; onChange: (d: EduEntry) => void; saving: boolean;
  onSave: () => void; onDelete: (() => void) | null; onCancel: () => void;
}) {
  const upd = (k: keyof EduEntry, v: string) => onChange({ ...draft, [k]: v });
  return (
    <div className="border border-[--ag-accent]/40 bg-[--ag-bg] p-4 space-y-3 mt-2">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Degree *</Label>
          <Sel value={draft.degree} onChange={v => upd("degree", v)} options={DEGREES} placeholder="Select degree" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Field of Study</Label>
          <Input value={draft.fieldOfStudy} onChange={e => upd("fieldOfStudy", e.target.value)} placeholder="e.g. Computer Science"
            className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent] text-sm" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Institution *</Label>
          <Input value={draft.institution} onChange={e => upd("institution", e.target.value)} placeholder="e.g. Anna University, Chennai"
            className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent] text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Start Year</Label>
          <Sel value={draft.startYear} onChange={v => upd("startYear", v)} options={GRAD_YEARS} placeholder="Year" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">End / Expected Year</Label>
          <Sel value={draft.endYear} onChange={v => upd("endYear", v)} options={GRAD_YEARS} placeholder="Year" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={saving || !draft.degree.trim() || !draft.institution.trim()}
            className="rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest text-xs">
            {saving ? "Saving…" : <><Check className="h-3.5 w-3.5 mr-1" />Save</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="rounded-none text-[--ag-muted]">Cancel</Button>
        </div>
        {onDelete && (
          <button onClick={onDelete} className="flex items-center gap-1 text-xs text-[--ag-muted] hover:text-[--ag-danger] transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Project form ─────────────────────────────────────────────────────────────

function ProjectForm({ draft, onChange, saving, onSave, onDelete, onCancel }: {
  draft: ProjectEntry; onChange: (d: ProjectEntry) => void; saving: boolean;
  onSave: () => void; onDelete: (() => void) | null; onCancel: () => void;
}) {
  const upd = (k: keyof ProjectEntry, v: string) => onChange({ ...draft, [k]: v });
  return (
    <div className="border border-[--ag-accent]/40 bg-[--ag-bg] p-4 space-y-3 mt-2">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Project Title *</Label>
          <Input value={draft.title} onChange={e => upd("title", e.target.value)} placeholder="e.g. Job Portal with AI Matching"
            className="rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent] text-sm" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Description</Label>
          <textarea rows={2} value={draft.description} onChange={e => upd("description", e.target.value)}
            placeholder="What the project does, your role, key outcomes…"
            className="w-full rounded-none border border-[--ag-border] bg-[--ag-surface] px-3 py-2 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] resize-none" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Tech Stack</Label>
          <Input value={draft.techStack} onChange={e => upd("techStack", e.target.value)}
            placeholder="React, Node.js, PostgreSQL, Supabase…  (comma separated)"
            className="rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent] text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Live URL</Label>
          <Input value={draft.url} onChange={e => upd("url", e.target.value)} placeholder="https://yourproject.com"
            className="rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent] text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">GitHub URL</Label>
          <Input value={draft.githubUrl} onChange={e => upd("githubUrl", e.target.value)} placeholder="https://github.com/you/repo"
            className="rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent] text-sm" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={saving || !draft.title.trim()}
            className="rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest text-xs">
            {saving ? "Saving…" : <><Check className="h-3.5 w-3.5 mr-1" />Save</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="rounded-none text-[--ag-muted]">Cancel</Button>
        </div>
        {onDelete && (
          <button onClick={onDelete} className="flex items-center gap-1 text-xs text-[--ag-muted] hover:text-[--ag-danger] transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Certification form ───────────────────────────────────────────────────────

function CertForm({
  draft, onChange, saving, onSave, onDelete, onCancel,
  profileName, pendingFile, docAnalysis, analyzing, onFileSelect, onFileRemove,
}: {
  draft: CertEntry; onChange: (d: CertEntry) => void; saving: boolean;
  onSave: () => void; onDelete: (() => void) | null; onCancel: () => void;
  profileName: string | null;
  pendingFile: File | null;
  docAnalysis: DocumentAnalysis | null;
  analyzing: boolean;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
}) {
  const upd = (k: keyof CertEntry, v: string) => onChange({ ...draft, [k]: v });

  // Instant, offline shape check — runs as the user types so a mistyped or
  // fabricated code is caught before it's ever saved. This is not proof of
  // authenticity; the live check against the issuer happens after saving.
  const format = checkCredentialFormat(draft.issuer, draft.credentialId);
  const issuer = getIssuer(draft.issuer);
  const verifyUrl = manualVerifyUrl(draft.issuer, draft.credentialId);

  return (
    <div className="border border-[--ag-accent]/40 bg-[--ag-bg] p-4 space-y-3 mt-2">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Certificate Name *</Label>
          <Input value={draft.name} onChange={e => upd("name", e.target.value)}
            placeholder="e.g. Google Data Analytics Professional Certificate"
            className="rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent] text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Issuing Organization *</Label>
          <Sel value={draft.issuer} onChange={v => upd("issuer", v)} options={CERT_ISSUERS} placeholder="Select issuer" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Credential ID</Label>
          <Input value={draft.credentialId} onChange={e => upd("credentialId", e.target.value)} placeholder="e.g. ABCD1234"
            className={cn(
              "rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent] text-sm",
              format.status === "bad_format" && "border-[--ag-danger] focus:border-[--ag-danger]",
            )} />
          {format.status === "bad_format" && (
            <p className="text-[11px] text-[--ag-danger] flex items-start gap-1 pt-0.5">
              <AlertCircle className="h-3 w-3 mt-px shrink-0" /> {format.message}
            </p>
          )}
          {format.status === "ok" && draft.credentialId && issuer?.supportsAutoVerify && (
            <p className="text-[11px] text-[--ag-muted] pt-0.5">
              Format looks right — we'll verify it with {issuer.label} after you save.
            </p>
          )}
          {format.status === "ok" && draft.credentialId && issuer && !issuer.supportsAutoVerify && issuer.manualOnlyReason && (
            <p className="text-[11px] text-[--ag-muted] pt-0.5">{issuer.manualOnlyReason}.</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Issue Date</Label>
          <Input type="month" value={draft.issueDate} onChange={e => upd("issueDate", e.target.value)}
            className="rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent] text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Expiry Date (if any)</Label>
          <Input type="month" value={draft.expiryDate} onChange={e => upd("expiryDate", e.target.value)}
            className="rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent] text-sm" />
        </div>
      </div>
      {/* Certificate document — the printed verify URL is often the only
          handle we get on issuers that can't be checked server-side. */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">
          Certificate File {issuer && !issuer.supportsAutoVerify && <span className="text-[--ag-accent]">— recommended</span>}
        </Label>
        <CertificateUpload
          fileName={pendingFile?.name ?? draft.fileName ?? null}
          analysis={docAnalysis}
          busy={analyzing}
          onSelect={onFileSelect}
          onRemove={onFileRemove}
        />
      </div>

      {verifyUrl && draft.credentialId && format.status === "ok" && (
        <div className="flex items-center gap-2 p-2 border border-[--ag-border] bg-[--ag-surface]">
          <BadgeCheck className="h-4 w-4 text-[--ag-accent] shrink-0" />
          <a href={verifyUrl} target="_blank" rel="noreferrer"
            className="text-xs font-bold text-[--ag-accent] hover:underline flex items-center gap-1">
            Check for yourself on {issuer?.label ?? draft.issuer} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}
            disabled={saving || !draft.name.trim() || !draft.issuer || format.status === "bad_format"}
            className="rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest text-xs">
            {saving ? "Saving…" : <><Check className="h-3.5 w-3.5 mr-1" />Save</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="rounded-none text-[--ag-muted]">Cancel</Button>
        </div>
        {onDelete && (
          <button onClick={onDelete} className="flex items-center gap-1 text-xs text-[--ag-muted] hover:text-[--ag-danger] transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count, onEdit, editing }: {
  icon: React.ElementType; title: string; count?: number; onEdit?: () => void; editing?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-['Syne'] font-bold text-[--ag-text] text-sm flex items-center gap-2 uppercase tracking-wide">
        <Icon className="h-4 w-4 text-[--ag-accent]" />
        {title}
        {count !== undefined && (
          <span className="text-[--ag-muted] font-['JetBrains_Mono'] normal-case tracking-normal font-normal text-xs">({count})</span>
        )}
      </h3>
      {onEdit && !editing && (
        <button onClick={onEdit} className="flex items-center gap-1 text-xs text-[--ag-muted] hover:text-[--ag-accent] transition-colors">
          <Edit3 className="h-3.5 w-3.5" /> Edit
        </button>
      )}
    </div>
  );
}

// ─── Save button row ──────────────────────────────────────────────────────────

function SaveRow({ saving, onSave, onCancel }: { saving: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex gap-2 mt-3">
      <Button size="sm" onClick={onSave} disabled={saving}
        className="rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest text-xs">
        {saving ? "Saving…" : <><Check className="h-3.5 w-3.5 mr-1" />Save</>}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel} className="rounded-none text-[--ag-muted]">Cancel</Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExpEntry[]>([]);
  const [education, setEducation] = useState<EduEntry[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [editSection, setEditSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const [expDraft, setExpDraft] = useState<ExpEntry | null>(null);
  const [eduDraft, setEduDraft] = useState<EduEntry | null>(null);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [certifications, setCertifications] = useState<CertEntry[]>([]);
  const [projDraft, setProjDraft] = useState<ProjectEntry | null>(null);
  const [certDraft, setCertDraft] = useState<CertEntry | null>(null);

  // Certificate verification state, keyed by issuer::credentialId.
  const [verifications, setVerifications] = useState<Record<string, VerificationResult>>({});
  const [verifying, setVerifying] = useState<Set<string>>(new Set());

  // Certificate document state. `pendingFile` holds a chosen file until the
  // certificate is saved — we only upload once the entry is committed, so a
  // cancelled edit never leaves an orphan in storage.
  const [certDocs, setCertDocs] = useState<Record<string, StoredCertificateDocument>>({});
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState<DocumentAnalysis | null>(null);
  const [analyzingDoc, setAnalyzingDoc] = useState(false);
  // Extracted text is kept separately from the analysis because the
  // analysis depends on fields the user can still change (issuer,
  // credential ID). Holding the text lets us re-analyse on every edit
  // without re-parsing the PDF.
  const [pendingText, setPendingText] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setHeadline(profile.headline ?? "");
    setBio(profile.bio ?? "");
    setLocation(profile.location ?? "");
    setSkills(profile.skills ?? []);
    setExperience(normalizeExp(profile.experience ?? []));
    setEducation(normalizeEdu(profile.education ?? []));
    setProjects(normalizeProj((profile as any).projects ?? []));
    setCertifications(normalizeCert((profile as any).certifications ?? []));
    setLinkedinUrl(profile.linkedin_url ?? "");
    setGithubUrl(profile.github_url ?? "");
    setPortfolioUrl(profile.portfolio_url ?? "");
  }, [profile]);

  // Load whatever verification results are already cached for this user.
  useEffect(() => {
    if (!user) return;
    loadCachedVerifications(user.id).then(setVerifications);
    loadDocumentAnalyses(user.id).then(setCertDocs);
  }, [user]);

  // Reading and analysing the certificate happens the moment a file is
  // chosen — before saving — so the user sees whether it matches while
  // they can still correct the details. Nothing is uploaded yet.
  const handleCertFileSelect = async (file: File) => {
    if (!certDraft) return;

    const problem = validateCertificateFile(file);
    if (problem) {
      toast({ title: "Can't use that file", description: problem, variant: "destructive" });
      return;
    }

    setPendingFile(file);
    setAnalyzingDoc(true);
    try {
      // Only PDFs carry extractable text. An image upload is still stored
      // and shown, but we say plainly that we couldn't read it rather
      // than pretending an OCR result we don't have.
      const text = file.type === "application/pdf" ? await extractPdfText(file) : "";
      setPendingText(text);

      // Analysis itself is handled by the effect below, which re-runs on
      // every change to issuer or credential ID. Here we only do the
      // one-time convenience of filling an empty ID from the document.
      const analysis = analyzeCertificateDocument(
        text, certDraft.issuer, certDraft.credentialId, fullName || null,
      );
      if (analysis.extractedCredentialId && !certDraft.credentialId.trim()) {
        setCertDraft(prev => prev ? { ...prev, credentialId: analysis.extractedCredentialId! } : prev);
        toast({
          title: "Credential ID found",
          description: `Read ${analysis.extractedCredentialId} off the certificate.`,
        });
      }
    } catch (err: any) {
      console.error("Certificate document analysis failed:", err);
      setPendingText(null);
      setPendingAnalysis(null);
      toast({
        title: "Couldn't read that file",
        description: String(err?.message ?? err),
        variant: "destructive",
      });
    } finally {
      setAnalyzingDoc(false);
    }
  };

  // Re-analyse whenever the inputs the analysis depends on change. Without
  // this the result reflects whatever the issuer and credential ID were at
  // the moment the file was picked — so uploading before choosing the
  // issuer silently produced an analysis with no issuer checks at all.
  useEffect(() => {
    if (pendingText === null || !certDraft) {
      return;
    }
    setPendingAnalysis(analyzeCertificateDocument(
      pendingText, certDraft.issuer, certDraft.credentialId, fullName || null,
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingText, certDraft?.issuer, certDraft?.credentialId, fullName]);

  // Re-open an existing certificate for editing: pull its stored file back
  // down so the checks above can run against the current field values
  // rather than replaying a stale saved result.
  const openCertForEdit = async (cert: CertEntry) => {
    setCertDraft({ ...cert });
    setEditSection(`cert_${cert.id}`);
    setPendingFile(null);
    setPendingText(null);
    setPendingAnalysis(storedAsAnalysis(certDocs[cert.id]));

    if (!cert.filePath) return;
    setAnalyzingDoc(true);
    try {
      const file = await downloadCertificateFile(cert.filePath);
      if (file) {
        const text = file.type === "application/pdf" ? await extractPdfText(file) : "";
        setPendingText(text);
      }
    } catch (err) {
      console.error("Couldn't re-read stored certificate:", err);
    } finally {
      setAnalyzingDoc(false);
    }
  };

  const handleCertFileRemove = async () => {
    setPendingFile(null);
    setPendingAnalysis(null);
    setPendingText(null);
    if (!certDraft) return;

    // Clearing a file that was already saved must remove it from storage
    // too, not just detach it from the entry.
    if (certDraft.filePath && user) {
      await deleteCertificateFile(certDraft.filePath);
      await removeDocumentAnalysis(user.id, certDraft.id);
      setCertDocs(prev => {
        const next = { ...prev };
        delete next[certDraft.id];
        return next;
      });
    }
    setCertDraft(prev => prev ? { ...prev, filePath: undefined, fileName: undefined } : prev);
  };

  /** Uploads any pending file and records its analysis. Returns the entry
   *  with storage details attached, ready to persist into the profile. */
  const commitCertDocument = async (cert: CertEntry): Promise<CertEntry> => {
    if (!user) return cert;

    // No new file chosen, but the issuer or credential ID may have been
    // edited since the document was analysed — persist the refreshed
    // result so the saved record isn't stale.
    if (!pendingFile) {
      if (cert.filePath && pendingAnalysis) {
        await saveDocumentAnalysis(
          user.id, cert.id, cert.issuer, cert.filePath, cert.fileName ?? "", pendingAnalysis,
        );
        setCertDocs(prev => ({
          ...prev,
          [cert.id]: {
            certificateId: cert.id,
            issuer: cert.issuer,
            storagePath: cert.filePath!,
            fileName: cert.fileName ?? null,
            consistency: pendingAnalysis.consistency,
            extractedId: pendingAnalysis.extractedCredentialId,
            nameMatched: pendingAnalysis.holderNameMatches,
            notes: pendingAnalysis.notes,
            analyzedAt: new Date().toISOString(),
          },
        }));
      }
      return cert;
    }

    const { path, error } = await uploadCertificateFile(user.id, cert.id, pendingFile);
    if (error || !path) {
      toast({
        title: "Certificate upload failed",
        description: error ?? "Unknown error",
        variant: "destructive",
      });
      return cert;
    }

    if (pendingAnalysis) {
      const saveError = await saveDocumentAnalysis(
        user.id, cert.id, cert.issuer, path, pendingFile.name, pendingAnalysis,
      );
      if (saveError) {
        toast({ title: "Couldn't save document check", description: saveError, variant: "destructive" });
      } else {
        setCertDocs(prev => ({
          ...prev,
          [cert.id]: {
            certificateId: cert.id,
            issuer: cert.issuer,
            storagePath: path,
            fileName: pendingFile.name,
            consistency: pendingAnalysis.consistency,
            extractedId: pendingAnalysis.extractedCredentialId,
            nameMatched: pendingAnalysis.holderNameMatches,
            notes: pendingAnalysis.notes,
            analyzedAt: new Date().toISOString(),
          },
        }));
      }
    }

    return { ...cert, filePath: path, fileName: pendingFile.name };
  };

  const clearCertDraftState = () => {
    setCertDraft(null);
    setPendingFile(null);
    setPendingAnalysis(null);
    setPendingText(null);
  };

  const viewCertificate = async (storagePath: string) => {
    const url = await getCertificateSignedUrl(storagePath);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else toast({ title: "Couldn't open the certificate", variant: "destructive" });
  };

  // Automatic verification: any saved certificate whose result is missing
  // or stale gets checked in the background. Results are cached in the DB,
  // so this settles to zero network calls once every credential is known.
  useEffect(() => {
    if (!user || certifications.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const cert of certifications) {
        if (!cert.issuer || !cert.credentialId.trim()) continue;

        const issuer = getIssuer(cert.issuer);
        if (!issuer?.supportsAutoVerify) continue;

        const key = cacheKey(cert.issuer, cert.credentialId);
        // verifyCertificate returns the cached value untouched when it's
        // still fresh, so calling it unconditionally is safe and cheap.
        const cached = verifications[key];

        setVerifying(prev => new Set(prev).add(key));
        try {
          const result = await verifyCertificate(user.id, cert.issuer, cert.credentialId, cached);
          if (cancelled) return;
          setVerifications(prev => ({ ...prev, [key]: result }));
        } catch (err) {
          console.error("Certificate verification failed:", err);
        } finally {
          if (!cancelled) {
            setVerifying(prev => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, certifications]);

  const recheckCertificate = async (cert: CertEntry) => {
    if (!user || !cert.issuer || !cert.credentialId.trim()) return;
    const key = cacheKey(cert.issuer, cert.credentialId);

    setVerifying(prev => new Set(prev).add(key));
    try {
      const result = await verifyCertificate(user.id, cert.issuer, cert.credentialId, undefined, true);
      setVerifications(prev => ({ ...prev, [key]: result }));
    } catch (err: any) {
      console.error("Certificate re-check failed:", err);
      toast({
        title: "Couldn't re-check",
        description: String(err?.message ?? err),
        variant: "destructive",
      });
    } finally {
      setVerifying(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const careerGoal = profile?.career_goal as CareerPathKey | null;
  const goalPath = careerGoal ? CAREER_PATHS[careerGoal] : null;
  const domainSkills = careerGoal ? (SKILL_POOLS[careerGoal] ?? []) : [];

  const { score: completionScore, missing: completionMissing } = calcCompletion({
    full_name: fullName, headline, bio, career_goal: careerGoal,
    skills, experience, education, projects, certifications,
    linkedin_url: linkedinUrl, github_url: githubUrl, portfolio_url: portfolioUrl,
  });

  const updateSkillSuggestions = (input: string) => {
    if (!input.trim()) { setSkillSuggestions([]); return; }
    const q = input.toLowerCase();
    const pool = [...(domainSkills.length > 0 ? domainSkills : []), ...Object.values(SKILL_POOLS).flat()];
    const unique = Array.from(new Set(pool));
    setSkillSuggestions(unique.filter(s => s.toLowerCase().includes(q) && !skills.includes(s)).slice(0, 8));
  };

  const addSkill = (s: string) => {
    const t = s.trim();
    if (t && !skills.includes(t)) setSkills(prev => [...prev, t]);
    setSkillInput(""); setSkillSuggestions([]);
  };

  const save = async (fields: Record<string, unknown>) => {
    if (!user) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "Saved!" });
      setEditSection(null);
    }
  };

  const initials = (fullName || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[--ag-bg]">
      <DashboardSidebar />
      <div className="pl-64 min-h-screen">
        <DashboardHeader />
        <main className="p-6 max-w-5xl mx-auto space-y-5 pb-12">

          {/* Header card */}
          <div className="bg-[--ag-surface] border border-[--ag-border] p-6">
            <div className="flex items-start gap-5">
              <div className="h-20 w-20 bg-[--ag-accent] flex items-center justify-center shrink-0">
                <span className="text-3xl font-['Syne'] font-extrabold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                {editSection === "header" ? (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Full Name *</Label>
                        <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"
                          className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Headline</Label>
                        <Input value={headline} onChange={e => setHeadline(e.target.value)}
                          placeholder="e.g. Final year CSE student | React dev"
                          className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]" />
                      </div>
                    </div>
                    <SaveRow saving={saving} onSave={() => save({ full_name: fullName, headline: headline || null })} onCancel={() => setEditSection(null)} />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h1 className="text-2xl font-['Syne'] font-extrabold text-[--ag-text]">
                          {fullName || <span className="text-[--ag-muted]">Add your name</span>}
                        </h1>
                        {headline
                          ? <p className="text-[--ag-muted] text-sm mt-0.5">{headline}</p>
                          : <p className="text-[--ag-muted]/50 text-sm mt-0.5 italic">Add a headline…</p>}
                        <p className="text-xs text-[--ag-muted] font-['JetBrains_Mono'] mt-1">{user?.email}</p>
                      </div>
                      <button onClick={() => setEditSection("header")}
                        className="flex items-center gap-1 text-xs text-[--ag-muted] hover:text-[--ag-accent] transition-colors shrink-0 mt-1">
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                    {goalPath ? (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 border border-[--ag-accent]/30 bg-[--ag-accent-dim]">
                        <span>{goalPath.emoji}</span>
                        <span className="text-xs font-bold text-[--ag-accent] uppercase tracking-wider">{goalPath.label}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-[--ag-muted] mt-2 italic">
                        No career goal set —{" "}
                        <a href="/onboarding/jobseeker" className="text-[--ag-accent] underline">update via onboarding</a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Completion bar */}
            <div className="mt-5 pt-5 border-t border-[--ag-border]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[--ag-muted]">Profile Strength</span>
                <span className={cn("text-sm font-['JetBrains_Mono'] font-extrabold",
                  completionScore >= 80 ? "text-[--ag-success]" : completionScore >= 50 ? "text-[--ag-accent]" : "text-[--ag-muted]")}>
                  {completionScore}%
                </span>
              </div>
              <div className="h-1.5 bg-[--ag-border]">
                <div className={cn("h-full transition-all duration-500", completionScore >= 80 ? "bg-[--ag-success]" : "bg-[--ag-accent]")}
                  style={{ width: `${completionScore}%` }} />
              </div>
              {completionMissing.length > 0 && (
                <p className="text-xs text-[--ag-muted] mt-2">
                  Missing: <span className="text-[--ag-text]">{completionMissing.join(" · ")}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Left column */}
            <div className="space-y-5">

              {/* About */}
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <SectionHeader icon={User} title="About" onEdit={() => setEditSection("about")} editing={editSection === "about"} />
                {editSection === "about" ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Bio</Label>
                      <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)}
                        placeholder="A short intro — background, interests, what you're building toward…"
                        className="w-full rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 py-2 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] resize-none" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Location</Label>
                      <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Chennai, India"
                        className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]" />
                    </div>
                    <SaveRow saving={saving} onSave={() => save({ bio: bio || null, location: location || null })} onCancel={() => setEditSection(null)} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bio
                      ? <p className="text-sm text-[--ag-muted] leading-relaxed">{bio}</p>
                      : <p className="text-sm text-[--ag-muted]/50 italic">Add a short bio…</p>}
                    {location && (
                      <p className="text-xs text-[--ag-muted] flex items-center gap-1.5 mt-2">
                        <MapPin className="h-3.5 w-3.5" /> {location}
                      </p>
                    )}
                    {profile?.career_status && (
                      <p className="text-xs text-[--ag-muted] mt-1">
                        Status: <span className="font-bold text-[--ag-text]">{profile.career_status}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <SectionHeader icon={Link2} title="Links" onEdit={() => setEditSection("links")} editing={editSection === "links"} />
                {editSection === "links" ? (
                  <div className="space-y-3">
                    {[
                      { label: "LinkedIn", val: linkedinUrl, set: setLinkedinUrl, ph: "linkedin.com/in/yourname" },
                      { label: "GitHub", val: githubUrl, set: setGithubUrl, ph: "github.com/yourname" },
                      { label: "Portfolio", val: portfolioUrl, set: setPortfolioUrl, ph: "yourportfolio.com" },
                    ].map(({ label, val, set, ph }) => (
                      <div key={label} className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">{label}</Label>
                        <Input value={val} onChange={e => set(e.target.value)} placeholder={ph}
                          className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent] text-sm" />
                      </div>
                    ))}
                    <SaveRow saving={saving}
                      onSave={() => save({ linkedin_url: linkedinUrl || null, github_url: githubUrl || null, portfolio_url: portfolioUrl || null })}
                      onCancel={() => setEditSection(null)} />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[--ag-accent] hover:underline"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
                    {githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[--ag-accent] hover:underline"><Github className="h-4 w-4" /> GitHub</a>}
                    {portfolioUrl && <a href={portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[--ag-accent] hover:underline"><Globe className="h-4 w-4" /> Portfolio</a>}
                    {!linkedinUrl && !githubUrl && !portfolioUrl && (
                      <p className="text-sm text-[--ag-muted]/50 italic">Add links to stand out to employers</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-5">

              {/* Skills */}
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <SectionHeader icon={Award} title="Skills" count={skills.length} onEdit={() => setEditSection("skills")} editing={editSection === "skills"} />
                {editSection === "skills" ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 min-h-8">
                      {skills.map(s => (
                        <span key={s} className="flex items-center gap-1.5 px-2.5 py-1 bg-[--ag-accent-dim] border border-[--ag-accent]/30 text-[--ag-accent] text-xs font-bold">
                          {s}
                          <button onClick={() => setSkills(p => p.filter(x => x !== s))} className="hover:text-[--ag-danger] transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      {skills.length === 0 && <p className="text-xs text-[--ag-muted] italic">No skills yet — add from suggestions below or type your own</p>}
                    </div>

                    {domainSkills.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-2">
                          Suggested for {goalPath?.emoji} {goalPath?.label}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {domainSkills.filter(s => !skills.includes(s)).slice(0, 14).map(s => (
                            <button key={s} onClick={() => addSkill(s)}
                              className="flex items-center gap-1 px-2.5 py-1 border border-dashed border-[--ag-border] text-[--ag-muted] text-xs hover:border-[--ag-accent] hover:text-[--ag-accent] transition-colors">
                              <Plus className="h-2.5 w-2.5" /> {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          ref={skillInputRef}
                          value={skillInput}
                          onChange={e => { setSkillInput(e.target.value); updateSkillSuggestions(e.target.value); }}
                          onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); if (skillInput.trim()) addSkill(skillInput); }
                            if (e.key === "Escape") { setSkillInput(""); setSkillSuggestions([]); }
                          }}
                          onBlur={() => setTimeout(() => setSkillSuggestions([]), 150)}
                          placeholder="Type any skill + Enter"
                          className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]"
                        />
                        {skillSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-20 bg-[--ag-surface] border border-[--ag-accent]/30 shadow-lg mt-0.5">
                            {skillSuggestions.map(s => (
                              <button key={s} onMouseDown={e => { e.preventDefault(); addSkill(s); }}
                                className="w-full text-left px-3 py-2 text-sm text-[--ag-text] hover:bg-[--ag-accent-dim] hover:text-[--ag-accent] transition-colors">
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button onClick={() => { if (skillInput.trim()) addSkill(skillInput); }}
                        className="rounded-none bg-[--ag-accent] text-white hover:brightness-110 px-4">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <SaveRow saving={saving} onSave={() => save({ skills })} onCancel={() => setEditSection(null)} />
                  </div>
                ) : (
                  skills.length === 0 ? (
                    <p className="text-sm text-[--ag-muted]/50 italic">Add skills to improve your job match score</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map(s => {
                        const inDomain = domainSkills.includes(s);
                        return (
                          <span key={s} className={cn(
                            "px-2.5 py-1 text-xs font-bold uppercase tracking-wider border",
                            inDomain
                              ? "text-[--ag-accent] bg-[--ag-accent-dim] border-[--ag-accent]/30"
                              : "text-[--ag-muted] bg-[--ag-bg] border-[--ag-border]"
                          )}>
                            {s}
                          </span>
                        );
                      })}
                    </div>
                  )
                )}
              </div>

              {/* Experience */}
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <SectionHeader icon={Briefcase} title="Experience" count={experience.length} />
                <div className="space-y-4">
                  {experience.map(exp => {
                    const isEditing = editSection === `exp_${exp.id}`;
                    if (isEditing && expDraft) {
                      return (
                        <ExpForm key={exp.id} draft={expDraft} onChange={setExpDraft} saving={saving}
                          onSave={async () => {
                            const updated = experience.map(e => e.id === expDraft.id ? expDraft : e);
                            await save({ experience: updated });
                            setExperience(updated); setExpDraft(null);
                          }}
                          onDelete={async () => {
                            const updated = experience.filter(e => e.id !== exp.id);
                            await save({ experience: updated });
                            setExperience(updated); setExpDraft(null);
                          }}
                          onCancel={() => { setEditSection(null); setExpDraft(null); }}
                        />
                      );
                    }
                    return (
                      <div key={exp.id} className="border-l-2 border-[--ag-accent]/30 pl-4 group py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[--ag-text] text-sm">{exp.title || "Untitled"}</p>
                            <p className="text-xs text-[--ag-accent] font-medium">{exp.company}</p>
                            {expDuration(exp) && <p className="text-xs text-[--ag-muted] mt-0.5 font-['JetBrains_Mono']">{expDuration(exp)}</p>}
                            {exp.description && <p className="text-xs text-[--ag-muted] mt-1.5 leading-relaxed">{exp.description}</p>}
                          </div>
                          <button onClick={() => { setExpDraft({ ...exp }); setEditSection(`exp_${exp.id}`); }}
                            className="opacity-0 group-hover:opacity-100 text-[--ag-muted] hover:text-[--ag-accent] transition-all shrink-0">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {editSection === "experience_new" && expDraft ? (
                    <ExpForm draft={expDraft} onChange={setExpDraft} saving={saving}
                      onSave={async () => {
                        const updated = [...experience, expDraft];
                        await save({ experience: updated });
                        setExperience(updated); setExpDraft(null);
                      }}
                      onDelete={null}
                      onCancel={() => { setEditSection(null); setExpDraft(null); }}
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setExpDraft({ id: genId(), title: "", company: "", startMonth: "", startYear: "", endMonth: "", endYear: "", current: false, description: "" });
                        setEditSection("experience_new");
                      }}
                      className="flex items-center gap-2 text-xs text-[--ag-muted] hover:text-[--ag-accent] transition-colors mt-1">
                      <Plus className="h-3.5 w-3.5" /> Add Experience
                    </button>
                  )}
                </div>
              </div>

              {/* Education */}
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <SectionHeader icon={GraduationCap} title="Education" count={education.length} />
                <div className="space-y-4">
                  {education.map(edu => {
                    const isEditing = editSection === `edu_${edu.id}`;
                    if (isEditing && eduDraft) {
                      return (
                        <EduForm key={edu.id} draft={eduDraft} onChange={setEduDraft} saving={saving}
                          onSave={async () => {
                            const updated = education.map(e => e.id === eduDraft.id ? eduDraft : e);
                            await save({ education: updated });
                            setEducation(updated); setEduDraft(null);
                          }}
                          onDelete={async () => {
                            const updated = education.filter(e => e.id !== edu.id);
                            await save({ education: updated });
                            setEducation(updated); setEduDraft(null);
                          }}
                          onCancel={() => { setEditSection(null); setEduDraft(null); }}
                        />
                      );
                    }
                    return (
                      <div key={edu.id} className="border-l-2 border-[--ag-accent]/30 pl-4 group py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[--ag-text] text-sm">
                              {edu.degree}{edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                            </p>
                            <p className="text-xs text-[--ag-accent] font-medium">{edu.institution}</p>
                            {(edu.startYear || edu.endYear) && (
                              <p className="text-xs text-[--ag-muted] mt-0.5 font-['JetBrains_Mono']">
                                {[edu.startYear, edu.endYear].filter(Boolean).join(" – ")}
                              </p>
                            )}
                          </div>
                          <button onClick={() => { setEduDraft({ ...edu }); setEditSection(`edu_${edu.id}`); }}
                            className="opacity-0 group-hover:opacity-100 text-[--ag-muted] hover:text-[--ag-accent] transition-all shrink-0">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {editSection === "education_new" && eduDraft ? (
                    <EduForm draft={eduDraft} onChange={setEduDraft} saving={saving}
                      onSave={async () => {
                        const updated = [...education, eduDraft];
                        await save({ education: updated });
                        setEducation(updated); setEduDraft(null);
                      }}
                      onDelete={null}
                      onCancel={() => { setEditSection(null); setEduDraft(null); }}
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEduDraft({ id: genId(), degree: "", fieldOfStudy: "", institution: "", startYear: "", endYear: "" });
                        setEditSection("education_new");
                      }}
                      className="flex items-center gap-2 text-xs text-[--ag-muted] hover:text-[--ag-accent] transition-colors mt-1">
                      <Plus className="h-3.5 w-3.5" /> Add Education
                    </button>
                  )}
                </div>
              </div>

              {/* Projects */}
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <SectionHeader icon={FolderOpen} title="Projects" count={projects.length} />
                <div className="space-y-4">
                  {projects.map(proj => {
                    const isEditing = editSection === `proj_${proj.id}`;
                    if (isEditing && projDraft) {
                      return (
                        <ProjectForm key={proj.id} draft={projDraft} onChange={setProjDraft} saving={saving}
                          onSave={async () => {
                            const updated = projects.map(p => p.id === projDraft.id ? projDraft : p);
                            await save({ projects: updated.map(p => ({ ...p, techStack: p.techStack.split(",").map(s => s.trim()).filter(Boolean) })) });
                            setProjects(updated); setProjDraft(null);
                          }}
                          onDelete={async () => {
                            const updated = projects.filter(p => p.id !== proj.id);
                            await save({ projects: updated.map(p => ({ ...p, techStack: p.techStack.split(",").map(s => s.trim()).filter(Boolean) })) });
                            setProjects(updated); setProjDraft(null);
                          }}
                          onCancel={() => { setEditSection(null); setProjDraft(null); }}
                        />
                      );
                    }
                    const stack = proj.techStack ? proj.techStack.split(",").map(s => s.trim()).filter(Boolean) : [];
                    return (
                      <div key={proj.id} className="border-l-2 border-[--ag-accent]/30 pl-4 group py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="font-bold text-[--ag-text] text-sm">{proj.title}</p>
                              {proj.url && (
                                <a href={proj.url} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-0.5 text-xs text-[--ag-accent] hover:underline">
                                  <Globe className="h-3 w-3" /> Live
                                </a>
                              )}
                              {proj.githubUrl && (
                                <a href={proj.githubUrl} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-0.5 text-xs text-[--ag-accent] hover:underline">
                                  <Github className="h-3 w-3" /> GitHub
                                </a>
                              )}
                            </div>
                            {proj.description && <p className="text-xs text-[--ag-muted] leading-relaxed mb-2">{proj.description}</p>}
                            {stack.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {stack.map(t => (
                                  <span key={t} className="text-xs px-1.5 py-0.5 bg-[--ag-bg] border border-[--ag-border] text-[--ag-muted] font-bold">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => { setProjDraft({ ...proj }); setEditSection(`proj_${proj.id}`); }}
                            className="opacity-0 group-hover:opacity-100 text-[--ag-muted] hover:text-[--ag-accent] transition-all shrink-0">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {editSection === "project_new" && projDraft ? (
                    <ProjectForm draft={projDraft} onChange={setProjDraft} saving={saving}
                      onSave={async () => {
                        const updated = [...projects, projDraft];
                        await save({ projects: updated.map(p => ({ ...p, techStack: p.techStack.split(",").map(s => s.trim()).filter(Boolean) })) });
                        setProjects(updated); setProjDraft(null);
                      }}
                      onDelete={null}
                      onCancel={() => { setEditSection(null); setProjDraft(null); }}
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setProjDraft({ id: genId(), title: "", description: "", techStack: "", url: "", githubUrl: "" });
                        setEditSection("project_new");
                      }}
                      className="flex items-center gap-2 text-xs text-[--ag-muted] hover:text-[--ag-accent] transition-colors mt-1">
                      <Plus className="h-3.5 w-3.5" /> Add Project
                    </button>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <SectionHeader icon={BadgeCheck} title="Certifications" count={certifications.length} />
                <div className="space-y-4">
                  {certifications.map(cert => {
                    const isEditing = editSection === `cert_${cert.id}`;
                    if (isEditing && certDraft) {
                      return (
                        <CertForm key={cert.id} draft={certDraft} onChange={setCertDraft} saving={saving}
                          profileName={fullName || null}
                          pendingFile={pendingFile}
                          docAnalysis={pendingAnalysis}
                          analyzing={analyzingDoc}
                          onFileSelect={handleCertFileSelect}
                          onFileRemove={handleCertFileRemove}
                          onSave={async () => {
                            const withDoc = await commitCertDocument(certDraft);
                            const updated = certifications.map(c => c.id === withDoc.id ? withDoc : c);
                            await save({ certifications: updated });
                            setCertifications(updated); clearCertDraftState();
                          }}
                          onDelete={async () => {
                            if (cert.filePath) await deleteCertificateFile(cert.filePath);
                            if (user) await removeDocumentAnalysis(user.id, cert.id);
                            const updated = certifications.filter(c => c.id !== cert.id);
                            await save({ certifications: updated });
                            setCertifications(updated); clearCertDraftState();
                          }}
                          onCancel={() => { setEditSection(null); clearCertDraftState(); }}
                        />
                      );
                    }
                    const certIssuer = getIssuer(cert.issuer);
                    const certKey = cacheKey(cert.issuer, cert.credentialId);
                    const result = verifications[certKey];
                    const badgeState: BadgeState = verifying.has(certKey)
                      ? "checking"
                      : result?.status ?? (certIssuer?.supportsAutoVerify ? "unchecked" : "unsupported");
                    return (
                      <div key={cert.id} className="border-l-2 border-[--ag-accent]/30 pl-4 group py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[--ag-text] text-sm">{cert.name}</p>
                            <p className="text-xs text-[--ag-accent] font-medium">{cert.issuer}</p>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-[--ag-muted] font-['JetBrains_Mono']">
                              {cert.issueDate && <span>Issued {cert.issueDate}</span>}
                              {cert.credentialId && <span>ID: {cert.credentialId}</span>}
                            </div>
                            {cert.credentialId && (
                              <CertificateVerificationBadge
                                state={badgeState}
                                message={result?.message}
                                manualUrl={manualVerifyUrl(cert.issuer, cert.credentialId)}
                                issuerLabel={certIssuer?.label ?? cert.issuer}
                                onRecheck={certIssuer?.supportsAutoVerify ? () => recheckCertificate(cert) : undefined}
                              />
                            )}

                            {/* Combined trust level — what the issuer said AND
                                what the uploaded document showed. */}
                            {(result || certDocs[cert.id]) && (() => {
                              const trust = assessCredentialTrust(
                                result?.status ?? null,
                                certDocs[cert.id]?.consistency ?? null,
                              );
                              return (
                                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                  <span className={cn(
                                    "inline-block px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border",
                                    trust.level === "verified"     ? "bg-[--ag-success]/10 border-[--ag-success]/40 text-[--ag-success]" :
                                    trust.level === "corroborated" ? "bg-[--ag-accent]/10  border-[--ag-accent]/40  text-[--ag-accent]"  :
                                    trust.level === "disputed"     ? "bg-[--ag-danger]/10  border-[--ag-danger]/40  text-[--ag-danger]"  :
                                                                     "bg-[--ag-border]/40  border-[--ag-border]     text-[--ag-muted]",
                                  )}>
                                    {trust.label}
                                  </span>
                                  <span className="text-[11px] text-[--ag-muted]">{trust.detail}</span>
                                </div>
                              );
                            })()}

                            {cert.filePath && (
                              <button
                                onClick={() => viewCertificate(cert.filePath!)}
                                className="mt-1.5 inline-flex items-center gap-1 text-xs text-[--ag-muted] hover:text-[--ag-accent] transition-colors"
                              >
                                <FileText className="h-3 w-3" /> {cert.fileName ?? "View certificate"}
                              </button>
                            )}
                          </div>
                          <button onClick={() => openCertForEdit(cert)}
                            className="opacity-0 group-hover:opacity-100 text-[--ag-muted] hover:text-[--ag-accent] transition-all shrink-0">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {editSection === "cert_new" && certDraft ? (
                    <CertForm draft={certDraft} onChange={setCertDraft} saving={saving}
                      profileName={fullName || null}
                      pendingFile={pendingFile}
                      docAnalysis={pendingAnalysis}
                      analyzing={analyzingDoc}
                      onFileSelect={handleCertFileSelect}
                      onFileRemove={handleCertFileRemove}
                      onSave={async () => {
                        const withDoc = await commitCertDocument(certDraft);
                        const updated = [...certifications, withDoc];
                        await save({ certifications: updated });
                        setCertifications(updated); clearCertDraftState();
                      }}
                      onDelete={null}
                      onCancel={() => { setEditSection(null); clearCertDraftState(); }}
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setCertDraft({ id: genId(), name: "", issuer: "", credentialId: "", issueDate: "", expiryDate: "" });
                        setEditSection("cert_new");
                      }}
                      className="flex items-center gap-2 text-xs text-[--ag-muted] hover:text-[--ag-accent] transition-colors mt-1">
                      <Plus className="h-3.5 w-3.5" /> Add Certification
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
