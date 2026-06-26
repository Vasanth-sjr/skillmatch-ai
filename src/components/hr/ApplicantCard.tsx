import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  FileText, 
  FileImage, 
  File, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Star,
  Clock,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Applicant {
  id: string;
  name: string;
  email: string;
  position: string;
  fileType: 'PDF' | 'DOCX' | 'PPT' | 'TXT';
  authenticityScore: number;
  reviewRating: number;
  status: 'new' | 'reviewed' | 'interviewed' | 'hired' | 'rejected';
  submittedAt: string;
  event?: string;
  skills: string[];
  experience: string;
  completeness: number;
  flags: ('ai-generated' | 'plagiarism' | 'incomplete')[];
}

interface ApplicantCardProps {
  applicant: Applicant;
}

const fileIcons = {
  PDF: FileText,
  DOCX: File,
  PPT: FileImage,
  TXT: FileText,
};

const statusColors = {
  new: "bg-primary/10 text-primary",
  reviewed: "bg-warning/10 text-warning",
  interviewed: "bg-success/10 text-success",
  hired: "bg-success text-success-foreground",
  rejected: "bg-danger/10 text-danger",
};

const getAuthenticityColor = (score: number) => {
  if (score >= 80) return "text-authentic";
  if (score >= 60) return "text-suspicious"; 
  return "text-flagged";
};

const getAuthenticityIcon = (score: number) => {
  if (score >= 80) return CheckCircle;
  if (score >= 60) return AlertTriangle;
  return Shield;
};

export function ApplicantCard({ applicant }: ApplicantCardProps) {
  const FileIcon = fileIcons[applicant.fileType];
  const AuthenticityIcon = getAuthenticityIcon(applicant.authenticityScore);

  return (
    <Card className="group hover:shadow-card-custom transition-all duration-200 hover:-translate-y-1 bg-gradient-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              applicant.fileType === 'PDF' && "bg-danger/10 text-danger",
              applicant.fileType === 'DOCX' && "bg-primary/10 text-primary", 
              applicant.fileType === 'PPT' && "bg-warning/10 text-warning",
              applicant.fileType === 'TXT' && "bg-muted text-muted-foreground"
            )}>
              <FileIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {applicant.name}
              </h3>
              <p className="text-sm text-muted-foreground">{applicant.position}</p>
              {applicant.event && (
                <p className="text-xs text-primary font-medium mt-1">
                  Event: {applicant.event}
                </p>
              )}
            </div>
          </div>
          <Badge className={statusColors[applicant.status]}>
            {applicant.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Authenticity Score */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <AuthenticityIcon className={cn("h-4 w-4", getAuthenticityColor(applicant.authenticityScore))} />
            <span className="text-sm font-medium">Authenticity</span>
          </div>
          <span className={cn("font-bold", getAuthenticityColor(applicant.authenticityScore))}>
            {applicant.authenticityScore}%
          </span>
        </div>

        {/* Flags */}
        {applicant.flags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {applicant.flags.map((flag) => (
              <Badge key={flag} variant="outline" className="text-xs bg-danger/10 border-danger/20 text-danger">
                {flag === 'ai-generated' && 'AI Generated'}
                {flag === 'plagiarism' && 'Plagiarism'}
                {flag === 'incomplete' && 'Incomplete'}
              </Badge>
            ))}
          </div>
        )}

        {/* Rating and Completeness */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="font-medium">{applicant.reviewRating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>Completeness: {applicant.completeness}%</span>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Key Skills</p>
          <div className="flex flex-wrap gap-1">
            {applicant.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {applicant.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{applicant.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Experience */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {applicant.experience}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(applicant.submittedAt).toLocaleDateString()}
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
            <Link to={`/hr/candidates/${applicant.id}`}>
              <Eye className="h-3 w-3 mr-1" />
              Review
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}