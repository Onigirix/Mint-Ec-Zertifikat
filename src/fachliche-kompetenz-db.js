const Database = window.__TAURI__.sql;
const invoke = window.__TAURI__.core.invoke;
const db = await Database.load("sqlite://resources/db.sqlite");
const gradeFields = document.querySelectorAll(".note");
const subjectFields = document.querySelectorAll(".subject");

gradeFields.forEach(function (field) {
  field.addEventListener("keyup", (e) => {
    if (e.keyCode != 13 && e.keyCode != 9) {
      if (field.value != "") {
        field.style.border = "1px solid red";
        field.style.backgroundColor = "rgb(255, 150, 150)";
      }
    }
  });
  field.addEventListener("blur", async (e) => {
    const res1 = await db.execute(
      "UPDATE students SET grade_" +
        field.dataset.course +
        "_" +
        field.dataset.semester +
        " = $1 WHERE student_id = $2",
      [field.value, await invoke("get_student_id")]
    );
    field.style.border = "1px solid #ccc";
    field.style.backgroundColor = "white";
  });
  field.addEventListener("keydown", async (e) => {
    if (e.keyCode === 9) {
      //Enter or Tab
      const res1 = await db.execute(
        "UPDATE students SET grade_" +
          field.dataset.course +
          "_" +
          field.dataset.semester +
          " = $1 WHERE student_id = $2",
        [field.value, await invoke("get_student_id")]
      );
      field.style.border = "1px solid #ccc";
      field.style.backgroundColor = "white";
    } else if (e.keyCode === 13) {
      e.preventDefault();
      const res1 = await db.execute(
        "UPDATE students SET grade_" +
          field.dataset.course +
          "_" +
          field.dataset.semester +
          " = $1 WHERE student_id = $2",
        [field.value, await invoke("get_student_id")]
      );
      field.style.border = "1px solid #ccc";
      field.style.backgroundColor = "white";
    }
  });
});

subjectFields.forEach(function (field) {
  field.addEventListener("keyup", (e) => {
    if (e.keyCode != 13 && e.keyCode != 9) {
      if (field.value != "") {
        field.style.border = "1px solid red";
        field.style.backgroundColor = "rgb(255, 150, 150)";
      }
    }
  });
  field.addEventListener("blur", async (e) => {
    if (field.value == "") {
    } else {
      const res1 = await db.execute(
        "UPDATE students SET subject_" +
          field.dataset.course +
          " = $1 WHERE student_id = $2"[
            (field.value, await invoke("get_student_id"))
          ]
      );
      field.style.border = "1px solid #ccc";
      field.style.backgroundColor = "white";
    }
  });
  field.addEventListener("keydown", async (e) => {
    if (e.keyCode === 9) {
      //Enter or Tab
      const res1 = await db.execute(
        "UPDATE students SET subject_" +
          field.dataset.course +
          " = $1 WHERE student_id = $2"[
            (field.value, await invoke("get_student_id"))
          ]
      );
      field.style.border = "1px solid #ccc";
      field.style.backgroundColor = "white";
    } else if (e.keyCode === 13) {
      e.preventDefault();
      const res1 = await db.execute(
        "UPDATE students SET subject_" +
          field.dataset.course +
          " = $1 WHERE student_id = $2"[
            (field.value, await invoke("get_student_id"))
          ]
      );
      field.style.border = "1px solid #ccc";
      field.style.backgroundColor = "white";
    }
  });
});
