import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { characters } from '../data/characters';
import { Users, Zap, Crown, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function Landing() {
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const setMusicPlaying = useGameStore(s => s.setMusicPlaying);
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('adb_session_started');
  });

  const handleStartGame = () => {
    sessionStorage.setItem('adb_session_started', 'true');
    setShowSplash(false);
    setMusicPlaying(true);
  };

  const featuredChar = characters[0];
  const totalCharacters = characters.length;

  return (
    <div className="w-full min-h-screen bg-[#050508] text-slate-100 font-sans flex flex-col p-4 md:p-6 overflow-x-hidden border-x-[4px] border-b-[4px] border-t-0 border-[#12121a]">
      <div className="scanline" />
      
      <nav className="flex justify-between items-center mb-6 border-b border-cyan-500/20 pb-4 max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <span className="font-black text-xl italic text-white">A</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">Protocol v4.0</span>
            <span className="text-lg font-black tracking-tighter uppercase text-white">Anime Draft Battle</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[10px] font-mono tracking-widest text-slate-400">
          <div><span className="text-cyan-500">●</span> LATENCY: 12MS</div>
          <div><span className="text-violet-500">●</span> SERVER: TOKYO_01</div>
          <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded uppercase text-cyan-400">Local Session</div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 md:auto-rows-[minmax(120px,auto)] gap-4 relative z-10">
        
        {/* HERO */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="md:col-span-12 lg:col-span-5 lg:row-span-4 bg-gradient-to-b from-slate-900/50 to-slate-950/80 border border-slate-800 rounded-2xl p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden min-h-[350px]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] -z-10"></div>
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-black leading-[0.85] uppercase tracking-tighter mix-blend-screen">
              <span className="text-white">Assemble</span><br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Legends</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-[280px] leading-relaxed border-l-2 border-cyan-500 pl-4 uppercase font-medium">
              High-intensity anime drafting. Strategy, synergy, and raw power. No backend. No limits.
            </p>
          </div>
          <div className="space-y-3 mt-6 lg:mt-auto">
            <button 
              onClick={() => navigate('/lobby?mode=host')}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-xl font-black text-white uppercase tracking-widest text-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)]"
            >
              Host Online Room
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/lobby?mode=hotseat')}
                className="flex-1 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors"
               >
                Local Hotseat
              </button>
              <button 
                onClick={() => setShowJoinModal(true)}
                className="flex-1 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors"
               >
                Join Room
              </button>
              <button 
                onClick={() => navigate('/lobby?mode=cpu')}
                className="flex-1 py-3 bg-slate-800/50 border border-slate-700 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors"
               >
                Play vs CPU
              </button>
            </div>
          </div>
        </motion.div>

        {/* FEATURED CHARACTER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-12 lg:col-span-4 lg:row-span-4 bg-slate-900/40 border border-cyan-500/30 rounded-2xl relative overflow-hidden flex flex-col group min-h-[350px]"
        >
          <div className="p-4 border-b border-slate-800 flex justify-between items-center z-20 bg-slate-950/60 backdrop-blur-sm">
            <span className="text-[10px] uppercase tracking-widest font-bold text-cyan-400">Featured Card</span>
            <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/30">{featuredChar.rarity}</span>
          </div>
          <div className="flex-1 relative flex items-end p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
              style={{ backgroundImage: `url(${featuredChar.image})`, filter: 'grayscale(30%)' }}
            ></div>
            <div className="relative z-20 w-full mb-2">
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <span className="text-3xl font-black uppercase italic tracking-tighter drop-shadow-md text-white">{featuredChar.name}</span>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 drop-shadow-md">{featuredChar.universe}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-slate-400">PWR</span>
                  <div className="text-3xl font-black text-white leading-none drop-shadow-md">{featuredChar.powerLevel.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {featuredChar.roles.slice(0, 3).map(role => (
                   <span key={role} className="text-[9px] px-2 py-1 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded uppercase font-bold tracking-tighter text-white">
                      {role}
                   </span>
                ))}
              </div>
            </div>
          </div>
          <div className="h-1 bg-slate-800 z-20">
            <div className="h-full w-2/3 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
          </div>
        </motion.div>

        {/* CORE FEATURES (Mapped to remaining boxes) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:col-span-12 lg:col-span-3 lg:row-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em]">Game Modes</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
              <div className="w-8 h-8 rounded-full bg-cyan-900/40 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0"><Users className="w-4 h-4" /></div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white uppercase">Cross-Universe</span>
                <span className="text-[9px] text-slate-500">Mix logic & synergies</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
              <div className="w-8 h-8 rounded-full bg-violet-900/40 border border-violet-500/50 flex items-center justify-center text-violet-400 shrink-0"><Zap className="w-4 h-4" /></div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white uppercase">Strategy Draft</span>
                <span className="text-[9px] text-slate-500">Live snake format</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TOTAL POOL BOX */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="md:col-span-12 lg:col-span-6 lg:row-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <div className="w-full sm:w-1/3 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-slate-800 pb-4 sm:pb-0 sm:pr-6 text-center sm:text-left">
            <span className="text-[10px] uppercase font-black text-cyan-500 mb-1 tracking-widest">Total Pool</span>
            <span className="text-5xl font-black text-white">{totalCharacters}</span>
            <span className="text-[9px] text-slate-500 uppercase font-bold mt-1">Elite Characters</span>
          </div>
          <div className="w-full sm:flex-1 grid grid-cols-3 gap-2">
            <div className="h-20 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col items-center justify-center p-2 text-center transition-colors hover:border-slate-600">
              <span className="text-lg font-black text-white">4</span>
              <span className="text-[8px] uppercase font-bold text-slate-500 mt-1">Universes</span>
            </div>
            <div className="h-20 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col items-center justify-center p-2 text-center transition-colors hover:border-slate-600">
              <span className="text-lg font-black text-fuchsia-400">12+</span>
              <span className="text-[8px] uppercase font-bold text-slate-500 mt-1">Roles</span>
            </div>
            <div className="h-20 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col items-center justify-center p-2 text-center transition-colors hover:border-slate-600">
              <span className="text-lg font-black text-cyan-400">Synergy</span>
              <span className="text-[8px] uppercase font-bold text-slate-500 mt-1">Mechanics</span>
            </div>
          </div>
        </motion.div>

        {/* ROLE SYNERGY / BATTLE PASS BOX */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-12 lg:col-span-3 lg:row-span-2 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-violet-900/20 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=400&auto=format&fit=crop')] bg-cover opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-700 bg-center"></div>
          <div className="relative z-10">
            <Crown className="w-6 h-6 text-white mb-2 opacity-80" />
            <div className="text-2xl font-black italic tracking-tighter uppercase leading-none text-white drop-shadow-md">Role<br/>Synergy</div>
            <p className="text-[10px] text-white/80 uppercase font-bold mt-2">Assign Captains and Healers for multipliers.</p>
          </div>
          <button 
             onClick={() => navigate('/lobby?mode=local')}
             className="relative z-10 mt-6 md:mt-2 w-full py-2 bg-white text-violet-700 rounded-lg font-black text-[10px] uppercase hover:bg-slate-100 transition-colors"
          >
             Learn Mechanics
          </button>
        </motion.div>

      </main>

      <footer className="mt-8 flex justify-between items-center text-[9px] uppercase tracking-widest font-bold text-slate-600 max-w-7xl mx-auto w-full relative z-10 px-4 pb-4">
        <div className="flex gap-4 md:gap-6">
          <span>© 2024 ADB.SYSTEM</span>
          <span className="hidden sm:inline">Privacy Policy</span>
          <span className="hidden sm:inline">Terms of Engagement</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span> 
          SYSTEM ONLINE: NOMINAL
        </div>
      </footer>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-slate-900 border border-cyan-500/30 p-8 rounded-2xl max-w-md w-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500" />
            <h2 className="text-2xl font-bold font-display uppercase tracking-widest mb-2 neon-text-blue">Join Protocol</h2>
            <p className="text-sm font-mono text-gray-400 mb-6">Enter the 4-digit room code to establish connection.</p>
            
            <input 
              type="text" 
              maxLength={4}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. X7Y9"
              className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-4 text-center text-3xl font-bold font-mono text-white tracking-[0.5em] focus:border-cyan-400 focus:outline-none mb-6 uppercase"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs uppercase text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (joinCode.length === 4) {
                    navigate(`/lobby?mode=join&code=${joinCode}`);
                  }
                }}
                disabled={joinCode.length !== 4}
                className="flex-1 py-3 bg-cyan-600/80 border border-cyan-500 rounded-xl font-bold text-xs uppercase text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Splash Screen Autoplay Bypass Overlay */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 bg-[#040407] z-50 flex flex-col items-center justify-center p-4 relative overflow-hidden"
          >
            {/* Scanlines and cyber glow bg */}
            <div className="scanline" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
            
            {/* Tech grid border accents */}
            <div className="absolute inset-10 border border-white/5 pointer-events-none" />
            <div className="absolute inset-12 border border-dashed border-white/5 pointer-events-none" />
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center z-10 max-w-lg space-y-8 px-6"
            >
              {/* Logo / Title */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-full text-[10px] font-mono tracking-widest text-fuchsia-400 uppercase">
                  Challenger Approaching
                </div>
                <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic text-white leading-none">
                  ARE YOU READY<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">TO BATTLE?</span>
                </h1>
                <p className="text-sm md:text-base font-bold text-gray-300 uppercase tracking-widest animate-pulse">
                  SHOW THEM WHAT YOU GOT
                </p>
              </div>

              {/* Enter Button */}
              <motion.button
                onClick={handleStartGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full max-w-xs py-4 bg-gradient-to-r from-cyan-500 via-violet-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white rounded-2xl font-black text-base uppercase tracking-[0.25em] shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 relative group cursor-pointer"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                START
              </motion.button>

              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                Audio connection ready to establish
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
