import { motion } from 'motion/react';
import { Character } from '../types/game';
import { cn } from './NeonButton';
import { Shield, Zap, Target, Star, Swords } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function CharacterCard({ character, selected, onClick, className, compact = false }: CharacterCardProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Mythic': return 'from-rose-500 to-fuchsia-600 border-rose-500 shadow-rose-500/50 text-rose-400';
      case 'Legendary': return 'from-amber-400 to-orange-600 border-amber-400 shadow-amber-400/50 text-amber-400';
      case 'Epic': return 'from-fuchsia-500 to-purple-700 border-fuchsia-500 shadow-fuchsia-500/50 text-fuchsia-400';
      case 'Rare': return 'from-cyan-400 to-blue-600 border-cyan-400 shadow-cyan-400/50 text-cyan-400';
      default: return 'from-gray-400 to-gray-600 border-gray-400 shadow-gray-400/30 text-gray-400';
    }
  };

  const rarityStyles = getRarityColor(character.rarity);

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative overflow-hidden rounded-lg cursor-pointer glass-card aspect-square",
          selected ? "border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" : "",
          className
        )}
      >
        <img src={character.image} alt={character.name} className="absolute inset-0 w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-xs font-bold truncate">{character.name}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-gray-300">{character.universe}</span>
            <span className={cn("text-[10px] font-mono", rarityStyles.split(' ').pop())}>
              {character.powerLevel.toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer w-full max-w-sm rounded-xl overflow-hidden glass-card",
        "border-[2px]",
        selected ? "border-white shadow-[0_0_30px_rgba(255,255,255,0.6)]" : "border-black/50 hover:border-white/30",
        className
      )}
    >
      {/* Background & Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img 
          src={character.image} 
          alt={character.name} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
        
        {/* Rarity Gradient Overlay */}
        <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br mix-blend-overlay", rarityStyles.split(' ').slice(0,2).join(' '))} />
        
        {/* Top Info */}
        <div className="absolute top-4 w-full px-4 flex justify-between items-start">
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border bg-black/40", 
            rarityStyles.split(' ').slice(2).join(' ') // Get border and text color
          )}>
            {character.rarity}
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg text-center flex flex-col items-center">
            <span className="text-[10px] text-gray-400 uppercase">Power</span>
            <span className="font-mono font-bold text-white tracking-widest">{character.powerLevel.toLocaleString()}</span>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 w-full p-5 space-y-3">
          <div>
            <h2 className="text-2xl font-display font-bold uppercase md:text-3xl tracking-tight leading-none text-white drop-shadow-md">
              {character.name}
            </h2>
            <p className="text-sm font-mono text-cyan-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
              {character.universe}
            </p>
          </div>

          {/* Stats Bar */}
          <div className="flex gap-4 border-t border-white/10 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>{character.roles[0]}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>${character.basePrice}</span>
            </div>
          </div>
        </div>

        {/* Hover Highlight */}
        <div className="absolute inset-0 border-[2px] border-white/0 group-hover:border-white/20 transition-colors duration-300 pointer-events-none rounded-xl" />
      </div>
    </motion.div>
  );
}
