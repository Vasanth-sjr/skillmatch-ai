import { DashboardLayout } from "@/components/hr/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Phone,
  Plus,
  Search,
  Filter,
  User
} from "lucide-react";

const mockInterviews = [
  {
    id: "1",
    candidateName: "Sarah Johnson",
    candidateEmail: "sarah.johnson@email.com",
    position: "Senior Frontend Developer",
    type: "Technical Interview",
    format: "video",
    date: "2024-01-20",
    time: "14:00",
    duration: "60 min",
    interviewer: "Alex Chen",
    status: "scheduled",
    location: "Zoom Meeting"
  },
  {
    id: "2",
    candidateName: "Michael Chen", 
    candidateEmail: "michael.chen@email.com",
    position: "Full Stack Engineer",
    type: "Final Interview",
    format: "in-person",
    date: "2024-01-22",
    time: "10:30",
    duration: "90 min", 
    interviewer: "Emily Rodriguez",
    status: "scheduled",
    location: "Conference Room A"
  },
  {
    id: "3",
    candidateName: "Emma Rodriguez",
    candidateEmail: "emma.rodriguez@email.com",
    position: "UX/UI Designer",
    type: "Portfolio Review",
    format: "phone",
    date: "2024-01-19",
    time: "15:30",
    duration: "45 min",
    interviewer: "David Kim",
    status: "completed",
    location: "Phone Call"
  },
  {
    id: "4",
    candidateName: "James Wilson",
    candidateEmail: "james.wilson@email.com", 
    position: "Backend Developer",
    type: "Screening Interview",
    format: "video",
    date: "2024-01-21",
    time: "11:00",
    duration: "30 min",
    interviewer: "Lisa Zhang",
    status: "scheduled",
    location: "Google Meet"
  }
];

const statusColors = {
  scheduled: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-authentic/10 text-authentic border-authentic/20",
  cancelled: "bg-flagged/10 text-flagged border-flagged/20",
  rescheduled: "bg-suspicious/10 text-suspicious border-suspicious/20"
};

const formatIcons = {
  video: Video,
  phone: Phone,
  "in-person": MapPin
};

export default function Interviews() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Interviews</h1>
            <p className="text-muted-foreground">Schedule and manage candidate interviews</p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gradient-card border-0 shadow-card-custom">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search interviews..."
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

        {/* Interviews List */}
        <div className="grid gap-4">
          {mockInterviews.map((interview) => {
            const FormatIcon = formatIcons[interview.format as keyof typeof formatIcons];
            
            return (
              <Card key={interview.id} className="bg-gradient-card border-0 shadow-card-custom hover:shadow-card-hover transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {interview.candidateName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{interview.candidateName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{interview.position}</p>
                        <p className="text-xs text-muted-foreground">{interview.candidateEmail}</p>
                      </div>
                    </div>
                    <Badge className={statusColors[interview.status as keyof typeof statusColors]}>
                      {interview.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(interview.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{interview.time} ({interview.duration})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FormatIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{interview.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{interview.interviewer}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium mb-1">{interview.type}</p>
                    <p className="text-xs text-muted-foreground">
                      Interview type and focus areas for this candidate assessment
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      {interview.status === 'scheduled' ? 'Upcoming' : 'Completed'} interview
                    </div>
                    <div className="flex gap-2">
                      {interview.status === 'scheduled' && (
                        <>
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button size="sm">
                            Join Meeting
                          </Button>
                        </>
                      )}
                      {interview.status === 'completed' && (
                        <Button size="sm">
                          View Feedback
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}