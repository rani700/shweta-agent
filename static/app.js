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
    if (c.status === "warm") {
      statusDot.className = "dot warm";
      statusText.textContent = `LIVE · ${c.model.toUpperCase()} · WARM`;
    } else if (c.status === "idle") {
      statusDot.className = "dot ok";
      statusText.textContent = `LIVE · ${c.model.toUpperCase()} · ON-DEMAND`;
    } else {
      statusDot.className = "dot";
      statusText.textContent = "AGENT OFFLINE — TRY EMAIL INSTEAD";
    }
  } catch {
    statusDot.className = "dot";
    statusText.textContent = "AGENT STATUS UNKNOWN";
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
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
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

input.focus();
