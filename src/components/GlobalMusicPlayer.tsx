import { useState } from 'react';
import { useLocation } from 'react-router';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Volume2, VolumeX, Disc, ChevronUp, ChevronDown } from 'lucide-react';

export function GlobalMusicPlayer() {
  const { musicPlaying, setMusicPlaying } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();

  const toggleMute = () => {
    setMusicPlaying(!musicPlaying);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // Determine current track based on route
  let trackUrl = 'https://soundcloud.com/imperss/slidein';
  let trackTitle = 'SLIDEIN';
  let trackArtist = 'IMPERSS';

  if (currentPath === '/draft') {
    trackUrl = 'https://soundcloud.com/vgl9/capturing-the-moment';
    trackTitle = 'CAPTURING THE MOMENT';
    trackArtist = 'VGL9';
  } else if (currentPath === '/auction') {
    trackUrl = 'https://soundcloud.com/tubebackr/balearic-love';
    trackTitle = 'BALEARIC LOVE';
    trackArtist = 'TUBEBACKR';
  }

  const encodedUrl = encodeURIComponent(trackUrl);

  return (
    <>
      {/* Hidden iframe for autoplay background music */}
      {musicPlaying && (
        <iframe
          key={trackUrl} // Use key to force reload the iframe when track URL changes
          id="sc-bg-iframe"
          width="0"
          height="0"
          src={`https://w.soundcloud.com/player/?url=${encodedUrl}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&color=00f0ff`}
          scrolling="no"
          frameborder="no"
          allow="autoplay"
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
      )}

      {/* Floating Audio Controller */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none">
        
        {/* Slide-out Player Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-80 glass-panel bg-[#050508]/90 border border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col gap-3 backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="font-display font-bold text-xs uppercase tracking-widest text-white">ADB Audio Node</span>
                </div>
                <span className="text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded-full uppercase">
                  {musicPlaying ? 'Streaming' : 'Muted'}
                </span>
              </div>

              {/* Native Widget Preview / Controls */}
              <div className="w-full bg-black/60 rounded-xl overflow-hidden border border-white/5 h-[120px] relative">
                {musicPlaying ? (
                  <iframe
                    key={trackUrl} // Force reload widget when track changes
                    width="100%"
                    height="120"
                    scrolling="no"
                    frameborder="no"
                    allow="autoplay"
                    src={`https://w.soundcloud.com/player/?url=${encodedUrl}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&color=00f0ff`}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <VolumeX className="w-8 h-8 text-gray-600 mb-2" />
                    <p className="font-mono text-xs text-gray-500 uppercase tracking-wider">Audio system offline</p>
                    <button
                      onClick={toggleMute}
                      className="mt-2 text-[10px] font-mono font-bold uppercase text-cyan-400 hover:underline"
                    >
                      Initialize System Audio
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                <span className="truncate pr-2">TRACK: {trackTitle}</span>
                <span className="shrink-0">ARTIST: {trackArtist}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Toggle Panel Button */}
          <button
            onClick={toggleOpen}
            className="p-3.5 rounded-full bg-slate-950/80 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 cursor-pointer flex items-center justify-center"
            title={isOpen ? "Close Player" : "Open Player"}
          >
            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>

          {/* Quick Mute/Unmute Button */}
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-full border transition-all duration-300 cursor-pointer flex items-center justify-center relative ${
              musicPlaying
                ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-950/80 border-white/10 text-gray-500 hover:text-white hover:border-white/30'
            }`}
            title={musicPlaying ? "Mute Background Music" : "Unmute Background Music"}
          >
            {musicPlaying ? (
              <>
                <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-slate-950 rounded-full animate-ping" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-slate-950 rounded-full" />
              </>
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>

      </div>
    </>
  );
}
