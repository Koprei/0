// ─────────────────────────────────────────────────────────────
//  _generic.js  —  Generic screen logic (Task, Finance, Health,
//                  Family, Study, Trip, Plans, Digi, Calendar, Contact)
//
//  To add a new section or change fields for an existing one,
//  edit ONLY the PAGE_CONFIG object below — nothing else needs
//  to change in index.html or any other file.
//
//  Depends on: _app.js  (gsFetch, toast, fmtDate, tod,
//               currentScreen, currentConfig, genericRows,
//               editSheet, closeSheetDirect)
// ─────────────────────────────────────────────────────────────

// ── SECTION DEFINITIONS ──────────────────────────────────────
// Each entry:  icon, sheet (GS tab name), label, cols (display columns),
//              fields: [ { t: type, n: name, o?: options[] } ]
const PAGE_CONFIG = {
  task: {
    icon:"✅", sheet:"Task", label:"Task",
    cols:["Title","Priority","Status","Due Date","Notes"],
    fields:[
      {t:"text",   n:"Title"},
      {t:"select", n:"Priority", o:["High","Medium","Low"]},
      {t:"select", n:"Status",   o:["Open","In Progress","Done","Cancelled"]},
      {t:"date",   n:"Due Date"},
      {t:"text",   n:"Notes"},
    ],
  },
  finance: {
    icon:"💰", sheet:"Finance", label:"Finance",
    cols:["Date","Category","Description","Amount","Type","Notes"],
    fields:[
      {t:"date",   n:"Date"},
      {t:"select", n:"Category",    o:["Income","Food","Transport","Utilities","Health","Entertainment","Other"]},
      {t:"text",   n:"Description"},
      {t:"number", n:"Amount"},
      {t:"select", n:"Type",        o:["Income","Expense"]},
      {t:"text",   n:"Notes"},
    ],
  },
  health: {
    icon:"❤️", sheet:"Health", label:"Health",
    cols:["Date","Type","Value","Unit","Notes"],
    fields:[
      {t:"date",   n:"Date"},
      {t:"select", n:"Type",  o:["Weight","Blood Pressure","Heart Rate","Steps","Sleep","Medication","Doctor Visit","Other"]},
      {t:"text",   n:"Value"},
      {t:"text",   n:"Unit"},
      {t:"text",   n:"Notes"},
    ],
  },
  family: {
    icon:"👨‍👩‍👧", sheet:"Family", label:"Family",
    cols:["Date","Member","Event","Description","Notes"],
    fields:[
      {t:"date",   n:"Date"},
      {t:"text",   n:"Member"},
      {t:"select", n:"Event",       o:["Birthday","Anniversary","Medical","School","Travel","Gathering","Other"]},
      {t:"text",   n:"Description"},
      {t:"text",   n:"Notes"},
    ],
  },
  study: {
    icon:"📚", sheet:"Study", label:"Study",
    cols:["Date","Course","Topic","Progress","Source","Notes"],
    fields:[
      {t:"date",   n:"Date"},
      {t:"text",   n:"Course"},
      {t:"text",   n:"Topic"},
      {t:"select", n:"Progress",    o:["Not Started","In Progress","Completed"]},
      {t:"text",   n:"Source"},
      {t:"text",   n:"Notes"},
    ],
  },
  trip: {
    icon:"✈️", sheet:"Trip Plans", label:"Trip Plans",
    cols:["Destination","Start Date","End Date","Status","Budget","Notes"],
    fields:[
      {t:"text",   n:"Destination"},
      {t:"date",   n:"Start Date"},
      {t:"date",   n:"End Date"},
      {t:"select", n:"Status",      o:["Planning","Confirmed","Completed","Cancelled"]},
      {t:"number", n:"Budget"},
      {t:"text",   n:"Notes"},
    ],
  },
  plans: {
    icon:"🎯", sheet:"Plans", label:"Plans",
    cols:["Title","Category","Target Date","Status","Priority","Notes"],
    fields:[
      {t:"text",   n:"Title"},
      {t:"select", n:"Category",    o:["Career","Health","Finance","Family","Personal","Education","Other"]},
      {t:"date",   n:"Target Date"},
      {t:"select", n:"Status",      o:["Active","On Hold","Completed","Cancelled"]},
      {t:"select", n:"Priority",    o:["High","Medium","Low"]},
      {t:"text",   n:"Notes"},
    ],
  },
  digi: {
    icon:"🔐", sheet:"Digi Asset", label:"Digi Asset",
    cols:["Name","Category","Account","Value","Notes"],
    fields:[
      {t:"text",   n:"Name"},
      {t:"select", n:"Category",    o:["Crypto","Investment","Domain","Subscription","Account","Software","Other"]},
      {t:"text",   n:"Account"},
      {t:"text",   n:"Value"},
      {t:"text",   n:"Notes"},
    ],
  },
  calendar: {
    icon:"📅", sheet:"Calendar", label:"Calendar",
    cols:["Date","Title","Type","Description","Notes"],
    fields:[
      {t:"date",   n:"Date"},
      {t:"text",   n:"Title"},
      {t:"select", n:"Type",        o:["Event","Reminder","Holiday","Birthday","Meeting","Other"]},
      {t:"text",   n:"Description"},
      {t:"text",   n:"Notes"},
    ],
  },
  contact: {
    icon:"👤", sheet:"Contact", label:"Contact",
    cols:["Name","Relationship","Phone","Email","Notes"],
    fields:[
      {t:"text",   n:"Name"},
      {t:"select", n:"Relationship",o:["Family","Friend","Colleague","Business","Other"]},
      {t:"text",   n:"Phone"},
      {t:"text",   n:"Email"},
      {t:"text",   n:"Notes"},
    ],
  },
};

// ── LOAD + RENDER ────────────────────────────────────────────
function loadGeneric(name) {
  const cfg = PAGE_CONFIG[name];
  if (!cfg) return;
  currentConfig = cfg;
  document.getElementById("genericTitle").textContent = cfg.icon + " " + cfg.label;

  // Build form fields — pair them side-by-side where possible
  let html = "";
  for (let i = 0; i < cfg.fields.length; i += 2) {
    const f1 = cfg.fields[i], f2 = cfg.fields[i + 1];
    html += f2
      ? `<div class="f-row">${makeField(f1,"f_")}${makeField(f2,"f_")}</div>`
      : makeField(f1, "f_");
  }
  document.getElementById("genericFields").innerHTML = html;
  cfg.fields.forEach(f => {
    if (f.t === "date") {
      const el = document.getElementById("f_" + f.n.replace(/ /g,"_"));
      if (el) el.value = tod();
    }
  });
  loadGenericData(name);
}

function makeField(f, prefix) {
  const id = prefix + f.n.replace(/ /g, "_");
  if (f.t === "select") {
    const opts = f.o.map(o => `<option>${o}</option>`).join("");
    return `<div class="f-field"><label>${f.n}</label><select id="${id}"><option value="">Select…</option>${opts}</select></div>`;
  }
  return `<div class="f-field"><label>${f.n}</label><input type="${f.t}" id="${id}" placeholder="${f.n}"/></div>`;
}

async function loadGenericData(name) {
  const cfg = PAGE_CONFIG[name];
  document.getElementById("genericList").innerHTML =
    '<div style="text-align:center;padding:2rem;color:var(--text3);font-size:13px">Loading…</div>';
  try {
    const data = await gsFetch({ action:"read", sheet:cfg.sheet });
    genericRows = data.entries || data.rows || [];
    renderGeneric(cfg);
  } catch(e) {
    document.getElementById("genericList").innerHTML =
      '<div style="text-align:center;padding:2rem;color:var(--red);font-size:13px">Could not load</div>';
    toast("Error: " + e.message, "err");
  }
}

function renderGeneric(cfg) {
  document.getElementById("gCount").textContent = genericRows.length + " entries";
  const list = document.getElementById("genericList");
  if (!genericRows.length) {
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text3);font-size:13px">No entries yet.</div>';
    return;
  }
  const titleCol = cfg.cols[0];
  const subCol   = cfg.cols[1] || "";
  const valCol   = cfg.cols[2] || "";
  // Store rows in a module-scoped snapshot so we can look up by index safely
  const snapshot = [...genericRows].reverse();
  list.innerHTML = snapshot.map((row, idx) => {
    return `<div class="entry-card" onclick="openGenericEdit(${idx})">
      <div class="entry-icon" style="font-size:22px;background:rgba(108,92,231,.2)">${cfg.icon}</div>
      <div class="entry-info">
        <div class="entry-title">${row[titleCol] || "–"}</div>
        <div class="entry-sub">${row[subCol] || ""}</div>
      </div>
      <div class="entry-right">
        <div class="entry-val" style="color:var(--text2);font-size:12px">${row[valCol] || ""}</div>
      </div>
    </div>`;
  }).join("");
  // Keep the snapshot accessible for openGenericEdit index lookup
  window._genericSnapshot = snapshot;
}

// ── ADD ──────────────────────────────────────────────────────
async function addGeneric() {
  const cfg = currentConfig;
  const params = { action:"add", sheet:cfg.sheet };
  cfg.fields.forEach(f => {
    const el = document.getElementById("f_" + f.n.replace(/ /g, "_"));
    params[f.n] = el ? el.value.trim() : "";
  });
  const btn = document.getElementById("gAddBtn");
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    const data = await gsFetch(params);
    if (data.error) throw new Error(data.error);
    toast("Saved ✓", "ok");
    cfg.fields.forEach(f => {
      const el = document.getElementById("f_" + f.n.replace(/ /g, "_"));
      if (el && f.t !== "date") el.value = "";
    });
    await loadGenericData(currentScreen);
  } catch(e) { toast("Error: " + e.message, "err"); }
  finally { btn.disabled = false; btn.textContent = "+ Add Entry"; }
}

// ── EDIT SHEET ───────────────────────────────────────────────
function openGenericEdit(idx) {
  const snapshot = window._genericSnapshot || [];
  const row = snapshot[idx];
  if (!row) return;

  editData  = row;
  editSheet = currentConfig.sheet;
  const cfg = currentConfig;
  const id  = row._id || row.id || row._rowIndex;

  document.getElementById("sheetTitle").textContent = "Edit " + cfg.label;
  let html = `<input type="hidden" id="sheetId" value="${id}"/>`;
  cfg.fields.forEach(f => {
    const fid = "s_" + f.n.replace(/ /g, "_");
    const val = row[f.n] || "";
    if (f.t === "select") {
      const opts = f.o.map(o => `<option ${val === o ? "selected" : ""}>${o}</option>`).join("");
      html += `<div class="f-field"><label>${f.n}</label><select id="${fid}"><option value="">Select…</option>${opts}</select></div>`;
    } else {
      html += `<div class="f-field"><label>${f.n}</label><input type="${f.t}" id="${fid}" value="${val}"/></div>`;
    }
  });
  document.getElementById("sheetBody").innerHTML = html;
  document.getElementById("editSheet").classList.add("open");
}

async function saveGenericEntry() {
  const id     = document.getElementById("sheetId").value;
  const cfg    = currentConfig;
  const params = { action:"update", sheet:editSheet, id };
  cfg.fields.forEach(f => {
    const el = document.getElementById("s_" + f.n.replace(/ /g, "_"));
    if (el) params[f.n] = el.value.trim();
  });
  try {
    const data = await gsFetch(params);
    if (data.error) throw new Error(data.error);
    toast("Updated ✓", "ok");
    closeSheetDirect();
    await loadGenericData(currentScreen);
  } catch(e) { toast("Error: " + e.message, "err"); }
}
