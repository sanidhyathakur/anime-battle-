import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useGameStore } from '../store/gameStore';
import { NeonButton } from '../components/NeonButton';
import { Player } from '../types/game';
import { cn } from '../components/NeonButton';
import { startRoomSync, stopRoomSync } from '../store/syncService';

export function BattleResult() {
  const navigate = useNavigate();
  const { players, resetGame } = useGameStore();

  const [calculating, setCalculating] = useState(true);
  const [results, setResults] = useState<{player: Player, finalPower: number, basePower: number}[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadCard = (playerId: string, playerName: string) => {
    const node = document.getElementById(`result-card-${playerId}`);
    if (!node) return;

    setDownloadingId(playerId);

    import('html-to-image')
      .then(({ toJpeg }) => {
        return toJpeg(node, {
          quality: 0.95,
          style: {
            background: '#050508',
            borderRadius: '16px',
            transform: 'scale(1)',
          },
        });
      })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${playerName.replace(/\s+/g, '_')}_team_card.jpg`;
        link.href = dataUrl;
        link.click();
        setDownloadingId(null);
      })
      .catch((error) => {
        console.error('Error generating card image:', error);
        alert('Failed to generate image. Please try again.');
        setDownloadingId(null);
      });
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

  useEffect(() => {
    // Simulate calculation time for dramatic effect
    const timer = setTimeout(() => {
      const calculated = players.map(p => {
        let finalPower = 0;
        let basePower = 0;
        p.team.forEach(t => {
          basePower += t.character.powerLevel;
          let multiplier = 1.0;
          if (t.assignedRole === t.character.roles[0]) multiplier += 0.35;
          else if (t.character.preferredRoles.includes(t.assignedRole!)) multiplier += 0.20;
          
          finalPower += Math.floor(t.character.powerLevel * multiplier);
        });
        return { player: p, finalPower, basePower };
      }).sort((a, b) => b.finalPower - a.finalPower);
      
      setResults(calculated);
      setCalculating(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [players]);

  const handleReturn = () => {
    resetGame();
    navigate('/');
  };

  if (calculating) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-0" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-t-4 border-b-4 border-cyan-400 opacity-50 relative z-10 blur-[2px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute z-10 text-xl font-display font-black tracking-[0.5em] text-white neon-text-blue"
        >
          CALCULATING
        </motion.div>
      </div>
    );
  }

  const winner = results[0];

  return (
    <div className="min-h-screen bg-[#050508] p-6 flex flex-col relative">
       <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ae00ff, #050508 60%)' }} />

      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center items-center relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl text-gray-400 font-mono tracking-widest uppercase mb-4">Victory Declared</h2>
          <h1 className="text-6xl md:text-8xl font-display font-black text-white neon-text-pink uppercase italic">
            {winner.player.name} WINS
          </h1>
          <p className="mt-6 text-2xl font-mono text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
            Final Power Level: {winner.finalPower.toLocaleString()}
          </p>
        </motion.div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {results.map((res, idx) => (
            <motion.div 
              key={res.player.id}
              id={`result-card-${res.player.id}`}
              initial={{ opacity: 0, x: idx === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + (idx * 0.2) }}
              className={cn(
                "glass-panel p-8 rounded-2xl relative overflow-hidden",
                idx === 0 ? "border-pink-500/50 shadow-[0_0_30px_rgba(255,0,85,0.2)]" : "border-white/10 opacity-70"
              )}
            >
              {idx === 0 ? (
                 <div className="absolute top-0 right-0 bg-pink-600 text-white font-bold text-[10px] px-3 py-1 rounded-bl-lg uppercase tracking-wider">Winner (MVP)</div>
              ) : (
                 <div className="absolute top-0 right-0 bg-white/10 text-gray-400 font-bold text-[10px] px-3 py-1 rounded-bl-lg uppercase tracking-wider border-l border-b border-white/10">Runner Up</div>
              )}
              
              <h3 className="text-2xl font-display font-bold uppercase mb-2">{res.player.name}</h3>
              
              <div className="space-y-2 font-mono text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Base Power:</span>
                  <span>{res.basePower.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Role Synergy Bonus:</span>
                  <span>+{(res.finalPower - res.basePower).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl text-white font-bold border-t border-white/20 pt-2 mt-2">
                  <span>Total:</span>
                  <span>{res.finalPower.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                <div className="flex -space-x-4">
                  {res.player.team.map(t => (
                    <img 
                      key={t.character.id}
                      src={t.character.image}
                      alt={t.character.name}
                      className="w-12 h-12 rounded-full border-2 border-black object-cover"
                      title={t.character.name}
                    />
                  ))}
                </div>
                <button
                  onClick={() => handleDownloadCard(res.player.id, res.player.name)}
                  disabled={downloadingId !== null}
                  className={cn(
                    "px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all active:scale-95 disabled:opacity-50",
                    idx === 0 
                      ? "bg-pink-500/20 border-pink-500/40 text-pink-400 hover:bg-pink-500/30" 
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  )}
                >
                  {downloadingId === res.player.id ? 'Generating...' : 'Download JPG'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <NeonButton size="xl" onClick={handleReturn}>
            RETURN TO LOBBY
          </NeonButton>
        </motion.div>

      </main>
    </div>
  );
}
