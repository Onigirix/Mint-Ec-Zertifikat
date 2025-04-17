const Database = window.__TAURI__.sql;
const { WebviewWindow } = window.__TAURI__.webviewWindow;
const { Webview } = window.__TAURI__.webview;
const listen = window.__TAURI__.event.listen;
const {ask} = window.__TAURI__.dialog;

const db = await Database.load("sqlite://resources/db.sqlite");

const deleteButton = document.createElement("button");
const toggleSwitch = document.getElementById("toggleSwitch");
const sekText = document.getElementById("sekText");
const toggleSwitchTable = document.getElementById("toggleSwitchTable");
const myTable = document.getElementById("wettbewerbe-table");
const mySearch = document.getElementById("wettbewerbsSuche");
const competitionSearchSuggestions = document.getElementById("competition-suggestions");
const competitionSearchBox = document.getElementById("competition-search");
const addCompetitionButton = document.getElementById("add-competition");
const editCompetitionButton = document.getElementById("edit-competition");
const deleteCompetitionButton = document.getElementById("delete-competition")
const mainContent = document.querySelector("#main");

let selectedCompetitionName = "";
let selectedCompetitionId = 0;
let competitionData = [{}];
let sek = 2;

async function init() {
  toggleSwitch.checked = true;
  populateWettbewerbeTable();
  updateErreichteWettbewerbeTable();
  const [competitionSearchBoxValue] = await db.select(
    "SELECT competition_search_box FROM settings WHERE id = 1"
  );
  if (competitionSearchBoxValue.competition_search_box == 1) {
    toggleSwitchTable.checked = true;
    myTable.style.display = "none";
    mySearch.style.display = "block";
  }
}

async function populateWettbewerbeTable() {
  competitionData = await db.select(
    "SELECT additional_mint_activity_id, name, level_one, level_two, level_three FROM additional_mint_activities WHERE sek = $1",
    [sek]
  );

  const wettbewerbeTable = document
    .getElementById("wettbewerbe-table")
    .getElementsByTagName("tbody")[0];
  wettbewerbeTable.innerHTML = "";

  if (competitionData.length === 0) {
    const row = wettbewerbeTable.insertRow();
    row.insertCell(0).textContent = "-";
    row.insertCell(1).textContent = "Noch kein Wettbewerb vorhanden";
  }

  for (const wettbewerb of competitionData) {
    const row = wettbewerbeTable.insertRow();
    row.insertCell(0).textContent = wettbewerb.additional_mint_activity_id;
    const nameCell = row.insertCell(1);
    nameCell.textContent = wettbewerb.name;

    row.addEventListener("click", () => {
      const rows = wettbewerbeTable.getElementsByTagName("tr");
      for (const r of rows) {
        //TODO: Test if a querySelector(All) would be faster, might be important with very large databases
        r.classList.remove("active-row");
      }

      row.classList.add("active-row");

      updateStufenTable(wettbewerb.additional_mint_activity_id);
    });
  }

  const firstRow = wettbewerbeTable.querySelector("tr");
  if (firstRow.cells[0].textContent != "-") {
    firstRow.classList.add("active-row");
    updateStufenTable(Number.parseInt(firstRow.cells[0].textContent));
    if (firstRow.cells[1].textContent === "Noch kein Wettbewerb vorhanden") {
      competitionSearchBox.value = "";
    } else {
      competitionSearchBox.value = firstRow.cells[1].textContent;
    }
  }

  updateErreichteWettbewerbeTable();
}

function updateStufenTable(additional_mint_activity_id) {
  selectedCompetitionId = additional_mint_activity_id;
  const stufenTable = document
    .getElementById("stufen-table")
    .getElementsByTagName("tbody")[0];
  stufenTable.innerHTML = "";

  let selectedCompetition;

  if (additional_mint_activity_id === 0) {
    selectedCompetition = {
      level_one: "",
      level_two: "",
      level_three: ""
    };
  } else {
    const selectedCompetitionArray = competitionData.filter(
      (competition) =>
        competition.additional_mint_activity_id === additional_mint_activity_id
    );
    selectedCompetition = selectedCompetitionArray[0];
    selectedCompetitionName = selectedCompetition.name;
  }
  if (!selectedCompetition) {
    return;
  }

  const row1 = stufenTable.insertRow();
  const stufeCell1 = row1.insertCell(0);
  stufeCell1.textContent = 1;
  const beschreibungCell1 = row1.insertCell(1);
  beschreibungCell1.textContent = selectedCompetition.level_one;
  const row2 = stufenTable.insertRow();
  const stufeCell2 = row2.insertCell(0);
  stufeCell2.textContent = 2;
  const beschreibungCell2 = row2.insertCell(1);
  beschreibungCell2.textContent = selectedCompetition.level_two;
  const row3 = stufenTable.insertRow();
  const stufeCell3 = row3.insertCell(0);
  stufeCell3.textContent = 3;
  const beschreibungCell3 = row3.insertCell(1);
  beschreibungCell3.textContent = selectedCompetition.level_three;

  row1.classList.add("clickable");
  row1.addEventListener("click", () => {
    addToErreichteWettbewerbe(1, selectedCompetition.level_one);
  });
  row2.classList.add("clickable");
  row2.addEventListener("click", () => {
    addToErreichteWettbewerbe(2, selectedCompetition.level_two);
  });
  row3.classList.add("clickable");
  row3.addEventListener("click", () => {
    addToErreichteWettbewerbe(3, selectedCompetition.level_three);
  });
}

async function addToErreichteWettbewerbe(stufe, stufe_beschreibung) {
  const wettbewerbeTable = document
    .getElementById("wettbewerbe-table")
    .getElementsByTagName("tbody")[0];
  const activeRow = wettbewerbeTable.querySelector(".active-row");
  const wettbewerbName = activeRow.cells[1].textContent;
  const wettbewerbId = Number.parseInt(activeRow.cells[0].textContent);

  const db_result = await db.execute(
    `INSERT INTO student_additional_mint_activities (student_id, additional_mint_activity_id, level) VALUES ($1, $2, $3)`,
    [window.studentState.studentId, wettbewerbId, stufe]
  );

  const erreichteWettbewerbeTable = document
    .getElementById("erreichte-wettbewerbe-table")
    .getElementsByTagName("tbody")[0];
  const newRow = erreichteWettbewerbeTable.insertRow();
  newRow.insertCell(0).textContent = wettbewerbName;
  newRow.insertCell(1).textContent = `${stufe}: ${stufe_beschreibung}`;

  // Löschen-Button hinzufügen
  const deleteCell = newRow.insertCell(2);
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Löschen";
  deleteButton.classList.add("delete-btn"); // Anwendung des neuen Stils
  deleteButton.addEventListener("click", async (e) => {
    const temp = await db.execute(
      "DELETE FROM student_additional_mint_activities WHERE student_additional_mint_activities_id = ?",
      [db_result.lastInsertId]
    );
    newRow.remove();
    console.log(temp);
    e.stopPropagation();
  });
  deleteCell.appendChild(deleteButton);
}

async function updateErreichteWettbewerbeTable() {
  const erreichteWettbewerbeTable = document
    .getElementById("erreichte-wettbewerbe-table")
    .getElementsByTagName("tbody")[0];
  erreichteWettbewerbeTable.innerHTML = "";

  if (window.studentState) {
    if (window.studentState.studentId === 0) {
      const emptyRow = erreichteWettbewerbeTable.insertRow();
      emptyRow.insertCell(0).textContent = "Kein Schüler ausgewählt.";
      emptyRow.insertCell(1).textContent = "-";
      emptyRow.insertCell(2).textContent = "-";
      return;
    }
  } else {
    const emptyRow = erreichteWettbewerbeTable.insertRow();
    emptyRow.insertCell(0).textContent = "Schülerdaten werden geladen...";
    emptyRow.insertCell(1).textContent = "-";
    emptyRow.insertCell(2).textContent = "-";
    return;
  }

  const erreichteWettbewerbe = await db.select(
    "SELECT student_additional_mint_activities.student_additional_mint_activities_id AS combination_id, additional_mint_activities.name AS competition_name, additional_mint_activities.sek AS sek, student_additional_mint_activities.level AS level, CASE student_additional_mint_activities.level WHEN 1 THEN additional_mint_activities.level_one WHEN 2 THEN additional_mint_activities.level_two WHEN 3 THEN additional_mint_activities.level_three END AS level_description FROM additional_mint_activities JOIN student_additional_mint_activities ON additional_mint_activities.additional_mint_activity_id = student_additional_mint_activities.additional_mint_activity_id WHERE student_additional_mint_activities.student_id = $1;",
    [window.studentState.studentId]
  );
  const erreichteWettbewerbeWithCorrectSek = erreichteWettbewerbe.filter(
    (singleCompetition) => {
      return singleCompetition.sek === sek;
    }
  );

  for (const eintrag of erreichteWettbewerbeWithCorrectSek) {
    const row = erreichteWettbewerbeTable.insertRow();
    row.insertCell(0).textContent = eintrag.competition_name;
    row.insertCell(
      1
    ).textContent = `${eintrag.level}: ${eintrag.level_description}`;

    const deleteCell = row.insertCell(2);
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Löschen";
    deleteButton.classList.add("delete-btn");
    deleteButton.addEventListener("click", async (e) => {
      await db.execute(
        `DELETE FROM student_additional_mint_activities WHERE student_additional_mint_activities_id = ${eintrag.combination_id};`
      );
      row.remove();
      e.stopPropagation();
    });
    deleteCell.appendChild(deleteButton);
  }
}

function showAddWettbewerbForm() {
  const competitionPopupWebview = new WebviewWindow("competitionPopup", {
    hiddenTitle: true,
    title: "Neuen Wettbewerb erstellen",
    height: 550,
    minimizable: false,
    url: "competition-popup.html",
  });
  competitionPopupWebview.once("tauri://created", () => {});
  competitionPopupWebview.once("tauri://error", async (e) => {
    if (
      e.payload === "a webview with label `competitionPopup` already exists"
    ) {
      const competitionPopupWindow = await Webview.getByLabel(
        "competitionPopup"
      );
      await competitionPopupWindow.setFocus();
    }
  });
}

async function showEditWettbewerbForm(){
  const editCompetitionPopupWebview = new WebviewWindow("editCompetitionPopup", {
    hiddenTitle: true,
    title: `${selectedCompetitionName} in der SEK ${sek} bearbeiten`,
    height: 470,
    minimizable: false,
    url: `edit-competition-popup.html?id=${selectedCompetitionId}`,
  });
  editCompetitionPopupWebview.once("tauri://created", () => {});
  editCompetitionPopupWebview.once("tauri://error", async (e) => {
    if (
      e.payload === "a webview with label `editCompetitionPopup` already exists"
    ) {
      const editCompetitionPopupWindow = await Webview.getByLabel(
        "editCompetitionPopup"
      );
      await editCompetitionPopupWindow.setFocus();
    }
  });
}

toggleSwitch.addEventListener("change", () => {
  if (toggleSwitch.checked) {
    sekText.textContent = "SEK II";
    sek = 2;
    selectedCompetitionId = 0;
    selectedCompetitionName = "";
    updateStufenTable(0);
    competitionSearchBox.value = "";
    competitionSearchSuggestions.innerHTML = "";
  } else {
    sekText.textContent = "SEK I";
    sek = 1;
    selectedCompetitionId = 0;
    selectedCompetitionName = "";
    updateStufenTable(0);
    competitionSearchBox.value = "";
    competitionSearchSuggestions.innerHTML = "";
  }
  populateWettbewerbeTable();
});

toggleSwitchTable.addEventListener("change", async () => {
  if (toggleSwitchTable.checked) {
    myTable.style.display = "none";
    mySearch.style.display = "block";
    await db.execute(
      "UPDATE settings SET competition_search_box = 1 WHERE id = 1;"
    );
  } else {
    myTable.style.display = "table";
    mySearch.style.display = "none";
    await db.execute(
      "UPDATE settings SET competition_search_box = 0 WHERE id = 1;"
    );
  }
});

await init();

document.addEventListener("studentChanged", (e) => {
  updateErreichteWettbewerbeTable();
});

competitionSearchBox.addEventListener("keydown", async (e) => {
  if (/^[a-zA-Z]$/.test(e.key) || e.key === "Backspace" || e.key === "Delete") {
    const suggestionResults = await db.select(
      "SELECT name, additional_mint_activity_id FROM additional_mint_activities WHERE name LIKE $1 AND sek = $2",
      [`%${competitionSearchBox.value}%`, sek]
    );
    competitionSearchSuggestions.innerHTML = "";
    for (let i = 0; i < suggestionResults.length && i < 3; i++) {
      const item = document.createElement("li");
      item.textContent = suggestionResults[i].name;
      item.dataset.id = suggestionResults[i].additional_mint_activity_id;
      item.addEventListener("click", () => {
        competitionSearchBox.value = item.textContent;
        updateStufenTable(Number.parseInt(item.dataset.id));
        competitionSearchSuggestions.style.display = "none";
      });
      competitionSearchSuggestions.appendChild(item);
    }
    if (competitionSearchSuggestions.childNodes.length === 0) {
      competitionSearchSuggestions.style.display = "none";
    } else {
      competitionSearchSuggestions.style.display = "block";
    }
  } else if (e.key === "Enter") {
    const activeItem = competitionSearchSuggestions.querySelector("li.active");
    const firstResult = competitionSearchSuggestions.firstElementChild;
    if (activeItem) {
      competitionSearchSuggestions.style.display = "none";
      competitionSearchBox.value = activeItem.textContent;

      updateStufenTable(Number.parseInt(activeItem.dataset.id));
    } else {
      if (firstResult != null) {
        competitionSearchSuggestions.style.display = "none";
        competitionSearchBox.value = firstResult.textContent;

        updateStufenTable(Number.parseInt(firstResult.dataset.id));
      }
    }
  } else if (e.key === "Tab") {
    e.preventDefault();
    const items = Array.from(competitionSearchSuggestions.children);
    if (items.length === 0) return;

    const activeItem = competitionSearchSuggestions.querySelector("li.active");
    let nextIndex = 0;

    if (activeItem) {
      const currentIndex = items.indexOf(activeItem);
      activeItem.classList.remove("active");
      nextIndex = (currentIndex + 1) % items.length;
    }

    const nextItem = items[nextIndex];
    nextItem.classList.add("active");

    competitionSearchBox.value = nextItem.textContent;
    return;
  } else {
    if (
      competitionSearchBox.value === "" ||
      competitionSearchBox.value === null
    ) {
      competitionSearchSuggestions.style.display = "none";
    }
  }
});

competitionSearchBox.addEventListener("click", async (e) => {
  e.stopPropagation();
  e.preventDefault();
  if (competitionSearchBox.value.trim() === selectedCompetitionName) {
    competitionSearchBox.value = "";
  }
});

mainContent.addEventListener("click", () => {
  if (competitionSearchBox) {
    setTimeout(() => {
      if (
        competitionSearchBox.value.trim() === "" ||
        competitionSearchBox.value.trim() === selectedCompetitionName
      ) {
        competitionSearchBox.value = selectedCompetitionName;
      } else {
        competitionSearchBox.value = "";
        updateStufenTable(0);
      }
    }, 20);
  }
});

async function deleteCompetition(){
  const selectedCompetitionIdLocal = selectedCompetitionId;
  const selectedCompetitionNameLocal = selectedCompetitionName; //Save the state of the variables when the dialog is spawned so the possibility of the competition being changed while the dialog is open, which would otherwise lead to the deleted competition being a different one, than the one displayed in the dialog.
  const first_confirm = await ask(`Möchten sie den Wettbewerb "${selectedCompetitionNameLocal}" wirklich unwiederruflich löchen? \nDies löscht auch alle Teilnahmen an dem Wettbewerb.`, { title: "Mint-EC", kind: "warning" })
  if (first_confirm){
    await db.execute("DELETE FROM student_additional_mint_activities WHERE additional_mint_activity_id = $1", [selectedCompetitionIdLocal]);
    await db.execute("DELETE FROM additional_mint_activities WHERE additional_mint_activity_id = $1", [selectedCompetitionIdLocal])
    selectedCompetitionId = 0;
    selectedCompetitionName = "";
    updateStufenTable(0);
    competitionSearchBox.value = "";
    competitionSearchSuggestions.innerHTML = "";
    populateWettbewerbeTable();
    updateErreichteWettbewerbeTable();
  }
}

addCompetitionButton.addEventListener("click", (e) => showAddWettbewerbForm());
editCompetitionButton.addEventListener("click", async (e) => await showEditWettbewerbForm()) //TODO: Figure out if async is helpful
deleteCompetitionButton.addEventListener("click", async (e) => await deleteCompetition())

await listen("competitions-changed", (event) => populateWettbewerbeTable());

//TODO: Move everything down, when starting to type
