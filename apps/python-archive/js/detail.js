document.addEventListener("DOMContentLoaded", () => {
  ArchiveUI.initThemeToggle();

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const contestId = params.get("contestId");
  const problemId = params.get("problemId");
  const root = document.getElementById("detailRoot");
  const backLink = document.getElementById("backLink");
  const escapeHTML = ArchiveUI.escapeHTML;
  const copySnippets = [];

  function section(title, body) {
    return `
      <section class="detail-card">
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(body || "-")}</p>
      </section>
    `;
  }

  function exampleBlock(title, content) {
    return `
      <div class="code-shell example-code">
        <div class="code-titlebar"><span>${escapeHTML(title)}</span></div>
        <pre><code>${escapeHTML(content || "")}</code></pre>
      </div>
    `;
  }

  function codeBlock(code, filename) {
    const index = copySnippets.push(code || "") - 1;
    return `
      <div class="code-shell">
        <div class="code-titlebar">
          <span>${escapeHTML(filename || "solution.py")}</span>
          <button class="copy-button" type="button" data-copy-index="${index}">복사</button>
        </div>
        <pre><code>${escapeHTML(code || "# 아직 등록된 코드가 없습니다.")}</code></pre>
      </div>
    `;
  }

  function renderProblem(problem, contest) {
    const algorithms = problem.algorithm.map((item) => `<span class="tag">${escapeHTML(item)}</span>`).join("");
    const tags = (problem.tags || []).map((item) => `<span class="tag">${escapeHTML(item)}</span>`).join("");
    const difficultyClass = ArchiveUI.difficultyClass(problem.difficulty);
    const isContestProblem = Boolean(contest);

    const contestMeta = isContestProblem ? `
      <div class="detail-meta-grid">
        <div class="mini-stat">
          <strong>${escapeHTML(problem.status)}</strong>
          <span>상태</span>
        </div>
        <div class="mini-stat">
          <strong>${escapeHTML(problem.result)}</strong>
          <span>제출 결과</span>
        </div>
        <div class="mini-stat">
          <strong>${escapeHTML(problem.solveTime || "-")}</strong>
          <span>풀이 시간</span>
        </div>
        <div class="mini-stat">
          <strong>${problem.reviewNeeded ? "필요" : "아님"}</strong>
          <span>복습 여부</span>
        </div>
      </div>
    ` : "";

    root.innerHTML = `
      <header class="detail-hero">
        <div class="card-topline">
          <span class="badge difficulty ${difficultyClass}">${escapeHTML(problem.difficulty)}</span>
          <span class="muted">${escapeHTML(isContestProblem ? contest.title : ArchiveUI.compactDate(problem.updatedAt || problem.createdAt))}</span>
        </div>
        <div>
          <p class="eyebrow">${escapeHTML(problem.category || "알고리즘")}</p>
          <h1>${escapeHTML(isContestProblem && problem.number ? `${problem.number}. ${problem.title}` : problem.title)}</h1>
          <p class="lead">${escapeHTML(problem.summary || "요약이 아직 없습니다.")}</p>
        </div>
        <div class="chip-row">${algorithms}${tags}</div>
        ${contestMeta}
      </header>

      ${section("문제 설명", problem.description)}
      <section class="detail-card">
        <h2>입력 / 출력</h2>
        <div class="example-grid">
          ${sectionlessText("입력", problem.input)}
          ${sectionlessText("출력", problem.output)}
        </div>
      </section>
      <section class="detail-card">
        <h2>예제</h2>
        <div class="example-grid">
          ${exampleBlock("example input", problem.exampleInput)}
          ${exampleBlock("example output", problem.exampleOutput)}
        </div>
      </section>
      ${section("풀이 아이디어", problem.idea)}
      <section class="detail-card">
        <h2>파이썬 코드</h2>
        ${codeBlock(problem.code, "solution.py")}
      </section>
      <section class="detail-card">
        <h2>복잡도</h2>
        <div class="complexity-grid">
          <div class="mini-stat">
            <strong>${escapeHTML(problem.timeComplexity || "-")}</strong>
            <span>시간복잡도</span>
          </div>
          <div class="mini-stat">
            <strong>${escapeHTML(problem.spaceComplexity || "-")}</strong>
            <span>공간복잡도</span>
          </div>
        </div>
      </section>
      ${section("배운 점", problem.learned)}
      ${isContestProblem ? section("실패 원인", problem.failReason) + section("개선 포인트", problem.improvement) + section("메모", problem.memo) : ""}
    `;
  }

  function sectionlessText(title, body) {
    return `
      <div class="mini-stat">
        <span>${escapeHTML(title)}</span>
        <p>${escapeHTML(body || "-")}</p>
      </div>
    `;
  }

  function renderNotFound() {
    root.innerHTML = `
      <section class="detail-hero">
        <h1>문제를 찾을 수 없습니다</h1>
        <p class="lead">URL의 ID를 확인하거나 관리자 페이지에서 데이터를 다시 가져와 주세요.</p>
      </section>
    `;
  }

  if (contestId && problemId) {
    const contest = ArchiveStore.getContests().find((item) => item.id === contestId);
    const problem = contest?.problems.find((item) => item.id === problemId);
    backLink.href = `contest-detail.html?id=${encodeURIComponent(contestId)}`;
    backLink.textContent = "← 대회 상세로";
    if (contest && problem) renderProblem(problem, contest);
    else renderNotFound();
  } else {
    const problem = ArchiveStore.getProblems().find((item) => item.id === id);
    backLink.href = "index.html";
    backLink.textContent = "← 문제 목록으로";
    if (problem) renderProblem(problem);
    else renderNotFound();
  }

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-index]");
    if (!button) return;
    const code = copySnippets[Number(button.dataset.copyIndex)] || "";
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = "복사됨";
      setTimeout(() => { button.textContent = "복사"; }, 1200);
    } catch (error) {
      button.textContent = "복사 실패";
      setTimeout(() => { button.textContent = "복사"; }, 1200);
    }
  });
});
