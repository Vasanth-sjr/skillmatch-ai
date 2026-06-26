import { Router, Response } from "express";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth";

const router = Router();

// Get user profile
router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const profile = {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        fullName: "",
        bio: "",
        location: "",
        skills: ["JavaScript", "React", "TypeScript", "Node.js", "Python", "SQL", "Git", "AWS"],
        stats: {
            coursesEnrolled: 12,
            certifications: 5,
            assessments: 24,
            skillScore: 87,
        },
    };

    res.json(profile);
});

// Update user profile
router.put("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { fullName, bio, location, skills } = req.body;
    // In production, update the profile in Supabase
    res.json({
        message: "Profile updated",
        profile: { fullName, bio, location, skills },
    });
});

export default router;
