import { validateGradeInput } from './grade-validation.js';

const noteInputs = document.querySelectorAll(".note");
const courseAverages = document.querySelectorAll('[id^="avg-"]');
const gesamtDurchschnittElement = document.getElementById("gesamtStufe"); //namensverwechslung mit gesamtStufe
const gesamtStufeElement = document.getElementById("gesamtDurchschnitt"); //namensverwechslung mit gesamtDurchschnitt

// Function to calculate the average for a course
function calculateCourseAverage(course) {
	let sum = 0;
	let count = 0;
	const inputs = document.querySelectorAll(`.note[data-course="${course}"]`);
	for (const input of inputs) {
		const value = Number.parseFloat(input.value);
		if (!Number.isNaN(value)) {
			sum += value;
			count++;
		}
	}
	return count > 0 ? (sum / count).toFixed(2) : "0.00";
}

function hasFailingGradeInCourse(course) {
	const inputs = document.querySelectorAll(`.note[data-course="${course}"]`);
	for (const input of inputs) {
		const value = parseFloat(input.value);
		if (value < 5) {
			return true;
		}
	}
	return false;
}

function hasAllGradesInCourse(course) {
	const inputs = document.querySelectorAll(`.note[data-course="${course}"]`);
	return inputs.length === 4
		&& [...inputs].every((input) => input.value !== "" && validateGradeInput(input));
}

function calculateBestAverage() {
	if ([...noteInputs].some((input) => !validateGradeInput(input))) {
		gesamtDurchschnittElement.classList.remove(
			"grade-red",
			"grade-orange",
			"grade-yellow",
			"grade-green",
		);
		gesamtDurchschnittElement.classList.add("grade-default");
		gesamtStufeElement.textContent = "-";
		return "-";
	}

	const averages = Array.from({ length: 5 }, (_, index) =>
		Number.parseFloat(document.getElementById(`avg-${index + 1}`).textContent));
	const valid = averages.map((average, index) =>
		hasAllGradesInCourse(index + 1) && average >= 9 && !hasFailingGradeInCourse(index + 1));
	const lkIndexes = [0, 1, 4];
	const gkIndexes = [2, 3];
	const validCombinations = [];
	for (let i = 0; i < lkIndexes.length; i++) {
		for (let j = i + 1; j < lkIndexes.length; j++) {
			const a = lkIndexes[i], b = lkIndexes[j];
			if (valid[a] && valid[b]) validCombinations.push((averages[a] + averages[b]) / 2);
		}
		const lk = lkIndexes[i];
		if (valid[lk] && gkIndexes.every(index => valid[index])) {
			validCombinations.push((averages[lk] + averages[gkIndexes[0]] + averages[gkIndexes[1]]) / 3);
		}
	}
	const hasFailingGrade = Array.from({ length: 5 }, (_, index) => index + 1).some(course => {
		const subject = document.querySelector(`.subject[data-course="${course}"]`).value.trim();
		return subject !== "" && (!hasAllGradesInCourse(course) || hasFailingGradeInCourse(course));
	});
	if (hasFailingGrade) validCombinations.length = 0;

	// Find the highest average among valid combinations
	const bestAverage = validCombinations.length > 0
		? Math.max(...validCombinations).toFixed(2)
		: "0.00";

	gesamtDurchschnittElement.classList.remove(
		"grade-default",
		"grade-red",
		"grade-orange",
		"grade-yellow",
		"grade-green",
	);

	gesamtStufeElement.textContent = bestAverage;

	if (bestAverage === "0.00") {
		gesamtDurchschnittElement.classList.add("grade-default");
		return "-";
	}
	if (bestAverage < 9) {
		gesamtDurchschnittElement.classList.add("grade-red");
		return "-";
	}
	if (bestAverage < 11) {
		gesamtDurchschnittElement.classList.add("grade-orange");
		return "1";
	}
	if (bestAverage < 13) {
		gesamtDurchschnittElement.classList.add("grade-yellow");
		return "2";
	}
	gesamtDurchschnittElement.classList.add("grade-green");
	return "3";
}

for (const input of noteInputs) {
	input.addEventListener("input", () => {
		if (!validateGradeInput(input)) {
			document.getElementById(`avg-${input.getAttribute("data-course")}`).textContent = "-";
			gesamtDurchschnittElement.textContent = calculateBestAverage();
			return;
		}
		const course = input.getAttribute("data-course");
		const avg = calculateCourseAverage(course);
		document.getElementById(`avg-${course}`).textContent = avg;
		gesamtDurchschnittElement.textContent = calculateBestAverage();
	});
}

gesamtDurchschnittElement.classList.add("grade-default");

document.addEventListener("fields_filled", () => {
	for (let course = 1; course <= 5; course++) {
		const avg = calculateCourseAverage(course);
		const avgElement = document.getElementById(`avg-${course}`);
		if (avgElement) {
			const courseInputs = document.querySelectorAll(`.note[data-course="${course}"]`);
			avgElement.textContent = [...courseInputs].every(validateGradeInput) ? avg : "-";
		}
		if (gesamtDurchschnittElement) {
			gesamtDurchschnittElement.textContent = calculateBestAverage();
		}
	}
});

function toggleAfBZuordnung() {
	const afbZuordnungDiv = document.querySelector(".afb-zuordnung");
	afbZuordnungDiv.classList.toggle("hidden");
}
