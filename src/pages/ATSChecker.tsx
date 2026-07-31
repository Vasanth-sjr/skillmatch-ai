import { useState, useRef } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { VOCAB, SYNONYMS, canonical } from "@/lib/skillVocabulary";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck, CheckCircle2, AlertCircle, XCircle, Upload,
  FileText, Loader2, Scan, RefreshCw,
} from "lucide-react";

// ─── PDF.js (lazy-imported inside async function to avoid SSR issues) ─────────
// Worker configured at call time to ensure Vite handles it correctly.

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  // Use ?url to let Vite bundle the worker correctly
  const { default: workerUrl } = await import(
    /* @vite-ignore */ "pdfjs-dist/build/pdf.worker.min.mjs?url"
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = (content.items as Array<{ str?: string; hasEOL?: boolean }>)
      .map(item => (item.hasEOL ? (item.str || "") + "\n" : (item.str || "") + " "))
      .join("");
    fullText += pageText + "\n";
  }
  return fullText;
}

// ─── ATS Analysis engine ──────────────────────────────────────────────────────
// Tech vocabulary, synonym mapping, and canonicalization now live in
// src/lib/skillVocabulary.ts, shared with AMSCE's Interview Analyzer.
// NOT keyword matching — structural + linguistic + semantic scoring.

const ACTION_VERBS = [
  "built","designed","developed","implemented","created","architected","engineered",
  "led","managed","coordinated","mentored","supervised","directed","owned",
  "optimized","improved","reduced","increased","enhanced","accelerated","boosted",
  "automated","deployed","integrated","migrated","refactored","scaled","containerized",
  "analyzed","researched","evaluated","assessed","diagnosed","identified",
  "collaborated","partnered","contributed","delivered","launched","shipped",
  "fixed","debugged","resolved","troubleshot","maintained","monitored",
  "tested","validated","documented","presented","trained","onboarded",
  "designed","prototyped","wireframed","published","open-sourced",
];

const SECTION_PATTERNS: Record<string, RegExp> = {
  experience: /\b(experience|work history|employment|professional|career history|internship)\b/i,
  education:  /\b(education|academic|qualification|degree|university|college|school)\b/i,
  skills:     /\b(skills|technologies|tech stack|technical skills|tools|competencies)\b/i,
  summary:    /\b(summary|objective|profile|about|overview|introduction)\b/i,
  projects:   /\b(projects|portfolio|personal projects|academic projects)\b/i,
  certs:      /\b(certifications?|certificates?|courses?|training|credentials?)\b/i,
  achievements:/\b(achievements?|awards?|honors?|accomplishments?|recognition)\b/i,
};

const QUANT_PATTERNS: RegExp[] = [
  /\d+(\.\d+)?%/g,
  /\$[\d,k.]+/gi,
  /\d[\d,]*\+?\s*(users?|customers?|clients?|members?|people)/gi,
  /\d[\d,]*\+?\s*(projects?|apps?|applications?|features?|services?)/gi,
  /\b(reduced|improved|increased|decreased|optimized|grew|saved)[\w\s,]+\d+/gi,
  /\b(#\d+|first|second|third|top\s\d+|1st|2nd|3rd|rank\s\d+)\b/gi,
  /\d+[x×]\s*(faster|improvement|reduction|increase)/gi,
];

interface CategoryItem { label: string; passed: boolean; detail: string }
interface Category     { name: string; score: number; max: number; items: CategoryItem[] }

export interface ATSReport {
  overall: number;
  grade: "A" | "B" | "C" | "D" | "F";
  categories: Category[];
  foundSkills: string[];
  experienceSkills: string[];
  actionVerbs: string[];
  wordCount: number;
  issues: string[];
  recommendations: string[];
}

function analyzeResumeText(text: string): ATSReport {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // ── Section detection ──────────────────────────────────────────────────────
  const foundSections: Record<string, boolean> = {};
  let experienceText = "";
  let currentSection = "";
  for (const line of lines) {
    if (line.length < 50) {
      for (const [sec, pat] of Object.entries(SECTION_PATTERNS)) {
        if (pat.test(line)) {
          foundSections[sec] = true;
          currentSection = sec;
          break;
        }
      }
    }
    if (currentSection === "experience") experienceText += " " + line;
  }

  // ── Contact detection ──────────────────────────────────────────────────────
  const hasEmail    = /[\w.+\-]+@[\w\-]+\.\w{2,}/i.test(text);
  const hasPhone    = /(\+91[\s\-]?)?\b[6-9]\d{9}\b|\b\d{3}[\s\-]\d{3}[\s\-]\d{4}\b/.test(text);
  const hasLinkedIn = /linkedin\.com\//i.test(text);
  const hasGitHub   = /github\.com\//i.test(text);

  // ── Action verbs ───────────────────────────────────────────────────────────
  const foundVerbs = ACTION_VERBS.filter(v =>
    new RegExp(`\\b${v}(?:ed|ing|s|d)?\\b`, "i").test(text),
  );

  // ── Quantification ─────────────────────────────────────────────────────────
  let quantCount = 0;
  for (const pat of QUANT_PATTERNS) {
    const matches = text.match(new RegExp(pat.source, "gi"));
    if (matches) quantCount += matches.length;
  }

  // ── Skill extraction ───────────────────────────────────────────────────────
  const lowerText = " " + text.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ") + " ";
  const lowerExp  = " " + experienceText.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ") + " ";

  const foundSkills: string[] = [];
  const experienceSkills: string[] = [];

  for (const term of VOCAB) {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re  = new RegExp(`(?<=[^a-z0-9+#]|^)${esc}(?=[^a-z0-9+#]|$)`);
    if (re.test(lowerText)) {
      foundSkills.push(term);
      if (re.test(lowerExp)) experienceSkills.push(term);
    }
  }

  // ── Word count ─────────────────────────────────────────────────────────────
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // ── Scoring ────────────────────────────────────────────────────────────────

  // Structure (25 pts)
  const structItems: CategoryItem[] = [
    { label: "Experience / Work section",  passed: !!foundSections.experience, detail: "8 pts" },
    { label: "Education section",          passed: !!foundSections.education,  detail: "6 pts" },
    { label: "Skills / Technologies section", passed: !!foundSections.skills,  detail: "6 pts" },
    { label: "Summary / Objective section",   passed: !!foundSections.summary, detail: "5 pts" },
  ];
  const structScore = [8, 6, 6, 5].reduce((sum, pts, i) => sum + (structItems[i].passed ? pts : 0), 0);

  // Impact language (25 pts)
  const verbScore  = Math.min(12, foundVerbs.length * 2);
  const quantScore = Math.min(13, quantCount >= 3 ? 13 : quantCount * 5);
  const impactItems: CategoryItem[] = [
    { label: `Action verbs — ${foundVerbs.length} detected`, passed: foundVerbs.length >= 5, detail: `${verbScore}/12 pts` },
    { label: `Quantified achievements — ${quantCount} found`, passed: quantCount >= 2, detail: `${quantScore}/13 pts` },
  ];
  const impactScore = verbScore + quantScore;

  // Skills (30 pts)
  const rawSkillPts = Math.min(20, foundSkills.length);
  const expSkillPts = Math.min(10, experienceSkills.length * 2);
  const skillItems: CategoryItem[] = [
    { label: `${foundSkills.length} tech skills / tools identified`, passed: foundSkills.length >= 10, detail: `${rawSkillPts}/20 pts` },
    { label: `${experienceSkills.length} skills used in experience context`, passed: experienceSkills.length >= 3, detail: `${expSkillPts}/10 pts` },
  ];
  const skillScore = rawSkillPts + expSkillPts;

  // Contact (20 pts)
  const contactItems: CategoryItem[] = [
    { label: "Email address",          passed: hasEmail,    detail: "5 pts" },
    { label: "Phone number",           passed: hasPhone,    detail: "5 pts" },
    { label: "LinkedIn profile URL",   passed: hasLinkedIn, detail: "5 pts" },
    { label: "GitHub / Portfolio URL", passed: hasGitHub,   detail: "5 pts" },
  ];
  const contactScore = [hasEmail, hasPhone, hasLinkedIn, hasGitHub].filter(Boolean).length * 5;

  const overall = structScore + impactScore + skillScore + contactScore;
  const grade =
    overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : overall >= 40 ? "D" : "F";

  // ── Feedback ───────────────────────────────────────────────────────────────
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!foundSections.experience) issues.push('Missing "Experience" section heading — ATS parsers look for this keyword');
  if (!foundSections.education)  issues.push('Missing "Education" section heading');
  if (!foundSections.skills)     issues.push('Missing "Skills" or "Technologies" section heading');
  if (!hasEmail)                 issues.push("No email address detected — essential for ATS contact parsing");
  if (foundVerbs.length < 4)     issues.push(`Only ${foundVerbs.length} action verbs found. ATS favors verbs like: built, developed, optimized, deployed`);
  if (quantCount < 2)            issues.push('No quantified achievements. Add metrics: "Reduced load time by 40%", "Served 1000+ users"');
  if (wordCount < 200)           issues.push("Resume seems too short — typical ATS expects 300–1200 words");
  if (!foundSections.summary)    recommendations.push('Add a 2–3 line "Summary" or "Objective" at the top for quick scanning');
  if (!foundSections.projects)   recommendations.push('Add a "Projects" section to demonstrate hands-on work');
  if (!hasLinkedIn)              recommendations.push("Add your LinkedIn profile URL");
  if (!hasGitHub)                recommendations.push("Add your GitHub URL to link your code portfolio");
  if (experienceSkills.length < 3) recommendations.push("Mention specific technologies within your experience descriptions, not only in a skills list");
  if (foundSkills.length < 8)    recommendations.push("Add more specific tech tools/skills to pass automated keyword screening");
  if (wordCount > 1500)          recommendations.push("Resume might be over 2 pages — ATS often prefers 1–2 pages (350–900 words)");

  return {
    overall, grade,
    categories: [
      { name: "Resume Structure",  score: structScore,  max: 25, items: structItems  },
      { name: "Impact Language",   score: impactScore,  max: 25, items: impactItems  },
      { name: "Skills & Keywords", score: skillScore,   max: 30, items: skillItems   },
      { name: "Contact & Links",   score: contactScore, max: 20, items: contactItems },
    ],
    foundSkills, experienceSkills, actionVerbs: foundVerbs,
    wordCount, issues, recommendations,
  };
}

// ─── JD matching (existing feature — unchanged logic) ─────────────────────────

function extractTechKeywords(jdText: string): string[] {
  const jdLower = " " + jdText.toLowerCase().replace(/[^a-z0-9+#.\s/-]/g, " ") + " ";
  const found = new Set<string>();
  for (const term of VOCAB) {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re  = new RegExp(`(?<=[^a-z0-9+#]|^)${esc}(?=[^a-z0-9+#]|$)`);
    if (re.test(jdLower)) found.add(term);
  }
  for (const phrase of Object.keys(SYNONYMS)) {
    if (phrase.includes(" ") && jdLower.includes(phrase)) found.add(phrase);
  }
  return Array.from(found).sort();
}

function isMatch(jdTerm: string, userSkills: string[]): boolean {
  const jdC = canonical(jdTerm);
  return userSkills.some(s => {
    const sc = canonical(s);
    return jdC === sc || jdC.includes(sc) || sc.includes(jdC);
  });
}

// ─── UI sub-components ────────────────────────────────────────────────────────

function GradeRing({ score, grade }: { score: number; grade: string }) {
  const color =
    score >= 85 ? "text-[--ag-success]"  :
    score >= 70 ? "text-[--ag-accent]"   :
    score >= 55 ? "text-[--ag-warning]"  : "text-[--ag-danger]";
  const label =
    score >= 85 ? "Excellent" : score >= 70 ? "Strong" :
    score >= 55 ? "Average"   : score >= 40 ? "Weak"   : "Poor";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("text-7xl font-['JetBrains_Mono'] font-extrabold tracking-tight leading-none", color)}>
        {score}
      </div>
      <div className="text-3xl font-['JetBrains_Mono'] font-extrabold text-[--ag-muted]">/ 100</div>
      <span className={cn(
        "px-3 py-1 text-xs font-extrabold uppercase tracking-widest border",
        score >= 85 ? "border-[--ag-success]/40 bg-[--ag-success]/10 text-[--ag-success]" :
        score >= 70 ? "border-[--ag-accent]/40 bg-[--ag-accent-dim] text-[--ag-accent]" :
        score >= 55 ? "border-[--ag-warning]/40 bg-[--ag-warning]/10 text-[--ag-warning]" :
        "border-[--ag-danger]/40 bg-[--ag-danger]/10 text-[--ag-danger]"
      )}>
        Grade {grade} — {label}
      </span>
    </div>
  );
}

function CategoryCard({ cat }: { cat: { name: string; score: number; max: number; items: CategoryItem[] } }) {
  const pct = Math.round((cat.score / cat.max) * 100);
  return (
    <div className="rounded-none bg-[--ag-bg] border border-[--ag-border] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-text]">{cat.name}</p>
        <span className="text-sm font-['JetBrains_Mono'] font-bold text-[--ag-text]">
          {cat.score}<span className="text-[--ag-muted] text-xs">/{cat.max}</span>
        </span>
      </div>
      <div className="h-1.5 bg-[--ag-surface] border border-[--ag-border] overflow-hidden">
        <div
          className={cn("h-full transition-all duration-700",
            pct >= 70 ? "bg-[--ag-success]" : pct >= 40 ? "bg-[--ag-warning]" : "bg-[--ag-danger]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="space-y-1.5">
        {cat.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {item.passed
              ? <CheckCircle2 className="h-3.5 w-3.5 text-[--ag-success] shrink-0" />
              : <XCircle      className="h-3.5 w-3.5 text-[--ag-danger]  shrink-0" />
            }
            <span className={cn("text-xs flex-1", item.passed ? "text-[--ag-muted]" : "text-[--ag-text] font-bold")}>
              {item.label}
            </span>
            <span className="text-[10px] text-[--ag-muted] font-['JetBrains_Mono'] shrink-0">{item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ATSChecker() {
  const { profile } = useAuth();

  // Tabs
  const [activeTab, setActiveTab] = useState<"scanner" | "jd_match">("scanner");

  // ── Scanner state ──────────────────────────────────────────────────────────
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [textMode, setTextMode]     = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [analyzing,  setAnalyzing]  = useState(false);
  const [report, setReport]         = useState<ATSReport | null>(null);
  const [pdfError, setPdfError]     = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── JD match state ─────────────────────────────────────────────────────────
  const [jdText, setJdText]   = useState("");
  const [jdResult, setJdResult] = useState<{ score: number; matched: string[]; missing: string[]; total: number } | null>(null);

  const userSkills: string[] = profile?.skills ?? [];
  const userName = profile?.full_name?.split(" ")[0] || "You";

  // ── PDF upload handler ─────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    setReport(null);
    setPdfError("");

    if (file.type === "application/pdf") {
      setExtracting(true);
      try {
        const text = await extractTextFromPDF(file);
        if (text.trim().length < 50) {
          setPdfError("Could not extract text from this PDF — it may be scanned/image-based. Use the paste option below.");
          setTextMode(true);
        } else {
          setResumeText(text);
          setPdfError("");
        }
      } catch {
        setPdfError("Failed to read PDF. Please paste your resume text below instead.");
        setTextMode(true);
      } finally {
        setExtracting(false);
      }
    } else {
      // Plain text file
      const text = await file.text();
      setResumeText(text);
    }
  };

  const runScan = async () => {
    if (!resumeText.trim()) return;
    setAnalyzing(true);
    // Small delay so UI shows loading state
    await new Promise(r => setTimeout(r, 400));
    const result = analyzeResumeText(resumeText);
    setReport(result);
    setAnalyzing(false);
  };

  const resetScan = () => {
    setResumeFile(null);
    setResumeText("");
    setReport(null);
    setPdfError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── JD match handler ───────────────────────────────────────────────────────
  const runJdMatch = () => {
    if (!jdText.trim()) return;
    const keywords = extractTechKeywords(jdText);
    if (keywords.length === 0) { setJdResult({ score: 0, matched: [], missing: [], total: 0 }); return; }
    const matched: string[] = [], missing: string[] = [];
    for (const kw of keywords) { (isMatch(kw, userSkills) ? matched : missing).push(kw); }
    setJdResult({ score: Math.round((matched.length / keywords.length) * 100), matched, missing, total: keywords.length });
  };

  const matchedSkillSet = new Set(
    jdResult?.matched.flatMap(kw => userSkills.filter(s => isMatch(kw, [s]))) ?? [],
  );

  return (
    <div className="min-h-screen bg-[--ag-bg]">
      <DashboardSidebar />
      <div className="pl-64 min-h-screen">
        <DashboardHeader />
        <main className="p-6 space-y-6 pb-12">

          {/* Header */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted] mb-1">Career Tools</p>
            <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight flex items-center gap-3">
              <ClipboardCheck className="h-8 w-8 text-[--ag-accent]" />
              ATS Checker
            </h1>
            <p className="text-sm text-[--ag-muted] mt-1">
              Upload your resume for AI analysis · Or check your profile against a job description
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[--ag-border]">
            {[
              { key: "scanner",  label: "Resume ATS Scanner",   icon: Scan },
              { key: "jd_match", label: "JD Profile Match",     icon: ClipboardCheck },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as "scanner" | "jd_match")}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 -mb-px transition-all",
                  activeTab === key
                    ? "border-[--ag-accent] text-[--ag-accent]"
                    : "border-transparent text-[--ag-muted] hover:text-[--ag-text]",
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {/* ── Tab: Resume Scanner ── */}
          {activeTab === "scanner" && (
            <div className="space-y-6">
              {/* What this does */}
              <div className="rounded-none bg-[--ag-surface] border border-[--ag-accent]/20 p-4">
                <p className="text-xs text-[--ag-muted] leading-relaxed">
                  <span className="font-bold text-[--ag-accent]">AI Resume Analysis</span> —
                  Goes beyond keyword matching: detects resume sections, measures impact language (action verbs + metrics),
                  finds tech skills in context, and checks ATS formatting rules. Score is 0–100 across 4 categories.
                </p>
              </div>

              {!report ? (
                /* ── Upload UI ── */
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Upload zone */}
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-none border-2 border-dashed border-[--ag-border] hover:border-[--ag-accent]/50 p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors text-center"
                    >
                      {extracting ? (
                        <Loader2 className="h-8 w-8 text-[--ag-accent] animate-spin" />
                      ) : resumeFile ? (
                        <FileText className="h-8 w-8 text-[--ag-success]" />
                      ) : (
                        <Upload className="h-8 w-8 text-[--ag-muted]" />
                      )}
                      <div>
                        <p className="text-sm font-bold text-[--ag-text]">
                          {extracting ? "Extracting text from PDF…" :
                           resumeFile ? resumeFile.name :
                           "Click to upload your resume"}
                        </p>
                        <p className="text-xs text-[--ag-muted] mt-1">PDF or TXT · Max 10 MB</p>
                      </div>
                      {resumeFile && !extracting && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[--ag-success] border border-[--ag-success]/30 px-2 py-0.5">
                          ✓ {resumeText.split(/\s+/).filter(Boolean).length} words extracted
                        </span>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {pdfError && (
                      <div className="p-3 bg-[--ag-warning]/10 border border-[--ag-warning]/30 text-xs text-[--ag-warning]">
                        <AlertCircle className="inline h-3.5 w-3.5 mr-1.5" />
                        {pdfError}
                      </div>
                    )}

                    {/* Toggle paste mode */}
                    <button
                      onClick={() => setTextMode(m => !m)}
                      className="text-xs font-bold text-[--ag-accent] hover:underline"
                    >
                      {textMode ? "↑ Hide text box" : "Or paste resume text instead →"}
                    </button>
                  </div>

                  {/* Text paste fallback */}
                  <div className={cn("space-y-3", !textMode && !pdfError && "lg:opacity-40 pointer-events-none")}>
                    <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted]">Paste Resume Text</p>
                    <textarea
                      value={resumeText}
                      onChange={e => setResumeText(e.target.value)}
                      placeholder="Paste your full resume text here (copy-paste from your Word/Google Docs resume)…"
                      rows={14}
                      className="w-full bg-[--ag-bg] border border-[--ag-border] text-[--ag-text] text-xs px-3 py-2.5 placeholder:text-[--ag-muted]/50 focus:outline-none focus:border-[--ag-accent] resize-none font-['JetBrains_Mono']"
                    />
                  </div>
                </div>
              ) : null}

              {/* Analyze / Reset buttons */}
              {!report && (
                <div className="flex gap-3">
                  <button
                    onClick={runScan}
                    disabled={!resumeText.trim() || analyzing}
                    className="flex items-center gap-2 px-6 py-3 bg-[--ag-accent] text-[#07080F] font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {analyzing ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
                    ) : (
                      <><Scan className="h-4 w-4" /> Run ATS Analysis</>
                    )}
                  </button>
                  {(resumeFile || resumeText) && (
                    <button onClick={resetScan} className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-[--ag-muted] border border-[--ag-border] hover:border-[--ag-danger]/40 hover:text-[--ag-danger] transition-colors">
                      <RefreshCw className="h-4 w-4" /> Reset
                    </button>
                  )}
                </div>
              )}

              {/* ── Report ── */}
              {report && (
                <div className="space-y-6 animate-in fade-in duration-400">
                  {/* Reset button */}
                  <button onClick={resetScan} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[--ag-muted] border border-[--ag-border] hover:border-[--ag-accent]/40 hover:text-[--ag-text] transition-colors">
                    <RefreshCw className="h-3.5 w-3.5" /> Scan Another Resume
                  </button>

                  <div className="grid lg:grid-cols-[280px_1fr] gap-6">
                    {/* Score panel */}
                    <div className="space-y-5">
                      <div className="rounded-none bg-[--ag-surface] border border-[--ag-border] p-6 flex flex-col items-center gap-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted]">ATS Score</p>
                        <GradeRing score={report.overall} grade={report.grade} />
                        <div className="w-full space-y-1.5 pt-3 border-t border-[--ag-border]">
                          {[
                            { label: "Words",           value: report.wordCount },
                            { label: "Skills found",    value: report.foundSkills.length },
                            { label: "In-context skills", value: report.experienceSkills.length },
                            { label: "Action verbs",    value: report.actionVerbs.length },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between text-xs">
                              <span className="text-[--ag-muted]">{label}</span>
                              <span className="font-['JetBrains_Mono'] font-bold text-[--ag-text]">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Issues */}
                      {report.issues.length > 0 && (
                        <div className="rounded-none bg-[--ag-surface] border border-[--ag-danger]/30 p-4 space-y-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[--ag-danger]">Issues to Fix</p>
                          {report.issues.map((issue, i) => (
                            <div key={i} className="flex gap-2">
                              <XCircle className="h-3.5 w-3.5 text-[--ag-danger] shrink-0 mt-0.5" />
                              <p className="text-xs text-[--ag-text]">{issue}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Recommendations */}
                      {report.recommendations.length > 0 && (
                        <div className="rounded-none bg-[--ag-surface] border border-[--ag-warning]/30 p-4 space-y-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[--ag-warning]">Recommendations</p>
                          {report.recommendations.map((rec, i) => (
                            <div key={i} className="flex gap-2">
                              <AlertCircle className="h-3.5 w-3.5 text-[--ag-warning] shrink-0 mt-0.5" />
                              <p className="text-xs text-[--ag-text]">{rec}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Category breakdown */}
                    <div className="space-y-4">
                      {report.categories.map(cat => (
                        <CategoryCard key={cat.name} cat={cat} />
                      ))}

                      {/* Found skills */}
                      {report.foundSkills.length > 0 && (
                        <div className="rounded-none bg-[--ag-bg] border border-[--ag-border] p-4">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[--ag-muted] mb-3">
                            Skills Detected ({report.foundSkills.length})
                            <span className="ml-2 text-[--ag-success]">● in experience</span>
                            <span className="ml-2 text-[--ag-border]">○ skills section only</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {report.foundSkills.map(skill => {
                              const inExp = report.experienceSkills.includes(skill);
                              return (
                                <span key={skill} className={cn(
                                  "text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider border",
                                  inExp
                                    ? "bg-[--ag-success]/10 border-[--ag-success]/30 text-[--ag-success]"
                                    : "bg-[--ag-bg] border-[--ag-border] text-[--ag-muted]",
                                )}>
                                  {skill}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: JD Match ── */}
          {activeTab === "jd_match" && (
            <div className="space-y-4">
              <div className="rounded-none bg-[--ag-surface] border border-[--ag-accent]/20 p-4">
                <p className="text-xs text-[--ag-muted]">
                  <span className="font-bold text-[--ag-accent]">Profile vs JD</span> —
                  Paste a job description. We extract only tech keywords (not noise like "team player") and match them against your profile skills with synonym awareness (JS = JavaScript, Node = Node.js).
                </p>
              </div>

              {!userSkills.length && (
                <div className="bg-[--ag-warning]/10 border border-[--ag-warning]/30 p-4 flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-[--ag-warning] shrink-0" />
                  <p className="text-sm text-[--ag-text]">
                    No skills in your profile yet.{" "}
                    <a href="/profile" className="font-bold text-[--ag-accent] hover:underline">Add skills first</a> for an accurate match.
                  </p>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                {/* JD input */}
                <div className="bg-[--ag-surface] border border-[--ag-border] p-5 space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[--ag-muted]">Paste Job Description</h2>
                  <textarea
                    value={jdText}
                    onChange={e => { setJdText(e.target.value); setJdResult(null); }}
                    placeholder="Paste the full job description here — requirements, tech stack, responsibilities…"
                    rows={16}
                    className="w-full rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 py-2 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] resize-none font-['JetBrains_Mono']"
                  />
                  <button
                    onClick={runJdMatch}
                    disabled={!jdText.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-[--ag-accent] text-[#07080F] py-3 font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ClipboardCheck className="h-4 w-4" /> Analyze Match
                  </button>
                </div>

                {/* Results */}
                <div className="space-y-4">
                  {/* Profile skills */}
                  <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-3">
                      {userName}'s Profile Skills ({userSkills.length})
                    </h2>
                    {userSkills.length === 0 ? (
                      <p className="text-xs text-[--ag-muted] italic">No skills added yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {userSkills.map(s => (
                          <span key={s} className={cn(
                            "text-xs px-2 py-0.5 border font-bold uppercase tracking-wider transition-all",
                            matchedSkillSet.has(s)
                              ? "bg-[--ag-success]/10 border-[--ag-success]/30 text-[--ag-success]"
                              : "bg-[--ag-bg] border-[--ag-border] text-[--ag-muted]",
                          )}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {jdResult ? (
                    jdResult.total === 0 ? (
                      <div className="bg-[--ag-surface] border border-[--ag-warning]/30 p-6 text-center">
                        <AlertCircle className="h-8 w-8 text-[--ag-warning] mx-auto mb-3" />
                        <p className="font-bold text-[--ag-text] mb-1">No tech keywords found</p>
                        <p className="text-xs text-[--ag-muted]">Try pasting a more detailed JD with tech requirements.</p>
                      </div>
                    ) : (
                      <>
                        {/* Score */}
                        <div className="bg-[--ag-surface] border border-[--ag-border] p-6 flex flex-col items-center gap-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted]">Profile Match Score</p>
                          <div className={cn(
                            "text-6xl font-['JetBrains_Mono'] font-extrabold",
                            jdResult.score >= 70 ? "text-[--ag-success]" : jdResult.score >= 40 ? "text-[--ag-warning]" : "text-[--ag-danger]",
                          )}>
                            {jdResult.score}%
                          </div>
                          <div className="w-full h-2 bg-[--ag-bg] border border-[--ag-border]">
                            <div className={cn("h-full transition-all duration-700",
                              jdResult.score >= 70 ? "bg-[--ag-success]" : jdResult.score >= 40 ? "bg-[--ag-warning]" : "bg-[--ag-danger]"
                            )} style={{ width: `${jdResult.score}%` }} />
                          </div>
                          <p className="text-xs text-[--ag-muted] font-['JetBrains_Mono']">
                            {jdResult.matched.length} of {jdResult.total} tech keywords matched
                          </p>
                        </div>
                        {jdResult.missing.length > 0 && (
                          <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[--ag-danger] mb-3 flex items-center gap-2">
                              <XCircle className="h-4 w-4" /> Missing ({jdResult.missing.length})
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                              {jdResult.missing.map(kw => (
                                <span key={kw} className="text-xs px-2.5 py-1 border border-[--ag-danger]/30 bg-[--ag-danger]/10 text-[--ag-danger] font-bold">{kw}</span>
                              ))}
                            </div>
                            <a href="/profile" className="mt-4 flex items-center gap-1 text-xs font-bold text-[--ag-accent] hover:underline">
                              Add missing skills to profile →
                            </a>
                          </div>
                        )}
                        {jdResult.matched.length > 0 && (
                          <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[--ag-success] mb-3 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> Matched ({jdResult.matched.length})
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                              {jdResult.matched.map(kw => (
                                <span key={kw} className="text-xs px-2.5 py-1 border border-[--ag-success]/30 bg-[--ag-success]/10 text-[--ag-success] font-bold">{kw}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  ) : (
                    <div className="bg-[--ag-surface] border border-dashed border-[--ag-border] p-12 flex flex-col items-center gap-3 text-center">
                      <ClipboardCheck className="h-10 w-10 text-[--ag-border]" />
                      <p className="font-bold text-[--ag-muted] text-sm">Paste a JD and click Analyze</p>
                      <p className="text-xs text-[--ag-muted]">Synonym-aware — JS = JavaScript, Node = Node.js, k8s = Kubernetes</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
