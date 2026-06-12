import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store/gameStore';
import { CharacterCard } from '../components/CharacterCard';
import { NeonButton } from '../components/NeonButton';
import { cn } from '../components/NeonButton';
import { startRoomSync, stopRoomSync, getLocalPlayerId } from '../store/syncService';

export function AuctionScreen() {
  const navigate = useNavigate();
  const localPlayerId = getLocalPlayerId();
  const { 
    settings,
    players, 
    availableCharacters,
    auctionCurrentCharacter,
    auctionCurrentBid,
    auctionHighestBidderId,
    startNextAuction,
    placeBid,
    placeAbsoluteBid,
    resolveAuction,
    sellCharacter,
    recruitGrunt,
    draftPhase
  } = useGameStore();

  const [timer, setTimer] = useState(10);
  const [auctionActive, setAuctionActive] = useState(false);
  const [selectedSellPlayerId, setSelectedSellPlayerId] = useState<string | null>(null);
  const [customBids, setCustomBids] = useState<Record<string, string>>({});
  const [showMobileRosters, setShowMobileRosters] = useState(false);

  const handlePlaceBid = (playerId: string, amount: number) => {
    placeBid(playerId, amount);
    setTimer(10);
  };

  const handlePlaceAbsoluteBid = (playerId: string, amount: number) => {
    placeAbsoluteBid(playerId, amount);
    setTimer(10);
  };

  // Sync action dispatching
  useEffect(() => {
    const { roomCode } = useGameStore.getState().settings;
    if (!roomCode) return;
    
    startRoomSync(roomCode);
    
    return () => {
      stopRoomSync();
    };
  }, []);

  // CPU AI Bidding Logic
  useEffect(() => {
    if (!auctionActive || !auctionCurrentCharacter) return;
    
    // Check if CPU wants to bid
    const cpuPlayers = players.filter(p => p.type === 'CPU');
    if (cpuPlayers.length === 0) return;

    const timeout = setTimeout(() => {
      // Very basic CPU intelligence, run 1/3 chance every ~1s to simulate hesitation
      if (Math.random() > 0.4) {
        const cpu = cpuPlayers[Math.floor(Math.random() * cpuPlayers.length)];
        
        // Don't bid if already highest, don't overspend too much on base price, don't exceed budget
        if (
          auctionHighestBidderId !== cpu.id && 
          auctionCurrentBid < auctionCurrentCharacter!.basePrice + 35 &&
          cpu.budget >= Math.max(auctionCurrentBid + 5, auctionCurrentCharacter!.basePrice * 0.5) &&
          cpu.team.length < settings.teamSize
        ) {
          // calculate required bid: CPU should only bid if it can beat current bid.
          const currentBidIsZero = auctionCurrentBid === 0;
          const initialBid = Math.floor(auctionCurrentCharacter.basePrice * 0.4) || 5; 
          const bidAmount = currentBidIsZero ? initialBid : 5;
          handlePlaceBid(cpu.id, bidAmount);
        } else if (cpu.budget < 15 && cpu.team.length < settings.teamSize) {
          recruitGrunt(cpu.id);
        }
      }
    }, 1500 + Math.random() * 1000); // 1.5 - 2.5s delay
    
    return () => clearTimeout(timeout);
  }, [auctionCurrentBid, auctionActive, auctionHighestBidderId, players, auctionCurrentCharacter]);

  // Synchronize auction starting when a new character is drawn
  useEffect(() => {
    if (auctionCurrentCharacter) {
      setTimer(10);
      setAuctionActive(true);
    } else {
      setAuctionActive(false);
      setTimer(10);
    }
  }, [auctionCurrentCharacter]);

  // Synchronize timer reset when a bid is placed
  useEffect(() => {
    if (auctionCurrentCharacter && auctionCurrentBid > 0) {
      setTimer(10);
      setAuctionActive(true);
    }
  }, [auctionCurrentBid, auctionCurrentCharacter]);

  const { roomCode } = settings;
  const isHost = !roomCode || localPlayerId === '1' || localPlayerId === 'all';

  // Main Auction Timer
  useEffect(() => {
    if (!auctionActive) return;

    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          // Only the host resolves the auction in multiplayer, to prevent double resolution/race conditions
          if (isHost) {
            resolveAuction();
          }
          setAuctionActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionActive, isHost, resolveAuction]);

  // Manage Draft Phase
  useEffect(() => {
    if (draftPhase === 'TeamBuilding') {
      navigate('/teambuilder');
    }
  }, [draftPhase, navigate]);

  const handleNextAuction = () => {
    startNextAuction();
    setTimer(10);
    setAuctionActive(true);
  };

  const highestBidderName = players.find(p => p.id === auctionHighestBidderId)?.name || "—";

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden">
      {/* Background fx */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 50% 0%, #ff0055, transparent 50%)' // Crimson/pink for auction tension
      }} />

      <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/60 backdrop-blur-md relative z-10">
        <div className="font-display font-black text-2xl tracking-widest uppercase neon-text-pink flex items-center gap-4">
          <span>AUCTION WARS</span>
          <button 
            onClick={() => setShowMobileRosters(true)}
            className="md:hidden px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-pink-400 hover:bg-white/20 transition-all active:scale-95"
          >
            Teams
          </button>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest block">Available Pool</span>
          <span className="font-display font-bold text-xl text-white">
            {availableCharacters.length} <span className="text-pink-500">Remaining</span>
          </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Player status */}
        <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-md p-4 flex flex-col gap-4 overflow-y-auto z-10 relative hidden md:flex">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-2">Participant Status</span>
          
          {players.map(p => (
            <div key={p.id} className={cn(
              "p-4 rounded-xl border transition-all duration-300",
              auctionHighestBidderId === p.id 
                ? "bg-pink-900/40 border-pink-500 shadow-[0_0_15px_rgba(255,0,85,0.2)]"
                : "bg-black/50 border-white/10"
            )}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-bold uppercase text-sm truncate pr-2" title={p.name}>{p.name}</h3>
                {p.type === 'CPU' && <span className="text-[9px] px-1 bg-white/10 rounded uppercase">CPU</span>}
              </div>
              <div className="font-mono text-xl font-bold text-cyan-400 border-b border-white/10 pb-2 mb-2">
                ${p.budget}
              </div>
              <div className="flex gap-1 h-12">
                {Array.from({ length: settings.teamSize }).map((_, idx) => {
                  const drafted = p.team[idx];
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex-1 h-full rounded-sm relative group cursor-pointer overflow-hidden",
                        drafted ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-white/10"
                      )}
                      onClick={() => {
                        if (drafted && p.type === 'Human') {
                          if(confirm(`Sell ${drafted.character.name} for $${Math.floor(drafted.character.basePrice * 0.5)}?`)) {
                            sellCharacter(p.id, drafted.character.id);
                          }
                        }
                      }}
                    >
                      {drafted && (
                        <>
                          <img src={drafted.character.image} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-10" />
                          {p.type === 'Human' && (
                            <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[8px] font-bold text-white uppercase break-all px-1 leading-tight text-center">
                                Sell<br/>+${Math.floor(drafted.character.basePrice * 0.5)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Center: Stage */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-0">
          
          <AnimatePresence mode="wait">
            {!auctionCurrentCharacter && !auctionActive ? (
              <motion.div 
                key="start"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-dashed border-white/20 animate-spin-slow mb-8" />
                <h2 className="text-3xl font-display font-black uppercase mb-8 text-gray-400">Waiting for next lot...</h2>
                {isHost ? (
                  <NeonButton size="xl" variant="pink" onClick={handleNextAuction}>Bring Out Next Lot</NeonButton>
                ) : (
                  <p className="text-xl font-mono text-pink-500 uppercase animate-pulse">Waiting for host to bring out next lot...</p>
                )}
              </motion.div>
            ) : auctionCurrentCharacter ? (
              <motion.div 
                key="active"
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}
                className="flex flex-col md:flex-row items-center gap-12 w-full max-w-4xl"
              >
                {/* Visual Card */}
                <div className="w-72 md:w-80 shrink-0 shadow-2xl relative">
                  <CharacterCard character={auctionCurrentCharacter} />
                  {/* Hammer base price tag */}
                  <div className="absolute -top-4 -right-4 bg-yellow-500 text-black font-display font-black text-xl px-4 py-2 rounded-xl transform rotate-12 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                    Est: ${auctionCurrentCharacter.basePrice}
                  </div>
                </div>

                {/* Bidding Panel */}
                <div className="flex-1 glass-panel rounded-3xl p-8 border-pink-500/30 text-center w-full relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-white/10">
                    <motion.div 
                      className="h-full bg-pink-500 shadow-[0_0_10px_#ff0055]" 
                      initial={{ width: '100%' }}
                      animate={{ width: `${(timer / 10) * 100}%` }}
                      transition={{ ease: "linear", duration: 1 }}
                    />
                  </div>
                  
                  <div className="text-[100px] leading-none font-black text-white mix-blend-overlay absolute opacity-5 pointer-events-none">{timer}</div>
                  
                  <h3 className="text-sm font-mono text-gray-400 uppercase tracking-[0.2em] mb-4">Current Bid</h3>
                  <motion.div 
                    key={auctionCurrentBid}
                    initial={{ scale: 1.5, color: '#ff0055' }}
                    animate={{ scale: 1, color: '#00f0ff' }}
                    className="text-7xl font-display font-black mb-2 neon-text-blue"
                  >
                    ${auctionCurrentBid}
                  </motion.div>
                  <p className="font-mono text-gray-300 uppercase tracking-widest text-sm mb-8">
                    Highest Bidder: <span className="text-white font-bold">{highestBidderName}</span>
                  </p>
                  
                  <div className="text-5xl font-display font-black mb-8 tabular-nums tracking-tighter" style={{ color: timer <= 3 ? '#ff0055' : 'white' }}>
                    00:{timer.toString().padStart(2, '0')}
                  </div>

                  <div className="flex justify-center gap-4 flex-wrap">
                    {players.filter(p => p.type === 'Human').filter(p => localPlayerId === 'all' || p.id === localPlayerId).map(human => {
                       const isTeamFull = human.team.length >= settings.teamSize;
                       const canBid = human.budget >= auctionCurrentBid + 5 && !isTeamFull && timer > 0;
                       const customBidVal = parseInt(customBids[human.id] || "0") || 0;
                       const canCustomBid = customBidVal > auctionCurrentBid && human.budget >= customBidVal && !isTeamFull && timer > 0;
                       return (
                         <div key={human.id} className="p-4 bg-black/40 rounded-xl border border-white/10 space-y-3">
                           <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">{human.name}</p>
                           {isTeamFull ? (
                             <div className="text-sm font-mono text-gray-500 uppercase tracking-widest px-8">Team Full</div>
                           ) : (
                             <div className="flex gap-2 justify-center flex-col items-center">
                               <div className="flex gap-2">
                                 <NeonButton size="sm" variant="ghost" disabled={!canBid} onClick={() => handlePlaceBid(human.id, 5)}>+5</NeonButton>
                                 <NeonButton size="sm" variant="purple" disabled={human.budget < auctionCurrentBid + 10} onClick={() => handlePlaceBid(human.id, 10)}>+10</NeonButton>
                                 <NeonButton size="sm" variant="pink" disabled={human.budget < auctionCurrentBid + 20} onClick={() => handlePlaceBid(human.id, 20)}>+20</NeonButton>
                               </div>
                               <div className="flex gap-2 w-full mt-1">
                                 <input 
                                   type="number"
                                   placeholder="Custom bid"
                                   className="flex-1 bg-black/50 border border-white/10 text-white rounded px-2 py-1 text-xs font-mono"
                                   value={customBids[human.id] || ''}
                                   onChange={e => setCustomBids({...customBids, [human.id]: e.target.value})}
                                 />
                                 <NeonButton size="sm" variant="blue" disabled={!canCustomBid} onClick={() => {
                                   if (canCustomBid) {
                                     handlePlaceAbsoluteBid(human.id, customBidVal);
                                     setCustomBids({...customBids, [human.id]: ''});
                                   }
                                 }}>Bid</NeonButton>
                               </div>
                               {human.budget < 15 && (
                                 <NeonButton size="sm" variant="ghost" className="w-full text-[10px]" onClick={() => recruitGrunt(human.id)}>
                                   Recruit Grunt ($0)
                                 </NeonButton>
                               )}
                             </div>
                           )}
                         </div>
                       );
                    })}
                  </div>

                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

        </main>
      </div>

      <AnimatePresence>
        {showMobileRosters && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <div className="glass-panel w-full max-w-md rounded-2xl border-white/20 p-6 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-display font-bold uppercase text-white tracking-wider">Team Rosters</h2>
                <button 
                  onClick={() => setShowMobileRosters(false)}
                  className="text-gray-400 hover:text-white font-mono text-xs uppercase px-3 py-1 border border-white/10 rounded bg-white/5 hover:bg-white/10"
                >
                  Close
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6">
                {players.map(p => (
                  <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="font-display font-bold uppercase text-base text-pink-500">{p.name}</h3>
                    <div className="flex justify-between text-xs font-mono text-gray-400 mt-1">
                      <span>Type: {p.type}</span>
                      <span className="text-green-400 font-bold">${p.budget}</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {p.team.length === 0 && <span className="text-xs text-white/20 font-mono">No operatives drafted yet...</span>}
                      {p.team.map((t, i) => (
                        <div key={i} className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-white/5">
                          <img src={t.character.image} className="w-8 h-8 rounded-full object-cover border border-white/10" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate text-white">{t.character.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">{t.character.universe}</p>
                          </div>
                          {t.assignedRole && (
                            <span className="text-[10px] font-mono text-fuchsia-400 font-bold bg-fuchsia-950/40 border border-fuchsia-500/20 px-2 py-0.5 rounded">
                              {t.assignedRole}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
