import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Results from './pages/Results'
import History from './pages/History'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback.jsx'
import AuthError from './pages/AuthError.jsx'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

export default function App() {
  return (
    <Router>
      <div className="noise" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/auth-error" element={<AuthError />} />
      </Routes>
    </Router>
  )
}