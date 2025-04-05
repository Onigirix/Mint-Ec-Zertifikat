// Popup.js
const { getCurrentWindow } = window.__TAURI__.window;
const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");
const emit = window.__TAURI__.event.emit;

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
		const result = await db.execute(
			"INSERT INTO students (name, birthday) VALUES ($1, $2)",
			[
				`${e.target.vorname.value} ${e.target.nachname.value}`,
				e.target.geburtsdatum.value,
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
