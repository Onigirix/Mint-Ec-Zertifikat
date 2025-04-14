document.addEventListener('DOMContentLoaded', function () {
    const noteInputs = document.querySelectorAll('.note');
    const courseAverages = document.querySelectorAll('[id^="avg-"]');
    const gesamtDurchschnittElement = document.getElementById('gesamtDurchschnitt');
  
    // Function to calculate the average for a course
    function calculateCourseAverage(course) {
      let sum = 0;
      let count = 0;
      document.querySelectorAll(`.note[data-course="${course}"]`).forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
          sum += value;
          count++;
        }
      });
      return count > 0 ? (sum / count).toFixed(2) : '0.00';
    }
  
    // Function to calculate the overall average
    function calculateOverallAverage() {
      let totalSum = 0;
      let totalCount = 0;
  
      courseAverages.forEach(span => {
        const avg = parseFloat(span.textContent);
        if (!isNaN(avg)) {
          totalSum += avg;
          totalCount++;
        }
      });
  
      return totalCount > 0 ? (totalSum / totalCount).toFixed(2) : '0.00';
    }
  
    // Update the averages when an input value changes
    noteInputs.forEach(input => {
      input.addEventListener('input', () => {
        const course = input.getAttribute('data-course');
        const avg = calculateCourseAverage(course);
        document.getElementById(`avg-${course}`).textContent = avg;
        gesamtDurchschnittElement.textContent = calculateOverallAverage();
      });
    });
  });