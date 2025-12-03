import { getDb } from './db-connection.js';

const { getCurrentWindow } = window.__TAURI__.window;
const invoke = window.__TAURI__.core.invoke;

const db = await getDb();
const emit = window.__TAURI__.event.emit;

// Async confirmation dialog
function asyncConfirm(message) {
	return new Promise((resolve) => {
		const result = confirm(message);
		resolve(result);
	});
}

const closeButton = document.getElementById("schuelerAbbrechen");
const Form = document.getElementById("schuelerForm");
const studentId = new URLSearchParams(window.location.search).get("id");
const nameField = document.getElementById("name");
const graduationYearField = document.getElementById("abijahr");
const geburtsdatumField = document.getElementById("geburtsdatum");

const [student] = await db.select(
  "SELECT name, graduation_year, birthday FROM students WHERE student_id = $1",
  [studentId]
);

nameField.value = student.name;
graduationYearField.value = student.graduation_year;
geburtsdatumField.value = student.birthday;


closeButton.addEventListener("click", () => {
  closeWindow();
});

Form.addEventListener("submit", async (e) => {
  e.preventDefault();
  await formSubmitted(e);
});

async function formSubmitted(e) {
  const graduationYear = parseInt(graduationYearField.value);
  const birthDate = new Date(geburtsdatumField.value);
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

  await db.execute(
    "UPDATE students SET name = $1, graduation_year = $2, birthday = $3 WHERE student_id = $4",
    [nameField.value, graduationYearField.value, geburtsdatumField.value, studentId]
  );
  closeWindow();
}

function closeWindow() {
  const currentWindow = getCurrentWindow();
  emit("edit-popup-closed");
  currentWindow.close();
}
