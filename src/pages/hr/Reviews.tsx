import { DashboardLayout } from "@/components/hr/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Star,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

const mockReviews = [
  {
    id: "1",
    candidateName: "Sarah Johnson",
    position: "Senior Frontend Developer",
    reviewer: "Alex Chen",
    reviewDate: "2024-01-18",
    status: "completed",
    overallRating: 4.8,
    technicalSkills: 5.0,
    communication: 4.5,
    experience: 4.8,
    culturalFit: 4.9,
    recommendation: "strong_hire",
    comments: "Exceptional technical skills and great communication. Strong problem-solving abilities demonstrated during the coding interview.",
    interviewType: "Technical Interview"
  },
  {
    id: "2",
    candidateName: "Michael Chen",
    position: "Full Stack Engineer", 
    reviewer: "Emily Rodriguez",
    reviewDate: "2024-01-17",
    status: "completed",
    overallRating: 3.9,
    technicalSkills: 4.2,
    communication: 3.8,
    experience: 3.9,
    culturalFit: 3.7,
    recommendation: "hire",
    comments: "Solid technical foundation with room for growth. Shows good potential and willingness to learn.",
    interviewType: "Final Interview"
  },
  {
    id: "3",
    candidateName: "Emma Rodriguez",
    position: "UX/UI Designer",
    reviewer: "David Kim",
    reviewDate: "2024-01-16",
    status: "pending",
    overallRating: 0,
    technicalSkills: 0,
    communication: 0,
    experience: 0,
    culturalFit: 0,
    recommendation: "pending",
    comments: "",
    interviewType: "Portfolio Review"
  },
  {
    id: "4",
    candidateName: "James Wilson",
    position: "Backend Developer",
    reviewer: "Lisa Zhang",
    reviewDate: "2024-01-15",
    status: "completed",
    overallRating: 3.2,
    technicalSkills: 3.5,
    communication: 2.8,
    experience: 3.2,
    culturalFit: 3.3,
    recommendation: "no_hire",
    comments: "Technical skills are adequate but communication needs improvement. Not a strong fit for our team dynamics.",
    interviewType: "Screening Interview"
  }
];

const statusColors = {
  completed: "bg-authentic/10 text-authentic border-authentic/20",
  pending: "bg-suspicious/10 text-suspicious border-suspicious/20",
  draft: "bg-muted text-muted-foreground border-muted"
};

const recommendationColors = {
  strong_hire: "bg-authentic text-authentic-foreground",
  hire: "bg-primary text-primary-foreground", 
  no_hire: "bg-flagged text-flagged-foreground",
  pending: "bg-muted text-muted-foreground"
};

const recommendationLabels = {
  strong_hire: "Strong Hire",
  hire: "Hire",
  no_hire: "No Hire", 
  pending: "Pending Review"
};

export default function Reviews() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Interview Reviews</h1>
            <p className="text-muted-foreground">Review and evaluate candidate interview feedback</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="w-full sm:w-auto">
              <MessageSquare className="h-4 w-4 mr-2" />
              Pending Reviews
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gradient-card border-0 shadow-card-custom">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="grid gap-4">
          {mockReviews.map((review) => (
            <Card key={review.id} className="bg-gradient-card border-0 shadow-card-custom hover:shadow-card-hover transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {review.candidateName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{review.candidateName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{review.position}</p>
                      <p className="text-xs text-muted-foreground">
                        Reviewed by {review.reviewer} • {review.interviewType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[review.status as keyof typeof statusColors]}>
                      {review.status}
                    </Badge>
                    {review.status === 'completed' && (
                      <Badge className={recommendationColors[review.recommendation as keyof typeof recommendationColors]}>
                        {recommendationLabels[review.recommendation as keyof typeof recommendationLabels]}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {review.status === 'completed' && (
                  <>
                    {/* Overall Rating */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-warning fill-warning" />
                        <span className="text-2xl font-bold">{review.overallRating.toFixed(1)}</span>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.overallRating 
                                ? "text-warning fill-warning" 
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Rating Breakdown */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Technical Skills</span>
                          <span className="font-medium">{review.technicalSkills.toFixed(1)}/5</span>
                        </div>
                        <Progress value={review.technicalSkills * 20} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Communication</span>
                          <span className="font-medium">{review.communication.toFixed(1)}/5</span>
                        </div>
                        <Progress value={review.communication * 20} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Experience</span>
                          <span className="font-medium">{review.experience.toFixed(1)}/5</span>
                        </div>
                        <Progress value={review.experience * 20} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Cultural Fit</span>
                          <span className="font-medium">{review.culturalFit.toFixed(1)}/5</span>
                        </div>
                        <Progress value={review.culturalFit * 20} className="h-2" />
                      </div>
                    </div>

                    {/* Comments */}
                    {review.comments && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm font-medium mb-1">Reviewer Comments</p>
                        <p className="text-sm text-muted-foreground">{review.comments}</p>
                      </div>
                    )}
                  </>
                )}

                {review.status === 'pending' && (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Review pending completion</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    {review.status === 'completed' 
                      ? `Reviewed on ${new Date(review.reviewDate).toLocaleDateString()}`
                      : 'Awaiting review completion'
                    }
                  </div>
                  <div className="flex gap-2">
                    {review.status === 'pending' && (
                      <Button size="sm">
                        Complete Review
                      </Button>
                    )}
                    {review.status === 'completed' && (
                      <>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm">
                          Edit Review
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}