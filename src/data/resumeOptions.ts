// Predefined dropdown options for Resume Builder
// All lists also allow custom "Other" entry

export const BOARDS_10TH = [
  "CBSE", "ICSE", "Tamil Nadu State Board", "Maharashtra State Board",
  "Karnataka State Board", "Andhra Pradesh State Board", "Telangana State Board",
  "Kerala State Board", "Rajasthan State Board", "UP Board",
  "West Bengal Board", "Gujarat State Board", "Bihar State Board",
  "Punjab State Board", "Haryana State Board", "Other",
];

export const STREAMS_12TH = [
  "Science (PCM)", "Science (PCB)", "Science (PCMB)",
  "Commerce", "Commerce with Maths", "Arts / Humanities", "Other",
];

export const DEGREES = [
  "B.Tech", "B.E.", "B.Sc", "B.Sc (CS)", "B.Sc (IT)", "B.Sc (Data Science)",
  "BCA", "BCS", "B.Com", "BBA", "B.A.", "B.Des",
  "Diploma (Engineering)", "Diploma (Computer Science)",
  "M.Tech", "M.E.", "M.Sc", "M.Sc (CS)", "M.Sc (IT)",
  "MCA", "MBA", "M.Des",
  "Integrated M.Tech", "Integrated M.Sc", "Ph.D.", "Other",
];

export const BRANCHES = [
  "Computer Science & Engineering (CSE)",
  "Information Technology (IT)",
  "Electronics & Communication (ECE)",
  "Electrical Engineering (EE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Artificial Intelligence & ML",
  "Data Science",
  "Cyber Security",
  "Computer Science (general)",
  "Software Engineering",
  "Instrumentation Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Other",
];

export const UNIVERSITIES = [
  "Anna University", "VTU (Visvesvaraya Technological University)",
  "Pune University (SPPU)", "Mumbai University", "Osmania University",
  "University of Madras", "University of Delhi", "University of Calcutta",
  "Calicut University", "JNTU Hyderabad", "JNTU Kakinada",
  "Rajasthan Technical University", "RGPV Bhopal", "AKTU Lucknow",
  "IPU (GGSIPU)", "Bangalore University", "Mysore University",
  "Autonomous (IIT / NIT / BITS)", "Other / Autonomous College",
];

export const TECH_SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "Languages": [
    "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#",
    "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "R", "Scala", "Dart",
  ],
  "Frontend": [
    "React", "Next.js", "Vue.js", "Angular", "Svelte",
    "HTML5", "CSS3", "Tailwind CSS", "Bootstrap", "SASS / SCSS",
  ],
  "Backend": [
    "Node.js", "Express.js", "Django", "FastAPI", "Flask",
    "Spring Boot", "Laravel", "Ruby on Rails", "ASP.NET", "NestJS",
  ],
  "Databases": [
    "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Redis",
    "Firebase", "Supabase", "Oracle DB", "MS SQL Server", "Cassandra",
  ],
  "Cloud & DevOps": [
    "AWS", "Google Cloud (GCP)", "Azure", "Docker", "Kubernetes",
    "GitHub Actions", "Jenkins", "Terraform", "Linux / Bash", "Nginx",
  ],
  "Data & ML": [
    "Pandas", "NumPy", "Matplotlib", "Scikit-learn", "TensorFlow",
    "PyTorch", "Keras", "Jupyter Notebook", "Power BI", "Tableau",
  ],
  "Tools & Practices": [
    "Git", "GitHub", "GitLab", "Bitbucket", "Figma", "Postman",
    "VS Code", "IntelliJ IDEA", "Jira", "Notion", "REST APIs", "GraphQL",
  ],
  "Mobile": [
    "React Native", "Flutter", "Android (Kotlin)", "iOS (Swift)",
    "Expo", "Ionic",
  ],
};

export const SPOKEN_LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam",
  "Marathi", "Bengali", "Gujarati", "Punjabi", "Odia", "Assamese",
  "Urdu", "Sanskrit", "French", "German", "Spanish", "Japanese", "Mandarin",
];

export const PROFICIENCY_LEVELS = ["Native", "Fluent", "Professional", "Intermediate", "Basic"];

export const ACHIEVEMENT_CATEGORIES = [
  "Competitive Programming", "Hackathon", "Academic Rank / Topper",
  "Research Paper / Publication", "Open Source Contribution",
  "Sports & Extracurricular", "Scholarship / Fellowship", "Award / Recognition", "Other",
];

export const CERTIFICATION_ISSUERS = [
  "Google", "Meta", "Amazon Web Services (AWS)", "Microsoft",
  "Coursera", "edX", "Udemy", "NPTEL (IIT)", "LinkedIn Learning",
  "HackerRank", "Cisco (CCNA)", "CompTIA", "Oracle", "IBM",
  "freeCodeCamp", "Infosys Springboard", "TCS iON", "Other",
];

export const INTERNSHIP_DURATIONS = [
  "1 month", "2 months", "3 months", "4 months", "5 months", "6 months",
  "7–9 months", "10–12 months", "More than 1 year",
];

export const WORK_TYPES = ["In-Office", "Remote", "Hybrid"];

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const YEARS_PAST = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));
export const YEARS_GRAD  = Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() + 2 - i));
