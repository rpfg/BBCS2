// =============================
// ===== Derby Page Script =====
// =============================

// ---------- Constants & Globals ----------
const SHEET_ID = "1_dOyGKf8mrPJJlqGWWRU8B_TObvE5o-wuf3OqErAz4o";
const API_KEY = "AIzaSyBGKe-HWRSjETakWez_QDuxWFCmeulQgEk";
const derbySheet = "DERBY";

let allRows = [];
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
  const detailsWrapper = document.getElementById("race-details-wrapper");
  const lapWrapper = document.getElementById("lap-winners-wrapper");

  tbody.innerHTML = "";
  detailsWrapper.innerHTML = "";
  lapWrapper.innerHTML = "";
  thead.innerHTML = "";

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`);
    const data = await res.json();
    if (!data.values) { 
      tbody.innerHTML = "<tr><td colspan='12'>No data found</td></tr>"; 
      return; 
    }

    buildRaceDetails(data.values, detailsWrapper);
    buildLapWinnersTable(data.values);
    buildRaceTable(data.values, table);

  } catch(err) {
    tbody.innerHTML = "<tr><td colspan='12'>Error loading data</td></tr>";
    console.error(err);
  }
}

// ----------------- Race Details Table -----------------
function buildRaceDetails(values, wrapper) {
  const detailsRowIndex = values.findIndex(row => row.includes("Race Details"));
  if (detailsRowIndex === -1) return;

  const colIndex = values[detailsRowIndex].indexOf("Race Details");
  let html = `<table class="race-details"><tr><th colspan="2">${values[detailsRowIndex][colIndex]}</th></tr>`;

  for (let r = detailsRowIndex + 1; r < values.length; r++) {
    const row = values[r] || [];
    const left = row[22] || "";  // Column W
    const right = row[23] || ""; // Column X
    if (left === "" && right === "") continue;
    html += `<tr><td>${left}</td><td>${right}</td></tr>`;
  }
  html += "</table>";
  wrapper.innerHTML = html;
}

// ----------------- Lap Winners Table -----------------
function buildLapWinnersTable(values) {
  const wrapper = document.getElementById("lap-winners-wrapper");
  
  // Columns S (18) to V (21) → 4 columns
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

  currentPage = 1;
  renderTablePage(allRows, currentPage);
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

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.innerText = "<";
  prevBtn.disabled = activePage === 1;
  prevBtn.onclick = () => { currentPage--; renderTablePage(allRows, currentPage); };
  wrapper.appendChild(prevBtn);

  // Determine visible pages (max 5)
  let startPage = Math.max(1, activePage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  if (startPage > 1) {
    const first = document.createElement("button");
    first.innerText = "1";
    first.onclick = () => { currentPage = 1; renderTablePage(allRows, currentPage); };
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
    btn.onclick = () => { currentPage = i; renderTablePage(allRows, currentPage); };
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
    last.onclick = () => { currentPage = totalPages; renderTablePage(allRows, currentPage); };
    wrapper.appendChild(last);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.innerText = ">";
  nextBtn.disabled = activePage === totalPages;
  nextBtn.onclick = () => { currentPage++; renderTablePage(allRows, currentPage); };
  wrapper.appendChild(nextBtn);
}

// =============================
// ===== Search & Highlight =====
// =============================
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");

  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const table = document.getElementById("race-table");
    if (!table) return;
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach(row => {
      let rowMatch = false;
      row.querySelectorAll("td").forEach(cell => {
        cell.innerHTML = cell.textContent;
        if (filter && cell.textContent.toLowerCase().includes(filter)) {
          const regex = new RegExp(`(${filter})`, "gi");
          cell.innerHTML = cell.textContent.replace(regex, `<span class="highlight">$1</span>`);
          rowMatch = true;
        }
      });
      row.style.display = rowMatch || !filter ? "" : "none";
    });
  });

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.dispatchEvent(new Event("input"));
  });
}

// =============================
// ===== Responsive Search Box ====
// =============================
function moveSearch() {
  const raceDetails = document.getElementById('race-details-wrapper');
  const raceTable = document.getElementById('race-table-wrapper');

  if (window.innerWidth <= 768) {
    raceSection.insertBefore(search, raceTable);
  } else {
    raceDetails.parentNode.insertBefore(search, raceDetails.nextSibling);
  }
}

// =============================
// ===== Initialization =====
// =============================
document.addEventListener("DOMContentLoaded", () => {
  loadSheet(derbySheet);
  setupSearch();
  moveSearch();
});

window.addEventListener('resize', moveSearch);
window.addEventListener('load', moveSearch);
