const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");
import { select_student } from "./main.js";
async function init() {
  await generateTable();
  if (window.studentState.studentId != 0) {
    const row = document.querySelector(
      `[data-id="${window.studentState.studentId}"]`
    );
    if (row) {
      selectStudentInStudentEdit(row, window.studentState.studentId);
    }
  }
}

document.getElementById("editButton").addEventListener("click", editStudent);
document.getElementById("main").addEventListener("click", function (event) {
  if (!document.getElementById("content").contains(event.target)) {
    deselectStudent();
  }
});

async function generateTable() {
  let studentData = await db.select(
    "SELECT student_id, name, birthday FROM students"
  );
  let table = "<table>";
  table += "<thead>";
  table += "<tr><th>Name</th><th>Stufe</th><th>Geburtsdatum</th></tr>";
  table += "</thead>";
  table += "<tbody>";

  studentData.forEach((student) => {
    table += `<tr class="student-row" data-id="${student.student_id}" >
                    <td>${student.name}</td>
                    <td>temp</td>
                    <td>${
                      student.birthday
                        ? student.birthday.split("-").reverse().join(".")
                        : ""
                    }</td>
                  </tr>`;
  });

  // I don't know why, but it doesn't work without the Timeout of 0ms??????
  setTimeout(() => {
    document.querySelectorAll(".student-row").forEach((row) => {
      const studentId = row.getAttribute("data-id");
      row.addEventListener("click", (event) =>
        selectStudentInStudentEdit(row, studentId)
      );
    });
  }, 0);

  table += "</tbody>";
  table += "</table>";

  document.getElementById("table-container").innerHTML = table;
}

async function selectStudentInStudentEdit(row, studentId) {
  document
    .querySelectorAll(".student-row")
    .forEach((r) => r.classList.remove("selected"));

  row.classList.add("selected");
  select_student(parseInt(studentId), row.querySelector("td").textContent);

  const deleteButton = document.getElementById("deleteButton");
  const editButton = document.getElementById("editButton");

  deleteButton.removeAttribute("disabled");
  editButton.removeAttribute("disabled");
}

async function deselectStudent() {
  document.getElementById("deleteButton").setAttribute("disabled", "true");
  document.getElementById("editButton").setAttribute("disabled", "true");
  document
    .querySelectorAll(".student-row")
    .forEach((r) => r.classList.remove("selected"));
}

async function editStudent() {
  const selectedRow = document.querySelector(".student-row.selected");
  if (selectedRow) {
    const studentId = selectedRow.getAttribute("data-id");
    const student = studentData.find((s) => s.id == studentId);
    if (student) {
      const newName = prompt("Neuen Namen eingeben:", student.name);
      const newstufe = prompt("Neue stufe eingeben:", student.stufe);
      const newGeburtsdatum = prompt(
        "Neues Geburtsdatum eingeben (YYYY-MM-DD):",
        student.geburtsdatum
      );

      if (newName && newstufe && newGeburtsdatum) {
        student.name = newName;
        student.stufe = newstufe;
        student.geburtsdatum = newGeburtsdatum;
        generateTable();
      }
    }
  }
}

init();
