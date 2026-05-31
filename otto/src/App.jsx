import './App.css'
import Header from './components/Header'
import Projects from './components/Projects'
import About from './components/About'
import Contact from './components/Contact'
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Projects />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <footer className="footer">© {new Date().getFullYear()} Rikard Nilsson — <a href="/contact.html">Contact me</a></footer>
    </div>
  )
}

export default App
