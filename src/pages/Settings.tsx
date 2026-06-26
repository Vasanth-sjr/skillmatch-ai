import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Bell, Shield, Eye, Palette, Globe, Save } from "lucide-react";

const Settings = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    const handleSave = () => {
        toast({ title: "Settings saved", description: "Your preferences have been updated." });
    };

    return (
        <div className="min-h-screen bg-[--ag-bg]">
            <DashboardSidebar />
            <div className="pl-64 min-h-screen transition-all duration-300">
                <DashboardHeader />
                <main className="p-6 space-y-6 max-w-3xl">
                    <div>
                        <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight">Settings</h1>
                        <p className="text-[--ag-muted] mt-1">Manage your account preferences</p>
                    </div>

                    {/* Account */}
                    <div className="rounded-none bg-[--ag-surface] p-6 border border-[--ag-border] space-y-6">
                        <h3 className="text-xl font-['Syne'] font-bold text-[--ag-text] flex items-center gap-3 tracking-tight">
                            <Shield className="h-5 w-5 text-[--ag-accent]" /> Account
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[--ag-text] font-bold uppercase tracking-wider text-xs">Email</Label>
                                <Input value={user?.email || ""} disabled className="bg-[--ag-bg] border-[--ag-border] text-[--ag-muted] rounded-none opacity-70" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[--ag-text] font-bold uppercase tracking-wider text-xs">Role</Label>
                                <Input
                                    value={user?.user_metadata?.role || "student"}
                                    disabled
                                    className="bg-[--ag-bg] border-[--ag-border] text-[--ag-accent] uppercase font-bold tracking-widest rounded-none opacity-70"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="rounded-none bg-[--ag-surface] p-6 border border-[--ag-border] space-y-6">
                        <h3 className="text-xl font-['Syne'] font-bold text-[--ag-text] flex items-center gap-3 tracking-tight">
                            <Bell className="h-5 w-5 text-[--ag-accent]" /> Notifications
                        </h3>
                        <div className="space-y-5">
                            {[
                                { label: "Email notifications", desc: "Receive updates and alerts via email" },
                                { label: "Course reminders", desc: "Get reminders for upcoming deadlines" },
                                { label: "New opportunities", desc: "Be notified of matching career opportunities" },
                                { label: "Assessment results", desc: "Notifications when results are available" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-[--ag-text]">{item.label}</p>
                                        <p className="text-xs text-[--ag-muted] mt-1">{item.desc}</p>
                                    </div>
                                    <Switch defaultChecked className="data-[state=checked]:bg-[--ag-accent]" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Privacy */}
                    <div className="rounded-none bg-[--ag-surface] p-6 border border-[--ag-border] space-y-6">
                        <h3 className="text-xl font-['Syne'] font-bold text-[--ag-text] flex items-center gap-3 tracking-tight">
                            <Eye className="h-5 w-5 text-[--ag-accent]" /> Privacy
                        </h3>
                        <div className="space-y-5">
                            {[
                                { label: "Profile visibility", desc: "Allow employers to view your profile" },
                                { label: "Show skill scores", desc: "Display scores on your public profile" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-[--ag-text]">{item.label}</p>
                                        <p className="text-xs text-[--ag-muted] mt-1">{item.desc}</p>
                                    </div>
                                    <Switch defaultChecked className="data-[state=checked]:bg-[--ag-accent]" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button variant="hero" className="gap-2 rounded-none bg-[--ag-accent] text-[#07080F] font-bold uppercase tracking-wider text-xs hover:brightness-110" onClick={handleSave}>
                            <Save className="h-4 w-4" /> Save Settings
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
