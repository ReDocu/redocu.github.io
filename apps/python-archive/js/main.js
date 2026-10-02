document.addEventListener("DOMContentLoaded", () => {
  ArchiveUI.initThemeToggle();

  const searchInput = document.getElementById("searchInput");
  const algorithmFilter = document.getElementById("algorithmFilter");
  const difficultyFilter = document.getElementById("difficultyFilter");
  const problemGrid = document.getElementById("problemGrid");
  const emptyState = document.getElementById("emptyState");
  const resultCount = document.getElementById("resultCount");

  const problems = ArchiveStore.getProblems();
  const escapeHTML = ArchiveUI.escapeHTML;

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
  }

  function fillSelect(select, values) {
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function renderStats() {
    const algorithms = unique(problems.flatMap((problem) => problem.algorithm));
    const recent = problems.reduce((latest, problem) => {
      return (problem.updatedAt || "") > latest ? problem.updatedAt : latest;
    }, "");

    document.getElementById("totalCount").textContent = problems.length;
    document.getElementById("algorithmCount").textContent = algorithms.length;
    document.getElementById("recentDate").textContent = recent || "-";
  }

  function matches(problem, keyword, algorithm, difficulty) {
    const haystack = [
      problem.title,
      problem.summary,
      problem.description,
      problem.category,
      problem.difficulty,
      problem.algorithm.join(" "),
      problem.tags.join(" ")
    ].join(" ");

    const keywordMatch = !keyword || ArchiveUI.textIncludes(haystack, keyword);
    const algorithmMatch = !algorithm || problem.algorithm.includes(algorithm) || problem.category === algorithm;
    const difficultyMatch = !difficulty || problem.difficulty === difficulty;
    return keywordMatch && algorithmMatch && difficultyMatch;
  }

  function renderProblems() {
    const keyword = searchInput.value.trim();
    const algorithm = algorithmFilter.value;
    const difficulty = difficultyFilter.value;
    const filtered = problems.filter((problem) => matches(problem, keyword, algorithm, difficulty));

    resultCount.textContent = `${filtered.length}개`;
    emptyState.hidden = filtered.length > 0;

    problemGrid.innerHTML = filtered.map((problem) => {
      const algorithms = problem.algorithm.map((item) => `<span class="tag">${escapeHTML(item)}</span>`).join("");
      const tags = problem.tags.slice(0, 3).map((item) => `<span class="tag">${escapeHTML(item)}</span>`).join("");
      const difficultyClass = ArchiveUI.difficultyClass(problem.difficulty);

      return `
        <a class="problem-card" href="detail.html?id=${encodeURIComponent(problem.id)}">
          <div class="card-topline">
            <span class="badge difficulty ${difficultyClass}">${escapeHTML(problem.difficulty)}</span>
            <span class="muted">${escapeHTML(ArchiveUI.compactDate(problem.updatedAt || problem.createdAt))}</span>
          </div>
          <div>
            <h3>${escapeHTML(problem.title)}</h3>
            <p>${escapeHTML(problem.summary || "요약이 아직 없습니다.")}</p>
          </div>
          <div class="chip-row">${algorithms || `<span class="tag">${escapeHTML(problem.category || "분류 없음")}</span>`}</div>
          <div class="tag-row">${tags}</div>
        </a>
      `;
    }).join("");
  }

  const algorithms = unique([...ArchiveStore.categories, ...problems.flatMap((problem) => problem.algorithm), ...problems.map((problem) => problem.category)]);
  const difficulties = unique([...ArchiveStore.difficulties, ...problems.map((problem) => problem.difficulty)]);
  fillSelect(algorithmFilter, algorithms);
  fillSelect(difficultyFilter, difficulties);
  renderStats();
  renderProblems();

  [searchInput, algorithmFilter, difficultyFilter].forEach((element) => {
    element.addEventListener("input", renderProblems);
    element.addEventListener("change", renderProblems);
  });
});
