import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function About() {
    const [expanded, setExpanded] = useState(false)

    return (
        <main className="container about-page">
            <div className="about-hero" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>
                <div>
                    <div className="about-card">
                        <h1>Hi, I'm Rikard.</h1>

                        <p>I am a full-stack developer based in Gothenburg, Sweden, with roots in the creative world. For me, programming and music production share the exact same DNA: taking a blank canvas, structuring the logic, and building something that feels seamless and alive.</p>

                        <p>My technical sweet spot is a modern, serverless stack, where I primarily build with React, Next.js, TypeScript, and Firebase. I am driven by creating fast, scalable web applications. Recently, I’ve spent my time developing complex scheduling and onboarding systems for AI-driven platforms, as well as building my own Micro SaaS projects.</p>

                        <p>When I’m not optimizing code, you’ll probably find me in the studio producing lo-fi and electronic beats, or unwinding with a good roguelite game.</p>

                        <p>I’m always looking for exciting new projects and teams to grow with. Let’s build something great together!</p>

                        <div className="actions">
                            <Link className="counter" to="/contact">Get in touch</Link>
                            <Link className="home" to="/">Back to home</Link>
                        </div>
                    </div>
                </div>

                <aside className="about-side">
                    <div className="side-inner">
                        <div className="profile-blob">
                            <img src="/rikard.png" alt="Rikard" className="profile-img" />
                        </div>
                        <div className="role">Frontend & Full-stack</div>

                        <div className="side-block">
                            <h3>Skills</h3>
                            <ul className={`skills-list ${expanded ? 'expanded' : ''}`}>
                                <li><span className="badge">HTML</span></li>
                                <li><span className="badge">CSS</span></li>
                                <li><span className="badge">JavaScript</span></li>
                                <li><span className="badge">TypeScript</span></li>
                                <li><span className="badge">React</span></li>
                                <li><span className="badge">Next.js</span></li>
                                <li><span className="badge">Vite</span></li>
                                <li><span className="badge">Node.js</span></li>
                                <li><span className="badge">GitHub</span></li>
                                <li><span className="badge">Insomnia</span></li>
                                <li><span className="badge">Jira</span></li>
                                <li><span className="badge">MongoDB</span></li>
                                <li className="more-skill"><span className="badge">MySQL</span></li>
                                <li className="more-skill"><span className="badge">PHP</span></li>
                                <li className="more-skill"><span className="badge">Postman</span></li>
                                <li className="more-skill"><span className="badge">Python</span></li>
                                <li className="more-skill"><span className="badge">Responsive Design</span></li>
                                <li className="more-skill"><span className="badge">REST APIs</span></li>
                                <li className="more-skill"><span className="badge">Tailwind CSS</span></li>
                                <li className="more-skill"><span className="badge">Trello</span></li>
                                <li className="more-skill"><span className="badge">Vercel</span></li>
                                <li className="more-skill"><span className="badge">.NET</span></li>
                                <li className="more-skill"><span className="badge">Angular</span></li>
                                <li className="more-skill"><span className="badge">C#</span></li>
                                <li className="more-skill"><span className="badge">CRUD</span></li>
                                <li className="more-skill"><span className="badge">Docker</span></li>
                                <li className="more-skill"><span className="badge">Figma</span></li>
                                <li className="more-skill"><span className="badge">Firebase</span></li>
                            </ul>
                            <div style={{ marginTop: 10 }}>
                                <button id="toggle-skills" className="counter" type="button" onClick={() => setExpanded((s) => !s)}>{expanded ? 'See less' : 'See more'}</button>
                            </div>
                        </div>

                        <div className="side-block">
                            <h3>Recent</h3>
                            <ul className="recent-list">
                                <li><a href="https://rikardnilsson.vercel.app/" target="_blank" rel="noopener noreferrer">Svenska portfolio</a></li>
                                <li>AI scheduling platform (private)</li>
                                <li>Micro SaaS prototypes</li>
                            </ul>
                        </div>
                    </div>
                </aside>
            </div>

            <section style={{ marginTop: 28 }}>
                <h2>Also into music</h2>
                <p>I produce lo-fi and electronic beats in my free time — I approach tracks with the same iterative craft as code.</p>
            </section>
        </main>
    )
}
