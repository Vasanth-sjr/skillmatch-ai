import { Router, Response } from "express";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth";

const router = Router();

// Upload file (simulated — in production, use Supabase Storage)
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    // In production, handle multipart file upload with multer + Supabase Storage
    const { fileName, fileType, fileSize } = req.body;

    const upload = {
        id: Math.random().toString(36).slice(2),
        fileName: fileName || "untitled",
        fileType: fileType || "application/octet-stream",
        fileSize: fileSize || 0,
        status: "completed",
        uploadedAt: new Date().toISOString(),
        userId: req.user!.id,
    };

    res.json(upload);
});

// Get upload history
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const uploads = [
        {
            id: "1",
            fileName: "resume_2025.pdf",
            fileType: "application/pdf",
            fileSize: 245000,
            status: "completed",
            uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: "2",
            fileName: "aws_certificate.png",
            fileType: "image/png",
            fileSize: 1200000,
            status: "completed",
            uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    res.json(uploads);
});

export default router;
