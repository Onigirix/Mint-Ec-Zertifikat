const { invoke } = window.__TAURI__.core;

window.addEventListener("DOMContentLoaded", () => {
  const fillsearchbardatalists = document.querySelector(
    "#fill-search-bar-datalists"
  );
  fillsearchbardatalists.addEventListener(
    "click",
    addFirstAndLastNamesToDatalists
  );
});

class Topbar extends HTMLElement {
  constructor() {
    super();
    this.firstNamesDatalistContent = "";
    this.lastNamesDatalistContent = "";
  }
  connectedCallback() {
    this.innerHTML = `
      <div id="topbar">
        <div id="search-fields">
          <input type="text" class="search-field" id="first-name" list="first-names-list" />
          <input type="text" class="search-field" id="last-name" list="last-names-list"/>
          <datalist id="first-names-list">
          ${this.firstNamesDatalistContent}
          </datalist>
          <datalist id="last-names-list">
          ${this.lastNamesDatalistContent}
          </datalist>
          <i class="material-icons">add</i>
        </div>
      </div>
    `;
  }
}

customElements.define("topbar-component", Topbar);

function addFirstAndLastNamesToDatalists() {
  console.log("addFirtsAndLastNamesToDatalists");
  const firstNamesDatalistContent = "<option value='John'></option>";
  const lastNamesDatalistContent = "<option value='Doe'></option>";

  const topbarComponent = document.querySelector("topbar-component");
  if (topbarComponent) {
    topbarComponent.firstNamesDatalistContent = firstNamesDatalistContent;
    topbarComponent.lastNamesDatalistContent = lastNamesDatalistContent;
    topbarComponent.connectedCallback();
  }
}
