import { CareerPathKey } from "./careerPaths";

export interface RoadmapPhase {
  period: string;
  title: string;
  focus: string;
  skills: string[];
  milestone: string;
}

export interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  outcome: string;
}

export interface JobLevel {
  level: "Entry" | "Mid" | "Senior";
  titles: string[];
  salary: string;
  experience: string;
  keySkills: string[];
}

export interface CareerRoadmap {
  summary: string;
  phases: RoadmapPhase[];
  projects: ProjectIdea[];
  jobLevels: JobLevel[];
  topCompanies: string[];
}

export const CAREER_ROADMAPS: Record<CareerPathKey, CareerRoadmap> = {

  frontend_dev: {
    summary: "Build beautiful, fast web interfaces that users love. Master HTML/CSS/JS, then React, then ship production-grade apps.",
    phases: [
      {
        period: "Month 1–2",
        title: "Web Foundations",
        focus: "HTML, CSS, JavaScript",
        skills: ["HTML5", "CSS3", "JavaScript", "Git", "Responsive Design", "Flexbox", "CSS Grid"],
        milestone: "Build and deploy static responsive websites from scratch",
      },
      {
        period: "Month 3–4",
        title: "React Ecosystem",
        focus: "React, TypeScript, APIs",
        skills: ["React", "TypeScript", "React Router", "REST APIs", "Tailwind CSS", "npm / Vite"],
        milestone: "Build dynamic SPAs that fetch and display real data",
      },
      {
        period: "Month 5–6",
        title: "Production Ready",
        focus: "Next.js, Testing, Deployment",
        skills: ["Next.js", "React Query", "Unit Testing", "Performance Optimization", "Vercel", "SEO Basics"],
        milestone: "Ship a full production app with auth, data, and deployment",
      },
    ],
    projects: [
      { title: "Portfolio Website", description: "Personal site showcasing your projects and skills", techStack: ["HTML", "CSS", "JavaScript"], difficulty: "Beginner", outcome: "Live URL to share with employers" },
      { title: "Weather Dashboard", description: "Real-time weather app using OpenWeatherMap API", techStack: ["React", "REST API", "CSS"], difficulty: "Beginner", outcome: "Demonstrates API integration skills" },
      { title: "Task Manager App", description: "Full CRUD app with filters, drag-and-drop, and localStorage persistence", techStack: ["React", "TypeScript", "Tailwind CSS"], difficulty: "Intermediate", outcome: "Shows React state management depth" },
      { title: "E-commerce Product Page", description: "Product listing, cart, and checkout flow with mock payment", techStack: ["Next.js", "TypeScript", "Supabase"], difficulty: "Intermediate", outcome: "Full-stack frontend project for portfolio" },
      { title: "Real-time Chat App", description: "WhatsApp-style chat with rooms, authentication, and live messages", techStack: ["Next.js", "Supabase Realtime", "Tailwind CSS"], difficulty: "Advanced", outcome: "Demonstrates realtime, auth, and production deployment" },
    ],
    jobLevels: [
      { level: "Entry", titles: ["Junior Frontend Developer", "Frontend Intern", "UI Developer"], salary: "₹3–8 LPA", experience: "0–1 years", keySkills: ["HTML", "CSS", "JavaScript", "React"] },
      { level: "Mid", titles: ["Frontend Developer", "React Developer", "UI Engineer"], salary: "₹8–20 LPA", experience: "2–4 years", keySkills: ["React", "TypeScript", "Next.js", "Testing"] },
      { level: "Senior", titles: ["Senior Frontend Engineer", "Lead Frontend Developer", "Frontend Architect"], salary: "₹20–45 LPA", experience: "5+ years", keySkills: ["System Design", "Performance", "Mentoring", "Architecture"] },
    ],
    topCompanies: ["Razorpay", "Swiggy", "Zomato", "Meesho", "Groww", "PhonePe", "CRED", "Zepto"],
  },

  backend_dev: {
    summary: "Power applications with robust APIs, databases, and server logic. Master one language deeply, then learn system design.",
    phases: [
      {
        period: "Month 1–2",
        title: "Programming Foundations",
        focus: "Python/Node.js, SQL, Git",
        skills: ["Python or Node.js", "SQL", "Git", "REST APIs", "JSON", "Postman"],
        milestone: "Write scripts and simple APIs that interact with a database",
      },
      {
        period: "Month 3–4",
        title: "Framework & Database",
        focus: "FastAPI/Express, PostgreSQL",
        skills: ["FastAPI or Express.js", "PostgreSQL", "Authentication (JWT)", "ORM (Prisma/SQLAlchemy)", "Docker basics"],
        milestone: "Build a complete REST API with auth, CRUD, and a real database",
      },
      {
        period: "Month 5–6",
        title: "Scale & Deploy",
        focus: "System Design, Cloud, Caching",
        skills: ["Redis", "Message Queues", "AWS or GCP basics", "System Design", "CI/CD", "Monitoring"],
        milestone: "Deploy a production API with caching, queues, and cloud infrastructure",
      },
    ],
    projects: [
      { title: "URL Shortener API", description: "Build a Bitly-clone with link tracking and expiry", techStack: ["Python", "FastAPI", "PostgreSQL"], difficulty: "Beginner", outcome: "Your first deployed REST API" },
      { title: "Blog API with Auth", description: "Full CRUD API with JWT auth, roles, and file uploads", techStack: ["Node.js", "Express", "PostgreSQL", "JWT"], difficulty: "Intermediate", outcome: "Production-ready auth pattern" },
      { title: "E-commerce Backend", description: "Product catalog, cart, orders, payments (Razorpay mock)", techStack: ["Python", "FastAPI", "PostgreSQL", "Redis"], difficulty: "Intermediate", outcome: "Complex domain modeling experience" },
      { title: "Real-time Notification System", description: "WebSocket-based notifications with queue and persistence", techStack: ["Node.js", "Redis", "PostgreSQL", "WebSockets"], difficulty: "Advanced", outcome: "Demonstrates system design skills" },
    ],
    jobLevels: [
      { level: "Entry", titles: ["Backend Developer", "API Developer", "Software Engineer - Backend"], salary: "₹4–10 LPA", experience: "0–1 years", keySkills: ["Python or Node.js", "SQL", "REST APIs"] },
      { level: "Mid", titles: ["Backend Engineer", "Software Engineer II", "API Engineer"], salary: "₹10–25 LPA", experience: "2–4 years", keySkills: ["System Design", "Docker", "PostgreSQL", "Redis"] },
      { level: "Senior", titles: ["Senior Backend Engineer", "Principal Engineer", "Backend Architect"], salary: "₹25–60 LPA", experience: "5+ years", keySkills: ["Distributed Systems", "Architecture", "Team Leadership"] },
    ],
    topCompanies: ["Flipkart", "Razorpay", "Juspay", "Setu", "Cashfree", "BrowserStack", "Freshworks", "Postman"],
  },

  fullstack_dev: {
    summary: "Own the entire product — from pixels to database. Learn both frontend and backend, then connect them into complete products.",
    phases: [
      {
        period: "Month 1–2",
        title: "Frontend Core",
        focus: "HTML, CSS, JavaScript, React",
        skills: ["HTML5", "CSS3", "JavaScript", "React", "Git", "Responsive Design"],
        milestone: "Build interactive UIs that call APIs",
      },
      {
        period: "Month 3–4",
        title: "Backend + Database",
        focus: "Node.js, PostgreSQL, Auth",
        skills: ["Node.js", "Express or FastAPI", "PostgreSQL", "JWT Auth", "REST APIs", "Supabase"],
        milestone: "Build a full-stack app with auth and database",
      },
      {
        period: "Month 5–6",
        title: "Ship Products",
        focus: "Next.js, Deployment, TypeScript",
        skills: ["Next.js", "TypeScript", "Docker", "Vercel or Railway", "Testing", "CI/CD"],
        milestone: "Deploy 2 full-stack projects end-to-end",
      },
    ],
    projects: [
      { title: "Todo App (Full Stack)", description: "Classic todo with auth, sync, and multi-device support", techStack: ["React", "Node.js", "PostgreSQL"], difficulty: "Beginner", outcome: "Complete full-stack flow" },
      { title: "Job Board Clone", description: "Post and browse jobs with employer/seeker roles", techStack: ["Next.js", "Supabase", "TypeScript"], difficulty: "Intermediate", outcome: "Multi-role auth and RBAC" },
      { title: "SaaS Subscription App", description: "Product with Razorpay billing, dashboards, and multi-tenancy", techStack: ["Next.js", "PostgreSQL", "Stripe/Razorpay"], difficulty: "Advanced", outcome: "Real SaaS architecture experience" },
    ],
    jobLevels: [
      { level: "Entry", titles: ["Full Stack Developer", "MEAN/MERN Stack Developer", "Software Engineer"], salary: "₹4–10 LPA", experience: "0–1 years", keySkills: ["React", "Node.js", "SQL"] },
      { level: "Mid", titles: ["Full Stack Engineer", "Product Engineer", "Software Engineer II"], salary: "₹10–25 LPA", experience: "2–4 years", keySkills: ["Next.js", "TypeScript", "System Design"] },
      { level: "Senior", titles: ["Senior Full Stack Engineer", "Tech Lead", "Engineering Manager"], salary: "₹25–55 LPA", experience: "5+ years", keySkills: ["Architecture", "Team Leadership", "System Design"] },
    ],
    topCompanies: ["Razorpay", "Swiggy", "Zepto", "Urban Company", "Meesho", "slice", "Fi Money", "Groww"],
  },

  ui_ux_designer: {
    summary: "Design products people love. Learn the design process, master Figma, and build a portfolio that wins roles.",
    phases: [
      {
        period: "Month 1–2",
        title: "Design Fundamentals",
        focus: "Figma, Design Principles, Research",
        skills: ["Figma", "Typography", "Color Theory", "Layout & Grid", "Design Principles", "User Research Basics"],
        milestone: "Design a complete mobile app screen with proper spacing and typography",
      },
      {
        period: "Month 3–4",
        title: "UX Process",
        focus: "Wireframes, Prototypes, User Testing",
        skills: ["Wireframing", "Prototyping", "Usability Testing", "User Personas", "Information Architecture", "Design Systems"],
        milestone: "Run a complete UX project from research to prototype",
      },
      {
        period: "Month 5–6",
        title: "Portfolio & Handoff",
        focus: "Case Studies, Dev Handoff, Motion",
        skills: ["Case Study Writing", "Dev Handoff (Figma)", "Micro-interactions", "Accessibility", "Design Tokens", "FigJam"],
        milestone: "3 polished case studies live on Behance/Dribbble",
      },
    ],
    projects: [
      { title: "Mobile App Redesign", description: "Pick a popular Indian app (Swiggy/IRCTC) and redesign 5 key screens", techStack: ["Figma"], difficulty: "Beginner", outcome: "Case study comparing before/after with research insights" },
      { title: "Fintech App Design", description: "Design an investment or payments app from scratch with full UX flow", techStack: ["Figma", "FigJam"], difficulty: "Intermediate", outcome: "End-to-end UX case study" },
      { title: "Design System", description: "Build a complete component library for a SaaS product", techStack: ["Figma", "Design Tokens"], difficulty: "Advanced", outcome: "Shows systematic thinking that engineering teams love" },
    ],
    jobLevels: [
      { level: "Entry", titles: ["UI/UX Designer", "Product Designer", "Visual Designer"], salary: "₹3–7 LPA", experience: "0–1 years", keySkills: ["Figma", "Wireframing", "Prototyping"] },
      { level: "Mid", titles: ["Senior UI/UX Designer", "Product Designer", "UX Lead"], salary: "₹7–18 LPA", experience: "2–4 years", keySkills: ["Design Systems", "User Research", "Stakeholder Management"] },
      { level: "Senior", titles: ["Lead Designer", "Head of Design", "Principal Designer"], salary: "₹18–40 LPA", experience: "5+ years", keySkills: ["Design Strategy", "Team Building", "Product Vision"] },
    ],
    topCompanies: ["Razorpay", "PhonePe", "Swiggy", "CRED", "Meesho", "Zomato", "Groww", "Navi"],
  },

  data_analyst: {
    summary: "Turn raw data into decisions. Master SQL and Python, learn to visualize, and tell stories with data that drive business outcomes.",
    phases: [
      {
        period: "Month 1–2",
        title: "Data Foundations",
        focus: "SQL, Excel, Statistics",
        skills: ["SQL", "Excel / Google Sheets", "Statistics Basics", "Python Basics", "Data Cleaning"],
        milestone: "Write complex SQL queries and summarize datasets",
      },
      {
        period: "Month 3–4",
        title: "Python for Data",
        focus: "Pandas, Matplotlib, Visualization",
        skills: ["Pandas", "NumPy", "Matplotlib", "Seaborn", "Jupyter Notebooks", "Power BI or Tableau"],
        milestone: "Complete an end-to-end EDA (Exploratory Data Analysis) project",
      },
      {
        period: "Month 5–6",
        title: "Business Analytics",
        focus: "Dashboards, Storytelling, A/B Testing",
        skills: ["Dashboard Design", "A/B Testing", "Business Metrics", "Google Analytics", "Looker Studio", "Storytelling with Data"],
        milestone: "Build a business dashboard and present insights to non-technical audience",
      },
    ],
    projects: [
      { title: "Sales Data Analysis", description: "Analyze a retail dataset for trends, seasonal patterns, and top SKUs", techStack: ["Python", "Pandas", "Matplotlib"], difficulty: "Beginner", outcome: "Full EDA notebook on GitHub" },
      { title: "IPL / Cricket Analytics", description: "Player performance analysis, team win probability", techStack: ["Python", "Pandas", "Seaborn"], difficulty: "Beginner", outcome: "Portfolio project Indians love" },
      { title: "Customer Churn Analysis", description: "Identify which users are likely to churn and why", techStack: ["Python", "SQL", "Tableau"], difficulty: "Intermediate", outcome: "Business-relevant insight report" },
      { title: "E-commerce Revenue Dashboard", description: "Live Tableau/Power BI dashboard with KPIs, drill-downs", techStack: ["SQL", "Power BI or Tableau"], difficulty: "Intermediate", outcome: "Shows business dashboard skills employers need" },
    ],
    jobLevels: [
      { level: "Entry", titles: ["Data Analyst", "Business Analyst", "Reporting Analyst"], salary: "₹3–8 LPA", experience: "0–1 years", keySkills: ["SQL", "Excel", "Python Basics"] },
      { level: "Mid", titles: ["Senior Data Analyst", "Analytics Engineer", "BI Developer"], salary: "₹8–20 LPA", experience: "2–4 years", keySkills: ["Python", "Tableau/Power BI", "Statistical Analysis"] },
      { level: "Senior", titles: ["Lead Analyst", "Analytics Manager", "Head of Data"], salary: "₹20–45 LPA", experience: "5+ years", keySkills: ["Strategy", "Team Leadership", "Business Acumen"] },
    ],
    topCompanies: ["Flipkart", "Amazon", "Swiggy", "Zomato", "OLA", "MakeMyTrip", "Paytm", "Nykaa"],
  },

  ml_engineer: {
    summary: "Build AI systems that learn. Go from Python fundamentals to training models, deploying ML APIs, and shipping real AI products.",
    phases: [
      {
        period: "Month 1–2",
        title: "Python + Math Foundations",
        focus: "Python, NumPy, Statistics, Linear Algebra",
        skills: ["Python", "NumPy", "Pandas", "Statistics", "Linear Algebra Basics", "Matplotlib"],
        milestone: "Implement basic ML algorithms from scratch (linear regression, KNN)",
      },
      {
        period: "Month 3–4",
        title: "Core ML + Deep Learning",
        focus: "scikit-learn, TensorFlow/PyTorch",
        skills: ["scikit-learn", "TensorFlow or PyTorch", "CNNs", "Feature Engineering", "Model Evaluation", "Kaggle"],
        milestone: "Win or rank in a Kaggle competition, build image/text classifier",
      },
      {
        period: "Month 5–6",
        title: "MLOps + LLMs",
        focus: "Deploy models, LLMs, APIs",
        skills: ["FastAPI", "Model Deployment", "Docker", "HuggingFace", "LangChain", "MLflow"],
        milestone: "Deploy a real ML model as an API; build one LLM-powered app",
      },
    ],
    projects: [
      { title: "Spam Email Classifier", description: "NLP classifier with 95%+ accuracy using TF-IDF + Naive Bayes", techStack: ["Python", "scikit-learn", "NLTK"], difficulty: "Beginner", outcome: "First end-to-end ML project" },
      { title: "House Price Predictor", description: "Regression model with feature engineering and Streamlit UI", techStack: ["Python", "scikit-learn", "Streamlit"], difficulty: "Beginner", outcome: "Deployed ML web app" },
      { title: "Resume Parser API", description: "Extract skills, experience, education from PDF resumes", techStack: ["Python", "spaCy", "FastAPI"], difficulty: "Intermediate", outcome: "Real-world NLP application" },
      { title: "AI Chatbot with RAG", description: "Company knowledge base chatbot using LangChain + vector DB", techStack: ["Python", "LangChain", "OpenAI API", "Pinecone"], difficulty: "Advanced", outcome: "LLM app — most in-demand skill in 2025" },
    ],
    jobLevels: [
      { level: "Entry", titles: ["ML Engineer", "Data Scientist", "AI/ML Developer"], salary: "₹6–14 LPA", experience: "0–1 years", keySkills: ["Python", "scikit-learn", "Deep Learning basics"] },
      { level: "Mid", titles: ["Senior ML Engineer", "Applied Scientist", "AI Engineer"], salary: "₹14–35 LPA", experience: "2–4 years", keySkills: ["PyTorch", "MLOps", "System Design", "LLMs"] },
      { level: "Senior", titles: ["Principal ML Engineer", "ML Tech Lead", "Head of AI"], salary: "₹35–80 LPA", experience: "5+ years", keySkills: ["Research", "Architecture", "Team Leadership"] },
    ],
    topCompanies: ["Google", "Microsoft", "Amazon", "Flipkart AI", "Sarvam AI", "Krutrim", "Juspay", "ShareChat"],
  },

  product_manager: {
    summary: "Define what to build and why. Master user research, data-driven decisions, and cross-functional communication to ship great products.",
    phases: [
      {
        period: "Month 1–2",
        title: "PM Fundamentals",
        focus: "Product Thinking, Research, Frameworks",
        skills: ["Product Thinking", "User Research", "PRD Writing", "Market Analysis", "Wireframing (Figma basics)", "RICE / MoSCoW"],
        milestone: "Write a full PRD for a feature from scratch",
      },
      {
        period: "Month 3–4",
        title: "Data & Metrics",
        focus: "Analytics, SQL, A/B Testing",
        skills: ["SQL Basics", "Google Analytics", "Mixpanel/Amplitude", "A/B Testing", "Funnel Analysis", "North Star Metrics"],
        milestone: "Define and instrument metrics for a product feature",
      },
      {
        period: "Month 5–6",
        title: "Ship & Lead",
        focus: "Agile, Stakeholders, Strategy",
        skills: ["Agile / Scrum", "Roadmapping", "Stakeholder Management", "OKRs", "Go-to-Market Strategy", "Competitive Analysis"],
        milestone: "Run a full sprint cycle as PM on a real or mock project",
      },
    ],
    projects: [
      { title: "App Teardown Case Study", description: "Deep-dive analysis of Swiggy/CRED: metrics, flows, improvements", techStack: ["Figma", "Notion"], difficulty: "Beginner", outcome: "Shows product thinking in portfolio" },
      { title: "Feature PRD: Payments App", description: "Full PRD for a UPI split-payment feature with user stories and metrics", techStack: ["Notion", "Figma", "Miro"], difficulty: "Intermediate", outcome: "Demonstrates end-to-end PM thinking" },
      { title: "0→1 Product Strategy", description: "Build a mini business plan for a new product: TAM, GTM, metrics, roadmap", techStack: ["Notion", "Figma"], difficulty: "Advanced", outcome: "Interview-winning PM portfolio piece" },
    ],
    jobLevels: [
      { level: "Entry", titles: ["Associate PM", "Product Analyst", "APM"], salary: "₹6–14 LPA", experience: "0–2 years", keySkills: ["Product Thinking", "SQL", "User Research"] },
      { level: "Mid", titles: ["Product Manager", "Senior PM", "Group PM"], salary: "₹14–35 LPA", experience: "2–5 years", keySkills: ["Roadmapping", "Metrics", "Stakeholder Mgmt"] },
      { level: "Senior", titles: ["Senior PM", "Director of Product", "VP Product"], salary: "₹35–80 LPA", experience: "5+ years", keySkills: ["Product Strategy", "P&L Ownership", "Team Building"] },
    ],
    topCompanies: ["Razorpay", "CRED", "Groww", "PhonePe", "Meesho", "Swiggy", "Zomato", "Nykaa"],
  },

  devops_cloud: {
    summary: "Automate everything, break nothing. Master Linux, Docker, Kubernetes, and cloud infrastructure to ship and scale at speed.",
    phases: [
      {
        period: "Month 1–2",
        title: "Linux & Networking",
        focus: "Linux, Bash, Git, Networking",
        skills: ["Linux CLI", "Bash Scripting", "Git", "Networking Basics (TCP/IP, DNS)", "SSH", "Cron Jobs"],
        milestone: "Automate server setup with a Bash script",
      },
      {
        period: "Month 3–4",
        title: "Containers & CI/CD",
        focus: "Docker, Kubernetes, GitHub Actions",
        skills: ["Docker", "Docker Compose", "Kubernetes basics", "GitHub Actions", "Jenkins", "Nginx"],
        milestone: "Deploy a Dockerized app with a CI/CD pipeline",
      },
      {
        period: "Month 5–6",
        title: "Cloud & IaC",
        focus: "AWS/GCP, Terraform, Monitoring",
        skills: ["AWS (EC2, S3, RDS, Lambda)", "Terraform", "Prometheus", "Grafana", "ELK Stack", "Security Groups"],
        milestone: "Provision full cloud infrastructure with Terraform",
      },
    ],
    projects: [
      { title: "Dockerize a Web App", description: "Containerize a Node.js + PostgreSQL app with Docker Compose", techStack: ["Docker", "Docker Compose", "Nginx"], difficulty: "Beginner", outcome: "Foundation of all DevOps work" },
      { title: "CI/CD Pipeline", description: "GitHub Actions pipeline: test → build → push Docker → deploy to EC2", techStack: ["GitHub Actions", "Docker", "AWS EC2"], difficulty: "Intermediate", outcome: "Automated deployment flow" },
      { title: "Kubernetes Cluster", description: "Deploy a microservices app on Kubernetes with Helm charts", techStack: ["Kubernetes", "Helm", "AWS EKS"], difficulty: "Advanced", outcome: "Most valuable DevOps portfolio project" },
    ],
    jobLevels: [
      { level: "Entry", titles: ["DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer"], salary: "₹5–12 LPA", experience: "0–1 years", keySkills: ["Linux", "Docker", "Git"] },
      { level: "Mid", titles: ["Senior DevOps Engineer", "Platform Engineer", "SRE"], salary: "₹12–28 LPA", experience: "2–4 years", keySkills: ["Kubernetes", "Terraform", "AWS"] },
      { level: "Senior", titles: ["Lead DevOps", "Cloud Architect", "Principal SRE"], salary: "₹28–65 LPA", experience: "5+ years", keySkills: ["Architecture", "Security", "Cost Optimization"] },
    ],
    topCompanies: ["Freshworks", "BrowserStack", "Razorpay", "Ola", "Flipkart", "Amazon", "Microsoft", "ThoughtWorks"],
  },

  cybersecurity: {
    summary: "Defend systems, hunt threats, and break things legally. Master networking, ethical hacking, and security tools to protect the digital world.",
    phases: [
      {
        period: "Month 1–2",
        title: "Security Foundations",
        focus: "Networking, Linux, Cryptography",
        skills: ["Networking (TCP/IP, DNS, HTTP)", "Linux CLI", "Cryptography Basics", "OWASP Top 10", "Wireshark", "Nmap"],
        milestone: "Complete TryHackMe beginner path and understand OSI model",
      },
      {
        period: "Month 3–4",
        title: "Ethical Hacking",
        focus: "Pentesting, Web Security, CTFs",
        skills: ["Metasploit", "Burp Suite", "SQL Injection", "XSS", "CTF Challenges", "Kali Linux"],
        milestone: "Solve 10 CTF challenges on HackTheBox or TryHackMe",
      },
      {
        period: "Month 5–6",
        title: "Defensive Security",
        focus: "SOC, SIEM, Incident Response",
        skills: ["Splunk", "SIEM Tools", "Incident Response", "Vulnerability Assessment", "Security Auditing", "CEH / CompTIA Security+"],
        milestone: "Set up a home lab and complete a vulnerability assessment report",
      },
    ],
    projects: [
      { title: "Home Security Lab", description: "Set up VMs (Kali + vulnerable machines) and practice attacks safely", techStack: ["Kali Linux", "VirtualBox", "Metasploitable"], difficulty: "Beginner", outcome: "Safe practice environment" },
      { title: "Web App Pentesting Report", description: "Test DVWA for OWASP Top 10 vulnerabilities and write a full report", techStack: ["Burp Suite", "DVWA", "Nmap"], difficulty: "Intermediate", outcome: "Professional pentest report for portfolio" },
      { title: "Network Monitoring System", description: "Build a mini SOC with Splunk/ELK to detect anomalies", techStack: ["Splunk", "Python", "Linux"], difficulty: "Advanced", outcome: "Demonstrates blue team / defensive skills" },
    ],
    jobLevels: [
      { level: "Entry", titles: ["Security Analyst", "SOC Analyst L1", "Cybersecurity Trainee"], salary: "₹4–9 LPA", experience: "0–1 years", keySkills: ["Networking", "Linux", "OWASP"] },
      { level: "Mid", titles: ["Penetration Tester", "Security Engineer", "SOC Analyst L2"], salary: "₹9–22 LPA", experience: "2–4 years", keySkills: ["Metasploit", "Burp Suite", "SIEM"] },
      { level: "Senior", titles: ["Senior Security Engineer", "Security Architect", "CISO"], salary: "₹22–55 LPA", experience: "5+ years", keySkills: ["Architecture", "Compliance", "Team Leadership"] },
    ],
    topCompanies: ["HCL", "Wipro CyberSecurity", "Paytm", "CERT-In", "Quick Heal", "Securonix", "TAC Security"],
  },

  mobile_dev: {
    summary: "Build apps for the 750M+ smartphone users in India. Master React Native or Flutter and ship apps to the Play Store.",
    phases: [
      {
        period: "Month 1–2",
        title: "Mobile Foundations",
        focus: "React Native or Flutter, UI components",
        skills: ["React Native or Flutter", "JavaScript or Dart", "Mobile UI Components", "Navigation", "Git", "Expo"],
        milestone: "Build and run a multi-screen mobile app on your phone",
      },
      {
        period: "Month 3–4",
        title: "Data & APIs",
        focus: "State management, REST, Storage",
        skills: ["State Management (Redux or Riverpod)", "REST APIs", "AsyncStorage", "Camera & Location APIs", "Push Notifications (FCM)"],
        milestone: "Build an app that uses a real API, local storage, and push notifications",
      },
      {
        period: "Month 5–6",
        title: "Ship to Play Store",
        focus: "Auth, Payments, Deployment",
        skills: ["Firebase Auth", "Razorpay SDK", "App Store Deployment", "Performance Optimization", "Crash Reporting", "Analytics"],
        milestone: "Publish a live app to Google Play Store",
      },
    ],
    projects: [
      { title: "Notes App", description: "CRUD notes app with local storage, categories, and dark mode", techStack: ["React Native", "AsyncStorage"], difficulty: "Beginner", outcome: "First mobile app shipped" },
      { title: "Food Delivery Clone", description: "Swiggy-like UI: restaurant list, menu, cart, order tracking", techStack: ["React Native", "REST API", "Redux"], difficulty: "Intermediate", outcome: "Complex UI patterns demonstrated" },
      { title: "Live Chat App", description: "WhatsApp-style chat with Firebase Realtime DB and push notifications", techStack: ["React Native", "Firebase", "FCM"], difficulty: "Intermediate", outcome: "Realtime mobile app on Play Store" },
      { title: "UPI Payment App", description: "Mock payments app with Razorpay, transaction history, and QR scan", techStack: ["Flutter", "Razorpay SDK", "Firebase"], difficulty: "Advanced", outcome: "Fintech portfolio project — very in-demand" },
    ],
    jobLevels: [
      { level: "Entry", titles: ["Mobile Developer", "React Native Developer", "Android Developer"], salary: "₹3–8 LPA", experience: "0–1 years", keySkills: ["React Native or Flutter", "JavaScript/Dart", "REST APIs"] },
      { level: "Mid", titles: ["Senior Mobile Developer", "iOS/Android Engineer", "App Developer"], salary: "₹8–22 LPA", experience: "2–4 years", keySkills: ["State Management", "Performance", "Publishing"] },
      { level: "Senior", titles: ["Lead Mobile Engineer", "Mobile Architect", "Head of Mobile"], salary: "₹22–50 LPA", experience: "5+ years", keySkills: ["Architecture", "Team Leadership", "Native Modules"] },
    ],
    topCompanies: ["Meesho", "PhonePe", "CRED", "Groww", "Zepto", "ShareChat", "Ola", "Dream11"],
  },
};
