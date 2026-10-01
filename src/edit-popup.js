import { getDb } from './db-connection.js';

const { getCurrentWindow } = window.__TAURI__.window;
const invoke = window.__TAURI__.core.invoke;

let db = null;
const dbReady = getDb().then(instance => { db = instance; });
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
const schoolField = document.getElementById("school");

await dbReady;
const [student] = await db.select(
  "SELECT name, graduation_year, birthday, school_id FROM students WHERE student_id = $1",
  [studentId]
);

const schools = await db.select("SELECT school_id, school_name FROM schools ORDER BY school_id");
for (const school of schools) {
  const option = document.createElement("option");
  option.value = school.school_id;
  option.textContent = school.school_name;
  schoolField.append(option);
}

nameField.value = student.name;
graduationYearField.value = student.graduation_year;
geburtsdatumField.value = student.birthday;
schoolField.value = String(student.school_id ?? schools[0]?.school_id ?? "");


closeButton.addEventListener("click", () => {
  closeWindow();
});

Form.addEventListener("submit", async (e) => {
  e.preventDefault();
  await formSubmitted(e);
});

async function formSubmitted() {
  const name = nameField.value.trim();
  const graduationYear = Number.parseInt(graduationYearField.value, 10);
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
  await dbReady;

  await db.execute(
    "UPDATE students SET name = $1, graduation_year = $2, birthday = $3, school_id = $4 WHERE student_id = $5",
    [nameField.value, graduationYearField.value, geburtsdatumField.value, Number(schoolField.value), studentId]
  );
  closeWindow();
}

function closeWindow() {
  const currentWindow = getCurrentWindow();
  emit("edit-popup-closed");
  currentWindow.close();
}
