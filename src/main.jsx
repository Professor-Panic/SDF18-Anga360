import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './live_flight_info/App.jsx'
import { HomePage } from './Home_page/home_page.jsx'
import CurrencyConverter from './currency_conversion/home.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CurrencyConverter />
  </StrictMode>,
)
