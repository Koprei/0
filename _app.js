// ─────────────────────────────────────────────────────────────
//  _app.js  —  Shared core for MyRecord mobile app
//  Edit this file to change: GS URL, navigation, toast, clock
// ─────────────────────────────────────────────────────────────

// ── CONFIG ──────────────────────────────────────────────────
const GS_URL  = "https://script.google.com/macros/s/AKfycbz9TURWIT_vdjoPqCDdmC503sblckjXSoM-Bu2nPRS1URTCBGHLYV81Rga0Fmkxn5qH3A/exec";
const BALANCE = 20;

// ── SHARED STATE ────────────────────────────────────────────
let currentScreen = "home";
let currentConfig = null;
let genericRows   = [];
let leaveEntries  = [];
let editData      = null;
let editSheet     = null;

// ── GS FETCH ────────────────────────────────────────────────
async function gsFetch(params) {
  const url = GS_URL + "?" + new URLSearchParams(params).toString();
  const res = await fetch(url);
  const txt = await res.text();
  try { return JSON.parse(txt); }
  catch(e) { throw new Error("Bad response: " + txt.slice(0, 80)); }
}

// ── UTILITIES ───────────────────────────────────────────────
function tod() { return new Date().toISOString().slice(0, 10); }

function fmtDate(d) {
  if (!d) return "–";
  const p = String(d).split("-");
  if (p.length !== 3) return d;
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${p[2]}-${m[parseInt(p[1])-1]}-${p[0]}`;
}

function toast(msg, type) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast show" + (type === "err" ? " err" : type === "ok" ? " ok" : "");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.className = "toast", 2800);
}

function updateClock() {
  const n = new Date();
  document.getElementById("clockTime").textContent =
    n.getHours().toString().padStart(2,"0") + ":" +
    n.getMinutes().toString().padStart(2,"0");
}

function toggleForm(id) {
  const el  = document.getElementById(id);
  const btn = el.previousElementSibling.querySelector(".form-card-toggle");
  if (el.style.display === "none") { el.style.display = "block"; btn.textContent = "Hide ↑"; }
  else                              { el.style.display = "none";  btn.textContent = "Show ↓"; }
}

// ── NAVIGATION ──────────────────────────────────────────────
function openScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));

  if (name === "leave") {
    document.getElementById("screen-leave").classList.add("active");
    document.getElementById("tab-leave").classList.add("active");
    loadLeave();
  } else if (name === "home") {
    document.getElementById("screen-home").classList.add("active");
    document.getElementById("tab-home").classList.add("active");
  } else if (PAGE_CONFIG[name]) {
    loadGeneric(name);
    document.getElementById("screen-generic").classList.add("active");
  }
  currentScreen = name;
  const el = document.getElementById("screen-" + name) || document.getElementById("screen-generic");
  if (el) el.scrollTop = 0;
}

function goHome()     { openScreen("home"); }
function showTab(t)   { openScreen(t); }

function goSettings() {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
  document.getElementById("screen-settings").classList.add("active");
  document.getElementById("tab-settings").classList.add("active");
  currentScreen = "settings";
}

// ── EDIT SHEET (bottom drawer shared by leave + generic) ────
function closeSheet(evt) {
  if (evt.target === document.getElementById("editSheet")) closeSheetDirect();
}
function closeSheetDirect() {
  document.getElementById("editSheet").classList.remove("open");
  editData = null;
}

async function saveEntry() {
  if (editSheet === "Annual Leave") {
    await saveLeaveEntry();
  } else {
    await saveGenericEntry();
  }
}

async function deleteEntry() {
  const id    = document.getElementById("sheetId").value;
  const sheet = editSheet;
  if (!confirm("Delete this entry?")) return;
  try {
    const data = await gsFetch({ action:"delete", sheet, id });
    if (data.error) throw new Error(data.error);
    toast("Deleted","ok");
    closeSheetDirect();
    if (sheet === "Annual Leave") await loadLeave();
    else await loadGenericData(currentScreen);
  } catch(e) { toast("Error: " + e.message, "err"); }
}

// ── INIT ────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  updateClock();
  setInterval(updateClock, 10000);

  const h = new Date().getHours();
  document.getElementById("heroGreeting").textContent =
    h < 12 ? "Good morning ☀️" : h < 17 ? "Good afternoon 🌤" : "Good evening 🌙";

  document.getElementById("lDate").value    = tod();
  document.getElementById("lAppDate").value = tod();
  document.getElementById("settingsUrl").value = GS_URL;

  setTimeout(() => {
    document.getElementById("splash").classList.add("hide");
    loadLeaveStats();
  }, 1600);
});
