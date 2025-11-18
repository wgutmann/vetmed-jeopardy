import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameStatus, GameBoardData, Clue, Player, Category, BuzzerState, NetworkMessage, NetworkMessageType } from './types';
import { generateGameContent } from './services/geminiService';
import { GameBoard } from './components/GameBoard';
import { ClueModal } from './components/ClueModal';
import { LoadingScreen } from './components/LoadingScreen';
import { ScoreBoard } from './components/ScoreBoard';
import { PlayerController } from './components/PlayerController';
import { PRE_ID, generateRoomCode } from './services/network';
import Peer from 'peerjs';

const App: React.FC = () => {
  // Navigation State
  const [mode, setMode] = useState<'LANDING' | 'HOST' | 'PLAYER'>('LANDING');
  
  // Host State
  const [roomCode, setRoomCode] = useState('');
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [boardData, setBoardData] = useState<GameBoardData | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeClue, setActiveClue] = useState<Clue | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Tracks an in-progress generation request so the UI can keep the loading
  // screen visible until the server responds and the board is applied.
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameSource, setGameSource] = useState<'AI' | 'CSV'>('AI');
  const [csvContent, setCsvContent] = useState('');

  // Player Client State
  const [clientName, setClientName] = useState('');
  const [clientRoomInput, setClientRoomInput] = useState('');
  const [clientScore, setClientScore] = useState(0);
  const [clientBoardData, setClientBoardData] = useState<GameBoardData | null>(null);
  const [clientActiveClue, setClientActiveClue] = useState<Clue | null>(null);
  const [joinError, setJoinError] = useState('');

  // Buzzer Logic
  const [buzzerState, setBuzzerState] = useState<BuzzerState>({ status: 'LOCKED', buzzedPlayerId: null });

  // Networking Refs
  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<Map<string, any>>(new Map());
  const lastPongRef = useRef<Map<string, number>>(new Map());
  const heartbeatTimerRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // HOST LOGIC
  // ---------------------------------------------------------------------------

  const initializeHost = () => {
    setMode('HOST');
    const code = generateRoomCode();
    setRoomCode(code);

    // @ts-ignore
    const peer = new Peer(`${PRE_ID}${code}`);
    peerRef.current = peer;

    peer.on('open', (id: string) => {
      console.log('Host Peer ID:', id);
      // Start heartbeat to all clients every 5s
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = setInterval(() => {
        broadcast({ type: 'PING', payload: { t: Date.now() } });
        // Mark any clients stale if no PONG in last 15s
        const now = Date.now();
        setPlayers(prev => prev.map(p => {
          const last = lastPongRef.current.get(p.id) || 0;
          const isConnected = now - last < 15000 && !!connectionsRef.current.get(p.id)?.open;
          return { ...p, isConnected };
        }));
      }, 5000);
    });

    peer.on('connection', (conn: any) => {
      conn.on('open', () => {
        // Wait for JOIN message
        conn.on('data', (data: NetworkMessage) => {
          handleHostMessage(conn, data);
        });
        conn.on('close', () => {
          setPlayers(prev => prev.map(p => (p.id === conn.peer ? { ...p, isConnected: false } : p)));
          connectionsRef.current.delete(conn.peer);
        });
        conn.on('error', () => {
          setPlayers(prev => prev.map(p => (p.id === conn.peer ? { ...p, isConnected: false } : p)));
        });
      });
    });

    peer.on('error', (err: any) => {
      console.error('Peer Error', err);
      setError("Connection error. Try refreshing.");
    });
  };

  // Helper to strip answers for client view to prevent easy cheating
  const sanitizeBoard = (data: GameBoardData): GameBoardData => ({
    categories: data.categories.map(c => ({
      ...c,
      clues: c.clues.map(clue => ({ ...clue, answer: 'HIDDEN ON CLIENT' }))
    }))
  });

  const handleHostMessage = (conn: any, msg: NetworkMessage) => {
    switch (msg.type) {
      case 'JOIN':
        const newPlayer: Player = {
          id: conn.peer, // Use Peer ID as unique player ID
          name: msg.payload.name.substring(0, 12), // Limit name length
          score: 0,
          isConnected: true
        };
        
        setPlayers(prev => {
           const exists = prev.find(p => p.id === newPlayer.id);
           if (exists) return prev;
           return [...prev, newPlayer];
        });
        connectionsRef.current.set(conn.peer, conn);
        lastPongRef.current.set(conn.peer, Date.now());
        
        // Send Welcome / Current State
        conn.send({ type: 'WELCOME', payload: { score: 0 } });
        
        // Sync Board State if game in progress
        if (boardData) {
           conn.send({ type: 'BOARD_UPDATE', payload: sanitizeBoard(boardData) });
        }
        if (activeClue) {
           // Send current clue details (excluding answer logic handled in component if needed, but payload usually raw)
           // We only send question/value/image for display
           conn.send({ type: 'CLUE_SELECTED', payload: { ...activeClue, answer: 'HIDDEN' } });
           conn.send({ type: 'BUZZER_STATUS', payload: buzzerState });
        }
        break;
      case 'RESYNC':
        conn.send({ type: 'BOARD_UPDATE', payload: boardData ? sanitizeBoard(boardData) : null });
        if (activeClue) conn.send({ type: 'CLUE_SELECTED', payload: { ...activeClue, answer: 'HIDDEN' } });
        conn.send({ type: 'BUZZER_STATUS', payload: buzzerState });
        break;
      case 'PONG':
        lastPongRef.current.set(conn.peer, Date.now());
        // mark connected
        setPlayers(prev => prev.map(p => (p.id === conn.peer ? { ...p, isConnected: true } : p)));
        break;

      case 'BUZZ':
        setBuzzerState(current => {
          if (current.status === 'ARMED') {
            // Winner!
            const winnerId = conn.peer;
            broadcast({ type: 'BUZZER_STATUS', payload: { status: 'BUZZED', buzzedPlayerId: winnerId } });
            return { status: 'BUZZED', buzzedPlayerId: winnerId };
          }
          return current;
        });
        break;
    }
  };

  const broadcast = (msg: NetworkMessage) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  };

  // Sync specific player score
  const syncScoreToPlayer = (playerId: string, newScore: number) => {
    const conn = connectionsRef.current.get(playerId);
    if (conn && conn.open) {
      conn.send({ type: 'UPDATE_PLAYERS', payload: { score: newScore } });
    }
  };

  const startHostGame = useCallback(async () => {
    // Start game — if boardData already present use it, otherwise generate
    setError(null);
    try {
      setIsGenerating(true);
      let finalBoard = boardData;
      if (!finalBoard) {
        // Need to generate board now
        setStatus(GameStatus.LOADING);
        let categories: Category[] = [];
        if (gameSource === 'CSV') {
          if (!csvContent.trim()) throw new Error("Please paste CSV content.");
          const parsed = parseCSV(csvContent);
          if (parsed.length === 0) throw new Error("Invalid CSV.");
          const isComplete = parsed.length === 6 && parsed.every(c => c.clues.length === 5);
          if (isComplete) {
            categories = parsed;
          } else {
              const rawData = await generateGameContent(parsed, { forceReal: !!import.meta.env.VITE_FORCE_REAL_GEN });
            categories = rawData.categories;
          }
        } else {
          const rawData = await generateGameContent([], { forceReal: !!import.meta.env.VITE_FORCE_REAL_GEN });
          categories = rawData.categories;
        }
        finalBoard = processBoardData(categories);
        setBoardData(finalBoard);
      }

      setStatus(GameStatus.PLAYING);
      // Broadcast initial board to all connected players
      broadcast({ type: 'BOARD_UPDATE', payload: sanitizeBoard(finalBoard) });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize.");
      setStatus(GameStatus.IDLE);
    } finally {
      setIsGenerating(false);
    }
  }, [gameSource, csvContent]);

  // Generate a board for preview without changing game `status` or broadcasting.
  const previewBoard = useCallback(async () => {
    setError(null);
    try {
      setIsGenerating(true);
      let finalBoard = boardData;
      if (!finalBoard) {
        setStatus(GameStatus.LOADING);
        let categories: Category[] = [];
        if (gameSource === 'CSV') {
          if (!csvContent.trim()) throw new Error("Please paste CSV content.");
          const parsed = parseCSV(csvContent);
          if (parsed.length === 0) throw new Error("Invalid CSV.");
          const isComplete = parsed.length === 6 && parsed.every(c => c.clues.length === 5);
          if (isComplete) {
            categories = parsed;
          } else {
            const rawData = await generateGameContent(parsed);
            categories = rawData.categories;
          }
        } else {
          const rawData = await generateGameContent();
          categories = rawData.categories;
        }
        finalBoard = processBoardData(categories);
        setBoardData(finalBoard);
      }
      // Only mark previewing once boardData is applied
      setIsPreviewing(true);
      setStatus(GameStatus.IDLE);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate preview.");
      setStatus(GameStatus.IDLE);
    } finally {
      setIsGenerating(false);
    }
  }, [gameSource, csvContent, boardData]);


  // ---------------------------------------------------------------------------
  // PLAYER CLIENT LOGIC
  // ---------------------------------------------------------------------------

  const joinGame = () => {
    if (!clientName || !clientRoomInput) {
      setJoinError("Name and Room Code required.");
      return;
    }
    setJoinError('');
    // Stable client ID across reloads to allow host-side continuity
    let stableId = localStorage.getItem('vmj-client-id');
    if (!stableId) {
      stableId = `player-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('vmj-client-id', stableId);
    }
    const peerConfig: any = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
        ],
      },
    };
    // @ts-ignore
    const peer = new Peer(stableId, peerConfig);
    peerRef.current = peer;

    peer.on('open', () => {
      const hostId = `${PRE_ID}${clientRoomInput.toUpperCase()}`;
      const connectToHost = () => {
        const conn = peer.connect(hostId);
        connectionsRef.current.set('HOST', conn);

        conn.on('open', () => {
          setMode('PLAYER');
          reconnectAttemptsRef.current = 0;
          conn.send({ type: 'JOIN', payload: { name: clientName } });
          // Request resync to ensure state
          conn.send({ type: 'RESYNC', payload: {} });
          
          conn.on('data', (data: NetworkMessage) => {
            handleClientMessage(data);
          });
        });

        conn.on('close', () => {
          scheduleReconnect();
        });

        conn.on('error', () => {
          scheduleReconnect();
        });
      };

      const scheduleReconnect = () => {
        const attempts = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempts;
        const delay = Math.min(30000, 1000 * Math.pow(2, attempts));
        setTimeout(() => {
          if (peerRef.current?.disconnected) {
            try { peerRef.current.reconnect(); } catch {}
          }
          connectToHost();
        }, delay);
      };

      connectToHost();
    });

    peer.on('error', () => {
      setJoinError("Connection failed.");
    });
  };

  const handleClientMessage = (msg: NetworkMessage) => {
    switch (msg.type) {
      case 'WELCOME':
      case 'UPDATE_PLAYERS':
        if (msg.payload.score !== undefined) setClientScore(msg.payload.score);
        break;
      case 'PING':
        // Reply to host heartbeat
        connectionsRef.current.get('HOST')?.send({ type: 'PONG', payload: { t: msg.payload?.t } });
        break;
      case 'BOARD_UPDATE':
        setClientBoardData(msg.payload);
        break;
      case 'CLUE_SELECTED':
        setClientActiveClue(msg.payload);
        break;
      case 'CLUE_CLOSED':
        setClientActiveClue(null);
        break;
      case 'BUZZER_STATUS':
        setBuzzerState({ 
          status: msg.payload.status, 
          buzzedPlayerId: msg.payload.buzzedPlayerId 
        });
        break;
    }
  };

  const sendBuzz = () => {
    const conn = connectionsRef.current.get('HOST');
    if (conn) {
      conn.send({ type: 'BUZZ', payload: {} });
    }
  };


  // ---------------------------------------------------------------------------
  // SHARED / UTILS
  // ---------------------------------------------------------------------------

  const processBoardData = (categories: Category[]): GameBoardData => {
    let processedCategories = categories.map((cat, catIndex) => ({
      ...cat,
      id: `cat-${catIndex}`,
      clues: cat.clues.map((clue, clueIndex) => ({
        ...clue,
        id: `clue-${catIndex}-${clueIndex}`,
        isAnswered: false,
        isDailyDouble: false
      })).sort((a, b) => a.value - b.value)
    }));

    const allClues: { catIdx: number; clueIdx: number }[] = [];
    processedCategories.forEach((cat, catIdx) => {
      cat.clues.forEach((_, clueIdx) => {
        allClues.push({ catIdx, clueIdx });
      });
    });

    if (allClues.length > 0) {
      const randomIndices = allClues[Math.floor(Math.random() * allClues.length)];
      processedCategories[randomIndices.catIdx].clues[randomIndices.clueIdx].isDailyDouble = true;
    }

    return { categories: processedCategories };
  };

  const parseCSV = (text: string): Category[] => {
    const lines = text.split('\n');
    const categoriesMap: Record<string, Partial<Clue>[]> = {};
    
    lines.forEach(line => {
      if (!line.trim()) return;
      // Regex handles CSV with quotes. Capture up to 5 groups.
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      const parts = matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : line.split(',').map(s => s.trim());
      
      // Format: Category, Value, Question, Answer, [ImageURL]
      if (parts.length >= 4) {
        const category = parts[0];
        const value = parseInt(parts[1], 10);
        const question = parts[2];
        const answer = parts[3];
        const imageUrl = parts.length > 4 ? parts[4] : undefined;

        if (!categoriesMap[category]) categoriesMap[category] = [];
        if (!isNaN(value)) {
          categoriesMap[category].push({ 
            value, 
            question, 
            answer,
            imageUrl: imageUrl && imageUrl.startsWith('http') ? imageUrl : undefined
          });
        }
      }
    });

    return Object.keys(categoriesMap).map(title => ({
      id: '', 
      title, 
      clues: (categoriesMap[title] as Clue[])
    }));
  };

  // ---------------------------------------------------------------------------
  // GAMEPLAY ACTIONS (HOST)
  // ---------------------------------------------------------------------------

  const handleClueClick = (clue: Clue) => {
    // Regular host flow when game is playing
    setActiveClue(clue);
    broadcast({ type: 'CLUE_SELECTED', payload: { ...clue, answer: 'HIDDEN' } });

    // Reset buzzers for new clue
    const newBuzzerState: BuzzerState = { status: 'LOCKED', buzzedPlayerId: null };
    setBuzzerState(newBuzzerState);
    broadcast({ type: 'BUZZER_STATUS', payload: newBuzzerState });
  };

  // Preview click — used when reviewing board before starting the game. No broadcasts or buzzer changes.
  const handlePreviewClueClick = (clue: Clue) => {
    setActiveClue(clue);
  };

  const handleArmBuzzers = () => {
    const newState: BuzzerState = { status: 'ARMED', buzzedPlayerId: null };
    setBuzzerState(newState);
    broadcast({ type: 'BUZZER_STATUS', payload: newState });
  };

  const handleResetBuzzers = () => {
    // Re-arm buzzers (e.g. after incorrect answer)
    handleArmBuzzers();
  };

  const handleCloseClueModal = () => {
    setActiveClue(null);
    setBuzzerState({status: 'LOCKED', buzzedPlayerId: null});
    broadcast({ type: 'CLUE_CLOSED', payload: {} });
    broadcast({ type: 'BUZZER_STATUS', payload: { status: 'LOCKED', buzzedPlayerId: null } });
  };

  const handleAwardPoints = (playerId: string | null, points: number) => {
    if (!boardData) return;

    // Update local Host State
    if (playerId) {
      let newScore = 0;
      setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
          newScore = p.score + points;
          return { ...p, score: newScore };
        }
        return p;
      }));
      // Sync to client
      syncScoreToPlayer(playerId, newScore);
    }

    // Logic: If points awarded (Correct), close clue. If negative (Incorrect), clue stays open unless forced closed (handled by ClueModal logic).
    if (points >= 0 || activeClue?.isDailyDouble) {
      const newCategories = boardData.categories.map(cat => ({
        ...cat,
        clues: cat.clues.map(c => {
          if (c.id === activeClue?.id) {
            return { ...c, isAnswered: true, winnerId: playerId || undefined };
          }
          return c;
        })
      }));
      const newBoard = { categories: newCategories };
      setBoardData(newBoard);
      
      // Sync board to clients (marking clue as answered)
      broadcast({ type: 'BOARD_UPDATE', payload: sanitizeBoard(newBoard) });
      
      handleCloseClueModal();
    }
  };


  // ---------------------------------------------------------------------------
  // VIEWS
  // ---------------------------------------------------------------------------

  if (mode === 'PLAYER') {
    return (
      <PlayerController 
        name={clientName}
        score={clientScore}
        status={buzzerState.status}
        onBuzz={sendBuzz}
        boardData={clientBoardData}
        activeClue={clientActiveClue}
      />
    );
  }

  if (mode === 'LANDING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black flex flex-col items-center justify-center p-6 text-white">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-jeopardy-gold mb-12 text-center drop-shadow-lg">
          VET MED JEOPARDY
        </h1>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Host Card */}
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 flex flex-col items-center hover:bg-white/15 transition-colors">
            <div className="text-5xl mb-4">📺</div>
            <h2 className="text-2xl font-bold mb-4">HOST A GAME</h2>
            <p className="text-white/60 text-center mb-8">
              Create a game board on this screen. Players can join using their phones.
            </p>
            <button 
              onClick={initializeHost}
              className="px-8 py-3 bg-jeopardy-blue hover:bg-blue-600 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105 w-full"
            >
              START AS HOST
            </button>
          </div>

          {/* Join Card */}
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 flex flex-col items-center hover:bg-white/15 transition-colors">
            <div className="text-5xl mb-4">📱</div>
            <h2 className="text-2xl font-bold mb-4">JOIN GAME</h2>
            <p className="text-white/60 text-center mb-4">
              Enter the Room Code displayed on the Host screen.
            </p>
            
            <div className="w-full space-y-4">
              <input
                type="text"
                placeholder="YOUR NAME"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-black/30 border border-white/30 rounded-lg px-4 py-3 text-center font-bold focus:border-jeopardy-gold outline-none"
              />
              <input
                type="text"
                placeholder="ROOM CODE (e.g. ABCD)"
                value={clientRoomInput}
                onChange={(e) => setClientRoomInput(e.target.value)}
                maxLength={4}
                className="w-full bg-black/30 border border-white/30 rounded-lg px-4 py-3 text-center font-bold uppercase tracking-widest focus:border-jeopardy-gold outline-none"
              />
              {joinError && <p className="text-red-400 text-sm text-center">{joinError}</p>}
              
              <button 
                onClick={joinGame}
                disabled={!clientName || clientRoomInput.length < 4}
                className="px-8 py-3 bg-jeopardy-gold text-blue-900 hover:bg-yellow-400 font-bold rounded-full shadow-lg transition-transform hover:scale-105 w-full disabled:opacity-50 disabled:scale-100"
              >
                JOIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- HOST MODE RENDER ---

  if (status === GameStatus.IDLE) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-black flex flex-col items-center justify-center p-4 text-center overflow-y-auto">
        <div className="max-w-4xl w-full space-y-8 animate-in fade-in zoom-in duration-700 py-10">
          <div className="space-y-2">
             <p className="text-white/50 text-sm font-bold tracking-widest uppercase">ROOM CODE</p>
             <div className="text-6xl font-mono font-bold text-jeopardy-gold bg-white/10 inline-block px-8 py-4 rounded-xl border-2 border-jeopardy-gold/50 tracking-[0.5em]">
               {roomCode}
             </div>
             <p className="text-white/30 text-xs">Join at this URL on your phone</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            {/* LEFT COL: Players */}
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-xl">
              <h3 className="text-xl text-white font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                <span>👥</span> Players ({players.length})
              </h3>
              
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                {players.length === 0 && (
                  <p className="text-white/30 italic text-center py-8">Waiting for players to join...</p>
                )}
                {players.map(player => (
                  <div key={player.id} className="flex justify-between items-center bg-white/10 px-3 py-3 rounded animate-in fade-in slide-in-from-left-4">
                    <span className="text-white font-bold text-lg">{player.name}</span>
                    <span className="text-green-400 text-xs">CONNECTED</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COL: Game Settings */}
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-xl flex flex-col">
              <h3 className="text-xl text-white font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                <span>⚙️</span> Game Data
              </h3>
              
              <div className="flex bg-black/40 p-1 rounded-lg mb-4">
                <button 
                  onClick={() => setGameSource('AI')}
                  className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${gameSource === 'AI' ? 'bg-jeopardy-blue text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                >
                  AI Generator
                </button>
                <button 
                  onClick={() => setGameSource('CSV')}
                  className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${gameSource === 'CSV' ? 'bg-jeopardy-blue text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                >
                  CSV Upload
                </button>
              </div>

              {gameSource === 'AI' ? (
                <div className="flex-1 flex items-center justify-center text-center p-4 border-2 border-dashed border-white/10 rounded-lg">
                  <p className="text-white/60 text-sm">
                    The AI will automatically generate 6 categories.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                   <textarea
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder={`Category, Value, Question, Answer, [ImageURL]\n\nTip: If you provide fewer than 6 categories, AI will fill in the rest!`}
                    className="flex-1 w-full bg-black/40 border border-white/20 rounded p-3 text-xs font-mono text-white/80 focus:outline-none focus:border-jeopardy-gold resize-none min-h-[150px]"
                   />
                </div>
              )}
              <div className="mt-4">
                <button
                  onClick={previewBoard}
                  disabled={isGenerating}
                  className={`px-4 py-2 rounded-md text-sm text-white/80 ${isGenerating ? 'bg-white/6 cursor-wait' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  {isGenerating ? 'Generating…' : 'Preview Board'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg max-w-2xl mx-auto">
              {error}
            </div>
          )}

          <button 
            onClick={startHostGame}
            disabled={players.length === 0 || isGenerating}
            className="group relative inline-flex items-center justify-center px-16 py-5 overflow-hidden font-bold text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 focus:outline-none disabled:opacity-50 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-100 group-hover:opacity-90"></span>
            <span className="relative text-2xl tracking-widest font-display">START GAME</span>
          </button>
        </div>
      </div>
    );
  }

  // Keep showing the loading screen while a generation request is in progress.
  if (isGenerating) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-slate-900 flex flex-col relative pb-32">
      {/* Header */}
      <header className="bg-blue-950/50 border-b border-white/5 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-jeopardy-gold text-jeopardy-dark font-bold px-3 py-1 rounded text-sm">
              CODE: {roomCode}
            </div>
            <h1 className="text-white font-display font-bold text-xl tracking-wide hidden md:block">VET MED JEOPARDY</h1>
          </div>
          <button 
            onClick={() => setStatus(GameStatus.IDLE)}
            className="text-xs text-blue-300 hover:text-white uppercase tracking-widest border border-blue-300/30 px-3 py-1 rounded hover:bg-blue-800 transition-colors"
          >
            End Game
          </button>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-grow flex items-center">
        {/* If previewing, show the board in read-only preview mode */}
        {isPreviewing && boardData && (
          <div className="w-full">
            <div className="max-w-7xl mx-auto text-white/70 px-4 md:px-8 mb-2">Preview Mode — clicking clues will NOT broadcast to players</div>
            <GameBoard 
              categories={boardData.categories} 
              onClueClick={(clue) => handlePreviewClueClick(clue)}
              readOnly={false}
            />
          </div>
        )}

        {/* Live game board when playing */}
        {!isPreviewing && boardData && (
          <GameBoard 
            categories={boardData.categories} 
            onClueClick={handleClueClick} 
          />
        )}
      </main>

      {/* Score Footer */}
      <ScoreBoard players={players} />

      {/* Modal Overlay */}
      {activeClue && (
        <ClueModal 
          clue={activeClue}
          players={players}
          onClose={handleCloseClueModal}
          onAwardPoints={handleAwardPoints}
          buzzerState={buzzerState}
          onArmBuzzers={handleArmBuzzers}
          onResetBuzzers={handleResetBuzzers}
          isPreview={isPreviewing}
        />
      )}
    </div>
  );
};

export default App;