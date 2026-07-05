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

/* ---------- curated case-file notes ----------
   Known questions answer INSTANTLY from these notes (honestly labeled),
   with a handoff button that sends a deeper question to the live model.
   Anything typed freely still goes straight to the LLM. */
const CANNED_TOPICS = {
  dietdoctor: {
    text: `I built **DietDoctor AI** because diet advice fails at the follow-through — so I put the dietician where the conversation already happens: WhatsApp. No app, no login; you just text it.
The part I'm proudest of: the LLM never does arithmetic. BMI, BMR and macro math run as deterministic Python function-calls, so the coaching is conversational but the numbers are exact. Gemini 2.5 Flash + Google ADK behind FastAPI, containerized on my Kubernetes cluster with GitOps deploys.
Watch it work: https://www.youtube.com/watch?v=LNHT23NMFGU · code: https://github.com/rani700/DietDoctorAI`,
    follow: "What were the hardest engineering problems in DietDoctor AI?",
  },
  healthcompanion: {
    text: `**HealthCompanion** answers medical questions from one source only: that patient's own records. Every patient gets an isolated ChromaDB collection, so cross-patient leakage is structurally impossible — not just discouraged by a prompt.
Gemini vision OCR reads scanned and handwritten documents; retrieval is hybrid — semantic + keyword fused with RRF, then MMR for diversity — and every answer carries citations back to the source document. JWT auth and role-based access wrap the whole thing.
Try it live: https://healthcompanion.codeshare.co.in · code: https://github.com/rani700/healthcompanion`,
    follow: "How does HealthCompanion's hybrid retrieval actually work, step by step?",
  },
  experience: {
    text: `Right now I'm a Data Engineer at **WNS** in Gurugram — end-to-end ETL/ELT on Azure, Python and SQL at serious scale, real-time NiFi → Snowflake streaming, automated data-quality frameworks, and I drive GenAI adoption in my role by prototyping LLM agents that automate data workflows.
Earlier, at **Astrea IT Services**, I built Salesforce solutions — Apex, triggers, Visualforce — and shipped production process automations.
The case files are where those two crafts meet: pipelines by day, agents on my own cluster.`,
    follow: "What does Shweta work on day-to-day at WNS?",
  },
  site: {
    text: `You're inside one of my systems right now. This chat streams from **Llama 3.1** on Ollama — running on my own hardware, no cloud APIs — through a FastAPI backend I wrote, grounded in a markdown knowledge base so it answers from my real work instead of imagining it.
Every git push cuts a release: GitHub Actions builds the container, publishes to GHCR, and ArgoCD rolls it onto my Kubernetes cluster. The page you're reading is the demo.
Source: https://github.com/rani700/shweta-agent`,
    follow: "What's the full deployment pipeline behind this site?",
  },
  easyform: {
    text: `**EasyForm** fills government exam forms from a pile of documents — marksheets, ID cards — using GPT-4o vision inside a LangGraph state machine: classify → extract → validate → merge.
The clever part is trust: extracted fields are cross-checked with fuzzy identity matching across documents, and when something's missing the agent emails the applicant itself (IMAP/SMTP), parses the reply in natural language, and continues where it left off.
Code: https://github.com/rani700/easyform`,
    follow: "What breaks first in document-extraction pipelines, and how does EasyForm handle it?",
  },
  databricks: {
    text: `The **Agentic Data Platform** lets you question a Databricks lakehouse in plain English. A Llama 3.3 agent runs the ReAct loop — reason, write Spark SQL, execute, read the result, refine — over a Medallion (bronze/silver/gold) architecture, autonomously.
Build walkthrough: https://www.youtube.com/watch?v=as7wht24yj4 · code: https://github.com/rani700/Databricks_Ecomm_Data_Platform`,
    follow: "How does the ReAct loop decide the Spark SQL it generates is safe and correct?",
  },
  streaming: {
    text: `My **real-time streaming pipeline** is the backbone pattern I run in production: EC2 → Apache NiFi → S3 → SnowPipe → Snowflake, with change-data-capture handled natively by Snowflake streams and tasks. The whole stack ships as Docker Compose, so it stands up identically anywhere.
Demo: https://www.youtube.com/watch?v=wH_MlgZoMhA · code: https://github.com/rani700/RealTime-Data-Streaming-using-Apache-Nifi-AWS-and-Snowflake`,
    follow: "Where does back-pressure show up in the NiFi to Snowflake pipeline, and how is it handled?",
  },
  about: {
    text: `I'm Shweta — a data engineer at **WNS** in Gurugram who builds the other half of the stack too: the intelligent systems the data feeds. By day I run production ETL and real-time streams; on my own Kubernetes cluster I ship LLM agents, RAG systems and document intelligence end-to-end.
My foundation is an integrated B.Tech + M.Tech in **AI & Robotics**, with peer-reviewed research published by **Springer** — I was training neural networks before LLMs made it fashionable.
I showcase everything I build on YouTube: https://youtube.com/@ShwetaNimesh · and it all lives at https://github.com/rani700`,
    follow: "What kind of problems does Shweta most enjoy solving?",
  },
  stack: {
    text: `Tools I actually use, not collect:
- **GenAI** — LLM agents, RAG, function calling, ReAct; LangGraph, LangChain, Google ADK; GPT-4o, Gemini, Llama 3.3; ChromaDB for vectors
- **Data engineering** — Apache Spark, NiFi, Airflow; CDC and real-time streaming; Snowflake, Databricks, Delta Lake
- **Cloud & shipping** — Azure Data Factory & Functions, AWS S3/Lambda/EC2; FastAPI, Docker, Kubernetes, ArgoCD, GitHub Actions
- **Languages** — Python, SQL, PySpark
Proof beats lists — every case file on this site runs on a slice of this stack: https://github.com/rani700`,
    follow: "Which parts of this stack has Shweta run in production?",
  },
  roots: {
    text: `Before the LLM era, there was the lab. My integrated **B.Tech (CS) + M.Tech (AI & Robotics)** from Gautam Buddha University — CGPA 8.22 / 8.36 — came with a research streak: a peer-reviewed **Springer** paper, *Data Imputation in WSN using Deep Learning* (ICDAM).
The applied side of that era is still on my GitHub: lung-field segmentation on chest X-rays (my most-starred repo), 102-class molecule classification with CNNs and transfer learning, time-series forecasting.
Paper: https://link.springer.com/book/10.1007/978-981-15-8335-3 · X-ray work: https://github.com/rani700/xray`,
    follow: "How does her classical ML background show up in how she builds LLM systems?",
  },
  contact: {
    text: `The fastest channel is email: [shwetanimesh700@gmail.com](mailto:shwetanimesh700@gmail.com) — I genuinely reply fast.
Elsewhere: https://linkedin.com/in/shwetarani24 · https://github.com/rani700 · https://youtube.com/@ShwetaNimesh
If you're sitting on an interesting problem in data or GenAI, I'd love to hear about it.`,
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
  body.innerHTML = md(c.text);
  addSources(body, c.text);
  // mark the voice so the live model doesn't adopt first person from her notes
  history.push({ role: "assistant", content: `[Shweta's own case note, shown to the visitor verbatim]\n${c.text}` });

  if (c.follow) {
    const press = document.createElement("button");
    press.className = "press";
    press.textContent = "PRESS FURTHER — ASK THE LIVE MODEL ↴";
    press.addEventListener("click", () => { press.remove(); ask(c.follow, true); });
    body.appendChild(press);
  }
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
