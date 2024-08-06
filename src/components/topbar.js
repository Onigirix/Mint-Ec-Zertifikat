class Topbar extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.innerHTML = `
      <div id="topbar">
        <div id="search-fields">
          <input type="text" class="search-field" id="first-name" />
          <input type="text" class="search-field" id="last-name" />
          <i class="material-icons">add</i>
        </div>
      </div>
    `;
  }
}

customElements.define("topbar-component", Topbar);
