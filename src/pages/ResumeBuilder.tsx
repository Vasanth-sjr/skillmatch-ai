import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import {
  BOARDS_10TH, STREAMS_12TH, DEGREES, BRANCHES, UNIVERSITIES,
  TECH_SKILLS_BY_CATEGORY, SPOKEN_LANGUAGES, PROFICIENCY_LEVELS,
  ACHIEVEMENT_CATEGORIES, CERTIFICATION_ISSUERS, MONTHS, YEARS_PAST, YEARS_GRAD,
} from "@/data/resumeOptions";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import {
  User, Link2, GraduationCap, Code2, Languages, FolderOpen,
  Briefcase, Trophy, FileText, Plus, Trash2, ChevronRight, ChevronLeft,
  Printer, Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Education10 { school: string; board: string; year: string; score: string; scoreType: "%" | "CGPA" }
interface Education12 { school: string; board: string; stream: string; year: string; score: string; scoreType: "%" | "CGPA" }
interface EducationDeg { college: string; university: string; degree: string; branch: string; startYear: string; endYear: string; score: string; scoreType: "%" | "CGPA" }
interface EducationPG  { college: string; university: string; degree: string; branch: string; startYear: string; endYear: string; score: string; scoreType: "%" | "CGPA" }
interface LangEntry    { language: string; proficiency: string }
interface ProjectEntry { name: string; description: string; techStack: string; github: string; live: string; year: string }
interface InternEntry  { company: string; role: string; startMonth: string; startYear: string; endMonth: string; endYear: string; current: boolean; type: string; description: string }
interface AchievEntry  { title: string; category: string; issuer: string; year: string; description: string }
interface CertEntry    { name: string; issuer: string; year: string; credentialUrl: string }

export interface ResumeData {
  // Step 1 — personal
  fullName: string; email: string; phone: string; location: string; photoUrl: string;
  // Step 2 — links
  linkedin: string; github: string; portfolio: string;
  // Step 3 — objective
  careerGoal: string; objective: string;
  // Step 4 — education
  edu10: Education10; edu12: Education12;
  eduDeg: EducationDeg; hasPG: boolean; eduPG: EducationPG;
  // Step 5 — skills
  selectedSkills: string[]; customSkills: string;
  // Step 6 — languages
  languages: LangEntry[];
  // Step 7 — projects
  projects: ProjectEntry[];
  // Step 8 — internships
  internships: InternEntry[];
  // Step 9 — achievements & certs
  achievements: AchievEntry[]; certifications: CertEntry[];
}

const EMPTY_DEG: EducationDeg = { college: "", university: "", degree: "", branch: "", startYear: "", endYear: "", score: "", scoreType: "CGPA" };
const EMPTY_PROJECT: ProjectEntry = { name: "", description: "", techStack: "", github: "", live: "", year: "" };
const EMPTY_INTERN: InternEntry  = { company: "", role: "", startMonth: "", startYear: "", endMonth: "", endYear: "", current: false, type: "In-Office", description: "" };
const EMPTY_ACHIEV: AchievEntry  = { title: "", category: "", issuer: "", year: "", description: "" };
const EMPTY_CERT: CertEntry      = { name: "", issuer: "", year: "", credentialUrl: "" };

function blank(): ResumeData {
  return {
    fullName: "", email: "", phone: "", location: "", photoUrl: "",
    linkedin: "", github: "", portfolio: "",
    careerGoal: "", objective: "",
    edu10: { school: "", board: "", year: "", score: "", scoreType: "%" },
    edu12: { school: "", board: "", stream: "", year: "", score: "", scoreType: "%" },
    eduDeg: { ...EMPTY_DEG }, hasPG: false, eduPG: { ...EMPTY_DEG },
    selectedSkills: [], customSkills: "",
    languages: [{ language: "English", proficiency: "Fluent" }],
    projects: [{ ...EMPTY_PROJECT }],
    internships: [],
    achievements: [], certifications: [],
  };
}

function lsKey(uid: string) { return `skillmatch_resume_builder_${uid}`; }
function loadData(uid: string): ResumeData {
  try { return { ...blank(), ...JSON.parse(localStorage.getItem(lsKey(uid)) || "{}") }; }
  catch { return blank(); }
}
function saveData(uid: string, d: ResumeData) {
  localStorage.setItem(lsKey(uid), JSON.stringify(d));
}

// ─── Tiny UI helpers ──────────────────────────────────────────────────────────

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase tracking-wider text-[--ag-muted]">
        {label}{required && <span className="text-[--ag-danger] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-[--ag-muted]">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("w-full bg-[--ag-bg] border border-[--ag-border] text-[--ag-text] text-sm px-3 py-2 focus:outline-none focus:border-[--ag-accent] placeholder:text-[--ag-muted]/50", className)}
    />
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-[--ag-bg] border border-[--ag-border] text-[--ag-text] text-sm px-3 py-2 focus:outline-none focus:border-[--ag-accent] cursor-pointer"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SelectOrCustom({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  const isCustom = value && !options.includes(value);
  const [showCustom, setShowCustom] = useState(isCustom);

  const handleSelect = (v: string) => {
    if (v === "__custom__") { setShowCustom(true); onChange(""); }
    else { setShowCustom(false); onChange(v); }
  };

  return (
    <div className="space-y-2">
      <select
        value={showCustom ? "__custom__" : value}
        onChange={e => handleSelect(e.target.value)}
        className="w-full bg-[--ag-bg] border border-[--ag-border] text-[--ag-text] text-sm px-3 py-2 focus:outline-none focus:border-[--ag-accent] cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value="__custom__">✏️ Type custom…</option>
      </select>
      {showCustom && (
        <Input value={value} onChange={onChange} placeholder="Type your custom value" />
      )}
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-[--ag-bg] border border-[--ag-border] text-[--ag-text] text-sm px-3 py-2 focus:outline-none focus:border-[--ag-accent] resize-none placeholder:text-[--ag-muted]/50"
    />
  );
}

function ScoreRow({ scoreType, score, onTypeChange, onScoreChange }: {
  scoreType: "%" | "CGPA"; score: string;
  onTypeChange: (t: "%" | "CGPA") => void; onScoreChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="flex border border-[--ag-border] overflow-hidden shrink-0">
        {(["%", "CGPA"] as const).map(t => (
          <button key={t} type="button" onClick={() => onTypeChange(t)}
            className={cn("px-3 py-2 text-xs font-bold transition-colors",
              scoreType === t ? "bg-[--ag-accent] text-[#07080F]" : "bg-[--ag-bg] text-[--ag-muted] hover:bg-[--ag-surface]"
            )}
          >{t}</button>
        ))}
      </div>
      <Input value={score} onChange={onScoreChange} placeholder={scoreType === "%" ? "e.g. 87.4" : "e.g. 8.7"} />
    </div>
  );
}

// ─── STEPS ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Links",         icon: Link2 },
  { id: 3, label: "Objective",     icon: FileText },
  { id: 4, label: "Education",     icon: GraduationCap },
  { id: 5, label: "Skills",        icon: Code2 },
  { id: 6, label: "Languages",     icon: Languages },
  { id: 7, label: "Projects",      icon: FolderOpen },
  { id: 8, label: "Internships",   icon: Briefcase },
  { id: 9, label: "Achievements",  icon: Trophy },
];

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ d, set }: { d: ResumeData; set: (k: keyof ResumeData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-['Syne'] font-extrabold text-[--ag-text]">Personal Information</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <Input value={d.fullName} onChange={v => set("fullName", v)} placeholder="e.g. Priya Sharma" />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={d.email} onChange={v => set("email", v)} placeholder="priya@email.com" />
        </Field>
        <Field label="Phone Number">
          <Input type="tel" value={d.phone} onChange={v => set("phone", v)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="Location">
          <Input value={d.location} onChange={v => set("location", v)} placeholder="Chennai, Tamil Nadu" />
        </Field>
        <Field label="Photo URL" hint="Optional — paste a direct link to your photo (Google Drive, GitHub profile pic, etc.)">
          <Input value={d.photoUrl} onChange={v => set("photoUrl", v)} placeholder="https://..." />
        </Field>
      </div>
    </div>
  );
}

function Step2({ d, set }: { d: ResumeData; set: (k: keyof ResumeData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-['Syne'] font-extrabold text-[--ag-text]">Links & Profiles</h2>
      <div className="space-y-4">
        <Field label="LinkedIn Profile URL">
          <Input value={d.linkedin} onChange={v => set("linkedin", v)} placeholder="https://linkedin.com/in/your-name" />
        </Field>
        <Field label="GitHub Profile URL">
          <Input value={d.github} onChange={v => set("github", v)} placeholder="https://github.com/your-username" />
        </Field>
        <Field label="Portfolio / Website URL">
          <Input value={d.portfolio} onChange={v => set("portfolio", v)} placeholder="https://yourportfolio.dev" />
        </Field>
      </div>
    </div>
  );
}

function Step3({ d, set, profile }: { d: ResumeData; set: (k: keyof ResumeData, v: unknown) => void; profile: ReturnType<typeof useAuth>["profile"] }) {
  // Auto-suggest objective from career goal
  const suggest = () => {
    const key = profile?.career_goal as CareerPathKey;
    const path = key ? CAREER_PATHS[key] : null;
    if (!path) return;
    set("objective", `Motivated ${path.label} seeking opportunities to apply my skills in ${path.coreSkills.slice(0, 3).join(", ")} and contribute to impactful products. ${path.tagline}.`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-['Syne'] font-extrabold text-[--ag-text]">Career Objective</h2>
      <Field label="Career Goal / Target Role" required>
        <Select
          value={d.careerGoal}
          onChange={v => set("careerGoal", v)}
          options={Object.values(CAREER_PATHS).map(p => p.label)}
          placeholder="Select your target role…"
        />
      </Field>
      <Field label="Objective Statement" hint="2–4 sentences about who you are and what you're looking for">
        <div className="space-y-2">
          {profile?.career_goal && (
            <button
              type="button"
              onClick={suggest}
              className="text-[10px] font-bold uppercase tracking-wider text-[--ag-accent] hover:underline"
            >
              ✨ Auto-fill from career goal
            </button>
          )}
          <Textarea
            value={d.objective}
            onChange={v => set("objective", v)}
            placeholder="A results-driven Computer Science student seeking a frontend developer role…"
            rows={4}
          />
        </div>
      </Field>
    </div>
  );
}

function Step4({ d, setEdu }: {
  d: ResumeData;
  setEdu: (section: "edu10" | "edu12" | "eduDeg" | "eduPG", key: string, value: unknown) => void;
  set: (k: keyof ResumeData, v: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-['Syne'] font-extrabold text-[--ag-text]">Education</h2>

      {/* 10th */}
      <div className="rounded-none border border-[--ag-border] p-4 space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-accent]">10th / SSC / Matriculation</p>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="School Name" required>
            <Input value={d.edu10.school} onChange={v => setEdu("edu10", "school", v)} placeholder="St. Xavier's High School" />
          </Field>
          <Field label="Board" required>
            <SelectOrCustom value={d.edu10.board} onChange={v => setEdu("edu10", "board", v)} options={BOARDS_10TH} placeholder="Select board…" />
          </Field>
          <Field label="Year of Passing" required>
            <Select value={d.edu10.year} onChange={v => setEdu("edu10", "year", v)} options={YEARS_PAST} placeholder="Year…" />
          </Field>
          <Field label="Score">
            <ScoreRow
              scoreType={d.edu10.scoreType}
              score={d.edu10.score}
              onTypeChange={t => setEdu("edu10", "scoreType", t)}
              onScoreChange={v => setEdu("edu10", "score", v)}
            />
          </Field>
        </div>
      </div>

      {/* 12th */}
      <div className="rounded-none border border-[--ag-border] p-4 space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-accent]">12th / HSC / Intermediate / Diploma</p>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="School / College Name" required>
            <Input value={d.edu12.school} onChange={v => setEdu("edu12", "school", v)} placeholder="Delhi Public School" />
          </Field>
          <Field label="Board / University" required>
            <SelectOrCustom value={d.edu12.board} onChange={v => setEdu("edu12", "board", v)} options={BOARDS_10TH} placeholder="Select board…" />
          </Field>
          <Field label="Stream" required>
            <SelectOrCustom value={d.edu12.stream} onChange={v => setEdu("edu12", "stream", v)} options={STREAMS_12TH} placeholder="Select stream…" />
          </Field>
          <Field label="Year of Passing">
            <Select value={d.edu12.year} onChange={v => setEdu("edu12", "year", v)} options={YEARS_PAST} placeholder="Year…" />
          </Field>
          <Field label="Score">
            <ScoreRow
              scoreType={d.edu12.scoreType}
              score={d.edu12.score}
              onTypeChange={t => setEdu("edu12", "scoreType", t)}
              onScoreChange={v => setEdu("edu12", "score", v)}
            />
          </Field>
        </div>
      </div>

      {/* Degree */}
      <div className="rounded-none border border-[--ag-border] p-4 space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-accent]">Undergraduate Degree</p>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="College Name" required>
            <Input value={d.eduDeg.college} onChange={v => setEdu("eduDeg", "college", v)} placeholder="PSG College of Technology" />
          </Field>
          <Field label="University / Affiliation" required>
            <SelectOrCustom value={d.eduDeg.university} onChange={v => setEdu("eduDeg", "university", v)} options={UNIVERSITIES} placeholder="Select university…" />
          </Field>
          <Field label="Degree" required>
            <SelectOrCustom value={d.eduDeg.degree} onChange={v => setEdu("eduDeg", "degree", v)} options={DEGREES} placeholder="Select degree…" />
          </Field>
          <Field label="Branch / Specialization">
            <SelectOrCustom value={d.eduDeg.branch} onChange={v => setEdu("eduDeg", "branch", v)} options={BRANCHES} placeholder="Select branch…" />
          </Field>
          <Field label="Start Year">
            <Select value={d.eduDeg.startYear} onChange={v => setEdu("eduDeg", "startYear", v)} options={YEARS_GRAD} placeholder="From…" />
          </Field>
          <Field label="End / Expected Year">
            <Select value={d.eduDeg.endYear} onChange={v => setEdu("eduDeg", "endYear", v)} options={YEARS_GRAD} placeholder="To…" />
          </Field>
          <Field label="Score / CGPA">
            <ScoreRow
              scoreType={d.eduDeg.scoreType}
              score={d.eduDeg.score}
              onTypeChange={t => setEdu("eduDeg", "scoreType", t)}
              onScoreChange={v => setEdu("eduDeg", "score", v)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Step5({ d, set }: { d: ResumeData; set: (k: keyof ResumeData, v: unknown) => void }) {
  const toggle = (skill: string) => {
    const has = d.selectedSkills.includes(skill);
    set("selectedSkills", has ? d.selectedSkills.filter(s => s !== skill) : [...d.selectedSkills, skill]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-['Syne'] font-extrabold text-[--ag-text]">Technical Skills</h2>
        <span className="text-xs text-[--ag-muted] font-['JetBrains_Mono']">{d.selectedSkills.length} selected</span>
      </div>

      {Object.entries(TECH_SKILLS_BY_CATEGORY).map(([cat, skills]) => (
        <div key={cat} className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[--ag-muted]">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => {
              const on = d.selectedSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggle(skill)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold border transition-all flex items-center gap-1.5",
                    on
                      ? "bg-[--ag-accent] text-[#07080F] border-[--ag-accent]"
                      : "bg-[--ag-bg] border-[--ag-border] text-[--ag-muted] hover:border-[--ag-accent]/40 hover:text-[--ag-text]",
                  )}
                >
                  {on && <Check className="h-3 w-3" />} {skill}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="space-y-2 pt-2 border-t border-[--ag-border]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[--ag-muted]">Additional / Custom Skills</p>
        <Textarea
          value={d.customSkills}
          onChange={v => set("customSkills", v)}
          placeholder="Type any skills not listed above, comma-separated e.g. Selenium, Prisma ORM, Socket.io"
          rows={2}
        />
      </div>
    </div>
  );
}

function Step6({ d, set }: { d: ResumeData; set: (k: keyof ResumeData, v: unknown) => void }) {
  const update = (i: number, key: keyof LangEntry, val: string) => {
    const updated = d.languages.map((l, idx) => idx === i ? { ...l, [key]: val } : l);
    set("languages", updated);
  };
  const add    = () => set("languages", [...d.languages, { language: "", proficiency: "Intermediate" }]);
  const remove = (i: number) => set("languages", d.languages.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-['Syne'] font-extrabold text-[--ag-text]">Languages</h2>
      <p className="text-xs text-[--ag-muted]">Languages you can communicate in (spoken / written).</p>

      <div className="space-y-3">
        {d.languages.map((lang, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <Field label="Language">
              <SelectOrCustom value={lang.language} onChange={v => update(i, "language", v)} options={SPOKEN_LANGUAGES} placeholder="Select…" />
            </Field>
            <Field label="Proficiency">
              <Select value={lang.proficiency} onChange={v => update(i, "proficiency", v)} options={PROFICIENCY_LEVELS} />
            </Field>
            <button type="button" onClick={() => remove(i)} disabled={d.languages.length <= 1}
              className="p-2 text-[--ag-danger] hover:bg-[--ag-danger]/10 border border-[--ag-border] disabled:opacity-30 disabled:cursor-not-allowed transition-colors mb-0.5"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add}
        className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[--ag-accent] border border-[--ag-accent]/30 hover:bg-[--ag-accent-dim] transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Add Language
      </button>
    </div>
  );
}

function Step7({ d, set }: { d: ResumeData; set: (k: keyof ResumeData, v: unknown) => void }) {
  const update = (i: number, key: keyof ProjectEntry, val: string) => {
    set("projects", d.projects.map((p, idx) => idx === i ? { ...p, [key]: val } : p));
  };
  const add    = () => set("projects", [...d.projects, { ...EMPTY_PROJECT }]);
  const remove = (i: number) => set("projects", d.projects.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-['Syne'] font-extrabold text-[--ag-text]">Projects</h2>

      {d.projects.map((proj, i) => (
        <div key={i} className="rounded-none border border-[--ag-border] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-accent]">Project {i + 1}</p>
            <button type="button" onClick={() => remove(i)} disabled={d.projects.length <= 1}
              className="text-[--ag-danger] hover:bg-[--ag-danger]/10 p-1 disabled:opacity-30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Project Name" required>
              <Input value={proj.name} onChange={v => update(i, "name", v)} placeholder="SkillMatch AI" />
            </Field>
            <Field label="Year">
              <Select value={proj.year} onChange={v => update(i, "year", v)} options={YEARS_PAST} placeholder="Year…" />
            </Field>
          </div>
          <Field label="Description" hint="2–3 sentences: what it does, what you built, impact">
            <Textarea value={proj.description} onChange={v => update(i, "description", v)} placeholder="Built a full-stack job-matching platform with React and Supabase…" />
          </Field>
          <Field label="Tech Stack Used" hint="Comma-separated: React, TypeScript, Supabase, Tailwind CSS">
            <Input value={proj.techStack} onChange={v => update(i, "techStack", v)} placeholder="React, TypeScript, Node.js, PostgreSQL" />
          </Field>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="GitHub Link">
              <Input value={proj.github} onChange={v => update(i, "github", v)} placeholder="https://github.com/…" />
            </Field>
            <Field label="Live Demo Link">
              <Input value={proj.live} onChange={v => update(i, "live", v)} placeholder="https://…" />
            </Field>
          </div>
        </div>
      ))}

      <button type="button" onClick={add}
        className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[--ag-accent] border border-[--ag-accent]/30 hover:bg-[--ag-accent-dim] transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Add Project
      </button>
    </div>
  );
}

function Step8({ d, set }: { d: ResumeData; set: (k: keyof ResumeData, v: unknown) => void }) {
  const update = (i: number, key: keyof InternEntry, val: unknown) => {
    set("internships", d.internships.map((p, idx) => idx === i ? { ...p, [key]: val } : p));
  };
  const add    = () => set("internships", [...d.internships, { ...EMPTY_INTERN }]);
  const remove = (i: number) => set("internships", d.internships.filter((_, idx) => idx !== i));

  const monthOpts = MONTHS;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-['Syne'] font-extrabold text-[--ag-text]">Internships & Work Experience</h2>
      <p className="text-xs text-[--ag-muted]">Include internships, part-time work, freelance projects, and full-time jobs.</p>

      {d.internships.length === 0 && (
        <div className="py-8 text-center border border-dashed border-[--ag-border] text-[--ag-muted]">
          <Briefcase className="h-6 w-6 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No internships added yet.</p>
        </div>
      )}

      {d.internships.map((intern, i) => (
        <div key={i} className="rounded-none border border-[--ag-border] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-accent]">Experience {i + 1}</p>
            <button type="button" onClick={() => remove(i)} className="text-[--ag-danger] p-1 hover:bg-[--ag-danger]/10 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Company / Organisation" required>
              <Input value={intern.company} onChange={v => update(i, "company", v)} placeholder="Google India" />
            </Field>
            <Field label="Role / Position" required>
              <Input value={intern.role} onChange={v => update(i, "role", v)} placeholder="Software Engineering Intern" />
            </Field>
          </div>
          <div className="grid md:grid-cols-4 gap-2">
            <Field label="Start Month">
              <Select value={intern.startMonth} onChange={v => update(i, "startMonth", v)} options={monthOpts} placeholder="Month" />
            </Field>
            <Field label="Start Year">
              <Select value={intern.startYear} onChange={v => update(i, "startYear", v)} options={YEARS_PAST} placeholder="Year" />
            </Field>
            <Field label="End Month">
              <Select value={intern.endMonth} onChange={v => update(i, "endMonth", v)} options={monthOpts} placeholder="Month" />
            </Field>
            <Field label="End Year">
              <Select value={intern.endYear} onChange={v => update(i, "endYear", v)} options={YEARS_PAST} placeholder="Year" />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`current-${i}`}
              checked={intern.current}
              onChange={e => update(i, "current", e.target.checked)}
              className="accent-[--ag-accent]"
            />
            <label htmlFor={`current-${i}`} className="text-xs text-[--ag-muted] cursor-pointer">Currently working here</label>
          </div>
          <Field label="Key Responsibilities / Achievements" hint="Use bullet-style lines — what you built, metrics, impact">
            <Textarea value={intern.description} onChange={v => update(i, "description", v)} placeholder="• Built REST APIs using FastAPI, reduced response time by 30%&#10;• Collaborated with 4-member agile team using Jira" rows={4} />
          </Field>
        </div>
      ))}

      <button type="button" onClick={add}
        className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[--ag-accent] border border-[--ag-accent]/30 hover:bg-[--ag-accent-dim] transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Add Experience
      </button>
    </div>
  );
}

function Step9({ d, set }: { d: ResumeData; set: (k: keyof ResumeData, v: unknown) => void }) {
  const updateA = (i: number, key: keyof AchievEntry, val: string) => {
    set("achievements", d.achievements.map((a, idx) => idx === i ? { ...a, [key]: val } : a));
  };
  const addA    = () => set("achievements", [...d.achievements, { ...EMPTY_ACHIEV }]);
  const removeA = (i: number) => set("achievements", d.achievements.filter((_, idx) => idx !== i));

  const updateC = (i: number, key: keyof CertEntry, val: string) => {
    set("certifications", d.certifications.map((c, idx) => idx === i ? { ...c, [key]: val } : c));
  };
  const addC    = () => set("certifications", [...d.certifications, { ...EMPTY_CERT }]);
  const removeC = (i: number) => set("certifications", d.certifications.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-['Syne'] font-extrabold text-[--ag-text]">Achievements & Certifications</h2>

      {/* Achievements */}
      <div className="space-y-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-accent]">Achievements / Awards / Positions of Responsibility</p>

        {d.achievements.length === 0 && (
          <div className="py-6 text-center border border-dashed border-[--ag-border] text-[--ag-muted]">
            <p className="text-sm">No achievements added yet.</p>
          </div>
        )}

        {d.achievements.map((a, i) => (
          <div key={i} className="rounded-none border border-[--ag-border] p-4 space-y-3">
            <div className="flex justify-between">
              <p className="text-[10px] font-bold text-[--ag-muted] uppercase tracking-wider">Achievement {i + 1}</p>
              <button type="button" onClick={() => removeA(i)} className="text-[--ag-danger] p-1 hover:bg-[--ag-danger]/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Title" required>
                <Input value={a.title} onChange={v => updateA(i, "title", v)} placeholder="1st Place — Smart India Hackathon 2024" />
              </Field>
              <Field label="Category">
                <SelectOrCustom value={a.category} onChange={v => updateA(i, "category", v)} options={ACHIEVEMENT_CATEGORIES} placeholder="Select category…" />
              </Field>
              <Field label="Issuer / Context">
                <Input value={a.issuer} onChange={v => updateA(i, "issuer", v)} placeholder="e.g. AICTE, College, LeetCode" />
              </Field>
              <Field label="Year">
                <Select value={a.year} onChange={v => updateA(i, "year", v)} options={YEARS_PAST} placeholder="Year…" />
              </Field>
            </div>
            <Field label="Description (optional)">
              <Input value={a.description} onChange={v => updateA(i, "description", v)} placeholder="Brief context or impact…" />
            </Field>
          </div>
        ))}

        <button type="button" onClick={addA}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[--ag-accent] border border-[--ag-accent]/30 hover:bg-[--ag-accent-dim] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Achievement
        </button>
      </div>

      {/* Certifications */}
      <div className="space-y-4 pt-4 border-t border-[--ag-border]">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-accent]">Certifications</p>

        {d.certifications.length === 0 && (
          <div className="py-6 text-center border border-dashed border-[--ag-border] text-[--ag-muted]">
            <p className="text-sm">No certifications added yet.</p>
          </div>
        )}

        {d.certifications.map((c, i) => (
          <div key={i} className="rounded-none border border-[--ag-border] p-4 space-y-3">
            <div className="flex justify-between">
              <p className="text-[10px] font-bold text-[--ag-muted] uppercase tracking-wider">Certification {i + 1}</p>
              <button type="button" onClick={() => removeC(i)} className="text-[--ag-danger] p-1 hover:bg-[--ag-danger]/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Certification Name" required>
                <Input value={c.name} onChange={v => updateC(i, "name", v)} placeholder="AWS Solutions Architect – Associate" />
              </Field>
              <Field label="Issuer">
                <SelectOrCustom value={c.issuer} onChange={v => updateC(i, "issuer", v)} options={CERTIFICATION_ISSUERS} placeholder="Select issuer…" />
              </Field>
              <Field label="Year">
                <Select value={c.year} onChange={v => updateC(i, "year", v)} options={YEARS_PAST} placeholder="Year…" />
              </Field>
              <Field label="Credential / Certificate URL">
                <Input value={c.credentialUrl} onChange={v => updateC(i, "credentialUrl", v)} placeholder="https://…" />
              </Field>
            </div>
          </div>
        ))}

        <button type="button" onClick={addC}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[--ag-accent] border border-[--ag-accent]/30 hover:bg-[--ag-accent-dim] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Certification
        </button>
      </div>
    </div>
  );
}

// ─── Resume preview / print ───────────────────────────────────────────────────

function ResumePreview({ d }: { d: ResumeData }) {
  const allSkills = [
    ...d.selectedSkills,
    ...d.customSkills.split(",").map(s => s.trim()).filter(Boolean),
  ];

  return (
    <div id="resume-preview" className="bg-white text-gray-900 p-8 text-sm font-sans leading-relaxed max-w-[800px] mx-auto shadow-lg">
      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-3 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{d.fullName || "Your Name"}</h1>
            {d.careerGoal && <p className="text-sm font-semibold text-gray-600 mt-0.5">{d.careerGoal}</p>}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-gray-600">
              {d.email   && <span>{d.email}</span>}
              {d.phone   && <span>• {d.phone}</span>}
              {d.location && <span>• {d.location}</span>}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-600">
              {d.linkedin  && <span>LinkedIn: {d.linkedin.replace("https://", "")}</span>}
              {d.github    && <span>• GitHub: {d.github.replace("https://", "")}</span>}
              {d.portfolio && <span>• Portfolio: {d.portfolio.replace("https://", "")}</span>}
            </div>
          </div>
          {d.photoUrl && (
            <img src={d.photoUrl} alt="Photo" className="w-20 h-20 object-cover rounded border border-gray-300 shrink-0" />
          )}
        </div>
      </div>

      {/* Objective */}
      {d.objective && (
        <section className="mb-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 border-b border-gray-300 pb-0.5 mb-2">Career Objective</h2>
          <p className="text-xs text-gray-700 leading-relaxed">{d.objective}</p>
        </section>
      )}

      {/* Education */}
      <section className="mb-4">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 border-b border-gray-300 pb-0.5 mb-2">Education</h2>
        {d.eduDeg.college && (
          <div className="mb-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">{d.eduDeg.degree}{d.eduDeg.branch ? ` — ${d.eduDeg.branch}` : ""}</p>
                <p className="text-xs text-gray-600">{d.eduDeg.college}{d.eduDeg.university ? `, ${d.eduDeg.university}` : ""}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                {d.eduDeg.score && <p className="font-bold text-xs">{d.eduDeg.score} {d.eduDeg.scoreType}</p>}
                {d.eduDeg.startYear && <p className="text-xs text-gray-500">{d.eduDeg.startYear} – {d.eduDeg.endYear || "Present"}</p>}
              </div>
            </div>
          </div>
        )}
        {d.edu12.school && (
          <div className="mb-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">{d.edu12.stream || "12th / HSC"}</p>
                <p className="text-xs text-gray-600">{d.edu12.school}{d.edu12.board ? `, ${d.edu12.board}` : ""}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                {d.edu12.score && <p className="font-bold text-xs">{d.edu12.score} {d.edu12.scoreType}</p>}
                {d.edu12.year  && <p className="text-xs text-gray-500">{d.edu12.year}</p>}
              </div>
            </div>
          </div>
        )}
        {d.edu10.school && (
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-900">10th / SSC</p>
                <p className="text-xs text-gray-600">{d.edu10.school}{d.edu10.board ? `, ${d.edu10.board}` : ""}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                {d.edu10.score && <p className="font-bold text-xs">{d.edu10.score} {d.edu10.scoreType}</p>}
                {d.edu10.year  && <p className="text-xs text-gray-500">{d.edu10.year}</p>}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Skills */}
      {allSkills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 border-b border-gray-300 pb-0.5 mb-2">Technical Skills</h2>
          <p className="text-xs text-gray-700">{allSkills.join(" · ")}</p>
        </section>
      )}

      {/* Projects */}
      {d.projects.some(p => p.name) && (
        <section className="mb-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 border-b border-gray-300 pb-0.5 mb-2">Projects</h2>
          {d.projects.filter(p => p.name).map((proj, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-start">
                <p className="font-bold text-gray-900">{proj.name}
                  {proj.github && <a href={proj.github} className="ml-2 text-blue-600 font-normal text-[10px]">GitHub ↗</a>}
                  {proj.live && <a href={proj.live} className="ml-2 text-blue-600 font-normal text-[10px]">Live ↗</a>}
                </p>
                {proj.year && <span className="text-xs text-gray-500">{proj.year}</span>}
              </div>
              {proj.techStack && <p className="text-[10px] text-gray-500 italic mb-0.5">{proj.techStack}</p>}
              {proj.description && <p className="text-xs text-gray-700">{proj.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Internships */}
      {d.internships.some(i => i.company) && (
        <section className="mb-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 border-b border-gray-300 pb-0.5 mb-2">Work Experience & Internships</h2>
          {d.internships.filter(i => i.company).map((intern, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900">{intern.role}</p>
                  <p className="text-xs text-gray-600">{intern.company}</p>
                </div>
                <p className="text-xs text-gray-500 shrink-0 ml-4">
                  {intern.startMonth} {intern.startYear}
                  {intern.current ? " – Present" : (intern.endMonth ? ` – ${intern.endMonth} ${intern.endYear}` : "")}
                </p>
              </div>
              {intern.description && (
                <div className="mt-1">
                  {intern.description.split("\n").filter(Boolean).map((line, li) => (
                    <p key={li} className="text-xs text-gray-700">{line}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Achievements */}
      {d.achievements.some(a => a.title) && (
        <section className="mb-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 border-b border-gray-300 pb-0.5 mb-2">Achievements & Awards</h2>
          {d.achievements.filter(a => a.title).map((a, i) => (
            <div key={i} className="flex justify-between mb-1.5">
              <div>
                <span className="font-bold text-gray-900 text-xs">{a.title}</span>
                {a.issuer && <span className="text-gray-500 text-xs"> — {a.issuer}</span>}
                {a.description && <span className="text-gray-600 text-[10px] block">{a.description}</span>}
              </div>
              {a.year && <span className="text-xs text-gray-500 shrink-0 ml-4">{a.year}</span>}
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {d.certifications.some(c => c.name) && (
        <section className="mb-4">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 border-b border-gray-300 pb-0.5 mb-2">Certifications</h2>
          {d.certifications.filter(c => c.name).map((c, i) => (
            <div key={i} className="flex justify-between mb-1.5">
              <div>
                <span className="font-bold text-gray-900 text-xs">{c.name}</span>
                {c.issuer && <span className="text-gray-500 text-xs"> — {c.issuer}</span>}
                {c.credentialUrl && <a href={c.credentialUrl} className="text-blue-600 text-[10px] block">View Credential ↗</a>}
              </div>
              {c.year && <span className="text-xs text-gray-500 shrink-0 ml-4">{c.year}</span>}
            </div>
          ))}
        </section>
      )}

      {/* Languages */}
      {d.languages.some(l => l.language) && (
        <section>
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-700 border-b border-gray-300 pb-0.5 mb-2">Languages</h2>
          <p className="text-xs text-gray-700">
            {d.languages.filter(l => l.language).map(l => `${l.language} (${l.proficiency})`).join(" · ")}
          </p>
        </section>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const ResumeBuilder = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [data, setDataRaw] = useState<ResumeData>(() =>
    user ? loadData(user.id) : blank(),
  );
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Pre-fill from profile on first load
  useEffect(() => {
    if (user && profile) {
      const saved = localStorage.getItem(lsKey(user.id));
      if (!saved) {
        setDataRaw(prev => ({
          ...prev,
          fullName:   profile.full_name || "",
          email:      profile.email || "",
          linkedin:   profile.linkedin_url || "",
          github:     profile.github_url || "",
          portfolio:  profile.portfolio_url || "",
          careerGoal: profile.career_goal
            ? CAREER_PATHS[profile.career_goal as CareerPathKey]?.label || ""
            : "",
          selectedSkills: profile.skills || [],
        }));
      }
    }
  }, [user?.id, profile]);

  const set = (k: keyof ResumeData, v: unknown) => {
    setDataRaw(prev => {
      const next = { ...prev, [k]: v };
      if (user) saveData(user.id, next);
      return next;
    });
  };

  const setEdu = (section: "edu10" | "edu12" | "eduDeg" | "eduPG", key: string, value: unknown) => {
    setDataRaw(prev => {
      const next = { ...prev, [section]: { ...(prev[section] as Record<string, unknown>), [key]: value } };
      if (user) saveData(user.id, next);
      return next;
    });
  };

  const goNext = () => {
    setStep(s => Math.min(s + 1, STEPS.length));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const goPrev = () => {
    setStep(s => Math.max(s - 1, 1));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[--ag-bg]">
      <DashboardSidebar />
      <div className="pl-64 min-h-screen transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 space-y-6" ref={topRef}>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight flex items-center gap-3">
                <FileText className="h-8 w-8 text-[--ag-accent]" />
                Resume Builder
              </h1>
              <p className="text-sm text-[--ag-muted] mt-1">
                Build a professional resume step by step · Auto-saved to your browser
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(p => !p)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-[--ag-border] text-[--ag-muted] hover:border-[--ag-accent]/40 hover:text-[--ag-text] transition-colors"
              >
                {showPreview ? "← Back to Editor" : "Preview Resume"}
              </button>
              {showPreview && (
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[--ag-accent] text-[#07080F] hover:brightness-110 transition-all"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                </button>
              )}
            </div>
          </div>

          {showPreview ? (
            /* ── Preview mode ── */
            <div>
              <style>{`@media print { .no-print { display: none !important; } #resume-preview { box-shadow: none; margin: 0; } }`}</style>
              <ResumePreview d={data} />
            </div>
          ) : (
            /* ── Editor mode ── */
            <div className="grid lg:grid-cols-[220px_1fr] gap-6">

              {/* Step nav */}
              <div className="no-print space-y-1">
                {STEPS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setStep(id); topRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all border-l-2",
                      step === id
                        ? "text-[--ag-accent] border-[--ag-accent] bg-[--ag-surface]"
                        : "text-[--ag-muted] border-transparent hover:text-[--ag-text] hover:border-[--ag-border]",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-xs">{label}</span>
                    {step > id && <Check className="h-3 w-3 ml-auto text-[--ag-success]" />}
                  </button>
                ))}
              </div>

              {/* Step content */}
              <div className="rounded-none bg-[--ag-surface] border border-[--ag-border] p-6">
                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-[10px] text-[--ag-muted] mb-1.5">
                    <span className="font-bold uppercase tracking-wider">Step {step} of {STEPS.length}</span>
                    <span>{Math.round((step / STEPS.length) * 100)}% complete</span>
                  </div>
                  <div className="h-1.5 bg-[--ag-bg] border border-[--ag-border] overflow-hidden">
                    <div
                      className="h-full bg-[--ag-accent] transition-all duration-500"
                      style={{ width: `${(step / STEPS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Step content */}
                {step === 1 && <Step1 d={data} set={set} />}
                {step === 2 && <Step2 d={data} set={set} />}
                {step === 3 && <Step3 d={data} set={set} profile={profile} />}
                {step === 4 && <Step4 d={data} setEdu={setEdu} set={set} />}
                {step === 5 && <Step5 d={data} set={set} />}
                {step === 6 && <Step6 d={data} set={set} />}
                {step === 7 && <Step7 d={data} set={set} />}
                {step === 8 && <Step8 d={data} set={set} />}
                {step === 9 && <Step9 d={data} set={set} />}

                {/* Nav buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-[--ag-border]">
                  <button
                    onClick={goPrev}
                    disabled={step === 1}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-[--ag-border] text-[--ag-muted] hover:text-[--ag-text] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>

                  {step < STEPS.length ? (
                    <button
                      onClick={goNext}
                      className="flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider bg-[--ag-accent] text-[#07080F] hover:brightness-110 transition-all"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider bg-[--ag-success] text-white hover:brightness-110 transition-all"
                    >
                      <FileText className="h-4 w-4" /> Preview Resume
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResumeBuilder;
