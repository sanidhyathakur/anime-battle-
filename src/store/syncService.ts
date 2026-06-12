import { Character, GameSettings, Player, Role } from '../types/game';
import { characters } from '../data/characters';
import { useGameStore } from './gameStore';

export interface CompressedTeamItem {
  characterId: string;
  assignedRole?: Role;
  gruntCharacter?: Character;
}

export interface CompressedPlayer {
  id: string;
  name: string;
  type: 'Human' | 'CPU';
  budget: number;
  team: CompressedTeamItem[];
  passesRemaining: number;
}

export interface CompressedState {
  settings: GameSettings;
  players: CompressedPlayer[];
  currentPlayerIndex: number;
  availableCharacterIds: string[];
  draftPhase: 'Setup' | 'Drafting' | 'Auction' | 'TeamBuilding' | 'Battle' | 'Result';
  currentRound: number;
  draftDirection: 1 | -1;
  pulledCharacterId: string | null;
  auctionCurrentCharacterId: string | null;
  auctionCurrentBid: number;
  auctionHighestBidderId: string | null;
  senderId: string;
}

const compressTeam = (team: { character: Character; assignedRole?: Role }[]): CompressedTeamItem[] => {
  return team.map(item => {
    const isGrunt = item.character.id.startsWith('grunt-');
    return {
      characterId: item.character.id,
      assignedRole: item.assignedRole,
      gruntCharacter: isGrunt ? item.character : undefined
    };
  });
};

const decompressTeam = (team: CompressedTeamItem[]): { character: Character; assignedRole?: Role }[] => {
  return team.map(item => {
    let char: Character;
    if (item.characterId.startsWith('grunt-') && item.gruntCharacter) {
      char = item.gruntCharacter;
    } else {
      char = characters.find(c => c.id === item.characterId) || {
        id: item.characterId,
        name: "Nameless Grunt",
        universe: "Unknown",
        image: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=400&h=400&auto=format&fit=crop",
        powerLevel: 1000,
        basePrice: 0,
        rarity: "Common",
        roles: ["Support"],
        preferredRoles: []
      };
    }
    return {
      character: char,
      assignedRole: item.assignedRole
    };
  });
};

export const compressState = (state: any, senderId: string): CompressedState => {
  return {
    settings: state.settings,
    players: state.players.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      budget: p.budget,
      team: compressTeam(p.team),
      passesRemaining: p.passesRemaining
    })),
    currentPlayerIndex: state.currentPlayerIndex,
    availableCharacterIds: state.availableCharacters.map((c: any) => c.id),
    draftPhase: state.draftPhase,
    currentRound: state.currentRound,
    draftDirection: state.draftDirection,
    pulledCharacterId: state.pulledCharacter ? state.pulledCharacter.id : null,
    auctionCurrentCharacterId: state.auctionCurrentCharacter ? state.auctionCurrentCharacter.id : null,
    auctionCurrentBid: state.auctionCurrentBid,
    auctionHighestBidderId: state.auctionHighestBidderId,
    senderId
  };
};

export const decompressState = (compressed: CompressedState): any => {
  const players = compressed.players.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    budget: p.budget,
    team: decompressTeam(p.team),
    passesRemaining: p.passesRemaining
  }));

  const findChar = (id: string | null): Character | null => {
    if (!id) return null;
    if (id.startsWith('grunt-')) {
      for (const p of compressed.players) {
        const teamItem = p.team.find(t => t.characterId === id);
        if (teamItem && teamItem.gruntCharacter) return teamItem.gruntCharacter;
      }
    }
    return characters.find(c => c.id === id) || null;
  };

  const availableCharacters = compressed.availableCharacterIds.map(id => {
    return findChar(id) || {
      id,
      name: "Unknown Operative",
      universe: "Unknown",
      image: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=400&h=400&auto=format&fit=crop",
      powerLevel: 1000,
      basePrice: 0,
      rarity: "Common" as const,
      roles: ["Support" as const],
      preferredRoles: []
    };
  });

  return {
    settings: compressed.settings,
    players,
    currentPlayerIndex: compressed.currentPlayerIndex,
    availableCharacters,
    draftPhase: compressed.draftPhase,
    currentRound: compressed.currentRound,
    draftDirection: compressed.draftDirection,
    pulledCharacter: findChar(compressed.pulledCharacterId),
    auctionCurrentCharacter: findChar(compressed.auctionCurrentCharacterId),
    auctionCurrentBid: compressed.auctionCurrentBid,
    auctionHighestBidderId: compressed.auctionHighestBidderId
  };
};

export const getLocalPlayerId = () => {
  return sessionStorage.getItem('localPlayerId') || '1';
};

// Global subscription and event source tracking
let activeEventSource: EventSource | null = null;
let activeUnsubscribe: (() => void) | null = null;
let isSyncingFromNetwork = false;

export const updateStoreFromNetwork = (state: any) => {
  isSyncingFromNetwork = true;
  useGameStore.setState(state);
  isSyncingFromNetwork = false;
};

export const startRoomSync = (roomCode: string, onStartGame?: (state: any) => void) => {
  // Clean up any existing sync
  stopRoomSync();

  const localPlayerId = getLocalPlayerId();
  console.log(`Starting sync for room ${roomCode}. Local Player ID: ${localPlayerId}`);

  // 1. Subscribe to ntfy server-sent events for incoming actions
  const es = new EventSource(`https://ntfy.sh/adb-room-${roomCode}/sse?since=latest`);
  activeEventSource = es;

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event === 'message') {
        const payload = JSON.parse(data.message);
        
        // Ignore messages from ourselves
        if (payload.senderId === localPlayerId) {
          return;
        }

        console.log('Sync received from network:', payload.type);

        if (payload.type === 'START_GAME') {
          const state = decompressState(payload.state);
          updateStoreFromNetwork(state);
          if (onStartGame) {
            onStartGame(state);
          }
        } else if (payload.type === 'SYNC_STATE') {
          const state = decompressState(payload.state);
          updateStoreFromNetwork(state);
        }
      }
    } catch (e) {
      console.error('Error parsing sync message:', e);
    }
  };

  es.onerror = (err) => {
    console.error('ntfy EventSource connection error:', err);
  };

  // 2. Subscribe to local store changes and broadcast them
  activeUnsubscribe = useGameStore.subscribe((state) => {
    if (isSyncingFromNetwork) return;

    // Only broadcast if we have a room code and it is a multiplayer room
    const currentRoomCode = state.settings.roomCode;
    if (!currentRoomCode) return;

    const compressed = compressState(state, localPlayerId);

    fetch(`https://ntfy.sh/adb-room-${currentRoomCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({
        type: 'SYNC_STATE',
        senderId: localPlayerId,
        state: compressed
      })
    }).catch(err => {
      console.error('Error broadcasting state update:', err);
    });
  });
};

export const stopRoomSync = () => {
  if (activeEventSource) {
    activeEventSource.close();
    activeEventSource = null;
    console.log('Closed sync EventSource');
  }
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
    console.log('Unsubscribed from local store changes');
  }
};

export const broadcastStartGame = (roomCode: string, state: any) => {
  const localPlayerId = getLocalPlayerId();
  const compressed = compressState(state, localPlayerId);

  fetch(`https://ntfy.sh/adb-room-${roomCode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify({
      type: 'START_GAME',
      senderId: localPlayerId,
      state: compressed
    })
  }).catch(err => {
    console.error('Error broadcasting START_GAME:', err);
  });
};
