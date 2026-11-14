import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import LiveFlightApp from './live_flight_info/flight-dashboard.jsx';
import FlightSearchApp from './flight-search-compare/components/FlightSearchApp.jsx';
import './flight-search-compare/styles/anga360.css';

import LoginPage from './auth/LoginPage.jsx';
import RegisterPage from './auth/RegisterPage.jsx';
import TripProvider from './trip_linking/trip-routes.jsx';
import { HomePage } from './Home_page/home_page.jsx';

function playJetFlybySound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const duration = 0.85;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(950, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(140, now + duration);

    const turbine = ctx.createOscillator();
    turbine.type = 'sine';
    turbine.frequency.setValueAtTime(320, now);
    turbine.frequency.exponentialRampToValueAtTime(520, now + 0.3);
    turbine.frequency.exponentialRampToValueAtTime(180, now + duration);

    const turbineGain = ctx.createGain();
    turbineGain.gain.setValueAtTime(0.001, now);
    turbineGain.gain.linearRampToValueAtTime(0.04, now + 0.28);
    turbineGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.28, now + 0.3);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(masterGain);
    turbine.connect(turbineGain);
    turbineGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    noise.start(now);
    turbine.start(now);
    noise.stop(now + duration);
    turbine.stop(now + duration);

    setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
  } catch {
    // Ignore audio errors
  }
}

// Old tab names -> URLs, so FlightSearchApp and Footer can keep calling onSwitchTab("compare") etc.
const TAB_PATHS = {
  search: '/search',
  details: '/details',
  compare: '/compare',
  saved: '/saved',
  trips: '/trips',
  live: '/live',
  login: '/login',
  signup: '/register',
};

// Layout route: owns the shared compare/saved state so it survives switching between flight pages.
function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [compareList, setCompareList] = useState([]);
  const [savedIds, setSavedIds] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  const switchTab = (tab) => {
    const path = TAB_PATHS[tab];
    if (!path) return;
    playJetFlybySound();
    navigate(path);
  };

  return (
    <div className="app-shell">
      <Navbar
        compareCount={compareList.length}
        savedCount={savedIds.length}
        onNavigate={playJetFlybySound}
      />

      <div className="app-content">
        <Outlet
          context={{ compareList, setCompareList, savedIds, setSavedIds, switchTab }}
        />
      </div>

      <Footer onSwitchTab={switchTab} />
    </div>
  );
}

// Each flight route renders the same FlightSearchApp, just with a different activeTab.
function FlightTab({ tab }) {
  const { compareList, setCompareList, savedIds, setSavedIds, switchTab } =
    useOutletContext();

  return (
    <FlightSearchApp
      activeTab={tab}
      onSwitchTab={switchTab}
      compareList={compareList}
      setCompareList={setCompareList}
      savedIds={savedIds}
      setSavedIds={setSavedIds}
    />
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/dashboard/*" element={<TripProvider />} />

        <Route element={<AppShell />}>
          <Route path="/search" element={<FlightTab tab="search" />} />
          <Route path="/details" element={<FlightTab tab="details" />} />
          <Route path="/compare" element={<FlightTab tab="compare" />} />
          <Route path="/saved" element={<FlightTab tab="saved" />} />
          <Route path="/trips" element={<FlightTab tab="trips" />} />
          <Route path="/live" element={<LiveFlightApp />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);