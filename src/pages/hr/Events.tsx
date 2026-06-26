import { DashboardLayout } from "@/components/hr/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Users, 
  Trophy,
  Clock,
  Filter
} from "lucide-react";

const events = [
  {
    id: "1",
    name: "Tech Conference 2024",
    type: "Conference",
    date: "2024-02-15",
    location: "San Francisco, CA",
    applicants: 45,
    reviewed: 23,
    hired: 3,
    status: "active",
    description: "Annual technology conference focusing on frontend development and AI innovations.",
  },
  {
    id: "2", 
    name: "Design Summit 2024",
    type: "Summit",
    date: "2024-02-10",
    location: "Austin, TX",
    applicants: 28,
    reviewed: 28,
    hired: 2,
    status: "completed",
    description: "Premier design event bringing together UX/UI professionals and creative minds.",
  },
  {
    id: "3",
    name: "Startup Hackathon",
    type: "Hackathon", 
    date: "2024-02-20",
    location: "Seattle, WA",
    applicants: 67,
    reviewed: 12,
    hired: 1,
    status: "active",
    description: "48-hour hackathon event focused on innovative startup solutions and rapid prototyping.",
  },
  {
    id: "4",
    name: "AI & ML Workshop",
    type: "Workshop",
    date: "2024-02-25",
    location: "Boston, MA", 
    applicants: 34,
    reviewed: 8,
    hired: 0,
    status: "upcoming",
    description: "Intensive workshop on machine learning applications and AI development practices.",
  },
];

const Events = () => {
  const totalApplicants = events.reduce((sum, event) => sum + event.applicants, 0);
  const totalHired = events.reduce((sum, event) => sum + event.hired, 0);
  const activeEvents = events.filter(e => e.status === 'active').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Events & Conferences
            </h1>
            <p className="text-muted-foreground mt-1">
              Track applications from tech events, conferences, and workshops
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter Events
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Event Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hover:shadow-card-custom transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{events.length}</p>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-custom transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10 text-warning">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeEvents}</p>
                  <p className="text-sm text-muted-foreground">Active Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-custom transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalApplicants}</p>
                  <p className="text-sm text-muted-foreground">Total Applicants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-custom transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10 text-success">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalHired}</p>
                  <p className="text-sm text-muted-foreground">Candidates Hired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <div className="grid gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-card-custom transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{event.name}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.type === 'Conference' ? 'default' : 'secondary'}>
                      {event.type}
                    </Badge>
                    <Badge 
                      className={
                        event.status === 'active' ? 'bg-success/10 text-success' :
                        event.status === 'completed' ? 'bg-muted text-muted-foreground' :
                        'bg-warning/10 text-warning'
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">{event.description}</p>
                
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-primary">{event.applicants}</div>
                    <p className="text-xs text-muted-foreground">Applicants</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-warning">{event.reviewed}</div>
                    <p className="text-xs text-muted-foreground">Reviewed</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-success">{event.hired}</div>
                    <p className="text-xs text-muted-foreground">Hired</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-foreground">
                      {event.applicants > 0 ? Math.round((event.hired / event.applicants) * 100) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Applicants
                    </Button>
                    <Button variant="outline" size="sm">
                      Download Reports
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Events;