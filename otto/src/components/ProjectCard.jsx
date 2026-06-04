import { useState } from 'react'
import sampleImg from '../assets/RN.png'

export default function ProjectCard({ project }) {
    const [flipped, setFlipped] = useState(false)

    const stackText = (project.stack && (Array.isArray(project.stack) ? project.stack.join(' • ') : project.stack)) || project.tech || ''

    // Build image candidates: original, a possible /assets/<filename> fallback, then the white logo
    const buildCandidates = () => {
        const c = []
        if (project.image) {
            c.push(project.image)
            try {
                const parts = project.image.split('/')
                const file = parts[parts.length - 1]
                if (file) c.push(`/assets/${file}`)
            } catch (e) {
                // ignore
            }
        }
        // fallback to provided logo
        c.push(sampleImg)
        return c
    }

    const candidates = buildCandidates()
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
