import React, { useState, useEffect, useRef } from 'react'
import ProjectCard from './ProjectCard'
import sampleImg from '../assets/RN.png'

const GITHUB_OWNER = 'rikard95'
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/
const HTML_IMAGE_PATTERN = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i
const BLOCKED_IMAGE_SCHEME_PATTERN = /^(?:javascript|data|vbscript|file):/i
const GITHUB_BLOB_URL_PATTERN = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i

function getFirstReadmeParagraph(readmeText) {
    if (!readmeText) return ''

    const strippedReadme = readmeText
        .replace(/!\[[^\]]*]\((?:<[^>]+>|[^)]+)\)/g, ' ')
        .replace(/<img\b[^>]*>/gi, ' ')

    const paragraphs = strippedReadme
        .split(/\n\n+/)
        .map((paragraph) =>
            paragraph
                .replace(/\[([^\]]+)]\((?:<[^>]+>|[^)]+)\)/g, '$1')
                .replace(/<\/?[^>]+>/g, ' ')
                .replace(/[#>*`]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
        )
        .filter(Boolean)

    return paragraphs[0] || ''
}

function cleanReadmeText(readmeText) {
    if (!readmeText) return ''
    const withoutImages = readmeText.replace(/!\[[^\]]*]\((?:<[^>]+>|[^)]+)\)/g, ' ')
    const withoutHtmlImgs = withoutImages.replace(/<img\b[^>]*>/gi, ' ')
    const withoutTags = withoutHtmlImgs.replace(/<[^>]+>/g, ' ')
    const withoutLinks = withoutTags.replace(/\[([^\]]+)]\((?:<[^>]+>|[^)]+)\)/g, '$1')
    const withoutMd = withoutLinks.replace(/[#>*`]/g, ' ')
    return withoutMd.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function extractFirstReadmeImage(readmeText) {
    if (!readmeText) return null

    const markdownMatch = MARKDOWN_IMAGE_PATTERN.exec(readmeText)
    const htmlMatch = HTML_IMAGE_PATTERN.exec(readmeText)

    const firstMatch = [markdownMatch, htmlMatch]
        .filter(Boolean)
        .sort((a, b) => a.index - b.index)[0]

    if (!firstMatch) return null

    const src = (firstMatch[1] || '').trim()
    return src.replace(/^<|>$/g, '')
}

function resolveReadmeImageUrl(imageUrl, repoName, defaultBranch, readmePath = 'README.md') {
    if (!imageUrl || !repoName) return null

    // allow passing explicit owner later via 5th arg (repoOwner)
    const args = Array.from(arguments)
    const repoOwner = args[4] || GITHUB_OWNER

    const normalizedUrl = imageUrl.trim()
    if (!normalizedUrl || BLOCKED_IMAGE_SCHEME_PATTERN.test(normalizedUrl)) return null
    if (/^https?:\/\//i.test(normalizedUrl)) {
        const githubBlobMatch = normalizedUrl.match(GITHUB_BLOB_URL_PATTERN)
        if (githubBlobMatch) {
            const [, owner, repo, branch, filePath] = githubBlobMatch
            const cleanedPath = filePath.split(/[?#]/)[0]
            return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanedPath}`
        }
        return normalizedUrl
    }
    if (/^\/\//.test(normalizedUrl)) return `https:${normalizedUrl}`

    const branch = defaultBranch || 'main'
    const normalizedReadmePath = readmePath || 'README.md'
    const readmeBaseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${normalizedReadmePath}`

    if (normalizedUrl.startsWith('/')) {
        const rootRelativePath = normalizedUrl.replace(/^\/+/, '')
        return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${rootRelativePath}`
    }

    try {
        return new URL(normalizedUrl, readmeBaseUrl).toString()
    } catch {
        return null
    }
}

const FALLBACK_PROJECTS = [
    {
        title: 'Portfolio (Svenska)',
        description: 'My Swedish portfolio site.',
        tech: 'React • Vercel',
        link: 'https://rikardnilsson.vercel.app/',
        homepage: 'https://rikardnilsson.vercel.app/',
        github: 'https://github.com/rikard95/portfolio',
        image: sampleImg,
        useLogoFallback: true,
    },
]

export default function Projects() {
    const [projects, setProjects] = useState([])

    const fetchRef = useRef(null)

    useEffect(() => {
        let mounted = true

        // Load cached projects from sessionStorage to avoid refetching on reload/navigation
        try {
            const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('projects_cache_v2') : null
            if (cached) {
                const parsed = JSON.parse(cached)
                if (Array.isArray(parsed) && parsed.length) {
                    setProjects(parsed)
                    // show cached data immediately while still fetching fresh repos
                }
            }
        } catch (e) {
            // ignore sessionStorage errors and continue to fetch
        }

        const fetchAllRepos = async (force = false) => {
            try {
                // Try serverless proxy first (keeps token secret on server)
                let all = []
                try {
                    const srv = await fetch(`/api/github-repos${force ? '?force=1' : ''}`)
                    if (srv.ok) {
                        const srvData = await srv.json()
                        if (Array.isArray(srvData) && srvData.length) {
                            all = srvData
                        }
                    }
                } catch (e) {
                    // continue to unauthenticated fallback
                }

                // If serverless proxy didn't return data, try local generated `public/repos.json`.
                // Do NOT call the public GitHub API directly from the client — it easily hits rate limits (429).
                if (all.length === 0) {
                    try {
                        const localRes = await fetch('/repos.json')
                        if (localRes && localRes.ok) {
                            const localData = await localRes.json()
                            if (Array.isArray(localData) && localData.length) {
                                all = localData
                            }
                        }
                    } catch (e) {
                        // ignore
                    }
                }

                // Final fallback: if still empty, try the local public/repos.json generated by the fetch script
                if (all.length === 0) {
                    try {
                        const localRes = await fetch('/repos.json')
                        if (localRes && localRes.ok) {
                            const localData = await localRes.json()
                            if (Array.isArray(localData) && localData.length) {
                                all = localData
                            }
                        }
                    } catch (e) {
                        // ignore local fetch errors
                    }
                }

                if (!mounted) return

                const repos = all
                    .filter((r) => r.name && r.name.toLowerCase() !== 'git-test')
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                    .map((r) => ({
                        title: r.name,
                        description: r.description || '',
                        tech: r.language || (r.stack ? (Array.isArray(r.stack) ? r.stack.join(' • ') : r.stack) : ''),
                        github: r.html_url,
                        api_url: r.url,
                        homepage:
                            r.name && r.name.toLowerCase() === 'portfolio'
                                ? 'https://rikardnilsson.vercel.app/'
                                : r.name && r.name.toLowerCase() === 'coachcal'
                                    ? 'https://coachcaldb.web.app/'
                                    : r.homepage || null,
                        link: r.html_url,
                        image: r.image || sampleImg,
                        useLogoFallback: !r.image,
                        defaultBranch: r.default_branch || r.defaultBranch,
                        owner: (r.owner && r.owner.login) ? r.owner.login : (typeof r.owner === 'string' ? r.owner : GITHUB_OWNER),
                        readmeFull: r.readmeFull || null,
                        longDescription: r.longDescription || null,
                        stack: r.stack || null,
                        framework: r.framework || null,
                    }))

                // Do not inject any static fallback projects; only use public GitHub repos

                if (repos.length) {
                    const enrich = async (repo) => {
                        try {
                            // If we already have readmeFull, stack and framework (from local repos.json), skip remote reads
                            if (repo.readmeFull && repo.stack && repo.framework) return repo

                            const ownerToUse = repo.owner || GITHUB_OWNER
                            // fetch only what we don't already have
                            let readmeRes = null
                            let langRes = null
                            if (!repo.readmeFull) {
                                readmeRes = await fetch(`https://api.github.com/repos/${ownerToUse}/${repo.title}/readme`).then(r => r.ok ? r.json() : null).catch(() => null)
                            }
                            if (!repo.stack) {
                                langRes = await fetch(`https://api.github.com/repos/${ownerToUse}/${repo.title}/languages`).then(r => r.ok ? r.json() : null).catch(() => null)
                            }
                            // try to detect framework from package.json when possible
                            let pkgRes = null
                            if (!repo.framework) {
                                pkgRes = await fetch(`https://api.github.com/repos/${ownerToUse}/${repo.title}/contents/package.json`).then(r => r.ok ? r.json() : null).catch(() => null)
                            }

                            if (readmeRes && readmeRes.content) {
                                try {
                                    const b64 = readmeRes.content.replace(/\n/g, '')
                                    let decoded = ''
                                    if (typeof atob === 'function') {
                                        decoded = atob(b64)
                                    } else if (typeof Buffer !== 'undefined') {
                                        decoded = Buffer.from(b64, 'base64').toString('utf8')
                                    }
                                    const clean = getFirstReadmeParagraph(decoded)
                                    repo.longDescription = clean.slice(0, 800)
                                    repo.description = clean.length > 180 ? clean.slice(0, 177) + '...' : clean
                                    repo.readmeFull = repo.readmeFull || cleanReadmeText(decoded)

                                    const firstReadmeImage = extractFirstReadmeImage(decoded)
                                    const resolvedImage = resolveReadmeImageUrl(
                                        firstReadmeImage,
                                        repo.title,
                                        repo.defaultBranch,
                                        readmeRes.path,
                                        ownerToUse
                                    )
                                    if (resolvedImage) {
                                        repo.image = repo.image || resolvedImage
                                        repo.useLogoFallback = false
                                    }
                                } catch (e) {
                                    repo.longDescription = repo.description || ''
                                }
                            } else {
                                repo.longDescription = repo.longDescription || repo.description || ''
                            }

                            if (langRes && typeof langRes === 'object') {
                                const langs = Object.keys(langRes)
                                repo.stack = repo.stack || langs.slice(0, 6)
                                repo.tech = repo.tech || (repo.stack ? repo.stack.join(' • ') : '')
                            }

                            if (pkgRes && pkgRes.content) {
                                try {
                                    const pkgB64 = pkgRes.content.replace(/\n/g, '')
                                    const pkgText = (typeof atob === 'function') ? atob(pkgB64) : Buffer.from(pkgB64, 'base64').toString('utf8')
                                    const pkgObj = JSON.parse(pkgText)
                                    const deps = Object.assign({}, pkgObj.dependencies || {}, pkgObj.devDependencies || {}, pkgObj.peerDependencies || {})
                                    const keys = Object.keys(deps).map(k => k.toLowerCase())
                                    if (keys.includes('next')) repo.framework = 'Next.js'
                                    else if (keys.includes('gatsby')) repo.framework = 'Gatsby'
                                    else if (keys.includes('@angular/core') || keys.includes('angular')) repo.framework = 'Angular'
                                    else if (keys.includes('react') || keys.includes('react-dom')) repo.framework = 'React'
                                    else if (keys.includes('vue') || keys.includes('@vue')) repo.framework = 'Vue'
                                    else if (keys.includes('svelte')) repo.framework = 'Svelte'
                                } catch (e) { /* ignore */ }
                            }
                        } catch (e) {
                            // ignore enrichment errors
                        }
                        return repo
                    }

                    Promise.all(repos.map(enrich)).then(enriched => {
                        if (mounted) {
                            setProjects(enriched)
                            try {
                                if (typeof sessionStorage !== 'undefined') {
                                    sessionStorage.setItem('projects_cache_v2', JSON.stringify(enriched))
                                }
                            } catch (e) {
                                // ignore storage errors
                            }
                        }
                    }).catch(() => { if (mounted) setProjects(repos) })
                }
            } catch (e) {
                // ignore top-level errors
            }
        }

        // expose the fetch function for manual refresh
        fetchRef.current = fetchAllRepos

        // initial load: not forced
        fetchAllRepos(false)

        return () => { mounted = false }
    }, [])

    const handleRefresh = async () => {
        try {
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('projects_cache_v1')
                sessionStorage.removeItem('projects_cache_v2')
            }
        } catch (e) {
            // ignore
        }
        setProjects([])
        if (fetchRef.current) await fetchRef.current(true)
    }

    return (
        <section id="projects" className="projects container">
            <div className="projects-header">
                <h2>My Projects</h2>
                <button className="refresh-projects" onClick={handleRefresh} aria-label="Refresh projects" title="Refresh projects">
                    <svg className="refresh-icon" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6V4l-3 3 3 3V8c2.76 0 5 2.24 5 5 0 .9-.24 1.74-.66 2.48l1.46 1.46C18.5 15.9 19 14.99 19 14c0-3.87-3.13-7-7-7z" />
                        <path d="M6.66 9.52C6.24 10.26 6 11.1 6 12c0 3.87 3.13 7 7 7v2l3-3-3-3v2c-2.76 0-5-2.24-5-5 0-.9.24-1.74.66-2.48L6.66 9.52z" />
                    </svg>
                </button>
            </div>
            <div className="projects-grid">
                {projects.map((p) => (
                    <ProjectCard key={p.title} project={p} />
                ))}
            </div>
        </section>
    )
}
