import { CareerPathKey } from "./careerPaths";

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Category = "Concept" | "Practical" | "System Design" | "Behavioural";

export interface InterviewQuestion {
  id: string;
  question: string;
  difficulty: Difficulty;
  category: Category;
  answer: string;
  tips: string[];
  // Normalized skill terms this question demonstrates — consumed by the
  // AMSCE Interview Analyzer to score how substantively a typed answer
  // engages with the specific skill(s) it's tagged to. Uses the same
  // normalized-term vocabulary as the ATS Checker / SKILL_POOLS, not the
  // human-readable Skill Reviews labels — reconciling the two vocabularies
  // is handled by AMSCE's Evidence Normalizer (Phase 3), not here.
  skills: string[];
}

export const INTERVIEW_QUESTIONS: Record<CareerPathKey, InterviewQuestion[]> = {

  frontend_dev: [
    {
      id: "fe1", difficulty: "Easy", category: "Concept",
      question: "What is the difference between `==` and `===` in JavaScript?",
      answer: "`==` performs type coercion before comparing — so `1 == '1'` is true. `===` checks both value AND type strictly — `1 === '1'` is false. Always prefer `===` to avoid subtle bugs caused by automatic type conversion.",
      tips: ["Mention the term 'type coercion'", "Give one example of each"],
      skills: ["javascript"],
    },
    {
      id: "fe2", difficulty: "Easy", category: "Concept",
      question: "Explain the CSS Box Model.",
      answer: "Every HTML element is a rectangular box made of four layers from inside out: content → padding → border → margin. By default `box-sizing: content-box` means width/height only includes the content. Setting `box-sizing: border-box` makes width include padding and border too, which is almost always more predictable.",
      tips: ["Draw it mentally: content inside padding inside border inside margin", "Mention box-sizing: border-box as the modern default"],
      skills: ["css"],
    },
    {
      id: "fe3", difficulty: "Medium", category: "Concept",
      question: "Explain React's Virtual DOM and why it exists.",
      answer: "The Virtual DOM is a lightweight JavaScript object representing the real DOM. When state changes, React re-renders the Virtual DOM, diffs it against the previous version (reconciliation), and batches only the minimum necessary changes to the real DOM. Real DOM operations are slow; JavaScript object comparisons are fast — that's the entire reason it exists.",
      tips: ["Use the word 'reconciliation'", "Mention that direct DOM manipulation is expensive"],
      skills: ["react"],
    },
    {
      id: "fe4", difficulty: "Medium", category: "Practical",
      question: "What is `useEffect` and what does the dependency array control?",
      answer: "`useEffect` runs side effects after the component renders — data fetching, event listeners, timers. The dependency array controls when it re-runs: `[]` means only on mount (once), `[value]` means every time that value changes, and no array at all means after every single render. The cleanup function returned inside it runs before the next effect and on unmount.",
      tips: ["Mention the cleanup function — many forget it", "Give one real example like fetching data on userId change"],
      skills: ["react", "javascript"],
    },
    {
      id: "fe5", difficulty: "Medium", category: "Concept",
      question: "What is the difference between `useMemo` and `useCallback`?",
      answer: "`useMemo` memoizes the computed **result** of a function and returns it. `useCallback` memoizes the **function itself** and returns a stable reference. Use `useMemo` when a calculation is expensive. Use `useCallback` when passing a function as a prop to a child component to prevent it from re-rendering because the function reference changed.",
      tips: ["The key word: useMemo = value, useCallback = function", "Don't overuse them — they add overhead too"],
      skills: ["react"],
    },
    {
      id: "fe6", difficulty: "Easy", category: "Concept",
      question: "What is the difference between `display: flex` and `display: grid`?",
      answer: "Flexbox is one-dimensional — it controls layout along a single axis (either row OR column). CSS Grid is two-dimensional — it controls rows AND columns simultaneously. Use flex for components like navbars and card rows. Use grid for full page layouts where you need to place things in both dimensions.",
      tips: ["'Flex = 1D, Grid = 2D' is the core answer", "Mention that they're often used together"],
      skills: ["css"],
    },
    {
      id: "fe7", difficulty: "Hard", category: "Concept",
      question: "Explain the JavaScript event loop in detail.",
      answer: "JavaScript is single-threaded — one call stack. Synchronous code runs on the call stack. Async operations (setTimeout, fetch) are sent to browser Web APIs. When they complete, callbacks go into queues. Microtasks (Promises, queueMicrotask) go into the microtask queue. Macrotasks (setTimeout, setInterval) go into the task queue. The event loop rule: after each macrotask, drain ALL microtasks before picking the next macrotask.",
      tips: ["The order: sync code → all microtasks → one macrotask → all microtasks → next macrotask", "Promise.then() is a microtask, setTimeout is a macrotask"],
      skills: ["javascript"],
    },
    {
      id: "fe8", difficulty: "Hard", category: "Practical",
      question: "What is code splitting and how do you implement it in React?",
      answer: "Code splitting breaks your JavaScript bundle into smaller chunks that load on demand instead of all at once. In React, `React.lazy(() => import('./Component'))` splits that component into its own chunk. Wrap it in `<Suspense fallback={<Loading />}>` to show a fallback while the chunk loads. Vite and webpack handle the actual chunk generation automatically.",
      tips: ["Mention the Suspense boundary is required", "Route-level splitting is the most common and impactful use case"],
      skills: ["react", "vite", "webpack"],
    },
    {
      id: "fe9", difficulty: "Medium", category: "Concept",
      question: "What is CSS specificity and how is it calculated?",
      answer: "Specificity determines which CSS rule wins when multiple rules target the same element. It's calculated as a tuple (inline, ID, class/attribute/pseudo-class, element). Inline styles beat everything. Then `#id` selectors. Then `.class`, `[attr]`, `:hover`. Then `div`, `p` elements. When specificity is equal, the later rule in the stylesheet wins.",
      tips: ["The easy way to remember: style > id > class > element", "!important overrides all specificity but should be a last resort"],
      skills: ["css"],
    },
    {
      id: "fe10", difficulty: "Hard", category: "System Design",
      question: "How would you optimize a React app that renders a list of 10,000 items?",
      answer: "The key technique is virtual scrolling (windowing) — only render the items currently visible in the viewport, not all 10,000. Libraries like `react-window` or `react-virtual` handle this. Also use `React.memo` on list items to prevent re-renders, stable keys, and `useMemo` for filtering/sorting. Avoid anonymous object/function props that break memoization.",
      tips: ["'Windowing' or 'virtual scrolling' is the keyword they want", "Mention react-window specifically"],
      skills: ["react", "performanceoptimization"],
    },
  ],

  backend_dev: [
    {
      id: "be1", difficulty: "Easy", category: "Concept",
      question: "What is the difference between REST and GraphQL?",
      answer: "REST has fixed endpoints — one URL per resource (`/users/1/posts`). GraphQL has one endpoint and the client specifies exactly what data it needs in a query. REST often causes over-fetching (getting more data than needed) or under-fetching (needing multiple requests). GraphQL solves both by letting the client shape the response.",
      tips: ["Mention over-fetching and under-fetching as the core problems GraphQL solves", "Don't say GraphQL is always better — REST is simpler for simple APIs"],
      skills: ["restapi", "graphql"],
    },
    {
      id: "be2", difficulty: "Easy", category: "Concept",
      question: "What is the difference between SQL and NoSQL databases?",
      answer: "SQL databases store data in tables with a fixed schema, use relationships (foreign keys), and guarantee ACID transactions — great for structured data where consistency is critical (finance, e-commerce). NoSQL databases (MongoDB, Redis, DynamoDB) store data in flexible formats (documents, key-value, graph), scale horizontally more easily, but sacrifice some consistency guarantees. Choose based on your data shape and consistency requirements.",
      tips: ["ACID is a key term: Atomicity, Consistency, Isolation, Durability", "Mention a real NoSQL database by name"],
      skills: ["sql", "mongodb", "nosql"],
    },
    {
      id: "be3", difficulty: "Medium", category: "Concept",
      question: "What is an index in a database and when would you use one?",
      answer: "An index is a data structure (usually a B-tree) that allows the database to find rows without scanning the entire table — like an index in a book. Use indexes on columns you frequently filter or join on (WHERE, JOIN, ORDER BY). The tradeoff: indexes speed up reads but slow down writes because the index must be updated on every INSERT/UPDATE/DELETE.",
      tips: ["Always mention the read vs write tradeoff", "Composite indexes (multiple columns) are often more useful than single-column ones"],
      skills: ["sql", "postgresql"],
    },
    {
      id: "be4", difficulty: "Medium", category: "Concept",
      question: "What is the difference between authentication and authorization?",
      answer: "Authentication answers 'who are you?' — verifying identity, typically via username/password, JWT, or OAuth. Authorization answers 'what are you allowed to do?' — checking permissions after identity is confirmed. Example: logging in is authentication; checking if you have admin access is authorization. They're often confused but are entirely separate concerns.",
      tips: ["'AuthN vs AuthZ' is the shorthand", "Give a concrete example — like 'a user can log in (authn) but can't delete others' posts (authz)'"],
      skills: ["jwt", "oauth"],
    },
    {
      id: "be5", difficulty: "Medium", category: "Practical",
      question: "Explain how JWT (JSON Web Token) authentication works.",
      answer: "The server generates a JWT on login — a base64-encoded JSON payload (user ID, role, expiry) signed with a secret key. The client stores it (localStorage or httpOnly cookie) and sends it in the `Authorization: Bearer <token>` header on every request. The server verifies the signature without hitting the database — stateless. When it expires, the client uses a refresh token to get a new one.",
      tips: ["'Stateless' is the key advantage — no server-side session storage", "Mention that the payload is NOT encrypted by default — don't put sensitive data in it"],
      skills: ["jwt"],
    },
    {
      id: "be6", difficulty: "Hard", category: "System Design",
      question: "How would you design a rate limiter for an API?",
      answer: "The most common approach: token bucket algorithm. Each user gets a bucket of N tokens. Every request consumes one token. Tokens refill at a fixed rate. Store token counts in Redis with TTL. When tokens hit 0, return 429 Too Many Requests. For distributed systems, use Redis atomic operations (INCR + EXPIRE) to prevent race conditions across multiple API server instances.",
      tips: ["Redis is the standard answer for distributed rate limiting", "Mention the 429 status code", "Other algorithms: sliding window, fixed window"],
      skills: ["redis", "restapi", "systemdesign"],
    },
    {
      id: "be7", difficulty: "Hard", category: "Concept",
      question: "What is database connection pooling and why is it important?",
      answer: "Opening a new database connection is expensive — TCP handshake, authentication, memory allocation — taking 20–200ms. Connection pooling keeps a pool of pre-opened connections that requests reuse. Without pooling, high traffic creates thousands of connections that overwhelm the database. Tools like PgBouncer (PostgreSQL), HikariCP (Java), or the built-in pool in Prisma/Sequelize manage this automatically.",
      tips: ["Opening a connection is slow — that's the entire motivation", "Mention a specific pooling library or tool"],
      skills: ["postgresql", "sql"],
    },
    {
      id: "be8", difficulty: "Medium", category: "Practical",
      question: "What is the N+1 query problem and how do you fix it?",
      answer: "N+1 happens when you fetch N records and then make one additional query PER record. Example: fetch 100 users, then for each user, query their posts → 101 queries total. Fix it with eager loading: join the data in one query (`JOIN`), or use batch loading (DataLoader in GraphQL). ORMs like Prisma have `include` for this. It's one of the most common performance killers in backend apps.",
      tips: ["Show the bad code vs good code contrast mentally", "Mention it's extremely common in ORM usage"],
      skills: ["sql", "orm", "prisma"],
    },
    {
      id: "be9", difficulty: "Easy", category: "Practical",
      question: "What are HTTP status codes and what do the main groups mean?",
      answer: "1xx: informational (rare). 2xx: success — 200 OK, 201 Created, 204 No Content. 3xx: redirection — 301 Permanent, 302 Temporary. 4xx: client errors — 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Rate Limited. 5xx: server errors — 500 Internal Server Error, 503 Service Unavailable. Using the right code communicates meaning to API consumers.",
      tips: ["Know 200, 201, 400, 401, 403, 404, 429, 500 by heart", "401 = not authenticated, 403 = authenticated but not authorized"],
      skills: ["restapi"],
    },
    {
      id: "be10", difficulty: "Hard", category: "System Design",
      question: "How would you design a URL shortener like bit.ly?",
      answer: "Generate a unique 6-7 character short code using base62 (a-z, A-Z, 0-9). Store `{code: longUrl, clicks: 0, createdAt}` in a database. On redirect, look up the code, increment click count, return 301/302. For scale: cache hot URLs in Redis, use consistent hashing if sharding, generate codes via a distributed counter or random string with collision check. A single Redis instance can handle 100K+ redirects/second.",
      tips: ["Why base62? 62^6 = 56 billion unique codes", "Discuss 301 (cached by browser) vs 302 (always hits your server) — matters for analytics"],
      skills: ["systemdesign", "redis"],
    },
  ],

  fullstack_dev: [
    {
      id: "fs1", difficulty: "Easy", category: "Concept",
      question: "What is the difference between server-side rendering (SSR) and client-side rendering (CSR)?",
      answer: "CSR: browser downloads a minimal HTML shell, then JavaScript runs and builds the page. First load is slow, but navigation after is fast. SSR: server renders the full HTML and sends it — faster first load, better SEO. Next.js supports both: pages can be SSR, CSR, or static (SSG). The choice depends on whether the page needs SEO, how dynamic the data is, and how fast first load must be.",
      tips: ["Mention SEO as the key reason to choose SSR", "Next.js is the go-to answer for React SSR"],
      skills: ["nextjs", "react"],
    },
    {
      id: "fs2", difficulty: "Medium", category: "Practical",
      question: "How does session management work in a full-stack app?",
      answer: "Two approaches: session-based and token-based. Session-based: server stores session in memory or Redis, sends a session ID cookie. Every request looks up the session. Stateful — scales poorly. Token-based (JWT): server sends a signed token, client stores it, server verifies the signature on every request without hitting storage. Stateless — scales easily. Most modern apps use JWTs, often with a short expiry + refresh token pattern.",
      tips: ["Stateful vs stateless is the core tradeoff", "httpOnly cookies are more secure than localStorage for tokens"],
      skills: ["jwt", "redis"],
    },
    {
      id: "fs3", difficulty: "Medium", category: "Practical",
      question: "How would you handle file uploads in a web app?",
      answer: "Client sends a `multipart/form-data` POST request. Server receives the file stream, validates type and size, then stores it — locally (dev), or cloud storage in production (AWS S3, Supabase Storage, Cloudinary). Return a URL or file ID. Never store files in the database itself (only metadata). For large files, use pre-signed URLs so the client uploads directly to S3, bypassing your server entirely.",
      tips: ["Always validate file type and size on the server, not just the browser", "Pre-signed URLs for large files — this shows system design thinking"],
      skills: ["aws", "supabase"],
    },
    {
      id: "fs4", difficulty: "Hard", category: "System Design",
      question: "How would you implement real-time features (like live notifications) in a web app?",
      answer: "Three options in order of complexity: Long polling (client polls server every few seconds — simple but wasteful), Server-Sent Events (server pushes one-way to client — good for notifications), WebSockets (bi-directional — best for chat/games). For most notification use cases, SSE or WebSockets via libraries like Socket.io or Supabase Realtime is the right answer. WebSockets need careful handling for scale — need sticky sessions or a message broker like Redis Pub/Sub.",
      tips: ["Know the tradeoffs: polling < SSE < WebSockets in complexity and capability", "Mention Redis Pub/Sub for scaling WebSockets across multiple servers"],
      skills: ["websocket", "redis", "supabase"],
    },
    {
      id: "fs5", difficulty: "Medium", category: "Concept",
      question: "What is CORS and how do you fix it?",
      answer: "CORS (Cross-Origin Resource Sharing) is a browser security policy that blocks requests to a different origin (domain, port, protocol). Your React app on `localhost:3000` can't call `localhost:8080` by default. Fix: add `Access-Control-Allow-Origin: *` (or specific origin) header in your backend response. In Express, use the `cors` middleware. Never disable CORS in production with `*` — specify the exact allowed origins.",
      tips: ["CORS is a browser enforcement, not a server restriction — server just sets headers", "Preflight OPTIONS request happens for non-simple requests"],
      skills: ["express", "restapi"],
    },
    {
      id: "fs6", difficulty: "Easy", category: "Concept",
      question: "What is the purpose of environment variables and how do you use them?",
      answer: "Environment variables store configuration that changes between environments (dev/staging/prod) and sensitive values (API keys, DB passwords) that should never be in source code. In Node.js, `process.env.KEY`. In Vite (React), `import.meta.env.VITE_KEY` — only variables prefixed with `VITE_` are exposed to the browser. Use `.env` files locally and platform secrets in production. Never commit `.env` to git.",
      tips: ["Vite only exposes VITE_ prefixed vars to the browser for security", "Always add .env to .gitignore"],
      skills: ["nodejs", "vite"],
    },
    {
      id: "fs7", difficulty: "Hard", category: "System Design",
      question: "How do you handle database migrations in a production app?",
      answer: "Migrations are versioned SQL files that describe schema changes. Tools like Prisma Migrate, Flyway, or Knex.js track which migrations have run. Rules: never edit a migration after it's been applied to production — always add a new one. Make migrations backward-compatible when possible (add columns before removing old code). Run migrations in CI before deploying new code. Always have a rollback plan for destructive changes.",
      tips: ["'Never edit a migration after it runs' is the golden rule", "Mention backward compatibility — removing a column while old code still uses it breaks things"],
      skills: ["sql", "prisma", "cicd"],
    },
    {
      id: "fs8", difficulty: "Medium", category: "Practical",
      question: "What is the difference between optimistic and pessimistic UI updates?",
      answer: "Pessimistic: wait for the server to confirm before updating the UI — safe but slow. Optimistic: update the UI immediately assuming success, then roll back if the server returns an error — fast and feels snappy. React Query's `optimisticUpdates` and SWR's `mutate` support this. Best for low-stakes actions like liking a post. Avoid for critical operations like payments.",
      tips: ["'Optimistic = assume success, roll back on failure'", "Mention that optimistic UI is what makes apps feel native/fast"],
      skills: ["react", "reactquery"],
    },
  ],

  ui_ux_designer: [
    {
      id: "ux1", difficulty: "Easy", category: "Concept",
      question: "What is the difference between UX and UI design?",
      answer: "UX (User Experience) is about the overall feel — is it easy to use? Does it solve the user's problem? It covers research, information architecture, and user flows. UI (User Interface) is about the look — colors, typography, spacing, icons. Good UX without UI is a wireframe that works but looks rough. Good UI without UX is beautiful but confusing to use. A product needs both.",
      tips: ["Simple analogy: UX = architecture of a building, UI = interior decoration", "Mention that UX comes before UI in the design process"],
      skills: ["uxresearch", "informationarchitecture"],
    },
    {
      id: "ux2", difficulty: "Easy", category: "Concept",
      question: "What are the 10 Nielsen Heuristics?",
      answer: "Nielsen's 10 usability principles: 1. Visibility of system status. 2. Match between system and real world. 3. User control and freedom. 4. Consistency and standards. 5. Error prevention. 6. Recognition over recall. 7. Flexibility and efficiency. 8. Aesthetic and minimalist design. 9. Help users recognize/diagnose/recover from errors. 10. Help and documentation. These are the foundation of heuristic evaluation.",
      tips: ["You don't need to memorize all 10 — know 4-5 deeply and give examples", "Most common in interviews: #3 (undo), #6 (recognition over recall), #9 (error recovery)"],
      skills: ["usabilitytesting"],
    },
    {
      id: "ux3", difficulty: "Medium", category: "Practical",
      question: "Walk me through your design process from brief to final handoff.",
      answer: "1. Understand the problem: stakeholder interviews, define goals. 2. Research: user interviews, competitive analysis, analytics review. 3. Define: user personas, user journey maps, problem statement. 4. Ideate: sketches, crazy 8s, brainstorming. 5. Prototype: low-fi wireframes → high-fi Figma prototypes. 6. Test: usability testing with real users, 5 users reveal 85% of issues. 7. Iterate. 8. Handoff: design system, dev specs in Figma, edge cases documented.",
      tips: ["Always start by talking about research — it shows you don't design in a vacuum", "Mention usability testing — many juniors skip this step"],
      skills: ["figma", "uxresearch", "prototyping", "journeymapping"],
    },
    {
      id: "ux4", difficulty: "Medium", category: "Concept",
      question: "What is a design system and why does it matter?",
      answer: "A design system is a shared library of reusable UI components, design tokens (colors, spacing, typography), and guidelines. It ensures consistency — every button, modal, and card looks and behaves the same across the product. It speeds up design and development because you build components once and reuse them. Examples: Google's Material Design, Apple's HIG, Atlassian Design System. Figma's component libraries implement this.",
      tips: ["Mention 'single source of truth' — the real business value", "Connect design tokens to code (CSS variables, Tailwind config)"],
      skills: ["designsystems", "figma"],
    },
    {
      id: "ux5", difficulty: "Medium", category: "Practical",
      question: "How do you design for accessibility (a11y)?",
      answer: "Key practices: sufficient color contrast (minimum 4.5:1 for body text per WCAG AA), never convey information by color alone, provide text alternatives for images (alt text), ensure keyboard navigability (tab order, focus states), use semantic HTML elements (headings, labels, landmarks), support screen readers (ARIA labels when semantic HTML isn't enough). In Figma, check contrast with plugins and annotate focus states for developers.",
      tips: ["WCAG 4.5:1 contrast ratio for body text is the key number to know", "Mention that 15% of people have some form of disability — it's a huge market"],
      skills: ["accessibility", "figma"],
    },
    {
      id: "ux6", difficulty: "Hard", category: "Practical",
      question: "How would you convince a stakeholder to fund a UX research project?",
      answer: "Frame it in business value, not design value. Every $1 invested in UX returns $100 in savings (IBM research). Poor UX causes support tickets, churn, and lost conversions — all quantifiable. Present the specific risk: 'We're redesigning checkout without knowing why 40% of users drop off — we'll likely repeat the same mistake.' Propose a minimal-cost usability test (5 users, 1 week, low cost) as a pilot with measurable success criteria.",
      tips: ["Lead with business outcomes, not design process", "The IBM statistic ($1 UX → $100 ROI) is widely cited and powerful"],
      skills: ["uxresearch", "stakeholdercomms"],
    },
    {
      id: "ux7", difficulty: "Easy", category: "Concept",
      question: "What is the difference between a wireframe, mockup, and prototype?",
      answer: "Wireframe: low-fidelity skeleton showing layout and structure — no color, no real content. Takes 15 minutes. Used to align on structure before investing in visuals. Mockup: high-fidelity static design — real colors, fonts, images, content. Looks like the final product but doesn't click. Prototype: adds interaction and navigation — users can actually click through flows. Used for usability testing.",
      tips: ["The progression: wireframe (fast/cheap) → mockup (visual) → prototype (interactive)", "Prototypes catch usability issues, wireframes catch structural issues"],
      skills: ["wireframing", "prototyping"],
    },
    {
      id: "ux8", difficulty: "Hard", category: "System Design",
      question: "How would you redesign a complex form that has 60% drop-off?",
      answer: "First, diagnose before redesigning. Use session recordings (Hotjar) and funnel analytics to find where exactly users drop. Run user interviews to understand why. Common fixes: break into multi-step (one question per screen reduces cognitive load), progressive disclosure (only show relevant fields), inline validation (don't wait for submit to show errors), auto-fill where possible, show progress indicator. Test the redesign with 5 users before building.",
      tips: ["Diagnose first — never design a solution before understanding the problem", "Mention specific tools: Hotjar for heatmaps, analytics for funnels"],
      skills: ["usabilitytesting", "uxresearch"],
    },
  ],

  data_analyst: [
    {
      id: "da1", difficulty: "Easy", category: "Practical",
      question: "What is the difference between GROUP BY and HAVING in SQL?",
      answer: "`GROUP BY` groups rows by a column and applies aggregate functions (COUNT, SUM, AVG). `HAVING` filters AFTER grouping — like WHERE but for aggregated results. `WHERE` filters individual rows before grouping. Example: `SELECT department, AVG(salary) FROM employees GROUP BY department HAVING AVG(salary) > 60000` — this filters out departments where avg salary is below 60K.",
      tips: ["Simple rule: WHERE filters rows before grouping, HAVING filters groups after aggregation", "You cannot use aggregate functions in WHERE — that's what HAVING is for"],
      skills: ["sql"],
    },
    {
      id: "da2", difficulty: "Easy", category: "Concept",
      question: "What is the difference between mean, median, and mode?",
      answer: "Mean: average — sum divided by count. Sensitive to outliers (one billionaire in a room raises everyone's 'average' salary). Median: the middle value when sorted — robust to outliers. Mode: the most frequent value. Rule of thumb: if data is skewed or has outliers (income, house prices), use median. If data is normally distributed, mean works well. Report both when unsure.",
      tips: ["Always mention outliers when discussing mean vs median — that's the key insight", "Income is the classic example: median income is more meaningful than mean income"],
      skills: ["statistics"],
    },
    {
      id: "da3", difficulty: "Medium", category: "Practical",
      question: "How do you handle NULL values in SQL?",
      answer: "NULL means unknown or missing — not zero, not empty string. Key behaviors: `NULL = NULL` is false, use `IS NULL` / `IS NOT NULL`. Aggregate functions (SUM, COUNT, AVG) ignore NULLs — be aware this can skew results. Use `COALESCE(column, default_value)` to replace NULLs with a fallback. Use `NULLIF(a, b)` to return NULL when two values are equal (prevents division by zero).",
      tips: ["'NULL ≠ NULL' — this surprises many", "COALESCE is the most useful NULL-handling function to know"],
      skills: ["sql"],
    },
    {
      id: "da4", difficulty: "Medium", category: "Practical",
      question: "Explain the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN.",
      answer: "INNER JOIN: returns only rows where there's a match in BOTH tables. LEFT JOIN: returns ALL rows from the left table, with NULLs for unmatched right-table columns. RIGHT JOIN: opposite. FULL OUTER JOIN: all rows from both tables, NULLs where no match. Use LEFT JOIN most often — it keeps all your primary data and flags what's missing. INNER JOIN loses rows without a match.",
      tips: ["Venn diagram analogy: INNER = intersection, LEFT = left circle complete, FULL OUTER = both circles", "LEFT JOIN is the most commonly used JOIN in real analysis"],
      skills: ["sql"],
    },
    {
      id: "da5", difficulty: "Medium", category: "Concept",
      question: "What is A/B testing and how do you determine if a result is statistically significant?",
      answer: "A/B testing shows two versions of something to different user groups and measures which performs better. Statistical significance (usually p < 0.05) means there's less than 5% chance the result is due to random variation. Use a t-test for continuous metrics (revenue), chi-squared for conversion rates. You also need sufficient sample size — calculate this upfront with a power analysis. Always pre-define your success metric before running the test.",
      tips: ["p-value < 0.05 is the standard threshold — know what it actually means", "Sample size is often underestimated — mention it shows maturity"],
      skills: ["abtesting", "statistics"],
    },
    {
      id: "da6", difficulty: "Hard", category: "Practical",
      question: "How would you investigate a sudden 30% drop in daily active users?",
      answer: "Structured approach: 1. Confirm it's real (check data pipeline for ingestion issues first). 2. Segment the drop — which platform? Country? User cohort? New vs returning? 3. Check for external events — deployment that day? Marketing campaign ended? 4. Funnel analysis — where in the user flow did they drop off? 5. Compare to prior periods — same day last week, seasonality. Present findings as hypothesis-driven, not definitive.",
      tips: ["Always check the data pipeline first — 30% drops are often data issues, not product issues", "Segmenting the drop is the most important analytical skill to demonstrate"],
      skills: ["dashboarddesign", "sql"],
    },
    {
      id: "da7", difficulty: "Easy", category: "Practical",
      question: "What is the difference between a bar chart and a histogram?",
      answer: "Bar charts compare discrete categories — revenue by product, users by country. Bars don't touch because categories are separate. Histograms show the distribution of a continuous variable — how many users have session lengths in 0-1 min, 1-2 min, etc. Bars touch because the variable is continuous. Use bar charts for comparison, histograms for understanding distribution and shape of data.",
      tips: ["The 'bars touching' rule is how to visually distinguish them", "Histograms reveal skewness, outliers, and bimodal distributions"],
      skills: ["datavisualization", "tableau"],
    },
    {
      id: "da8", difficulty: "Hard", category: "Concept",
      question: "What is the difference between correlation and causation? Give an example.",
      answer: "Correlation means two variables move together — as X increases, Y increases (or decreases). Causation means X directly causes Y. The classic mistake: ice cream sales and drowning rates are correlated — both rise in summer. But ice cream doesn't cause drowning. The confounding variable is summer heat. In data analysis, never say 'X causes Y' from observational data alone. Randomized controlled experiments (A/B tests) are needed to establish causation.",
      tips: ["Ice cream and drowning is the classic example — memorable and well-known", "The word 'confounding variable' signals analytical maturity"],
      skills: ["statistics"],
    },
  ],

  ml_engineer: [
    {
      id: "ml1", difficulty: "Easy", category: "Concept",
      question: "What is the difference between supervised, unsupervised, and reinforcement learning?",
      answer: "Supervised: model learns from labeled data — input-output pairs. Classification and regression. Examples: spam detection, house price prediction. Unsupervised: no labels — model finds patterns itself. Clustering (K-means), dimensionality reduction (PCA). Examples: customer segmentation. Reinforcement: agent learns by taking actions in an environment and receiving rewards/penalties. Examples: game-playing AI, robotics.",
      tips: ["Give one concrete example per category", "Supervised is most common in industry — know it deepest"],
      skills: ["machinelearning"],
    },
    {
      id: "ml2", difficulty: "Medium", category: "Concept",
      question: "What is overfitting and how do you prevent it?",
      answer: "Overfitting: model learns the training data too well — memorizes noise instead of patterns — and fails on new data. Signs: high training accuracy, low test accuracy. Prevention: more training data (best solution), regularization (L1/L2 penalizes large weights), dropout (randomly deactivates neurons during training), early stopping (stop when validation loss starts rising), cross-validation, and reducing model complexity.",
      tips: ["'High train accuracy, low test accuracy' is the definition signature", "More data is the best cure — mention it first"],
      skills: ["machinelearning", "deeplearning"],
    },
    {
      id: "ml3", difficulty: "Medium", category: "Practical",
      question: "What is the difference between precision and recall? When would you prioritize each?",
      answer: "Precision: of all positive predictions, what fraction were actually positive? (TP / TP+FP). Recall: of all actual positives, what fraction did we predict correctly? (TP / TP+FN). Prioritize precision when false positives are costly — spam filter (you don't want real emails in spam). Prioritize recall when false negatives are costly — cancer detection (you don't want to miss any cancer). F1 score balances both.",
      tips: ["Precision = 'were our positive predictions right?', Recall = 'did we catch all the positives?'", "Use medical examples for recall, spam for precision — interviewers love these"],
      skills: ["machinelearning", "scikitlearn"],
    },
    {
      id: "ml4", difficulty: "Medium", category: "Concept",
      question: "What is gradient descent and how does it work?",
      answer: "Gradient descent is the optimization algorithm that trains neural networks. It minimizes the loss function by iteratively adjusting weights. Calculate the gradient (partial derivative) of the loss with respect to each weight — this tells you which direction increases the loss. Move in the opposite direction (steepest descent) by a step size called the learning rate. Repeat until the loss converges. Stochastic GD (SGD) uses mini-batches instead of the full dataset for efficiency.",
      tips: ["Analogy: rolling a ball downhill to find the lowest point (minimum loss)", "Explain why the learning rate matters — too high: overshoots, too low: too slow"],
      skills: ["deeplearning", "tensorflow", "pytorch"],
    },
    {
      id: "ml5", difficulty: "Hard", category: "Concept",
      question: "Explain how the attention mechanism in Transformers works.",
      answer: "Attention allows each token in a sequence to 'attend to' (weight) every other token. For each token, compute Query, Key, and Value vectors. Attention score = softmax(Q × K^T / √d_k) × V. High scores mean 'this token is relevant to me.' Self-attention captures relationships within a sequence; cross-attention links encoder to decoder. Transformers run all attention in parallel (unlike RNNs which are sequential), enabling massive parallelization on GPUs.",
      tips: ["Q, K, V is the key formula — know what each represents conceptually", "'Parallelizable unlike RNNs' is the architectural advantage that enabled scale"],
      skills: ["nlp", "huggingface", "pytorch"],
    },
    {
      id: "ml6", difficulty: "Medium", category: "Practical",
      question: "What is cross-validation and why is it used?",
      answer: "Cross-validation is a technique to reliably estimate model performance on unseen data. K-fold: split data into K folds, train on K-1 folds, test on the remaining fold, rotate K times. Average the K scores. This uses all data for both training and testing, avoiding the randomness of a single train-test split. Particularly valuable when data is limited. The result is a more reliable estimate of generalization performance.",
      tips: ["5-fold and 10-fold are the most common choices", "Explain WHY it's better than a single split — uses all data and reduces variance"],
      skills: ["machinelearning", "scikitlearn"],
    },
    {
      id: "ml7", difficulty: "Hard", category: "System Design",
      question: "How would you deploy a machine learning model to production?",
      answer: "Key steps: 1. Serialize the model (pickle, ONNX, TorchScript). 2. Build a REST API around it (FastAPI + uvicorn). 3. Containerize with Docker. 4. Deploy to cloud (AWS SageMaker, GCP Vertex AI, or custom EC2/GKE). 5. Set up monitoring — data drift detection, prediction distribution, latency. 6. A/B test the new model against the current one before full rollout. 7. Create a rollback plan. MLflow tracks experiments; BentoML or Seldon handles serving.",
      tips: ["Mention monitoring for data drift — models degrade when input distribution changes", "MLOps shows senior-level thinking beyond just 'run the model'"],
      skills: ["mlops", "docker", "fastapi", "awssagemaker"],
    },
    {
      id: "ml8", difficulty: "Easy", category: "Concept",
      question: "What is the bias-variance tradeoff?",
      answer: "Bias: error from wrong assumptions — a too-simple model (linear regression on non-linear data) has high bias. Underfitting. Variance: error from sensitivity to training data — a too-complex model memorizes noise. Overfitting. The tradeoff: reducing bias (more complexity) tends to increase variance, and vice versa. Ideal: find the sweet spot where both are acceptable. Ensemble methods (random forests, boosting) are specifically designed to reduce this tradeoff.",
      tips: ["'Simple model = high bias, complex model = high variance'", "Ensemble methods reduce variance without increasing bias much — this is their superpower"],
      skills: ["machinelearning", "statistics"],
    },
  ],

  product_manager: [
    {
      id: "pm1", difficulty: "Easy", category: "Concept",
      question: "How do you prioritize features on a product roadmap?",
      answer: "Several frameworks exist. RICE: (Reach × Impact × Confidence) / Effort — gives a numeric score. MoSCoW: Must have, Should have, Could have, Won't have. ICE: Impact, Confidence, Ease. In practice, mix frameworks with context: company strategy, user pain level, business ROI, engineering cost. The real skill is holding a room where engineering says everything is hard and sales says everything is urgent — and making a defensible call.",
      tips: ["Know RICE and MoSCoW by name", "Show you understand that frameworks are tools, not answers — judgment is what matters"],
      skills: ["roadmapping", "prioritizationframeworks"],
    },
    {
      id: "pm2", difficulty: "Medium", category: "Behavioural",
      question: "Tell me about a time you had to say no to a stakeholder request.",
      answer: "Structure: Situation → the request and why it felt important to them. Action → how you evaluated it (user data, strategic alignment, opportunity cost). How you communicated the 'no' — with data, empathy, and an alternative. Result → outcome. The key: you didn't just say no, you said 'not now, and here's what we're doing instead and why.' Stakeholders can handle 'no' if they understand the reasoning.",
      tips: ["Never say you just 'overruled' someone — show collaboration", "Always offer an alternative or a future path even when saying no"],
      skills: ["stakeholdermgmt"],
    },
    {
      id: "pm3", difficulty: "Medium", category: "Practical",
      question: "What is a PRD and what should it contain?",
      answer: "PRD (Product Requirements Document) is the single source of truth for a feature. It should contain: problem statement (what user pain does this solve), success metrics (how will we know it worked), user stories (as a [user], I want [action] so that [benefit]), functional requirements, non-functional requirements (performance, security), out-of-scope items (explicitly list what you're NOT building), edge cases, and open questions. It's a living document — update it as you learn.",
      tips: ["'Out of scope' section is often forgotten but prevents scope creep", "Success metrics BEFORE building — forces clarity on what winning looks like"],
      skills: ["prdwriting"],
    },
    {
      id: "pm4", difficulty: "Hard", category: "System Design",
      question: "How would you define the north star metric for a food delivery app?",
      answer: "North star: one metric that best captures product value for users AND correlates with business health. For food delivery: 'Orders delivered on time per week' captures frequency of use (business), delivery quality (user value), and scales with growth. Bad choices: revenue (lagging, internal), DAUs (engagement without delivery = failure). The north star focuses the entire team. Supporting metrics break it down: items ordered, delivery time, repeat rate.",
      tips: ["North star must represent VALUE delivered, not just activity", "Show you understand it must align user value with business value"],
      skills: ["productmetrics", "analyticstools"],
    },
    {
      id: "pm5", difficulty: "Medium", category: "Concept",
      question: "What is the difference between output metrics and outcome metrics?",
      answer: "Output metrics measure what you shipped — features released, sprint velocity, lines of code. Outcome metrics measure the impact those outputs had — user retention, activation rate, revenue. Great PMs focus on outcomes, not outputs. 'We shipped 12 features this quarter' is an output. 'Activation rate improved 15%' is an outcome. Stakeholders want outcomes; output metrics can be gamed without delivering real value.",
      tips: ["'Ship features' vs 'improve user behavior' — that's the difference", "Tie every feature you discuss back to an outcome metric"],
      skills: ["productmetrics", "datadrivendecisions"],
    },
    {
      id: "pm6", difficulty: "Hard", category: "Practical",
      question: "How would you improve user retention for an app that loses 60% of users after day 1?",
      answer: "Diagnose first: segment the 60% — who are they? Where did they drop off? Look at the first session: did they reach the 'aha moment'? (the moment they got value). If they never got to the core feature, fix onboarding. If they reached it but didn't return, fix habit formation (notifications, email sequences, social hooks). Run experiments: shorten time-to-value, improve empty states, add progress indicators. Measure day-7 and day-30 retention, not just day-1.",
      tips: ["'Aha moment' is a key PM term — the first time a user experiences core value", "Segment before solving — the 60% who churn may have very different reasons"],
      skills: ["productmetrics", "userinterviews"],
    },
    {
      id: "pm7", difficulty: "Easy", category: "Concept",
      question: "What is a user persona and why is it useful?",
      answer: "A user persona is a semi-fictional representation of a target user segment based on real research — not a made-up character. It includes demographics, goals, frustrations, tech comfort level, and job-to-be-done. Value: aligns the team on WHO they're building for. Prevents designing for 'everyone' (which means no one). Keeps discussions grounded: 'Would Priya, the busy working mom, actually use this feature?' Bad personas are made up; good ones come from actual user interviews.",
      tips: ["Emphasize they must be research-based, not imagined", "'Jobs to be done' is a more modern and rigorous alternative to personas — mention it if you know it"],
      skills: ["userinterviews", "surveydesign"],
    },
  ],

  devops_cloud: [
    {
      id: "do1", difficulty: "Easy", category: "Concept",
      question: "What is the difference between a Docker container and a virtual machine (VM)?",
      answer: "A VM virtualizes hardware — each VM has its own full OS kernel, hundreds of MBs to GBs in size, takes minutes to start. A Docker container virtualizes at the OS level — containers share the host kernel, are MBs in size, start in seconds. Containers are lighter, faster, and more portable. VMs provide stronger isolation (different OS, better security boundary). In practice: containers for application deployment, VMs for multi-tenant isolation.",
      tips: ["'Containers share the kernel, VMs don't' is the core technical difference", "Container cold-start: seconds. VM cold-start: minutes. This matters for scaling."],
      skills: ["docker"],
    },
    {
      id: "do2", difficulty: "Medium", category: "Practical",
      question: "What is a Dockerfile and how does image layering work?",
      answer: "A Dockerfile is a recipe to build a Docker image — each instruction (FROM, RUN, COPY) creates a new layer. Layers are cached: if you change a line, only that line and everything after is rebuilt. Optimization: put rarely-changing instructions early (installing OS packages), frequently-changing ones late (COPY source code). Use multi-stage builds to separate build environment from runtime image, keeping final images small.",
      tips: ["Layer caching is the key optimization concept — mention COPY source code last", "Multi-stage builds for smaller final images shows senior thinking"],
      skills: ["docker"],
    },
    {
      id: "do3", difficulty: "Medium", category: "Concept",
      question: "Explain CI/CD. What happens in each stage?",
      answer: "CI (Continuous Integration): every code push triggers automated tests, linting, and build — catches bugs before merge. CD (Continuous Delivery): automatically deploys to staging after CI passes. Continuous Deployment goes further: auto-deploys to production too. Typical pipeline: push code → lint → unit tests → build → integration tests → deploy to staging → smoke tests → deploy to production. Tools: GitHub Actions, Jenkins, GitLab CI, CircleCI.",
      tips: ["Continuous Delivery = auto-deploy to staging, Continuous Deployment = auto-deploy to prod too", "Mention GitHub Actions specifically — it's the most common tool now"],
      skills: ["cicd", "githubactions"],
    },
    {
      id: "do4", difficulty: "Hard", category: "System Design",
      question: "What is Kubernetes and when do you actually need it?",
      answer: "Kubernetes (K8s) is a container orchestration system — it automates deploying, scaling, and managing containers across a cluster of machines. Key concepts: Pod (one or more containers), Deployment (desired state), Service (stable network endpoint), Ingress (HTTP routing). You need it when: running many microservices, need auto-scaling based on traffic, need self-healing (auto-restart failed pods), or doing zero-downtime deployments. Overkill for a single-service app — use Docker Compose + a single cloud server instead.",
      tips: ["'Overkill for small apps' shows maturity — knowing when NOT to use a tool is as important", "Mention auto-scaling and self-healing as the key benefits that justify the complexity"],
      skills: ["kubernetes", "docker"],
    },
    {
      id: "do5", difficulty: "Medium", category: "Concept",
      question: "What is Infrastructure as Code (IaC) and why use it?",
      answer: "IaC means managing infrastructure (servers, databases, networking) through code files instead of manual clicks in a cloud console. Tools: Terraform (cloud-agnostic), AWS CloudFormation (AWS-specific), Pulumi (code-first). Benefits: reproducible environments (dev matches prod), version-controlled infrastructure, peer review for infra changes, disaster recovery (rebuild from code). The alternative — manual console clicks — is slow, error-prone, and undocumented.",
      tips: ["Terraform is the most important tool to know by name", "Key benefit: 'reproducible' — infrastructure is no longer a snowflake"],
      skills: ["terraform", "aws"],
    },
    {
      id: "do6", difficulty: "Easy", category: "Practical",
      question: "What is the difference between horizontal and vertical scaling?",
      answer: "Vertical scaling (scale up): make the existing server bigger — more CPU, more RAM. Simple but has a ceiling (biggest machine available) and creates a single point of failure. Horizontal scaling (scale out): add more servers and distribute load. More complex (needs load balancer, stateless app design), but theoretically unlimited and more resilient. Cloud-native apps are designed to scale horizontally.",
      tips: ["'More RAM vs more servers' is the one-liner", "Horizontal scaling requires stateless apps — session data must be in shared storage (Redis, DB), not local memory"],
      skills: ["aws", "systemdesign"],
    },
    {
      id: "do7", difficulty: "Hard", category: "Practical",
      question: "How would you implement a zero-downtime deployment?",
      answer: "Blue-green deployment: maintain two identical production environments (blue = current, green = new). Deploy to green, run tests. Switch load balancer from blue to green. Blue stays up as instant rollback. Rolling deployment: gradually replace old instances with new ones — 10% at a time, monitoring for errors. Canary release: send 1-5% of real traffic to the new version first. Kubernetes handles rolling and canary natively. Key: your DB migrations must be backward-compatible during the transition.",
      tips: ["Blue-green is the simplest to explain and most common interview answer", "DB migration compatibility during zero-downtime deploys is the hard part most people forget"],
      skills: ["kubernetes", "deploymentstrategies"],
    },
  ],

  cybersecurity: [
    {
      id: "cs1", difficulty: "Easy", category: "Concept",
      question: "What is the CIA Triad in cybersecurity?",
      answer: "The CIA Triad is the foundational model of information security: Confidentiality (only authorized users can access data — encryption, access controls), Integrity (data hasn't been altered without authorization — hashing, digital signatures), Availability (systems are accessible when needed — redundancy, DDoS protection). Every security decision maps to one or more of these three principles. When they conflict (e.g., encryption vs availability), trade-offs must be explicitly decided.",
      tips: ["Know examples for each: C = encryption, I = hashing/checksums, A = load balancers/backups", "It's the most foundational security concept — must know this cold"],
      skills: ["ciatriad", "cryptography"],
    },
    {
      id: "cs2", difficulty: "Easy", category: "Concept",
      question: "What is SQL injection and how do you prevent it?",
      answer: "SQL injection: attacker inserts malicious SQL into an input field. Example: username input `' OR 1=1 --` changes the query logic to bypass authentication. Prevention: parameterized queries / prepared statements — never concatenate user input into SQL strings. Example in Python: `cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))`. ORMs (Prisma, SQLAlchemy) use parameterized queries by default. Input validation is secondary defense — parameterization is primary.",
      tips: ["Parameterized queries is THE answer — mention it immediately", "ORMs don't make you immune — raw queries or string formatting in ORMs still create injection risk"],
      skills: ["owasp", "sql"],
    },
    {
      id: "cs3", difficulty: "Medium", category: "Concept",
      question: "What is the difference between symmetric and asymmetric encryption?",
      answer: "Symmetric: same key to encrypt and decrypt (AES). Fast, efficient. Problem: how do you securely share the key? Asymmetric: public key encrypts, private key decrypts (RSA, ECC). The public key can be shared openly — only the private key holder can decrypt. Slower but solves the key exchange problem. In practice: use asymmetric to securely exchange a symmetric key (TLS handshake), then use symmetric for the rest of the session. This is exactly what HTTPS does.",
      tips: ["'Symmetric = same key, Asymmetric = key pair'", "HTTPS uses both — asymmetric for handshake, symmetric for data — this shows deep understanding"],
      skills: ["cryptography", "ssl"],
    },
    {
      id: "cs4", difficulty: "Medium", category: "Practical",
      question: "What is the OWASP Top 10 and why is it important?",
      answer: "OWASP Top 10 is the industry-standard list of the most critical web application security risks, updated every few years. Top items: Injection (SQL, NoSQL, command), Broken Authentication, Sensitive Data Exposure, XXE (XML External Entities), Broken Access Control, Security Misconfiguration, XSS (Cross-Site Scripting), Insecure Deserialization, Using Components with Known Vulnerabilities, Insufficient Logging. It's the baseline for any web security audit and penetration test scope.",
      tips: ["Injection and Broken Access Control are consistently #1 concerns", "Saying 'I use OWASP Top 10 as a checklist during code review' shows practical application"],
      skills: ["owasp", "penetrationtesting"],
    },
    {
      id: "cs5", difficulty: "Medium", category: "Concept",
      question: "What is the difference between a vulnerability, an exploit, and a threat?",
      answer: "Vulnerability: a weakness in a system (unpatched software, misconfiguration, weak password). Threat: any potential danger that might exploit a vulnerability (hacker, ransomware, insider). Exploit: the actual mechanism used to take advantage of a vulnerability — code or technique. Risk = Threat × Vulnerability × Impact. Example: an unpatched Apache server (vulnerability) + a known CVE exploit tool (exploit) + ransomware group (threat) = high risk.",
      tips: ["The risk equation: Threat × Vulnerability × Impact", "CVE (Common Vulnerabilities and Exposures) is the database of known vulnerabilities — mention it"],
      skills: ["vulnerabilityscanning", "riskassessment"],
    },
    {
      id: "cs6", difficulty: "Hard", category: "Practical",
      question: "How would you approach a penetration test of a web application?",
      answer: "Follow a structured methodology — PTES or OWASP Testing Guide: 1. Reconnaissance (passive: OSINT, DNS, whois / active: port scanning with Nmap). 2. Enumeration (identify tech stack, discover endpoints). 3. Vulnerability scanning (Nikto, Burp Suite scanner). 4. Exploitation (manually test OWASP Top 10, use Metasploit for known CVEs). 5. Post-exploitation (check what data is accessible). 6. Report (severity by CVSS score, remediation steps). Always stay within the defined scope and never test without written authorization.",
      tips: ["'Written authorization' is critical to mention first — ethical hackers always have permission", "Burp Suite is the primary tool — know it deeply"],
      skills: ["penetrationtesting", "burpsuite", "nmap"],
    },
    {
      id: "cs7", difficulty: "Hard", category: "Concept",
      question: "What is a man-in-the-middle (MITM) attack and how does HTTPS prevent it?",
      answer: "MITM: attacker positions themselves between client and server, intercepting and potentially modifying traffic. On an unencrypted HTTP connection, everything is readable. HTTPS prevents it through: TLS encryption (data is encrypted with a session key), certificate verification (browser checks the server's certificate is signed by a trusted CA — prevents an attacker from impersonating the server), and HSTS (HTTP Strict Transport Security prevents downgrade to HTTP). Certificate pinning adds an extra layer for mobile apps.",
      tips: ["The certificate verification step is what prevents impersonation — most answers forget this", "Mention HSTS — it's a small detail that shows depth"],
      skills: ["ssl", "networking"],
    },
  ],

  mobile_dev: [
    {
      id: "mo1", difficulty: "Easy", category: "Concept",
      question: "What is the difference between React Native and Flutter?",
      answer: "React Native: uses JavaScript/TypeScript, renders to native iOS/Android components via a JavaScript bridge (or JSI in newer versions). Has access to the largest JS ecosystem. Made by Meta. Flutter: uses Dart, renders everything using its own graphics engine (Skia/Impeller) — not native components. Pixel-perfect consistent UI across platforms. Faster rendering because no bridge. React Native has a larger ecosystem and easier JS hire; Flutter has better performance and more consistent UI.",
      tips: ["'Bridge vs own rendering engine' is the core technical difference", "Flutter's own rendering is why it looks identical on iOS and Android — native components look slightly different per platform"],
      skills: ["reactnative", "flutter"],
    },
    {
      id: "mo2", difficulty: "Medium", category: "Concept",
      question: "How does state management work in React Native and what are the options?",
      answer: "React Native uses React's built-in state (useState, useReducer, Context API) for local and global state. For complex apps, external libraries: Redux Toolkit (predictable, verbose, battle-tested), Zustand (minimal boilerplate, great DX), Jotai (atomic state, React-centric), React Query / TanStack Query (server state — caching, sync with API). Rule of thumb: local UI state = useState. Shared UI state = Context or Zustand. Server data = React Query.",
      tips: ["Distinguish 'UI state' from 'server state' — React Query handles server state specifically", "Context API is fine for small apps but causes re-render performance issues at scale"],
      skills: ["reactnative", "crossplatformstate"],
    },
    {
      id: "mo3", difficulty: "Medium", category: "Practical",
      question: "How do you optimize performance in a React Native app?",
      answer: "Key optimizations: Use `FlatList` instead of `ScrollView` for long lists (virtualization). Memoize components with `React.memo` and callbacks with `useCallback`. Avoid anonymous functions in render. Use `InteractionManager` to defer heavy work until animations complete. Enable Hermes JS engine (faster startup). Use `useNativeDriver: true` on animations (runs on native thread). Profile with Flipper. Avoid bridge calls in tight loops.",
      tips: ["FlatList over ScrollView is the single most impactful optimization for lists", "useNativeDriver: true is a common interview answer — know WHY it's faster (native thread vs JS thread)"],
      skills: ["reactnative", "performanceprofiling"],
    },
    {
      id: "mo4", difficulty: "Easy", category: "Practical",
      question: "What is AsyncStorage and when should you NOT use it?",
      answer: "AsyncStorage is React Native's simple key-value store for persisting data across app sessions — like localStorage for browsers. Good for: user preferences, auth tokens, simple app settings. Don't use it for: large amounts of data (it's unencrypted and slow), sensitive data (use Keychain/Keystore instead for credentials), relational data (use SQLite or WatermelonDB). AsyncStorage is not encrypted — never store passwords or tokens in plain text.",
      tips: ["'Not encrypted' is the critical limitation — always mention it", "Recommend Keychain (iOS) or Keystore (Android) for sensitive data"],
      skills: ["reactnative", "offlinestorage"],
    },
    {
      id: "mo5", difficulty: "Hard", category: "System Design",
      question: "How would you implement offline support in a mobile app?",
      answer: "Strategy: cache API responses locally (SQLite, WatermelonDB, or MMKV), queue mutations (user actions) when offline, sync when connectivity returns. Use `NetInfo` to detect connection state. Conflict resolution strategy for syncing: last-write-wins, timestamp-based, or user-prompted. React Query and SWR have built-in cache strategies. WatermelonDB is specifically designed for offline-first React Native apps with lazy loading of large datasets.",
      tips: ["Mention conflict resolution — most answers forget this is the hard part", "WatermelonDB name signals you've worked with real offline scenarios"],
      skills: ["offlinestorage", "reactnative"],
    },
    {
      id: "mo6", difficulty: "Medium", category: "Practical",
      question: "How do you handle push notifications in React Native?",
      answer: "Use Firebase Cloud Messaging (FCM) for Android and APNs for iOS — React Native Firebase or Expo Notifications abstracts both. Flow: register device → get FCM token → send token to your backend → backend sends notification via FCM API → FCM delivers to device. Handle foreground notifications with a listener, background with a headless task. For local notifications (scheduled, no server), use `react-native-push-notification`.",
      tips: ["FCM handles both Android and iOS (via APNs) — one SDK for both platforms", "Always handle both foreground and background states — interviewers often ask about background handling"],
      skills: ["pushnotifications", "firebase"],
    },
    {
      id: "mo7", difficulty: "Hard", category: "Practical",
      question: "How do you submit an app to the Google Play Store?",
      answer: "Steps: 1. Create a keystore file (`keytool -genkey`) — this signs your app and must be kept safe forever (losing it means you can't update the app). 2. Configure `android/app/build.gradle` with signing config. 3. Build release APK or AAB: `npx react-native build-android --mode=release`. 4. Create Play Console account, create app listing. 5. Upload AAB (preferred over APK — Play Store optimizes delivery). 6. Fill content rating, privacy policy. 7. Submit for review — takes 1-3 days.",
      tips: ["The keystore is irreplaceable — 'keep it safe forever' is the most important point", "AAB is preferred over APK — Google Play dynamically serves the right assets per device"],
      skills: ["playstoredeploy", "appsigning"],
    },
  ],
};
