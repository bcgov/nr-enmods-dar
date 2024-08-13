import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Unsubscribe from '@/pages/Unsubscribe'

const PublicRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/unsubscribe/:uuid" element={<Unsubscribe />} />
      </Routes>
    </BrowserRouter>
  )
}

export default PublicRoutes
