// Shweta's portfolio agent — chat client.
// Stateless server: we send the visible history with every turn.

const thread = document.getElementById("thread");
const hello = document.getElementById("hello");
const composer = document.getElementById("composer");
const input = document.getElementById("input");
const send = document.getElementById("send");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const drawer = document.getElementById("drawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerClose = document.getElementById("drawerClose");

const history = []; // {role, content}
let busy = false;
let lastStatus = "unknown"; // warm | idle | offline | unknown

/* ---------- inline icons (currentColor, used in nav + answer rows) ---------- */
const ICONS = {
  github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-1.97c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.66.41.35.78 1.05.78 2.12v3.14c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.58A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.58 9.38.58 9.38.58s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8Z"/><path fill="var(--paper)" d="M9.6 15.4 15.8 12 9.6 8.6v6.8Z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S.02 4.88.02 3.5 1.13 1 2.5 1s2.48 1.12 2.48 2.5ZM.5 8h4v15h-4V8Zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-7.9c0-1.88-.03-4.3-2.62-4.3-2.62 0-3.02 2.05-3.02 4.16V23h-4V8Z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>`,
};

/* ---------- curated case-file notes ----------
   Known questions answer INSTANTLY from these notes (honestly labeled),
   with a handoff button that sends a deeper question to the live model.
   Anything typed freely still goes straight to the LLM. */
const CANNED_TOPICS = {
  dietdoctor: {
    text: `I built **DietDoctor AI** because diet advice fails at the follow-through — so I put the dietician where the conversation already happens: WhatsApp. No app, no login; you just text it.
The part I'm proudest of: the LLM never does arithmetic. BMI, BMR and macro math run as deterministic Python function-calls, so the coaching is conversational but the numbers are exact. Gemini 2.5 Flash + Google ADK behind FastAPI, containerized on my Kubernetes cluster with GitOps deploys.
Watch it work: https://www.youtube.com/watch?v=LNHT23NMFGU · code: https://github.com/rani700/DietDoctorAI`,
    schem: `<div class="schematic"><span class="n">WHATSAPP</span><i class="arr"></i><span class="n">N8N</span><i class="arr"></i><span class="n hotn">ADK · GEMINI 2.5</span><i class="arr two"></i><span class="n">PY TOOLS</span><i class="arr"></i><span class="n">K8S</span></div>`,
    follow: "What were the hardest engineering problems in DietDoctor AI?",
  },
  healthcompanion: {
    text: `**HealthCompanion** answers medical questions from one source only: that patient's own records. Every patient gets an isolated ChromaDB collection, so cross-patient leakage is structurally impossible — not just discouraged by a prompt.
Gemini vision OCR reads scanned and handwritten documents; retrieval is hybrid — semantic + keyword fused with RRF, then MMR for diversity — and every answer carries citations back to the source document. JWT auth and role-based access wrap the whole thing.
Try it live: https://healthcompanion.codeshare.co.in · code: https://github.com/rani700/healthcompanion`,
    schem: `<div class="schematic"><span class="n">SCANS</span><i class="arr"></i><span class="n">GEMINI OCR</span><i class="arr"></i><span class="n">CHROMADB</span><i class="arr"></i><span class="n hotn">RRF + MMR</span><i class="arr"></i><span class="n">CITED ANSWER</span></div>`,
    follow: "How does HealthCompanion's hybrid retrieval actually work, step by step?",
  },
  experience: {
    text: `Right now I'm a Data Engineer at **WNS** in Gurugram — end-to-end ETL/ELT on Azure, Python and SQL at serious scale, real-time NiFi → Snowflake streaming, automated data-quality frameworks, and I drive GenAI adoption in my role by prototyping LLM agents that automate data workflows.
Earlier, at **Astrea IT Services**, I built Salesforce solutions — Apex, triggers, Visualforce — and shipped production process automations.
The case files are where those two crafts meet: pipelines by day, agents on my own cluster.`,
    html: `<div class="duo">
<div class="card"><span class="badge">NOW</span><h4>WNS — Data Engineer</h4><ul>
<li>End-to-end ETL/ELT on Azure, Python, SQL — at serious scale</li>
<li>Real-time NiFi → Snowflake streaming architectures</li>
<li>Automated data-quality frameworks across pipelines</li>
<li>Drives GenAI adoption — LLM agents automating data workflows</li></ul></div>
<div class="card"><span class="badge alt">EARLIER</span><h4>Astrea IT — Software Dev</h4><ul>
<li>Salesforce solutions: Apex, triggers, Visualforce, SOQL</li>
<li>Production workflow &amp; process automations</li>
<li>Code reviews and requirements gathering</li></ul></div>
</div>
<p>The case files are where the two crafts meet — <strong>pipelines by day, agents on my own cluster.</strong></p>`,
    follow: "What does Shweta work on day-to-day at WNS?",
  },
  site: {
    text: `You're inside one of my systems right now. This chat streams from **Llama 3.1** on Ollama — running on my own hardware, no cloud APIs — through a FastAPI backend I wrote, grounded in a markdown knowledge base so it answers from my real work instead of imagining it.
Every git push cuts a release: GitHub Actions builds the container, publishes to GHCR, and ArgoCD rolls it onto my Kubernetes cluster. The page you're reading is the demo.
Source: https://github.com/rani700/shweta-agent`,
    schem: `<div class="schematic"><span class="n">YOU</span><i class="arr two"></i><span class="n">FASTAPI · SSE</span><i class="arr two"></i><span class="n hotn">LLAMA 3.1 · OLLAMA</span><i class="arr"></i><span class="n">MY HARDWARE</span></div>
<div class="schematic"><span class="n">GIT PUSH</span><i class="arr"></i><span class="n">ACTIONS CI</span><i class="arr"></i><span class="n">GHCR</span><i class="arr"></i><span class="n hotn">ARGOCD</span><i class="arr"></i><span class="n">K8S</span></div>`,
    follow: "What's the full deployment pipeline behind this site?",
  },
  easyform: {
    text: `**EasyForm** fills government exam forms from a pile of documents — marksheets, ID cards — using GPT-4o vision inside a LangGraph state machine: classify → extract → validate → merge.
The clever part is trust: extracted fields are cross-checked with fuzzy identity matching across documents, and when something's missing the agent emails the applicant itself (IMAP/SMTP), parses the reply in natural language, and continues where it left off.
Code: https://github.com/rani700/easyform`,
    schem: `<div class="schematic"><span class="n">DOCS · EMAIL</span><i class="arr"></i><span class="n">CLASSIFY</span><i class="arr"></i><span class="n hotn">GPT-4O VISION</span><i class="arr"></i><span class="n">VALIDATE</span><i class="arr"></i><span class="n">FORM</span></div>`,
    follow: "What breaks first in document-extraction pipelines, and how does EasyForm handle it?",
  },
  databricks: {
    text: `The **Agentic Data Platform** lets you question a Databricks lakehouse in plain English. A Llama 3.3 agent runs the ReAct loop — reason, write Spark SQL, execute, read the result, refine — over a Medallion (bronze/silver/gold) architecture, autonomously.
Build walkthrough: https://www.youtube.com/watch?v=as7wht24yj4 · code: https://github.com/rani700/Databricks_Ecomm_Data_Platform`,
    schem: `<div class="schematic"><span class="n">NL QUERY</span><i class="arr"></i><span class="n hotn">LLAMA 3.3 · REACT</span><i class="arr"></i><span class="n">SPARK SQL</span><i class="arr"></i><span class="n">MEDALLION Δ</span></div>`,
    follow: "How does the ReAct loop decide the Spark SQL it generates is safe and correct?",
  },
  streaming: {
    text: `My **real-time streaming pipeline** is the backbone pattern I run in production: EC2 → Apache NiFi → S3 → SnowPipe → Snowflake, with change-data-capture handled natively by Snowflake streams and tasks. The whole stack ships as Docker Compose, so it stands up identically anywhere.
Demo: https://www.youtube.com/watch?v=wH_MlgZoMhA · code: https://github.com/rani700/RealTime-Data-Streaming-using-Apache-Nifi-AWS-and-Snowflake`,
    schem: `<div class="schematic"><span class="n">EC2</span><i class="arr"></i><span class="n">NIFI</span><i class="arr"></i><span class="n">S3</span><i class="arr"></i><span class="n">SNOWPIPE</span><i class="arr"></i><span class="n hotn">SNOWFLAKE · CDC</span></div>`,
    follow: "Where does back-pressure show up in the NiFi to Snowflake pipeline, and how is it handled?",
  },
  about: {
    text: `I'm Shweta — a data engineer at **WNS** in Gurugram who builds the other half of the stack too: the intelligent systems the data feeds. By day I run production ETL and real-time streams; on my own Kubernetes cluster I ship LLM agents, RAG systems and document intelligence end-to-end.
My foundation is an integrated B.Tech + M.Tech in **AI & Robotics**, with peer-reviewed research published by **Springer** — I was training neural networks before LLMs made it fashionable.
I showcase everything I build on YouTube: https://youtube.com/@ShwetaNimesh · and it all lives at https://github.com/rani700`,
    html: `<p>I'm Shweta — a data engineer at <strong>WNS</strong> in Gurugram who builds the other half of the stack too: the intelligent systems the data feeds.</p>
<p>By day I run production ETL and real-time streams. On my own Kubernetes cluster, I ship LLM agents, RAG systems and document intelligence end-to-end — this site included.</p>
<div class="tags tags-lg"><span>M.TECH · AI &amp; ROBOTICS</span><span>SPRINGER-PUBLISHED</span><span>5 AGENT SYSTEMS SHIPPED</span><span>SELF-HOSTED HOMELAB</span></div>
<p>I was training neural networks before LLMs made it fashionable — and I showcase every build on YouTube. <em class="scribble">← proof, not promises</em></p>`,
    follow: "What kind of problems does Shweta most enjoy solving?",
  },
  stack: {
    text: `Tools I actually use, not collect:
- **GenAI** — LLM agents, RAG, function calling, ReAct; LangGraph, LangChain, Google ADK; GPT-4o, Gemini, Llama 3.3; ChromaDB for vectors
- **Data engineering** — Apache Spark, NiFi, Airflow; CDC and real-time streaming; Snowflake, Databricks, Delta Lake
- **Cloud & shipping** — Azure Data Factory & Functions, AWS S3/Lambda/EC2; FastAPI, Docker, Kubernetes, ArgoCD, GitHub Actions
- **Languages** — Python, SQL, PySpark
Proof beats lists — every case file on this site runs on a slice of this stack: https://github.com/rani700`,
    html: `<p>Tools I actually use, not collect:</p>
<div class="bom"><b>GENAI</b><div class="tags"><span>LLM Agents</span><span>RAG</span><span>Function Calling</span><span>ReAct</span><span>LangGraph</span><span>LangChain</span><span>Google ADK</span><span>GPT-4o</span><span>Gemini</span><span>Llama 3.3</span><span>ChromaDB</span></div></div>
<div class="bom"><b>DATA ENG</b><div class="tags"><span>Apache Spark</span><span>NiFi</span><span>Airflow</span><span>CDC</span><span>Real-time Streaming</span><span>Snowflake</span><span>Databricks</span><span>Delta Lake</span></div></div>
<div class="bom"><b>CLOUD &amp; SHIP</b><div class="tags"><span>Azure ADF · Functions</span><span>AWS S3 · Lambda · EC2</span><span>FastAPI</span><span>Docker</span><span>Kubernetes</span><span>ArgoCD</span><span>GitHub Actions</span></div></div>
<div class="bom"><b>LANGUAGES</b><div class="tags"><span>Python</span><span>SQL</span><span>PySpark</span></div></div>
<p>Proof beats lists — <strong>every case file on this site runs on a slice of this stack.</strong></p>`,
    follow: "Which parts of this stack has Shweta run in production?",
  },
  roots: {
    text: `Before the LLM era, there was the lab. My integrated **B.Tech (CS) + M.Tech (AI & Robotics)** from Gautam Buddha University — CGPA 8.22 / 8.36 — came with a research streak: a peer-reviewed **Springer** paper, *Data Imputation in WSN using Deep Learning* (ICDAM).
The applied side of that era is still on my GitHub: lung-field segmentation on chest X-rays (my most-starred repo), 102-class molecule classification with CNNs and transfer learning, time-series forecasting.
Paper: https://link.springer.com/book/10.1007/978-981-15-8335-3 · X-ray work: https://github.com/rani700/xray`,
    html: `<p>Before the LLM era, there was the lab. My integrated <strong>B.Tech (CS) + M.Tech (AI &amp; Robotics)</strong> from Gautam Buddha University — CGPA 8.22 / 8.36 — came with a research streak.</p>
<div class="duo">
<div class="card"><span class="badge">PUBLISHED RESEARCH</span><h4>Data Imputation in WSN using Deep Learning</h4><ul><li>Peer-reviewed, Springer Singapore · ICDAM</li><li>Deep learning over wireless sensor networks</li></ul></div>
<div class="card"><span class="badge alt">THE LAB YEARS</span><h4>Applied ML, pre-LLM</h4><ul><li>Lung-field segmentation on chest X-rays — her most-starred repo</li><li>102-class molecule classification: CNNs, transfer learning</li><li>Time-series forecasting</li></ul></div>
</div>
<p>That's the foundation the agents stand on. <em class="scribble">← depth, not vibes</em></p>`,
    follow: "How does her classical ML background show up in how she builds LLM systems?",
  },
  contact: {
    text: `The fastest channel is email: [shwetanimesh700@gmail.com](mailto:shwetanimesh700@gmail.com) — I genuinely reply fast.
Elsewhere: https://linkedin.com/in/shwetarani24 · https://github.com/rani700 · https://youtube.com/@ShwetaNimesh
If you're sitting on an interesting problem in data or GenAI, I'd love to hear about it.`,
    noSources: true,
    html: `<p>If you're sitting on an interesting problem in data or GenAI, I'd love to hear about it.</p>
<div class="rows">
<a class="row" href="mailto:shwetanimesh700@gmail.com">${ICONS.mail}<span class="row-meta"><b>EMAIL</b><i>shwetanimesh700@gmail.com</i></span><em class="scribble">← she actually replies</em></a>
<a class="row" href="https://linkedin.com/in/shwetarani24" target="_blank" rel="noopener">${ICONS.linkedin}<span class="row-meta"><b>LINKEDIN</b><i>linkedin.com/in/shwetarani24</i></span></a>
<a class="row" href="https://github.com/rani700" target="_blank" rel="noopener">${ICONS.github}<span class="row-meta"><b>GITHUB</b><i>github.com/rani700</i></span></a>
<a class="row" href="https://youtube.com/@ShwetaNimesh" target="_blank" rel="noopener">${ICONS.youtube}<span class="row-meta"><b>YOUTUBE</b><i>@ShwetaNimesh — live project demos</i></span></a>
</div>
<p class="rows-note">TALKS SHOP ABOUT</p>
<div class="tags tags-lg"><span>Data pipelines</span><span>LLM agents</span><span>RAG systems</span><span>Self-hosting &amp; homelabs</span><span>Collaborations</span></div>`,
  },
};

// question strings (chips + ASK buttons) → topic
const CANNED_BY_QUESTION = {
  "Tell me about DietDoctor AI, the WhatsApp dietician.": "dietdoctor",
  "Tell me the story of DietDoctor AI — what's clever about it?": "dietdoctor",
  "How does HealthCompanion keep patient records isolated?": "healthcompanion",
  "How does HealthCompanion keep patient data isolated and answers grounded?": "healthcompanion",
  "Tell me about Shweta's work experience.": "experience",
  "How does this site itself work?": "site",
  "How does this agent itself work? Shweta built you, right?": "site",
  "Walk me through EasyForm's LangGraph state machine.": "easyform",
  "How does the agentic Databricks platform turn English into Spark SQL safely?": "databricks",
  "Explain the real-time NiFi to Snowflake streaming pipeline.": "streaming",
  "Who is Shweta?": "about",
  "What's in Shweta's toolbox?": "stack",
  "What are Shweta's research roots?": "roots",
  "How do I get in touch with Shweta?": "contact",
};

const WAIT_LINES = [
  "WAKING THE HOMELAB…",
  "LOADING WEIGHTS…",
  "PRIMING THE PIPELINE…",
  "SPINNING UP THE MODEL…",
  "ALMOST THERE — COLD START…",
];

/* ---------- status ---------- */
async function checkStatus() {
  try {
    const r = await fetch("/api/config");
    const c = await r.json();
    lastStatus = c.status;
    if (c.status === "warm") {
      statusDot.className = "dot warm";
      statusText.textContent = `${c.model.toUpperCase()} · WARM`;
    } else if (c.status === "idle") {
      statusDot.className = "dot ok";
      statusText.textContent = `${c.model.toUpperCase()} · LIVE`;
    } else {
      statusDot.className = "dot";
      statusText.textContent = "MODEL ASLEEP · CASE FILES STILL ANSWER";
    }
  } catch {
    lastStatus = "unknown";
    statusDot.className = "dot";
    statusText.textContent = "STATUS UNKNOWN";
  }
}
checkStatus();
setInterval(checkStatus, 45000);

/* ---------- tiny markdown (escape first, then transform) ---------- */
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s) {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((mailto:[^\s)]+|https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[^"(\w])(https?:\/\/[^\s<)]+[^\s<).,!?])/g,
      '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, "$1<em>$2</em>");
}
function md(text) {
  const lines = esc(text).split("\n");
  const out = [];
  let list = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const li = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/);
    if (li) {
      if (!list) { list = []; }
      list.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    if (list) { out.push(`<ul>${list.join("")}</ul>`); list = null; }
    if (!line.trim()) continue;
    const h = line.match(/^#{1,4}\s+(.*)/);
    out.push(h ? `<p><strong>${inline(h[1])}</strong></p>` : `<p>${inline(line)}</p>`);
  }
  if (list) out.push(`<ul>${list.join("")}</ul>`);
  return out.join("");
}

/* ---------- messages ---------- */
function addMsg(role, label) {
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.innerHTML = `<div class="who">${label}</div><div class="body"></div>`;
  thread.appendChild(el);
  return el;
}

function scrollDown() {
  thread.scrollTop = thread.scrollHeight;
}

function renderCanned(question, topic) {
  const c = CANNED_TOPICS[topic];
  if (hello) hello.style.display = "none";
  addMsg("you", "YOU").querySelector(".body").textContent = question;
  history.push({ role: "user", content: question });

  const msgEl = addMsg("agent", 'FROM HER CASE FILES <b class="flash">⚡ INSTANT</b>');
  msgEl.classList.add("file");
  const body = msgEl.querySelector(".body");
  body.innerHTML = (c.schem || "") + (c.html || md(c.text));
  if (!c.noSources) addSources(body, c.text);
  // mark the voice so the live model doesn't adopt first person from her notes
  history.push({ role: "assistant", content: `[Shweta's own case note, shown to the visitor verbatim]\n${c.text}` });

  if (c.follow) {
    const press = document.createElement("button");
    press.className = "press";
    press.textContent = "PRESS FURTHER — ASK THE LIVE MODEL ↴";
    press.addEventListener("click", () => { press.remove(); ask(c.follow, true); });
    body.appendChild(press);
  }

  // line-by-line flow: each block (and each card/row inside) surfaces in sequence
  const blocks = [];
  [...body.children].forEach((el) => {
    if (el.classList.contains("rows") || el.classList.contains("duo")) blocks.push(...el.children);
    else blocks.push(el);
  });
  blocks.forEach((el, i) => {
    el.classList.add("seq");
    el.style.animationDelay = `${0.1 + i * 0.2}s`;
  });
  scrollDown();
  input.focus();
}

async function ask(question, forceLive = false) {
  if (busy || !question.trim()) return;

  const topic = CANNED_BY_QUESTION[question.trim()];
  if (topic && !forceLive) { renderCanned(question.trim(), topic); return; }

  // homelab asleep? say so warmly instead of hanging for minutes
  if (lastStatus === "offline") {
    try {
      const r = await fetch("/api/config");
      lastStatus = (await r.json()).status;
    } catch { /* keep offline */ }
    if (lastStatus === "offline") {
      if (hello) hello.style.display = "none";
      addMsg("you", "YOU").querySelector(".body").textContent = question;
      const note = addMsg("agent", "SHWETA'S AGENT");
      note.querySelector(".body").innerHTML =
        `<p>The live model naps on my homelab and it's unreachable right now — ` +
        `that's the one honest downside of self-hosting. The <strong>case-file topics ` +
        `still answer instantly</strong>, and for anything else ` +
        `<a href="mailto:shwetanimesh700@gmail.com">email me</a> — I reply fast.</p>`;
      scrollDown();
      return;
    }
  }

  busy = true;
  send.disabled = true;
  if (hello) hello.style.display = "none";

  addMsg("you", "YOU").querySelector(".body").textContent = question;
  history.push({ role: "user", content: question });
  scrollDown();

  const msgEl = addMsg("agent", "SHWETA'S AGENT");
  msgEl.classList.add("live");
  const body = msgEl.querySelector(".body");
  let waitIdx = 0;
  body.innerHTML = `<span class="thinking"><span class="spin"></span><span id="wl">${WAIT_LINES[0]}</span></span>`;
  const waitTimer = setInterval(() => {
    const wl = body.querySelector("#wl");
    if (wl) wl.textContent = WAIT_LINES[++waitIdx % WAIT_LINES.length];
  }, 3500);
  scrollDown();

  let answer = "";
  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const events = buf.split("\n\n");
      buf = events.pop();
      for (const ev of events) {
        const line = ev.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        const data = JSON.parse(line.slice(6));
        if (data.token) {
          if (!answer) clearInterval(waitTimer);
          answer += data.token;
          body.innerHTML = md(answer) + '<span class="cursor"></span>';
          scrollDown();
        }
        if (data.error) throw new Error(data.error);
      }
    }
    if (!answer) throw new Error("empty response");
    body.innerHTML = md(answer);
    addSources(body, answer);
    history.push({ role: "assistant", content: answer });
  } catch (e) {
    clearInterval(waitTimer);
    history.pop(); // let the visitor retry the same question cleanly
    body.innerHTML = `<div class="error">THE AGENT COULDN'T ANSWER (${esc(
      String(e.message || e)
    )}). THE HOMELAB MAY BE ASLEEP — TRY AGAIN IN A MOMENT, OR <a href="mailto:shwetanimesh700@gmail.com">EMAIL SHWETA</a>.</div>`;
  } finally {
    clearInterval(waitTimer);
    msgEl.classList.remove("live");
    busy = false;
    send.disabled = false;
    scrollDown();
    input.focus();
  }
}

/* ---------- sources row: cite what the answer mentioned ---------- */
function sourceChip(url) {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\./, "");
    if (h === "github.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) return `<b>⌥</b> ${esc(parts[1].toLowerCase())} · repo`;
      return `<b>⌥</b> github`;
    }
    if (h.includes("youtube.com") || h === "youtu.be") {
      return u.pathname.startsWith("/watch") || h === "youtu.be"
        ? `<b>▶</b> watch demo` : `<b>▶</b> youtube`;
    }
    if (h.includes("linkedin.com")) return `<b>in</b> linkedin`;
    if (h.includes("springer.com")) return `<b>§</b> springer paper`;
    if (h.includes("codeshare.co.in") || h.includes("shwetarani.com")) return `<b>●</b> live demo`;
    return `<b>↗</b> ${esc(h)}`;
  } catch { return null; }
}

function addSources(body, text) {
  const urls = [...new Set(
    (text.match(/https?:\/\/[^\s<)\]"']+[^\s<)\]"'.,!?]/g) || [])
  )].slice(0, 6);
  if (!urls.length) return;
  const row = document.createElement("div");
  row.className = "sources";
  row.innerHTML = urls
    .map((u) => {
      const label = sourceChip(u);
      return label ? `<a href="${esc(u)}" target="_blank" rel="noopener">${label} ↗</a>` : "";
    })
    .join("");
  if (row.innerHTML) body.appendChild(row);
}

/* ---------- case-files drawer ---------- */
function openDrawer() {
  drawer.hidden = false;
  drawerBackdrop.hidden = false;
  drawerClose.focus();
}
function closeDrawer() {
  drawer.hidden = true;
  drawerBackdrop.hidden = true;
}
document.querySelectorAll("[data-open-drawer]").forEach((b) =>
  b.addEventListener("click", openDrawer)
);
drawerClose.addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !drawer.hidden) closeDrawer();
});

/* ---------- wiring ---------- */
composer.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = input.value;
  input.value = "";
  ask(q);
});

document.querySelectorAll("[data-q]").forEach((btn) =>
  btn.addEventListener("click", () => {
    if (btn.closest("#drawer")) closeDrawer();
    ask(btn.dataset.q);
  })
);

/* ---------- presence: IST clock + what she's probably doing ---------- */
function presence() {
  const el = document.getElementById("presence");
  if (!el) return;
  const ist = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
  const h = ist.getHours();
  const hh = String(h).padStart(2, "0");
  const mm = String(ist.getMinutes()).padStart(2, "0");
  const doing =
    h < 7 ? "ASLEEP — THE AGENT ISN'T" :
    h < 10 ? "CHAI, THEN PIPELINES" :
    h < 13 ? "PROBABLY SHIPPING" :
    h < 14 ? "AT LUNCH" :
    h < 19 ? "IN THE PIPELINE" :
    h < 23 ? "TINKERING ON THE HOMELAB" :
    "ASLEEP — THE AGENT ISN'T";
  el.textContent = `IST ${hh}:${mm} · SHWETA: ${doing}`;
}
presence();
setInterval(presence, 30000);

/* ---------- deep links: #dietdoctor opens that case-file answer ---------- */
const SLUG_TO_QUESTION = {
  dietdoctor: "Tell me about DietDoctor AI, the WhatsApp dietician.",
  healthcompanion: "How does HealthCompanion keep patient records isolated?",
  experience: "Tell me about Shweta's work experience.",
  site: "How does this site itself work?",
  easyform: "Walk me through EasyForm's LangGraph state machine.",
  databricks: "How does the agentic Databricks platform turn English into Spark SQL safely?",
  streaming: "Explain the real-time NiFi to Snowflake streaming pipeline.",
  about: "Who is Shweta?",
  stack: "What's in Shweta's toolbox?",
  roots: "What are Shweta's research roots?",
  contact: "How do I get in touch with Shweta?",
  casefiles: "__drawer__",
};
const slug = decodeURIComponent(location.hash.slice(1)).toLowerCase();
if (SLUG_TO_QUESTION[slug]) {
  if (SLUG_TO_QUESTION[slug] === "__drawer__") openDrawer();
  else ask(SLUG_TO_QUESTION[slug]);
}

input.focus();
