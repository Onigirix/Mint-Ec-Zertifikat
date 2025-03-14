const Database = window.__TAURI__.sql;
const invoke = window.__TAURI__.core.invoke;
const db = await Database.load("sqlite://resources/db.sqlite");

async function fill_fields(studentId) {
  if (studentId != 0) {
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
    levelLabel.id = "levelLabel";
    levelLabel.textContent = "Welcher Leistungsstufe entspricht dies?";
    let levelDescription = document.createElement("input");
    levelDescription.type = "text";
    levelDescription.id = "levelDescription";
    let levelDescriptionLabel = document.createElement("label");
    levelDescriptionLabel.htmlFor = "levelDescription";
    levelDescriptionLabel.id = "levelDescriptionLabel";
    levelDescriptionLabel.textContent = "Was wurde in dem Wettbewerb erreicht?";

    form.replaceChild(levelDescriptionLabel, noteLabel);
    form.replaceChild(levelDescription, noteElem);
    form.appendChild(levelLabel);
    form.appendChild(selectLevel);

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.remove();
    form.appendChild(submitBtn);
  } else {
    const numberInputLabel = document.createElement("label");
    numberInputLabel.htmlFor = "note";
    numberInputLabel.textContent = "Note:";
    numberInputLabel.id = "note_label";
    const numberInput = document.createElement("input");
    numberInput.type = "number";
    numberInput.id = "note";
    numberInput.min = "1";
    numberInput.max = "15";
    numberInput.step = "1";
    form.replaceChild(numberInput, document.getElementById("levelDescription"));
    form.replaceChild(
      numberInputLabel,
      document.getElementById("levelDescriptionLabel")
    );
    document.getElementById("level").remove();
    document.getElementById("levelLabel").remove();
  }
});
