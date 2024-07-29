//const { invoke } = window.__TAURI__.core;
let currentFocus = "none";

window.addEventListener("DOMContentLoaded", () => {
  const openNavButton = document.getElementById("openNav");
  const closeNavButton = document.getElementById("closeNav");

  openNavButton.addEventListener("click", openNav);
  closeNavButton.addEventListener("click", closeNav);
});

function openNav() {
  document.getElementById("sidenav").style.width = "20vw";
  document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

/* Set the width of the side navigation to 0 */
function closeNav() {
  document.getElementById("sidenav").style.width = "0";
  document.body.style.backgroundColor = "white";
}