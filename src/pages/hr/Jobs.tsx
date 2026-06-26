import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/hr/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { SKILL_POOLS } from "@/data/skillPools";
import {
  Briefcase, MapPin, Clock, Users, Plus, Search,
  X, ChevronDown, ToggleLeft, ToggleRight, Pencil, Trash2, FileText,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Freelance"];
const EXPERIENCE_LEVELS = ["Fresher (0 yrs)", "Junior (1–2 yrs)", "Mid-level (3–5 yrs)", "Senior (5–8 yrs)", "Lead / Principal (8+ yrs)"];
const WORK_MODES = ["On-site", "Hybrid", "Remote"];
const SALARY_RANGES = [
  "Under ₹3 LPA", "₹3–5 LPA", "₹5–8 LPA", "₹8–12 LPA",
  "₹12–18 LPA", "₹18–25 LPA", "₹25–35 LPA", "₹35+ LPA",
  "Under ₹10K/mo", "₹10K–20K/mo", "₹20K–40K/mo", "₹40K+/mo",
  "Negotiable",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobPosting {
  id: string;
  employer_id: string;
  title: string;
  description: string | null;
  required_skills: string[];
  location: string | null;
  salary_range: string | null;
  job_type: string;
  experience_level: string | null;
  work_mode: string | null;
  career_domain: string | null;
  is_active: boolean;
  created_at: string;
  _app_count?: number;
}

const emptyForm = {
  title: "",
  description: "",
  career_domain: "" as CareerPathKey | "",
  job_type: "Full-time",
  experience_level: "",
  work_mode: "On-site",
  location: "",
  salary_range: "",
  required_skills: [] as string[],
};

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function getDescriptionTemplate(domain: CareerPathKey | "", jobType: string, title: string): string {
  const path = domain ? CAREER_PATHS[domain] : null;
  const roleLabel = title.trim() || (path?.label ?? "Professional");
  const skills = path?.coreSkills.slice(0, 3).join(", ") ?? "Relevant technical skills";
  const expLine = jobType === "Internship"
    ? "Currently pursuing or recently completed a relevant degree"
    : "2+ years of relevant hands-on experience";

  return `We are looking for a talented ${roleLabel} to join our growing team.

Responsibilities:
- [Key responsibility 1]
- [Key responsibility 2]
- [Key responsibility 3]
- Collaborate effectively with cross-functional teams

Requirements:
- Strong proficiency in ${skills}
- ${expLine}
- Strong problem-solving and communication skills

What we offer:
- Competitive salary and performance bonuses
- ${jobType === "Remote" ? "Fully remote" : "Flexible"} work environment
- Mentorship, growth, and learning opportunities`;
}

// ─── Reusable select ─────────────────────────────────────────────────────────

function Sel({ value, onChange, options, placeholder, className }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-10 rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 pr-8 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] appearance-none">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[--ag-muted] pointer-events-none" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Jobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const domainSkills = form.career_domain ? (SKILL_POOLS[form.career_domain as CareerPathKey] ?? []) : [];

  const fetchJobs = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("job_postings")
      .select("*, applications(id)")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setJobs(data.map((j: any) => ({ ...j, _app_count: j.applications?.length ?? 0 })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [user]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setSkillInput("");
    setSkillSuggestions([]);
    setShowForm(true);
  };

  const openEdit = (job: JobPosting) => {
    setEditId(job.id);
    setForm({
      title: job.title,
      description: job.description ?? "",
      career_domain: (job.career_domain as CareerPathKey) ?? "",
      job_type: job.job_type,
      experience_level: job.experience_level ?? "",
      work_mode: job.work_mode ?? "On-site",
      location: job.location ?? "",
      salary_range: job.salary_range ?? "",
      required_skills: job.required_skills ?? [],
    });
    setSkillInput("");
    setSkillSuggestions([]);
    setShowForm(true);
  };

  const updateSkillSuggestions = (input: string) => {
    if (!input.trim()) { setSkillSuggestions([]); return; }
    const q = input.toLowerCase();
    const pool = [...domainSkills, ...Object.values(SKILL_POOLS).flat()];
    const unique = Array.from(new Set(pool));
    setSkillSuggestions(
      unique.filter(s => s.toLowerCase().includes(q) && !form.required_skills.includes(s)).slice(0, 8)
    );
  };

  const addSkill = (s: string) => {
    const t = s.trim();
    if (t && !form.required_skills.includes(t)) {
      setForm(f => ({ ...f, required_skills: [...f.required_skills, t] }));
    }
    setSkillInput(""); setSkillSuggestions([]);
  };

  const removeSkill = (s: string) =>
    setForm(f => ({ ...f, required_skills: f.required_skills.filter(x => x !== s) }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !user) return;
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      career_domain: form.career_domain || null,
      job_type: form.job_type,
      experience_level: form.experience_level || null,
      work_mode: form.work_mode || null,
      location: form.location.trim() || null,
      salary_range: form.salary_range || null,
      required_skills: form.required_skills,
      updated_at: new Date().toISOString(),
    };
    if (editId) {
      const { error } = await (supabase as any).from("job_postings").update(payload).eq("id", editId);
      if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
      else toast({ title: "Job updated!" });
    } else {
      const { error } = await (supabase as any).from("job_postings").insert({ ...payload, employer_id: user.id });
      if (error) toast({ title: "Post failed", description: error.message, variant: "destructive" });
      else toast({ title: "Job posted!", description: "Job seekers can now apply." });
    }
    setSubmitting(false);
    setShowForm(false);
    fetchJobs();
  };

  const toggleActive = async (job: JobPosting) => {
    await (supabase as any).from("job_postings").update({ is_active: !job.is_active }).eq("id", job.id);
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: !j.is_active } : j));
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this job posting?")) return;
    await (supabase as any).from("job_postings").delete().eq("id", id);
    setJobs(prev => prev.filter(j => j.id !== id));
    toast({ title: "Job deleted" });
  };

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.location ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const domainLabel = (key: string | null) =>
    key && CAREER_PATHS[key as CareerPathKey] ? CAREER_PATHS[key as CareerPathKey].label : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-['Syne'] font-extrabold text-[--ag-text]">Job Openings</h1>
            <p className="text-[--ag-muted] text-sm mt-0.5">Manage your active postings and track applicants</p>
          </div>
          <Button onClick={openCreate} className="gap-2 rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest hover:brightness-110">
            <Plus className="h-4 w-4" /> Post New Job
          </Button>
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <div className="border border-[--ag-accent] bg-[--ag-surface] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-['Syne'] font-bold text-[--ag-text]">{editId ? "Edit Job" : "Post a New Job"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[--ag-muted] hover:text-[--ag-text]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-[--ag-text] font-semibold">Job Title *</Label>
                <Input placeholder="e.g. Senior Backend Developer"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]" />
              </div>

              {/* Career Domain */}
              <div className="space-y-1.5">
                <Label className="text-[--ag-text] font-semibold">Career Domain</Label>
                <div className="relative">
                  <select
                    value={form.career_domain}
                    onChange={e => setForm(f => ({ ...f, career_domain: e.target.value as CareerPathKey | "" }))}
                    className="w-full h-10 rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 pr-8 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] appearance-none"
                  >
                    <option value="">Select domain</option>
                    {Object.values(CAREER_PATHS).map(p => (
                      <option key={p.key} value={p.key}>{p.emoji} {p.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[--ag-muted] pointer-events-none" />
                </div>
              </div>

              {/* Job Type */}
              <div className="space-y-1.5">
                <Label className="text-[--ag-text] font-semibold">Job Type</Label>
                <Sel value={form.job_type} onChange={v => setForm(f => ({ ...f, job_type: v }))} options={JOB_TYPES} />
              </div>

              {/* Experience Level */}
              <div className="space-y-1.5">
                <Label className="text-[--ag-text] font-semibold">Experience Level</Label>
                <Sel value={form.experience_level} onChange={v => setForm(f => ({ ...f, experience_level: v }))}
                  options={EXPERIENCE_LEVELS} placeholder="Any level" />
              </div>

              {/* Work Mode */}
              <div className="space-y-1.5">
                <Label className="text-[--ag-text] font-semibold">Work Mode</Label>
                <Sel value={form.work_mode} onChange={v => setForm(f => ({ ...f, work_mode: v }))} options={WORK_MODES} />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label className="text-[--ag-text] font-semibold">Location</Label>
                <Input placeholder="e.g. Bangalore, India"
                  value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]" />
              </div>

              {/* Salary */}
              <div className="space-y-1.5">
                <Label className="text-[--ag-text] font-semibold">Salary / Stipend</Label>
                <Sel value={form.salary_range} onChange={v => setForm(f => ({ ...f, salary_range: v }))}
                  options={SALARY_RANGES} placeholder="Select range" />
              </div>

              {/* Required Skills */}
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-[--ag-text] font-semibold">Required Skills</Label>

                {/* Domain skill quick-add */}
                {domainSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {domainSkills.filter(s => !form.required_skills.includes(s)).slice(0, 10).map(s => (
                      <button key={s} onClick={() => addSkill(s)}
                        className="flex items-center gap-1 px-2 py-0.5 border border-dashed border-[--ag-border] text-[--ag-muted] text-xs hover:border-[--ag-accent] hover:text-[--ag-accent] transition-colors">
                        <Plus className="h-2.5 w-2.5" /> {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Type skill + Enter"
                      value={skillInput}
                      onChange={e => { setSkillInput(e.target.value); updateSkillSuggestions(e.target.value); }}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (skillInput.trim()) addSkill(skillInput); } }}
                      onBlur={() => setTimeout(() => setSkillSuggestions([]), 150)}
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

                {form.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.required_skills.map(s => (
                      <span key={s} className="flex items-center gap-1.5 px-2.5 py-1 bg-[--ag-accent-dim] border border-[--ag-accent]/30 text-[--ag-accent] text-xs font-bold">
                        {s}
                        <button onClick={() => removeSkill(s)} className="hover:text-[--ag-danger]"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[--ag-text] font-semibold">Job Description</Label>
                  <button
                    onClick={() => setForm(f => ({ ...f, description: getDescriptionTemplate(f.career_domain, f.job_type, f.title) }))}
                    className="flex items-center gap-1.5 text-xs text-[--ag-accent] hover:underline transition-colors">
                    <FileText className="h-3.5 w-3.5" /> Use template
                  </button>
                </div>
                <textarea rows={6} placeholder="Describe the role, responsibilities, and what you're looking for…"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 py-2 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-[--ag-border]">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-[--ag-muted]">Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting || !form.title.trim()}
                className="rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-40">
                {submitting ? "Saving…" : editId ? "Save Changes" : "Post Job"}
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--ag-muted]" />
          <Input placeholder="Search jobs…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent]" />
        </div>

        {/* Jobs list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[--ag-surface] border border-[--ag-border] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[--ag-border]">
            <Briefcase className="h-10 w-10 text-[--ag-border] mx-auto mb-3" />
            <p className="font-bold text-[--ag-muted]">{search ? "No jobs match your search" : "No job postings yet"}</p>
            {!search && (
              <button onClick={openCreate} className="mt-2 text-sm text-[--ag-accent] hover:underline">Post your first job →</button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(job => (
              <div key={job.id} className={`bg-[--ag-surface] border p-5 transition-all ${job.is_active ? "border-[--ag-border]" : "border-[--ag-border] opacity-60"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-['Syne'] font-bold text-[--ag-text]">{job.title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 ${job.is_active ? "text-[--ag-success] bg-[--ag-success]/10" : "text-[--ag-muted] bg-[--ag-border]/50"}`}>
                        {job.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[--ag-muted] mb-3">
                      {job.career_domain && <span className="font-semibold text-[--ag-accent]">{domainLabel(job.career_domain)}</span>}
                      {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.job_type}</span>
                      {job.work_mode && job.work_mode !== "On-site" && (
                        <span className="px-1.5 py-0.5 bg-[--ag-bg] border border-[--ag-border] text-xs font-bold text-[--ag-muted]">{job.work_mode}</span>
                      )}
                      {job.experience_level && <span className="text-[--ag-muted]">{job.experience_level}</span>}
                      {job.salary_range && <span className="font-['JetBrains_Mono'] font-bold text-[--ag-text]">{job.salary_range}</span>}
                    </div>
                    {job.required_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {job.required_skills.map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 bg-[--ag-bg] border border-[--ag-border] text-[--ag-muted] uppercase tracking-wider font-bold">{s}</span>
                        ))}
                      </div>
                    )}
                    {job.description && <p className="text-sm text-[--ag-muted] line-clamp-2">{job.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-[--ag-muted] text-xs">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-bold text-[--ag-text]">{job._app_count}</span> applicants
                    </div>
                    <span className="text-xs text-[--ag-muted]">{relativeDate(job.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-1 border-t border-[--ag-border]">
                  <button onClick={() => navigate(`/hr/candidates?job=${job.id}`)}
                    className="text-xs font-bold text-[--ag-accent] hover:underline">
                    View Applicants ({job._app_count})
                  </button>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleActive(job)}
                      className="flex items-center gap-1 text-xs text-[--ag-muted] hover:text-[--ag-text] transition-colors">
                      {job.is_active
                        ? <><ToggleRight className="h-4 w-4 text-[--ag-success]" /> Pause</>
                        : <><ToggleLeft className="h-4 w-4" /> Activate</>}
                    </button>
                    <button onClick={() => openEdit(job)} className="text-xs text-[--ag-muted] hover:text-[--ag-accent] transition-colors flex items-center gap-1">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => deleteJob(job.id)} className="text-xs text-[--ag-muted] hover:text-[--ag-danger] transition-colors flex items-center gap-1">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
