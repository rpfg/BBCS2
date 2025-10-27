// =============================
// ===== Funrace Page Script ====
// =============================

// ---------- Constants & Globals ----------
const SHEET_ID = "1_dOyGKf8mrPJJlqGWWRU8B_TObvE5o-wuf3OqErAz4o";
const API_KEY = "AIzaSyBGKe-HWRSjETakWez_QDuxWFCmeulQgEk";
const funraceSheets = ["FUNRACE1", "FUNRACE2"]; // Removed FUNRACE3

let allRows = [];
let currentPage = 1;
const rowsPerPage = 50;

// DOM Elements (guarded)
const search = document.querySelector('.search-container') || null;
const lapWinners = document.getElementById('lap-winners-wrapper') || null;
const raceSection = document.querySelector('.race-section') || null;
const raceTable = document.getElementById("race-table") || null;
const paginationWrapper = document.getElementById("pagination-wrapper") || null;

// ---------------- Funrace 1 Bracket Mapping ----------------
const funrace1Mapping = {
  "Central": { sheet: "FUNRACE1", startCol: 1, endCol: 11 },   // A–K
  "Bracket 1": { sheet: "FR1BRACKET", startCol: 1, endCol: 11 },   // A–K
  "Bracket 2": { sheet: "FR1BRACKET", startCol: 13, endCol: 23 },  // M–W
  "Bracket 3": { sheet: "FR1BRACKET", startCol: 25, endCol: 35 },  // Y–AI
  "Bracket 4": { sheet: "FR1BRACKET", startCol: 37, endCol: 47 },  // AK–AU
  "Bracket 5": { sheet: "FR1BRACKET", startCol: 49, endCol: 59 }   // AW–BG
};


// =============================
// ===== Submenu Functions =====
// =============================
function generateSubmenu() {
  const submenuEl = document.getElementById("funrace-submenu");
  if (!submenuEl) return;
  const ul = submenuEl.querySelector("ul");
  if (!ul) return;
  ul.innerHTML = "";
  funraceSheets.forEach(sheet => {
    const li = document.createElement("li");
    li.innerText = sheet.replace("FUNRACE", "Funrace ");
    li.id = sheet;
    li.onclick = () => loadSheet(sheet);
    ul.appendChild(li);
  });
}

function setActiveRace(raceId) {
  const items = document.querySelectorAll("#funrace-submenu li");
  items.forEach(item => {
    item.classList.toggle("active", item.id === raceId);
  });
}

// =============================
// ===== Data Load Functions ====
// =============================
let funrace1Data = null; // raw values array

async function loadSheet(sheetName) {
  if (!raceTable) return;
  const tbody = raceTable.querySelector("tbody");
  const thead = raceTable.querySelector("thead");
  const lapWrapper = document.getElementById("lap-winners-wrapper");

  if (tbody) tbody.innerHTML = "";
  if (thead) thead.innerHTML = "";
  if (lapWrapper) lapWrapper.innerHTML = "";

  try {
    let values;

    if (sheetName === "FUNRACE1") {
      if (!funrace1Data) {
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/FUNRACE1?key=${API_KEY}`);
        const data = await res.json();
        if (!data || !data.values) throw new Error("FUNRACE1 returned no values");
        funrace1Data = data.values;
      }
      values = funrace1Data;

      generateFunrace1Submenu();
      buildLapWinnersTable(values);
      renderBracket("Central");
    } else {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`);
      const data = await res.json();
      if (!data || !data.values) {
        if (tbody) tbody.innerHTML = "<tr><td colspan='12'>No data found</td></tr>";
        setActiveRace(sheetName);
        return;
      }
      values = data.values;
      clearFunrace1Submenu();
      buildLapWinnersTable(values);
      buildRaceTable(values, raceTable);
    }

    setActiveRace(sheetName);
  } catch (err) {
    if (raceTable?.querySelector("tbody")) {
      raceTable.querySelector("tbody").innerHTML = "<tr><td colspan='12'>Error loading data</td></tr>";
    }
    console.error("Error loading sheet", sheetName, err);
  }
}

// Render brackets from cached FUNRACE1
function renderBracket(name) {
  if (!Array.isArray(funrace1Data)) return;
  const info = funrace1Mapping[name];
  if (!info) return;

  if (!raceTable) return;
  const tbody = raceTable.querySelector("tbody");
  const thead = raceTable.querySelector("thead");
  if (tbody) tbody.innerHTML = "";
  if (thead) thead.innerHTML = "";

  let rows = funrace1Data.slice();
  if (info.startCol && info.endCol) {
    const headerRowFull = rows[0] || [];
    const headerRow = headerRowFull.slice(info.startCol - 1, info.endCol);
    const trHead = document.createElement("tr");
    headerRow.forEach(h => {
      const th = document.createElement("th");
      th.innerText = h || "";
      trHead.appendChild(th);
    });
    if (thead) thead.appendChild(trHead);

    rows = rows.slice(1).map(r => r.slice(info.startCol - 1, info.endCol))
               .filter(r => r.some(cell => cell && cell.toString().trim() !== ""));
  } else {
    // fallback for Central
    const headerRow = rows[0];
    const trHead = document.createElement("tr");
    headerRow.forEach(h => {
      const th = document.createElement("th");
      th.innerText = h || "";
      trHead.appendChild(th);
    });
    if (thead) thead.appendChild(trHead);
    rows = rows.slice(1);
  }

  allRows = rows;
  currentPage = 1;
  renderTablePage(allRows, currentPage);
  setActiveBracket(name);
}

// ----------------- Lap Winners Table -----------------
function buildLapWinnersTable(values) {
  const wrapper = document.getElementById("lap-winners-wrapper");
  if (!wrapper || !Array.isArray(values)) return;

  const tableData = values.map(row => {
    const r = Array.isArray(row) ? row : [];
    return [r[17] || "", r[18] || "", r[19] || "", r[20] || ""];
  }).filter(r => r.some(c => c));

  if (!tableData.length) {
    wrapper.innerHTML = "";
    return;
  }

  let html = `<table class="lap-winners"><thead><tr><th colspan="4">${tableData[0][0] || "Lap Winners"}</th></tr></thead><tbody>`;
  for (let i = 1; i < tableData.length; i++) {
    html += "<tr>";
    tableData[i].forEach(cell => html += `<td>${cell}</td>`);
    html += "</tr>";
  }
  html += "</tbody></table>";
  wrapper.innerHTML = html;
}

// ----------------- Race Results Table -----------------
function buildRaceTable(values, table) {
  if (!Array.isArray(values) || !table) return;
  const headerIndex = values.findIndex(row => Array.isArray(row) && row[0] === "Rank");
  if (headerIndex === -1) return;

  const headerRow = (values[headerIndex] || []).slice(0, 12);
  const theadEl = document.createElement("thead");
  const trHead = document.createElement("tr");
  headerRow.forEach(h => {
    const th = document.createElement("th");
    th.innerText = h || "";
    trHead.appendChild(th);
  });
  theadEl.appendChild(trHead);
  const existingThead = table.querySelector("thead");
  if (existingThead) existingThead.remove();
  table.prepend(theadEl);

  allRows = values.slice(headerIndex + 1)
    .filter(r => Array.isArray(r) && r.slice(0, 12).some(c => c))
    .map(r => r.slice(0, 12));
  currentPage = 1;
  renderTablePage(allRows, currentPage);
}

// =============================
// ===== Table Rendering & Pagination ====
// =============================
function renderTablePage(rows, page) {
  if (!raceTable) return;
  const tbody = raceTable.querySelector("tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = Math.min(start + rowsPerPage, rows.length);
  const pageRows = rows.slice(start, end);

  pageRows.forEach(row => {
    const tr = document.createElement("tr");
    (Array.isArray(row) ? row : []).forEach(cell => {
      const td = document.createElement("td");
      td.innerText = cell || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  setupPagination(rows, page);
}

function setupPagination(rows, activePage) {
  if (!paginationWrapper) return;
  paginationWrapper.innerHTML = "";
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.innerText = "<";
  prevBtn.disabled = activePage === 1;
  prevBtn.onclick = () => {
    currentPage = Math.max(1, currentPage - 1);
    renderTablePage(allRows, currentPage);
  };
  paginationWrapper.appendChild(prevBtn);

  const pages = [];
  pages.push(1);
  let start = Math.max(2, activePage - 2);
  let end = Math.min(totalPages - 1, activePage + 2);
  if (activePage <= 3) end = Math.min(totalPages - 1, 5);
  if (activePage >= totalPages - 2) start = Math.max(2, totalPages - 4);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  pages.forEach(p => {
    const btn = document.createElement("button");
    btn.innerText = p;
    if (p === activePage) btn.classList.add("active");
    if (p !== "...") btn.onclick = () => {
      currentPage = p;
      renderTablePage(allRows, currentPage);
    };
    else {
      btn.disabled = true;
      btn.style.cursor = "default";
      btn.style.background = "transparent";
      btn.style.border = "none";
      btn.style.color = "#666";
    }
    paginationWrapper.appendChild(btn);
  });

  const nextBtn = document.createElement("button");
  nextBtn.innerText = ">";
  nextBtn.disabled = activePage === totalPages;
  nextBtn.onclick = () => {
    currentPage = Math.min(totalPages, currentPage + 1);
    renderTablePage(allRows, currentPage);
  };
  paginationWrapper.appendChild(nextBtn);
}

// =============================
// ===== Universal Search =====
// =============================
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const filteredRows = allRows.filter(row =>
      Array.isArray(row) && row.some(cell =>
        (cell || "").toString().toLowerCase().includes(filter)
      )
    );
    renderTablePage(filter ? filteredRows : allRows, 1);
    highlightSearch(filter);
  });

  if (clearSearch) {
    clearSearch.addEventListener("click", () => {
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input"));
    });
  }
}

// =============================
// ===== Highlight Function =====
// =============================
function highlightSearch(filter) {
  if (!filter || !raceTable) return;
  const rows = raceTable.querySelectorAll("tbody tr");
  const regex = new RegExp(`(${escapeRegExp(filter)})`, "gi");
  rows.forEach(row => {
    row.querySelectorAll("td").forEach(cell => {
      const text = cell.textContent;
      cell.innerHTML = text.replace(regex, `<span class="highlight">$1</span>`);
    });
  });
}
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// =============================
// ===== Responsive Search Box (Improved) ====
// =============================
function moveSearch() {
  if (!search || !raceSection) return;
  const raceTableWrapper = document.getElementById('race-table-wrapper');
  if (!raceTableWrapper) return;

  // ✅ Only move if not already placed correctly
  const currentParent = search.parentElement;
  if (currentParent !== raceSection) {
    raceSection.insertBefore(search, raceTableWrapper);
  }
}

// =============================
// ===== Funrace 1 Submenu Functions ====
// =============================
function generateFunrace1Submenu() {
  const container = document.getElementById("funrace1-submenu");
  if (!container) return;
  const submenu = container.querySelector("ul");
  if (!submenu) return;
  submenu.innerHTML = "";
  Object.keys(funrace1Mapping).forEach(name => {
    const li = document.createElement("li");
    li.innerText = name;
    li.onclick = () => filterBracket(name);
    submenu.appendChild(li);
  });
}

async function filterBracket(name) {
  const info = funrace1Mapping[name];
  if (!info) return;
  if (!raceTable) return;

  const tbody = raceTable.querySelector("tbody");
  const thead = raceTable.querySelector("thead");
  if (tbody) tbody.innerHTML = "";
  if (thead) thead.innerHTML = "";

  try {
    let dataValues;
    if (info.sheet === "FUNRACE1" && Array.isArray(funrace1Data)) {
      dataValues = funrace1Data;
    } else {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${info.sheet}?key=${API_KEY}`);
      const data = await res.json();
      if (!data || !data.values) {
        console.warn("No values for sheet", info.sheet);
        return;
      }
      dataValues = data.values;
    }

    // --- Header and Rows (Row 2 = header, Row 3+ = data) ---
    const headerRowFull = dataValues[1] || [];
    const headerRow = headerRowFull.slice((info.startCol || 1) - 1, info.endCol || headerRowFull.length);
    const trHead = document.createElement("tr");
    headerRow.forEach(h => {
      const th = document.createElement("th");
      th.innerText = h || "";
      trHead.appendChild(th);
    });
    if (thead) thead.appendChild(trHead);

    // Data rows start at row 3
    let rows = dataValues.slice(2).map(r => {
      const start = (info.startCol || 1) - 1;
      const end = info.endCol || r.length;
      return Array.isArray(r) ? r.slice(start, end) : [];
    }).filter(r => r.some(cell => cell && cell.toString().trim() !== ""));

    allRows = rows;
    currentPage = 1;
    renderTablePage(allRows, currentPage);
    setActiveBracket(name);
  } catch (err) {
    console.error("Error filtering bracket", name, err);
  }
}


function setActiveBracket(name) {
  const container = document.getElementById("funrace1-submenu");
  if (!container) return;
  container.querySelectorAll("li").forEach(li => {
    li.classList.toggle("active", li.innerText === name);
  });
}

function clearFunrace1Submenu() {
  const container = document.getElementById("funrace1-submenu");
  if (container) container.innerHTML = "";
}

// =============================
// ===== Initialization =====
// =============================
document.addEventListener("DOMContentLoaded", () => {
  generateSubmenu();
  loadSheet("FUNRACE1");
  setupSearch();
  moveSearch();
});

// ✅ Debounced resize handler (prevents mobile keyboard issues)
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // 🧠 Skip moveSearch if resize caused by soft keyboard
    const heightDiff = Math.abs(window.innerHeight - document.documentElement.clientHeight);
    if (heightDiff < 100) moveSearch();
  }, 250);
});

// Keep onload just for redundancy (once)
window.addEventListener('load', moveSearch);
