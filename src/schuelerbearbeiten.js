const Database = window.__TAURI__.sql;
const { WebviewWindow } = window.__TAURI__.webviewWindow;
const { Webview } = window.__TAURI__.webview;
const listen = window.__TAURI__.event.listen;
const { ask } = window.__TAURI__.dialog;
const invoke = window.__TAURI__.core.invoke;

const dbPath = await invoke("get_database_path");
const db = await Database.load(`sqlite://${dbPath}`);
import { select_student } from "./main.js";

const sortState = {
	column: "name",      // name | graduation_year | birthday
	direction: "asc",    // asc | desc
};

let allStudents = []; // Store all students for filtering

function toggleSort(column) {
	if (sortState.column === column) {
		sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
	} else {
		sortState.column = column;
		sortState.direction = "asc";
	}
	generateTable();
}

function scrollRowIntoView(row) {
	if (!row) return;
	const container = document.getElementById("table-container");
	if (container && container.scrollHeight > container.clientHeight) {
		const rowRect = row.getBoundingClientRect();
		const contRect = container.getBoundingClientRect();
		const outOfView = rowRect.top < contRect.top || rowRect.bottom > contRect.bottom;
		if (outOfView) {
			row.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	} else {
		row.scrollIntoView({ behavior: "smooth", block: "center" });
	}
}

async function init() {
	const yearFilterInput = document.getElementById("year-filter");
	if (yearFilterInput) {
		yearFilterInput.placeholder = `z.B. ${new Date().getFullYear()}`;
	}

	await loadStudents();
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

async function loadStudents() {
	allStudents = await db.select(
		"SELECT student_id, name, birthday, graduation_year FROM students",
	);
}

function getFilteredStudents() {
	const searchTerm = document.getElementById("student-filter").value.toLowerCase().trim();
	const yearFilter = document.getElementById("year-filter").value;

	return allStudents.filter(student => {
		const matchesSearch = !searchTerm || student.name.toLowerCase().includes(searchTerm);
		const matchesYear = !yearFilter || yearFilter.length != 4 || student.graduation_year == yearFilter;
		return matchesSearch && matchesYear;
	});
}

document
	.getElementById("deleteButton")
	.addEventListener("click", async () =>
		deleteStudent(window.studentState.studentId)
	);
document.getElementById("editButton").addEventListener("click", editStudent);
document.getElementById("deleteYearButton").addEventListener("click", async () => deleteYear(window.studentState.studentId));
document.getElementById("student-filter").addEventListener("input", () => generateTable());
document.getElementById("year-filter").addEventListener("input", () => generateTable());
document.getElementById("main").addEventListener("click", (event) => {
	if (!document.getElementById("content").contains(event.target)) {
		deselectStudent();
	}
});

async function generateTable() {
	const studentData = getFilteredStudents();

	const sorted = [...studentData].sort((a, b) => {
		const dir = sortState.direction === "asc" ? 1 : -1;
		switch (sortState.column) {
			case "name":
				return dir * (a.name || "").localeCompare(b.name || "", "de", { sensitivity: "base" });
			case "graduation_year":
				return dir * ((a.graduation_year ?? 0) - (b.graduation_year ?? 0));
			case "birthday": {
				const aHas = !!a.birthday;
				const bHas = !!b.birthday;
				if (!aHas && !bHas) return 0;
				if (!aHas) return 1;
				if (!bHas) return -1;
				const da = Date.parse(a.birthday);
				const dbb = Date.parse(b.birthday);
				return dir * (da - dbb);
			}
			default:
				return 0;
		}
	});

	let table = "<table>";
	const headers = [
		{ label: "Name", col: "name" },
		{ label: "Abijahrgang", col: "graduation_year" },
		{ label: "Geburtsdatum", col: "birthday" },
	];
	table += "<thead><tr>";
	for (const h of headers) {
		const active = sortState.column === h.col;
		const arrow = active ? (sortState.direction === "asc" ? " ▲" : " ▼") : "";
		table += `<th data-sort="${h.col}" style="cursor:pointer; user-select:none; position:sticky; top:0; background-color:#f4f4f4; z-index:10;">${h.label}${arrow}</th>`;
	}
	table += "</tr></thead>";

	table += "<tbody>";
	for (const student of sorted) {
		table += `<tr class="student-row" data-id="${student.student_id}">
			<td>${student.name}</td>
			<td>${student.graduation_year ?? ""}</td>
			<td>${
				student.birthday
					? student.birthday.split("-").reverse().join(".")
					: ""
			}</td>
		</tr>`;
	}
	table += "</tbody></table>";

	document.getElementById("table-container").innerHTML = table;

	document
		.querySelectorAll("th[data-sort]")
		.forEach((th) =>
			th.addEventListener("click", () => toggleSort(th.getAttribute("data-sort")))
		);
	setTimeout(() => {
		const rows = document.querySelectorAll(".student-row");
		for (const row of rows) {
			const studentId = row.getAttribute("data-id");
			row.addEventListener("click", () =>
				selectStudentInStudentEdit(row, studentId),
			);
		}
	}, 0);
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
	scrollRowIntoView(row);
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
		height: 460,
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
	allStudents = allStudents.filter(s => s.student_id !== studentId);
	deselectStudent();
	generateTable();
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
		{ title: "Mint-EC", kind: "warning" },
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
