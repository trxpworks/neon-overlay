const REPO_OWNER = "trxpworks";
const REPO_NAME = "neon-overlay";
const RELEASES_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=6`;
const FALLBACK_RELEASE_PAGE = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
const FALLBACK_PORTABLE = `${FALLBACK_RELEASE_PAGE}/download/Neon-Overlay-Portable.exe`;
const FALLBACK_SETUP = `${FALLBACK_RELEASE_PAGE}/download/Neon-Overlay-Setup.exe`;

const revealItems = Array.from(document.querySelectorAll(".reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.2, rootMargin: "0px 0px -6% 0px" },
  );

  for (const item of revealItems) {
    observer.observe(item);
  }
} else {
  for (const item of revealItems) {
    item.classList.add("revealed");
  }
}

const preview = document.querySelector(".preview-shell");
const hero = document.querySelector(".hero");

if (preview && hero) {
  hero.addEventListener("mousemove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 6;
    const rotateX = (0.5 - y) * 5;
    preview.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  hero.addEventListener("mouseleave", () => {
    preview.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  });
}

const latestVersionEl = document.getElementById("latestVersion");
const latestPublishedEl = document.getElementById("latestPublished");
const latestStatusEl = document.getElementById("latestStatus");
const releaseFeedHintEl = document.getElementById("releaseFeedHint");
const releaseListEl = document.getElementById("releaseList");

const portableButtons = [
  document.getElementById("heroPortableBtn"),
  document.getElementById("latestPortableBtn"),
  document.getElementById("downloadPortableBtn"),
].filter(Boolean);

const setupButtons = [
  document.getElementById("heroSetupBtn"),
  document.getElementById("latestSetupBtn"),
  document.getElementById("downloadSetupBtn"),
].filter(Boolean);

const releasePageButtons = [document.getElementById("heroReleaseBtn"), document.getElementById("latestReleasePageBtn")].filter(
  Boolean,
);

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeTag(tag) {
  return String(tag || "").replace(/^v/i, "").trim();
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function sanitizeNotes(value) {
  const raw = String(value || "").replace(/\r/g, "");
  const cleaned = raw
    .replace(/[`*_>#]/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "No release notes added yet.";
  }

  if (cleaned.length <= 160) {
    return cleaned;
  }

  return `${cleaned.slice(0, 157).trim()}...`;
}

function findAssetDownload(release, matcher) {
  const assets = Array.isArray(release?.assets) ? release.assets : [];
  const asset = assets.find((item) => matcher.test(String(item?.name || "")));
  return String(asset?.browser_download_url || "");
}

function setStatusIndicator(label, tone = "info") {
  if (!latestStatusEl) {
    return;
  }

  latestStatusEl.textContent = label;
  latestStatusEl.classList.remove("status-indicator-info", "status-indicator-ok", "status-indicator-error");

  if (tone === "ok") {
    latestStatusEl.classList.add("status-indicator-ok");
    return;
  }

  if (tone === "error") {
    latestStatusEl.classList.add("status-indicator-error");
    return;
  }

  latestStatusEl.classList.add("status-indicator-info");
}

function setDownloadTargets({ portableUrl, setupUrl, releasePageUrl }) {
  for (const button of portableButtons) {
    button.href = portableUrl;
  }

  for (const button of setupButtons) {
    button.href = setupUrl;
  }

  for (const button of releasePageButtons) {
    button.href = releasePageUrl;
  }
}

function buildReleaseItem(release) {
  const tag = String(release?.tag_name || release?.name || "Unknown").trim();
  const version = normalizeTag(tag) || "Unknown";
  const title = String(release?.name || tag || "Release").trim();
  const notes = sanitizeNotes(release?.body);
  const published = formatDate(release?.published_at || release?.created_at);
  const assetsCount = Array.isArray(release?.assets) ? release.assets.length : 0;

  const setupUrl = findAssetDownload(release, /setup|installer|nsis/i);
  const portableUrl = findAssetDownload(release, /portable/i);
  const releasePageUrl = String(release?.html_url || FALLBACK_RELEASE_PAGE);

  const actions = [];
  if (portableUrl) {
    actions.push(`<a class="btn btn-primary" href="${escapeHtml(portableUrl)}" target="_blank" rel="noreferrer">Portable</a>`);
  }

  if (setupUrl) {
    actions.push(`<a class="btn btn-secondary" href="${escapeHtml(setupUrl)}" target="_blank" rel="noreferrer">Installer</a>`);
  }

  actions.push(`<a class="btn btn-ghost" href="${escapeHtml(releasePageUrl)}" target="_blank" rel="noreferrer">Notes</a>`);

  return `
    <article class="release-item">
      <div class="release-item-head">
        <h4>${escapeHtml(title)}</h4>
        <span class="release-tag">v${escapeHtml(version)}</span>
      </div>
      <p>${escapeHtml(notes)}</p>
      <p class="release-item-meta">Published ${escapeHtml(published)} | ${assetsCount} assets</p>
      <div class="release-item-actions">${actions.join("")}</div>
    </article>
  `;
}

function setFallbackReleaseState(message) {
  if (latestVersionEl) {
    latestVersionEl.textContent = "Latest";
  }

  if (latestPublishedEl) {
    latestPublishedEl.textContent = "-";
  }

  setStatusIndicator("Offline", "error");

  if (releaseFeedHintEl) {
    releaseFeedHintEl.textContent = message;
  }

  if (releaseListEl) {
    releaseListEl.innerHTML = `
      <article class="release-item">
        <div class="release-item-head">
          <h4>Could not load release feed</h4>
          <span class="release-tag">Fallback</span>
        </div>
        <p>${escapeHtml(message)}. Download buttons still point to the latest release URL.</p>
        <div class="release-item-actions">
          <a class="btn btn-ghost" href="${escapeHtml(FALLBACK_RELEASE_PAGE)}" target="_blank" rel="noreferrer">Open GitHub Releases</a>
        </div>
      </article>
    `;
  }

  setDownloadTargets({
    portableUrl: FALLBACK_PORTABLE,
    setupUrl: FALLBACK_SETUP,
    releasePageUrl: FALLBACK_RELEASE_PAGE,
  });
}

function applyLatestRelease(release) {
  const tag = String(release?.tag_name || release?.name || "Unknown").trim();
  const version = normalizeTag(tag) || "Unknown";
  const published = formatDate(release?.published_at || release?.created_at);
  const releasePageUrl = String(release?.html_url || FALLBACK_RELEASE_PAGE);
  const setupUrl = findAssetDownload(release, /setup|installer|nsis/i) || FALLBACK_SETUP;
  const portableUrl = findAssetDownload(release, /portable/i) || FALLBACK_PORTABLE;

  if (latestVersionEl) {
    latestVersionEl.textContent = `v${version}`;
  }

  if (latestPublishedEl) {
    latestPublishedEl.textContent = published;
  }

  if (releaseFeedHintEl) {
    releaseFeedHintEl.textContent = "Synced with GitHub releases.";
  }

  const state = release?.prerelease ? "Pre-release" : "Stable";
  setStatusIndicator(state, "ok");

  setDownloadTargets({
    portableUrl,
    setupUrl,
    releasePageUrl,
  });
}

async function loadReleaseFeed() {
  setStatusIndicator("Loading", "info");

  try {
    const response = await fetch(RELEASES_API, {
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      let details = `HTTP ${response.status}`;
      try {
        const payload = await response.json();
        if (payload && payload.message) {
          details = `${details} - ${payload.message}`;
        }
      } catch {
        // Ignore fallback parse issues.
      }

      throw new Error(details);
    }

    const payload = await response.json();
    const releases = Array.isArray(payload) ? payload.filter((release) => !release?.draft) : [];

    if (!releases.length) {
      throw new Error("No published releases found yet");
    }

    applyLatestRelease(releases[0]);

    if (releaseListEl) {
      releaseListEl.innerHTML = releases.map((release) => buildReleaseItem(release)).join("");
    }
  } catch (error) {
    console.error("Release feed error", error);
    setFallbackReleaseState(String(error.message || "Unable to load release feed"));
  }
}

loadReleaseFeed();
