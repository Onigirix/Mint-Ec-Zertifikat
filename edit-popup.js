const { getCurrentWindow } = window.__TAURI__.window;
const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");
const emit = window.__TAURI__.event.emit;

const closeButton = document.getElementById("schuelerAbbrechen");
const Form = document.getElementById("schuelerForm");
const studentId = new URLSearchParams(window.location.search).get("id");
const nameField = document.getElementById("name");
const geburtsdatumField = document.getElementById("geburtsdatum");

const [student] = await db.select(
  "SELECT name, birthday FROM students WHERE student_id = $1",
  [studentId]
);

nameField.value = student.name;
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
    "UPDATE students SET name = $1, birthday = $2 WHERE student_id = $3",
    [nameField.value, geburtsdatumField.value, studentId]
  );
  closeWindow();
}
function closeWindow() {
  const currentWindow = getCurrentWindow();
  emit("edit-popup-closed");
  currentWindow.close();
}
