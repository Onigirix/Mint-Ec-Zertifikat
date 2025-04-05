const Database = window.__TAURI__.sql;
const invoke = window.__TAURI__.core.invoke;
const db = await Database.load("sqlite://resources/db.sqlite");
const gradeFields = document.querySelectorAll(".note");
const subjectFields = document.querySelectorAll(".subject");

document.addEventListener("studentChanged", async (e) => {
	const { studentId } = e.detail;
	await fill_fields(studentId);
});

async function fill_fields(studentId) {
	const res1 = await db.select("SELECT * FROM students WHERE student_id = $1", [
		studentId,
	]);
	const data = res1[0];
	if (data) {
		for (const field of gradeFields) {
			const course = field.dataset.course;
			const semester = field.dataset.semester;
			const value = data[`grade_${course}_${semester}`];
			if (value !== null && value !== undefined) {
				field.value = value;
			} else {
				field.value = "";
			}
		}

		// Fill subject fields
		for (const field of subjectFields) {
			const course = field.dataset.course;
			const value = data[`subject_${course}`];
			if (value !== null && value !== undefined) {
				field.value = value;
			} else {
				field.value = "";
			}
		}

		const event = new CustomEvent("fields_filled");
		document.dispatchEvent(event);
	}
}

for (const field of gradeFields) {
	field.addEventListener("keyup", (e) => {
		if (e.keyCode !== 13 && e.keyCode !== 9) {
			if (field.value !== "") {
				field.style.border = "1px solid red";
				field.style.backgroundColor = "rgb(255, 150, 150)";
			}
		}
	});
	field.addEventListener("blur", async (e) => {
		const res1 = await db.execute(
			`UPDATE students SET grade_${field.dataset.course}_${field.dataset.semester} = $1 WHERE student_id = $2`,
			[field.value, window.studentState.studentId],
		);
		field.style.border = "1px solid #ccc";
		field.style.backgroundColor = "white";
	});
	field.addEventListener("keydown", async (e) => {
		if (e.keyCode === 9) {
			//Enter or Tab
			const res1 = await db.execute(
				`UPDATE students SET grade_${field.dataset.course}_${field.dataset.semester} = $1 WHERE student_id = $2`,
				[field.value, window.studentState.studentId],
			);
			field.style.border = "1px solid #ccc";
			field.style.backgroundColor = "white";
		} else if (e.keyCode === 13) {
			e.preventDefault();
			const res1 = await db.execute(
				`UPDATE students SET grade_${field.dataset.course}_${field.dataset.semester} = $1 WHERE student_id = $2`,
				[field.value, window.studentState.studentId],
			);
			field.style.border = "1px solid #ccc";
			field.style.backgroundColor = "white";
		}
	});
}

for (const field of subjectFields) {
	field.addEventListener("keyup", (e) => {
		if (e.keyCode !== 13 && e.keyCode !== 9) {
			if (field.value !== "") {
				field.style.border = "1px solid red";
				field.style.backgroundColor = "rgb(255, 150, 150)";
			}
		}
	});
	field.addEventListener("blur", async (e) => {
		await db.execute(
			`UPDATE students SET subject_${field.dataset.course} = $1 WHERE student_id = $2`,
			[field.value, window.studentState.studentId],
		);
		field.style.border = "1px solid #ccc";
		field.style.backgroundColor = "white";
	});
	/*field.addEventListener("keydown", async (e) => {
    if (e.keyCode === 9) {
      //Enter or Tab
      const res1 = await db.execute(
        "UPDATE students SET subject_" +
          field.dataset.course +
          " = $1 WHERE student_id = $2"[
            (field.value, window.studentState.studentId)
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
            (field.value, window.studentState.studentId)
          ]
      );
      field.style.border = "1px solid #ccc";
      field.style.backgroundColor = "white";
    }
  });*/
}
