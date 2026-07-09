import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { SkillMatchLogo } from "@/components/SkillMatchLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

const STEP_TITLES = ["Your Role", "Company Details"];

const INDUSTRIES = [
    "Technology", "Finance & Banking", "Healthcare", "Education",
    "E-Commerce", "Manufacturing", "Consulting", "Media & Entertainment",
    "Logistics", "Government", "Non-Profit", "Other",
];

const COMPANY_SIZES = [
    "1–10 employees", "11–50 employees", "51–200 employees",
    "201–500 employees", "501–1000 employees", "1000+ employees",
];

export default function EmployerOnboarding() {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);

    // Step 1
    const [yourTitle, setYourTitle] = useState("");
    const [location, setLocation] = useState("");
    const [bio, setBio] = useState("");

    // Step 2
    const [companyName, setCompanyName] = useState("");
    const [industry, setIndustry] = useState("");
    const [companySize, setCompanySize] = useState("");
    const [website, setWebsite] = useState("");
    const [description, setDescription] = useState("");

    const canProceed = () => {
        if (step === 0) return yourTitle.trim() && location.trim();
        if (step === 1) return companyName.trim() && industry;
        return true;
    };

    const handleFinish = async () => {
        if (!user) return;
        setSaving(true);

        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name ?? null,
                role: "employer",
                headline: yourTitle,
                bio: bio || null,
                location,
                company_name: companyName,
                company_industry: industry,
                company_size: companySize || null,
                company_website: website || null,
                company_description: description || null,
                updated_at: new Date().toISOString(),
            }, { onConflict: "id" });

        if (error) {
            toast({ title: "Save failed", description: error.message, variant: "destructive" });
        } else {
            await refreshProfile();
            toast({ title: "Profile complete!", description: "Welcome to SkillMatch ATS." });
            navigate("/hr/dashboard", { replace: true });
        }
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-[--ag-bg] flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-5/12 bg-[--ag-surface] border-r border-[--ag-border] flex-col justify-between p-12">
                <SkillMatchLogo size="md" />
                <div className="space-y-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[--ag-accent] mb-3">
                            HR Portal Setup
                        </p>
                        <h2 className="text-4xl font-['Syne'] font-extrabold text-[--ag-text] leading-tight">
                            Set up your hiring profile.
                        </h2>
                        <p className="mt-3 text-[--ag-muted] leading-relaxed">
                            Tell us about your company so candidates can learn about you and our AI can surface the best matches.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {STEP_TITLES.map((title, i) => (
                            <div key={i} className={`flex items-center gap-3 transition-all ${i === step ? "opacity-100" : i < step ? "opacity-60" : "opacity-30"}`}>
                                <div className={`h-7 w-7 flex items-center justify-center border-2 text-xs font-bold transition-all ${i < step ? "border-[--ag-accent] bg-[--ag-accent] text-white" : i === step ? "border-[--ag-accent] text-[--ag-accent]" : "border-[--ag-border] text-[--ag-muted]"}`}>
                                    {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
                                </div>
                                <span className={`text-sm font-semibold ${i === step ? "text-[--ag-text]" : "text-[--ag-muted]"}`}>
                                    {title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-xs text-[--ag-muted]">© 2026 SkillMatch AI</p>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-lg space-y-8">
                    <div className="lg:hidden flex items-center gap-2 mb-4">
                        {STEP_TITLES.map((_, i) => (
                            <div key={i} className={`h-1 flex-1 transition-all ${i <= step ? "bg-[--ag-accent]" : "bg-[--ag-border]"}`} />
                        ))}
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[--ag-accent] mb-1">
                            Step {step + 1} of {STEP_TITLES.length}
                        </p>
                        <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text]">
                            {STEP_TITLES[step]}
                        </h1>
                    </div>

                    {/* ── STEP 1: Your Role ── */}
                    {step === 0 && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[--ag-text] font-semibold">Your Job Title</Label>
                                <Input
                                    placeholder="e.g. HR Manager, Talent Acquisition Lead"
                                    value={yourTitle}
                                    onChange={e => setYourTitle(e.target.value)}
                                    className="h-11 rounded-none bg-[--ag-surface] border-[--ag-border] focus:border-[--ag-accent]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[--ag-text] font-semibold">Location</Label>
                                <Input
                                    placeholder="e.g. Bangalore, India"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    className="h-11 rounded-none bg-[--ag-surface] border-[--ag-border] focus:border-[--ag-accent]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[--ag-text] font-semibold">About You <span className="text-[--ag-muted] font-normal">(optional)</span></Label>
                                <textarea
                                    rows={3}
                                    placeholder="Brief intro about yourself as a hiring professional..."
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    className="w-full rounded-none border border-[--ag-border] bg-[--ag-surface] px-3 py-2 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Company Details ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-[--ag-text] font-semibold">Company Name</Label>
                                <Input
                                    placeholder="e.g. Acme Technologies"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    className="h-11 rounded-none bg-[--ag-surface] border-[--ag-border] focus:border-[--ag-accent]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[--ag-text] font-semibold">Industry</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {INDUSTRIES.map(ind => (
                                        <button
                                            key={ind}
                                            type="button"
                                            onClick={() => setIndustry(ind)}
                                            className={`px-3 py-2 text-xs font-semibold border text-left transition-all ${industry === ind ? "border-[--ag-accent] bg-[--ag-accent-dim] text-[--ag-accent]" : "border-[--ag-border] text-[--ag-muted] hover:border-[--ag-accent]/40"}`}
                                        >
                                            {ind}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[--ag-text] font-semibold">Company Size <span className="text-[--ag-muted] font-normal">(optional)</span></Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {COMPANY_SIZES.map(size => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => setCompanySize(size)}
                                            className={`px-3 py-2 text-xs font-semibold border text-left transition-all ${companySize === size ? "border-[--ag-accent] bg-[--ag-accent-dim] text-[--ag-accent]" : "border-[--ag-border] text-[--ag-muted] hover:border-[--ag-accent]/40"}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[--ag-text] font-semibold">Company Website <span className="text-[--ag-muted] font-normal">(optional)</span></Label>
                                <Input
                                    placeholder="https://yourcompany.com"
                                    value={website}
                                    onChange={e => setWebsite(e.target.value)}
                                    className="h-11 rounded-none bg-[--ag-surface] border-[--ag-border] focus:border-[--ag-accent]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[--ag-text] font-semibold">Company Description <span className="text-[--ag-muted] font-normal">(optional)</span></Label>
                                <textarea
                                    rows={3}
                                    placeholder="What does your company do? What's the culture like?"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full rounded-none border border-[--ag-border] bg-[--ag-surface] px-3 py-2 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-2">
                        {step > 0 ? (
                            <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="gap-2 text-[--ag-muted] hover:text-[--ag-text]">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        ) : <div />}

                        {step < STEP_TITLES.length - 1 ? (
                            <Button
                                onClick={() => setStep(s => s + 1)}
                                disabled={!canProceed()}
                                className="gap-2 rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-40"
                            >
                                Continue <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleFinish}
                                disabled={saving || !canProceed()}
                                className="gap-2 rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-40"
                            >
                                {saving ? "Saving..." : "Complete Setup"} <CheckCircle className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
