document.addEventListener("DOMContentLoaded", () => {
  ArchiveUI.initThemeToggle();

  const searchInput = document.getElementById("contestSearch");
  const platformFilter = document.getElementById("platformFilter");
  const sortSelect = document.getElementById("sortSelect");
  const contestGrid = document.getElementById("contestGrid");
  const emptyState = document.getElementById("contestEmpty");
  const resultCount = document.getElementById("contestResultCount");
  const escapeHTML = ArchiveUI.escapeHTML;
  const contests = ArchiveStore.getContests();

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
  }

  function fillPlatforms() {
    unique(contests.map((contest) => contest.platform)).forEach((platform) => {
      const option = document.createElement("option");
      option.value = platform;
      option.textContent = platform;
      platformFilter.appendChild(option);
    });
  }

  function renderStats() {
    const totals = contests.reduce((acc, contest) => {
      const progress = ArchiveStore.progressOf(contest);
      acc.problems += progress.total;
      acc.solved += progress.solved;
      return acc;
    }, { problems: 0, solved: 0 });

    document.getElementById("contestTotal").textContent = contests.length;
    document.getElementById("problemTotal").textContent = totals.problems;
    document.getElementById("solvedTotal").textContent = totals.solved;
  }

  function sortContests(items) {
    const value = sortSelect.value;
    return [...items].sort((a, b) => {
      if (value === "date-asc") return (a.date || "").localeCompare(b.date || "");
      if (value === "progress-desc") return ArchiveStore.progressOf(b).progress - ArchiveStore.progressOf(a).progress;
      if (value === "progress-asc") return ArchiveStore.progressOf(a).progress - ArchiveStore.progressOf(b).progress;
      return (b.date || "").localeCompare(a.date || "");
    });
  }

  function matches(contest, keyword, platform) {
    const haystack = [contest.title, contest.platform, contest.description, contest.tags.join(" ")].join(" ");
    return (!keyword || ArchiveUI.textIncludes(haystack, keyword)) && (!platform || contest.platform === platform);
  }

  function renderContests() {
    const keyword = searchInput.value.trim();
    const platform = platformFilter.value;
    const filtered = sortContests(contests.filter((contest) => matches(contest, keyword, platform)));

    resultCount.textContent = `${filtered.length}개`;
    emptyState.hidden = filtered.length > 0;

    contestGrid.innerHTML = filtered.map((contest) => {
      const progress = ArchiveStore.progressOf(contest);
      const tags = contest.tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("");
      return `
        <a class="contest-card" href="contest-detail.html?id=${encodeURIComponent(contest.id)}">
          <div class="card-topline">
            <span class="badge">${escapeHTML(contest.platform || "플랫폼 없음")}</span>
            <span class="muted">${escapeHTML(contest.date || "-")}</span>
          </div>
          <div>
            <h3>${escapeHTML(contest.title)}</h3>
            <p>${escapeHTML(contest.description || "설명이 아직 없습니다.")}</p>
          </div>
          <div class="progress-block">
            <div class="progress-meta">
              <span>${progress.solved}/${progress.total} solved</span>
              <strong>${progress.progress}%</strong>
            </div>
            <div class="progress-bar"><span style="width:${progress.progress}%"></span></div>
          </div>
          <div class="meta-row">
            <span class="tag">총 ${progress.total}문제</span>
            <span class="tag">정답 ${progress.solved}</span>
          </div>
          <div class="tag-row">${tags}</div>
        </a>
      `;
    }).join("");
  }

  fillPlatforms();
  renderStats();
  renderContests();

  [searchInput, platformFilter, sortSelect].forEach((element) => {
    element.addEventListener("input", renderContests);
    element.addEventListener("change", renderContests);
  });
});
