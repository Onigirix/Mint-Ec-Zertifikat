const { invoke } = window.__TAURI__.core;

window.addEventListener("DOMContentLoaded", () => {
  const openNavButton = document.querySelector("#openNav");
  const closeNavButton = document.querySelector("#closeNav");

  openNavButton.addEventListener("click", openNav);
  closeNavButton.addEventListener("click", closeNav);
});

function openNav() {
  document.getElementById("sidenav").style.width = "30vw";
  document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

function closeNav() {
  document.getElementById("sidenav").style.width = "0";
  document.body.style.backgroundColor = "white";
}
