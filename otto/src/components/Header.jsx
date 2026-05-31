import logoImg from '../assets/RN.png'

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
                    <a href="/about">About</a>
                    <a href="/contact">Contact</a>
                </nav>
            </div>
        </header>
    )
}
