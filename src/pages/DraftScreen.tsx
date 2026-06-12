import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store/gameStore';
import { CharacterCard } from '../components/CharacterCard';
import { NeonButton } from '../components/NeonButton';
import { ALL_ROLES, Role } from '../types/game';
import { cn } from '../components/NeonButton';
import { startRoomSync, stopRoomSync, getLocalPlayerId } from '../store/syncService';

export function DraftScreen() {
  const navigate = useNavigate();
  const localPlayerId = getLocalPlayerId();
  const { 
    players, 
    currentPlayerIndex, 
    pulledCharacter, 
    pullRandomCharacter, 
    passCharacter, 
    assignRandomCharacter,
    draftPhase,
    currentRound
  } = useGameStore();

  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  
  const currentPlayer = players[currentPlayerIndex];
  
  const takenRoles = currentPlayer?.team.map(t => t.assignedRole) || [];

  // Logic flow check
  useEffect(() => {
    if (draftPhase === 'Battle') navigate('/battle');
    if (draftPhase === 'TeamBuilding') navigate('/teambuilder'); // Should skip if roles assigned here, but fallback handles it
  }, [draftPhase, navigate]);

  // Sync action dispatching
  useEffect(() => {
    const { roomCode } = useGameStore.getState().settings;
    if (!roomCode) return;
    
    startRoomSync(roomCode);
    
    return () => {
      stopRoomSync();
    };
  }, []);

  // CPU Pull Logic
  useEffect(() => {
    if (!currentPlayer || currentPlayer.type !== 'CPU') return;
    
    // Auto pull after brief delay
    if (!pulledCharacter) {
      const t1 = setTimeout(() => pullRandomCharacter(), 1500);
      return () => clearTimeout(t1);
    }
    
    // Evaluate pull after brief delay
    const t2 = setTimeout(() => {
      // 30% chance to pass if they don't like it and have passes
      if (Math.random() < 0.3 && currentPlayer.passesRemaining > 0) {
        passCharacter(currentPlayer.id);
      } else {
        // Accept and assign first preferred role, or random available role
        const availableRoles = ALL_ROLES.filter(r => !takenRoles.includes(r));
        const roleToAssign = pulledCharacter.preferredRoles.find(r => availableRoles.includes(r)) || availableRoles[0];
        assignRandomCharacter(currentPlayer.id, roleToAssign);
      }
    }, 2500);
    
    return () => clearTimeout(t2);
  }, [currentPlayer, pulledCharacter, pullRandomCharacter, passCharacter, assignRandomCharacter]);

  if (!currentPlayer) return null;

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col relative overflow-hidden">
      {/* Background fx */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 10% 50%, #ae00ff, transparent 40%), radial-gradient(circle at 90% 50%, #00f0ff, transparent 40%)'
      }} />

      <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/60 backdrop-blur-md relative z-10">
        <div className="font-display font-black text-2xl tracking-widest uppercase text-white">
          Gacha Protocol <span className="text-fuchsia-500 ml-2">Round {currentRound}</span>
        </div>
        <div className="text-right flex items-center gap-6">
          <div className="text-right">
             <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Current Agent</span>
             <span className="font-display font-bold text-2xl text-cyan-400 uppercase">
               {currentPlayer.name}
             </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Left: Players status */}
        <aside className="w-full md:w-80 border-r border-white/10 bg-black/40 backdrop-blur-md p-4 flex flex-col gap-4 overflow-y-auto shrink-0 hidden md:flex">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-2">Team Rosters</span>
          {players.map(p => (
            <div key={p.id} className={cn(
              "p-4 rounded-xl border transition-all duration-300",
              currentPlayer.id === p.id 
                ? "bg-cyan-900/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                : "bg-black/50 border-white/10"
            )}>
              <h3 className="font-display font-bold uppercase text-sm">{p.name}</h3>
              <p className="text-[10px] font-mono text-gray-400 uppercase mt-1">Passes: {p.passesRemaining}</p>
              <div className="mt-2 text-xs space-y-1 font-mono text-gray-300">
                {p.team.length === 0 && <span className="text-white/20">Awaiting...</span>}
                {p.team.map((t, i) => (
                  <div key={i} className="truncate">
                    <span className="text-fuchsia-400 font-bold">[{t.assignedRole}]</span> {t.character.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Center: Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
          
          <AnimatePresence mode="wait">
            {!pulledCharacter ? (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                className="text-center"
              >
                {currentPlayer.type === 'Human' ? (
                  localPlayerId === 'all' || currentPlayer.id === localPlayerId ? (
                    <>
                      <h2 className="text-2xl font-mono text-gray-400 uppercase tracking-widest mb-12">System Output Pending...</h2>
                      <NeonButton size="xl" onClick={pullRandomCharacter} className="w-64 h-24 text-2xl animate-pulse ring-4 ring-cyan-500/30">
                        INITIATE PULL
                      </NeonButton>
                    </>
                  ) : (
                    <div className="text-2xl font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                       Waiting for {currentPlayer.name} to pull...
                    </div>
                  )
                ) : (
                  <div className="text-2xl font-mono text-fuchsia-400 uppercase tracking-widest animate-pulse">
                     CPU Computing Pull Variables...
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="pulled"
                initial={{ opacity: 0, scale: 0.5, rotateY: 90 }} 
                animate={{ opacity: 1, scale: 1, rotateY: 0 }} 
                transition={{ type: 'spring', damping: 20 }}
                className="flex flex-col md:flex-row items-center md:items-start gap-12 max-w-4xl w-full"
              >
                
                {/* Character Card Reveal */}
                <div className="w-72 md:w-[350px] shrink-0 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                  <CharacterCard character={pulledCharacter} />
                </div>

                {/* Assignment Panel */}
                <div className="flex-1 glass-panel rounded-3xl p-8 border-cyan-500/30 w-full flex flex-col justify-center">
                  <h3 className="text-3xl font-display font-black uppercase text-white mb-2 neon-text-blue">Anomaly Detected</h3>
                  <p className="font-mono text-sm text-gray-400 uppercase tracking-widest mb-8">
                    Proceed with tactical integration or reject.
                  </p>

                  {currentPlayer.type === 'Human' && (localPlayerId === 'all' || currentPlayer.id === localPlayerId) ? (
                    <div className="space-y-6 flex-1">
                      <div>
                        <label className="block text-xs font-mono text-cyan-400 uppercase mb-2">Assign Role Directive</label>
                        <select 
                          className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white font-bold font-mono outline-none focus:border-cyan-400"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as Role)}
                        >
                          <option value="" disabled>--- SELECT ROLE ---</option>
                          {ALL_ROLES.filter(r => !takenRoles.includes(r)).map(r => (
                             <option key={r} value={r}>
                               {r} {pulledCharacter.preferredRoles.includes(r) ? '★ (Synergy)' : ''}
                             </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <NeonButton 
                          className="flex-1" 
                          size="lg" 
                          disabled={!selectedRole}
                          onClick={() => {
                             if(selectedRole) {
                                assignRandomCharacter(currentPlayer.id, selectedRole);
                                setSelectedRole('');
                             }
                          }}
                        >
                          LOCK IN
                        </NeonButton>
                        <NeonButton 
                          className="flex-1" 
                          size="lg" 
                          variant="ghost"
                          disabled={currentPlayer.passesRemaining <= 0}
                          onClick={() => {
                            passCharacter(currentPlayer.id);
                            setSelectedRole('');
                          }}
                        >
                          REJECT / PASS ({currentPlayer.passesRemaining})
                        </NeonButton>
                      </div>
                    </div>
                  ) : currentPlayer.type === 'Human' ? (
                    <div className="flex-1 flex flex-col justify-center text-center py-10 space-y-4">
                       <p className="text-xl font-mono text-cyan-400 uppercase animate-pulse">Waiting for {currentPlayer.name} to lock in...</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center text-center py-10 space-y-4">
                       <p className="text-xl font-mono text-fuchsia-400 uppercase animate-pulse">CPU Processizing Decision...</p>
                    </div>
                  )}

                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
