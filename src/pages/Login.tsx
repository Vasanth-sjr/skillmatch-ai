import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkillMatchLogo } from "@/components/SkillMatchLogo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, userRole, loading: authLoading } = useAuth();

    // Auto-redirect if already signed in (e.g. after email confirmation)
    useEffect(() => {
        if (!authLoading && user) {
            navigate(userRole === "employer" ? "/hr/dashboard" : "/dashboard", { replace: true });
        }
    }, [user, userRole, authLoading, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast({
                title: "Login failed",
                description: error.message,
                variant: "destructive",
            });
        } else {
            toast({ title: "Welcome back!", description: "Login successful." });
            const role = data.user?.user_metadata?.role;
            navigate(role === "employer" ? "/hr/dashboard" : "/dashboard");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[--ag-surface] flex">
            {/* Left side - branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[--ag-bg] border-r border-[--ag-border] items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 geometric-pattern-light" />
                <div className="relative text-center text-[--ag-text] space-y-6 px-12">
                    <div className="flex justify-center">
                        <div className="h-20 w-20 rounded-none bg-[--ag-surface] border border-[--ag-border] flex items-center justify-center">
                            <SkillMatchLogo size="lg" iconOnly />
                        </div>
                    </div>
                    <h2 className="text-5xl font-['Syne'] font-extrabold tracking-tight">SkillMatch AI</h2>
                    <p className="text-lg text-[--ag-muted] max-w-md leading-relaxed">
                        Smart, skill-based recruitment powered by AI. Connect the right talent to the right jobs.
                    </p>
                    <div className="flex items-center justify-center gap-8 pt-8">
                        <div className="text-center">
                            <p className="text-4xl font-['JetBrains_Mono'] font-extrabold text-[--ag-accent]">3,500+</p>
                            <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mt-1">Candidates Matched</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-['JetBrains_Mono'] font-extrabold text-[--ag-accent]">95%</p>
                            <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mt-1">Hiring Accuracy</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl font-['JetBrains_Mono'] font-extrabold text-[--ag-accent]">150+</p>
                            <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mt-1">Companies</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden flex justify-center mb-8">
                        <SkillMatchLogo size="lg" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight">Back to your analysis</h1>
                        <p className="text-[--ag-muted]">Sign in to your SkillMatch AI account</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[--ag-text]">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 bg-[--ag-bg] border-[--ag-border] focus:border-[--ag-accent] focus:shadow-[0_0_10px_rgba(0,216,255,0.2)] rounded-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[--ag-text]">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11 pr-10 bg-[--ag-bg] border-[--ag-border] focus:border-[--ag-accent] focus:shadow-[0_0_10px_rgba(0,216,255,0.2)] rounded-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[--ag-muted] hover:text-[--ag-text]"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="hero"
                            className="w-full h-11 gap-2 rounded-none bg-[--ag-accent] text-[#07080F] font-bold uppercase tracking-widest hover:brightness-110"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                            {!loading && <ArrowRight className="h-4 w-4" />}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-[--ag-muted]">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-[--ag-accent] font-semibold hover:underline underline-offset-4">
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
