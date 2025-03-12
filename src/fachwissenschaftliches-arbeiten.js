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
  document.getElementById("level").value = res1[0]["grade_of_paper"];
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
      document.getElementById("level").value,
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

document.getElementById("arbeitTyp").addEventListener("change", (e) => {
  const selected = e.target.value;
  const noteElem = document.getElementById("note");
  if (selected === "2") {
    // Create a select element for the note.
    const selectLevel = document.createElement("select");
    selectLevel.id = "level";

    for (let i = 1; i <= 15; i++) {
      let option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      selectLevel.appendChild(option);
    }
    // Replace the note input with the select dropdown.
    noteElem.parentNode.replaceChild(selectLevel, noteElem);
  } else {
    // If another option is selected and a dropdown is in place,
    // switch back to an input element.
    if (noteElem.tagName.toLowerCase() === "select") {
      const numberInput = document.createElement("input");
      numberInput.type = "number";
      numberInput.id = "note";
      numberInput.min = "1";
      numberInput.max = "15";
      numberInput.step = "1";
      // Replace back to the number input.
      noteElem.parentNode.replaceChild(numberInput, noteElem);
    }
  }
});
