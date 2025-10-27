/* ============================= */
/* ===== Training Page Script === */
/* ============================= */

const SHEET_ID = "1KppoRCoQvfQ6UoxjggeodS-qjl3jIY5dLaonRhvo1e0";
const API_KEY = "AIzaSyBGKe-HWRSjETakWez_QDuxWFCmeulQgEk";

/* ===== Default and Custom Configs ===== */
const defaultConfig = {
  brackets: {
    1: { startRow: 2, endRow: 13, cols: [0,1,2,3,4] },   // A-E
    2: { startRow: 2, endRow: 13, cols: [6,7,8,9,10] },  // G-K
    3: { startRow: 17, endRow: 28, cols: [0,1,2,3,4] },
    4: { startRow: 17, endRow: 28, cols: [6,7,8,9,10] },
    5: { startRow: 32, endRow: 43, cols: [0,1,2,3,4] },
  },
  raceDetails: { startRow: 2, endRow: 9, cols: [13,14] } // N-O
};

const customConfigs = {
  "Pulilan and San Simon": {
    brackets: {
      1: { startRow: 2, endRow: 16, cols: [0,1,2,3,4,5,6,7] },        // A-H
      2: { startRow: 2, endRow: 16, cols: [9,10,11,12,13,14,15,16] },  // J-Q
      3: { startRow: 18, endRow: 32, cols: [0,1,2,3,4,5,6,7] },
      4: { startRow: 18, endRow: 32, cols: [9,10,11,12,13,14,15,16] },
      5: { startRow: 34, endRow: 48, cols: [0,1,2,3,4,5,6,7] },
    },
    raceDetails: { startRow: 2, endRow: 9, cols: [19,20] } // T-U
  }
};

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

/* ===== Populate Race Details ===== */
function populateRaceDetails() {
  const detailsWrapper = document.getElementById("race-details-wrapper");
  const table = document.createElement("table");
  table.classList.add("race-details");

  // Get config (custom or default)
  const config = customConfigs[sheetData.currentSheet] || defaultConfig;
  const { startRow, endRow, cols } = config.raceDetails;

  // Thead
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  cols.forEach(c => {
    const th = document.createElement("th");
    th.innerText = (sheetData[startRow - 1] && sheetData[startRow - 1][c]) || "";
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement("tbody");
  for (let r = startRow; r < endRow; r++) {
    const tr = document.createElement("tr");
    cols.forEach(c => {
      const td = document.createElement("td");
      td.innerText = (sheetData[r] && sheetData[r][c]) || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  detailsWrapper.innerHTML = "";
  detailsWrapper.appendChild(table);
}

/* ===== Populate Bracket Table ===== */
function populateBracket(bracketNum) {
  const table = document.getElementById(`bracket-${bracketNum}`);
  table.innerHTML = "";

  // Get config (custom or default)
  const config = customConfigs[sheetData.currentSheet] || defaultConfig;
  const bracketConfig = config.brackets[bracketNum];
  const { startRow, endRow, cols } = bracketConfig;

  // Thead
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  cols.forEach(c => {
    const th = document.createElement("th");
    th.innerText = (sheetData[startRow - 1] && sheetData[startRow - 1][c]) || "";
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement("tbody");
  for (let r = startRow; r < endRow; r++) {
    const tr = document.createElement("tr");
    cols.forEach(c => {
      const td = document.createElement("td");
      td.innerText = (sheetData[r] && sheetData[r][c]) || "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
}

/* ===== Show Bracket ===== */
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

/* ===== Setup Bracket Submenu ===== */
function setupBracketSubmenu() {
  const submenu = document.getElementById("bracket-submenu");
  if (!submenu) return;

  const items = submenu.querySelectorAll("li");
  items.forEach(item => {
    item.addEventListener("click", () => {
      const bracketNum = Number(item.dataset.bracket);
      populateBracket(bracketNum);
      showBracket(bracketNum);
    });
  });
}

/* ===== Load Sheet ===== */
async function loadSheetWithBrackets(raceId) {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${raceId}?key=${API_KEY}`);
    const data = await res.json();
    sheetData = data.values || [];
    sheetData.currentSheet = raceId;

    populateRaceDetails();
    setupBracketSubmenu();
    populateBracket(1);
    showBracket(1);
    setActiveRace(raceId);
  } catch (err) {
    console.error("Error loading sheet:", err);
  }
}

/* ===== Initialize Training Page ===== */
document.addEventListener("DOMContentLoaded", async () => {
  const sheetNames = await generateSubmenu();
  if (sheetNames.length) loadSheetWithBrackets(sheetNames[0]);
});
