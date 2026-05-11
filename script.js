const DEFAULT_USERNAME = "Laolex"

const profileLink = document.querySelector("#profileLink")
const heroProfileLink = document.querySelector("#heroProfileLink")
const profileBlock = document.querySelector("#profileBlock")
const statsBlock = document.querySelector("#stats")
const languagesBlock = document.querySelector("#languages")
const featuredList = document.querySelector("#featuredList")
const repoList = document.querySelector("#repoList")
const repoCount = document.querySelector("#repoCount")
const statusMessage = document.querySelector("#statusMessage")
const searchInput = document.querySelector("#searchInput")
const languageFilter = document.querySelector("#languageFilter")
const sortFilter = document.querySelector("#sortFilter")

let allRepos = []

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US")
}

function formatDate(iso) {
  if (!iso) return "n/a"
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function ensureUrl(url) {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `https://${url}`
}

function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
}

function languageColor(language) {
  const map = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572a5",
    Rust: "#dea584",
    Go: "#00add8",
    Solidity: "#AA6746",
    Shell: "#89e051",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Vue: "#41b883",
  }
  return map[language] || "#6b7280"
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message
  statusMessage.classList.toggle("error", isError)
}

function sortRepos(repos, sort) {
  return [...repos].sort((a, b) => {
    if (sort === "stars") return b.stargazers_count - a.stargazers_count
    if (sort === "forks") return b.forks_count - a.forks_count
    if (sort === "name") return a.name.localeCompare(b.name)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
}

function renderProfile(profile) {
  const profileUrl = profile.html_url || `https://github.com/${DEFAULT_USERNAME}`
  profileLink.href = profileUrl
  heroProfileLink.href = profileUrl
  profileLink.textContent = `Open @${profile.login || DEFAULT_USERNAME}`

  profileBlock.classList.remove("loading")
  profileBlock.innerHTML = `
    <div class="profile-card">
      <img src="${profile.avatar_url}" alt="${profile.login} profile photo" loading="lazy" />
      <h3>${profile.name || profile.login}</h3>
      <p>@${profile.login}</p>
      ${profile.bio ? `<p>${profile.bio}</p>` : ""}
      <div class="meta">
        ${profile.location ? `<p>Location: ${profile.location}</p>` : ""}
        ${profile.company ? `<p>Company: ${profile.company}</p>` : ""}
        ${profile.blog ? `<a href="${ensureUrl(profile.blog)}" target="_blank" rel="noreferrer">${profile.blog}</a>` : ""}
      </div>
    </div>
  `

  statsBlock.innerHTML = `
    <div class="stat"><span>Public repos</span><strong>${formatNumber(profile.public_repos)}</strong></div>
    <div class="stat"><span>Followers</span><strong>${formatNumber(profile.followers)}</strong></div>
    <div class="stat"><span>Following</span><strong>${formatNumber(profile.following)}</strong></div>
    <div class="stat"><span>Created</span><strong>${formatDate(profile.created_at)}</strong></div>
  `
}

function renderLanguageFilter(repos) {
  const languages = Array.from(new Set(repos.map((repo) => repo.language).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )

  languageFilter.innerHTML = `<option value="">All languages</option>`
  languages.forEach((language) => {
    const option = document.createElement("option")
    option.value = language
    option.textContent = language
    languageFilter.append(option)
  })

  const topLanguageMap = new Map()
  repos.forEach((repo) => {
    if (!repo.language) return
    topLanguageMap.set(repo.language, (topLanguageMap.get(repo.language) || 0) + 1)
  })

  const topLanguages = Array.from(topLanguageMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  languagesBlock.innerHTML = topLanguages
    .map(([language, count]) => `<span class="chip">${language} (${count})</span>`)
    .join("")
}

function renderFeatured(repos) {
  const featured = sortRepos(repos, "stars").slice(0, 3)
  featuredList.innerHTML = ""

  if (!featured.length) {
    featuredList.innerHTML = `<p class="status">No featured repositories available.</p>`
    return
  }

  featured.forEach((repo) => {
    const langColor = languageColor(repo.language)
    const item = document.createElement("article")
    item.className = "featured-item"
    item.innerHTML = `
      <a href="${repo.html_url}" target="_blank" rel="noreferrer">
        <h3>${repo.name}</h3>
        ${repo.description ? `<p>${repo.description}</p>` : `<p>No description provided.</p>`}
        <div class="repo-meta">
          <span class="lang-pill"><span class="lang-dot" style="background:${langColor}"></span>${repo.language || "Text"}</span>
          <span>Stars ${formatNumber(repo.stargazers_count)}</span>
          <span>Forks ${formatNumber(repo.forks_count)}</span>
        </div>
      </a>
    `
    featuredList.append(item)
  })
}

function renderRepoList(repos) {
  repoList.innerHTML = ""

  if (!repos.length) {
    setStatus("No repositories match this filter set.")
    return
  }

  setStatus(`Showing ${repos.length} repositories`)

  repos.forEach((repo) => {
    const langColor = languageColor(repo.language)
    const topics = Array.isArray(repo.topics) ? repo.topics.slice(0, 3) : []

    const card = document.createElement("article")
    card.className = "repo"
    card.innerHTML = `
      <a href="${repo.html_url}" target="_blank" rel="noreferrer">
        <h3>${repo.name}</h3>
        ${repo.description ? `<p>${repo.description}</p>` : `<p>No description provided.</p>`}
        ${topics.length ? `<div class="languages">${topics.map((topic) => `<span class="chip">${topic}</span>`).join("")}</div>` : ""}
        <div class="repo-meta">
          <span class="lang-pill"><span class="lang-dot" style="background:${langColor}"></span>${repo.language || "Text"}</span>
          <span>Stars ${formatNumber(repo.stargazers_count)}</span>
          <span>Forks ${formatNumber(repo.forks_count)}</span>
          <span>Updated ${formatDate(repo.updated_at)}</span>
        </div>
      </a>
    `
    repoList.append(card)
  })
}

function applyFilters() {
  const search = normalize(searchInput.value)
  const language = languageFilter.value
  const sort = sortFilter.value

  const filtered = sortRepos(
    allRepos.filter((repo) => {
      const inSearch =
        !search ||
        normalize(repo.name).includes(search) ||
        normalize(repo.description).includes(search) ||
        normalize((repo.topics || []).join(" ")).includes(search)
      const inLanguage = !language || repo.language === language
      return inSearch && inLanguage
    }),
    sort,
  )

  repoCount.textContent = String(filtered.length)
  renderFeatured(filtered)
  renderRepoList(filtered)
}

async function loadCv() {
  setStatus("Loading repositories…")

  const profileUrl = `https://api.github.com/users/${DEFAULT_USERNAME}`
  const repoUrl = `https://api.github.com/users/${DEFAULT_USERNAME}/repos?per_page=100&sort=updated`

  try {
    const [profileRes, repoRes] = await Promise.all([fetch(profileUrl), fetch(repoUrl)])
    if (!profileRes.ok || !repoRes.ok) {
      throw new Error("GitHub API request failed")
    }

    const profile = await profileRes.json()
    const repos = await repoRes.json()
    allRepos = Array.isArray(repos) ? repos.filter((repo) => !repo.fork) : []

    renderProfile(profile)
    renderLanguageFilter(allRepos)
    applyFilters()
  } catch (error) {
    repoList.innerHTML = ""
    featuredList.innerHTML = ""
    repoCount.textContent = "0"
    setStatus("Could not load data from GitHub right now. Refresh to retry.", true)
    profileLink.textContent = "Open GitHub"
    heroProfileLink.removeAttribute("href")
    profileBlock.classList.remove("loading")
    profileBlock.innerHTML = `<p>GitHub profile is temporarily unavailable.</p>`
    statsBlock.innerHTML = ""
    languagesBlock.innerHTML = ""
  }
}

searchInput.addEventListener("input", applyFilters)
languageFilter.addEventListener("change", applyFilters)
sortFilter.addEventListener("change", applyFilters)

void loadCv()
