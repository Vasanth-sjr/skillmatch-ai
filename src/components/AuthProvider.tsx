import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { SkillMatchLogo } from "@/components/SkillMatchLogo";
import { ShieldOff } from "lucide-react";

export type UserRole = "student" | "employer" | "admin";

export interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    role: UserRole;
    bio: string | null;
    location: string | null;
    skills: string[];
    avatar_url: string | null;
    headline: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
    education: Array<{
        id?: string;
        degree: string;
        fieldOfStudy?: string;
        institution: string;
        year?: string;
        startYear?: string;
        endYear?: string;
    }>;
    experience: Array<{
        id?: string;
        title: string;
        company: string;
        duration?: string;
        startMonth?: string;
        startYear?: string;
        endMonth?: string;
        endYear?: string;
        current?: boolean;
        description?: string;
    }>;
    company_name: string | null;
    company_industry: string | null;
    company_size: string | null;
    company_website: string | null;
    company_description: string | null;
    career_goal: string | null;
    career_status: string | null;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    userRole: UserRole;
    profile: UserProfile | null;
    profileComplete: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    userRole: "student",
    profile: null,
    profileComplete: false,
    refreshProfile: async () => {},
    signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function resolveRole(user: User | null): UserRole {
    const raw = user?.user_metadata?.role as string | undefined;
    if (raw === "employer" || raw === "admin") return raw;
    return "student";
}

function checkProfileComplete(profile: UserProfile | null, role: UserRole): boolean {
    if (!profile) return false;
    if (role === "employer") return !!profile.company_name;
    // student: just needs a career goal selected
    return !!profile.career_goal;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
        if (data) setProfile(data as UserProfile);
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    };

    useEffect(() => {
        // onAuthStateChange fires on mount (INITIAL_SESSION) + on every auth change.
        // MUST stay synchronous — calling supabase.from() here causes a deadlock
        // because the auth client holds an internal lock while firing this callback.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (!session?.user) {
                    setProfile(null);
                    setLoading(false);
                }
                // If there IS a user: the profile-fetch effect below will clear loading
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Fetch profile whenever the logged-in user changes.
    // Runs outside the auth lock so supabase.from() is safe here.
    useEffect(() => {
        if (user?.id) {
            setLoading(true);
            fetchProfile(user.id).finally(() => setLoading(false));
        }
    }, [user?.id]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    const userRole = resolveRole(user);
    const profileComplete = checkProfileComplete(profile, userRole);

    return (
        <AuthContext.Provider value={{
            user, session, loading,
            userRole, profile, profileComplete,
            refreshProfile, signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function ProtectedRoute({
    children,
    requiredRole,
    skipOnboardingCheck = false,
}: {
    children: ReactNode;
    requiredRole?: UserRole;
    skipOnboardingCheck?: boolean;
}) {
    const { user, loading, userRole, profileComplete, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return;
        if (!user) { navigate("/login", { replace: true }); return; }

        // Redirect to onboarding if profile incomplete (unless already on onboarding)
        if (!skipOnboardingCheck && !profileComplete) {
            const dest = userRole === "employer" ? "/onboarding/employer" : "/onboarding/jobseeker";
            navigate(dest, { replace: true });
            return;
        }
    }, [user, loading, profileComplete, skipOnboardingCheck, userRole, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[--ag-bg]">
                <div className="flex flex-col items-center gap-6">
                    <SkillMatchLogo size="md" iconOnly />
                    <div className="h-[1px] w-[120px] bg-[--ag-border] overflow-hidden">
                        <div className="h-full w-full animate-shimmer" />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Wrong portal — show access-denied screen
    if (requiredRole && userRole !== requiredRole) {
        const myPortalName = userRole === "employer" ? "HR Portal" : "Job Seeker Portal";
        const myPortalPath = userRole === "employer" ? "/hr/dashboard" : "/dashboard";
        const registeredAs  = userRole === "student" ? "Job Seeker" : "Employer";

        return (
            <div className="min-h-screen flex items-center justify-center bg-[--ag-bg]">
                <div className="text-center space-y-6 max-w-sm px-6">
                    <div className="h-20 w-20 border-2 border-[--ag-danger] bg-[--ag-danger]/10 flex items-center justify-center mx-auto">
                        <ShieldOff className="h-10 w-10 text-[--ag-danger]" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-['Syne'] font-extrabold text-[--ag-text]">Not Registered</h2>
                        <p className="text-[--ag-muted] text-sm leading-relaxed">
                            Your account is registered as a{" "}
                            <span className="font-bold text-[--ag-text]">{registeredAs}</span>.
                            You don't have access to this portal.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(myPortalPath, { replace: true })}
                            className="w-full h-11 bg-[--ag-accent] text-white font-bold uppercase tracking-widest text-sm hover:brightness-110 transition-all"
                        >
                            Go to {myPortalName}
                        </button>
                        <button
                            onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
                            className="w-full h-11 border border-[--ag-border] text-[--ag-muted] text-sm font-medium hover:border-[--ag-accent] hover:text-[--ag-accent] transition-all"
                        >
                            Sign out &amp; use a different account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!skipOnboardingCheck && !profileComplete) return null;

    return <>{children}</>;
}
