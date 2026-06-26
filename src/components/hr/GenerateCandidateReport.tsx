import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { mockApplicants } from "@/data/hrMockData";

// ─── Score Computation & Ranking ─────────────────────────────────────────────

interface RankedCandidate {
  rank: number;
  name: string;
  skillScore: number;
  keySkills: string;
  assessmentScore: string;
  status: string;
}

function computeScore(applicant: typeof mockApplicants[0]): number {
  // Use authenticityScore as the primary score (existing score in the system)
  // This matches the requirement: IF score exists, use existing score
  return applicant.authenticityScore;
}

function getStatus(score: number): string {
  return score >= 80 ? "Ready" : "Needs Improvement";
}

function buildRankedCandidates(): RankedCandidate[] {
  return mockApplicants
    .map((applicant) => ({
      name: applicant.name,
      skillScore: computeScore(applicant),
      keySkills: applicant.skills.join("; "),
      reviewRating: applicant.reviewRating,
      completeness: applicant.completeness,
    }))
    .sort((a, b) => b.skillScore - a.skillScore)
    .map((candidate, index) => ({
      rank: index + 1,
      name: candidate.name,
      skillScore: candidate.skillScore,
      keySkills: candidate.keySkills,
      assessmentScore: `${candidate.reviewRating.toFixed(1)} / 5.0`,
      status: getStatus(candidate.skillScore),
    }));
}

// ─── CSV Generation ──────────────────────────────────────────────────────────

function generateCSV(): string {
  const ranked = buildRankedCandidates();

  const headers = [
    "Rank",
    "Candidate Name",
    "Skill Score",
    "Key Skills",
    "Assessment Score",
    "Status",
  ];

  const rows = ranked.map((r) =>
    [
      r.rank,
      `"${r.name}"`,
      r.skillScore,
      `"${r.keySkills}"`,
      `"${r.assessmentScore}"`,
      r.status,
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "skillmatch_candidate_report.csv";
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GenerateCandidateReport() {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    setGenerating(true);
    // Brief delay for UX feedback
    setTimeout(() => {
      try {
        const csv = generateCSV();
        downloadCSV(csv);
        toast({
          title: "Report Generated",
          description:
            "Ranked candidate report has been downloaded as CSV.",
        });
      } catch {
        toast({
          title: "Report Failed",
          description: "An error occurred while generating the report.",
          variant: "destructive",
        });
      } finally {
        setGenerating(false);
      }
    }, 500);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors"
      onClick={handleGenerate}
      disabled={generating}
      id="generate-report-btn"
    >
      {generating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-2" />
      )}
      Generate Report
    </Button>
  );
}
