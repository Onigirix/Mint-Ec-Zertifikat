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
  const form = document.getElementById("facharbeitForm");
  console.log(noteElem);
  const noteLabel = document.getElementById("note_label");
  if (selected === "4" || selected === "5") {
    // Create a select element for the note.
    const selectLevel = document.createElement("select");
    selectLevel.id = "level";

    let option1 = document.createElement("option");
    option1.value = "0";
    option1.text = "Bitte wählen";
    let option2 = document.createElement("option");
    option2.value = "10";
    option2.text = "Teilnahme am Regionalwettbewerb";
    let option3 = document.createElement("option");
    option3.value = "12";
    option3.text = "Preisträger im Regionalwettbewerb";
    let option4 = document.createElement("option");
    option4.value = "15";
    option4.text = "Teilnahme am Landes- oder Bundeswettbewerb";
    selectLevel.appendChild(option1);
    selectLevel.appendChild(option2);
    selectLevel.appendChild(option3);
    selectLevel.appendChild(option4);
    let levelLabel = document.createElement("label");
    levelLabel.textContent = "Welche Leistungsstufe wurde erreicht?";
    let levelDescription = document.createElement("input");
    levelDescription.type = "text";
    levelDescription.id = "levelDescription";
    levelDescription.placeholder = "Was wurde in dem Wettbewerb erreicht?";
    let levelDescriptionLabel = document.createElement("label");
    levelDescriptionLabel.textContent = "Ergebnis der Wettbewerbsteilnahme:";
    levelDescriptionLabel.htmlFor = "levelDescription";

    form.appendChild(levelDescriptionLabel);
    form.appendChild(levelDescription);
    form.replaceChild(selectLevel, noteElem);
    form.replaceChild(levelLabel, noteLabel);

    let submitBtn = document.getElementById("submitBtn");
    submitBtn.remove();
    form.appendChild(submitBtn);
  } else {
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
