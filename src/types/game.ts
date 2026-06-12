export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export const ALL_ROLES: Role[] = [
  'Captain', 'Vice Captain', 'Tank', 'Healer', 'Assassin', 
  'Mage', 'Support', 'Berserker', 'Strategist', 'Speedster', 
  'Sniper', 'Leader', 'Guardian', 'Fighter',
  'Destroyer', 'Angel', 'Inventor', 'Scout', 'Conqueror', 
  'Monster', 'Carry', 'Bruiser', 'Warrior', 'Fusion'
];

export type Role = 
  | 'Captain' 
  | 'Vice Captain' 
  | 'Tank' 
  | 'Healer' 
  | 'Assassin' 
  | 'Mage' 
  | 'Support' 
  | 'Berserker' 
  | 'Strategist' 
  | 'Speedster' 
  | 'Sniper' 
  | 'Leader' 
  | 'Guardian'
  | 'Fighter'
  | 'Destroyer'
  | 'Angel'
  | 'Inventor'
  | 'Scout'
  | 'Conqueror'
  | 'Monster'
  | 'Carry'
  | 'Bruiser'
  | 'Warrior'
  | 'Fusion';

export interface Character {
  id: string;
  name: string;
  universe: string;
  image: string;
  powerLevel: number;
  basePrice: number;
  rarity: Rarity;
  roles: Role[];
  preferredRoles: Role[];
  passive?: string;
  tags?: string[];
}

export type PlayerType = 'Human' | 'CPU';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  budget: number;
  team: DraftedCharacter[];
  passesRemaining: number;
}

export interface DraftedCharacter {
  character: Character;
  assignedRole?: Role;
}

export type GameMode = 'Draft' | 'Auction';

export interface GameSettings {
  mode: GameMode;
  budget: number;
  playerCount: number;
  cpuCount: number;
  universeRestrictions: string[];
  maxPasses: number;
  roomCode?: string;
  teamSize: number;
}
