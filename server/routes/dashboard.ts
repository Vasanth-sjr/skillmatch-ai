import { Router, Response } from "express";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth";

const router = Router();

// Get dashboard metrics
router.get("/metrics", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    // Return metrics — in production, these would come from Supabase tables
    const metrics = {
        coursesEnrolled: 12,
        availableSkillTracks: 8,
        assessmentsScheduled: 4,
        skillMatchAccuracy: 87,
        certificationsEarned: 5,
        avgTimeToComplete: 18,
    };

    res.json(metrics);
});

// Get dashboard categories with counts
router.get("/categories", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const categories = [
        { name: "Courses", count: 24 },
        { name: "Skill Tracks", count: 8 },
        { name: "Internships", count: 15 },
        { name: "Assessments", count: 12 },
        { name: "Certifications", count: 6 },
    ];

    res.json(categories);
});

// Get integrity alerts
router.get("/alerts", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const alerts = [
        {
            id: 1,
            type: "warning",
            message: "Low engagement in last assessment",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 2,
            type: "error",
            message: "Plagiarism risk detected in assignment",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 3,
            type: "warning",
            message: "Skill mismatch between resume and assessments",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    res.json(alerts);
});

// Dismiss an alert
router.delete("/alerts/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    // In production, update the alert status in Supabase
    res.json({ message: `Alert ${id} dismissed` });
});

export default router;
