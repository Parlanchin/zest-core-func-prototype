const app = document.getElementById("app");

function showStatus(message, isError = false) {
  app.innerHTML = `<p class="status${isError ? " error" : ""}">${message}</p>`;
}

function renderPlaceholder(data) {
  const feedbackCount = Array.isArray(data.feedback) ? data.feedback.length : 0;
  app.innerHTML = `
    <section class="view" id="view-essay" data-screen="essay">
      <h1>Essay view</h1>
      <p>Scaffold ready. Essay content will render here in the next step.</p>
      <p class="meta">
        Loaded <strong>${feedbackCount}</strong> feedback comment${feedbackCount === 1 ? "" : "s"} from <code>data.json</code>.
      </p>
    </section>
    <section class="view" id="view-react" data-screen="react" hidden>
      <h1>R.E.A.C.T. walkthrough</h1>
    </section>
    <section class="view" id="view-log" data-screen="log" hidden>
      <h1>Feedback log</h1>
    </section>
  `;
}

async function init() {
  showStatus("Loading…");

  try {
    const response = await fetch("./data.json");
    if (!response.ok) {
      throw new Error(`Could not load data.json (${response.status})`);
    }
    const data = await response.json();
    window.appData = data;
    renderPlaceholder(data);
  } catch (error) {
    console.error(error);
    showStatus(
      "Could not load data.json. Serve this folder over HTTP (for example: python3 -m http.server) rather than opening the file directly.",
      true
    );
  }
}

init();
