const Database = window.__TAURI__.sql;
const invoke = window.__TAURI__.core.invoke;
const db = await Database.load("sqlite://resources/db.sqlite");
const form = document.getElementById("facharbeitForm");
const gesamtDurchschnittElement = document.getElementById("gesamtDurchschnitt");
let formInputs = form.querySelectorAll("input, select, textarea");
let option_4_5_selected = false;

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

formInputs.forEach((input) => {
  input.addEventListener("input", (e) => {
    form.style.border = "2px solid red";
  });
});

async function fill_fields(studentId) {
  if (studentId != 0) {
    const db_res = await db.select(
      "SELECT type_of_paper, topic_of_paper, description_of_paper, grade_of_paper, level_of_competition FROM students WHERE student_id = $1",
      [studentId]
    );
    const type_of_paper = parseInt(db_res[0]["type_of_paper"]);
    console.log(type_of_paper);
    if (type_of_paper != 0) {
      document.getElementById("arbeitTyp").value = type_of_paper;
      typeChanged(type_of_paper);
      document.getElementById("thema").value = db_res[0]["topic_of_paper"];
      document.getElementById("beschreibung").value =
        db_res[0]["description_of_paper"];
      document.getElementById("level").value = db_res[0]["grade_of_paper"];
      if (type_of_paper == 4 || type_of_paper == 5) {
        document.getElementById("levelDescription").value =
          db_res[0]["level_of_competition"];
      }
    }
    changeStufe(db_res[0]["grade_of_paper"]);
  }
}

document.addEventListener("studentChanged", async (e) => {
  const { studentId } = e.detail;
  await fill_fields(studentId);
});

async function save_form() {
  if (!option_4_5_selected) {
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
  } else {
    await db.execute(
      "UPDATE students SET type_of_paper = $1, topic_of_paper = $2, description_of_paper = $3, grade_of_paper = $4, level_of_competition = $5 WHERE student_id = $6",
      [
        document.getElementById("arbeitTyp").value,
        document.getElementById("thema").value,
        document.getElementById("beschreibung").value,
        document.getElementById("level").value,
        document.getElementById("levelDescription").value,
        window.studentState.studentId,
      ]
    );
  }
  form.style.border = "";
}

document
  .getElementById("facharbeitForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    await save_form();
  });

document.getElementById("arbeitTyp").addEventListener("change", (e) => {
  typeChanged(e.target.value);
});

async function typeChanged(selected) {
  const noteElem = document.getElementById("level");
  const noteLabel = document.getElementById("note_label");
  if (selected == 4 || selected == 5) {
    // Create a select element for the note.
    if (!option_4_5_selected) {
      const selectLevel = document.createElement("select");
      selectLevel.id = "level";

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
      levelDescriptionLabel.textContent =
        "Was wurde in dem Wettbewerb erreicht?";

      form.replaceChild(levelDescriptionLabel, noteLabel);
      form.replaceChild(levelDescription, noteElem);
      form.appendChild(levelLabel);
      form.appendChild(selectLevel);

      const gesamtDurchschnittDiv = document.querySelector(
        ".gesamt-durchschnitt"
      );
      if (gesamtDurchschnittDiv) {
        gesamtDurchschnittDiv.style.display = "flex";
        gesamtDurchschnittDiv.style.alignItems = "center";
        gesamtDurchschnittDiv.style.justifyContent = "flex-end";
      }

      selectLevel.addEventListener("change", (e) => {
        changeStufe(e.target.value);
      });

      option_4_5_selected = true;
    }
  } else if (option_4_5_selected) {
    const numberInputLabel = document.createElement("label");
    numberInputLabel.htmlFor = "note";
    numberInputLabel.textContent = "Note:";
    numberInputLabel.id = "note_label";
    const numberInput = document.createElement("input");
    numberInput.type = "number";
    numberInput.id = "level";
    numberInput.min = "1";
    numberInput.max = "15";
    numberInput.step = "1";
    const levelDescriptionInput = document.getElementById("levelDescription");
    const levelDescriptionLabel = document.getElementById(
      "levelDescriptionLabel"
    );
    const levelLabel = document.getElementById("levelLabel");
    const levelSelect = document.querySelector("select#level");

    if (levelDescriptionInput && levelDescriptionLabel) {
      form.replaceChild(numberInput, levelDescriptionInput);
      form.replaceChild(numberInputLabel, levelDescriptionLabel);
    }

    if (levelLabel) levelLabel.remove();
    if (levelSelect) levelSelect.remove();

    option_4_5_selected = false;
    const gesamtDurchschnittDiv = document.querySelector(
      ".gesamt-durchschnitt"
    );
    if (gesamtDurchschnittDiv) {
      gesamtDurchschnittDiv.style.display = "";
      gesamtDurchschnittDiv.style.alignItems = "";
      gesamtDurchschnittDiv.style.justifyContent = "";
    }

    numberInput.addEventListener("input", (e) => {
      changeStufe(e.target.value);
    });
  }
  formInputs = form.querySelectorAll("input, select, textarea");
  formInputs.forEach((input) => {
    input.addEventListener("input", (e) => {
      form.style.border = "2px solid red";
    });
  });
}
document.addEventListener("studentChanged", async (e) => {
  const { studentId } = e.detail;
  await fill_fields(studentId);
});

document.getElementById("level").addEventListener("input", (e) => {
  changeStufe(e.target.value);
});

try {
  fill_fields(window.studentState.studentId);
} catch (error) {}

async function changeStufe(new_value) {
  gesamtDurchschnittElement.classList.remove(
    "grade-default",
    "grade-red",
    "grade-orange",
    "grade-yellow",
    "grade-green"
  );

  if (new_value == 0) {
    gesamtDurchschnittElement.classList.add("grade-default");
    gesamtDurchschnittElement.textContent = "-";
  } else if (new_value < 9) {
    gesamtDurchschnittElement.classList.add("grade-red");
    gesamtDurchschnittElement.textContent = "-";
  } else if (new_value < 11) {
    gesamtDurchschnittElement.classList.add("grade-orange");
    gesamtDurchschnittElement.textContent = "1";
  } else if (new_value < 13) {
    gesamtDurchschnittElement.classList.add("grade-yellow");
    gesamtDurchschnittElement.textContent = "2";
  } else {
    gesamtDurchschnittElement.classList.add("grade-green");
    gesamtDurchschnittElement.textContent = "3";
  }
}
