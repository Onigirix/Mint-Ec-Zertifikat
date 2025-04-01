const Database = window.__TAURI__.sql;
const { WebviewWindow } = window.__TAURI__.webviewWindow;
const { Webview } = window.__TAURI__.webview;
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
    height: 280,
    minimizable: false,
    url: "edit-schueler-popup.html?id=" + window.studentState.studentId,
  });
  studentPopupWebview.once("tauri://created", function () {});
  studentPopupWebview.once("tauri://error", async function (e) {
    if (e.payload == "a webview with label `studentPopup` already exists") {
      const studentPopupWindow = await Webview.getByLabel("studentPopup");
      await studentPopupWindow.setFocus();
    }
  });
}

init();
