import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  FileImage, 
  File,
  CheckCircle, 
  AlertTriangle, 
  Shield,
  Star,
  Brain,
  Target,
  TrendingUp,
  Eye,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileScore {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'PPT' | 'TXT';
  size: number;
  authenticityScore: number;
  reviewRating: number;
  completeness: number;
  flags: ('ai-generated' | 'plagiarism' | 'incomplete')[];
  skills: string[];
  status: 'analyzing' | 'completed';
  uploadedAt: string;
}

const fileIcons = {
  PDF: FileText,
  DOCX: File,
  PPT: FileImage,
  TXT: FileText,
};

const fileColors = {
  PDF: "text-danger",
  DOCX: "text-primary", 
  PPT: "text-warning",
  TXT: "text-muted-foreground",
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

const mockAnalyzeFile = (fileName: string, fileType: string): Omit<FileScore, 'id' | 'uploadedAt'> => {
  const mockSkills = ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'Git'];
  const randomSkills = mockSkills.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 2);
  
  return {
    name: fileName,
    type: fileType as 'PDF' | 'DOCX' | 'PPT' | 'TXT',
    size: Math.floor(Math.random() * 5000000) + 100000, // Random size between 100KB - 5MB
    authenticityScore: Math.floor(Math.random() * 40) + 60, // 60-100
    reviewRating: Math.random() * 2 + 3, // 3.0-5.0
    completeness: Math.floor(Math.random() * 30) + 70, // 70-100
    flags: Math.random() > 0.7 ? ['ai-generated'] : Math.random() > 0.8 ? ['incomplete'] : [],
    skills: randomSkills,
    status: 'completed' as const,
  };
};

interface FileScoreShowcaseProps {
  uploadedFiles?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    status: string;
  }>;
}

export function FileScoreShowcase({ uploadedFiles = [] }: FileScoreShowcaseProps) {
  const [fileScores, setFileScores] = useState<FileScore[]>([]);

  useEffect(() => {
    const successfulFiles = uploadedFiles.filter(file => file.status === 'success');
    
    successfulFiles.forEach(file => {
      // Check if we already have a score for this file
      const existingScore = fileScores.find(score => score.id === file.id);
      if (existingScore) return;

      // Add analyzing status immediately
      const analyzingFile: FileScore = {
        id: file.id,
        name: file.name,
        type: getFileTypeFromMimeType(file.type),
        size: file.size,
        authenticityScore: 0,
        reviewRating: 0,
        completeness: 0,
        flags: [],
        skills: [],
        status: 'analyzing',
        uploadedAt: new Date().toISOString(),
      };

      setFileScores(prev => [...prev.filter(f => f.id !== file.id), analyzingFile]);

      // Simulate analysis after 2-4 seconds
      setTimeout(() => {
        const analysis = mockAnalyzeFile(file.name, getFileTypeFromMimeType(file.type));
        const completedFile: FileScore = {
          ...analyzingFile,
          ...analysis,
          status: 'completed',
        };

        setFileScores(prev => prev.map(f => f.id === file.id ? completedFile : f));
      }, 2000 + Math.random() * 2000);
    });
  }, [uploadedFiles, fileScores]);

  const getFileTypeFromMimeType = (mimeType: string): 'PDF' | 'DOCX' | 'PPT' | 'TXT' => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word')) return 'DOCX';
    if (mimeType.includes('presentation')) return 'PPT';
    return 'TXT';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (fileScores.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">File Analysis Results</h2>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          {fileScores.length} File{fileScores.length !== 1 ? 's' : ''} Analyzed
        </Badge>
      </div>

      <div className="grid gap-6">
        {fileScores.map((file) => {
          const FileIcon = fileIcons[file.type];
          const AuthenticityIcon = getAuthenticityIcon(file.authenticityScore);

          return (
            <Card key={file.id} className="bg-gradient-card border-0 shadow-card-custom">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg bg-muted/30", fileColors[file.type])}>
                      <FileIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{file.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {file.type} • {formatFileSize(file.size)} • Uploaded {new Date(file.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(
                    file.status === 'analyzing' ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                  )}>
                    {file.status === 'analyzing' ? 'Analyzing...' : 'Completed'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {file.status === 'analyzing' ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Brain className="h-8 w-8 text-primary mx-auto mb-3 animate-pulse" />
                      <p className="text-sm text-muted-foreground">AI is analyzing your file...</p>
                      <div className="mt-2 h-1 w-32 bg-muted rounded-full overflow-hidden mx-auto">
                        <div className="h-full bg-primary animate-pulse" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Score Metrics */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Authenticity Score */}
                      <div className="p-4 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AuthenticityIcon className={cn("h-4 w-4", getAuthenticityColor(file.authenticityScore))} />
                            <span className="text-sm font-medium">Authenticity</span>
                          </div>
                          <span className={cn("font-bold", getAuthenticityColor(file.authenticityScore))}>
                            {file.authenticityScore}%
                          </span>
                        </div>
                        <Progress value={file.authenticityScore} className="h-2" />
                      </div>

                      {/* Review Rating */}
                      <div className="p-4 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-warning" />
                            <span className="text-sm font-medium">Rating</span>
                          </div>
                          <span className="font-bold text-warning">
                            {file.reviewRating.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={cn(
                                "h-3 w-3",
                                star <= file.reviewRating 
                                  ? "text-warning fill-warning" 
                                  : "text-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Completeness */}
                      <div className="p-4 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Complete</span>
                          </div>
                          <span className="font-bold text-primary">
                            {file.completeness}%
                          </span>
                        </div>
                        <Progress value={file.completeness} className="h-2" />
                      </div>
                    </div>

                    {/* Flags */}
                    {file.flags.length > 0 && (
                      <div className="p-4 rounded-lg bg-flagged/10 border border-flagged/20">
                        <h4 className="font-medium text-flagged mb-2">Areas for Improvement</h4>
                        <div className="flex flex-wrap gap-2">
                          {file.flags.map((flag) => (
                            <Badge key={flag} variant="outline" className="bg-flagged/10 border-flagged/20 text-flagged">
                              {flag === 'ai-generated' && 'AI Content Detected'}
                              {flag === 'plagiarism' && 'Similarity Found'}
                              {flag === 'incomplete' && 'Missing Information'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {file.skills.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Identified Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {file.skills.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t">
                      <Button size="sm" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download Report
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Get Suggestions
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}