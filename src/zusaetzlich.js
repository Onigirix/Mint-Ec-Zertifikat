const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");

const deleteButton = document.createElement("button");
const toggleSwitch = document.getElementById("toggleSwitch");
const sekText = document.getElementById("sekText");
let competitionData = [{}];

let sek = 2;

async function init() {
	toggleSwitch.checked = true;

	populateWettbewerbeTable();
	updateErreichteWettbewerbeTable();
}

let wettbewerbeData = [
	{ id: 1, name: "Mathematik Olympiade" },
	{ id: 2, name: "Informatik Wettbewerb" },
	{ id: 3, name: "Chemie Wettbewerb" },
	{ id: 3, name: "Chemie Wettbewerb" },
	{ id: 3, name: "Chemie Wettbewerb" },
];

let stufenData = {
	1: [
		{ stufe: 1, beschreibung: "Runde 1" },
		{ stufe: 2, beschreibung: "Runde 2" },
		{ stufe: 3, beschreibung: "Finale" },
	],
	2: [
		{ stufe: 1, beschreibung: "Code Challenge 1" },
		{ stufe: 2, beschreibung: "Code Challenge 2" },
		{ stufe: 3, beschreibung: "Code Challenge 3" },
	],
	3: [
		{ stufe: 1, beschreibung: "Praktische Übung 1" },
		{ stufe: 2, beschreibung: "Praktische Übung 2" },
		{ stufe: 3, beschreibung: "Finale Experiment" },
	],
	4: [
		{ stufe: 1, beschreibung: "Praktische Übung 1" },
		{ stufe: 2, beschreibung: "Praktische Übung 2" },
		{ stufe: 3, beschreibung: "Finale Experiment" },
	],
	5: [
		{ stufe: 1, beschreibung: "Praktische Übung 1" },
		{ stufe: 2, beschreibung: "Praktische Übung 2" },
		{ stufe: 3, beschreibung: "Finale Experiment" },
	],
};
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
		addToErreichteWettbewerbe(row1, 1);
	});
	row2.classList.add("clickable");
	row2.addEventListener("click", () => {
		// Den Wettbewerb und die Stufe zu Tabelle 3 hinzufügen
		addToErreichteWettbewerbe(row2, 2);
	});
	row3.classList.add("clickable");
	row3.addEventListener("click", () => {
		// Den Wettbewerb und die Stufe zu Tabelle 3 hinzufügen
		addToErreichteWettbewerbe(row3, 3);
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
function addToErreichteWettbewerbe(row, stufe) {
	const wettbewerbeTable = document
		.getElementById("wettbewerbe-table")
		.getElementsByTagName("tbody")[0];
	const activeRow = wettbewerbeTable.querySelector(".active-row");
	const wettbewerbName = activeRow.cells[1].textContent;

	const erreichteWettbewerbeTable = document
		.getElementById("erreichte-wettbewerbe-table")
		.getElementsByTagName("tbody")[0];
	const newRow = erreichteWettbewerbeTable.insertRow();
	newRow.insertCell(0).textContent = wettbewerbName;
	newRow.insertCell(1).textContent = `${stufe.stufe}: ${stufe.beschreibung}`;

	// Löschen-Button hinzufügen
	const deleteCell = newRow.insertCell(2);
	const deleteButton = document.createElement("button");
	deleteButton.textContent = "Löschen";
	deleteButton.classList.add("delete-btn"); // Anwendung des neuen Stils
	deleteButton.addEventListener("click", (e) => {
		const confirmation = confirm(
			"Möchten Sie diesen Eintrag wirklich löschen?",
		);
		if (confirmation) {
			newRow.remove();
			updateErreichteWettbewerbeTable(); // Erreichte Wettbewerbe nach dem Löschen aktualisieren
		}
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

	if(window.studentState.studentId === 0){
		return;
	}

	const erreichteWettbewerbe = await db.select("SELECT additional_mint_activities.name AS competition_name, additional_mint_activities.sek AS sek, student_additional_mint_activities.level AS level, CASE student_additional_mint_activities.level WHEN 1 THEN additional_mint_activities.level_one WHEN 2 THEN additional_mint_activities.level_two WHEN 3 THEN additional_mint_activities.level_three END AS level_description FROM additional_mint_activities JOIN student_additional_mint_activities ON additional_mint_activities.additional_mint_activity_id = student_additional_mint_activities.additional_mint_activity_id WHERE student_additional_mint_activities.student_id = 1;");
	const erreichteWettbewerbeWithCorrectSek = erreichteWettbewerbe.filter(singleCompetition => {
		return singleCompetition.sek === sek;
	})

	for (const eintrag of erreichteWettbewerbeWithCorrectSek) {
		const row = erreichteWettbewerbeTable.insertRow();
		row.insertCell(0).textContent = eintrag.competition_name;
		row.insertCell(1).textContent =
			`${eintrag.level}: ${eintrag.level_description}`;

		// Löschen-Button hinzufügen
		const deleteCell = row.insertCell(2);
		deleteButton.textContent = "Löschen";
		deleteButton.classList.add("delete-btn"); // Anwendung des neuen Stils
		deleteButton.addEventListener("click", (e) => {
			const confirmation = confirm(
				"Möchten Sie diesen Eintrag wirklich löschen?",
			);
			if (confirmation) {
				row.remove();
				// Erreichte Wettbewerbe Array ebenfalls aktualisieren
				erreichteWettbewerbe = erreichteWettbewerbe.filter(
					(e) => e !== eintrag,
				);
			}
			e.stopPropagation(); // Verhindert das Auslösen des Zeilenklicks
		});
		deleteCell.appendChild(deleteButton);
	}
}

// Funktion zum Hinzufügen eines neuen Wettbewerbs
function showAddWettbewerbForm() {
	const name = prompt("Geben Sie den Namen des neuen Wettbewerbs ein:");
	if (name) {
		const newId = wettbewerbeData.length + 1;

		// Stufeninformationen abfragen
		let stufen = [];
		for (let i = 1; i <= 3; i++) {
			const beschreibung = prompt(
				`Geben Sie die Beschreibung für Stufe ${i} ein:`,
			);
			stufen.push({ stufe: i, beschreibung: beschreibung });
		}

		// Den neuen Wettbewerb und die Stufen speichern
		wettbewerbeData.push({ id: newId, name: name });
		stufenData[newId] = stufen;

		populateWettbewerbeTable();
	}
}

// Füge einen Event-Listener hinzu, der reagiert, wenn der Schalter umgelegt wird
toggleSwitch.addEventListener("change", () => {
	if (toggleSwitch.checked) {
		sekText.textContent = "SEK II";
		sek = 2;
	} else {
		sekText.textContent = "SEK I";
		sek = 1;
	}
	populateWettbewerbeTable();
});
const toggleSwitchTable = document.getElementById("toggleSwitchTable");
const myTable = document.getElementById("wettbewerbe-table");
const mySearch = document.getElementById("wettbewerbsSuche");

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