// Works out what a LinkedIn import would change, so the user can approve
// it before anything is written.
//
// ── WHY THIS ISN'T JUST AN OVERWRITE ──────────────────────────────────
//
// A profile someone has curated here is often better than their
// LinkedIn: descriptions rewritten for a specific path, projects that
// never made it onto LinkedIn, skills deliberately pruned. Importing by
// replacement would destroy that in one click, and the user would only
// notice later.
//
// Worse, it would corrupt AMSCE. The Resume Context Analyzer reads
// experience and project text, so silently replacing a detailed
// description with a two-line LinkedIn one would move confidence scores
// with no visible cause.
//
// So the import is additive by default: new items are added, existing
// ones are left alone unless the user explicitly chooses to replace
// them, and everything is shown as a diff first.

import { LinkedInImport, LinkedInCertificate, mapIssuer } from "./linkedinImport";

export interface MergeItem<T> {
  value: T;
  /** A matching entry already exists on the profile. */
  duplicate: boolean;
  /** Whether this item is selected for import. */
  selected: boolean;
  label: string;
  sublabel: string;
}

export interface MergePlan {
  skills: MergeItem<string>[];
  experience: MergeItem<any>[];
  education: MergeItem<any>[];
  projects: MergeItem<any>[];
  certificates: MergeItem<any>[];
  /** Fields that are empty here and could be filled from LinkedIn. */
  fillable: { key: string; label: string; value: string; selected: boolean }[];
}

const norm = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Two entries are the same if the identifying pair matches. Dates are
 * deliberately excluded: LinkedIn and a hand-entered profile frequently
 * disagree on exact months for the same role, and treating that as a
 * different job would produce duplicates for every position.
 */
function sameExperience(a: any, b: any): boolean {
  return norm(a.title) === norm(b.title) && norm(a.company) === norm(b.company);
}

function sameEducation(a: any, b: any): boolean {
  return norm(a.institution) === norm(b.institution) && norm(a.degree) === norm(b.degree);
}

export function buildMergePlan(
  imported: LinkedInImport,
  current: {
    full_name?: string | null;
    headline?: string | null;
    location?: string | null;
    skills?: string[];
    experience?: any[];
    education?: any[];
    projects?: any[];
    certifications?: any[];
  },
  knownIssuers: string[],
): MergePlan {
  const currentSkills = (current.skills ?? []).map(norm);
  const skills: MergeItem<string>[] = imported.skills.map(s => {
    const duplicate = currentSkills.includes(norm(s));
    return { value: s, duplicate, selected: !duplicate, label: s, sublabel: "" };
  });

  const currentExp = current.experience ?? [];
  const experience: MergeItem<any>[] = imported.experience.map(e => {
    const duplicate = currentExp.some(c => sameExperience(c, e));
    return {
      value: { id: genId(), ...e },
      duplicate,
      selected: !duplicate,
      label: e.title || "(untitled role)",
      sublabel: [e.company, [e.startYear, e.current ? "Present" : e.endYear].filter(Boolean).join(" – ")]
        .filter(Boolean).join(" · "),
    };
  });

  const currentEdu = current.education ?? [];
  const education: MergeItem<any>[] = imported.education.map(e => {
    const duplicate = currentEdu.some(c => sameEducation(c, e));
    return {
      value: { id: genId(), ...e },
      duplicate,
      selected: !duplicate,
      label: [e.degree, e.fieldOfStudy].filter(Boolean).join(", ") || e.institution,
      sublabel: [e.institution, [e.startYear, e.endYear].filter(Boolean).join(" – ")]
        .filter(Boolean).join(" · "),
    };
  });

  const currentProj = (current.projects ?? []).map((p: any) => norm(p.title));
  const projects: MergeItem<any>[] = imported.projects.map(p => {
    const duplicate = currentProj.includes(norm(p.title));
    return {
      value: { id: genId(), title: p.title, description: p.description, techStack: "", url: p.url, githubUrl: "" },
      duplicate,
      selected: !duplicate,
      label: p.title,
      sublabel: p.url || "",
    };
  });

  const currentCerts = current.certifications ?? [];
  const certificates: MergeItem<any>[] = imported.certificates.map((c: LinkedInCertificate) => {
    const issuer = mapIssuer(c.issuer, knownIssuers);
    const duplicate = currentCerts.some((x: any) =>
      norm(x.name) === norm(c.name) ||
      (c.credentialId && norm(x.credentialId) === norm(c.credentialId)));

    return {
      value: {
        id: genId(),
        name: c.name,
        issuer,
        credentialId: c.credentialId,
        issueDate: c.issueDate,
        expiryDate: "",
      },
      duplicate,
      selected: !duplicate,
      label: c.name,
      sublabel: [
        c.issuer || "Unknown issuer",
        c.credentialId ? `ID ${c.credentialId}` : "no credential ID — can't be auto-verified",
      ].join(" · "),
    };
  });

  // Only offered for fields that are currently EMPTY. An import should
  // never quietly replace a headline someone wrote for this platform.
  const fillable = [
    { key: "full_name", label: "Full name", value: imported.fullName, current: current.full_name },
    { key: "headline", label: "Headline", value: imported.headline, current: current.headline },
    { key: "location", label: "Location", value: imported.location, current: current.location },
  ]
    .filter(f => f.value && !String(f.current ?? "").trim())
    .map(f => ({ key: f.key, label: f.label, value: f.value, selected: true }));

  return { skills, experience, education, projects, certificates, fillable };
}

export function countSelected(plan: MergePlan): number {
  return (
    plan.skills.filter(i => i.selected).length +
    plan.experience.filter(i => i.selected).length +
    plan.education.filter(i => i.selected).length +
    plan.projects.filter(i => i.selected).length +
    plan.certificates.filter(i => i.selected).length +
    plan.fillable.filter(i => i.selected).length
  );
}
