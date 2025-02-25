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

  async function calculateBestAverage() {
    let two;
  }
  // Function to calculate the overall average and set color
  function calculateOverallAverage() {
    let totalSum = 0;
    let totalCount = 0;

    courseAverages.forEach((span) => {
      const avg = parseFloat(span.textContent);
      if (!isNaN(avg)) {
        totalSum += avg;
        totalCount++;
      }
    });

    const average =
      totalCount > 0 ? (totalSum / totalCount).toFixed(2) : "0.00";

    gesamtDurchschnittElement.classList.remove(
      "grade-default",
      "grade-red",
      "grade-orange",
      "grade-yellow",
      "grade-green"
    );

    // Add appropriate class based on value
    const averageValue = parseFloat(average);
    if (average === "0.00") {
      gesamtDurchschnittElement.classList.add("grade-default");
    } else if (averageValue < 9) {
      gesamtDurchschnittElement.classList.add("grade-red");
    } else if (averageValue < 11) {
      gesamtDurchschnittElement.classList.add("grade-orange");
    } else if (averageValue < 13) {
      gesamtDurchschnittElement.classList.add("grade-yellow");
    } else {
      gesamtDurchschnittElement.classList.add("grade-green");
    }

    return average;
  }

  // Update the averages when an input value changes
  noteInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const course = input.getAttribute("data-course");
      const avg = calculateCourseAverage(course);
      document.getElementById(`avg-${course}`).textContent = avg;
      gesamtDurchschnittElement.textContent = calculateOverallAverage();
    });
  });

  // Initialize colors on page load
  gesamtDurchschnittElement.classList.add("grade-default");
});
