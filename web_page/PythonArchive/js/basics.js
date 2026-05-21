document.addEventListener("DOMContentLoaded", () => {
  ArchiveUI.initThemeToggle();

  const payload = BasicConceptStore.getPayload();
  const escapeHTML = ArchiveUI.escapeHTML;

  function codeBlock(example) {
    return `
      <div class="code-shell">
        <div class="code-titlebar"><span>${escapeHTML(example.filename)}</span></div>
        <pre><code>${escapeHTML(example.code)}</code></pre>
      </div>
    `;
  }

  function renderPageHead() {
    document.getElementById("basicEyebrow").textContent = payload.page.eyebrow;
    document.getElementById("basicTitle").textContent = payload.page.title;
    document.getElementById("basicLead").textContent = payload.page.lead;

    document.getElementById("basicStats").innerHTML = payload.page.stats.map((stat) => `
      <div>
        <strong>${escapeHTML(BasicConceptStore.statValue(payload, stat.key))}</strong>
        <span>${escapeHTML(stat.label)}</span>
      </div>
    `).join("");
  }

  function renderConcepts() {
    document.getElementById("conceptsTitle").textContent = payload.page.conceptsTitle;
    document.getElementById("conceptGrid").innerHTML = payload.concepts.map((concept) => `
      <a class="concept-card" href="basic-detail.html?topic=${encodeURIComponent(concept.id)}">
        <span class="badge">${escapeHTML(concept.badge)}</span>
        <h3>${escapeHTML(concept.cardTitle)}</h3>
        <p>${escapeHTML(concept.cardSummary)}</p>
        <span class="link-button">자세히 보기</span>
      </a>
    `).join("");
  }

  function renderExamples() {
    document.getElementById("examplesTitle").textContent = payload.page.examplesTitle;
    document.getElementById("exampleStack").innerHTML = payload.examples.map(codeBlock).join("");
  }

  function renderTemplate() {
    document.getElementById("templateTitle").textContent = payload.page.templateTitle;
    document.getElementById("templateRoot").innerHTML = codeBlock(payload.template);
  }

  function renderChecklist() {
    document.getElementById("checklistTitle").textContent = payload.page.checklistTitle;
    document.getElementById("checklistGrid").innerHTML = payload.checklist.map((item) => `
      <article class="check-item">
        <strong>${escapeHTML(item.title)}</strong>
        <p>${escapeHTML(item.body)}</p>
      </article>
    `).join("");
  }

  renderPageHead();
  renderConcepts();
  renderExamples();
  renderTemplate();
  renderChecklist();
});
