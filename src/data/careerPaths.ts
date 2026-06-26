export type CareerPathKey =
  | "frontend_dev"
  | "backend_dev"
  | "fullstack_dev"
  | "ui_ux_designer"
  | "data_analyst"
  | "ml_engineer"
  | "product_manager"
  | "devops_cloud"
  | "cybersecurity"
  | "mobile_dev";

export interface CareerPath {
  key: CareerPathKey;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  coreSkills: string[];
  salaryRange: string;
  demandLevel: "High" | "Very High" | "Explosive";
}

export const CAREER_PATHS: Record<CareerPathKey, CareerPath> = {
  frontend_dev: {
    key: "frontend_dev",
    label: "Frontend Developer",
    emoji: "🖥️",
    tagline: "Build the interfaces users fall in love with",
    description:
      "Create fast, beautiful web experiences using React, TypeScript, and modern CSS. You're the bridge between design vision and working product.",
    coreSkills: ["React", "TypeScript", "CSS", "HTML", "Figma basics"],
    salaryRange: "₹5–20 LPA",
    demandLevel: "Very High",
  },
  backend_dev: {
    key: "backend_dev",
    label: "Backend Developer",
    emoji: "⚙️",
    tagline: "Engineer the systems that power everything",
    description:
      "Design APIs, optimize databases, and build scalable server-side logic. Your work runs silently — but everything depends on it.",
    coreSkills: ["Node.js / Python", "SQL", "REST APIs", "System Design", "Docker"],
    salaryRange: "₹6–25 LPA",
    demandLevel: "Very High",
  },
  fullstack_dev: {
    key: "fullstack_dev",
    label: "Full Stack Developer",
    emoji: "🔗",
    tagline: "Own the entire product from database to browser",
    description:
      "Build complete products end-to-end — from database schema to pixel-perfect UI. Highly valued for versatility and full product ownership.",
    coreSkills: ["React", "Node.js", "SQL", "REST APIs", "Git"],
    salaryRange: "₹6–22 LPA",
    demandLevel: "Very High",
  },
  ui_ux_designer: {
    key: "ui_ux_designer",
    label: "UI/UX Designer",
    emoji: "🎨",
    tagline: "Shape how millions of people experience technology",
    description:
      "Combine psychology, research, and visual craft to design products people actually enjoy using. You're the user's advocate inside every tech team.",
    coreSkills: ["Figma", "User Research", "Wireframing", "Prototyping", "Design Systems"],
    salaryRange: "₹4–18 LPA",
    demandLevel: "High",
  },
  data_analyst: {
    key: "data_analyst",
    label: "Data Analyst",
    emoji: "📊",
    tagline: "Turn raw numbers into decisions worth millions",
    description:
      "Use SQL, Python, and visualization tools to find insights that drive business strategy. You make numbers speak in a language everyone understands.",
    coreSkills: ["SQL", "Python", "Tableau / Power BI", "Excel", "Statistics"],
    salaryRange: "₹5–18 LPA",
    demandLevel: "Very High",
  },
  ml_engineer: {
    key: "ml_engineer",
    label: "ML / AI Engineer",
    emoji: "🤖",
    tagline: "Build the intelligence behind tomorrow's products",
    description:
      "Design, train, and deploy machine learning models that power AI features. You work at the frontier of what's technically possible.",
    coreSkills: ["Python", "TensorFlow / PyTorch", "Math & Stats", "MLOps", "Cloud (AWS/GCP)"],
    salaryRange: "₹8–35 LPA",
    demandLevel: "Explosive",
  },
  product_manager: {
    key: "product_manager",
    label: "Product Manager",
    emoji: "🚀",
    tagline: "Decide what gets built and why it matters",
    description:
      "Own the roadmap, talk to users, work with engineers and designers to ship products that solve real problems. No code required — but deep tech empathy is essential.",
    coreSkills: ["Roadmapping", "User Interviews", "Analytics", "Agile", "Stakeholder Mgmt"],
    salaryRange: "₹8–30 LPA",
    demandLevel: "Very High",
  },
  devops_cloud: {
    key: "devops_cloud",
    label: "DevOps / Cloud Engineer",
    emoji: "☁️",
    tagline: "Build the infrastructure that never goes down",
    description:
      "Design CI/CD pipelines, manage cloud infra, and ensure systems scale reliably. You're the reason products stay up at 2 AM.",
    coreSkills: ["AWS / Azure / GCP", "Docker", "Kubernetes", "Terraform", "Linux"],
    salaryRange: "₹7–28 LPA",
    demandLevel: "Very High",
  },
  cybersecurity: {
    key: "cybersecurity",
    label: "Cybersecurity Analyst",
    emoji: "🛡️",
    tagline: "Defend what matters most — trust",
    description:
      "Identify vulnerabilities, respond to incidents, and build defenses that protect companies from attacks. You think like a hacker to outsmart them.",
    coreSkills: ["Network Security", "Penetration Testing", "SIEM Tools", "Linux", "Cryptography"],
    salaryRange: "₹5–22 LPA",
    demandLevel: "Explosive",
  },
  mobile_dev: {
    key: "mobile_dev",
    label: "Mobile Developer",
    emoji: "📱",
    tagline: "Create apps that live in a billion pockets",
    description:
      "Build iOS and Android applications using React Native or Flutter. Your work gets tapped millions of times a day by real people.",
    coreSkills: ["React Native / Flutter", "JavaScript / Dart", "App Store Deploy", "REST APIs", "Mobile UI"],
    salaryRange: "₹5–20 LPA",
    demandLevel: "High",
  },
};

// ─── Quiz ───────────────────────────────────────────────────────────────────

export interface QuizOption {
  text: string;
  sub: string;
  weights: Partial<Record<CareerPathKey, number>>;
}

export interface QuizQuestion {
  question: string;
  context: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "What pulls you in the most?",
    context: "Think about what you could spend hours doing without getting bored.",
    options: [
      {
        text: "Creating beautiful interfaces",
        sub: "Making things look and feel right for users",
        weights: { ui_ux_designer: 4, frontend_dev: 3, mobile_dev: 1 },
      },
      {
        text: "Building powerful systems",
        sub: "The logic and architecture that powers everything",
        weights: { backend_dev: 4, fullstack_dev: 2, devops_cloud: 1 },
      },
      {
        text: "Unlocking insights from data",
        sub: "Finding patterns and meaning in complex datasets",
        weights: { data_analyst: 4, ml_engineer: 2 },
      },
      {
        text: "Making AI smarter",
        sub: "Training models and pushing machine learning forward",
        weights: { ml_engineer: 5, data_analyst: 1 },
      },
      {
        text: "Securing digital systems",
        sub: "Protecting companies and users from cyber threats",
        weights: { cybersecurity: 5 },
      },
      {
        text: "Building mobile experiences",
        sub: "Creating apps that live on people's phones",
        weights: { mobile_dev: 5, frontend_dev: 1 },
      },
    ],
  },
  {
    question: "How do you naturally approach a problem?",
    context: "There's no right answer — this is about how your brain works.",
    options: [
      {
        text: "I sketch and wireframe it",
        sub: "Visual thinking — I need to see the solution first",
        weights: { ui_ux_designer: 4, product_manager: 2, frontend_dev: 1 },
      },
      {
        text: "I map the architecture first",
        sub: "Logic and structure before any code is written",
        weights: { backend_dev: 4, fullstack_dev: 2 },
      },
      {
        text: "I look at the data first",
        sub: "Numbers and evidence before assumptions",
        weights: { data_analyst: 4, ml_engineer: 2 },
      },
      {
        text: "I ask 'how could this break?'",
        sub: "Adversarial thinking — finding weak points before attackers do",
        weights: { cybersecurity: 5, devops_cloud: 1 },
      },
      {
        text: "I talk to the users first",
        sub: "Understand the human problem before the technical one",
        weights: { product_manager: 5, ui_ux_designer: 2 },
      },
      {
        text: "I think about scale and automation",
        sub: "How to make it reliable, fast, and repeatable at any size",
        weights: { devops_cloud: 5, backend_dev: 1 },
      },
    ],
  },
  {
    question: "Which of these describes you best?",
    context: "Pick the one that feels most true, even if not a perfect fit.",
    options: [
      {
        text: "I obsess over details that make something beautiful",
        sub: "Pixel-perfect, design-forward mindset",
        weights: { ui_ux_designer: 4, frontend_dev: 3 },
      },
      {
        text: "Elegant, clean code deeply satisfies me",
        sub: "I care as much about how code is written as that it works",
        weights: { backend_dev: 4, fullstack_dev: 2 },
      },
      {
        text: "I see stories hiding inside numbers",
        sub: "Patterns and correlations fascinate me more than code",
        weights: { data_analyst: 4, ml_engineer: 2 },
      },
      {
        text: "I notice security gaps others overlook",
        sub: "I naturally think like an attacker to build better defenses",
        weights: { cybersecurity: 5 },
      },
      {
        text: "I want to understand how intelligence is built",
        sub: "The 'why' behind AI excites me as much as the result",
        weights: { ml_engineer: 5 },
      },
      {
        text: "I love building complete features end to end",
        sub: "From database schema to the button the user clicks",
        weights: { fullstack_dev: 4, mobile_dev: 2, product_manager: 1 },
      },
    ],
  },
  {
    question: "Picture your ideal workday. Which fits best?",
    context: "Not what you think you should want — what genuinely excites you.",
    options: [
      {
        text: "Designing flows and running user tests",
        sub: "Prototyping, iterating on real feedback all day",
        weights: { ui_ux_designer: 5, product_manager: 1 },
      },
      {
        text: "Writing APIs and optimizing databases",
        sub: "Server-side engineering and performance deep-dives",
        weights: { backend_dev: 5, fullstack_dev: 1 },
      },
      {
        text: "Writing SQL and building dashboards",
        sub: "Turning raw data into insights and presenting to leadership",
        weights: { data_analyst: 5 },
      },
      {
        text: "Doing pen tests and writing security reports",
        sub: "Finding vulnerabilities before the attackers do",
        weights: { cybersecurity: 5 },
      },
      {
        text: "Training models and reading research papers",
        sub: "ML experimentation and pushing SOTA benchmarks",
        weights: { ml_engineer: 5 },
      },
      {
        text: "Running user interviews and writing product specs",
        sub: "Turning user pain into a clear roadmap for the team",
        weights: { product_manager: 5, ui_ux_designer: 1 },
      },
    ],
  },
  {
    question: "What matters most to you in your work?",
    context: "This reveals your core motivation — the 'why' behind everything.",
    options: [
      {
        text: "Craft — my work is seen and felt by real users",
        sub: "Visible, tangible quality in every interaction",
        weights: { ui_ux_designer: 3, frontend_dev: 3, mobile_dev: 2 },
      },
      {
        text: "Depth — mastering systems at a fundamental level",
        sub: "Technical excellence and architectural understanding",
        weights: { backend_dev: 3, devops_cloud: 3 },
      },
      {
        text: "Impact — my insights drive million-dollar decisions",
        sub: "Business value through data, analysis, and strategy",
        weights: { data_analyst: 3, product_manager: 3 },
      },
      {
        text: "Trust — companies depend on me to keep them safe",
        sub: "Security is critical, invisible infrastructure",
        weights: { cybersecurity: 5 },
      },
      {
        text: "Innovation — I'm at the frontier of what AI can do",
        sub: "Pushing the boundary of what's technically possible",
        weights: { ml_engineer: 5, data_analyst: 1 },
      },
      {
        text: "Empathy — I obsess over solving real human problems",
        sub: "User-centered thinking at every step of the process",
        weights: { product_manager: 4, ui_ux_designer: 2, mobile_dev: 1 },
      },
    ],
  },
  {
    question: "Where do you see yourself in 5 years?",
    context: "Be honest — this is your ambition, not a job interview answer.",
    options: [
      {
        text: "Lead Designer shaping a major product's identity",
        sub: "Design leadership and visual strategy at scale",
        weights: { ui_ux_designer: 5, frontend_dev: 1 },
      },
      {
        text: "Principal Engineer architecting large-scale systems",
        sub: "Deep technical leadership and system design",
        weights: { backend_dev: 4, fullstack_dev: 2 },
      },
      {
        text: "Head of Analytics driving company strategy",
        sub: "Data-driven decision-making at an executive level",
        weights: { data_analyst: 5, ml_engineer: 1 },
      },
      {
        text: "CISO or Security Lead at a company people trust",
        sub: "Leading security culture, architecture, and response",
        weights: { cybersecurity: 5 },
      },
      {
        text: "AI/ML Tech Lead working on models that change industries",
        sub: "Pushing ML research into real production impact",
        weights: { ml_engineer: 5 },
      },
      {
        text: "CPO or Tech Founder building something that matters",
        sub: "Product vision, company building, and user obsession",
        weights: { product_manager: 4, fullstack_dev: 2 },
      },
    ],
  },
];
