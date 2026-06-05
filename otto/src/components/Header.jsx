import { useEffect, useState, useRef } from 'react'
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

    // Logik för glödet i headern
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0); // Börjar på 0 (osynlig)
    const headerRef = useRef(null);

    useEffect(() => {
        const headerElement = headerRef.current;
        if (!headerElement) return;

        const handleMouseMove = (e) => {
            const rect = headerElement.getBoundingClientRect();
            setPosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        };

        const handleMouseEnter = () => setOpacity(1); // Tänd glödet
        const handleMouseLeave = () => setOpacity(0); // Släck glödet

        headerElement.addEventListener('mousemove', handleMouseMove);
        headerElement.addEventListener('mouseenter', handleMouseEnter);
        headerElement.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            headerElement.removeEventListener('mousemove', handleMouseMove);
            headerElement.removeEventListener('mouseenter', handleMouseEnter);
            headerElement.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    // Tema-logik
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
        <header ref={headerRef} className="site-header">
            <style>{`
                .site-header {
                    position: relative !important;
                    overflow: hidden !important; 
                }

                .header-mouse-glow {
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(
                        circle, 
                        rgba(255, 140, 0, 0.14) 0%, 
                        rgba(255, 102, 0, 0) 40%, 
                        rgba(0, 0, 0, 0) 70%
                    );
                    position: absolute;
                    top: 0;
                    left: 0;
                    border-radius: 50%;
                    pointer-events: none; 
                    z-index: 0; 
                    
                    /* Lägger till en transition på opacity för mjuk in/ut-toning */
                    transition: transform 0.15s cubic-bezier(0.215, 0.610, 0.355, 1), opacity 0.3s ease; 
                }

                .header-inner {
                    position: relative;
                    z-index: 1;
                }
            `}</style>

            {/* Skickar med opacity dinamisk via style-attributet */}
            <div
                className="header-mouse-glow"
                style={{
                    opacity: opacity,
                    transform: `translate(calc(${position.x}px - 50%), calc(${position.y}px - 50%))`
                }}
            />

            <div className="header-inner container">
                <div className="brand">
                    <Link to="/" className="logo-link">
                        <img src={logoImg} alt="Rikard logo" className="brand-img" />
                    </Link>
                    <div>
                        <h1>Rikard Nilsson</h1>
                        <p className="muted">Fullstack Developer</p>
                    </div>
                </div>
                <nav className="nav">
                    <Link to="/">Home</Link>
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