import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import LiveFlightApp from './live_flight_info/App.jsx';
import FlightSearchApp from './flight-search-compare/components/FlightSearchApp.jsx';
import "./flight-search-compare/styles/anga360.css";

function playJetFlybySound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();

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
    filter.type = "bandpass";
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(950, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(140, now + duration);

    const turbine = ctx.createOscillator();
    turbine.type = "sine";
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

function RootShell() {
  const [activeTab, setActiveTab] = useState("details");
  const [compareList, setCompareList] = useState([]);
  const [savedIds, setSavedIds] = useState([]);

  const switchTab = (tab) => {
    playJetFlybySound();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <Navbar
        activeTab={activeTab}
        onSwitchTab={switchTab}
        compareCount={compareList.length}
        savedCount={savedIds.length}
      />

      <div className="app-content">
        {(activeTab === "search" ||
          activeTab === "details" ||
          activeTab === "compare" ||
          activeTab === "saved" ||
          activeTab === "trips") && (
          <FlightSearchApp
            activeTab={activeTab}
            onSwitchTab={switchTab}
            compareList={compareList}
            setCompareList={setCompareList}
            savedIds={savedIds}
            setSavedIds={setSavedIds}
          />
        )}

        {activeTab === "live" && <LiveFlightApp />}
      </div>

      <Footer onSwitchTab={switchTab} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootShell />
  </StrictMode>,
);