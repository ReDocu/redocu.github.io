document.addEventListener("DOMContentLoaded", () => {
  ArchiveUI.initThemeToggle();

  const $ = (id) => document.getElementById(id);
  const escapeHTML = ArchiveUI.escapeHTML;
  let payload = BasicConceptStore.getPayload();
  let selectedId = payload.concepts[0]?.id || "";

  function value(id) {
    return $(id)?.value ?? "";
  }

  function setValue(id, nextValue) {
    const element = $(id);
    if (element) element.value = nextValue ?? "";
  }

  function showMessage(text) {
    const message = $("basicMessage");
    message.textContent = text;
    message.hidden = false;
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
      message.hidden = true;
    }, 2200);
  }

  function currentConcept() {
    return payload.concepts.find((concept) => concept.id === selectedId);
  }

  function blockEditor(item, index, removeKind) {
    return `
      <div class="repeat-item">
        <div class="repeat-item-head">
          <strong>${index + 1}</strong>
          <button class="button danger" type="button" data-remove="${removeKind}" data-index="${index}">삭제</button>
        </div>
        <label class="field">
          <span>제목</span>
          <input data-field="title" value="${escapeHTML(item.title)}">
        </label>
        <label class="field">
          <span>내용</span>
          <textarea data-field="body" rows="5">${escapeHTML(item.body)}</textarea>
        </label>
      </div>
    `;
  }

  function codeEditor(item, index, removeKind) {
    return `
      <div class="repeat-item">
        <div class="repeat-item-head">
          <strong>${index + 1}</strong>
          <button class="button danger" type="button" data-remove="${removeKind}" data-index="${index}">삭제</button>
        </div>
        <label class="field">
          <span>파일명</span>
          <input data-field="filename" value="${escapeHTML(item.filename)}">
        </label>
        <label class="field">
          <span>코드</span>
          <textarea data-field="code" rows="10" class="code-input">${escapeHTML(item.code)}</textarea>
        </label>
      </div>
    `;
  }

  function readBlocks(containerId) {
    return Array.from($(containerId).querySelectorAll(".repeat-item")).map((item) => ({
      title: item.querySelector('[data-field="title"]').value,
      body: item.querySelector('[data-field="body"]').value
    }));
  }

  function readCodes(containerId) {
    return Array.from($(containerId).querySelectorAll(".repeat-item")).map((item) => ({
      filename: item.querySelector('[data-field="filename"]').value,
      code: item.querySelector('[data-field="code"]').value
    }));
  }

  function renderPageForm() {
    setValue("pageEyebrow", payload.page.eyebrow);
    setValue("pageTitle", payload.page.title);
    setValue("pageLead", payload.page.lead);
    setValue("conceptsTitleInput", payload.page.conceptsTitle);
    setValue("examplesTitleInput", payload.page.examplesTitle);
    setValue("templateTitleInput", payload.page.templateTitle);
    setValue("checklistTitleInput", payload.page.checklistTitle);
    setValue("statLabel0", payload.page.stats[0]?.label || "");
    setValue("statLabel1", payload.page.stats[1]?.label || "");
    setValue("statLabel2", payload.page.stats[2]?.label || "");
  }

  function capturePageForm() {
    payload.page = {
      ...payload.page,
      eyebrow: value("pageEyebrow"),
      title: value("pageTitle"),
      lead: value("pageLead"),
      conceptsTitle: value("conceptsTitleInput"),
      examplesTitle: value("examplesTitleInput"),
      templateTitle: value("templateTitleInput"),
      checklistTitle: value("checklistTitleInput"),
      stats: [
        { key: "concepts", label: value("statLabel0") },
        { key: "examples", label: value("statLabel1") },
        { key: "checks", label: value("statLabel2") }
      ]
    };
  }

  function renderConceptList() {
    $("conceptAdminList").innerHTML = payload.concepts.map((concept) => `
      <button class="concept-select-button ${concept.id === selectedId ? "active" : ""}" type="button" data-select-concept="${escapeHTML(concept.id)}">
        <span class="badge">${escapeHTML(concept.badge)}</span>
        <strong>${escapeHTML(concept.cardTitle)}</strong>
        <small>${escapeHTML(concept.id)}</small>
      </button>
    `).join("");
  }

  function renderConceptForm() {
    const concept = currentConcept();
    $("conceptEditorBody").hidden = !concept;
    $("deleteConceptButton").disabled = !concept;
    if (!concept) return;

    setValue("conceptId", concept.id);
    setValue("conceptBadge", concept.badge);
    setValue("conceptCardTitle", concept.cardTitle);
    setValue("conceptCardSummary", concept.cardSummary);
    setValue("detailEyebrow", concept.detailEyebrow);
    setValue("detailTitle", concept.detailTitle);
    setValue("detailSummary", concept.detailSummary);
    $("sectionList").innerHTML = concept.sections.map((item, index) => blockEditor(item, index, "section")).join("");
    $("codeList").innerHTML = concept.codes.map((item, index) => codeEditor(item, index, "code")).join("");
  }

  function captureCurrentConcept() {
    const concept = currentConcept();
    if (!concept) return;

    concept.badge = value("conceptBadge");
    concept.cardTitle = value("conceptCardTitle");
    concept.cardSummary = value("conceptCardSummary");
    concept.detailEyebrow = value("detailEyebrow");
    concept.detailTitle = value("detailTitle");
    concept.detailSummary = value("detailSummary");
    concept.sections = readBlocks("sectionList");
    concept.codes = readCodes("codeList");
  }

  function renderSharedEditors() {
    $("examplesList").innerHTML = payload.examples.map((item, index) => codeEditor(item, index, "example")).join("");
    setValue("templateFilename", payload.template.filename);
    setValue("templateCode", payload.template.code);
    $("checklistEditor").innerHTML = payload.checklist.map((item, index) => blockEditor(item, index, "check")).join("");
  }

  function captureSharedEditors() {
    payload.examples = readCodes("examplesList");
    payload.template = {
      filename: value("templateFilename"),
      code: value("templateCode")
    };
    payload.checklist = readBlocks("checklistEditor");
  }

  function renderAll() {
    renderPageForm();
    renderConceptList();
    renderConceptForm();
    renderSharedEditors();
  }

  function saveAll() {
    capturePageForm();
    captureCurrentConcept();
    captureSharedEditors();
    payload = BasicConceptStore.savePayload(payload);
    if (!payload.concepts.some((concept) => concept.id === selectedId)) {
      selectedId = payload.concepts[0]?.id || "";
    }
    renderAll();
    showMessage("기초 개념 페이지 내용을 저장했습니다.");
  }

  document.addEventListener("click", (event) => {
    const selectButton = event.target.closest("[data-select-concept]");
    if (selectButton) {
      captureCurrentConcept();
      selectedId = selectButton.dataset.selectConcept;
      renderConceptList();
      renderConceptForm();
      return;
    }

    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) {
      captureCurrentConcept();
      captureSharedEditors();
      const index = Number(removeButton.dataset.index);
      if (removeButton.dataset.remove === "section") currentConcept()?.sections.splice(index, 1);
      if (removeButton.dataset.remove === "code") currentConcept()?.codes.splice(index, 1);
      if (removeButton.dataset.remove === "example") payload.examples.splice(index, 1);
      if (removeButton.dataset.remove === "check") payload.checklist.splice(index, 1);
      renderConceptForm();
      renderSharedEditors();
    }
  });

  $("newConceptButton").addEventListener("click", () => {
    captureCurrentConcept();
    const nextNumber = payload.concepts.length + 1;
    const concept = {
      id: `concept_${Date.now().toString(36)}`,
      badge: String(nextNumber).padStart(2, "0"),
      cardTitle: "새 개념",
      cardSummary: "새 기초 개념 설명을 입력하세요.",
      detailEyebrow: "Python 기본기",
      detailTitle: "새 개념",
      detailSummary: "상세 요약을 입력하세요.",
      sections: [{ title: "개념 설명", body: "설명을 입력하세요." }],
      codes: [{ filename: "example.py", code: "print(\"hello\")" }]
    };
    payload.concepts.push(concept);
    selectedId = concept.id;
    renderConceptList();
    renderConceptForm();
  });

  $("deleteConceptButton").addEventListener("click", () => {
    const concept = currentConcept();
    if (!concept) return;
    if (!window.confirm(`${concept.cardTitle} 개념을 삭제할까요?`)) return;
    payload.concepts = payload.concepts.filter((item) => item.id !== concept.id);
    selectedId = payload.concepts[0]?.id || "";
    renderConceptList();
    renderConceptForm();
  });

  $("addSectionButton").addEventListener("click", () => {
    captureCurrentConcept();
    currentConcept()?.sections.push({ title: "새 섹션", body: "설명을 입력하세요." });
    renderConceptForm();
  });

  $("addCodeButton").addEventListener("click", () => {
    captureCurrentConcept();
    currentConcept()?.codes.push({ filename: "example.py", code: "" });
    renderConceptForm();
  });

  $("addExampleButton").addEventListener("click", () => {
    captureSharedEditors();
    payload.examples.push({ filename: "example.py", code: "" });
    renderSharedEditors();
  });

  $("addCheckButton").addEventListener("click", () => {
    captureSharedEditors();
    payload.checklist.push({ title: "새 체크 포인트", body: "내용을 입력하세요." });
    renderSharedEditors();
  });

  $("saveBasicButton").addEventListener("click", saveAll);

  $("resetBasicButton").addEventListener("click", () => {
    if (!window.confirm("기초 개념 페이지 내용을 기본값으로 되돌릴까요?")) return;
    payload = BasicConceptStore.resetPayload();
    selectedId = payload.concepts[0]?.id || "";
    renderAll();
    showMessage("기본값으로 복원했습니다.");
  });

  renderAll();
});
