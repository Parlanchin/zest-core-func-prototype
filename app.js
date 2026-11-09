const app = document.getElementById("app");

const TYPE_LABELS = {
  surface: "Surface correction",
  structural: "Structural feedback",
  task_alignment: "Task alignment feedback",
  developmental: "Developmental feedback",
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showStatus(message, isError = false) {
  app.innerHTML = `<p class="status${isError ? " error" : ""}">${escapeHtml(message)}</p>`;
}

function typeLabel(type) {
  return TYPE_LABELS[type] || type;
}

function splitParagraphs(draft) {
  return draft.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

function commentsForParagraph(feedback, paragraphNumber) {
  return feedback.filter((item) => item.paragraph === paragraphNumber);
}

function renderEssayView(data) {
  const paragraphs = splitParagraphs(data.draft);
  const feedback = data.feedback || [];

  const essayHtml = paragraphs
    .map((text, index) => {
      const number = index + 1;
      const linked = commentsForParagraph(feedback, number);
      const mark =
        linked.length > 0
          ? `<span class="para-marks">${linked
              .map(
                (item) =>
                  `<a class="para-mark" href="#comment-${item.id}" title="${escapeHtml(typeLabel(item.type))}">C${item.id}</a>`
              )
              .join("")}</span>`
          : "";

      return `
        <div class="paragraph${linked.length ? " has-comment" : ""}" id="paragraph-${number}">
          <span class="para-num">${number}</span>
          <p>${escapeHtml(text)}</p>
          ${mark}
        </div>
      `;
    })
    .join("");

  const commentsHtml = feedback
    .map((item) => {
      const target =
        item.paragraph == null
          ? `<span class="comment-target">Whole draft</span>`
          : `<a class="comment-target" href="#paragraph-${item.paragraph}">Paragraph ${item.paragraph}</a>`;

      return `
        <article class="comment" id="comment-${item.id}">
          <div class="comment-meta">
            <span class="type-tag type-${escapeHtml(item.type)}">${escapeHtml(typeLabel(item.type))}</span>
            ${target}
          </div>
          <p class="comment-text">${escapeHtml(item.text)}</p>
        </article>
      `;
    })
    .join("");

  app.innerHTML = `
    <section class="view" id="view-essay" data-screen="essay">
      <header class="view-header">
        <h1>Your draft</h1>
        <p class="view-lead">Read the task, your essay, and the feedback comments. Then start the R.E.A.C.T. routine.</p>
      </header>

      <div class="panel">
        <h2 class="panel-title">Writing task</h2>
        <p class="task-text">${escapeHtml(data.task)}</p>
      </div>

      <div class="essay-layout">
        <div class="panel essay-panel">
          <h2 class="panel-title">Draft</h2>
          <div class="draft">${essayHtml}</div>
        </div>

        <aside class="panel comments-panel">
          <h2 class="panel-title">Feedback <span class="count">${feedback.length}</span></h2>
          <div class="comments">${commentsHtml}</div>
        </aside>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-primary" id="start-react" disabled title="Walkthrough comes in the next build step">
          Start R.E.A.C.T.
        </button>
      </div>
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
    renderEssayView(data);
  } catch (error) {
    console.error(error);
    showStatus(
      "Could not load data.json. Serve this folder over HTTP (for example: python3 -m http.server) rather than opening the file directly.",
      true
    );
  }
}

init();
