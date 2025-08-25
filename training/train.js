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
    li.onclick = () => loadSheetWithBrackets(race);
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

/* ===== Bracket Tables and Race Details ===== */
const bracketRanges = {
  1: {startRow: 2, endRow: 13, startCol: 0, endCol: 4},   // A2:E13
  2: {startRow: 2, endRow: 13, startCol: 6, endCol: 10},  // G2:K13
  3: {startRow: 17, endRow: 28, startCol: 0, endCol: 4},  // A17:E28
  4: {startRow: 17, endRow: 28, startCol: 6, endCol: 10}, // G17:K28
  5: {startRow: 32, endRow: 43, startCol: 0, endCol: 4},  // A32:E43
};

const raceDetailRange = {startRow: 2, endRow: 9, startCol: 13, endCol: 14}; // N2:O9
let sheetData = [];

// Populate race details table
function populateRaceDetails() {
  const detailsWrapper = document.getElementById("race-details-wrapper");
  const table = document.createElement("table");
  table.classList.add("race-details");

  // Create thead for header (first row of N2:O9)
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");

  for (let c = raceDetailRange.startCol; c <= raceDetailRange.endCol; c++) {
    const th = document.createElement("th");
    th.innerText = (sheetData[raceDetailRange.startRow - 1] && sheetData[raceDetailRange.startRow - 1][c]) || "";
    trHead.appendChild(th);
  }

  thead.appendChild(trHead);
  table.appendChild(thead);

  // Create tbody for the rest of the rows
  const tbody = document.createElement("tbody");
  for (let r = raceDetailRange.startRow; r < raceDetailRange.endRow; r++) {
    const tr = document.createElement("tr");
    for (let c = raceDetailRange.startCol; c <= raceDetailRange.endCol; c++) {
      const td = document.createElement("td");
      td.innerText = (sheetData[r] && sheetData[r][c]) || "";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  detailsWrapper.innerHTML = "";
  detailsWrapper.appendChild(table);
}


// Populate a specific bracket table
function populateBracket(bracketNum) {
  const range = bracketRanges[bracketNum];
  const table = document.getElementById(`bracket-${bracketNum}`);
  table.innerHTML = "";

  // Create thead
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");

  // Assuming first row of range is header
  for (let c = range.startCol; c <= range.endCol; c++) {
    const th = document.createElement("th");
    th.innerText = (sheetData[range.startRow - 1] && sheetData[range.startRow - 1][c]) || "";
    trHead.appendChild(th);
  }
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Create tbody for the rest of the rows
  const tbody = document.createElement("tbody");
  for (let r = range.startRow; r < range.endRow; r++) {
    const tr = document.createElement("tr");
    for (let c = range.startCol; c <= range.endCol; c++) {
      const td = document.createElement("td");
      td.innerText = (sheetData[r] && sheetData[r][c]) || "";
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
}



// Show only one bracket at a time
function showBracket(bracketNum) {
  for (let i = 1; i <= 5; i++) {
    const table = document.getElementById(`bracket-${i}`);
    table.style.display = i === bracketNum ? "" : "none";
  }

  const items = document.querySelectorAll("#bracket-submenu li");
  items.forEach(item => {
    item.classList.toggle("active", Number(item.dataset.bracket) === bracketNum);
  });
}

// Setup bracket submenu clicks
function setupBracketSubmenu() {
  const submenu = document.getElementById("bracket-submenu");
  if (!submenu) return;

  const items = submenu.querySelectorAll("li");
  items.forEach(item => {
    item.addEventListener("click", () => {
      const bracketNum = Number(item.dataset.bracket);
      populateBracket(bracketNum); // fill table data
      showBracket(bracketNum);     // show the selected table
    });
  });
}


// Load sheet data including brackets
async function loadSheetWithBrackets(raceId) {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${raceId}?key=${API_KEY}`);
    const data = await res.json();
    sheetData = data.values || [];

    populateRaceDetails();
    setupBracketSubmenu();
    populateBracket(1);
    showBracket(1);
    setActiveRace(raceId);
  } catch (err) {
    console.error("Error loading sheet for brackets:", err);
  }
}

/* ===== Initialize Training Page ===== */
document.addEventListener("DOMContentLoaded", async () => {
  const sheetNames = await generateSubmenu();
  if (sheetNames.length) loadSheetWithBrackets(sheetNames[0]);
});
