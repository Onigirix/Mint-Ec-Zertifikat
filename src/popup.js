const { getCurrentWindow } = window.__TAURI__.window;
const Database = window.__TAURI__.sql;
const invoke = window.__TAURI__.core.invoke;

const dbPath = await invoke("get_database_path");
const db = await Database.load(`sqlite://${dbPath}`);
const emit = window.__TAURI__.event.emit;

// Async confirmation dialog
function asyncConfirm(message) {
	return new Promise((resolve) => {
		const result = confirm(message);
		resolve(result);
	});
}


const closeButton = document.getElementById("schuelerAbbrechen");
closeButton.addEventListener("click", () => {
  closeWindow();
});


function closeWindow() {
  const currentWindow = getCurrentWindow();
  emit("popup-closed");
  currentWindow.close();
}



window.addEventListener("DOMContentLoaded", () => {
	const closePopupButton = document.getElementById("closePopup");

	if (closePopupButton) {
		closePopupButton.addEventListener("click", () => {
			const currentWindow = getCurrentWindow();
			currentWindow.close();
		});
	}
});


document
	.getElementById("schuelerForm")
	.addEventListener("submit", async (e) => {
		e.preventDefault();

		const graduationYear = parseInt(e.target.abijahr.value);
		const birthDate = new Date(e.target.geburtsdatum.value);
		const currentDate = new Date();
		const age = Math.floor((currentDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));

		// Check if graduation year is outside valid range
		if (graduationYear < 2000 || graduationYear > 2100) {
			const confirmSave = await asyncConfirm(
				`Der Abijahrgang ${graduationYear} liegt außerhalb des üblichen Bereichs (2000-2100). Möchten Sie den Schüler wirklich speichern?`
			);

			if (!confirmSave) {
				return; // Don't save if user cancels
			}
		}

		// Check if age is outside valid range (0-25 years)
		if (age < 0 || age > 25) {
			const confirmAge = await asyncConfirm(
				`Das Alter des Schülers (${age} Jahre) liegt außerhalb des üblichen Bereichs (0-25 Jahre). Möchten Sie den Schüler wirklich speichern?`
			);

			if (!confirmAge) {
				return; // Don't save if user cancels
			}
		}

		const result = await db.execute(
			"INSERT INTO students (name, birthday, graduation_year) VALUES ($1, $2, $3)",
			[
				`${e.target.vorname.value} ${e.target.nachname.value}`,
				e.target.geburtsdatum.value,
				e.target.abijahr.value,
			],
		);
		await emit("student-added", {
			new_student_id: result.lastInsertId,
			new_student_name: `${e.target.vorname.value} ${e.target.nachname.value}`,
		});
		if (e.submitter === document.getElementById("fertig")) {
			const currentWindow = getCurrentWindow();
			currentWindow.close();
		} else {
			e.target.reset();
		}
	});

	/*const inputFields = document.querySelectorAll("input");
	for (const inputField of inputFields){
	inputField.addEventListener("keyup", (e) => {
		console.log(e.target.value);
		if (e.target.value != ""){
		document.getElementById("schuelerForm").style.border = "2px solid red";}
	else{

	}}
	);}*/