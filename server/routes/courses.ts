import { Router, Response } from "express";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth";

const router = Router();

// Get all courses
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { search, category } = req.query;

    let courses = [
        {
            id: 1,
            title: "Advanced React Patterns",
            description: "Master advanced React patterns including render props, compound components, and custom hooks.",
            category: "Frontend",
            duration: "6 weeks",
            level: "Advanced",
            enrolled: 245,
            rating: 4.8,
        },
        {
            id: 2,
            title: "Machine Learning Fundamentals",
            description: "Introduction to ML concepts, algorithms, and practical applications with Python.",
            category: "Data Science",
            duration: "8 weeks",
            level: "Beginner",
            enrolled: 380,
            rating: 4.6,
        },
        {
            id: 3,
            title: "Cloud Architecture with AWS",
            description: "Design and deploy scalable cloud solutions using Amazon Web Services.",
            category: "DevOps",
            duration: "10 weeks",
            level: "Intermediate",
            enrolled: 160,
            rating: 4.7,
        },
        {
            id: 4,
            title: "Full-Stack Development Bootcamp",
            description: "Build complete web applications from frontend to backend with modern technologies.",
            category: "Full-Stack",
            duration: "12 weeks",
            level: "Intermediate",
            enrolled: 520,
            rating: 4.9,
        },
        {
            id: 5,
            title: "Data Structures & Algorithms",
            description: "Essential DSA concepts for technical interviews and competitive programming.",
            category: "Computer Science",
            duration: "4 weeks",
            level: "Intermediate",
            enrolled: 890,
            rating: 4.5,
        },
    ];

    if (search) {
        const q = (search as string).toLowerCase();
        courses = courses.filter(
            (c) =>
                c.title.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.category.toLowerCase().includes(q)
        );
    }

    if (category) {
        courses = courses.filter((c) => c.category.toLowerCase() === (category as string).toLowerCase());
    }

    res.json(courses);
});

// Get skill tracks
router.get("/tracks", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const tracks = [
        { id: 1, name: "Frontend Development", courses: 5, progress: 60 },
        { id: 2, name: "Backend Development", courses: 4, progress: 40 },
        { id: 3, name: "Data Science", courses: 6, progress: 25 },
        { id: 4, name: "DevOps & Cloud", courses: 3, progress: 80 },
        { id: 5, name: "Mobile Development", courses: 4, progress: 10 },
    ];

    res.json(tracks);
});

export default router;
