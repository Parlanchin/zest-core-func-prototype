import { mountModeA } from "./modeA.js";
import { mountModeB } from "./modeB.js";
import { mountModeC } from "./modeC.js";

const app = document.getElementById("app");
const brandLink = document.querySelector("[data-action='go-home']");

const MODES = {
  a: { label: "Mode A", mount: mountModeA },
  b: { label: "Mode B", mount: mountModeB },
  c: { label: "Mode C", mount: mountModeC },
};

function navigate(route) {
  window.scrollTo(0, 0);

  if (route === "home") {
    renderHome();
    return;
  }

  const mode = MODES[route];
  if (!mode) {
    renderHome();
    return;
  }

  mode.mount(app);
}

function renderHome() {
  const links = Object.entries(MODES)
    .map(
      ([key, mode]) => `
        <li>
          <button type="button" class="toc-link" data-action="open-mode" data-mode="${key}">
            ${mode.label}
          </button>
        </li>
      `
    )
    .join("");

  app.innerHTML = `
    <section class="view" id="view-home" data-screen="home">
      <header class="view-header">
        <h1>Each of these modes represent a possible workflow for students to produce their writing.</h1>
        <p>- What you'll see for each mode is a completed workflow with drafts, tasks, revisions etc... ready to be submitted to their teacher.</p>
        <p>- Each mode has a drop down at the top. Open it to see a summary of the steps the student completes for that flow.</p>
      </header>

      <nav class="toc" aria-label="Modes">
        <ul class="toc-list">
          ${links}
        </ul>
      </nav>
    </section>
  `;

  app.querySelectorAll("[data-action='open-mode']").forEach((el) => {
    el.addEventListener("click", () => {
      navigate(el.getAttribute("data-mode"));
    });
  });
}

if (brandLink) {
  brandLink.addEventListener("click", (event) => {
    event.preventDefault();
    navigate("home");
  });
}

renderHome();
