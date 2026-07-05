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



/* rotating field notes — all true, all from the case files */
const FACTS = [
  "Her AI dietician lives entirely inside WhatsApp — no app, no login, you just text it.",
  "The medical RAG cites every answer back to the exact source document. Every one.",
  "The first model she trained segmented lungs on chest X-rays — still her most-starred repo.",
  "This site runs on a self-hosted Llama on her own hardware. Zero cloud APIs.",
  "Every git push here auto-releases: Actions → GHCR → ArgoCD → her Kubernetes cluster.",
  "She published deep-learning research with Springer before LLMs were fashionable.",
  "Her agents never do arithmetic — deterministic Python tools do. LLMs can't be trusted with your macros.",
  "Her Llama 3.3 agent writes and executes its own Spark SQL over Databricks.",
  "She's classified 102 kinds of molecules with CNNs and transfer learning. For fun.",
  "Real-time CDC into Snowflake is her production comfort zone, not a demo.",
];

/* surprise pool — random questions for the live model */
const SURPRISE = [
  "What are Shweta's research roots?",
  "Walk me through EasyForm's LangGraph state machine.",
  "How does the agentic Databricks platform turn English into Spark SQL safely?",
  "What's the most surprising thing in Shweta's GitHub?",
  "What do DietDoctor and HealthCompanion have in common under the hood?",
  "Tell me about her lung X-ray segmentation work.",
  "Explain the real-time NiFi to Snowflake streaming pipeline.",
];

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
      statusText.textContent = "MODEL ASLEEP · BROWSE THE CASE FILES";
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

async function ask(question) {
  if (busy || !question.trim()) return;

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
        `that's the one honest downside of self-hosting. Browse the ` +
        `<strong>case files</strong> meanwhile (the repos and demo videos are all ` +
        `linked), and for anything else ` +
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

/* ---------- rotating field notes ---------- */
const factsBtn = document.getElementById("facts");
if (factsBtn) {
  const factNo = document.getElementById("factNo");
  const factText = document.getElementById("factText");
  let fi = Math.floor((Date.now() / 60000) % FACTS.length); // varies per visit
  const showFact = () => {
    factText.classList.remove("swap");
    void factText.offsetWidth; // restart the fade
    factText.classList.add("swap");
    factText.textContent = FACTS[fi];
    factNo.textContent = `${String(fi + 1).padStart(2, "0")}/${FACTS.length}`;
  };
  showFact();
  let factTimer = setInterval(() => { fi = (fi + 1) % FACTS.length; showFact(); }, 6000);
  factsBtn.addEventListener("click", () => {
    clearInterval(factTimer);
    fi = (fi + 1) % FACTS.length;
    showFact();
    factTimer = setInterval(() => { fi = (fi + 1) % FACTS.length; showFact(); }, 6000);
  });
}

/* ---------- surprise me ---------- */
document.querySelectorAll("[data-surprise]").forEach((btn) =>
  btn.addEventListener("click", () => ask(SURPRISE[Math.floor(Math.random() * SURPRISE.length)]))
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
  el.innerHTML = `IST ${hh}:${mm} · SHWETA: ${doing} <i class="blink" aria-hidden="true">▌</i>`;
}
presence();
setInterval(presence, 30000);

/* ---------- deep links: #dietdoctor asks the agent about that project ---------- */
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
  impress: "Impress me in thirty seconds.",
  casefiles: "__drawer__",
};
const slug = decodeURIComponent(location.hash.slice(1)).toLowerCase();
if (SLUG_TO_QUESTION[slug]) {
  if (SLUG_TO_QUESTION[slug] === "__drawer__") openDrawer();
  else ask(SLUG_TO_QUESTION[slug]);
}

input.focus();
