// ─────────────────────────────────────────────────────────────
//  _leave.js  —  Annual Leave screen logic
//  Edit ONLY this file to change leave behaviour.
//  Depends on: _app.js  (gsFetch, toast, fmtDate, tod, BALANCE,
//               leaveEntries, editSheet, closeSheetDirect)
// ─────────────────────────────────────────────────────────────

// ── NORMALISE ────────────────────────────────────────────────
// Apps Script addLeaveRow() always writes columns in this fixed order:
//   col0=AppNo  col1=date  col2=balance  col3=spent  col4=applied
//   col5=remained  col6=reason  col7=remark  col8=appDate
// Reading by position means we work regardless of sheet header names.
function normalizeLeaveEntry(raw) {
  const META = new Set(["_rowIndex", "id", "isBF"]);
  const vals = Object.entries(raw)
    .filter(([k]) => !META.has(k))
    .map(([, v]) => (v === undefined || v === null) ? "" : String(v));
  // vals[0]=AppNo, [1]=date, [2]=balance, [3]=spent, [4]=applied,
  // [5]=remained, [6]=reason, [7]=remark, [8]=appDate
  const id = String(raw.id !== undefined && raw.id !== "" ? raw.id : (vals[0] || ""));
  return {
    id       : id,
    isBF     : id === "0" || vals[1] === "",
    date     : vals[1]  || "",
    balance  : vals[2]  || "",
    spent    : vals[3]  || "",
    applied  : vals[4]  || "",
    remained : vals[5]  || "",
    reason   : vals[6]  || "",
    remark   : vals[7]  || "",
    appDate  : vals[8]  || "",
    _rowIndex: raw._rowIndex,
  };
}

// ── ACCESSORS ────────────────────────────────────────────────
const lSpent    = e => parseFloat(e.spent);
const lRemained = e => parseFloat(e.remained);
const lApplied  = e => parseFloat(e.applied);
const lDate     = e => e.date    || "";
const lReason   = e => e.reason  || "";
const lRemark   = e => e.remark  || "";
const lAppDate  = e => e.appDate || "";
const lId       = e => e.id      || String(e._rowIndex || "");
const lIsBF     = e => e.isBF === true;

// ── LOAD ─────────────────────────────────────────────────────
async function loadLeaveStats() {
  try {
    const data = await gsFetch({ action:"read", sheet:"Annual Leave" });
    leaveEntries = (data.entries || []).map(normalizeLeaveEntry);
    updateLeaveHero();
  } catch(e) {}
}

async function loadLeave() {
  document.getElementById("leaveList").innerHTML =
    '<div style="text-align:center;padding:2rem;color:var(--text3);font-size:13px">Loading…</div>';
  try {
    const data = await gsFetch({ action:"read", sheet:"Annual Leave" });
    leaveEntries = (data.entries || []).map(normalizeLeaveEntry);
    renderLeave();
    updateLeaveHero();
  } catch(e) {
    document.getElementById("leaveList").innerHTML =
      '<div style="text-align:center;padding:2rem;color:var(--red);font-size:13px">Could not load data</div>';
    toast("Error: " + e.message, "err");
  }
}

// ── HERO STATS (home screen) ─────────────────────────────────
function updateLeaveHero() {
  const rows  = leaveEntries.filter(e => !lIsBF(e));
  const last  = rows[rows.length - 1];
  const rem   = last && !isNaN(lRemained(last)) ? lRemained(last) : BALANCE;
  const spent = last && !isNaN(lSpent(last))    ? lSpent(last)    : 0;
  document.getElementById("heroLeave").textContent = rem.toFixed(1) + " d";
  document.getElementById("heroUsed").textContent  = spent.toFixed(1) + " d";
}

// ── RENDER LIST ──────────────────────────────────────────────
function renderLeave() {
  const rows  = leaveEntries.filter(e => !lIsBF(e));
  const last  = rows[rows.length - 1];
  const spent = last && !isNaN(lSpent(last))    ? lSpent(last)    : 0;
  const rem   = last && !isNaN(lRemained(last)) ? lRemained(last) : BALANCE;
  const pct   = Math.min(Math.round(spent / BALANCE * 100), 100);

  document.getElementById("lSpent").textContent = spent.toFixed(1);
  document.getElementById("lRem").textContent   = rem.toFixed(1);
  document.getElementById("lRem").className     = "stat-pill-val " + (rem <= 3 ? "r" : rem <= 7 ? "" : "g");
  document.getElementById("lProgBar").style.width = pct + "%";
  document.getElementById("lCount").textContent  = rows.length + " entries";

  const list = document.getElementById("leaveList");
  if (!rows.length) {
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text3);font-size:13px">No entries yet. Add one above.</div>';
    return;
  }

  list.innerHTML = [...rows].reverse().map(e => {
    const r2  = lRemained(e);
    const ap  = lApplied(e);
    const cls = isNaN(r2) || r2 <= 3 ? "r" : r2 <= 7 ? "" : "g";
    const idx = leaveEntries.indexOf(e);
    return `<div class="entry-card" onclick="openLeaveEdit(${idx})">
      <div class="entry-icon" style="background:rgba(0,184,148,.2)">🌴</div>
      <div class="entry-info">
        <div class="entry-title">${lReason(e) || "Leave"}${lRemark(e) ? " · " + lRemark(e) : ""}</div>
        <div class="entry-sub">${fmtDate(lDate(e))}</div>
      </div>
      <div class="entry-right">
        <div class="entry-val ${cls}">${isNaN(ap) ? "–" : ap.toFixed(1) + "d"}</div>
        <div class="entry-date">${isNaN(r2) ? "–" : r2.toFixed(1) + " left"}</div>
      </div>
    </div>`;
  }).join("");
}

// ── ADD ──────────────────────────────────────────────────────
async function addLeave() {
  const date    = document.getElementById("lDate").value;
  const days    = parseFloat(document.getElementById("lDays").value);
  const reason  = document.getElementById("lReason").value || "Other";
  const remark  = document.getElementById("lRemark").value.trim();
  const appDate = document.getElementById("lAppDate").value;
  const addCal  = document.getElementById("lCal").checked;

  if (!date || !days || days <= 0) { toast("Fill in date and days", "err"); return; }

  const btn = document.getElementById("lAddBtn");
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    const data = await gsFetch({ action:"add", sheet:"Annual Leave", date, applied:days, reason, remark, appDate });
    if (data.error) throw new Error(data.error);
    document.getElementById("lDays").value   = "";
    document.getElementById("lRemark").value = "";
    document.getElementById("lReason").value = "";
    await loadLeave();
    if (addCal) silentCalendar({ date, applied:days, reason, remark });
    toast(addCal ? "Saved & added to Calendar ✓" : "Entry saved ✓", "ok");
  } catch(e) { toast("Error: " + e.message, "err"); }
  finally { btn.disabled = false; btn.textContent = "+ Add Entry"; }
}

// ── EDIT SHEET ───────────────────────────────────────────────
function openLeaveEdit(idx) {
  const e = leaveEntries[idx];
  if (!e) return;
  editData  = e;
  editSheet = "Annual Leave";
  const id  = lId(e);
  document.getElementById("sheetTitle").textContent = "Edit Leave Entry";
  document.getElementById("sheetBody").innerHTML = `
    <input type="hidden" id="sheetId" value="${id}"/>
    <div class="f-row">
      <div class="f-field"><label>Date</label>
        <input type="date" id="sDate" value="${lDate(e)}"/>
      </div>
      <div class="f-field"><label>Days</label>
        <input type="number" id="sDays" min="0.5" step="0.5" value="${isNaN(lApplied(e)) ? "" : lApplied(e)}"/>
      </div>
    </div>
    <div class="f-field"><label>Reason</label>
      <select id="sReason">
        ${["Busy at home","Going to province","Going to homeland","Children Graduation","Medical","Other"]
          .map(o => `<option ${lReason(e) === o ? "selected" : ""}>${o}</option>`).join("")}
      </select>
    </div>
    <div class="f-field"><label>Remark</label>
      <input type="text" id="sRemark" value="${lRemark(e)}"/>
    </div>
    <div class="f-field"><label>Application date</label>
      <input type="date" id="sAppDate" value="${lAppDate(e)}"/>
    </div>
  `;
  document.getElementById("editSheet").classList.add("open");
}

async function saveLeaveEntry() {
  const id      = document.getElementById("sheetId").value;
  const date    = document.getElementById("sDate").value;
  const applied = parseFloat(document.getElementById("sDays").value);
  const reason  = document.getElementById("sReason").value;
  const remark  = document.getElementById("sRemark").value.trim();
  const appDate = document.getElementById("sAppDate").value;
  if (!date || !applied || applied <= 0) { toast("Fill in date and days", "err"); return; }
  try {
    // delete + re-add (position-based) — robust regardless of sheet header names,
    // since addLeaveRow() always writes columns in the fixed order
    // [AppNo, date, balance, spent, applied, remained, reason, remark, appDate].
    // The Apps Script now returns an error if the row-to-delete isn't found,
    // so we check that before adding to avoid creating a duplicate.
    const delData = await gsFetch({ action:"delete", sheet:"Annual Leave", id });
    if (delData.error) throw new Error(delData.error);
    const addData = await gsFetch({ action:"add", sheet:"Annual Leave", date, applied, reason, remark, appDate });
    if (addData.error) throw new Error(addData.error);
    toast("Updated ✓", "ok");
    closeSheetDirect();
    await loadLeave();
  } catch(e) { toast("Error: " + e.message, "err"); }
}

// ── GOOGLE CALENDAR (silent server-side, fallback to tab) ────
async function silentCalendar(e) {
  const title   = "🌴 Leave" + (e.reason ? " – " + e.reason : "") + (e.remark ? " (" + e.remark + ")" : "");
  const date    = e.date || "";
  const applied = parseFloat(e.applied) || 1;
  try {
    const data = await gsFetch({
      action: "addCalendar", title, date, days: applied,
      description: "Leave: " + (e.reason||"") + " | Remark: " + (e.remark||"") + " | Days: " + applied,
    });
    if (data && data.ok) return;
    throw new Error(data?.error || "GS calendar failed");
  } catch(err) {
    const d    = date.replace(/-/g, "");
    const end  = new Date(date); end.setDate(end.getDate() + Math.ceil(applied));
    const eStr = end.toISOString().slice(0, 10).replace(/-/g, "");
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(title)}&dates=${d}/${eStr}` +
      `&details=${encodeURIComponent("Days: " + applied)}&trp=false`,
      "_blank"
    );
  }
}
