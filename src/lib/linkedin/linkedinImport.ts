// Parses a LinkedIn "Get a copy of your data" archive into the shapes
// this app's profile uses.
//
// ── WHY AN ARCHIVE AND NOT AN API ─────────────────────────────────────
//
// LinkedIn's Sign In / OpenID Connect scope returns name, email and
// photo — nothing else. Skills, positions and certifications live behind
// r_fullprofile, which is restricted to Talent Solutions partners and
// has not been granted to general developers since around 2019.
// Scraping is both against LinkedIn's terms and actively litigated, and
// asking a user for their LinkedIn password would be credential
// harvesting. The official export is the only route that is legitimate,
// reliable, and requires no permission from anyone but the user.
//
// ── WHAT AN IMPORT DOES AND DOESN'T ESTABLISH ─────────────────────────
//
// Nothing in this archive is verified. LinkedIn lets anyone type "AWS
// Certified Solutions Architect" into their profile with no proof
// whatsoever, so an imported certificate is a CLAIM, not a credential.
// Every certificate produced here enters as self_reported and is then
// put through the same issuer verification as a hand-entered one.
//
// What the import genuinely buys is the credential ID: Certifications.csv
// carries the licence number and credential URL, which is exactly what
// the verification pipeline needs and exactly what users get wrong when
// typing by hand.

import { unzipSync, strFromU8 } from "fflate";
import { parseCsv, field, CsvRow } from "./csv";

export interface LinkedInExperience {
  title: string;
  company: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  current: boolean;
  description: string;
}

export interface LinkedInEducation {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startYear: string;
  endYear: string;
}

export interface LinkedInProject {
  title: string;
  description: string;
  url: string;
}

export interface LinkedInCertificate {
  name: string;
  issuer: string;
  credentialId: string;
  credentialUrl: string;
  issueDate: string;
}

export interface LinkedInImport {
  fullName: string;
  headline: string;
  location: string;
  skills: string[];
  experience: LinkedInExperience[];
  education: LinkedInEducation[];
  projects: LinkedInProject[];
  certificates: LinkedInCertificate[];
  /** Files we found but couldn't use, surfaced so gaps aren't mysterious. */
  warnings: string[];
}

export const MAX_ARCHIVE_BYTES = 25 * 1024 * 1024;

/** LinkedIn nests files inside a folder in some exports. */
function findFile(files: Record<string, Uint8Array>, name: string): Uint8Array | null {
  const target = name.toLowerCase();
  for (const path of Object.keys(files)) {
    const base = path.split("/").pop()?.toLowerCase() ?? "";
    if (base === target) return files[path];
  }
  return null;
}

function readCsv(files: Record<string, Uint8Array>, name: string): CsvRow[] {
  const raw = findFile(files, name);
  if (!raw) return [];
  try {
    return parseCsv(strFromU8(raw));
  } catch {
    return [];
  }
}

/**
 * LinkedIn dates come as "Jan 2024", "2024", or "" — normalised here to
 * a month name and a year, since that is what the profile form stores.
 */
function splitDate(value: string): { month: string; year: string } {
  const v = (value ?? "").trim();
  if (!v) return { month: "", year: "" };

  const monthYear = /^([A-Za-z]{3,9})\s+(\d{4})$/.exec(v);
  if (monthYear) return { month: monthYear[1].slice(0, 3), year: monthYear[2] };

  const yearOnly = /(\d{4})/.exec(v);
  return { month: "", year: yearOnly ? yearOnly[1] : "" };
}

/** "Jan 2024" → "2024-01", the format the certificate form expects. */
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
function toMonthInput(value: string): string {
  const { month, year } = splitDate(value);
  if (!year) return "";
  const idx = MONTHS.indexOf(month.toLowerCase());
  return idx >= 0 ? `${year}-${String(idx + 1).padStart(2, "0")}` : "";
}

export function parseLinkedInArchive(buffer: ArrayBuffer): LinkedInImport {
  const warnings: string[] = [];
  let files: Record<string, Uint8Array>;

  try {
    files = unzipSync(new Uint8Array(buffer));
  } catch {
    throw new Error(
      "That doesn't look like a LinkedIn archive. Upload the .zip exactly as LinkedIn sent it, without unzipping it first.",
    );
  }

  // ── Profile ────────────────────────────────────────────────────────
  const profileRows = readCsv(files, "Profile.csv");
  const p = profileRows[0] ?? {};
  const fullName = [field(p, "First Name"), field(p, "Last Name")].filter(Boolean).join(" ");
  const headline = field(p, "Headline");
  const location = field(p, "Geo Location", "Location");
  if (profileRows.length === 0) warnings.push("No Profile.csv found — name and headline weren't imported.");

  // ── Skills ─────────────────────────────────────────────────────────
  const skillRows = readCsv(files, "Skills.csv");
  const skills = Array.from(new Set(
    skillRows.map(r => field(r, "Name", "Skill")).filter(Boolean),
  ));

  // ── Positions ──────────────────────────────────────────────────────
  const positionRows = readCsv(files, "Positions.csv");
  const experience: LinkedInExperience[] = positionRows.map(r => {
    const start = splitDate(field(r, "Started On"));
    const finishedRaw = field(r, "Finished On");
    const end = splitDate(finishedRaw);
    return {
      title: field(r, "Title"),
      company: field(r, "Company Name"),
      startMonth: start.month,
      startYear: start.year,
      endMonth: end.month,
      endYear: end.year,
      // LinkedIn leaves "Finished On" blank for a role still held.
      current: finishedRaw.trim().length === 0,
      description: field(r, "Description"),
    };
  }).filter(e => e.title || e.company);

  // ── Education ──────────────────────────────────────────────────────
  const educationRows = readCsv(files, "Education.csv");
  const education: LinkedInEducation[] = educationRows.map(r => ({
    degree: field(r, "Degree Name", "Degree"),
    fieldOfStudy: field(r, "Field Of Study", "Field of Study"),
    institution: field(r, "School Name", "School"),
    startYear: splitDate(field(r, "Start Date", "Started On")).year,
    endYear: splitDate(field(r, "End Date", "Finished On")).year,
  })).filter(e => e.institution || e.degree);

  // ── Projects ───────────────────────────────────────────────────────
  const projectRows = readCsv(files, "Projects.csv");
  const projects: LinkedInProject[] = projectRows.map(r => ({
    title: field(r, "Title"),
    description: field(r, "Description"),
    url: field(r, "Url", "URL"),
  })).filter(p => p.title);

  // ── Certifications ─────────────────────────────────────────────────
  // The licence number is the payload that matters: it feeds straight
  // into issuer verification, and it's the field users mistype by hand.
  const certRows = readCsv(files, "Certifications.csv");
  const certificates: LinkedInCertificate[] = certRows.map(r => ({
    name: field(r, "Name"),
    issuer: field(r, "Authority", "Issuing Organization"),
    credentialId: field(r, "License Number", "Licence Number", "Credential ID"),
    credentialUrl: field(r, "Url", "URL"),
    issueDate: toMonthInput(field(r, "Started On", "Issue Date")),
  })).filter(c => c.name);

  if (certRows.length > 0 && certificates.every(c => !c.credentialId)) {
    warnings.push(
      "Your certifications had no licence numbers on LinkedIn, so they can't be verified automatically. You can add the IDs by hand.",
    );
  }

  if (skills.length === 0 && experience.length === 0 && education.length === 0) {
    throw new Error(
      "No profile data found in that archive. LinkedIn sends a small 'basic' export first and the full one later — make sure you've uploaded the complete archive.",
    );
  }

  return { fullName, headline, location, skills, experience, education, projects, certificates, warnings };
}

/**
 * Maps a LinkedIn "Authority" string onto our issuer registry key.
 *
 * LinkedIn stores free text, so "Coursera", "coursera.org" and "Coursera
 * Inc." all appear. Anything unrecognised becomes "Other" rather than a
 * guess — a wrong issuer would send verification at the wrong endpoint
 * and could report a real certificate as invalid.
 */
export function mapIssuer(authority: string, knownIssuers: string[]): string {
  const a = authority.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!a) return "Other";

  for (const key of knownIssuers) {
    const k = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (k !== "other" && (a.includes(k) || k.includes(a))) return key;
  }

  const aliases: Record<string, string> = {
    amazonwebservices: "AWS",
    amazonwebservicesaws: "AWS",
    googlecloud: "Google",
    googlecareercertificates: "Google",
    microsoftlearn: "Microsoft",
    metaformerlyfacebook: "Meta",
    freecodecamporg: "freeCodeCamp",
    nptelswayam: "NPTEL",
    swayamnptel: "NPTEL",
  };
  return aliases[a] ?? "Other";
}
