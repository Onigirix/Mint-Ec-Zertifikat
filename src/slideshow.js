const { invoke } = window.__TAURI__.core;

let slideIndex = 1; // Setze den Startindex auf 1



window.addEventListener("DOMContentLoaded", () => {
  
  showSlides(); // Initialisiere die Slides
  // console.log(document.getElementsByClassName("mySlides").length); 
  
  window.addEventListener("keydown", function(event) {
    if (event.key === "ArrowLeft") {
      // Wenn die linke Pfeiltaste gedrückt wird, gehe eine Slide zurück
      plusSlides(-1);
    } else if (event.key === "ArrowRight") {
      // Wenn die rechte Pfeiltaste gedrückt wird, gehe eine Slide weiter
      plusSlides(1);
    }
  });

  
  
});



function showSlides() {
  // Sammlung aller Slides
  const slides = document.getElementsByClassName("mySlides");

  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none"; // Verstecke alle Slides
  }

  slides[slideIndex - 1].style.display = "block"; // Zeige die aktuelle Slide an
}

function plusSlides(n) {
  slideIndex += n; // Ändert den aktuellen Index basierend auf der Richtung (n kann -1 oder 1 sein)

  const slidesLength = document.getElementsByClassName("mySlides").length;

  // Wenn der Index größer als die Anzahl der Slides ist, setze ihn zurück auf die erste Slide
  if (slideIndex > slidesLength) {
    slideIndex = 1;
  } 
  // Wenn der Index kleiner als 1 ist, setze ihn auf die letzte Slide
  else if (slideIndex < 1) {
    slideIndex = slidesLength;
  }

  showSlides(); // Zeige die entsprechende Slide
}

// Starten der automatischen Slideshow
setInterval(() => {
  plusSlides(1); // Wechsle alle 5 Sekunden zur nächsten Slide
}, 5000);
