import { useEffect, useState } from 'react'
import logoImg from '../assets/RN.png'
import { Link } from 'react-router-dom'

export default function Header() {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        } catch (e) {
            return 'light'
        }
    })

    useEffect(() => {
        const el = document.documentElement
        if (theme === 'dark') {
            el.classList.add('theme-dark')
            el.classList.remove('theme-light')
        } else {
            el.classList.add('theme-light')
            el.classList.remove('theme-dark')
        }
        try { localStorage.setItem('theme', theme) } catch (e) { }
    }, [theme])

    const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

    return (
        <header className="site-header">
            <div className="header-inner container">
                <div className="brand">
                    <img src={logoImg} alt="Rikard logo" className="brand-img" />
                    <div>
                        <h1>Rikard Nilsson</h1>
                        <p className="muted">Fullstack Developer</p>
                    </div>
                </div>
                <nav className="nav">
                    <Link to="/about">About</Link>
                    <Link to="/contact">Contact</Link>
                    <button
                        aria-label="Toggle theme"
                        className="theme-toggle"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                </nav>
            </div>
        </header>
    )
}
