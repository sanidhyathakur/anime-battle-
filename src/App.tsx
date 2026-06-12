import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Landing } from './pages/Landing';
import { Lobby } from './pages/Lobby';
import { DraftScreen } from './pages/DraftScreen';
import { TeamBuilder } from './pages/TeamBuilder';
import { BattleResult } from './pages/BattleResult';
import { AuctionScreen } from './pages/AuctionScreen';

export default function App() {
  return (
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
    </BrowserRouter>
  );
}
