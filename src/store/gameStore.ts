import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character, GameSettings, Player, DraftedCharacter, Role, MatchupType } from '../types/game';
import { characters } from '../data/characters';

interface GameState {
  settings: GameSettings;
  players: Player[];
  currentPlayerIndex: number;
  availableCharacters: Character[];
  draftPhase: 'Setup' | 'Drafting' | 'Auction' | 'TeamBuilding' | 'Battle' | 'Result';
  currentRound: number;
  draftDirection: 1 | -1;
  
  // Random Draft State
  pulledCharacter: Character | null;
  
  // Auction State
  auctionCurrentCharacter: Character | null;
  auctionCurrentBid: number;
  auctionHighestBidderId: string | null;

  // Music State
  musicPlaying: boolean;
  setMusicPlaying: (playing: boolean) => void;

  // Actions
  setSettings: (settings: GameSettings) => void;
  initializeGame: (players: Omit<Player, 'team' | 'passesRemaining'>[], customSettings?: GameSettings) => void;
  setDraftPhase: (phase: GameState['draftPhase']) => void;
  resetGame: () => void;
  
  // Draft Actions
  pullRandomCharacter: () => void;
  passCharacter: (playerId: string) => void;
  assignRandomCharacter: (playerId: string, role: Role) => void;

  // Auction Actions
  startNextAuction: () => void;
  placeBid: (playerId: string, amount: number) => void;
  placeAbsoluteBid: (playerId: string, amount: number) => void;
  resolveAuction: () => void;
  sellCharacter: (playerId: string, characterId: string) => void;
  recruitGrunt: (playerId: string) => void;
  assignRole: (playerId: string, characterId: string, role: string) => void;
}

const initialSettings: GameSettings = {
  mode: 'Draft',
  budget: 150,
  playerCount: 2,
  cpuCount: 1,
  universeRestrictions: ['Dragon Ball Super', 'Dragon Ball Z'],
  maxPasses: 3,
  roomCode: undefined,
  teamSize: 5,
  matchupType: 'Equal',
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      settings: initialSettings,
      players: [],
      currentPlayerIndex: 0,
      availableCharacters: characters,
      draftPhase: 'Setup',
      currentRound: 1,
      draftDirection: 1,
      
      pulledCharacter: null,
      auctionCurrentCharacter: null,
      auctionCurrentBid: 0,
      auctionHighestBidderId: null,
      musicPlaying: false,
      setMusicPlaying: (playing) => set({ musicPlaying: playing }),

      setSettings: (settings) => set({ settings }),

      initializeGame: (newPlayers, customSettings) => {
        const activeSettings = customSettings || get().settings;
        
        let pool = [...characters];
        if (activeSettings.universeRestrictions.length > 0) {
          pool = pool.filter(c => activeSettings.universeRestrictions.includes(c.universe));
        }

        if (activeSettings.matchupType === 'Unequal') {
          pool = pool.map(c => {
            if (c.universe === 'Naruto') {
              return { ...c, powerLevel: Math.floor(c.powerLevel / 1.7) };
            }
            return c;
          });
        }

        set({
          settings: activeSettings,
          players: newPlayers.map(p => ({ 
            ...p, 
            team: [],
            budget: activeSettings.budget,
            passesRemaining: activeSettings.maxPasses
          })),
          availableCharacters: pool,
          draftPhase: activeSettings.mode === 'Draft' ? 'Drafting' : activeSettings.mode,
          currentPlayerIndex: 0,
          currentRound: 1,
          draftDirection: 1,
          pulledCharacter: null,
          auctionCurrentCharacter: null,
          auctionCurrentBid: 0,
          auctionHighestBidderId: null,
        });
      },

      setDraftPhase: (phase) => set({ draftPhase: phase }),

      resetGame: () => set({
        settings: initialSettings,
        players: [],
        currentPlayerIndex: 0,
        availableCharacters: characters.filter(c => c.universe.startsWith('Dragon Ball')),
        draftPhase: 'Setup',
        currentRound: 1,
        draftDirection: 1,
        pulledCharacter: null,
        auctionCurrentCharacter: null,
      }),

      // --- DRAFT (GACHA) ---
      pullRandomCharacter: () => {
        const state = get();
        if (state.availableCharacters.length === 0) return;
        const randomIndex = Math.floor(Math.random() * state.availableCharacters.length);
        set({ pulledCharacter: state.availableCharacters[randomIndex] });
      },

      passCharacter: (playerId) => {
        const state = get();
        set({
          pulledCharacter: null,
          players: state.players.map(p => p.id === playerId ? { ...p, passesRemaining: Math.max(0, p.passesRemaining - 1) } : p)
        });
      },

      assignRandomCharacter: (playerId, role) => {
        const state = get();
        const char = state.pulledCharacter;
        if (!char) return;

        const updatedPlayers = state.players.map(p => {
          if (p.id === playerId) {
            return { ...p, team: [...p.team, { character: char, assignedRole: role }] };
          }
          return p;
        });
        
        const updatedAvailable = state.availableCharacters.filter(c => c.id !== char.id);

        let nextIndex = state.currentPlayerIndex + 1;
        let nextRound = state.currentRound;
        if (nextIndex >= state.players.length) {
          nextIndex = 0;
          nextRound++;
        }

        const isGameOver = updatedPlayers.every(p => p.team.length >= state.settings.teamSize) || updatedAvailable.length === 0;

        set({
          players: updatedPlayers,
          availableCharacters: updatedAvailable,
          pulledCharacter: null,
          currentPlayerIndex: isGameOver ? 0 : nextIndex,
          currentRound: nextRound,
          draftPhase: isGameOver ? 'Battle' : 'Drafting'
        });
      },

      assignRole: (playerId, characterId, role) => {
        set((state) => ({
          players: state.players.map(p => {
            if (p.id === playerId) {
              return {
                ...p,
                team: p.team.map(dc => dc.character.id === characterId ? { ...dc, assignedRole: role as any } : dc)
              };
            }
            return p;
          })
        }));
      },

      // --- AUCTION MODE ---
      startNextAuction: () => {
        const state = get();
        if (state.availableCharacters.length === 0) return;
        const char = state.availableCharacters[Math.floor(Math.random() * state.availableCharacters.length)];
        set({
          auctionCurrentCharacter: char,
          auctionCurrentBid: 0,
          auctionHighestBidderId: null,
        });
      },

      placeBid: (playerId, amount) => {
        const state = get();
        const player = state.players.find(p => p.id === playerId);
        if (!player || player.budget < state.auctionCurrentBid + amount || player.team.length >= state.settings.teamSize) return;
        
        set({
          auctionCurrentBid: state.auctionCurrentBid + amount,
          auctionHighestBidderId: playerId
        });
      },

      placeAbsoluteBid: (playerId, amount) => {
        const state = get();
        const player = state.players.find(p => p.id === playerId);
        if (!player || player.budget < amount || amount <= state.auctionCurrentBid || player.team.length >= state.settings.teamSize) return;
        
        set({
          auctionCurrentBid: amount,
          auctionHighestBidderId: playerId
        });
      },

      resolveAuction: () => {
        const state = get();
        const char = state.auctionCurrentCharacter;
        const bidderId = state.auctionHighestBidderId;
        
        if (!char) return;

        let updatedPlayers = state.players;
        if (bidderId) {
          updatedPlayers = state.players.map(p => {
            if (p.id === bidderId) {
              return {
                ...p,
                budget: p.budget - state.auctionCurrentBid,
                team: [...p.team, { character: char }]
              };
            }
            return p;
          });
        }

        const updatedAvailable = state.availableCharacters.filter(c => c.id !== char.id);
        const isGameOver = updatedPlayers.every(p => p.team.length >= state.settings.teamSize) || updatedAvailable.length === 0;

        set({
          players: updatedPlayers,
          availableCharacters: updatedAvailable,
          auctionCurrentCharacter: null,
          auctionCurrentBid: 0,
          auctionHighestBidderId: null,
          draftPhase: isGameOver ? 'TeamBuilding' : 'Auction' // go to teambuilder after auction
        });
      },

      sellCharacter: (playerId, characterId) => {
         const state = get();
         const player = state.players.find(p => p.id === playerId);
         if (!player) return;
         
         const draftedChar = player.team.find(t => t.character.id === characterId);
         if (!draftedChar) return;
         
         const sellPrice = Math.floor(draftedChar.character.basePrice * 0.5);
         
         const updatedPlayers = state.players.map(p => {
           if (p.id === playerId) {
             return {
               ...p,
               budget: p.budget + sellPrice,
               team: p.team.filter(t => t.character.id !== characterId)
             };
           }
           return p;
         });
         
         set({
           players: updatedPlayers,
           availableCharacters: [...state.availableCharacters, draftedChar.character]
         });
      },

      recruitGrunt: (playerId) => {
         const state = get();
         const player = state.players.find(p => p.id === playerId);
         if (!player || player.team.length >= state.settings.teamSize) return;
         
         const grunt: Character = {
           id: `grunt-${Math.random().toString(36).substring(2, 9)}`,
           name: "Nameless Grunt",
           universe: "Unknown",
           image: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=400&h=400&auto=format&fit=crop",
           powerLevel: Math.floor(Math.random() * 3000) + 1000,
           basePrice: 0,
           rarity: "Common",
           roles: ["Support", "Guardian", "Berserker"],
           preferredRoles: [],
           passive: "Cannon Fodder: Has no special abilities.",
           tags: ["Grunt"]
         };
         
         const updatedPlayers = state.players.map(p => {
           if (p.id === playerId) {
             return {
               ...p,
               team: [...p.team, { character: grunt }]
             };
           }
           return p;
         });
         
         const isGameOver = updatedPlayers.every(p => p.team.length >= state.settings.teamSize) || state.availableCharacters.length === 0;
         
         set({
           players: updatedPlayers,
           draftPhase: isGameOver ? 'TeamBuilding' : state.draftPhase
         });
      }

    }),
    {
      name: 'anime-draft-storage',
    }
  )
);
