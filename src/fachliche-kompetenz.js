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

async function calculateBestAverage() {
	const avg1 = Number.parseFloat(document.getElementById("avg-1").textContent);
	const avg2 = Number.parseFloat(document.getElementById("avg-2").textContent);
	const avg3 = Number.parseFloat(document.getElementById("avg-3").textContent);
	const avg4 = Number.parseFloat(document.getElementById("avg-4").textContent);

	const isValid1 = avg1 >= 9 && !hasFailingGradeInCourse(1);
	const isValid2 = avg2 >= 9 && !hasFailingGradeInCourse(2);
	const isValid3 = avg3 >= 9 && !hasFailingGradeInCourse(3);
	const isValid4 = avg4 >= 9 && !hasFailingGradeInCourse(4);

	const validCombinations = [];

	// LK average (courses 1 and 2) - only if both are valid
	if (isValid1 && isValid2) {
		validCombinations.push((avg1 + avg2) / 2);
	}

	// Combination 1: courses 1, 2, 3
	if (isValid1 && isValid2 && isValid3) {
		validCombinations.push((avg1 + avg2 + avg3) / 3);
	}

	// Combination 2: courses 1, 2, 4
	if (isValid1 && isValid2 && isValid4) {
		validCombinations.push((avg1 + avg2 + avg4) / 3);
	}

	// Combination 3: courses 1, 3, 4
	if (isValid1 && isValid3 && isValid4) {
		validCombinations.push((avg1 + avg3 + avg4) / 3);
	}

	// Combination 4: courses 2, 3, 4
	if (isValid2 && isValid3 && isValid4) {
		validCombinations.push((avg2 + avg3 + avg4) / 3);
	}

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
		const course = input.getAttribute("data-course");
		const avg = calculateCourseAverage(course);
		document.getElementById(`avg-${course}`).textContent = avg;
		calculateBestAverage().then((result) => {
			gesamtDurchschnittElement.textContent = result;
		});
	});
}

gesamtDurchschnittElement.classList.add("grade-default");

document.addEventListener("fields_filled", () => {
	for (let course = 1; course <= 4; course++) {
		const avg = calculateCourseAverage(course);
		const avgElement = document.getElementById(`avg-${course}`);
		if (avgElement) {
			avgElement.textContent = avg;
		}
		calculateBestAverage().then((result) => {
			if (gesamtDurchschnittElement) {
				gesamtDurchschnittElement.textContent = result;
			}
		});
	}
});

function toggleAfBZuordnung() {
	const afbZuordnungDiv = document.querySelector(".afb-zuordnung");
	afbZuordnungDiv.classList.toggle("hidden");
}