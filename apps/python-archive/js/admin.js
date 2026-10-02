document.addEventListener("DOMContentLoaded", () => {
  ArchiveUI.initThemeToggle();

  const $ = (id) => document.getElementById(id);
  const escapeHTML = ArchiveUI.escapeHTML;
  const message = $("adminMessage");

  let editingProblemId = null;
  let editingContestId = null;
  let editingContestProblemId = null;

  function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
    window.clearTimeout(showMessage.timer);
    showMessage.timer = window.setTimeout(() => {
      message.hidden = true;
    }, 2600);
  }

  function option(value, label) {
    const element = document.createElement("option");
    element.value = value;
    element.textContent = label || value;
    return element;
  }

  function fillSelect(select, values, placeholder) {
    select.innerHTML = "";
    if (placeholder) select.appendChild(option("", placeholder));
    values.forEach((value) => select.appendChild(option(value)));
  }

  function value(id) {
    return $(id).value.trim();
  }

  function setValue(id, nextValue) {
    $(id).value = nextValue ?? "";
  }

  function csv(id) {
    return ArchiveStore.arrayify(value(id));
  }

  function setCsv(id, values) {
    setValue(id, ArchiveStore.arrayify(values).join(", "));
  }

  function setActiveTab(tab) {
    const panels = {
      problems: $("problemsPanel"),
      contests: $("contestsPanel"),
      json: $("jsonPanel")
    };

    Object.entries(panels).forEach(([name, panel]) => {
      panel.hidden = name !== tab;
    });

    document.querySelectorAll("[data-admin-tab]").forEach((button) => {
      button.classList.toggle("active", button.dataset.adminTab === tab);
    });
  }

  function getProblemById(id) {
    return ArchiveStore.getProblems().find((problem) => problem.id === id);
  }

  function getContestById(id) {
    return ArchiveStore.getContests().find((contest) => contest.id === id);
  }

  function collectProblemForm() {
    const now = ArchiveStore.today();
    const existing = editingProblemId ? getProblemById(editingProblemId) : null;
    return {
      id: value("problemId") || ArchiveStore.createId("py_algo"),
      language: value("problemLanguage") || "python",
      title: value("problemTitle"),
      summary: value("problemSummary"),
      description: value("problemDescription"),
      category: value("problemCategory"),
      algorithm: csv("problemAlgorithm"),
      difficulty: value("problemDifficulty") || "Unrated",
      input: value("problemInput"),
      output: value("problemOutput"),
      exampleInput: $("problemExampleInput").value,
      exampleOutput: $("problemExampleOutput").value,
      idea: value("problemIdea"),
      code: $("problemCode").value,
      timeComplexity: value("problemTime"),
      spaceComplexity: value("problemSpace"),
      learned: value("problemLearned"),
      tags: csv("problemTags"),
      createdAt: value("problemCreatedAt") || existing?.createdAt || now,
      updatedAt: value("problemUpdatedAt") || now
    };
  }

  function fillProblemForm(problem) {
    const data = problem || {
      id: "",
      language: "python",
      title: "",
      summary: "",
      description: "",
      category: ArchiveStore.categories[0],
      algorithm: [],
      difficulty: "Bronze",
      input: "",
      output: "",
      exampleInput: "",
      exampleOutput: "",
      idea: "",
      code: "",
      timeComplexity: "",
      spaceComplexity: "",
      learned: "",
      tags: [],
      createdAt: ArchiveStore.today(),
      updatedAt: ArchiveStore.today()
    };

    editingProblemId = data.id || null;
    setValue("problemId", data.id);
    setValue("problemLanguage", data.language);
    setValue("problemTitle", data.title);
    setValue("problemSummary", data.summary);
    setValue("problemDescription", data.description);
    setValue("problemCategory", data.category);
    setCsv("problemAlgorithm", data.algorithm);
    setValue("problemDifficulty", data.difficulty);
    setValue("problemInput", data.input);
    setValue("problemOutput", data.output);
    setValue("problemExampleInput", data.exampleInput);
    setValue("problemExampleOutput", data.exampleOutput);
    setValue("problemIdea", data.idea);
    setValue("problemCode", data.code);
    setValue("problemTime", data.timeComplexity);
    setValue("problemSpace", data.spaceComplexity);
    setValue("problemLearned", data.learned);
    setCsv("problemTags", data.tags);
    setValue("problemCreatedAt", data.createdAt);
    setValue("problemUpdatedAt", data.updatedAt);
  }

  function renderProblemList() {
    const query = value("adminProblemSearch");
    const list = $("adminProblemList");
    const problems = ArchiveStore.getProblems().filter((problem) => {
      const haystack = [problem.title, problem.summary, problem.category, problem.algorithm.join(" "), problem.tags.join(" ")].join(" ");
      return !query || ArchiveUI.textIncludes(haystack, query);
    });

    list.innerHTML = problems.map((problem) => `
      <article class="admin-item">
        <strong>${escapeHTML(problem.title)}</strong>
        <small>${escapeHTML(problem.difficulty)} · ${escapeHTML(problem.algorithm.join(", ") || problem.category || "분류 없음")}</small>
        <div class="item-actions">
          <button class="button secondary" type="button" data-problem-action="edit" data-id="${escapeHTML(problem.id)}">수정</button>
          <button class="button danger" type="button" data-problem-action="delete" data-id="${escapeHTML(problem.id)}">삭제</button>
          <a class="button ghost" href="detail.html?id=${encodeURIComponent(problem.id)}">보기</a>
        </div>
      </article>
    `).join("") || `<p class="empty-state">등록된 문제가 없습니다.</p>`;
  }

  function collectContestForm(problemsOverride) {
    const existing = editingContestId ? getContestById(editingContestId) : null;
    return {
      id: value("contestId") || ArchiveStore.createId("contest"),
      title: value("contestTitle"),
      platform: value("contestPlatform"),
      date: value("contestDate") || ArchiveStore.today(),
      description: value("contestDescription"),
      tags: csv("contestTags"),
      problems: problemsOverride || existing?.problems || []
    };
  }

  function fillContestForm(contest) {
    const data = contest || {
      id: "",
      title: "",
      platform: "",
      date: ArchiveStore.today(),
      description: "",
      tags: [],
      problems: []
    };

    editingContestId = data.id || null;
    setValue("contestId", data.id);
    setValue("contestTitle", data.title);
    setValue("contestPlatform", data.platform);
    setValue("contestDate", data.date);
    setValue("contestDescription", data.description);
    setCsv("contestTags", data.tags);
    fillContestProblemForm(null);
    renderContestProblemList();
  }

  function saveContestFromForm() {
    const contest = collectContestForm();
    if (!contest.title) {
      showMessage("대회명을 입력해 주세요.");
      return null;
    }
    const saved = ArchiveStore.saveContest(contest);
    editingContestId = saved.id;
    setValue("contestId", saved.id);
    renderContestList();
    return saved;
  }

  function collectContestProblemForm() {
    return {
      id: value("contestProblemId") || ArchiveStore.createId("contest_problem"),
      number: value("contestProblemNumber"),
      title: value("contestProblemTitle"),
      summary: value("contestProblemSummary"),
      description: value("contestProblemDescription"),
      difficulty: value("contestProblemDifficulty") || "Unrated",
      category: value("contestProblemCategory"),
      algorithm: csv("contestProblemAlgorithm"),
      input: value("contestProblemInput"),
      output: value("contestProblemOutput"),
      exampleInput: $("contestProblemExampleInput").value,
      exampleOutput: $("contestProblemExampleOutput").value,
      status: value("contestProblemStatus") || "미풀이",
      result: value("contestProblemResult") || "Not Submitted",
      solveTime: value("contestProblemSolveTime"),
      idea: value("contestProblemIdea"),
      code: $("contestProblemCode").value,
      timeComplexity: value("contestProblemTime"),
      spaceComplexity: value("contestProblemSpace"),
      learned: value("contestProblemLearned"),
      failReason: value("contestProblemFailReason"),
      improvement: value("contestProblemImprovement"),
      reviewNeeded: $("contestProblemReviewNeeded").checked,
      memo: value("contestProblemMemo")
    };
  }

  function fillContestProblemForm(problem) {
    const data = problem || {
      id: "",
      number: "",
      title: "",
      summary: "",
      description: "",
      difficulty: "Bronze",
      category: ArchiveStore.categories[0],
      algorithm: [],
      input: "",
      output: "",
      exampleInput: "",
      exampleOutput: "",
      status: "미풀이",
      result: "Not Submitted",
      solveTime: "",
      idea: "",
      code: "",
      timeComplexity: "",
      spaceComplexity: "",
      learned: "",
      failReason: "",
      improvement: "",
      reviewNeeded: false,
      memo: ""
    };

    editingContestProblemId = data.id || null;
    setValue("contestProblemId", data.id);
    setValue("contestProblemNumber", data.number);
    setValue("contestProblemTitle", data.title);
    setValue("contestProblemSummary", data.summary);
    setValue("contestProblemDescription", data.description);
    setValue("contestProblemDifficulty", data.difficulty);
    setValue("contestProblemCategory", data.category);
    setCsv("contestProblemAlgorithm", data.algorithm);
    setValue("contestProblemInput", data.input);
    setValue("contestProblemOutput", data.output);
    setValue("contestProblemExampleInput", data.exampleInput);
    setValue("contestProblemExampleOutput", data.exampleOutput);
    setValue("contestProblemStatus", data.status);
    setValue("contestProblemResult", data.result);
    setValue("contestProblemSolveTime", data.solveTime);
    setValue("contestProblemIdea", data.idea);
    setValue("contestProblemCode", data.code);
    setValue("contestProblemTime", data.timeComplexity);
    setValue("contestProblemSpace", data.spaceComplexity);
    setValue("contestProblemLearned", data.learned);
    setValue("contestProblemFailReason", data.failReason);
    setValue("contestProblemImprovement", data.improvement);
    $("contestProblemReviewNeeded").checked = Boolean(data.reviewNeeded);
    setValue("contestProblemMemo", data.memo);
  }

  function renderContestList() {
    const query = value("adminContestSearch");
    const list = $("adminContestList");
    const contests = ArchiveStore.getContests().filter((contest) => {
      const haystack = [contest.title, contest.platform, contest.description, contest.tags.join(" ")].join(" ");
      return !query || ArchiveUI.textIncludes(haystack, query);
    });

    list.innerHTML = contests.map((contest) => {
      const progress = ArchiveStore.progressOf(contest);
      return `
        <article class="admin-item">
          <strong>${escapeHTML(contest.title)}</strong>
          <small>${escapeHTML(contest.platform || "플랫폼 없음")} · ${progress.solved}/${progress.total} 정답 · ${escapeHTML(contest.date || "-")}</small>
          <div class="item-actions">
            <button class="button secondary" type="button" data-contest-action="edit" data-id="${escapeHTML(contest.id)}">수정</button>
            <button class="button danger" type="button" data-contest-action="delete" data-id="${escapeHTML(contest.id)}">삭제</button>
            <a class="button ghost" href="contest-detail.html?id=${encodeURIComponent(contest.id)}">보기</a>
          </div>
        </article>
      `;
    }).join("") || `<p class="empty-state">등록된 대회가 없습니다.</p>`;
  }

  function renderContestProblemList() {
    const list = $("contestProblemList");
    const contest = editingContestId ? getContestById(editingContestId) : null;

    if (!contest) {
      list.innerHTML = `<p class="empty-state">대회를 먼저 저장하거나 선택해 주세요.</p>`;
      return;
    }

    list.innerHTML = contest.problems.map((problem) => `
      <article class="admin-item">
        <strong>${escapeHTML(problem.number ? `${problem.number}. ${problem.title}` : problem.title)}</strong>
        <small>${escapeHTML(problem.status)} · ${escapeHTML(problem.result)} · ${escapeHTML(problem.algorithm.join(", ") || "알고리즘 없음")}</small>
        <div class="item-actions">
          <button class="button secondary" type="button" data-contest-problem-action="edit" data-id="${escapeHTML(problem.id)}">수정</button>
          <button class="button danger" type="button" data-contest-problem-action="delete" data-id="${escapeHTML(problem.id)}">삭제</button>
          <a class="button ghost" href="detail.html?contestId=${encodeURIComponent(contest.id)}&problemId=${encodeURIComponent(problem.id)}">보기</a>
        </div>
      </article>
    `).join("") || `<p class="empty-state">등록된 대회 문제가 없습니다.</p>`;
  }

  function renderAllLists() {
    renderProblemList();
    renderContestList();
    renderContestProblemList();
  }

  function enableCodeTabs() {
    document.querySelectorAll("textarea.code-input").forEach((textarea) => {
      textarea.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        event.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = `${textarea.value.slice(0, start)}\t${textarea.value.slice(end)}`;
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      });
    });
  }

  function exportToTextarea(payload, filename) {
    const text = JSON.stringify(payload, null, 2);
    $("jsonTextarea").value = text;
    ArchiveStore.downloadJSON(filename, payload);
    showMessage("JSON을 생성하고 다운로드했습니다.");
  }

  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.adminTab));
  });

  $("problemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const problem = collectProblemForm();
    if (!problem.title) {
      showMessage("문제 제목을 입력해 주세요.");
      return;
    }
    const saved = ArchiveStore.saveProblem(problem);
    fillProblemForm(saved);
    renderProblemList();
    showMessage("문제를 저장했습니다.");
  });

  $("newProblemButton").addEventListener("click", () => fillProblemForm(null));
  $("deleteProblemButton").addEventListener("click", () => {
    const id = value("problemId") || editingProblemId;
    if (!id) {
      showMessage("삭제할 문제를 선택해 주세요.");
      return;
    }
    if (!confirm("이 문제를 삭제할까요?")) return;
    ArchiveStore.deleteProblem(id);
    fillProblemForm(null);
    renderProblemList();
    showMessage("문제를 삭제했습니다.");
  });

  $("adminProblemSearch").addEventListener("input", renderProblemList);
  $("adminProblemList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-problem-action]");
    if (!button) return;
    const problem = getProblemById(button.dataset.id);
    if (button.dataset.problemAction === "edit" && problem) {
      fillProblemForm(problem);
      showMessage("문제를 불러왔습니다.");
    }
    if (button.dataset.problemAction === "delete" && problem) {
      if (!confirm("이 문제를 삭제할까요?")) return;
      ArchiveStore.deleteProblem(problem.id);
      if (editingProblemId === problem.id) fillProblemForm(null);
      renderProblemList();
      showMessage("문제를 삭제했습니다.");
    }
  });

  $("contestForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const saved = saveContestFromForm();
    if (!saved) return;
    fillContestForm(saved);
    renderContestList();
    showMessage("대회를 저장했습니다.");
  });

  $("newContestButton").addEventListener("click", () => fillContestForm(null));
  $("deleteContestButton").addEventListener("click", () => {
    const id = value("contestId") || editingContestId;
    if (!id) {
      showMessage("삭제할 대회를 선택해 주세요.");
      return;
    }
    if (!confirm("이 대회를 삭제할까요?")) return;
    ArchiveStore.deleteContest(id);
    fillContestForm(null);
    renderContestList();
    showMessage("대회를 삭제했습니다.");
  });

  $("newContestProblemButton").addEventListener("click", () => fillContestProblemForm(null));
  $("saveContestProblemButton").addEventListener("click", () => {
    const savedContest = saveContestFromForm();
    if (!savedContest) return;

    const rawProblem = collectContestProblemForm();
    if (!rawProblem.title) {
      showMessage("대회 문제 제목을 입력해 주세요.");
      return;
    }
    const problem = ArchiveStore.normalizeContestProblem(rawProblem);

    const problems = savedContest.problems.filter((item) => item.id !== problem.id);
    problems.push(problem);
    const updatedContest = ArchiveStore.saveContest({ ...savedContest, problems });
    editingContestId = updatedContest.id;
    fillContestProblemForm(problem);
    renderContestList();
    renderContestProblemList();
    showMessage("대회 문제를 저장했습니다.");
  });

  $("deleteContestProblemButton").addEventListener("click", () => {
    const contest = editingContestId ? getContestById(editingContestId) : null;
    const problemId = value("contestProblemId") || editingContestProblemId;
    if (!contest || !problemId) {
      showMessage("삭제할 대회 문제를 선택해 주세요.");
      return;
    }
    if (!confirm("이 대회 문제를 삭제할까요?")) return;
    const problems = contest.problems.filter((problem) => problem.id !== problemId);
    ArchiveStore.saveContest({ ...contest, problems });
    fillContestProblemForm(null);
    renderContestList();
    renderContestProblemList();
    showMessage("대회 문제를 삭제했습니다.");
  });

  $("adminContestSearch").addEventListener("input", renderContestList);
  $("adminContestList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-contest-action]");
    if (!button) return;
    const contest = getContestById(button.dataset.id);
    if (button.dataset.contestAction === "edit" && contest) {
      fillContestForm(contest);
      showMessage("대회를 불러왔습니다.");
    }
    if (button.dataset.contestAction === "delete" && contest) {
      if (!confirm("이 대회를 삭제할까요?")) return;
      ArchiveStore.deleteContest(contest.id);
      if (editingContestId === contest.id) fillContestForm(null);
      renderContestList();
      showMessage("대회를 삭제했습니다.");
    }
  });

  $("contestProblemList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-contest-problem-action]");
    if (!button) return;
    const contest = editingContestId ? getContestById(editingContestId) : null;
    const problem = contest?.problems.find((item) => item.id === button.dataset.id);
    if (!contest || !problem) return;

    if (button.dataset.contestProblemAction === "edit") {
      fillContestProblemForm(problem);
      showMessage("대회 문제를 불러왔습니다.");
    }

    if (button.dataset.contestProblemAction === "delete") {
      if (!confirm("이 대회 문제를 삭제할까요?")) return;
      const problems = contest.problems.filter((item) => item.id !== problem.id);
      ArchiveStore.saveContest({ ...contest, problems });
      fillContestProblemForm(null);
      renderContestList();
      renderContestProblemList();
      showMessage("대회 문제를 삭제했습니다.");
    }
  });

  $("jsonFileInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      $("jsonTextarea").value = reader.result;
      showMessage("JSON 파일을 읽었습니다. 가져오기를 누르면 반영됩니다.");
    });
    reader.readAsText(file);
  });

  $("importJsonButton").addEventListener("click", () => {
    try {
      const payload = JSON.parse($("jsonTextarea").value);
      const result = ArchiveStore.importArchive(payload);
      fillProblemForm(null);
      fillContestForm(null);
      renderAllLists();
      showMessage(`JSON을 반영했습니다. 문제 ${result.problems}개, 대회 ${result.contests}개`);
    } catch (error) {
      showMessage(`가져오기 실패: ${error.message}`);
    }
  });

  $("exportAllButton").addEventListener("click", () => {
    exportToTextarea(ArchiveStore.exportArchive(), "python-algorithm-archive.json");
  });

  $("exportProblemsButton").addEventListener("click", () => {
    exportToTextarea({ problems: ArchiveStore.getProblems() }, "python-algorithm-problems.json");
  });

  $("exportContestsButton").addEventListener("click", () => {
    exportToTextarea({ contests: ArchiveStore.getContests() }, "python-algorithm-contests.json");
  });

  $("resetAllButton").addEventListener("click", () => {
    if (!confirm("LocalStorage에 저장된 변경 사항을 모두 초기화할까요? 기본 data.js 샘플은 유지됩니다.")) return;
    ArchiveStore.resetAll();
    fillProblemForm(null);
    fillContestForm(null);
    renderAllLists();
    showMessage("저장 데이터를 초기화했습니다.");
  });

  fillSelect($("problemCategory"), ArchiveStore.categories, "분류 선택");
  fillSelect($("problemDifficulty"), ArchiveStore.difficulties);
  fillSelect($("contestProblemDifficulty"), ArchiveStore.difficulties);
  fillSelect($("contestProblemCategory"), ArchiveStore.categories, "분류 선택");
  fillSelect($("contestProblemStatus"), ArchiveStore.statuses);
  fillSelect($("contestProblemResult"), ArchiveStore.results);

  enableCodeTabs();
  setActiveTab("problems");
  fillProblemForm(null);
  fillContestForm(null);
  renderAllLists();
});
