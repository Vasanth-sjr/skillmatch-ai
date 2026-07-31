// Shared technical-vocabulary and term-matching engine — originally built
// for the ATS Checker, now the common foundation reused by AMSCE's
// evidence-collection modules (Resume Context Analyzer, Interview
// Analyzer) so every part of the platform recognizes the same skill
// identity for "react", "postgresql", "docker", etc.

import { SKILL_POOLS } from "@/data/skillPools";

export const TECH_VOCAB_EXTRA: string[] = [
  "python","java","javascript","typescript","golang","go","rust","cpp","csharp","ruby","php",
  "swift","kotlin","scala","perl","r","matlab","dart","elixir","haskell","julia","bash","shell",
  "react","vue","angular","svelte","nextjs","nuxtjs","gatsby","remix","astro","jquery",
  "html","css","sass","scss","less","tailwind","bootstrap","materialui","chakra","shadcn",
  "webpack","vite","rollup","parcel","babel","eslint","prettier",
  "nodejs","express","fastapi","django","flask","rails","laravel","spring","springboot",
  "nestjs","hapi","koa","fiber","gin","echo","actix","fastify",
  "reactnative","flutter","android","ios","expo",
  "postgresql","mysql","sqlite","mongodb","redis","elasticsearch","dynamodb",
  "cassandra","neo4j","influxdb","mariadb","mssql","oracle","supabase","firebase",
  "prisma","sequelize","typeorm","mongoose","drizzle",
  "aws","gcp","azure","docker","kubernetes","k8s","terraform","ansible","puppet","chef",
  "jenkins","github","gitlab","bitbucket","circleci","travis","heroku","vercel","netlify",
  "nginx","apache","linux","ubuntu","helm","istio","prometheus","grafana","datadog",
  "tensorflow","pytorch","keras","sklearn","pandas","numpy","matplotlib","seaborn","opencv",
  "nltk","spacy","transformers","huggingface","langchain","openai","llm","bert","gpt",
  "mlops","mlflow","airflow","xgboost","lightgbm","spark","hadoop","hive","kafka","flink",
  "api","rest","graphql","grpc","websocket","microservices","serverless",
  "devops","agile","scrum","tdd","bdd","oop","cicd","git","sql","nosql","orm","mvc","jwt","oauth",
  "blockchain","solidity","web3","iot","embedded",
  "etl","dbt","tableau","powerbi","excel","bigquery","redshift","snowflake","databricks",
  "cybersecurity","owasp","ssl","tls","encryption","burpsuite","wireshark","splunk","nmap",
  "figma","sketch","unity","unreal","opengl","webgl","threejs",
];

function buildVocab(): string[] {
  const fromPools = Object.values(SKILL_POOLS).flat().map(s => s.toLowerCase());
  return Array.from(new Set([...fromPools, ...TECH_VOCAB_EXTRA]));
}
export const VOCAB = buildVocab();

export const SYNONYMS: Record<string, string[]> = {
  "javascript": ["js","es6","es2015","ecmascript"],
  "typescript": ["ts"],
  "python":     ["py","python3"],
  "golang":     ["go"],
  "nodejs":     ["node","node.js"],
  "react":      ["reactjs","react.js"],
  "vue":        ["vuejs","vue.js","vue3"],
  "nextjs":     ["next","next.js"],
  "postgresql": ["postgres","pg","psql"],
  "mongodb":    ["mongo"],
  "kubernetes": ["k8s"],
  "scikit-learn":["sklearn"],
  "cpp":        ["c++","cplusplus"],
  "csharp":     ["c#","dotnet",".net"],
  "reactnative":["react native","rn"],
};

export function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#]/g, "").trim();
}

const ALIAS_MAP = new Map<string, string>();
for (const [canonicalTerm, aliases] of Object.entries(SYNONYMS)) {
  for (const alias of aliases) {
    ALIAS_MAP.set(norm(alias), norm(canonicalTerm));
  }
}

export function canonical(s: string): string {
  const n = norm(s);
  return ALIAS_MAP.get(n) ?? n;
}

/**
 * Word-boundary-safe check for whether `term` appears in `text`, matching
 * the same lookaround pattern used throughout the ATS Checker so a search
 * for "go" doesn't match inside "google" or "algorithm".
 */
export function vocabTermFoundIn(text: string, term: string): boolean {
  const lowerText = " " + text.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ") + " ";
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<=[^a-z0-9+#]|^)${esc}(?=[^a-z0-9+#]|$)`);
  return re.test(lowerText);
}

/** Every VOCAB term (canonicalized) found anywhere in `text`. */
export function extractVocabTerms(text: string): string[] {
  const lowerText = " " + text.toLowerCase().replace(/[^a-z0-9+#.\s/-]/g, " ") + " ";
  const found = new Set<string>();
  for (const term of VOCAB) {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<=[^a-z0-9+#]|^)${esc}(?=[^a-z0-9+#]|$)`);
    if (re.test(lowerText)) found.add(term);
  }
  for (const phrase of Object.keys(SYNONYMS)) {
    if (phrase.includes(" ") && lowerText.includes(phrase)) found.add(phrase);
  }
  return Array.from(found).sort();
}
