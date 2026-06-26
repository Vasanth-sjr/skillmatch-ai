import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "@/components/AuthProvider";

// Shared pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Job Seeker pages
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Applications from "./pages/Applications";
import Events from "./pages/Events";
import Careers from "./pages/Careers";
import Settings from "./pages/Settings";
import AIAnalysis from "./pages/AIAnalysis";
import ATSChecker from "./pages/ATSChecker";
import Resume from "./pages/Resume";
import CareerRoadmap from "./pages/CareerRoadmap";
import Interviews from "./pages/Interviews";
import ResumeBuilder from "./pages/ResumeBuilder";
import SkillReviews from "./pages/SkillReviews";

// Onboarding pages
import JobSeekerOnboarding from "./pages/onboarding/JobSeekerOnboarding";
import EmployerOnboarding from "./pages/onboarding/EmployerOnboarding";

// HR pages
import HRDashboard from "./pages/hr/Dashboard";
import HRCandidates from "./pages/hr/Candidates";
import HRCandidateView from "./pages/hr/CandidateView";
import HREvents from "./pages/hr/Events";
import HRJobs from "./pages/hr/Jobs";
import HRInterviews from "./pages/hr/Interviews";
import HRReviews from "./pages/hr/Reviews";
import HRReports from "./pages/hr/Reports";
import HRSettings from "./pages/hr/Settings";
import HRProfile from "./pages/hr/HRProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Onboarding — skipOnboardingCheck so they don't loop */}
            <Route path="/onboarding/jobseeker" element={<ProtectedRoute skipOnboardingCheck={true}><JobSeekerOnboarding /></ProtectedRoute>} />
            <Route path="/onboarding/employer" element={<ProtectedRoute skipOnboardingCheck={true}><EmployerOnboarding /></ProtectedRoute>} />

            {/* Job Seeker portal */}
            <Route path="/dashboard" element={<ProtectedRoute requiredRole="student"><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute requiredRole="student"><Profile /></ProtectedRoute>} />
            <Route path="/applications" element={<ProtectedRoute requiredRole="student"><Applications /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute requiredRole="student"><Events /></ProtectedRoute>} />
            <Route path="/careers" element={<ProtectedRoute requiredRole="student"><Careers /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredRole="student"><Settings /></ProtectedRoute>} />
            <Route path="/ai-analysis" element={<ProtectedRoute requiredRole="student"><AIAnalysis /></ProtectedRoute>} />
            <Route path="/ats-check" element={<ProtectedRoute requiredRole="student"><ATSChecker /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute requiredRole="student"><Resume /></ProtectedRoute>} />
            <Route path="/roadmap" element={<ProtectedRoute requiredRole="student"><CareerRoadmap /></ProtectedRoute>} />
            <Route path="/interviews" element={<ProtectedRoute requiredRole="student"><Interviews /></ProtectedRoute>} />
            <Route path="/resume-builder"  element={<ProtectedRoute requiredRole="student"><ResumeBuilder /></ProtectedRoute>} />
            <Route path="/skill-reviews"  element={<ProtectedRoute requiredRole="student"><SkillReviews /></ProtectedRoute>} />

            {/* HR portal */}
            <Route path="/hr/dashboard" element={<ProtectedRoute requiredRole="employer"><HRDashboard /></ProtectedRoute>} />
            <Route path="/hr/candidates" element={<ProtectedRoute requiredRole="employer"><HRCandidates /></ProtectedRoute>} />
            <Route path="/hr/candidates/:id" element={<ProtectedRoute requiredRole="employer"><HRCandidateView /></ProtectedRoute>} />
            <Route path="/hr/events" element={<ProtectedRoute requiredRole="employer"><HREvents /></ProtectedRoute>} />
            <Route path="/hr/jobs" element={<ProtectedRoute requiredRole="employer"><HRJobs /></ProtectedRoute>} />
            <Route path="/hr/interviews" element={<ProtectedRoute requiredRole="employer"><HRInterviews /></ProtectedRoute>} />
            <Route path="/hr/reviews" element={<ProtectedRoute requiredRole="employer"><HRReviews /></ProtectedRoute>} />
            <Route path="/hr/reports" element={<ProtectedRoute requiredRole="employer"><HRReports /></ProtectedRoute>} />
            <Route path="/hr/settings" element={<ProtectedRoute requiredRole="employer"><HRSettings /></ProtectedRoute>} />
            <Route path="/hr/profile" element={<ProtectedRoute requiredRole="employer"><HRProfile /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
