let app = null;

const TYPE_LABELS = {
  surface: "Surface correction",
  structural: "Structural feedback",
  task_alignment: "Task alignment feedback",
  developmental: "Developmental feedback",
};

const REACT_STEPS = [
  {
    key: "recognize",
    letter: "R",
    name: "Recognise",
    cue: "Categorise this feedback. What type is it?",
  },
  {
    key: "evaluate",
    letter: "E",
    name: "Evaluate",
    cue: "Is it accurate, important, and aligned with the task?",
  },
  {
    key: "articulate",
    letter: "A",
    name: "Articulate",
    cue: "Paraphrase the feedback in your own words.",
  },
  {
    key: "choose",
    letter: "C",
    name: "Choose",
    cue: "Accept, adapt, or reject — and justify your decision.",
  },
  {
    key: "transform",
    letter: "T",
    name: "Transform",
    cue: "What did you change, and why did it strengthen the writing?",
  },
];

const DECISION_OPTIONS = ["accept", "adapt", "reject"];

const state = {
  data: null,
  screen: "essay", // essay | react | log
  commentIndex: 0,
  stepIndex: 0,
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

function getTaskForFeedback(feedbackId) {
  return (state.data.tasks || []).find((task) => task.feedback_id === feedbackId);
}

function getReflectionForFeedback(feedbackId) {
  return (state.data.reflection || []).find((item) => item.feedback_id === feedbackId);
}

function bindClicks(root, handlers) {
  root.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", (event) => {
      const action = el.getAttribute("data-action");
      if (handlers[action]) handlers[action](event, el);
    });
  });
}

function render() {
  if (!state.data) return;

  if (state.screen === "essay") {
    renderEssayView();
  } else if (state.screen === "react") {
    renderReactView();
  } else {
    renderLogView();
  }
}

function renderEssayView() {
  const data = state.data;
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
        <h1>Mode B - Based on your REACT paradigm</h1>
      </header>

      <details class="info-card">
        <summary class="info-card-summary">
          <span class="info-card-title">Workflow - each step the student takes</span>
          <span class="info-card-arrow" aria-hidden="true"></span>
        </summary>
        <ol class="info-card-list">
          <li>reads task</li>
          <li>writes draft and clicks 'evaluate'</li>
          <li>reads feedback summary cards</li>
          <li>begins REACT tasks</li>
          <li>writes a revision</li>
          <li>fills feedback log</li>
          <li>submits to teacher</li>
        </ol>
      </details>

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

      <div class="actions actions-stack">
        <button type="button" class="btn btn-primary" data-action="start-react">
          Start R.E.A.C.T.
        </button>
        <button type="button" class="btn" data-action="open-log">
          Open feedback log
        </button>
      </div>
    </section>
  `;

  bindClicks(app, {
    "start-react": () => {
      state.screen = "react";
      state.commentIndex = 0;
      state.stepIndex = 0;
      render();
      window.scrollTo(0, 0);
    },
    "open-log": () => {
      state.screen = "log";
      render();
      window.scrollTo(0, 0);
    },
  });
}

function buildStepAnswerFields(step, task, reflection) {
  if (step.key === "choose") {
    const decision = task?.choose ? task.choose.decision : "";
    const reason = task?.choose ? task.choose.reason : "";
    const options = DECISION_OPTIONS.map((option) => {
      const selected = decision === option ? " is-selected" : "";
      return `<span class="decision-chip${selected}">${escapeHtml(option)}</span>`;
    }).join("");

    return `
      <div class="field">
        <label class="field-label">Decision</label>
        <div class="decision-row" aria-live="polite">${options}</div>
      </div>
      <div class="field">
        <label class="field-label" for="student-answer">Justification</label>
        <textarea id="student-answer" class="answer-box" rows="5" readonly placeholder="Your justification…">${escapeHtml(reason)}</textarea>
      </div>
    `;
  }

  if (step.key === "transform") {
    const whatChanged = reflection ? reflection.what_changed : "";
    const whyChanged = reflection ? reflection.why_changed : "";
    return `
      <div class="field">
        <label class="field-label" for="student-answer-what">What I changed</label>
        <textarea id="student-answer-what" class="answer-box" rows="4" readonly placeholder="Describe the revision…">${escapeHtml(whatChanged)}</textarea>
      </div>
      <div class="field">
        <label class="field-label" for="student-answer-why">Why it improved the text</label>
        <textarea id="student-answer-why" class="answer-box" rows="4" readonly placeholder="Explain why the change strengthens the writing…">${escapeHtml(whyChanged)}</textarea>
      </div>
    `;
  }

  const value = task ? task[step.key] || "" : "";
  return `
    <div class="field">
      <label class="field-label" for="student-answer">Your response</label>
      <textarea id="student-answer" class="answer-box" rows="6" readonly placeholder="Write your response…">${escapeHtml(value)}</textarea>
    </div>
  `;
}

function renderReactView() {
  const data = state.data;
  const feedbackList = data.feedback || [];
  const comment = feedbackList[state.commentIndex];
  const step = REACT_STEPS[state.stepIndex];
  const task = getTaskForFeedback(comment.id);
  const reflection = getReflectionForFeedback(comment.id);
  const isLastStep =
    state.commentIndex === feedbackList.length - 1 &&
    state.stepIndex === REACT_STEPS.length - 1;

  const targetNote =
    comment.paragraph == null
      ? "Whole draft"
      : `Paragraph ${comment.paragraph}`;

  const letterTrail = REACT_STEPS.map((item, index) => {
    const current = index === state.stepIndex ? " is-current" : "";
    const done = index < state.stepIndex ? " is-done" : "";
    return `<span class="step-letter${current}${done}" title="${escapeHtml(item.name)}">${item.letter}</span>`;
  }).join("");

  app.innerHTML = `
    <section class="view" id="view-react" data-screen="react">
      <header class="view-header">
        <p class="progress">Comment ${state.commentIndex + 1} of ${feedbackList.length} · ${escapeHtml(step.name)}</p>
        <h1>${escapeHtml(step.letter)} — ${escapeHtml(step.name)}</h1>
        <p class="view-lead">${escapeHtml(step.cue)}</p>
        <div class="step-trail" aria-hidden="true">${letterTrail}</div>
      </header>

      <div class="panel comment-focus">
        <div class="comment-meta">
          <span class="type-tag type-${escapeHtml(comment.type)}">${escapeHtml(typeLabel(comment.type))}</span>
          <span class="comment-target">${escapeHtml(targetNote)}</span>
        </div>
        <p class="comment-text">${escapeHtml(comment.text)}</p>
      </div>

      <div class="panel answer-panel">
        ${buildStepAnswerFields(step, task, reflection)}
      </div>

      <div class="actions actions-split">
        <button type="button" class="btn" data-action="back-essay">Back to essay</button>
        <button type="button" class="btn btn-primary" data-action="next-step">
          ${isLastStep ? "Open feedback log" : "Next"}
        </button>
      </div>
    </section>
  `;

  bindClicks(app, {
    "back-essay": () => {
      state.screen = "essay";
      render();
      window.scrollTo(0, 0);
    },
    "next-step": () => {
      if (state.stepIndex < REACT_STEPS.length - 1) {
        state.stepIndex += 1;
      } else if (state.commentIndex < feedbackList.length - 1) {
        state.commentIndex += 1;
        state.stepIndex = 0;
      } else {
        state.screen = "log";
      }
      render();
      window.scrollTo(0, 0);
    },
  });
}

function renderLogView() {
  const data = state.data;
  const feedback = data.feedback || [];

  const rows = feedback
    .map((item) => {
      const reflection = getReflectionForFeedback(item.id) || {};
      return `
        <tr>
          <td>
            <span class="type-tag type-${escapeHtml(item.type)}">${escapeHtml(typeLabel(item.type))}</span>
            <p class="log-feedback">${escapeHtml(item.text)}</p>
          </td>
          <td>${escapeHtml(reflection.meaning || "")}</td>
          <td>${escapeHtml(reflection.what_changed || "")}</td>
          <td>${escapeHtml(reflection.why_changed || "")}</td>
        </tr>
      `;
    })
    .join("");

  const revisedParagraphs = splitParagraphs(data.revised_draft || "")
    .map((text) => `<p>${escapeHtml(text)}</p>`)
    .join("");

  app.innerHTML = `
    <section class="view" id="view-log" data-screen="log">
      <header class="view-header">
        <h1>Feedback log</h1>
      </header>

      <div class="panel revised-panel">
        <h2 class="panel-title">Revised draft</h2>
        <div class="revised-draft">${revisedParagraphs}</div>
      </div>

      <div class="table-wrap">
        <table class="log-table">
          <thead>
            <tr>
              <th>Feedback received</th>
              <th>What it means (in my words)</th>
              <th>What I changed</th>
              <th>Why I changed it</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <div class="actions actions-split">
        <button type="button" class="btn" data-action="back-essay">Back to essay</button>
        <button type="button" class="btn" data-action="restart-react">Replay R.E.A.C.T.</button>
      </div>
    </section>
  `;

  bindClicks(app, {
    "back-essay": () => {
      state.screen = "essay";
      render();
      window.scrollTo(0, 0);
    },
    "restart-react": () => {
      state.screen = "react";
      state.commentIndex = 0;
      state.stepIndex = 0;
      render();
      window.scrollTo(0, 0);
    },
  });
}

async function init() {
  showStatus("Loading…");

  try {
    const response = await fetch("./data/modeB.json");
    if (!response.ok) {
      throw new Error(`Could not load data/modeB.json (${response.status})`);
    }
    state.data = await response.json();
    window.appData = state.data;
    render();
  } catch (error) {
    console.error(error);
    showStatus(
      "Could not load data/modeB.json. Serve this folder over HTTP (for example: python3 -m http.server) rather than opening the file directly.",
      true
    );
  }
}

export function mountModeB(root) {
  app = root;
  state.data = null;
  state.screen = "essay";
  state.commentIndex = 0;
  state.stepIndex = 0;
  init();
}
