document.addEventListener("DOMContentLoaded", () => {
  ArchiveUI.initThemeToggle();

  const params = new URLSearchParams(location.search);
  const contestId = params.get("id");
  const root = document.getElementById("contestDetailRoot");
  const escapeHTML = ArchiveUI.escapeHTML;
  const contest = ArchiveStore.getContests().find((item) => item.id === contestId);

  function renderNotFound() {
    root.innerHTML = `
      <section class="detail-hero">
        <h1>대회를 찾을 수 없습니다</h1>
        <p class="lead">URL의 ID를 확인하거나 관리자 페이지에서 데이터를 다시 가져와 주세요.</p>
      </section>
    `;
  }

  function render() {
    if (!contest) {
      renderNotFound();
      return;
    }

    const progress = ArchiveStore.progressOf(contest);
    const tags = contest.tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("");
    const rows = contest.problems.map((problem) => {
      const algorithms = problem.algorithm.map((item) => `<span class="tag">${escapeHTML(item)}</span>`).join("");
      const statusClass = ArchiveUI.statusClass(problem.status);
      const resultClass = ArchiveUI.resultClass(problem.result);
      return `
        <tr>
          <td><strong>${escapeHTML(problem.number || "-")}</strong></td>
          <td>
            <strong>${escapeHTML(problem.title)}</strong>
            <div class="muted">${escapeHTML(problem.category || "")}</div>
          </td>
          <td><span class="badge difficulty ${ArchiveUI.difficultyClass(problem.difficulty)}">${escapeHTML(problem.difficulty)}</span></td>
          <td><div class="chip-row">${algorithms}</div></td>
          <td><span class="status-pill ${statusClass}">${escapeHTML(problem.status)}</span></td>
          <td><span class="result-pill ${resultClass}">${escapeHTML(problem.result)}</span></td>
          <td>${escapeHTML(problem.solveTime || "-")}</td>
          <td>${escapeHTML(problem.memo || "-")}</td>
          <td>
            <a class="link-button" href="detail.html?contestId=${encodeURIComponent(contest.id)}&problemId=${encodeURIComponent(problem.id)}">상세 보기</a>
          </td>
        </tr>
      `;
    }).join("");

    root.innerHTML = `
      <section class="summary-band">
        <div>
          <p class="eyebrow">${escapeHTML(contest.platform || "Contest")}</p>
          <h1>${escapeHTML(contest.title)}</h1>
          <p class="lead">${escapeHTML(contest.description || "설명이 아직 없습니다.")}</p>
        </div>
        <div class="chip-row">${tags}</div>
        <div class="contest-summary-grid">
          <div class="mini-stat">
            <strong>${escapeHTML(contest.date || "-")}</strong>
            <span>날짜</span>
          </div>
          <div class="mini-stat">
            <strong>${progress.total}</strong>
            <span>전체 문제</span>
          </div>
          <div class="mini-stat">
            <strong>${progress.solved}</strong>
            <span>푼 문제</span>
          </div>
          <div class="mini-stat">
            <strong>${progress.wrong}</strong>
            <span>틀린 문제</span>
          </div>
          <div class="mini-stat">
            <strong>${progress.unsolved}</strong>
            <span>미풀이 문제</span>
          </div>
          <div class="mini-stat">
            <strong>${progress.progress}%</strong>
            <span>진행률</span>
          </div>
        </div>
        <div class="progress-block">
          <div class="progress-meta">
            <span>${progress.solved}/${progress.total} solved</span>
            <strong>${progress.progress}%</strong>
          </div>
          <div class="progress-bar"><span style="width:${progress.progress}%"></span></div>
        </div>
      </section>

      <section>
        <div class="section-line">
          <h2>문제 리스트</h2>
          <span class="muted">${progress.total}개</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>난이도</th>
                <th>알고리즘</th>
                <th>상태</th>
                <th>제출 결과</th>
                <th>풀이 시간</th>
                <th>메모</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="9">등록된 문제가 없습니다.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  render();
});
