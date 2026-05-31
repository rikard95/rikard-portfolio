import React, { useState, useEffect } from 'react'
import ProjectCard from './ProjectCard'
import sampleImg from '../assets/RN.png'

const FALLBACK_PROJECTS = [
    {
        title: 'Portfolio (Svenska)',
        description: 'My Swedish portfolio site.',
        tech: 'React • Vercel',
        link: 'https://rikardnilsson.vercel.app/',
        homepage: 'https://rikardnilsson.vercel.app/',
        github: 'https://github.com/rikard95/portfolio',
        image: sampleImg,
    },
]

export default function Projects() {
    const [projects, setProjects] = useState(FALLBACK_PROJECTS)

    

    useEffect(() => {
        let mounted = true

        // Load cached projects from sessionStorage to avoid refetching on reload/navigation
        try {
            const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('projects_cache_v1') : null
            if (cached) {
                const parsed = JSON.parse(cached)
                if (Array.isArray(parsed) && parsed.length) {
                    setProjects(parsed)
                    // already have data for this session, skip fetching
                    return () => { mounted = false }
                }
            }
        } catch (e) {
            // ignore sessionStorage errors and continue to fetch
        }

        const fetchAllRepos = async () => {
            try {
                // Try serverless proxy first (keeps token secret on server)
                let all = []
                try {
                    const srv = await fetch('/api/github-repos')
                    if (srv.ok) {
                        const srvData = await srv.json()
                        if (Array.isArray(srvData) && srvData.length) {
                            all = srvData
                        }
                    }
                } catch (e) {
                    // continue to unauthenticated fallback
                }

                if (all.length === 0) {
                    const perPage = 100
                    let page = 1
                    while (true) {
                        const res = await fetch(`https://api.github.com/users/rikard95/repos?per_page=${perPage}&page=${page}`)
                        let data = null
                        try { data = await res.json() } catch (err) { data = null }
                        if (!res.ok) {
                            break
                        }
                        if (!Array.isArray(data) || data.length === 0) break
                        all.push(...data)
                        if (data.length < perPage) break
                        page += 1
                    }
                }

                if (!mounted) return

                const repos = all
                    .filter((r) => !r.fork && r.name && r.name.toLowerCase() !== 'git-test')
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                    .map((r) => ({
                        title: r.name,
                        description: r.description || '',
                        tech: r.language || '',
                        github: r.html_url,
                        api_url: r.url,
                        homepage:
                            r.name && r.name.toLowerCase() === 'portfolio'
                                ? 'https://rikardnilsson.vercel.app/'
                                : r.name && r.name.toLowerCase() === 'coachcal'
                                    ? 'https://coachcaldb.web.app/'
                                    : r.homepage || null,
                        link: r.html_url,
                        image: sampleImg,
                    }))

                const hasPortfolio = repos.some((p) => p.title && p.title.toLowerCase().includes('portfolio'))
                if (!hasPortfolio) {
                    repos.unshift(FALLBACK_PROJECTS[0])
                }

                if (repos.length) {
                    const enrich = async (repo) => {
                        try {
                            const [readmeRes, langRes] = await Promise.all([
                                fetch(`https://api.github.com/repos/rikard95/${repo.title}/readme`).then(r => r.json()).catch(() => null),
                                fetch(`https://api.github.com/repos/rikard95/${repo.title}/languages`).then(r => r.json()).catch(() => null),
                            ])

                            if (readmeRes && readmeRes.content) {
                                try {
                                    const b64 = readmeRes.content.replace(/\n/g, '')
                                    let decoded = ''
                                    if (typeof atob === 'function') {
                                        decoded = atob(b64)
                                    } else if (typeof Buffer !== 'undefined') {
                                        decoded = Buffer.from(b64, 'base64').toString('utf8')
                                    }
                                    const firstPara = decoded.split(/\n\n+/)[0].replace(/[#>*`]/g, '').trim()
                                    const clean = firstPara.replace(/\s+/g, ' ').trim()
                                    repo.longDescription = clean.slice(0, 800)
                                    // short front description (trimmed)
                                    repo.description = clean.length > 180 ? clean.slice(0, 177) + '...' : clean
                                } catch (e) {
                                    repo.longDescription = repo.description || ''
                                }
                            } else {
                                // fallback: keep existing repo.description
                                repo.longDescription = repo.description || ''
                            }

                            if (langRes && typeof langRes === 'object') {
                                const langs = Object.keys(langRes)
                                repo.stack = langs.slice(0, 6)
                                repo.tech = repo.stack.join(' • ')
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
                                    sessionStorage.setItem('projects_cache_v1', JSON.stringify(enriched))
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

        fetchAllRepos()

        return () => { mounted = false }
    }, [])

    

    return (
        <section id="projects" className="projects container">
            <h2>My Projects</h2>
            <div className="projects-grid">
                {projects.map((p) => (
                    <ProjectCard key={p.title} project={p} />
                ))}
            </div>
        </section>
    )
}
