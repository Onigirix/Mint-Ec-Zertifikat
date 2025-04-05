document.addEventListener("DOMContentLoaded", function () {
  const noteInputs = document.querySelectorAll(".note");
  const courseAverages = document.querySelectorAll('[id^="avg-"]');
  const gesamtDurchschnittElement =
    document.getElementById("gesamtDurchschnitt");

  // Function to calculate the average for a course
  function calculateCourseAverage(course) {
    let sum = 0;
    let count = 0;
    document
      .querySelectorAll(`.note[data-course="${course}"]`)
      .forEach((input) => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
          sum += value;
          count++;
        }
      });
    return count > 0 ? (sum / count).toFixed(2) : "0.00";
  }

  function calculateBestAverage() {
    const avg1 = parseFloat(document.getElementById("avg-1").textContent);
    const avg2 = parseFloat(document.getElementById("avg-2").textContent);
    const avg3 = parseFloat(document.getElementById("avg-3").textContent);
    const avg4 = parseFloat(document.getElementById("avg-4").textContent);

    const lk_average = (avg1 + avg2) / 2;
    const combination1 = (avg1 + avg2 + avg3) / 3;
    const combination2 = (avg1 + avg2 + avg4) / 3;
    const combination3 = (avg1 + avg3 + avg4) / 3;
    const combination4 = (avg2 + avg3 + avg4) / 3;

    // Find the highest average among the combinations
    const bestAverage = Math.max(
      lk_average,
      combination1,
      combination2,
      combination3,
      combination4
    ).toFixed(2);

    gesamtDurchschnittElement.classList.remove(
      "grade-default",
      "grade-red",
      "grade-orange",
      "grade-yellow",
      "grade-green"
    );

    if (bestAverage == "0.00") {
      gesamtDurchschnittElement.classList.add("grade-default");
      return "-";
    } else if (bestAverage < 9) {
      gesamtDurchschnittElement.classList.add("grade-red");
      return "-";
    } else if (bestAverage < 11) {
      gesamtDurchschnittElement.classList.add("grade-orange");
      return "1";
    } else if (bestAverage < 13) {
      gesamtDurchschnittElement.classList.add("grade-yellow");
      return "2";
    } else {
      gesamtDurchschnittElement.classList.add("grade-green");
      return "3";
    }
  }

  noteInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const course = input.getAttribute("data-course");
      const avg = calculateCourseAverage(course);
      document.getElementById(`avg-${course}`).textContent = avg;
      gesamtDurchschnittElement.textContent = calculateBestAverage();
    });
  });

  gesamtDurchschnittElement.classList.add("grade-default");
});
