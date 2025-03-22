const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");

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
    table += `<tr class="student-row" data-id="${
      student.student_id
    }" onclick="selectStudent(event, ${student.id})">
                    <td>${student.name}</td>
                    <td>temp</td>
                    <td>${
                      student.birthday
                        ? student.birthday.split("-").reverse().join(".")
                        : ""
                    }</td>
                  </tr>`;
  });

  table += "</tbody>";
  table += "</table>";

  document.getElementById("table-container").innerHTML = table;
}

async function selectStudentInStudentEdit(event, studentId) {
  const row = event.currentTarget;
  const isSelected = row.classList.contains("selected");

  document
    .querySelectorAll(".student-row")
    .forEach((r) => r.classList.remove("selected"));

  if (!isSelected) {
    row.classList.add("selected");
    console.log("Ausgewählter Schüler ID: " + studentId);
    // Speichern der ID im localStorage
    localStorage.setItem("selectedStudentId", studentId);
  }

  // Schalter für die Buttons (Bearbeiten und Löschen)
  const selectedRows = document.querySelectorAll(".student-row.selected");
  const deleteButton = document.getElementById("deleteButton");
  const editButton = document.getElementById("editButton");

  if (selectedRows.length > 0) {
    deleteButton.removeAttribute("disabled");
    editButton.removeAttribute("disabled");

    deleteButton.classList.add("selected");
    editButton.classList.add("selected");
  } else {
    deleteButton.setAttribute("disabled", "true");
    editButton.setAttribute("disabled", "true");

    deleteButton.classList.remove("selected");
    editButton.classList.remove("selected");
  }

  // Den Namen des ausgewählten Schülers anzeigen
  const selectedStudent = studentData.find(
    (student) => student.id == studentId
  );
  if (selectedStudent) {
    document.getElementById("student-name").textContent = selectedStudent.name;
  }
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

window.onload = async function () {
  generateTable();

  // Prüfen, ob eine Schüler-ID im localStorage gespeichert ist
  const selectedStudentId = window.studentState.studentID;
  if (selectedStudentId != 0) {
    const selectedRow = document.querySelector(
      `.student-row[data-id="${selectedStudentId}"]`
    );
    if (selectedRow) {
      selectedRow.classList.add("selected");
      // Den Namen des ausgewählten Schülers anzeigen
      const selectedStudent = studentData.find(
        (student) => student.student_id == selectedStudentId
      );
      if (selectedStudent) {
        document.getElementById("student-name").textContent =
          selectedStudent.name;
      }

      // Schalter für die Buttons
      const deleteButton = document.getElementById("deleteButton");
      const editButton = document.getElementById("editButton");

      deleteButton.removeAttribute("disabled");
      editButton.removeAttribute("disabled");

      deleteButton.classList.add("selected");
      editButton.classList.add("selected");
    }
  }
};
