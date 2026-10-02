document.addEventListener("DOMContentLoaded", () => {
  ArchiveUI.initThemeToggle();

  const escapeHTML = ArchiveUI.escapeHTML;
  const params = new URLSearchParams(location.search);
  const topic = params.get("topic");
  const root = document.getElementById("basicDetailRoot");

  function section(title, body) {
    return `
      <section class="detail-card">
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(body)}</p>
      </section>
    `;
  }

  function codeBlock(example) {
    return `
      <div class="code-shell">
        <div class="code-titlebar"><span>${escapeHTML(example.filename)}</span></div>
        <pre><code>${escapeHTML(example.code)}</code></pre>
      </div>
    `;
  }

  function renderNotFound() {
    root.innerHTML = `
      <section class="detail-hero">
        <h1>기초 개념을 찾을 수 없습니다</h1>
        <p class="lead">기초 개념 목록에서 다시 선택해 주세요.</p>
      </section>
    `;
  }

  const payload = BasicConceptStore.getPayload();
  const detail = topic
    ? payload.concepts.find((concept) => concept.id === topic)
    : payload.concepts[0];

  if (!detail) {
    renderNotFound();
    return;
  }

  root.innerHTML = `
    <header class="detail-hero">
      <div>
        <p class="eyebrow">${escapeHTML(detail.detailEyebrow)}</p>
        <h1>${escapeHTML(detail.detailTitle)}</h1>
        <p class="lead">${escapeHTML(detail.detailSummary)}</p>
      </div>
    </header>
    ${detail.sections.map((item) => section(item.title, item.body)).join("")}
    <section class="detail-card">
      <h2>참고 코드</h2>
      <div class="code-stack">${detail.codes.map(codeBlock).join("")}</div>
    </section>
  `;
});
