import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import LoginPage from './auth/LoginPage.jsx'
import RegisterPage from './auth/RegisterPage.jsx'
import TripProvider from './trip_linking/trip-routes.jsx'
import { HomePage } from './Home_page/home_page.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<HomePage/>}/>
        <Route path="/dashboard/*" element={<TripProvider />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)