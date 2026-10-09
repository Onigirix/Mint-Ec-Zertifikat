import { getDb } from './db-connection.js';
import { validateGradeInput } from './grade-validation.js';

const invoke = window.__TAURI__.core.invoke;

let db = null;
const dbReady = getDb().then(instance => { db = instance; });
const gradeFields = document.querySelectorAll(".note");
const subjectFields = document.querySelectorAll(".subject");
const saveChains = new Map();
const pendingSaves = new Set();

function saveField(field, studentId) {
	const value = field.value;
	const save = async () => {
		await dbReady;
		const column = field.classList.contains("note")
			? `grade_${field.dataset.course}_${field.dataset.semester}`
			: `subject_${field.dataset.course}`;
		await db.execute(
			`UPDATE students SET ${column} = $1 WHERE student_id = $2`,
			[value, studentId],
		);
	};
	const previousSave = saveChains.get(field) ?? Promise.resolve();
	const currentSave = previousSave.catch(() => {}).then(save);
	saveChains.set(field, currentSave);
	pendingSaves.add(currentSave);
	currentSave.then(() => {
		if (saveChains.get(field) === currentSave) {
			saveChains.delete(field);
		}
		pendingSaves.delete(currentSave);
	}, () => {
		if (saveChains.get(field) === currentSave) {
			saveChains.delete(field);
		}
		pendingSaves.delete(currentSave);
	});
	return currentSave;
}

async function flushCompetenceSaves() {
	while (pendingSaves.size > 0) {
		await Promise.all([...pendingSaves]);
	}
}

window.__flushCompetenceSaves = flushCompetenceSaves;

document.addEventListener("studentChanged", async (e) => {
	const { studentId } = e.detail;
	await fill_fields(studentId);
});

async function fill_fields(studentId) {
	await dbReady;
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
	field.addEventListener("input", () => {
		validateGradeInput(field);
		if (validateGradeInput(field)) {
			void saveField(field, window.studentState.studentId).catch(error => {
				console.error("Could not save grade input:", error);
			});
		}
	});
	field.addEventListener("keyup", async (e) => {
		if (e.key !== "Enter" && e.key !== "Tab") {
			await dbReady;
			if (field.value !== "") {
				field.style.border = "1px solid red";
				field.style.backgroundColor = "rgb(255, 150, 150)";
			}
		}
	});
	field.addEventListener("blur", async (e) => {
		if (!validateGradeInput(field)) {
			field.reportValidity();
			return;
		}
		const studentId = window.studentState.studentId;
		await saveField(field, studentId);
		field.style.border = "1px solid #ccc";
		field.style.backgroundColor = "white";
	});
	field.addEventListener("keydown", async (e) => {
		if (e.key === "Tab") {
			//Enter or Tab
			if (!validateGradeInput(field)) {
				e.preventDefault();
				field.reportValidity();
				return;
			}
			const studentId = window.studentState.studentId;
			await saveField(field, studentId);
			field.style.border = "1px solid #ccc";
			field.style.backgroundColor = "white";
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (!validateGradeInput(field)) {
				field.reportValidity();
				return;
			}
			const studentId = window.studentState.studentId;
			await saveField(field, studentId);
			field.style.border = "1px solid #ccc";
			field.style.backgroundColor = "white";
		}
	});
}

for (const field of subjectFields) {
	field.addEventListener("input", () => {
		void saveField(field, window.studentState.studentId).catch(error => {
			console.error("Could not save subject input:", error);
		});
	});
	field.addEventListener("keyup", (e) => {
		if (e.key !== "Enter" && e.key !== "Tab") {
			if (field.value !== "") {
				field.style.border = "1px solid red";
				field.style.backgroundColor = "rgb(255, 150, 150)";
			}
		}
	});
	field.addEventListener("blur", async (e) => {
		const studentId = window.studentState.studentId;
		await saveField(field, studentId);
		field.style.border = "1px solid #ccc";
		field.style.backgroundColor = "white";
	});
	/*field.addEventListener("keydown", async (e) => {
    if (e.key === "Tab") {
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
    } else if (e.key === "Enter") {
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
