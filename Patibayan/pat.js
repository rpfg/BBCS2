// =============================
// ===== Patibayan Page Script ====
// =============================

// ---------- Constants & Globals ----------
const SHEET_ID = "1_dOyGKf8mrPJJlqGWWRU8B_TObvE5o-wuf3OqErAz4o";
const API_KEY = "AIzaSyBGKe-HWRSjETakWez_QDuxWFCmeulQgEk";
const patibayanSheets = ["PATIBAYAN1", "PATIBAYAN2"];

let allRows = [];
let currentPage = 1;
const rowsPerPage = 50;

// DOM Elements
const search = document.querySelector('.search-container');
const patibayanSection = document.getElementById("patibayan-section");

// =============================
// ===== Submenu Functions =====
function generateSubmenu() {
  const submenu = document.getElementById("patibayan-submenu").querySelector("ul");
  submenu.innerHTML = "";
  patibayanSheets.forEach(sheet => {
    const li = document.createElement("li");
    li.innerText = sheet.replace("PATIBAYAN", "Patibayan ");
    li.id = sheet;
    li.onclick = () => loadSheet(sheet);
    submenu.appendChild(li);
  });
}

function setActivePatibayan(sheetId) {
  document.querySelectorAll("#patibayan-submenu li").forEach(item => {
    item.classList.toggle("active", item.id === sheetId);
  });
}

// =============================
// ===== Data Load Functions ====
async function loadSheet(sheetName) {
  const table = document.getElementById("patibayan-table");
  const tbody = table.querySelector("tbody");
  const thead = table.querySelector("thead");

  tbody.innerHTML = "";
  thead.innerHTML = "";

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`);
    const data = await res.json();
    if (!data.values) {
      tbody.innerHTML = "<tr><td colspan='3'>No data found</td></tr>";
      return;
    }

    buildPatibayanTable(data.values);
    setActivePatibayan(sheetName);
  } catch (err) {
    tbody.innerHTML = "<tr><td colspan='3'>Error loading data</td></tr>";
    console.error(err);
  }
}

// ----------------- Patibayan Table -----------------
function buildPatibayanTable(values) {
  const table = document.getElementById("patibayan-table");
  const thead = table.querySelector("thead");

  // Use first row as header
  const headerRow = values[0].slice(0, 3);
  const trHead = document.createElement("tr");
  headerRow.forEach(h => {
    const th = document.createElement("th");
    th.innerText = h || "";
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);

  // Store all data rows
  allRows = values.slice(1).map(r => r.slice(0, 3));
  currentPage = 1;
  renderTablePage(allRows, currentPage);
}

// =============================
// ===== Table Rendering & Pagination ==== 
function renderTablePage(rows, page) {
  const tbody = document.querySelector("#patibayan-table tbody");
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

// ----------------- Pagination -----------------
function setupPagination(rows, activePage) {
  const wrapper = document.getElementById("pagination-wrapper");
  wrapper.innerHTML = "";
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  if (totalPages <= 1) return;

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.innerText = "<";
  prevBtn.disabled = activePage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    renderTablePage(getFilteredRows(), currentPage);
  };
  wrapper.appendChild(prevBtn);

  // Page number buttons
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    if (i === activePage) btn.classList.add("active");
    btn.onclick = () => {
      currentPage = i;
      renderTablePage(getFilteredRows(), currentPage);
    };
    wrapper.appendChild(btn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.innerText = ">";
  nextBtn.disabled = activePage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    renderTablePage(getFilteredRows(), currentPage);
  };
  wrapper.appendChild(nextBtn);
}

// =============================
// ===== Search & Highlight =====
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");

  let filteredRows = [...allRows];

  function applySearch() {
    const filter = searchInput.value.toLowerCase().trim();

    if (!filter) {
      filteredRows = [...allRows];
    } else {
      filteredRows = allRows.filter(row =>
        row.some(cell => (cell || "").toLowerCase().includes(filter))
      );
    }

    currentPage = 1;
    renderTablePage(filteredRows, currentPage);
    highlightMatches(filter);
  }

  function highlightMatches(filter) {
    if (!filter) return;
    const rows = document.querySelectorAll("#patibayan-table tbody tr");
    const regex = new RegExp(`(${filter})`, "gi");

    rows.forEach(row => {
      row.querySelectorAll("td").forEach(cell => {
        const text = cell.textContent;
        cell.innerHTML = text.replace(regex, `<span class="highlight">$1</span>`);
      });
    });
  }

  searchInput.addEventListener("input", applySearch);
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    applySearch();
  });

  // Expose for pagination to access
  window.getFilteredRows = () => filteredRows;
}

// =============================
// ===== Responsive Search Box ====
// =============================
function moveSearch() {
  const raceTableWrapper = document.getElementById('patibayan-table-wrapper');
  if (!search || !patibayanSection || !raceTableWrapper) return;

  const currentParent = search.parentElement;
  if (currentParent !== patibayanSection) {
    patibayanSection.insertBefore(search, raceTableWrapper);
  }
}

// =============================
// ===== Initialization =====
// =============================
document.addEventListener("DOMContentLoaded", () => {
  generateSubmenu();
  loadSheet("PATIBAYAN1");
  setupSearch();
  moveSearch();
});

// ✅ Debounced resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const heightDiff = Math.abs(window.innerHeight - document.documentElement.clientHeight);
    if (heightDiff < 100) moveSearch();
  }, 250);
});

window.addEventListener('load', moveSearch);
