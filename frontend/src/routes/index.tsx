import { Routes, Route } from 'react-router-dom'
import NotFound from '@/pages/NotFound'
import Dashboard from '@/pages/Dashboard'
import Admin from '@/pages/Admin'
import HomePage from '@/pages/HomePage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
