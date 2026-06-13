import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { useGameStore } from '../store/gameStore';
import { NeonButton } from '../components/NeonButton';
import { cn } from '../components/NeonButton';
import { GameMode, Player } from '../types/game';
import { characters } from '../data/characters';
import { Wifi, Copy, Lock } from 'lucide-react';
import { decompressState, broadcastStartGame, updateStoreFromNetwork } from '../store/syncService';

// Generates a random 4-character string
const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

export function Lobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const baseMode = searchParams.get('mode') || 'cpu'; // 'cpu', 'host', 'hotseat', 'join'
  const urlCode = searchParams.get('code');
  
  const initGame = useGameStore(s => s.initializeGame);
  const resetGame = useGameStore(s => s.resetGame);

  useEffect(() => {
    resetGame();
  }, [resetGame]);
  
  const [p1Name, setP1Name] = useState(baseMode === 'join' ? 'Player 1 (Host)' : (baseMode === 'host' ? 'Player 1 (Host)' : 'Player 1'));
  const [p2Name, setP2Name] = useState(baseMode === 'cpu' ? 'CPU Alpha' : (baseMode === 'join' ? 'Player 2 (You)' : 'Player 2'));
  const [roomCode, setRoomCode] = useState<string>(urlCode || '');

  const [p1Connected, setP1Connected] = useState(baseMode === 'host');
  const [p2Connected, setP2Connected] = useState(baseMode === 'cpu');

  const lastP1Name = useRef(p1Name);
  const lastP2Name = useRef(p2Name);

  const p1NameRef = useRef(p1Name);
  p1NameRef.current = p1Name;

  const p2NameRef = useRef(p2Name);
  p2NameRef.current = p2Name;

  useEffect(() => {
    if (baseMode === 'host' && !roomCode) {
      setRoomCode(generateRoomCode());
    }
  }, [baseMode, roomCode]);

  useEffect(() => {
    const localId = baseMode === 'join' ? '2' : (baseMode === 'hotseat' ? 'all' : '1');
    sessionStorage.setItem('localPlayerId', localId);
  }, [baseMode]);

  const broadcastNameUpdate = (playerId: string, name: string) => {
    const localPlayerId = sessionStorage.getItem('localPlayerId') || '1';
    fetch(`https://ntfy.sh/adb-room-${roomCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        type: 'UPDATE_NAME',
        playerId,
        name,
        senderId: localPlayerId
      })
    }).catch(err => console.error('Error broadcasting name:', err));
  };

  const handleP1NameBlur = () => {
    if (roomCode && baseMode === 'host' && p1Name !== lastP1Name.current) {
      broadcastNameUpdate('1', p1Name);
      lastP1Name.current = p1Name;
    }
  };

  const handleP2NameBlur = () => {
    if (roomCode && baseMode === 'join' && p2Name !== lastP2Name.current) {
      broadcastNameUpdate('2', p2Name);
      lastP2Name.current = p2Name;
    }
  };

  // Debounced real-time name broadcast
  useEffect(() => {
    if (!roomCode || baseMode !== 'host') return;
    if (p1Name === 'Player 1 (Host)' || p1Name === 'Player 1') return;
    const delayDebounce = setTimeout(() => {
      broadcastNameUpdate('1', p1Name);
      lastP1Name.current = p1Name;
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [p1Name, roomCode, baseMode]);

  useEffect(() => {
    if (!roomCode || baseMode !== 'join') return;
    if (p2Name === 'Player 2 (You)' || p2Name === 'Player 2') return;
    const delayDebounce = setTimeout(() => {
      broadcastNameUpdate('2', p2Name);
      lastP2Name.current = p2Name;
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [p2Name, roomCode, baseMode]);

  // Handshake retry loop for player 2 (joiner)
  useEffect(() => {
    if (baseMode !== 'join' || !roomCode || p1Connected) return;

    const sendJoin = () => {
      fetch(`https://ntfy.sh/adb-room-${roomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          type: 'PLAYER_JOINED',
          name: p2NameRef.current,
          senderId: '2'
        })
      }).catch(err => console.error('Error broadcasting join:', err));
    };

    sendJoin();
    const interval = setInterval(sendJoin, 4000);
    return () => clearInterval(interval);
  }, [roomCode, baseMode, p1Connected]);

  // Host Ping broadcast on mount
  useEffect(() => {
    if (baseMode === 'host' && roomCode) {
      const timer = setTimeout(() => {
        fetch(`https://ntfy.sh/adb-room-${roomCode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            type: 'HOST_PING',
            name: p1NameRef.current,
            senderId: '1'
          })
        }).catch(err => console.error('Error broadcasting host ping:', err));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [roomCode, baseMode]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Sync effect using ntfy for online syncing
  useEffect(() => {
    if (!roomCode || (baseMode !== 'host' && baseMode !== 'join')) return;

    const localPlayerId = sessionStorage.getItem('localPlayerId') || '1';

    const es = new EventSource(`https://ntfy.sh/adb-room-${roomCode}/sse?since=latest`);
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'message') {
          const payload = JSON.parse(data.message);
          
          if (payload.senderId === localPlayerId) return;

          if (payload.type === 'UPDATE_NAME') {
            if (payload.playerId === '1') setP1Name(payload.name);
            if (payload.playerId === '2') setP2Name(payload.name);
          } else if (payload.type === 'PLAYER_JOINED') {
            setP2Name(payload.name);
            setP2Connected(true);
            
            // Reply with host name and ack
            fetch(`https://ntfy.sh/adb-room-${roomCode}`, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({
                type: 'HOST_ACK',
                name: p1NameRef.current,
                senderId: '1'
              })
            }).catch(err => console.error('Error sending host ack:', err));
          } else if (payload.type === 'HOST_ACK') {
            setP1Name(payload.name);
            setP1Connected(true);
            setP2Connected(true);
          } else if (payload.type === 'HOST_PING') {
            setP1Connected(false);
          } else if (payload.type === 'START_GAME' || payload.type === 'SYNC_STATE') {
            const state = decompressState(payload.state);
            updateStoreFromNetwork(state);
          }
        }
      } catch (e) {
        console.error('Error parsing lobby sync event:', e);
      }
    };

    return () => {
      es.close();
    };
  }, [roomCode, baseMode]);

  // Navigate when game starts
  useEffect(() => {
    const checkState = (state: any) => {
      if (baseMode === 'join' && (state.draftPhase === 'Drafting' || state.draftPhase === 'Auction')) {
        if (state.settings.mode === 'Auction') navigate('/auction');
        else navigate('/draft');
      }
    };

    // Check immediately on mount in case store has already updated
    checkState(useGameStore.getState());

    const unsub = useGameStore.subscribe(checkState);
    return () => unsub();
  }, [baseMode, navigate]);
  
  const [gameMode, setGameMode] = useState<GameMode>('Draft');
  
  // Get unique universes
  const allUniverses = Array.from(new Set(characters.map(c => c.universe)));
  const [selectedUniverses, setSelectedUniverses] = useState<string[]>(
    allUniverses.filter(u => u.startsWith('Dragon Ball'))
  );

  const [maxPasses, setMaxPasses] = useState(2);
  const [auctionBudget, setAuctionBudget] = useState(150);
  const [teamSize, setTeamSize] = useState(5);

  const toggleUniverse = (u: string) => {
    // Only 'Dragon Ball' sub-universes are unlocked and always selected
    if (u.startsWith('Dragon Ball')) return;
    setSelectedUniverses(prev => 
      prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]
    );
  };

  const handleStart = () => {
    if (selectedUniverses.length === 0) return alert("Select at least one universe!");

    const players: Omit<Player, 'team' | 'passesRemaining'>[] = [
      { id: '1', name: p1Name, type: 'Human', budget: auctionBudget },
      { id: '2', name: p2Name, type: baseMode === 'cpu' ? 'CPU' : 'Human', budget: auctionBudget },
    ];
    
    initGame(players, {
      mode: gameMode,
      budget: auctionBudget,
      playerCount: 2,
      cpuCount: baseMode === 'cpu' ? 1 : 0,
      universeRestrictions: selectedUniverses.length === allUniverses.length ? [] : selectedUniverses,
      maxPasses: maxPasses,
      roomCode: roomCode,
      teamSize: teamSize
    });

    if (roomCode && (baseMode === 'host' || baseMode === 'join')) {
      // Small 150ms timeout prevents network rate limit conflicts if name blur broadcast happens simultaneously
      setTimeout(() => {
        broadcastStartGame(roomCode, useGameStore.getState());
      }, 150);
    }

    if (gameMode === 'Auction') navigate('/auction');
    else navigate('/draft');
  };

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-neon-purple/10 blur-[150px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-4xl rounded-3xl p-6 md:p-10 relative z-10 flex flex-col md:flex-row gap-8"
      >
        {/* Left Side: System Lobby */}
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="text-4xl font-display font-bold uppercase mb-2 neon-text-blue tracking-widest flex items-center gap-3">
              SYSTEM LOBBY
              {roomCode && (
                <span className="flex items-center gap-2 text-xs font-mono bg-cyan-900/40 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400">
                  <Wifi className="w-3 h-3 animate-pulse" /> P2P Sync Active
                </span>
              )}
            </h2>
            <p className="font-mono text-gray-400 text-sm flex justify-between items-center gap-4">
              <span>{baseMode === 'cpu' ? 'SINGLE PLAYER :: VS CPU' : (baseMode === 'join' ? 'MULTIPLAYER :: JOINING ROOM' : (baseMode === 'host' ? 'MULTIPLAYER :: HOSTING' : 'LOCAL MULTIPLAYER :: HOTSEAT'))}</span>
              <button 
                onClick={() => navigate('/')}
                className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 px-3 py-1.5 bg-red-950/20 border border-red-500/20 hover:border-red-500/50 rounded-lg transition-all duration-300 cursor-pointer shrink-0"
              >
                Exit Lobby
              </button>
            </p>
            {roomCode && (baseMode === 'host' || baseMode === 'join') && (
              <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Room Code</p>
                  <p className="text-3xl font-black tracking-[0.2em]">{roomCode}</p>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(roomCode)}
                  className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                  title="Copy Room Code"
                >
                  <Copy className="w-5 h-5 text-cyan-400" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-black/50 p-4 lg:p-6 rounded-xl border border-white/10 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_#00f0ff]" />
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-mono text-cyan-500">SLOT 01 :: {baseMode === 'join' ? 'PLAYER 1 (HOST)' : 'PLAYER 1 (YOU)'}</label>
                {baseMode === 'join' && (
                  <span className={`text-[10px] font-mono flex items-center gap-1 ${p1Connected ? 'text-green-400' : 'text-yellow-500 animate-pulse'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p1Connected ? 'bg-green-400' : 'bg-yellow-500'}`} />
                    {p1Connected ? 'Connected' : 'Connecting...'}
                  </span>
                )}
              </div>
              <input 
                type="text" 
                value={p1Name}
                onChange={e => setP1Name(e.target.value)}
                onBlur={handleP1NameBlur}
                onKeyDown={handleInputKeyDown}
                disabled={baseMode === 'join'}
                className="w-full bg-transparent border-b border-white/20 focus:border-cyan-400 text-2xl font-bold font-display text-white outline-none py-2 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="bg-black/50 p-4 lg:p-6 rounded-xl border border-white/10 relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-fuchsia-500 shadow-[0_0_10px_#ae00ff]" />
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-mono text-fuchsia-500">
                  SLOT 02 :: {baseMode === 'cpu' ? 'CPU' : (baseMode === 'join' ? 'PLAYER 2 (YOU)' : 'PLAYER 2 (GUEST)')}
                </label>
                {(baseMode === 'host' || baseMode === 'join') && (
                  <span className={`text-[10px] font-mono flex items-center gap-1 ${p2Connected ? 'text-green-400' : 'text-yellow-500 animate-pulse'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p2Connected ? 'bg-green-400' : 'bg-yellow-500'}`} />
                    {p2Connected ? 'Connected' : 'Waiting...'}
                  </span>
                )}
              </div>
              <input 
                type="text" 
                value={p2Name}
                onChange={e => setP2Name(e.target.value)}
                onBlur={handleP2NameBlur}
                onKeyDown={handleInputKeyDown}
                disabled={baseMode === 'host' || baseMode === 'cpu'}
                className="w-full bg-transparent border-b border-white/20 focus:border-fuchsia-400 text-2xl font-bold font-display text-white outline-none py-2 transition-colors disabled:opacity-50"
              />
            </div>
          </div>
          
          <div className="hidden md:block">
            {baseMode === 'join' ? (
               <div className="w-full text-center py-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-600">
                 <p className="font-mono text-gray-400 uppercase tracking-widest text-sm animate-pulse">Waiting for host to initiate...</p>
               </div>
            ) : (
              <NeonButton size="xl" onClick={handleStart} className="w-full">
                INITIATE MATCH
              </NeonButton>
            )}
          </div>
        </div>

        {/* Right Side: Game Settings */}
        <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 p-6 flex flex-col gap-6">
          
          {/* Game Mode */}
          <div className={cn("transition-opacity", baseMode === 'join' ? "opacity-50 pointer-events-none" : "opacity-100")}>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">Protocol / Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['Draft', 'Auction'] as GameMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setGameMode(m)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                    gameMode === m 
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]" 
                      : "bg-black/50 border-white/10 text-gray-400 hover:border-white/30"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Specific Settings */}
          <div className={cn("p-4 bg-white/5 border border-white/10 rounded-xl space-y-4", baseMode === 'join' ? "opacity-50 pointer-events-none" : "opacity-100")}>
            <div>
               <label className="flex justify-between text-xs font-mono text-gray-400 uppercase mb-2">
                 <span>Team Size</span>
                 <span className="text-white">{teamSize}</span>
               </label>
               <input 
                 type="range" min="3" max="12" step="1" value={teamSize} onChange={e => setTeamSize(parseInt(e.target.value))}
                 className="w-full accent-white"
               />
            </div>
            {gameMode === 'Draft' && (
              <div>
                 <label className="flex justify-between text-xs font-mono text-gray-400 uppercase mb-2">
                   <span>Max Passes</span>
                   <span className="text-cyan-400">{maxPasses}</span>
                 </label>
                 <input 
                   type="range" min="0" max="5" value={maxPasses} onChange={e => setMaxPasses(parseInt(e.target.value))}
                   className="w-full accent-cyan-400"
                 />
                 <p className="text-[10px] text-gray-500 mt-2 leading-tight">Players can reject a random pull and try again, up to {maxPasses} times.</p>
              </div>
            )}
            {gameMode === 'Auction' && (
              <div>
                 <label className="flex justify-between text-xs font-mono text-gray-400 uppercase mb-2">
                   <span>Starting Budget</span>
                   <span className="text-fuchsia-400">${auctionBudget}</span>
                 </label>
                 <input 
                   type="range" min="50" max="300" step="10" value={auctionBudget} onChange={e => setAuctionBudget(parseInt(e.target.value))}
                   className="w-full accent-fuchsia-400"
                 />
              </div>
            )}
            {gameMode === 'Auction' && (
              <p className="text-xs text-gray-400 font-mono italic">Characters appear for live open bidding.</p>
            )}
          </div>

          {/* Universe Restrictions */}
          <div className={cn("flex-1 overflow-auto h-0 min-h-[150px]", baseMode === 'join' ? "opacity-50 pointer-events-none" : "opacity-100")}>
            <label className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">Allowed Universes</label>
            <div className="grid grid-cols-2 gap-2">
              {allUniverses.map(u => {
                const isSelected = selectedUniverses.includes(u);
                const isLocked = !u.startsWith('Dragon Ball') && u !== 'Naruto';
                return (
                  <div 
                    key={u}
                    onClick={() => {
                      if (isLocked) return;
                      toggleUniverse(u);
                    }}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-between",
                      isLocked 
                        ? "bg-slate-950/20 border-slate-900/50 text-slate-600 cursor-not-allowed opacity-40" 
                        : isSelected 
                          ? "bg-white/10 border-white/30 text-white cursor-pointer" 
                          : "bg-black/50 border-white/5 text-gray-600 hover:border-white/20 cursor-pointer"
                    )}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      {isLocked && <Lock className="w-3 h-3 text-red-500/80" />}
                      {u}
                    </span>
                    {!isLocked ? (
                      <div className={cn("w-2 h-2 rounded-full", isSelected ? "bg-green-400 shadow-[0_0_5px_#4ade80]" : "bg-gray-800")} />
                    ) : (
                      <span className="text-[9px] uppercase tracking-tighter text-red-500/60 font-mono font-bold">Locked</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Mobile Start Button */}
          <div className="md:hidden mt-4">
            {baseMode === 'join' ? (
               <div className="w-full text-center py-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-600">
                 <p className="font-mono text-gray-400 uppercase tracking-widest text-sm animate-pulse">Waiting for host...</p>
               </div>
            ) : (
              <NeonButton size="lg" onClick={handleStart} className="w-full">
                INITIATE MATCH
              </NeonButton>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
