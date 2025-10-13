const { getCurrentWindow } = window.__TAURI__.window;
const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");
const emit = window.__TAURI__.event.emit;


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
		
		// Check if graduation year is outside valid range
		if (graduationYear < 2000 || graduationYear > 2100) {
			const confirmSave = confirm(
				`Der Abijahrgang ${graduationYear} liegt außerhalb des üblichen Bereichs (2000-2100). Möchten Sie den Schüler wirklich speichern?`
			);
			
			if (!confirmSave) {
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