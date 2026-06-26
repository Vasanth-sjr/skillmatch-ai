import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUser() {
    console.log("🚀 Seeding user: thrilokrajakeerthi@gmail.com");

    const { data, error } = await supabase.auth.signUp({
        email: "thrilokrajakeerthi@gmail.com",
        password: "1234567890",
        options: {
            data: {
                full_name: "Thrilok Raja Keerthi",
                role: "student",
            },
        },
    });

    if (error) {
        if (error.message.includes("already registered")) {
            console.log("✅ User already exists — no action needed.");
        } else {
            console.error("❌ Error creating user:", error.message);
            process.exit(1);
        }
    } else {
        console.log("✅ User created successfully!");
        console.log("   ID:", data.user?.id);
        console.log("   Email:", data.user?.email);
        console.log("   Confirmed:", data.user?.email_confirmed_at ? "Yes" : "No (check email)");
    }

    console.log("\n📧 Email confirmation:");
    console.log("   If 'Confirm email' is ON in Supabase Dashboard,");
    console.log("   the user will receive a confirmation email at thrilokrajakeerthi@gmail.com");
    console.log("\n   To enable: Supabase Dashboard → Auth → Providers → Email → Confirm email");
}

seedUser();
