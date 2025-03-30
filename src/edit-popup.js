const { getCurrent } = window.__TAURI__.window;
const Database = window.__TAURI__.sql;
const db = await Database.load("sqlite://resources/db.sqlite");

const closeButton = document.getElementById("schuelerAbbrechen");
const Form = document.getElementById("schuelerForm");
const studentId = new URLSearchParams(window.location.search).get("id");

closeButton.addEventListener("click", () => {
  closeWindow();
});

document.getElementById;

Form.addEventListener("submit", async (e) => {});

function closeWindow() {
  const currentWindow = getCurrent();
  currentWindow.close();
}

async function formSubmitted() {
  e.preventDefault();
  await db.execute(
    "UPDATE students SET name = $1, birthday = $2 WHERE id = $3",
    [
      e.target.vorname.value + " " + e.target.nachname.value,
      e.target.geburtsdatum.value,
      studentId,
    ]
  );
  closeWindow();
}
