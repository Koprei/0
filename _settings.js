// ─────────────────────────────────────────────────────────────
//  _settings.js  —  Settings screen logic
//  Edit this file to change connection settings behaviour.
//  Depends on: _app.js  (gsFetch, toast, GS_URL)
// ─────────────────────────────────────────────────────────────

function saveSettings() {
  toast("URL is pre-configured", "ok");
}

async function testConn() {
  document.getElementById("connDot").style.background = "var(--amber)";
  document.getElementById("connLabel").textContent = "Testing…";
  try {
    const data = await gsFetch({ action:"read", sheet:"Annual Leave" });
    if (data.entries || data.rows) {
      document.getElementById("connDot").style.background = "var(--green)";
      document.getElementById("connLabel").textContent = "Connected ✓";
      toast("Connection OK", "ok");
    } else throw new Error("No data returned");
  } catch(e) {
    document.getElementById("connDot").style.background = "var(--red)";
    document.getElementById("connLabel").textContent = "Failed: " + e.message;
    toast("Connection failed", "err");
  }
}
