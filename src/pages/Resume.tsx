import { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { Printer, ArrowLeft, FileText } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function expDuration(e: any) {
  const start = [e.startMonth, e.startYear].filter(Boolean).join(" ");
  const end = e.current ? "Present" : [e.endMonth, e.endYear].filter(Boolean).join(" ");
  return [start, end].filter(Boolean).join(" – ");
}

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return m ? `${months[parseInt(m) - 1]} ${y}` : y;
}

// ─── Print styles injected into <head> ───────────────────────────────────────
const PRINT_STYLE = `
  @media print {
    body { margin: 0; background: white !important; }
    .no-print { display: none !important; }
    .resume-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
  }
  @page { size: A4; margin: 16mm 16mm 16mm 16mm; }
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Resume() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = PRINT_STYLE;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  if (!profile) return null;

  const goalPath = profile.career_goal ? CAREER_PATHS[profile.career_goal as CareerPathKey] : null;
  const experience: any[] = profile.experience ?? [];
  const education: any[] = profile.education ?? [];
  const skills: string[] = profile.skills ?? [];
  const projects: any[] = (profile as any).projects ?? [];
  const certifications: any[] = (profile as any).certifications ?? [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar — hidden on print */}
      <div className="no-print bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="text-sm font-bold text-gray-700">Profile Resume — A4</div>
        <div className="flex items-center gap-2">
          <Link
            to="/resume-builder"
            className="flex items-center gap-2 border border-[#0E7490] text-[#0E7490] px-4 py-2 text-sm font-bold hover:bg-[#0E7490]/10 transition-all"
          >
            <FileText className="h-4 w-4" /> Build Custom Resume
          </Link>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#0E7490] text-white px-5 py-2 text-sm font-bold hover:brightness-110 transition-all">
            <Printer className="h-4 w-4" /> Print / Download PDF
          </button>
        </div>
      </div>

      {/* A4 Resume */}
      <div className="py-8 px-4">
        <div
          className="resume-page bg-white mx-auto shadow-2xl"
          style={{ width: "210mm", minHeight: "297mm", padding: "16mm", fontFamily: "Arial, sans-serif", fontSize: "10pt", lineHeight: "1.4" }}
        >
          {/* Header */}
          <div style={{ borderBottom: "2px solid #0E7490", paddingBottom: "10pt", marginBottom: "12pt" }}>
            <h1 style={{ fontSize: "22pt", fontWeight: "900", color: "#0E7490", margin: 0, letterSpacing: "-0.5pt" }}>
              {profile.full_name || user?.email?.split("@")[0] || "Your Name"}
            </h1>
            {profile.headline && (
              <p style={{ fontSize: "11pt", color: "#374151", margin: "3pt 0 0", fontWeight: "600" }}>{profile.headline}</p>
            )}
            {goalPath && (
              <p style={{ fontSize: "9pt", color: "#6B7280", margin: "2pt 0 0" }}>
                {goalPath.emoji} {goalPath.label}
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12pt", marginTop: "6pt", fontSize: "9pt", color: "#374151" }}>
              {user?.email && <span>{user.email}</span>}
              {profile.location && <span>📍 {profile.location}</span>}
              {profile.linkedin_url && <span>🔗 {profile.linkedin_url}</span>}
              {profile.github_url && <span>💻 {profile.github_url}</span>}
              {profile.portfolio_url && <span>🌐 {profile.portfolio_url}</span>}
            </div>
          </div>

          {/* Summary */}
          {profile.bio && (
            <div style={{ marginBottom: "12pt" }}>
              <h2 style={headingStyle}>Summary</h2>
              <p style={{ color: "#374151", margin: 0 }}>{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div style={{ marginBottom: "12pt" }}>
              <h2 style={headingStyle}>Technical Skills</h2>
              <p style={{ margin: 0, color: "#374151" }}>{skills.join("  ·  ")}</p>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <div style={{ marginBottom: "12pt" }}>
              <h2 style={headingStyle}>Work Experience</h2>
              {experience.map((e: any, i: number) => (
                <div key={i} style={{ marginBottom: "8pt" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontWeight: "700", color: "#111827", margin: 0 }}>{e.title}</p>
                      <p style={{ color: "#0E7490", fontWeight: "600", margin: "1pt 0 0", fontSize: "9.5pt" }}>{e.company}</p>
                    </div>
                    <p style={{ color: "#6B7280", fontSize: "9pt", margin: 0, flexShrink: 0, marginLeft: "12pt" }}>
                      {expDuration(e)}
                    </p>
                  </div>
                  {e.description && (
                    <p style={{ color: "#374151", margin: "3pt 0 0", paddingLeft: "8pt", borderLeft: "2px solid #E5E7EB" }}>
                      {e.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div style={{ marginBottom: "12pt" }}>
              <h2 style={headingStyle}>Projects</h2>
              {projects.map((p: any, i: number) => {
                const stack = Array.isArray(p.techStack) ? p.techStack.join(", ") : p.techStack;
                return (
                  <div key={i} style={{ marginBottom: "8pt" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <p style={{ fontWeight: "700", color: "#111827", margin: 0 }}>{p.title}</p>
                      <div style={{ display: "flex", gap: "8pt", flexShrink: 0, marginLeft: "12pt" }}>
                        {p.githubUrl && <span style={{ color: "#0E7490", fontSize: "9pt" }}>GitHub</span>}
                        {p.url && <span style={{ color: "#0E7490", fontSize: "9pt" }}>Live</span>}
                      </div>
                    </div>
                    {stack && <p style={{ color: "#6B7280", fontSize: "9pt", margin: "2pt 0" }}>Tech: {stack}</p>}
                    {p.description && <p style={{ color: "#374151", margin: "2pt 0 0" }}>{p.description}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div style={{ marginBottom: "12pt" }}>
              <h2 style={headingStyle}>Education</h2>
              {education.map((e: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6pt" }}>
                  <div>
                    <p style={{ fontWeight: "700", color: "#111827", margin: 0 }}>
                      {e.degree}{e.fieldOfStudy ? ` — ${e.fieldOfStudy}` : ""}
                    </p>
                    <p style={{ color: "#0E7490", fontWeight: "600", margin: "1pt 0 0", fontSize: "9.5pt" }}>{e.institution}</p>
                  </div>
                  <p style={{ color: "#6B7280", fontSize: "9pt", margin: 0, flexShrink: 0, marginLeft: "12pt" }}>
                    {[e.startYear, e.endYear].filter(Boolean).join(" – ")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div style={{ marginBottom: "12pt" }}>
              <h2 style={headingStyle}>Certifications</h2>
              {certifications.map((c: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4pt" }}>
                  <div>
                    <p style={{ fontWeight: "700", color: "#111827", margin: 0 }}>{c.name}</p>
                    <p style={{ color: "#0E7490", fontSize: "9.5pt", margin: "1pt 0 0" }}>{c.issuer}</p>
                  </div>
                  <p style={{ color: "#6B7280", fontSize: "9pt", margin: 0, flexShrink: 0, marginLeft: "12pt" }}>
                    {c.issueDate ? fmtDate(c.issueDate) : ""}
                    {c.credentialId ? ` · ${c.credentialId}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "6pt", marginTop: "auto", textAlign: "center" }}>
            <p style={{ fontSize: "8pt", color: "#9CA3AF", margin: 0 }}>
              Generated by SkillMatch AI · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const headingStyle: React.CSSProperties = {
  fontSize: "11pt",
  fontWeight: "800",
  color: "#0E7490",
  borderBottom: "1px solid #E5E7EB",
  paddingBottom: "3pt",
  marginBottom: "6pt",
  marginTop: 0,
  textTransform: "uppercase",
  letterSpacing: "0.5pt",
};
