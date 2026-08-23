import { describe, it, expect } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { parseCsv, field } from "@/lib/linkedin/csv";
import { parseLinkedInArchive, mapIssuer } from "@/lib/linkedin/linkedinImport";
import { buildMergePlan, countSelected } from "@/lib/linkedin/mergePlan";
import { CERT_ISSUER_LABELS } from "@/data/certificateIssuers";

describe("CSV parsing", () => {
  it("keeps commas inside quoted fields", () => {
    // LinkedIn descriptions are full of commas. Splitting on "," would
    // shift every subsequent column.
    const rows = parseCsv('Title,Description\nEngineer,"Built APIs, dashboards, and tooling"');
    expect(rows[0].Description).toBe("Built APIs, dashboards, and tooling");
  });

  it("handles newlines inside quoted fields", () => {
    const rows = parseCsv('Title,Description\nDev,"Line one\nLine two"');
    expect(rows).toHaveLength(1);
    expect(rows[0].Description).toBe("Line one\nLine two");
  });

  it("unescapes doubled quotes", () => {
    const rows = parseCsv('Title,Note\nDev,"She said ""hello"" loudly"');
    expect(rows[0].Note).toBe('She said "hello" loudly');
  });

  it("strips a UTF-8 BOM from the first header", () => {
    const rows = parseCsv("﻿Name,Value\nReact,5");
    expect(rows[0].Name).toBe("React");
  });

  it("returns nothing for a header-only or empty file", () => {
    expect(parseCsv("Name,Value")).toEqual([]);
    expect(parseCsv("")).toEqual([]);
  });

  it("tolerates a missing trailing newline", () => {
    const rows = parseCsv("A,B\n1,2");
    expect(rows).toHaveLength(1);
    expect(rows[0].B).toBe("2");
  });

  it("looks up columns case-insensitively across renames", () => {
    const row = { "License Number": "ABC123" };
    expect(field(row, "Licence Number", "License Number")).toBe("ABC123");
    expect(field(row, "license number")).toBe("ABC123");
    expect(field(row, "Nonexistent")).toBe("");
  });
});

// ── Archive fixtures ────────────────────────────────────────────────────

function archive(files: Record<string, string>): ArrayBuffer {
  const zipped = zipSync(
    Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])),
  );
  return zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) as ArrayBuffer;
}

const FULL_ARCHIVE = {
  "Profile.csv":
    "First Name,Last Name,Headline,Geo Location\nVasanth,S J R,Aspiring Data Analyst,Chennai",
  "Skills.csv":
    "Name\nPower BI\nSQL\nPython",
  "Positions.csv":
    'Company Name,Title,Description,Started On,Finished On\n' +
    'Acme Corp,Data Intern,"Built Power BI dashboards, and SQL reports",Jan 2025,Jun 2025\n' +
    'Beta Ltd,Analyst,Ongoing work,Jul 2025,',
  "Education.csv":
    "School Name,Degree Name,Field Of Study,Start Date,End Date\nSri Sai Ram,B.E.,Computer Science,2022,2026",
  "Certifications.csv":
    "Name,Url,Authority,Started On,License Number\n" +
    "Analysis and Visualization of Data with Power BI,https://coursera.org/verify/VWOA232ZHJD8,Coursera,Jan 2026,VWOA232ZHJD8",
  "Projects.csv":
    "Title,Description,Url\nSkillMatch,Career platform,https://example.com",
};

describe("archive parsing", () => {
  it("extracts every section", () => {
    const r = parseLinkedInArchive(archive(FULL_ARCHIVE));
    expect(r.fullName).toBe("Vasanth S J R");
    expect(r.headline).toBe("Aspiring Data Analyst");
    expect(r.skills).toEqual(["Power BI", "SQL", "Python"]);
    expect(r.experience).toHaveLength(2);
    expect(r.education).toHaveLength(1);
    expect(r.projects).toHaveLength(1);
    expect(r.certificates).toHaveLength(1);
  });

  it("carries the credential ID through — the reason this feature exists", () => {
    const r = parseLinkedInArchive(archive(FULL_ARCHIVE));
    expect(r.certificates[0].credentialId).toBe("VWOA232ZHJD8");
    expect(r.certificates[0].issueDate).toBe("2026-01");
  });

  it("treats a blank finish date as a current role", () => {
    const r = parseLinkedInArchive(archive(FULL_ARCHIVE));
    expect(r.experience[0].current).toBe(false);
    expect(r.experience[1].current).toBe(true);
  });

  it("splits LinkedIn dates into month and year", () => {
    const r = parseLinkedInArchive(archive(FULL_ARCHIVE));
    expect(r.experience[0].startMonth).toBe("Jan");
    expect(r.experience[0].startYear).toBe("2025");
  });

  it("finds files nested inside a folder", () => {
    const r = parseLinkedInArchive(archive({
      "Basic_LinkedInDataExport/Skills.csv": "Name\nDocker",
      "Basic_LinkedInDataExport/Positions.csv": "Company Name,Title,Started On,Finished On\nX,Dev,Jan 2024,",
    }));
    expect(r.skills).toEqual(["Docker"]);
  });

  it("rejects a file that isn't a zip", () => {
    expect(() => parseLinkedInArchive(strToU8("not a zip").buffer as ArrayBuffer))
      .toThrow(/LinkedIn archive/);
  });

  it("rejects an archive with no usable profile data", () => {
    // LinkedIn sends a small "basic" export first; importing it silently
    // would look like the feature is broken.
    expect(() => parseLinkedInArchive(archive({ "Ads Clicked.csv": "Date\n2024" })))
      .toThrow(/No profile data/);
  });

  it("warns when certifications carry no licence numbers", () => {
    const r = parseLinkedInArchive(archive({
      ...FULL_ARCHIVE,
      "Certifications.csv": "Name,Url,Authority,Started On,License Number\nSome Course,,Udemy,Jan 2025,",
    }));
    expect(r.warnings.join(" ")).toMatch(/licence numbers/i);
  });
});

describe("issuer mapping", () => {
  it("maps known authorities onto registry keys", () => {
    expect(mapIssuer("Coursera", CERT_ISSUER_LABELS)).toBe("Coursera");
    expect(mapIssuer("coursera.org", CERT_ISSUER_LABELS)).toBe("Coursera");
    expect(mapIssuer("Amazon Web Services (AWS)", CERT_ISSUER_LABELS)).toBe("AWS");
  });

  it("falls back to Other rather than guessing", () => {
    // A wrong issuer would send verification to the wrong endpoint and
    // could report a genuine certificate as invalid.
    expect(mapIssuer("Some Local Bootcamp", CERT_ISSUER_LABELS)).toBe("Other");
    expect(mapIssuer("", CERT_ISSUER_LABELS)).toBe("Other");
  });
});

describe("merge planning", () => {
  const imported = parseLinkedInArchive(archive(FULL_ARCHIVE));

  it("selects everything for an empty profile", () => {
    const plan = buildMergePlan(imported, {}, CERT_ISSUER_LABELS);
    expect(plan.skills.every(s => s.selected)).toBe(true);
    expect(countSelected(plan)).toBeGreaterThan(0);
  });

  it("unticks items already on the profile", () => {
    // The safe path has to be the default path.
    const plan = buildMergePlan(imported, {
      skills: ["Power BI"],
      experience: [{ title: "Data Intern", company: "Acme Corp" }],
    }, CERT_ISSUER_LABELS);

    expect(plan.skills.find(s => s.value === "Power BI")?.selected).toBe(false);
    expect(plan.skills.find(s => s.value === "SQL")?.selected).toBe(true);
    expect(plan.experience[0].duplicate).toBe(true);
  });

  it("matches roles on title and company, ignoring dates", () => {
    // LinkedIn and a hand-entered profile routinely disagree on months
    // for the same job; treating that as a new role duplicates it.
    const plan = buildMergePlan(imported, {
      experience: [{ title: "Data Intern", company: "Acme Corp", startYear: "2024" }],
    }, CERT_ISSUER_LABELS);
    expect(plan.experience[0].duplicate).toBe(true);
  });

  it("spots a duplicate certificate by credential ID", () => {
    const plan = buildMergePlan(imported, {
      certifications: [{ name: "Something else entirely", credentialId: "VWOA232ZHJD8" }],
    }, CERT_ISSUER_LABELS);
    expect(plan.certificates[0].duplicate).toBe(true);
  });

  it("offers to fill only fields that are currently empty", () => {
    // An import must never quietly replace a headline written for this
    // platform.
    const empty = buildMergePlan(imported, {}, CERT_ISSUER_LABELS);
    expect(empty.fillable.map(f => f.key)).toContain("headline");

    const filled = buildMergePlan(imported, { headline: "My own headline" }, CERT_ISSUER_LABELS);
    expect(filled.fillable.map(f => f.key)).not.toContain("headline");
  });

  it("flags certificates that can't be auto-verified", () => {
    const noId = parseLinkedInArchive(archive({
      ...FULL_ARCHIVE,
      "Certifications.csv": "Name,Url,Authority,Started On,License Number\nSome Course,,Udemy,Jan 2025,",
    }));
    const plan = buildMergePlan(noId, {}, CERT_ISSUER_LABELS);
    expect(plan.certificates[0].sublabel).toMatch(/can't be auto-verified/);
  });
});
