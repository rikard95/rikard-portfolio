import './App.css'
import Header from './components/Header'
import Projects from './components/Projects'

function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="container">
        <Projects />
      </main>
      <footer className="footer">© {new Date().getFullYear()} Rikard Nilsson — <a href="/contact.html">Contact me</a></footer>
    </div>
  )
}

export default App
