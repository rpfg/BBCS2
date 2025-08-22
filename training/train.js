/* ============================= */
/* ===== Training Page Script === */
/* ============================= */

const SHEET_ID = "1KppoRCoQvfQ6UoxjggeodS-qjl3jIY5dLaonRhvo1e0";
const API_KEY = "AIzaSyBGKe-HWRSjETakWez_QDuxWFCmeulQgEk";

/* ===== Generate Submenu ===== */
async function getSheetNames() {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`);
    const data = await res.json();
    return data.sheets.map(sheet => sheet.properties.title);
  } catch (err) {
    console.error("Error fetching sheets:", err);
    return [];
  }
}

async function generateSubmenu() {
  const submenu = document.getElementById("training-submenu");
  const ul = document.createElement("ul");
  const sheetNames = await getSheetNames();

  sheetNames.forEach(race => {
    const li = document.createElement("li");
    li.id = race;
    li.innerText = race;
    li.onclick = () => loadSheet(race);
    ul.appendChild(li);
  });

  submenu.appendChild(ul);
  return sheetNames;
}

/* ===== Highlight Active Race ===== */
function setActiveRace(raceId) {
  const items = document.querySelectorAll("#training-submenu li");
  items.forEach(item => {
    item.classList.toggle("active", item.id === raceId);
  });
}

/* ===== Load Sheet Data ===== */
async function loadSheet(raceId) {
  const detailsWrapper = document.getElementById("race-details-wrapper");
  const table = document.getElementById("race-table");
  const tableHead = table.querySelector("thead");
  const tableBody = table.querySelector("tbody");

  tableHead?.remove();
  tableBody.innerHTML = "";
  detailsWrapper.innerHTML = "";

  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${raceId}?key=${API_KEY}`);
    const data = await res.json();
    if (!data.values) {
      tableBody.innerHTML = "<tr><td colspan='4'>No data found</td></tr>";
      return;
    }

    /* ----- Race Details Table ----- */
    const detailsRowIndex = data.values.findIndex(row => row.includes("Race Details"));
    if (detailsRowIndex !== -1) {
      const colIndex = data.values[detailsRowIndex].indexOf("Race Details");
      let detailsTable = `<table class="race-details"><tr><th colspan="2" style="text-align:left">${data.values[detailsRowIndex][colIndex]}</th></tr>`;

      for (let r = detailsRowIndex + 1; r < data.values.length; r++) {
        const row = data.values[r] || [];
        const left = row[colIndex] || "";
        const right = row[colIndex + 1] || "";
        if (left === "" && right === "") continue;
        detailsTable += `<tr><td>${left}</td><td>${right}</td></tr>`;
      }

      detailsTable += "</table>";
      detailsWrapper.innerHTML = detailsTable;
    }

    /* ----- Race Results Table with Pagination ----- */
    const headerIndex = data.values.findIndex(row => row[0] === "Rank");
    if (headerIndex === -1) return;

    const headerRow = data.values[headerIndex].slice(0, 4);
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    headerRow.forEach(h => {
      const th = document.createElement("th");
      th.innerText = h || "";
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.prepend(thead);

    // Store all rows for pagination
    allRows = data.values.slice(headerIndex + 1)
                        .filter(row => row.slice(0, 4).some(cell => cell))
                        .map(row => row.slice(0, 4));
    currentPage = 1;
    renderTablePage(allRows, currentPage);

    setActiveRace(raceId);
  } catch (err) {
    tableBody.innerHTML = "<tr><td colspan='4'>Error loading data</td></tr>";
    console.error(err);
  }
}


/* ===== Search & Highlight ===== */
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

/* ===== Initialize Training Page ===== */
document.addEventListener("DOMContentLoaded", async () => {
  const sheetNames = await generateSubmenu();
  if (sheetNames.length) loadSheet(sheetNames[0]);
  setupSearch();
});


let allRows = []; // all data rows (excluding header)
let currentPage = 1;
const rowsPerPage = 50;

// Render a specific page
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

// Setup pagination buttons
function setupPagination(rows, activePage) {
  const wrapper = document.getElementById("pagination-wrapper");
  wrapper.innerHTML = "";
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  if (totalPages <= 1) return;

  const maxVisible = 5; // max pages in sliding window

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.innerText = "<";
  prevBtn.disabled = activePage === 1;
  prevBtn.onclick = () => { currentPage--; renderTablePage(allRows, currentPage); };
  wrapper.appendChild(prevBtn);

  const pages = [];
  pages.push(1); // always show first page

  // Sliding window
  let start = Math.max(2, activePage - 2);
  let end = Math.min(totalPages - 1, activePage + 2);

  // Adjust window if near start or end
  if (activePage <= 3) end = Math.min(totalPages - 1, 5);
  if (activePage >= totalPages - 2) start = Math.max(2, totalPages - 4);

  if (start > 2) pages.push("..."); // left ellipsis

  for (let i = start; i <= end; i++) pages.push(i);

  if (end < totalPages - 1) pages.push("..."); // right ellipsis

  if (totalPages > 1) pages.push(totalPages); // always show last page

  // Render page buttons
  pages.forEach(p => {
    const btn = document.createElement("button");
    btn.innerText = p;
    if (p === activePage) btn.classList.add("active");
    if (p !== "...") {
      btn.onclick = () => { currentPage = p; renderTablePage(allRows, currentPage); };
    } else {
      btn.disabled = true;
      btn.style.cursor = "default";
      btn.style.background = "transparent";
      btn.style.border = "none";
      btn.style.color = "#666";
    }
    wrapper.appendChild(btn);
  });

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.innerText = ">";
  nextBtn.disabled = activePage === totalPages;
  nextBtn.onclick = () => { currentPage++; renderTablePage(allRows, currentPage); };
  wrapper.appendChild(nextBtn);
}

