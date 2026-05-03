const state = {
  initialAnswers: null,
  followUpQuestions: [],
  followUpAnswers: {},
  result: null,
};

const $ = (id) => document.getElementById(id);
const screens = ["screen-1", "screen-2", "screen-3"];
function show(id) {
  screens.forEach((s) => $(s).classList.toggle("hidden", s !== id));
  window.scrollTo(0, 0);
}

function showLoading(text) {
  $("loading-text").textContent = text;
  $("loading").classList.remove("hidden");
}
function hideLoading() {
  $("loading").classList.add("hidden");
}

// ---------- Demo loader ----------
$("load-demo").addEventListener("click", () => {
  const f = $("form-initial");
  f.cuisine.value = "Phở và bún bò Huế";
  f.neighborhood.value = "Dorchester";
  f.seats.value = "21-50";
  Array.from(f.alcohol).find((r) => r.value === "Beer & wine only").checked = true;
  Array.from(f.stage).find((r) => r.value === "Lease signed").checked = true;
  f.language.value = "Vietnamese";
});

// ---------- Screen 1 → follow-ups ----------
$("form-initial").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const initialAnswers = Object.fromEntries(fd.entries());
  state.initialAnswers = initialAnswers;

  showLoading("Mise is preparing follow-up questions...");
  try {
    const res = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialAnswers }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.followUpQuestions = data.followUpQuestions || [];
    renderFollowUps();
    show("screen-2");
  } catch (err) {
    alert("Error generating follow-up questions: " + err.message);
  } finally {
    hideLoading();
  }
});

// ---------- Render adaptive follow-ups ----------
function renderFollowUps() {
  const container = $("followups-container");
  container.innerHTML = "";
  state.followUpQuestions.forEach((q) => {
    const block = document.createElement("div");
    let inputHtml = "";
    if (q.inputType === "text") {
      inputHtml = `<input type="text" name="${q.id}" required class="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none" />`;
    } else if (q.inputType === "select") {
      inputHtml = `<select name="${q.id}" required class="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none"><option value="">Choose</option>${(q.options || []).map((o) => `<option>${escapeHtml(o)}</option>`).join("")}</select>`;
    } else {
      inputHtml = `<div class="space-y-2">${(q.options || []).map((o, i) => `<label class="flex items-center gap-2"><input type="radio" name="${q.id}" value="${escapeHtml(o)}" ${i === 0 ? "required" : ""} class="text-emerald-700" /> ${escapeHtml(o)}</label>`).join("")}</div>`;
    }
    block.innerHTML = `<label class="block text-sm font-semibold text-stone-700 mb-2">${escapeHtml(q.question)}</label>${inputHtml}`;
    container.appendChild(block);
  });
}

// ---------- Screen 2 → results ----------
$("form-followups").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const followUpAnswers = Object.fromEntries(fd.entries());
  state.followUpAnswers = followUpAnswers;

  showLoading("Mise is building your roadmap and prep sheet...");
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initialAnswers: state.initialAnswers,
        followUpAnswers,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.result = data;
    renderResults(data);
    show("screen-3");
  } catch (err) {
    alert("Error generating roadmap: " + err.message);
  } finally {
    hideLoading();
  }
});

// ---------- Render results ----------
function renderResults(data) {
  // Language indicator
  if (data.detectedLanguage) {
    const li = $("lang-indicator");
    li.textContent = `Language: ${data.detectedLanguage}`;
    li.classList.remove("hidden");
  }

  // Concept summary
  $("concept-summary-text").textContent = data.conceptSummary || "";

  // Warnings
  const warnings = data.warnings || [];
  if (warnings.length) {
    $("warnings-banner").classList.remove("hidden");
    $("warnings-list").innerHTML = warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("");
  } else {
    $("warnings-banner").classList.add("hidden");
  }

  // Roadmap, grouped by phase
  const phases = ["Setup", "Build-out", "Pre-opening"];
  const phaseClass = { "Setup": "phase-setup", "Build-out": "phase-buildout", "Pre-opening": "phase-preopening" };
  const grouped = {};
  phases.forEach((p) => (grouped[p] = []));
  (data.roadmap || []).forEach((item) => {
    if (grouped[item.phase]) grouped[item.phase].push(item);
    else (grouped["Setup"] ||= []).push(item);
  });

  const rc = $("roadmap-container");
  rc.innerHTML = "";
  phases.forEach((phase) => {
    const items = grouped[phase];
    if (!items.length) return;
    const section = document.createElement("div");
    section.innerHTML = `
      <h4 class="font-serif-display text-lg font-semibold text-stone-700 mb-3 uppercase tracking-wide text-xs">${phase}</h4>
      <div class="space-y-3">
        ${items.map((it) => `
          <div class="menu-card border border-stone-200 rounded-lg p-4 shadow-sm ${phaseClass[phase]}">
            <div class="font-semibold text-stone-900">${escapeHtml(it.item || "")}</div>
            <div class="text-sm text-stone-600 mt-1">${escapeHtml(it.whatItIs || "")}</div>
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 mt-2">
              ${it.fee ? `<span><span class="font-medium text-stone-600">Fee:</span> ${escapeHtml(it.fee)}</span>` : ""}
              ${it.timeline ? `<span><span class="font-medium text-stone-600">Timeline:</span> ${escapeHtml(it.timeline)}</span>` : ""}
              ${it.agency ? `<span><span class="font-medium text-stone-600">Agency:</span> ${escapeHtml(it.agency)}</span>` : ""}
            </div>
          </div>
        `).join("")}
      </div>`;
    rc.appendChild(section);
  });

  // Prep sheet
  const ps = data.prepSheet || {};
  const pc = $("prep-container");
  pc.innerHTML = `
    <div>
      <div class="text-xs uppercase tracking-wide text-stone-500 font-semibold">Next critical interaction</div>
      <div class="font-serif-display text-xl font-semibold text-stone-900 mt-1">${escapeHtml(ps.interactionName || "")}</div>
      ${ps.location ? `<div class="text-sm text-stone-600 mt-1">📍 ${escapeHtml(ps.location)}</div>` : ""}
    </div>
    ${section("What to bring", ps.whatToBring)}
    ${section("They will ask you", ps.theyWillAsk)}
    ${section("You should ask them", ps.youShouldAsk)}
    ${section("Key English terms to recognize", ps.keyTermsEnglish, true)}
    ${ps.whatGoodLooksLike ? `<div><div class="text-xs uppercase tracking-wide text-stone-500 font-semibold mb-1">What good looks like</div><div class="text-sm text-stone-700">${escapeHtml(ps.whatGoodLooksLike)}</div></div>` : ""}
    ${ps.ifItGoesBadly ? `<div><div class="text-xs uppercase tracking-wide text-stone-500 font-semibold mb-1">If it goes badly</div><div class="text-sm text-stone-700">${escapeHtml(ps.ifItGoesBadly)}</div></div>` : ""}
  `;
}

function section(title, items, mono = false) {
  if (!items || !items.length) return "";
  return `<div>
    <div class="text-xs uppercase tracking-wide text-stone-500 font-semibold mb-1">${title}</div>
    <ul class="list-disc pl-5 space-y-1 text-sm text-stone-700 ${mono ? "font-mono" : ""}">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
  </div>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- Restart ----------
$("restart").addEventListener("click", () => {
  state.initialAnswers = null;
  state.followUpQuestions = [];
  state.followUpAnswers = {};
  state.result = null;
  $("form-initial").reset();
  $("form-followups").reset();
  $("lang-indicator").classList.add("hidden");
  show("screen-1");
});
