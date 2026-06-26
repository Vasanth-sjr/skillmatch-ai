import type { CareerPathKey } from "./careerPaths";

export const SKILL_POOLS: Record<CareerPathKey, string[]> = {
  frontend_dev: [
    "React", "TypeScript", "JavaScript", "CSS", "HTML", "Next.js", "Tailwind CSS",
    "Vue.js", "Angular", "Redux", "Zustand", "Vite", "Webpack", "Jest",
    "Testing Library", "Storybook", "Figma", "REST APIs", "GraphQL", "Three.js",
    "Framer Motion", "Sass", "Web Accessibility", "Performance Optimization",
  ],
  backend_dev: [
    "Node.js", "Python", "Java", "Go", "PostgreSQL", "MySQL", "MongoDB",
    "Redis", "Docker", "REST APIs", "GraphQL", "FastAPI", "Django", "Express.js",
    "Spring Boot", "Microservices", "System Design", "Kafka", "RabbitMQ",
    "AWS Lambda", "Nginx", "Linux", "CI/CD", "Prisma", "TypeORM",
  ],
  fullstack_dev: [
    "React", "Node.js", "TypeScript", "PostgreSQL", "MongoDB", "Docker",
    "REST APIs", "Git", "AWS", "Redis", "Next.js", "GraphQL", "CSS", "HTML",
    "Linux", "Supabase", "Firebase", "Prisma", "Express.js", "Tailwind CSS",
    "Vite", "Nginx", "CI/CD", "System Design",
  ],
  ui_ux_designer: [
    "Figma", "Adobe XD", "Sketch", "User Research", "Wireframing", "Prototyping",
    "Design Systems", "Usability Testing", "Information Architecture", "InVision",
    "Accessibility", "Typography", "Color Theory", "Motion Design", "Framer",
    "Miro", "Maze", "Hotjar", "A/B Testing", "Design Tokens",
  ],
  data_analyst: [
    "SQL", "Python", "Tableau", "Power BI", "Excel", "Statistics", "R",
    "Data Visualization", "ETL", "Pandas", "NumPy", "Google Analytics",
    "A/B Testing", "Business Intelligence", "Looker", "dbt", "Airflow",
    "Jupyter Notebooks", "Matplotlib", "Seaborn", "BigQuery",
  ],
  ml_engineer: [
    "Python", "TensorFlow", "PyTorch", "Scikit-learn", "Machine Learning",
    "Deep Learning", "NLP", "Computer Vision", "MLOps", "AWS SageMaker",
    "Kubernetes", "Docker", "Statistics", "Linear Algebra", "LangChain",
    "Hugging Face", "OpenCV", "Spark", "Databricks", "Feature Engineering",
    "Model Deployment", "RAG", "Fine-tuning", "Vector Databases",
  ],
  product_manager: [
    "Product Roadmapping", "Agile", "Scrum", "User Research", "A/B Testing",
    "Analytics", "Stakeholder Management", "Jira", "Figma", "SQL",
    "OKRs", "PRD Writing", "Market Research", "Competitive Analysis",
    "Data Analysis", "Customer Discovery", "Prioritization Frameworks",
    "Go-to-Market Strategy", "Notion", "Linear",
  ],
  devops_cloud: [
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Linux",
    "CI/CD", "Jenkins", "GitHub Actions", "Monitoring", "Grafana", "Bash",
    "Ansible", "Python", "Prometheus", "ELK Stack", "Helm", "ArgoCD",
    "Vault", "Cloudflare", "Datadog", "CloudFormation",
  ],
  cybersecurity: [
    "Network Security", "Penetration Testing", "SIEM", "Linux", "Python",
    "Cryptography", "Vulnerability Assessment", "Incident Response", "Firewalls",
    "IDS/IPS", "OWASP", "Burp Suite", "Metasploit", "Compliance", "Nmap",
    "Wireshark", "CEH", "CISSP", "Zero Trust", "SOC", "Threat Intelligence",
    "Reverse Engineering", "Malware Analysis",
  ],
  mobile_dev: [
    "React Native", "Flutter", "Swift", "Kotlin", "Dart", "iOS Development",
    "Android Development", "Firebase", "REST APIs", "App Store Deployment",
    "Redux", "MobX", "SQLite", "Expo", "Xcode", "Android Studio",
    "Push Notifications", "In-App Purchases", "SwiftUI", "Jetpack Compose",
  ],
};
