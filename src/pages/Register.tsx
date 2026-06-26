import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkillMatchLogo } from "@/components/SkillMatchLogo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Eye, EyeOff, UserPlus, Mail, CheckCircle } from "lucide-react";

const Register = () => {
    const [searchParams] = useSearchParams();
    const urlRole = searchParams.get("role") === "employer" ? "employer" : "student";

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<"student" | "employer">(urlRole);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, userRole, loading: authLoading } = useAuth();
    const [emailSent, setEmailSent] = useState(false);

    // If already logged in (e.g. arrived via email confirmation link), send to correct portal
    useEffect(() => {
        if (!authLoading && user) {
            navigate(userRole === "employer" ? "/hr/dashboard" : "/dashboard", { replace: true });
        }
    }, [user, userRole, authLoading, navigate]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure your passwords match.",
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: "Password too short",
                description: "Password must be at least 6 characters.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                },
            },
        });

        if (error) {
            toast({
                title: "Registration failed",
                description: error.message,
                variant: "destructive",
            });
        } else if (data.session) {
            // Email confirmation is disabled — user is signed in immediately
            toast({ title: "Welcome!", description: "Account created successfully." });
            navigate(role === "employer" ? "/hr/dashboard" : "/dashboard", { replace: true });
        } else {
            // Email confirmation required
            toast({
                title: "Account created!",
                description: "Please check your email to confirm your account.",
            });
            setEmailSent(true);
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
                    <h2 className="text-5xl font-['Syne'] font-extrabold tracking-tight">Join SkillMatch AI</h2>
                    <p className="text-lg text-[--ag-muted] max-w-md leading-relaxed">
                        Create your account and start connecting with the right opportunities powered by AI.
                    </p>
                </div>
            </div>

            {/* Right side - form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="lg:hidden flex justify-center mb-8">
                        <SkillMatchLogo size="lg" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight">Create account</h1>
                        <p className="text-[--ag-muted]">Get started with SkillMatch AI</p>
                    </div>

                    {emailSent ? (
                        <div className="rounded-xl border-2 border-primary bg-primary/5 p-8 text-center space-y-4">
                            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Mail className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-foreground">Check your email</h2>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                We've sent a confirmation link to <strong className="text-foreground">{email}</strong>.
                                Click the link to verify your account.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                                <CheckCircle className="h-3.5 w-3.5 text-metric-green" />
                                Didn't get it? Check your spam folder or
                                <button
                                    type="button"
                                    onClick={() => setEmailSent(false)}
                                    className="text-primary font-semibold hover:underline"
                                >
                                    try again
                                </button>
                            </div>
                            <Link to="/login">
                                <Button variant="hero" className="mt-4 gap-2">
                                    Go to Login
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="text-[--ag-text]">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="h-11 bg-[--ag-bg] border-[--ag-border] focus:border-[--ag-accent] focus:shadow-[0_0_10px_rgba(0,216,255,0.2)] rounded-none"
                                />
                            </div>

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

                            {/* Role selection */}
                            <div className="space-y-2">
                                <Label className="text-[--ag-text]">I am a</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRole("student")}
                                        className={`p-3 rounded-none border border-[--ag-border] text-sm font-bold uppercase tracking-wider transition-all ${role === "student"
                                            ? "border-[--ag-accent] bg-[--ag-accent-dim] text-[--ag-accent]"
                                            : "text-[--ag-muted] hover:border-[--ag-accent]/30 bg-[--ag-bg]"
                                            }`}
                                    >
                                        Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole("employer")}
                                        className={`p-3 rounded-none border border-[--ag-border] text-sm font-bold uppercase tracking-wider transition-all ${role === "employer"
                                            ? "border-[--ag-accent] bg-[--ag-accent-dim] text-[--ag-accent]"
                                            : "text-[--ag-muted] hover:border-[--ag-accent]/30 bg-[--ag-bg]"
                                            }`}
                                    >
                                        Employer
                                    </button>
                                </div>
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

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-[--ag-text]">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-11 bg-[--ag-bg] border-[--ag-border] focus:border-[--ag-accent] focus:shadow-[0_0_10px_rgba(0,216,255,0.2)] rounded-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="hero"
                                className="w-full h-11 gap-2 rounded-none bg-[--ag-accent] text-[#07080F] font-bold uppercase tracking-widest hover:brightness-110"
                                disabled={loading}
                            >
                                {loading ? "Creating account..." : "Create Account"}
                                {!loading && <UserPlus className="h-4 w-4" />}
                            </Button>
                        </form>
                    )}

                    <p className="text-center text-sm text-[--ag-muted]">
                        Already have an account?{" "}
                        <Link to="/login" className="text-[--ag-accent] font-semibold hover:underline underline-offset-4">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
