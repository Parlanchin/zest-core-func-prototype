import { mountModeA } from "./modeA.js";
import { mountModeB } from "./modeB.js";
import { mountModeC } from "./modeC.js";

const app = document.getElementById("app");
const backBtn = document.querySelector(".back-btn[data-action='go-home']");
const brandLink = document.querySelector(".brand-link[data-action='go-home']");

const MODES = {
  a: { label: "Mode A", mount: mountModeA },
  b: { label: "Mode B", mount: mountModeB },
  c: { label: "Mode C", mount: mountModeC },
};

function setBackVisible(visible) {
  if (!backBtn) return;
  backBtn.hidden = !visible;
}

function navigate(route) {
  window.scrollTo(0, 0);

  if (route === "home") {
    setBackVisible(false);
    renderHome();
    return;
  }

  const mode = MODES[route];
  if (!mode) {
    setBackVisible(false);
    renderHome();
    return;
  }

  setBackVisible(true);
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

function goHome(event) {
  event.preventDefault();
  navigate("home");
}

if (backBtn) {
  backBtn.addEventListener("click", goHome);
}

if (brandLink) {
  brandLink.addEventListener("click", goHome);
}

navigate("home");
