// =============================
// ===== Derby Page Script =====
// =============================

// ---------- Constants & Globals ----------
const SHEET_ID = "1_dOyGKf8mrPJJlqGWWRU8B_TObvE5o-wuf3OqErAz4o";
const API_KEY = "AIzaSyBGKe-HWRSjETakWez_QDuxWFCmeulQgEk";
let currentSheet = "OB"; // default to Old Bird

let allRows = [];
let filteredRows = [];
let currentPage = 1;
const rowsPerPage = 50;

// DOM Elements
const search = document.querySelector('.search-container');
const lapWinners = document.getElementById('lap-winners-wrapper');
const raceSection = document.querySelector('.race-section');

// =============================
// ===== Data Load Functions ====
// =============================
async function loadSheet(sheetName) {
  const table = document.getElementById("race-table");
  const tbody = table.querySelector("tbody");
  const thead = table.querySelector("thead");
  const lapWrapper = document.getElementById("lap-winners-wrapper");

  tbody.innerHTML = "";
  lapWrapper.innerHTML = "";
  thead.innerHTML = "";

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`);
    const data = await res.json();
    if (!data.values) { 
      tbody.innerHTML = "<tr><td colspan='12'>No data found</td></tr>"; 
      return; 
    }

    buildLapWinnersTable(data.values);
    buildRaceTable(data.values, table);

  } catch(err) {
    tbody.innerHTML = "<tr><td colspan='12'>Error loading data</td></tr>";
    console.error(err);
  }
}

// ----------------- Lap Winners Table -----------------
function buildLapWinnersTable(values) {
  const wrapper = document.getElementById("lap-winners-wrapper");
  
  const tableData = values.map(row => [row[18]||"", row[19]||"", row[20]||"", row[21]||""])
                          .filter(r => r.some(c => c));
  
  if (!tableData.length) { 
    wrapper.innerHTML = ""; 
    return; 
  }

  let html = `<table class="lap-winners"><thead><tr><th colspan="4">${tableData[0][0] || "Lap Winners"}</th></tr></thead><tbody>`;
  for (let i = 1; i < tableData.length; i++) {
    html += `<tr>`;
    tableData[i].forEach(cell => html += `<td>${cell}</td>`);
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  wrapper.innerHTML = html;
}

// ----------------- Race Results Table -----------------
function buildRaceTable(values, table) {
  const headerIndex = values.findIndex(row => row[0] === "Rank");
  if (headerIndex === -1) return;

  const headerRow = values[headerIndex].slice(0,12);
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
                  .map(r => r.slice(0,12))
                  .filter(r => r.some(c => c && c.toString().trim() !== ""));
  filteredRows = [...allRows];

  currentPage = 1;
  renderTablePage(filteredRows, currentPage);
}

// =============================
// ===== Table Rendering & Pagination ====
// =============================
function renderTablePage(rows, page) {
  const table = document.getElementById("race-table");
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = Math.min(start + rowsPerPage, rows.length);
  const pageRows = rows.slice(start, end);

  pageRows.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.innerText = cell || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  setupPagination(rows, page);
}

function setupPagination(rows, activePage) {
  const wrapper = document.getElementById("pagination-wrapper");
  wrapper.innerHTML = "";
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.innerText = "<";
  prevBtn.disabled = activePage === 1;
  prevBtn.onclick = () => { currentPage--; renderTablePage(filteredRows, currentPage); };
  wrapper.appendChild(prevBtn);

  let startPage = Math.max(1, activePage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  if (startPage > 1) {
    const first = document.createElement("button");
    first.innerText = "1";
    first.onclick = () => { currentPage = 1; renderTablePage(filteredRows, currentPage); };
    wrapper.appendChild(first);

    if (startPage > 2) {
      const dots = document.createElement("span");
      dots.innerText = "...";
      wrapper.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    if (i === activePage) btn.classList.add("active");
    btn.onclick = () => { currentPage = i; renderTablePage(filteredRows, currentPage); };
    wrapper.appendChild(btn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("span");
      dots.innerText = "...";
      wrapper.appendChild(dots);
    }
    const last = document.createElement("button");
    last.innerText = totalPages;
    last.onclick = () => { currentPage = totalPages; renderTablePage(filteredRows, currentPage); };
    wrapper.appendChild(last);
  }

  const nextBtn = document.createElement("button");
  nextBtn.innerText = ">";
  nextBtn.disabled = activePage === totalPages;
  nextBtn.onclick = () => { currentPage++; renderTablePage(filteredRows, currentPage); };
  wrapper.appendChild(nextBtn);
}

// =============================
// ===== Universal Search =====
// =============================
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");

  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();

    filteredRows = allRows.filter(row =>
      row.some(cell => cell && cell.toString().toLowerCase().includes(filter))
    );

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
// ===== Derby Submenu (OB/YB) =====
// =============================
function setupDerbyMenu() {
  const menu = document.getElementById("derby-menu");
  if (!menu) return;

  menu.innerHTML = `
    <button id="btnOB" class="active">Old Bird</button>
    <button id="btnYB">Young Bird</button>
  `;

  const btnOB = document.getElementById("btnOB");
  const btnYB = document.getElementById("btnYB");

  btnOB.onclick = () => {
    btnOB.classList.add("active");
    btnYB.classList.remove("active");
    currentSheet = "OB";
    loadSheet(currentSheet);
  };

  btnYB.onclick = () => {
    btnYB.classList.add("active");
    btnOB.classList.remove("active");
    currentSheet = "YB";
    loadSheet(currentSheet);
  };
}

// =============================
// ===== Responsive Search Box ====
// =============================
function moveSearch() {
  const raceTable = document.getElementById('race-table-wrapper');

  if (window.innerWidth <= 768) {
    raceSection.insertBefore(search, raceTable);
  } else {
    raceSection.insertBefore(search, raceTable);
  }
}

// =============================
// ===== Initialization =====
// =============================
document.addEventListener("DOMContentLoaded", () => {
  setupDerbyMenu();
  loadSheet(currentSheet);
  setupSearch();
  moveSearch();
});

window.addEventListener('resize', moveSearch);
window.addEventListener('load', moveSearch);
