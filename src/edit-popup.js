const { getCurrentWindow } = window.__TAURI__.window;
const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");
const emit = window.__TAURI__.event.emit;

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
  await db.execute(
    "UPDATE students SET name = $1, graduation_year = $2 birthday = $3 WHERE student_id = $4",
    [nameField.value, graduationYearField.value, geburtsdatumField.value, studentId]
  );
  closeWindow();
}

function closeWindow() {
  const currentWindow = getCurrentWindow();
  emit("edit-popup-closed");
  currentWindow.close();
}
