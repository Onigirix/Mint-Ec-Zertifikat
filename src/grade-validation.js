export function isValidGradeValue(value) {
	if (
		(typeof value !== "number" && typeof value !== "string") ||
		(typeof value === "string" && value.trim() === "")
	) {
		return false;
	}

	const grade = Number(value);
	return Number.isInteger(grade) && grade >= 0 && grade <= 15;
}

export function validateGradeInput(input) {
	if (input.value === "") {
		input.setCustomValidity("");
		return true;
	}

	const valid = isValidGradeValue(input.value);
	input.setCustomValidity(valid ? "" : "Die Notenpunkte müssen zwischen 0 und 15 liegen.");
	return valid;
}
