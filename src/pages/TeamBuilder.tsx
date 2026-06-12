import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../store/gameStore';
import { NeonButton } from '../components/NeonButton';
import { ALL_ROLES, Role } from '../types/game';
import { cn } from '../components/NeonButton';
import { startRoomSync, stopRoomSync, getLocalPlayerId } from '../store/syncService';

export function TeamBuilder() {
  const navigate = useNavigate();
  const { players, assignRole, setDraftPhase } = useGameStore();
  const localPlayerId = getLocalPlayerId();
  const initialPlayerIndex = localPlayerId === '2' ? 1 : 0;
  const [viewingPlayer, setViewingPlayer] = useState(initialPlayerIndex);

  const player = players[viewingPlayer];

  // Sync action dispatching
  useEffect(() => {
    const { roomCode } = useGameStore.getState().settings;
    if (!roomCode) return;
    
    startRoomSync(roomCode);
    
    return () => {
      stopRoomSync();
    };
  }, []);

  useEffect(() => {
    // If draftPhase becomes 'Battle' via sync, navigate
    const unsub = useGameStore.subscribe((state) => {
      if (state.draftPhase === 'Battle') {
        navigate('/battle');
      }
    });
    return () => unsub();
  }, [navigate]);

  // CPU Role Auto-Assignment
  useEffect(() => {
    const cpuPlayers = players.filter(p => p.type === 'CPU');
    
    // Check if any CPU needs roles assigned
    const needsRoles = cpuPlayers.some(cpu => cpu.team.some(t => !t.assignedRole));
    
    if (needsRoles) {
      const timeout = setTimeout(() => {
        cpuPlayers.forEach(cpu => {
          cpu.team.forEach(t => {
            if (!t.assignedRole) {
              // Find roles that haven't been assigned yet to this CPU's team
              const currentCpuState = useGameStore.getState().players.find(p => p.id === cpu.id)!;
              const takenRoles = currentCpuState.team.map(pt => pt.assignedRole).filter(Boolean);
              
              const availableRoles = ALL_ROLES.filter(r => !takenRoles.includes(r));
              
              // Prefer their preferred roles, then general roles, then fallback to anything available
              const preferredMatch = availableRoles.find(r => t.character.preferredRoles.includes(r));
              const roleMatch = availableRoles.find(r => t.character.roles.includes(r));
              const roleToAssign = preferredMatch || roleMatch || availableRoles[0];
              
              if (roleToAssign) {
                assignRole(cpu.id, t.character.id, roleToAssign);
              }
            }
          });
        });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [players, assignRole]);

  const myTeam = players.find(p => p.id === localPlayerId)?.team || [];
  const localPlayerDone = myTeam.every(t => t.assignedRole);
  const allPlayersDone = players.every(p => p.team.every(t => t.assignedRole));

  const getButtonText = () => {
    if (localPlayerId === 'all') {
      return viewingPlayer < players.length - 1 ? 'Next Roster' : 'Commence Battle';
    }
    if (!localPlayerDone) {
      return 'Lock Roster / Ready';
    }
    if (!allPlayersDone) {
      return 'Waiting for Opponent...';
    }
    return 'Commence Battle';
  };

  const isButtonDisabled = () => {
    if (localPlayerId === 'all') return false;
    if (!localPlayerDone) {
      return !myTeam.every(t => t.assignedRole);
    }
    return !allPlayersDone;
  };

  const handleFinish = () => {
    if (localPlayerId === 'all') {
      if (viewingPlayer < players.length - 1) {
        setViewingPlayer(v => v + 1);
      } else {
        const allDone = players.every(p => p.team.every(t => t.assignedRole));
        if (allDone) {
          setDraftPhase('Battle');
          navigate('/battle');
        } else {
          alert("Please assign roles to all operatives!");
        }
      }
    } else {
      if (allPlayersDone) {
        setDraftPhase('Battle');
        navigate('/battle');
      } else {
        alert("Roster locked. Waiting for opponent to finish...");
      }
    }
  };

  const getRoleMultiplier = (charRoles: Role[], assignedRole: Role) => {
    if (charRoles[0] === assignedRole) return "+35% (Canon)";
    if (charRoles.includes(assignedRole)) return "+20% (Preferred)";
    return "0% (Neutral)";
  };

  return (
    <div className="min-h-screen bg-[#050508] relative p-6 font-sans flex flex-col">
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, #ae00ff, #050508 50%)' }} />

      <header className="text-center mb-8 relative z-10">
        <h1 className="text-4xl md:text-5xl font-display font-black uppercase text-white tracking-widest neon-text-purple">
          Tactical Planning
        </h1>
        <p className="text-gray-400 font-mono mt-2 tracking-widest uppercase">
          Assign Roles & Optimize Synergy
        </p>
      </header>
      
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left: Player selection / info */}
        <div className="lg:col-span-3 space-y-4">
          {players.map((p, i) => (
            <div 
              key={p.id}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer",
                viewingPlayer === i 
                  ? "bg-fuchsia-900/40 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                  : "bg-black/40 border-white/10 opacity-50 hover:opacity-100"
              )}
              onClick={() => setViewingPlayer(i)}
            >
              <h3 className="font-display font-bold uppercase">{p.name}</h3>
              <p className="text-xs font-mono text-gray-400 mt-1">
                {p.team.filter(t => t.assignedRole).length} / {p.team.length} Roles Assigned
              </p>
            </div>
          ))}

          <div className="pt-8">
            <NeonButton 
              variant="purple" 
              size="lg" 
              className="w-full" 
              onClick={handleFinish}
              disabled={isButtonDisabled()}
            >
              {getButtonText()}
            </NeonButton>
          </div>
        </div>

        {/* Right: Roster Management */}
        <div className="lg:col-span-9 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-white uppercase">{player.name}'s Roster</h2>
              <p className="text-fuchsia-400 font-mono text-sm">Select a role for each operative</p>
            </div>
            <div className="text-right">
               <p className="text-sm font-mono text-gray-400">Total Base Power</p>
               <p className="text-3xl font-display font-bold text-white tracking-widest">
                 {player.team.reduce((acc, curr) => acc + curr.character.powerLevel, 0).toLocaleString()}
               </p>
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence>
              {player.team.map((drafted) => (
                <motion.div 
                  layout
                  key={drafted.character.id}
                  className="flex flex-col md:flex-row gap-6 bg-white/5 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-colors"
                >
                  <div className="flex gap-4 items-center md:w-1/3">
                    <img src={drafted.character.image} className="w-16 h-16 rounded-lg object-cover border border-white/20" alt="" />
                    <div>
                      <p className="font-bold text-lg">{drafted.character.name}</p>
                      <p className="text-xs text-cyan-400 font-mono">{drafted.character.universe}</p>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-2">
                      {ALL_ROLES.map(role => {
                        const isSelected = drafted.assignedRole === role;
                        // Is this role already taken by ANOTHER character on the same team?
                        const isTakenByOther = player.team.some(t => t.assignedRole === role && t.character.id !== drafted.character.id);
                        const isPreferred = drafted.character.preferredRoles.includes(role);
                        
                        const isMyRoster = localPlayerId === 'all' || player.id === localPlayerId;
                        return (
                          <button
                            key={role}
                            onClick={() => !isTakenByOther && isMyRoster && assignRole(player.id, drafted.character.id, role)}
                            disabled={isTakenByOther || !isMyRoster}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-xs font-mono transition-all",
                              isSelected 
                                ? "bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(217,70,239,0.5)] border border-fuchsia-400" 
                                : isTakenByOther
                                  ? "bg-black/80 text-gray-700 border border-white/5 cursor-not-allowed opacity-50"
                                  : isPreferred 
                                    ? "bg-fuchsia-900/40 text-fuchsia-200 border border-fuchsia-500/30 hover:bg-fuchsia-800/50"
                                    : "bg-black/50 text-gray-400 border border-white/10 hover:border-white/30"
                            )}
                          >
                            {role}
                            {isPreferred && !isTakenByOther && <span className="ml-1 opacity-70">★</span>}
                          </button>
                        );
                      })}
                    </div>
                    {drafted.assignedRole && (
                      <p className="text-xs font-mono mt-2 text-green-400">
                        Bonus: {getRoleMultiplier(drafted.character.roles, drafted.assignedRole)}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
