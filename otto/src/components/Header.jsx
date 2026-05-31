import logoImg from '../assets/RN.png'
import { Link } from 'react-router-dom'

export default function Header() {
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
                </nav>
            </div>
        </header>
    )
}
