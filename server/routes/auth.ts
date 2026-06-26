import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase";

const router = Router();

// Login
router.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return res.status(401).json({ error: error.message });
    }

    res.json({
        user: data.user,
        session: data.session,
    });
});

// Register
router.post("/register", async (req: Request, res: Response) => {
    const { email, password, fullName, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
    }

    const { data, error } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName || "",
                role: role || "student",
            },
        },
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json({ user: data.user });
});

// Logout
router.post("/logout", async (_req: Request, res: Response) => {
    res.json({ message: "Logged out successfully" });
});

export default router;
