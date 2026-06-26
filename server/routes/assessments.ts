import { Router, Response } from "express";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth";

const router = Router();

// Get assessments
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const assessments = [
        {
            id: 1,
            title: "React Proficiency Assessment",
            type: "Technical",
            scheduledDate: "2025-03-15",
            duration: "60 min",
            status: "upcoming",
            score: null,
        },
        {
            id: 2,
            title: "Problem Solving Skills",
            type: "Aptitude",
            scheduledDate: "2025-03-18",
            duration: "45 min",
            status: "upcoming",
            score: null,
        },
        {
            id: 3,
            title: "Python Fundamentals",
            type: "Technical",
            scheduledDate: "2025-03-05",
            duration: "90 min",
            status: "completed",
            score: 88,
        },
        {
            id: 4,
            title: "Communication & Teamwork",
            type: "Soft Skills",
            scheduledDate: "2025-03-01",
            duration: "30 min",
            status: "completed",
            score: 92,
        },
    ];

    res.json(assessments);
});

export default router;
