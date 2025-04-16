const Database = window.__TAURI__.sql;
const { WebviewWindow } = window.__TAURI__.webviewWindow;
const { Webview } = window.__TAURI__.webview;
const listen = window.__TAURI__.event.listen;
const { ask } = window.__TAURI__.dialog;
const db = await Database.load("sqlite://resources/db.sqlite");
import { select_student } from "./main.js";

async function init() {
	await generateTable();
	if (window.studentState.studentId !== 0) {
		const row = document.querySelector(
			`[data-id="${window.studentState.studentId}"]`,
		);
		if (row) {
			selectStudentInStudentEdit(row, window.studentState.studentId);
		}
	}
}

document
	.getElementById("deleteButton")
	.addEventListener("click", async () =>
		deleteStudent(window.studentState.studentId)
	);
document.getElementById("editButton").addEventListener("click", editStudent);
document.getElementById("deleteYearButton").addEventListener("click", async () => deleteYear(window.studentState.studentId))
document.getElementById("main").addEventListener("click", (event) => {
	if (!document.getElementById("content").contains(event.target)) {
		deselectStudent();
	}
});

async function generateTable() {
	const studentData = await db.select(
		"SELECT student_id, name, birthday, graduation_year FROM students",
	);
	let table = "<table>";
	table += "<thead>";
	table += "<tr><th>Name</th><th>Abijahrgang</th><th>Geburtsdatum</th></tr>";
	table += "</thead>";
	table += "<tbody>";

	for (const student of studentData) {
		table += `<tr class="student-row" data-id="${student.student_id}" >
                    <td>${student.name}</td>
                    <td>${student.graduation_year}</td>
                    <td>${
											student.birthday
												? student.birthday.split("-").reverse().join(".")
												: ""
										}</td>
                  </tr>`;
	}

	// I don't know why, but it doesn't work without the Timeout of 0ms so just leave it in
	setTimeout(() => {
		const rows = document.querySelectorAll(".student-row");
		for (const row of rows) {
			const studentId = row.getAttribute("data-id");
			row.addEventListener("click", (event) =>
				selectStudentInStudentEdit(row, studentId),
			);
		}
	}, 0);

	table += "</tbody>";
	table += "</table>";

	document.getElementById("table-container").innerHTML = table;
}

async function selectStudentInStudentEdit(row, studentId) {
	for (const r of document.querySelectorAll(".student-row")) {
		r.classList.remove("selected");
	}

	row.classList.add("selected");
	select_student(
		Number.parseInt(studentId),
		row.querySelector("td").textContent,
	);

	const deleteButton = document.getElementById("deleteButton");
	const editButton = document.getElementById("editButton");
	const deleteYearButton = document.getElementById("deleteYearButton");

	deleteButton.removeAttribute("disabled");
	editButton.removeAttribute("disabled");
	deleteYearButton.removeAttribute("disabled");
}

async function deselectStudent() {
	document.getElementById("deleteButton").setAttribute("disabled", "true");
	document.getElementById("editButton").setAttribute("disabled", "true");
	document.getElementById("deleteYearButton").setAttribute("disabled", "true");
	for (const r of document.querySelectorAll(".student-row")) {
		r.classList.remove("selected");
	}
	select_student(0, "");
}

async function editStudent() {
	openEditStudentPopup();
}

async function openEditStudentPopup() {
	console.log("openEditStudentPopup called");
	const studentPopupWebview = new WebviewWindow("editStudentPopup", {
		hiddenTitle: true,
		title: "Schüler bearbeiten",
		height: 380,
		width: 800,
		minimizable: false,
		url: `edit-schueler-popup.html?id=${window.studentState.studentId}`,
	});
	studentPopupWebview.once("tauri://created", () => {});
	studentPopupWebview.once("tauri://error", async (e) => {
		if (e.payload === "a webview with label `studentPopup` already exists") {
			const studentPopupWindow = await Webview.getByLabel("studentPopup");
			await studentPopupWindow.setFocus();
		}
	});
}

async function deleteStudent(studentId) {
	await db.execute(
		"DELETE FROM student_additional_mint_activities WHERE student_id = $1",
		[studentId],
	);
	await db.execute("DELETE FROM students WHERE student_id = $1", [studentId]);
	deselectStudent();
	init();
}

async function deleteYear(student_id) {
	if (!student_id) return;

	const student = await db.select(
		"SELECT graduation_year FROM students WHERE student_id = $1",
		[student_id],
	);
	if (!student || student.length === 0) return;

	const graduationYear = student[0].graduation_year;

	const confirmed = await ask(
		`Möchten Sie wirklich alle Schüler des Jahrgangs ${graduationYear} löschen?`,
		{ title: "Jahrgang löschen bestätigen", kind: "warning" },
	);

	if (confirmed) {
		const studentsToDelete = await db.select(
			"SELECT student_id FROM students WHERE graduation_year = $1",
			[graduationYear],
		);
		const studentIdsToDelete = studentsToDelete.map((s) => s.student_id);
		for (const studentIdToDelete of studentIdsToDelete){
			deleteStudent(studentIdToDelete);
		}
	}
}

init();

await listen("student-added", (event) => {
	init();
});

await listen("edit-popup-closed", (event) => {
	init();
});
