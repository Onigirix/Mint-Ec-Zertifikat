const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");
const listen = window.__TAURI__.event.listen;

const deleteButton = document.createElement("button");
const toggleSwitch = document.getElementById("toggleSwitch");
const sekText = document.getElementById("sekText");
const toggleSwitchTable = document.getElementById("toggleSwitchTable");
const myTable = document.getElementById("wettbewerbe-table");
const mySearch = document.getElementById("wettbewerbsSuche");
const competitionSearchSuggestions = document.getElementById("competition-suggestions");
const competitionSearchBox = document.getElementById("competition-search");
const addCompetitionButton = document.getElementById("add-competition");


let competitionData = [{}];
let sek = 2;

async function init() {
	toggleSwitch.checked = true;
	populateWettbewerbeTable();
	updateErreichteWettbewerbeTable();
}

// Funktion zum Befüllen der Wettbewerbstabelle
async function populateWettbewerbeTable() {
	competitionData = await db.select(
		"SELECT additional_mint_activity_id, name, level_one, level_two, level_three FROM additional_mint_activities WHERE sek = $1",
		[sek],
	);

	const wettbewerbeTable = document
		.getElementById("wettbewerbe-table")
		.getElementsByTagName("tbody")[0];
	wettbewerbeTable.innerHTML = ""; // Tabelle zurücksetzen

	if(competitionData.length === 0){const row = wettbewerbeTable.insertRow();
		row.insertCell(0).textContent = "-";
		row.insertCell(1).textContent ="Noch kein Wettbewerb vorhanden"
	}

	for (const wettbewerb of competitionData) {
		const row = wettbewerbeTable.insertRow();
		row.insertCell(0).textContent = wettbewerb.additional_mint_activity_id;
		const nameCell = row.insertCell(1);
		nameCell.textContent = wettbewerb.name;
		// Doppelklick-Event zum Bearbeiten der Wettbewerbsnamen
		nameCell.addEventListener("dblclick", () => {
			if (row.classList.contains("active-row")) {
				const newName = prompt("Wettbewerbsnamen bearbeiten:", wettbewerb.name);
				if (newName) {
					wettbewerb.name = newName;
					nameCell.textContent = newName;
					updateErreichteWettbewerbeTable(); // Erreichte Wettbewerbe auch aktualisieren
				}
			}
		});

		row.addEventListener("click", () => {
			// Alle Zeilen zurücksetzen
			const rows = wettbewerbeTable.getElementsByTagName("tr");
			for (const r of rows) {
				r.classList.remove("active-row");
			}

			// Die angeklickte Zeile hervorheben
			row.classList.add("active-row");

			// Tabelle 2 basierend auf dem ausgewählten Wettbewerb anpassen
			updateStufenTable(wettbewerb.additional_mint_activity_id);
		});
	}

	// Das erste Element automatisch auswählen
	const firstRow = wettbewerbeTable.querySelector("tr");
	if (firstRow) {
		firstRow.classList.add("active-row");
		updateStufenTable(Number.parseInt(firstRow.cells[0].textContent));
		competitionSearchBox.value = firstRow.cells[1].textContent;
	}

	// Erreichte Wettbewerbe ebenfalls aktualisieren
	updateErreichteWettbewerbeTable();
}

// Funktion zum Befüllen der Stufentabelle
function updateStufenTable(additional_mint_activity_id) {
	const stufenTable = document
		.getElementById("stufen-table")
		.getElementsByTagName("tbody")[0];
	stufenTable.innerHTML = ""; // Zuerst alle Zeilen löschen

	const selectedCompetitionArray = competitionData.filter(competition => competition.additional_mint_activity_id === additional_mint_activity_id);
	const selectedCompetition = selectedCompetitionArray[0];

	if (!selectedCompetition){return}

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
		// Den Wettbewerb und die Stufe zu Tabelle 3 hinzufügen
		addToErreichteWettbewerbe(1, selectedCompetition.level_one);
	});
	row2.classList.add("clickable");
	row2.addEventListener("click", () => {
		// Den Wettbewerb und die Stufe zu Tabelle 3 hinzufügen
		addToErreichteWettbewerbe(2, selectedCompetition.level_two);
	});
	row3.classList.add("clickable");
	row3.addEventListener("click", () => {
		// Den Wettbewerb und die Stufe zu Tabelle 3 hinzufügen
		addToErreichteWettbewerbe(3, selectedCompetition.level_three);
	});

	beschreibungCell1.addEventListener("dblclick", () => {
		const newBeschreibung = prompt(
			"Stufenbeschreibung bearbeiten:",
			stufe.beschreibung,
		);
		if (newBeschreibung) {
			stufe.beschreibung = newBeschreibung;
			beschreibungCell1.textContent = newBeschreibung;
			updateErreichteWettbewerbeTable(); // Erreichte Wettbewerbe auch aktualisieren
		}});
  beschreibungCell2.addEventListener("dblclick", () => {
	const newBeschreibung = prompt(
	  "Stufenbeschreibung bearbeiten:",
	  stufe.beschreibung,
	);
	if (newBeschreibung) {
	  stufe.beschreibung = newBeschreibung;
	  beschreibungCell2.textContent = newBeschreibung;
	  updateErreichteWettbewerbeTable(); // Erreichte Wettbewerbe auch aktualisieren
	}});
	beschreibungCell3.addEventListener("dblclick", () => {
	  const newBeschreibung = prompt(
		"Stufenbeschreibung bearbeiten:",
		stufe.beschreibung,
	  );
	  if (newBeschreibung) {
		stufe.beschreibung = newBeschreibung;
		beschreibungCell3.textContent = newBeschreibung;
		updateErreichteWettbewerbeTable(); // Erreichte Wettbewerbe auch aktualisieren
	  }
	});
	}


// Funktion zum Hinzufügen des Wettbewerbs und der Stufen zu Tabelle 3
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
		const temp = await db.execute("DELETE FROM student_additional_mint_activities WHERE student_additional_mint_activities_id = ?", [db_result.lastInsertId]);
			newRow.remove();
			console.log(temp);
		e.stopPropagation(); // Verhindert das Auslösen des Zeilenklicks
	});
	deleteCell.appendChild(deleteButton);
}

// Funktion zur dynamischen Aktualisierung der erreichten Wettbewerbe Tabelle
async function updateErreichteWettbewerbeTable() {
	const erreichteWettbewerbeTable = document
		.getElementById("erreichte-wettbewerbe-table")
		.getElementsByTagName("tbody")[0];
	erreichteWettbewerbeTable.innerHTML = "";

	if(window.studentState){
	if(window.studentState.studentId === 0){
		const emptyRow = erreichteWettbewerbeTable.insertRow();
		emptyRow.insertCell(0).textContent = "Kein Schüler ausgewählt."
		emptyRow.insertCell(1).textContent = "-"
		emptyRow.insertCell(2).textContent = "-"
		return;
	}}else{
		const emptyRow = erreichteWettbewerbeTable.insertRow();
		emptyRow.insertCell(0).textContent = "Schülerdaten werden geladen..."
		emptyRow.insertCell(1).textContent = "-"
		emptyRow.insertCell(2).textContent = "-"
		return;}

	const erreichteWettbewerbe = await db.select("SELECT student_additional_mint_activities.student_additional_mint_activities_id AS combination_id, additional_mint_activities.name AS competition_name, additional_mint_activities.sek AS sek, student_additional_mint_activities.level AS level, CASE student_additional_mint_activities.level WHEN 1 THEN additional_mint_activities.level_one WHEN 2 THEN additional_mint_activities.level_two WHEN 3 THEN additional_mint_activities.level_three END AS level_description FROM additional_mint_activities JOIN student_additional_mint_activities ON additional_mint_activities.additional_mint_activity_id = student_additional_mint_activities.additional_mint_activity_id WHERE student_additional_mint_activities.student_id = $1;", [window.studentState.studentId]);
	const erreichteWettbewerbeWithCorrectSek = erreichteWettbewerbe.filter(singleCompetition => {
		return singleCompetition.sek === sek;
	})

	for (const eintrag of erreichteWettbewerbeWithCorrectSek) {
		const row = erreichteWettbewerbeTable.insertRow();
		row.insertCell(0).textContent = eintrag.competition_name;
		row.insertCell(1).textContent =
			`${eintrag.level}: ${eintrag.level_description}`;

		const deleteCell = row.insertCell(2);
		const deleteButton = document.createElement("button");
		deleteButton.textContent = "Löschen";
		deleteButton.classList.add("delete-btn");
		deleteButton.addEventListener("click", async (e) => {
				await db.execute(`DELETE FROM student_additional_mint_activities WHERE student_additional_mint_activities_id = ${eintrag.combination_id};`)
				row.remove();
			e.stopPropagation();
		});
		deleteCell.appendChild(deleteButton);
	}
}

// Funktion zum Hinzufügen eines neuen Wettbewerbs
function showAddWettbewerbForm() {
	const { WebviewWindow } = window.__TAURI__.webviewWindow;
	const { Webview } = window.__TAURI__.webview;

	const competitionPopupWebview = new WebviewWindow("competitionPopup", {
		hiddenTitle: true,
		title: "Neuen Wettbewerb erstellen",
		height: 550,
		minimizable: false,
		url: "competition-popup.html",
	});
	competitionPopupWebview.once("tauri://created", () => {});
	competitionPopupWebview.once("tauri://error", async (e) => {
		if (e.payload === "a webview with label `competitionPopup` already exists") {
			const competitionPopupWindow = await Webview.getByLabel("competitionPopup");
			await competitionPopupWindow.setFocus();
		}
	});
}

// Füge einen Event-Listener hinzu, der reagiert, wenn der Schalter umgelegt wird
toggleSwitch.addEventListener("change", () => {
	if (toggleSwitch.checked) {
		sekText.textContent = "SEK II";
		sek = 2;
		competitionSearchBox.value = "";
		competitionSearchSuggestions.innerHTML = "";
	} else {
		sekText.textContent = "SEK I";
		sek = 1;
		competitionSearchBox.value = "";
		competitionSearchSuggestions.innerHTML = "";
	}
	populateWettbewerbeTable();
});

toggleSwitchTable.addEventListener("change", () => {
	if (toggleSwitchTable.checked) {
		myTable.style.display = "none"; // Verstecke die Tabelle
		mySearch.style.display = "block";
	} else {
		myTable.style.display = "table"; // Zeige die Tabelle
		mySearch.style.display = "none";
	}
});

init();

document.addEventListener("studentChanged", (e) => {
	updateErreichteWettbewerbeTable();
});

competitionSearchBox.addEventListener("keydown", async (e) => {
	if (/^[a-zA-Z]$/.test(e.key) || e.key === "Backspace" || e.key === "Delete") {
		const suggestionResults = await db.select(
			"SELECT name, additional_mint_activity_id FROM additional_mint_activities WHERE name LIKE $1 AND sek = $2",
			[`%${competitionSearchBox.value}%`, sek],
		);
		competitionSearchSuggestions.innerHTML = "";
		for (let i = 0; i < suggestionResults.length && i < 3; i++) {
			const item = document.createElement("li");
			item.textContent = suggestionResults[i].name;
			item.dataset.id = suggestionResults[i].additional_mint_activity_id;
			item.addEventListener("click", () => {
				competitionSearchBox.value = item.textContent;
				updateStufenTable(
					Number.parseInt(item.dataset.id),
				);
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

			updateStufenTable(
				Number.parseInt(activeItem.dataset.id)
			);
		} else {
			if (firstResult != null) {
				competitionSearchSuggestions.style.display = "none";
				competitionSearchBox.value = firstResult.textContent;

				updateStufenTable(
					Number.parseInt(firstResult.dataset.id)
				);
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
		if (competitionSearchBox.value === "" || competitionSearchBox.value === null) {
			competitionSearchSuggestions.style.display = "none";
		}
	}});

addCompetitionButton.addEventListener("click", (e) => showAddWettbewerbForm());

await listen("student-")