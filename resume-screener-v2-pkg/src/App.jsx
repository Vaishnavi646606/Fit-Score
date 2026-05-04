import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Results from './pages/Results'
import History from './pages/History'
import Login from './pages/Login'
import Pricing from './pages/Pricing'
import AuthCallback from './pages/AuthCallback.jsx'
import './index.css'

export default function App() {
  return (
    <Router>
      <div className="noise" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/results" element={<Results />} />
        <Route path="/history" element={<History />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
      </Routes>
    </Router>
  )
}