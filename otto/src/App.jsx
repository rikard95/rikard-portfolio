import './App.css'
import Header from './components/Header'
import Projects from './components/Projects'
import About from './components/About'
import Contact from './components/Contact'
import { Routes, Route, Link, useLocation } from 'react-router-dom'

function App() {
  const location = useLocation()
  const hideSite = ['', '', '/about.html', '/contact.html'].includes(location.pathname)

  return (
    <div className="app-root">
      {!hideSite && <Header />}
      <main className="container">
        <Routes>
          <Route path="/" element={<Projects />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about.html" element={<About />} />
          <Route path="/contact.html" element={<Contact />} />
        </Routes>
      </main>
      {!hideSite && <footer className="footer">© {new Date().getFullYear()} Rikard Nilsson — <Link to="/contact" className="footer-link">Contact me</Link></footer>}
    </div>
  )
}

export default App
