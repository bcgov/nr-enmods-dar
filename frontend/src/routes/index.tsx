import { Routes, Route } from 'react-router-dom'
import NotFound from '@/pages/NotFound'
import Dashboard from '@/pages/Dashboard'
import Admin from '@/pages/Admin'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
