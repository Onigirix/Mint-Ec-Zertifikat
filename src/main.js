//const { invoke } = window.__TAURI__.core;
let currentFocus = "none";

window.addEventListener("DOMContentLoaded", () => {
  const fachlicheKompetenz = document.getElementById("Fachliche-Kompetenz");
  const fachwissenschaftlichesArbeiten = document.getElementById("Fachwissenschaftliches-Arbeiten");
  const zusatzlicheMINTAktivitaet = document.getElementById("Zusätzliche-MINT-Aktivität");

  fachlicheKompetenz.addEventListener("click", expand_fachliche_kompetenz);
  fachwissenschaftlichesArbeiten.addEventListener("click", expand_fachwissenschaftliches_arbeiten);
  zusatzlicheMINTAktivitaet.addEventListener("click", expand_zusätzliche_mint_aktivität);
});

function expand_fachliche_kompetenz(){
  //do nothing, bc it's already expanded, duh.
  if(currentFocus == "fachlicheKompetenz"){
  }else if(currentFocus == "fachwissenschaftlichesArbeiten"){
    currentFocus="fachlicheKompetenz";
    document.getElementById("Zusätzliche-MINT-Aktivität").style.width = "5vw";
    const fachlicheKompetenz = document.getElementById("Fachliche-Kompetenz");
    const fachwissenschaftlichesArbeiten = document.getElementById("Fachwissenschaftliches-Arbeiten");
    var fachlicheKompetenz_width = 5; //has to go up to 90 (by 85)
    var fachwissenschaftlichesArbeiten_width = 90; //has to go down to 5 (by 85)
    id = setInterval(expand_fachliche_kompetenz_from_fachwissenschaftliches_arbeiten_frame, 18); //takes 306 milliseconds

    function expand_fachliche_kompetenz_from_fachwissenschaftliches_arbeiten_frame(){
      if (fachlicheKompetenz_width == 90){
        clearInterval(id);
      } else{
        fachlicheKompetenz_width += 5;
        fachwissenschaftlichesArbeiten_width -= 5;
        fachlicheKompetenz.style.width = fachlicheKompetenz_width + "vw";
        fachwissenschaftlichesArbeiten.style.width = fachwissenschaftlichesArbeiten_width + "vw";
      }
    }


    }else if(currentFocus == "zusatzlicheMINTAktivitaet"){
      currentFocus="fachlicheKompetenz";
      document.getElementById("Fachwissenschaftliches-Arbeiten").style.width = "5vw";
      const fachlicheKompetenz = document.getElementById("Fachliche-Kompetenz");
      const fachwissenschaftlichesArbeiten = document.getElementById("Zusätzliche-MINT-Aktivität");
      var fachlicheKompetenz_width = 5; //has to go up to 90 (by 85)
      var zusatzlicheMINTAktivitaet_width = 90; //has to go down to 5 (by 85)
      id = setInterval(expand_fachliche_kompetenz_from_fachwissenschaftliches_arbeiten_frame, 18); //takes 306 milliseconds

      function expand_fachliche_kompetenz_from_fachwissenschaftliches_arbeiten_frame(){
        if (fachlicheKompetenz_width == 90){
          clearInterval(id);
        } else{
          fachlicheKompetenz_width += 5;
          zusatzlicheMINTAktivitaet_width -= 5;
          fachlicheKompetenz.style.width = fachlicheKompetenz_width + "vw";
          fachwissenschaftlichesArbeiten.style.width = zusatzlicheMINTAktivitaet_width + "vw";
        }
      }


  }else{
    currentFocus="fachlicheKompetenz";
    const fachlicheKompetenz = document.getElementById("Fachliche-Kompetenz");
    const fachwissenschaftlichesArbeiten = document.getElementById("Fachwissenschaftliches-Arbeiten");
    const zusatzlicheMINTAktivitaet = document.getElementById("Zusätzliche-MINT-Aktivität");

    var main_width = 30;
    var secondary_width = 35;
    fachlicheKompetenz.style.width = main_width + "vw";
    fachwissenschaftlichesArbeiten.style.width = secondary_width + "vw";
    zusatzlicheMINTAktivitaet.style.width = secondary_width + "vw";
    id = setInterval(expand_fachliche_kompetenz_from_neutral_frame, 10); //takes 300 milliseconds

    function expand_fachliche_kompetenz_from_neutral_frame(){
      if (main_width == 90){
        clearInterval(id);
      } else{
        main_width += 2;
        secondary_width -= 1;
        fachlicheKompetenz.style.width = main_width + "vw";
        fachwissenschaftlichesArbeiten.style.width = secondary_width + "vw";
        zusatzlicheMINTAktivitaet.style.width = secondary_width + "vw";
      }
    }
  }
}

function expand_fachwissenschaftliches_arbeiten(){
  if (document.getElementById("Fachwissenschaftliches-Arbeiten").style.width != "90vw"){
    const fachlicheKompetenz = document.getElementById("Fachliche-Kompetenz");
    const fachwissenschaftlichesArbeiten = document.getElementById("Fachwissenschaftliches-Arbeiten");
    const zusatzlicheMINTAktivitaet = document.getElementById("Zusätzliche-MINT-Aktivität");
    var main_width = 30; //has to go up to 90 (by 60)
    var secondary_width = 35; //has to go down to 5 (by 30)
    fachlicheKompetenz.style.width = secondary_width + "vw";
    fachwissenschaftlichesArbeiten.style.width = main_width + "vw";
    zusatzlicheMINTAktivitaet.style.width = secondary_width + "vw";
    id = setInterval(frame, 10);
    function frame(){
      if (main_width == 90){
        currentFocus="fachwissenschaftlichesArbeiten";
        clearInterval(id);
      } else{
        main_width += 2;
        secondary_width -= 1;
        fachlicheKompetenz.style.width = secondary_width + "vw";
        fachwissenschaftlichesArbeiten.style.width = main_width + "vw";
        zusatzlicheMINTAktivitaet.style.width = secondary_width + "vw";

      }
    }
  }
}

function expand_zusätzliche_mint_aktivität(){
  const fachlicheKompetenz = document.getElementById("Fachliche-Kompetenz");
  const fachwissenschaftlichesArbeiten = document.getElementById("Fachwissenschaftliches-Arbeiten");
  const zusatzlicheMINTAktivitaet = document.getElementById("Zusätzliche-MINT-Aktivität");
  var main_width = 30; //has to go up to 90 (by 60)
  var secondary_width = 35; //has to go down to 5 (by 30)
  fachlicheKompetenz.style.width = secondary_width + "vw";
  fachwissenschaftlichesArbeiten.style.width = secondary_width + "vw";
  zusatzlicheMINTAktivitaet.style.width = main_width + "vw";
  id = setInterval(frame, 10);
  function frame(){
    if (main_width == 90){
      currentFocus="zusatzlicheMINTAktivitaet";
      clearInterval(id);
    } else{
      main_width += 2;
      secondary_width -= 1;
      fachlicheKompetenz.style.width = secondary_width + "vw";
      fachwissenschaftlichesArbeiten.style.width = secondary_width + "vw";
      zusatzlicheMINTAktivitaet.style.width = main_width + "vw";

    }
  }
}
