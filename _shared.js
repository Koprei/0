// ─────────────────────────────────────────────
//  Shared utilities for all pages
// ─────────────────────────────────────────────

const GS = {
  get url() { return localStorage.getItem("gs_url") || ""; },
  set url(v) { localStorage.setItem("gs_url", v); },

  async fetch(params) {
    if (!this.url) throw new Error("No Apps Script URL configured");
    const res = await fetch(this.url + "?" + new URLSearchParams(params));
    const txt = await res.text();
    try { return JSON.parse(txt); }
    catch(e) { throw new Error("Bad response: " + txt.slice(0, 100)); }
  },

  async read(sheet)              { return this.fetch({ action:"read", sheet }); },
  async add(sheet, row)          { return this.fetch({ action:"add", sheet, ...row }); },
  async update(sheet, id, row)   { return this.fetch({ action:"update", sheet, id, ...row }); },
  async remove(sheet, id)        { return this.fetch({ action:"delete", sheet, id }); },
};

function toast(msg, type="info") {
  let t = document.getElementById("_toast");
  if (!t) { t = document.createElement("div"); t.id = "_toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = "toast show " + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.className = "toast", 2800);
}

function fmtDate(d) {
  if (!d) return "–";
  const p = String(d).split("-");
  if (p.length !== 3) return d;
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${p[2]}-${m[parseInt(p[1])-1]}-${p[0]}`;
}

function today() { return new Date().toISOString().slice(0,10); }

function setSyncState(state, label) {
  const dot = document.getElementById("sdot");
  const lbl = document.getElementById("slabel");
  if (dot) dot.className = "sdot " + state;
  if (lbl) lbl.textContent = label;
}

// Nav active state
document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a[data-page]").forEach(a => {
    a.classList.toggle("active", a.dataset.page === path);
  });
  // Load saved URL into any config input
  const inp = document.getElementById("urlInput");
  if (inp && GS.url) inp.value = GS.url;
});
