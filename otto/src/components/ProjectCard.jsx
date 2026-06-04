import { useState } from 'react'
import sampleImg from '../assets/RN.png'

export default function ProjectCard({ project }) {
    const [flipped, setFlipped] = useState(false)

    const stackText = (project.stack && (Array.isArray(project.stack) ? project.stack.join(' • ') : project.stack)) || project.tech || ''

    // Normalize README image URLs to prefer GitHub raw URLs when possible,
    // but keep absolute URLs as-is. Only try `/assets/<file>` when the
    // provided image looks like a local asset.
    const normalizeImage = (img) => {
        if (!img) return null
        try {
            const trimmed = img.trim()
            // If it's already a raw.githubusercontent URL, return it
            if (/^https?:\/\/raw\.githubusercontent\.com\//i.test(trimmed)) return trimmed
            // If it's a github blob URL, convert to raw
            const blobMatch = trimmed.match(/https?:\/\/github\.com\/(.+?)\/(.+?)\/blob\/(.+?)\/(.+)/i)
            if (blobMatch) {
                const [, owner, repo, branch, filePath] = blobMatch
                return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
            }
            // If it's an absolute URL (http/https), return as-is
            if (/^https?:\/\//i.test(trimmed)) return trimmed
            // If it's a protocol-relative URL, make it https
            if (/^\/\//.test(trimmed)) return `https:${trimmed}`
            // If it's a root-relative path like /assets/... or /owner/repo/blob/...
            if (trimmed.startsWith('/')) {
                // If it looks like a repo blob path (/owner/repo/blob/...), convert to raw
                const parts = trimmed.split('/')
                if (parts.length > 4 && parts[3] === 'blob') {
                    const owner = parts[1]
                    const repo = parts[2]
                    const branch = parts[4]
                    const filePath = parts.slice(5).join('/')
                    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`
                }
                // Otherwise assume it's a local asset and return as-is
                return trimmed
            }
            // Otherwise treat as relative path inside repo: construct raw URL using project owner/title/defaultBranch
            const owner = project.owner || ''
            const repoName = project.title || ''
            const branch = project.defaultBranch || 'main'
            if (owner && repoName) {
                return `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${trimmed}`
            }
            return trimmed
        } catch (e) { return img }
    }

    const candidates = (() => {
        const c = []
        if (project.image) {
            const normalized = normalizeImage(project.image)
            if (normalized) c.push(normalized)
            // if the original image is a local /assets path, keep it as a candidate
            if (project.image.startsWith('/assets/') && project.image !== normalized) c.push(project.image)
        }
        c.push(sampleImg)
        return c
    })()
    const [imgIndex, setImgIndex] = useState(0)
    const [imgSrc, setImgSrc] = useState(candidates[0])

    const handleImgError = () => {
        const next = imgIndex + 1
        if (next < candidates.length) {
            setImgIndex(next)
            setImgSrc(candidates[next])
        }
    }

    return (
        <article className={`project-card ${flipped ? 'is-flipped' : ''}`}>
            <div className="card-inner">
                <div className="card-front">
                    {imgSrc && (
                        <img
                            src={imgSrc}
                            alt={project.title}
                            onError={handleImgError}
                            className={`project-img ${project.useLogoFallback ? 'project-img--logo' : 'project-img--preview'}`}
                        />
                    )}

                    <div className="project-body">
                        <h3>{project.title}</h3>

                        <div className="project-meta">
                            <small className="project-stack">{stackText}</small>
                            {project.framework && (
                                <small className="project-framework">{project.framework}</small>
                            )}

                            <div className="project-actions">
                                {project.github && (
                                    <a href={project.github} target="_blank" rel="noreferrer" className="project-link action-code">
                                        View code
                                    </a>
                                )}

                                {project.homepage && (
                                    <a href={project.homepage} target="_blank" rel="noreferrer" className="project-link action-page">
                                        Go to page
                                    </a>
                                )}

                                {!project.github && project.link && !project.homepage && (
                                    <a href={project.link} target="_blank" rel="noreferrer" className="project-link action-view">
                                        View
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-back">
                    <div className="project-body back-body">
                        <h3>{project.title}</h3>
                        <div className="back-content">
                            {project.readmeFull ? (
                                project.readmeFull.split(/\n\n+/).map((para, i) => (
                                    <p className="muted" key={i}>{para}</p>
                                ))
                            ) : (
                                <p className="muted">{project.longDescription || project.description || 'This project does not have a description yet.'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <button
                className="flip-btn"
                aria-pressed={flipped}
                onClick={() => setFlipped(s => !s)}
                aria-label={flipped ? 'Show front' : 'Show details'}
            >
                <span className="flip-arrow">➔</span>
            </button>
        </article>
    )
}
