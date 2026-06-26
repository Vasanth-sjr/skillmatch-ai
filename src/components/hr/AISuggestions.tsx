import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain,
  BookOpen,
  Target,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Applicant } from "./ApplicantCard";

interface AISuggestionsProps {
  candidate: Applicant;
}

const generateSuggestions = (candidate: Applicant) => {
  const suggestions = [];
  
  // Based on authenticity score
  if (candidate.authenticityScore < 80) {
    suggestions.push({
      type: "authenticity",
      priority: "high",
      title: "Improve Content Authenticity",
      description: "Your application shows signs of AI-generated content. Consider rewriting sections in your own voice with specific examples from your experience.",
      actions: [
        "Add personal anecdotes and specific project details",
        "Use your unique writing style and vocabulary", 
        "Include measurable achievements and outcomes"
      ]
    });
  }

  // Based on completeness
  if (candidate.completeness < 90) {
    suggestions.push({
      type: "completeness",
      priority: "medium",
      title: "Complete Your Application",
      description: "Your application is missing some important information that could strengthen your candidacy.",
      actions: [
        "Add detailed work experience descriptions",
        "Include educational background and certifications",
        "Provide contact references and portfolio links"
      ]
    });
  }

  // Based on skills
  const skillSuggestions = {
    "React": ["Next.js", "React Testing Library", "Redux Toolkit"],
    "Python": ["FastAPI", "pandas", "pytest"],
    "TypeScript": ["Advanced types", "Decorators", "Generics"],
    "Node.js": ["Express.js", "Nest.js", "GraphQL"]
  };

  const hasReact = candidate.skills.some(skill => skill.toLowerCase().includes('react'));
  const hasPython = candidate.skills.some(skill => skill.toLowerCase().includes('python'));
  
  if (hasReact || hasPython) {
    const recommendedSkills = hasReact ? skillSuggestions.React : skillSuggestions.Python;
    suggestions.push({
      type: "skills",
      priority: "medium",
      title: "Expand Your Technical Skills",
      description: `Based on your ${hasReact ? 'React' : 'Python'} experience, consider learning these complementary technologies.`,
      actions: recommendedSkills.map(skill => `Learn ${skill} to enhance your expertise`)
    });
  }

  // Based on rating
  if (candidate.reviewRating < 4.0) {
    suggestions.push({
      type: "presentation",
      priority: "high", 
      title: "Improve Application Presentation",
      description: "Your application could benefit from better structure and presentation to highlight your strengths.",
      actions: [
        "Use clear headings and bullet points",
        "Quantify your achievements with numbers",
        "Tailor content to the specific role requirements"
      ]
    });
  }

  // Learning resources based on position
  const learningResources = {
    frontend: ["Advanced React Patterns", "Web Performance Optimization", "Accessibility Best Practices"],
    backend: ["System Design Fundamentals", "Database Optimization", "API Security"],
    fullstack: ["DevOps Basics", "Testing Strategies", "Architecture Patterns"],
    design: ["Design Systems", "User Research Methods", "Prototyping Tools"],
    data: ["Machine Learning Fundamentals", "Data Visualization", "Statistical Analysis"]
  };

  const positionType = candidate.position.toLowerCase().includes('frontend') ? 'frontend' :
                     candidate.position.toLowerCase().includes('backend') ? 'backend' :
                     candidate.position.toLowerCase().includes('full') ? 'fullstack' :
                     candidate.position.toLowerCase().includes('design') ? 'design' :
                     candidate.position.toLowerCase().includes('data') ? 'data' : 'fullstack';

  suggestions.push({
    type: "learning",
    priority: "low",
    title: "Recommended Learning Path",
    description: `Enhance your expertise in ${candidate.position} with these focused learning topics.`,
    actions: learningResources[positionType]
  });

  return suggestions;
};

export function AISuggestions({ candidate }: AISuggestionsProps) {
  const suggestions = generateSuggestions(candidate);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return AlertCircle;
      case "medium": return Target;
      default: return Lightbulb;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-flagged";
      case "medium": return "text-suspicious";
      default: return "text-primary";
    }
  };

  return (
    <Card className="mb-8 bg-gradient-card border-0 shadow-card-custom">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI-Powered Improvement Suggestions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personalized recommendations to enhance your application and career prospects
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {suggestions.map((suggestion, index) => {
          const PriorityIcon = getPriorityIcon(suggestion.priority);
          
          return (
            <div key={index} className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-start gap-3">
                <PriorityIcon className={`h-5 w-5 mt-0.5 ${getPriorityColor(suggestion.priority)}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{suggestion.title}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        suggestion.priority === 'high' ? 'bg-flagged/10 border-flagged/20 text-flagged' :
                        suggestion.priority === 'medium' ? 'bg-suspicious/10 border-suspicious/20 text-suspicious' :
                        'bg-primary/10 border-primary/20 text-primary'
                      }`}
                    >
                      {suggestion.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {suggestion.description}
                  </p>
                  <div className="space-y-2">
                    {suggestion.actions.map((action, actionIndex) => (
                      <div key={actionIndex} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Overall Score Prediction */}
        <div className="bg-gradient-subtle p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-authentic" />
            <h3 className="font-semibold">Potential Score Improvement</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            By implementing our high-priority suggestions, your authenticity score could improve by 
            <span className="font-semibold text-authentic"> 15-25 points</span> and your overall rating by 
            <span className="font-semibold text-authentic"> 0.5-1.0 stars</span>.
          </p>
          <Button size="sm" className="w-full sm:w-auto">
            <BookOpen className="h-4 w-4 mr-2" />
            Access Learning Resources
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}