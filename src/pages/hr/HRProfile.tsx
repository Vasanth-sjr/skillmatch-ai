import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/hr/DashboardLayout";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, User, Globe, Edit3, Check, ChevronDown, MapPin, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "Technology / Software", "Fintech", "E-commerce", "Healthcare / MedTech", "EdTech",
  "SaaS / B2B", "Gaming", "Media & Entertainment", "Consulting", "Manufacturing",
  "Logistics / Supply Chain", "Cybersecurity", "AI / ML", "Blockchain / Web3", "Other",
];
const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, onEdit, editing }: {
  icon: React.ElementType; title: string; onEdit?: () => void; editing?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="font-['Syne'] font-bold text-[--ag-text] flex items-center gap-2 uppercase tracking-wide text-sm">
        <Icon className="h-4 w-4 text-[--ag-accent]" />
        {title}
      </h3>
      {onEdit && !editing && (
        <button onClick={onEdit} className="flex items-center gap-1 text-xs text-[--ag-muted] hover:text-[--ag-accent] transition-colors">
          <Edit3 className="h-3.5 w-3.5" /> Edit
        </button>
      )}
    </div>
  );
}

function Sel({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-10 rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 pr-8 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] appearance-none">
        <option value="">{placeholder ?? "Select…"}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[--ag-muted] pointer-events-none" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HRProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  // Personal
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  // Company
  const [companyName, setCompanyName] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  const [editSection, setEditSection] = useState<"personal" | "company" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setHeadline(profile.headline ?? "");
    setBio(profile.bio ?? "");
    setLocation(profile.location ?? "");
    setCompanyName(profile.company_name ?? "");
    setCompanyIndustry(profile.company_industry ?? "");
    setCompanySize(profile.company_size ?? "");
    setCompanyWebsite(profile.company_website ?? "");
    setCompanyDescription(profile.company_description ?? "");
  }, [profile]);

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
      toast({ title: "Profile updated!" });
      setEditSection(null);
    }
  };

  const initials = (fullName || user?.email || "H").charAt(0).toUpperCase();
  const hasCompany = !!companyName;

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-['Syne'] font-extrabold text-[--ag-text]">My Profile</h1>
          <p className="text-[--ag-muted] text-sm mt-0.5">Your company and personal information visible to candidates</p>
        </div>

        {/* Identity card */}
        <div className="bg-[--ag-surface] border border-[--ag-border] p-6 flex items-center gap-5">
          <div className="h-16 w-16 bg-[--ag-accent] flex items-center justify-center shrink-0">
            <span className="text-2xl font-['Syne'] font-extrabold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-['Syne'] font-extrabold text-xl text-[--ag-text]">{fullName || <span className="text-[--ag-muted]">No name set</span>}</p>
            {headline && <p className="text-[--ag-muted] text-sm mt-0.5">{headline}</p>}
            <p className="text-xs text-[--ag-muted] font-['JetBrains_Mono'] flex items-center gap-1.5 mt-1">
              <Mail className="h-3.5 w-3.5" /> {user?.email}
            </p>
          </div>
          {hasCompany && (
            <div className="text-right shrink-0">
              <p className="font-bold text-[--ag-text] text-sm">{companyName}</p>
              {companyIndustry && <p className="text-xs text-[--ag-muted] mt-0.5">{companyIndustry}</p>}
              {companySize && <p className="text-xs text-[--ag-muted]">{companySize} employees</p>}
            </div>
          )}
        </div>

        {/* Company info */}
        <div className="bg-[--ag-surface] border border-[--ag-border] p-6">
          <SectionHeader icon={Building2} title="Company Info" onEdit={() => setEditSection("company")} editing={editSection === "company"} />

          {editSection === "company" ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Company Name *</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Technologies"
                    className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Industry</Label>
                  <Sel value={companyIndustry} onChange={setCompanyIndustry} options={INDUSTRIES} placeholder="Select industry" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Company Size</Label>
                  <Sel value={companySize} onChange={setCompanySize} options={COMPANY_SIZES} placeholder="Select size" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Website</Label>
                  <Input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://yourcompany.com"
                    className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Company Description</Label>
                  <textarea rows={4} value={companyDescription} onChange={e => setCompanyDescription(e.target.value)}
                    placeholder="What does your company do? What's the culture like? What makes it a great place to work?"
                    className="w-full rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 py-2 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] resize-none" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => save({
                  company_name: companyName.trim() || null,
                  company_industry: companyIndustry || null,
                  company_size: companySize || null,
                  company_website: companyWebsite.trim() || null,
                  company_description: companyDescription.trim() || null,
                })} disabled={saving || !companyName.trim()}
                  className="rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest text-xs">
                  {saving ? "Saving…" : <><Check className="h-3.5 w-3.5 mr-1" />Save Company Info</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditSection(null)} className="rounded-none text-[--ag-muted]">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {hasCompany ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-1">Company</p>
                      <p className="font-bold text-[--ag-text]">{companyName}</p>
                    </div>
                    {companyIndustry && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-1">Industry</p>
                        <p className="text-[--ag-text]">{companyIndustry}</p>
                      </div>
                    )}
                    {companySize && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-1">Team Size</p>
                        <p className="text-[--ag-text]">{companySize} employees</p>
                      </div>
                    )}
                    {companyWebsite && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-1">Website</p>
                        <a href={companyWebsite} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-[--ag-accent] hover:underline text-sm">
                          <Globe className="h-3.5 w-3.5" /> {companyWebsite}
                        </a>
                      </div>
                    )}
                  </div>
                  {companyDescription && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-2">About the company</p>
                      <p className="text-sm text-[--ag-muted] leading-relaxed">{companyDescription}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[--ag-muted]/50 italic">No company info added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Personal info */}
        <div className="bg-[--ag-surface] border border-[--ag-border] p-6">
          <SectionHeader icon={User} title="Personal Info" onEdit={() => setEditSection("personal")} editing={editSection === "personal"} />

          {editSection === "personal" ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Full Name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"
                    className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Job Title / Headline</Label>
                  <Input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Head of Talent Acquisition"
                    className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Location</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mumbai, India"
                    className="rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Email (read-only)</Label>
                  <Input value={user?.email ?? ""} disabled
                    className="rounded-none border-[--ag-border] bg-[--ag-bg] text-[--ag-muted] opacity-60 cursor-not-allowed" />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[--ag-muted]">Bio</Label>
                  <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="A short intro about your role and what you're looking for in candidates…"
                    className="w-full rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 py-2 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] resize-none" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => save({
                  full_name: fullName.trim() || null,
                  headline: headline.trim() || null,
                  bio: bio.trim() || null,
                  location: location.trim() || null,
                })} disabled={saving}
                  className="rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest text-xs">
                  {saving ? "Saving…" : <><Check className="h-3.5 w-3.5 mr-1" />Save Personal Info</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditSection(null)} className="rounded-none text-[--ag-muted]">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-1">Name</p>
                  <p className={cn("text-[--ag-text]", !fullName && "text-[--ag-muted] italic text-sm")}>{fullName || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-1">Title</p>
                  <p className={cn("text-[--ag-text]", !headline && "text-[--ag-muted] italic text-sm")}>{headline || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-1">Email</p>
                  <p className="text-[--ag-text] font-['JetBrains_Mono'] text-sm">{user?.email}</p>
                </div>
                {location && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-1">Location</p>
                    <p className="text-[--ag-text] flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[--ag-muted]" /> {location}</p>
                  </div>
                )}
              </div>
              {bio && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-2">Bio</p>
                  <p className="text-sm text-[--ag-muted] leading-relaxed">{bio}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
