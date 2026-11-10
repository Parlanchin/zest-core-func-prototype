let app = null;

const TYPE_LABELS = {
  surface: "Surface correction",
  structural: "Structural feedback",
  task_alignment: "Task alignment feedback",
  developmental: "Developmental feedback",
};

const state = {
  data: null,
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTaskText(task) {
  const text = String(task || "");
  const match = text.match(/^([\s\S]*?)"([^"]+)"([\s\S]*)$/);
  if (!match) {
    return `<p class="task-text">${escapeHtml(text)}</p>`;
  }

  const before = match[1].trim();
  const quote = match[2].trim();
  const after = match[3].trim();

  return `
    <div class="task-text">
      ${before ? `<p>${escapeHtml(before)}</p>` : ""}
      <blockquote class="task-quote">${escapeHtml(quote)}</blockquote>
      ${after ? `<p>${escapeHtml(after)}</p>` : ""}
    </div>
  `;
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

function render() {
  if (!state.data) return;

  const data = state.data;
  const feedback = data.feedback || [];
  const paragraphs = splitParagraphs(data.draft || "");

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

  const revisedParagraphs = splitParagraphs(data.revised_draft || "")
    .map((text) => `<p>${escapeHtml(text)}</p>`)
    .join("");

  app.innerHTML = `
    <section class="view" id="view-mode-c" data-screen="mode-c">
      <header class="view-header">
        <h1>Mode C - Draft, revise &amp; reflect</h1>
      </header>

      <details class="info-card">
        <summary class="info-card-summary">
          <span class="info-card-title">Workflow - each step the student takes</span>
          <span class="info-card-arrow" aria-hidden="true"></span>
        </summary>
        <ol class="info-card-list">
          <li>reads task</li>
          <li>writes draft</li>
          <li>reads AI-generated feedback</li>
          <li>writes a revision</li>
          <li>writes a short reflection summarizing what they improved/changed</li>
        </ol>
      </details>

      <div class="panel">
        <h2 class="panel-title">Writing task</h2>
        ${formatTaskText(data.task)}
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

      <div class="panel revised-panel">
        <h2 class="panel-title">Revised draft</h2>
        <div class="revised-draft">${revisedParagraphs}</div>
      </div>

      <div class="panel">
        <h2 class="panel-title">Student reflection</h2>
        <p class="task-text">${escapeHtml(data.reflection || "")}</p>
      </div>
    </section>
  `;
}

async function init() {
  showStatus("Loading…");

  try {
    const response = await fetch("./data/modeC.json");
    if (!response.ok) {
      throw new Error(`Could not load data/modeC.json (${response.status})`);
    }
    state.data = await response.json();
    window.appData = state.data;
    render();
  } catch (error) {
    console.error(error);
    showStatus(
      "Could not load data/modeC.json. Serve this folder over HTTP (for example: python3 -m http.server) rather than opening the file directly.",
      true
    );
  }
}

export function mountModeC(root) {
  app = root;
  state.data = null;
  init();
}
