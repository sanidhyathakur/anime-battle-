import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Landing } from './pages/Landing';
import { Lobby } from './pages/Lobby';
import { DraftScreen } from './pages/DraftScreen';
import { TeamBuilder } from './pages/TeamBuilder';
import { BattleResult } from './pages/BattleResult';
import { AuctionScreen } from './pages/AuctionScreen';
import { GlobalMusicPlayer } from './components/GlobalMusicPlayer';
import { useGameStore } from './store/gameStore';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  useEffect(() => {
    // Force music state to false on load to respect browser autoplay policies
    useGameStore.setState({ musicPlaying: false });
  }, []);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/draft" element={<DraftScreen />} />
          <Route path="/auction" element={<AuctionScreen />} />
          <Route path="/teambuilder" element={<TeamBuilder />} />
          <Route path="/battle" element={<BattleResult />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalMusicPlayer />
      </BrowserRouter>
      <Analytics />
    </>
  );
}
