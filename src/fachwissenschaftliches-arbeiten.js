const Database = window.__TAURI__.sql;
const invoke = window.__TAURI__.core.invoke;
const db = await Database.load("sqlite://resources/db.sqlite");

async function fill_fields(studentId) {
  const res1 = await db.select(
    "SELECT type_of_paper, topic_of_paper, description_of_paper, grade_of_paper FROM students WHERE student_id = $1",
    [studentId]
  );
  document.getElementById("arbeitTyp").value = res1[0]["type_of_paper"];
  document.getElementById("thema").value = res1[0]["topic_of_paper"];
  document.getElementById("beschreibung").value =
    res1[0]["description_of_paper"];
  document.getElementById("note").value = res1[0]["grade_of_paper"];
}

document.addEventListener("studentChanged", async (e) => {
  const { studentId } = e.detail;
  await fill_fields(studentId);
});

async function save_form() {
  await db.execute(
    "UPDATE students SET type_of_paper = $1, topic_of_paper = $2, description_of_paper = $3, grade_of_paper = $4 WHERE student_id = $5",
    [
      document.getElementById("arbeitTyp").value,
      document.getElementById("thema").value,
      document.getElementById("beschreibung").value,
      document.getElementById("note").value,
      window.studentState.studentId,
    ]
  );
}

document
  .getElementById("facharbeitForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    await save_form();
  });
