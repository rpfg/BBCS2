// =============================
// ===== Other Races Script =====
// =============================

const SHEET_ID = "1_dOyGKf8mrPJJlqGWWRU8B_TObvE5o-wuf3OqErAz4o";
const API_KEY = "AIzaSyBGKe-HWRSjETakWez_QDuxWFCmeulQgEk";

let currentSheet = "2K"; // default sheet
let allRows = [];
let filteredRows = [];
let currentPage = 1;
const rowsPerPage = 50;

// =============================
// ===== Load Sheet =====
// =============================
async function loadSheetWithRange(sheetName, colRange) {
  const table = document.getElementById("race-table");
  const tbody = table.querySelector("tbody");
  const thead = table.querySelector("thead");

  tbody.innerHTML = "";
  thead.innerHTML = "";

  try {
    const range = `${sheetName}!${colRange}`;
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`);
    const data = await res.json();

    if (!data.values) {
      tbody.innerHTML = "<tr><td colspan='12'>No data found</td></tr>";
      return;
    }

    buildRaceTable(data.values, table);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='12'>Error loading data</td></tr>";
  }
}

// =============================
// ===== Build Table =====
// =============================
function buildRaceTable(values, table) {
  const headerIndex = values.findIndex(row => row[0] === "Rank");
  if (headerIndex === -1) return;

  const colEnd = 12; // A–L
  const headerRow = values[headerIndex].slice(0, colEnd);

  const theadEl = document.createElement("thead");
  const trHead = document.createElement("tr");
  headerRow.forEach(h => {
    const th = document.createElement("th");
    th.innerText = h || "";
    trHead.appendChild(th);
  });
  theadEl.appendChild(trHead);
  table.prepend(theadEl);

  allRows = values.slice(headerIndex + 1)
    .map(r => r.slice(0, colEnd))
    .filter(r => r.some(c => c && c.trim() !== ""));
  filteredRows = [...allRows];
  currentPage = 1;
  renderTablePage(filteredRows, currentPage);
}

// =============================
// ===== Pagination =====
// =============================
function renderTablePage(rows, page) {
  const table = document.getElementById("race-table");
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = Math.min(start + rowsPerPage, rows.length);
  const pageRows = rows.slice(start, end);

  const expectedCols = table.querySelectorAll("thead th").length;

  pageRows.forEach(row => {
    const tr = document.createElement("tr");
    for (let i = 0; i < expectedCols; i++) {
      const td = document.createElement("td");
      td.innerText = row[i] || "";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });

  setupPagination(rows, page);
}

function setupPagination(rows, activePage) {
  const wrapper = document.getElementById("pagination-wrapper");
  wrapper.innerHTML = "";
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  if (totalPages <= 1) return;

  const prev = document.createElement("button");
  prev.innerText = "<";
  prev.disabled = activePage === 1;
  prev.onclick = () => { currentPage--; renderTablePage(filteredRows, currentPage); };
  wrapper.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    if (i === activePage) btn.classList.add("active");
    btn.onclick = () => { currentPage = i; renderTablePage(filteredRows, currentPage); };
    wrapper.appendChild(btn);
  }

  const next = document.createElement("button");
  next.innerText = ">";
  next.disabled = activePage === totalPages;
  next.onclick = () => { currentPage++; renderTablePage(filteredRows, currentPage); };
  wrapper.appendChild(next);
}

// =============================
// ===== Search =====
// =============================
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");

  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    filteredRows = allRows.filter(row => row.some(cell => cell && cell.toLowerCase().includes(filter)));
    currentPage = 1;
    renderTablePage(filteredRows, currentPage);
  });

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    filteredRows = [...allRows];
    renderTablePage(filteredRows, 1);
  });
}

// =============================
// ===== Submenu (2K / OC / 5L / KO5L / KO4L / KO3L) =====
// =============================
function setupOtherMenu() {
  const menu = document.getElementById("derby-menu");
  if (!menu) return;

  menu.innerHTML = `
    <button id="btn2K" class="active">2K</button>
    <button id="btnOC">OC</button>
    <button id="btn5L">5L</button>
    <button id="btn5H">KO5L 5H</button>
    <button id="btn1K">KO5L 1K</button>
    <button id="btn4L">KO4LAPS</button>
    <button id="btn4H">KO4L 5H</button>
    <button id="btn4K">KO4L 1K</button>
    <button id="btn3L">KO 3LAPS</button>
    <button id="btn3H">KO3L 5H</button>
    <button id="btn3K">KO3L 1K</button>
  `;

  const btn2K = document.getElementById("btn2K");
  const btnOC = document.getElementById("btnOC");
  const btn5L = document.getElementById("btn5L");
  const btn5H = document.getElementById("btn5H");
  const btn1K = document.getElementById("btn1K");
  const btn4L = document.getElementById("btn4L");
  const btn4H = document.getElementById("btn4H");
  const btn4K = document.getElementById("btn4K");
  const btn3L = document.getElementById("btn3L");
  const btn3H = document.getElementById("btn3H");
  const btn3K = document.getElementById("btn3K");

  function setActive(button) {
    document.querySelectorAll("#derby-menu button").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
  }

  btn2K.onclick = () => {
    setActive(btn2K);
    currentSheet = "2K";
    loadSheetWithRange(currentSheet, "A:L");
  };

  btnOC.onclick = () => {
    setActive(btnOC);
    currentSheet = "OC";
    loadSheetWithRange(currentSheet, "A:L");
  };

  btn5L.onclick = () => {
    setActive(btn5L);
    currentSheet = "KO5L";
    loadSheetWithRange(currentSheet, "A:L");
  };

  btn5H.onclick = () => {
    setActive(btn5H);
    currentSheet = "KO5L5H";
    loadSheetWithRange(currentSheet, "A:K");
  };

  btn1K.onclick = () => {
    setActive(btn1K);
    currentSheet = "KO5L1K";
    loadSheetWithRange(currentSheet, "A:K");
  };

  // ===== KO4L Series (A–J columns) =====
  btn4L.onclick = () => {
    setActive(btn4L);
    currentSheet = "KO4L";
    loadSheetWithRange(currentSheet, "A:J");
  };

  btn4H.onclick = () => {
    setActive(btn4H);
    currentSheet = "KO4L5H";
    loadSheetWithRange(currentSheet, "A:J");
  };

  btn4K.onclick = () => {
    setActive(btn4K);
    currentSheet = "KO4L1K";
    loadSheetWithRange(currentSheet, "A:J");
  };

  // ===== KO3L Series (A–I columns) =====
  btn3L.onclick = () => {
    setActive(btn3L);
    currentSheet = "KO3L";
    loadSheetWithRange(currentSheet, "A:I");
  };

  btn3H.onclick = () => {
    setActive(btn3H);
    currentSheet = "KO3L5H";
    loadSheetWithRange(currentSheet, "A:I");
  };

  btn3K.onclick = () => {
    setActive(btn3K);
    currentSheet = "KO3L1K";
    loadSheetWithRange(currentSheet, "A:I");
  };
}

// =============================
// ===== Init =====
// =============================
document.addEventListener("DOMContentLoaded", () => {
  setupOtherMenu();
  loadSheetWithRange(currentSheet, "A:L");
  setupSearch();
});
