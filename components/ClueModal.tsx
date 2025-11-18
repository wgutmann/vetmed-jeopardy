import React, { useState, useEffect } from 'react';
import { Clue, Player, BuzzerState } from '../types';

interface ClueModalProps {
  clue: Clue;
  players: Player[];
  onClose: () => void;
  onAwardPoints: (playerId: string | null, points: number) => void;
  // Networking props
  buzzerState: BuzzerState;
  onArmBuzzers: () => void;
  onResetBuzzers: () => void;
  isPreview?: boolean;
}

type ModalStep = 'DAILY_DOUBLE_WAGER' | 'CLUE' | 'ANSWER';

export const ClueModal: React.FC<ClueModalProps> = ({ 
  clue, 
  players, 
  onClose, 
  onAwardPoints,
  buzzerState,
  onArmBuzzers,
  onResetBuzzers,
  isPreview = false
}) => {
  const [step, setStep] = useState<ModalStep>(clue.isDailyDouble ? 'DAILY_DOUBLE_WAGER' : 'CLUE');
  const [wager, setWager] = useState<number>(0);
  const [wagerInput, setWagerInput] = useState<string>('');

  // Default point value is the clue value, unless overridden by a wager in Daily Double
  const currentPointValue = clue.isDailyDouble ? wager : clue.value;

  const buzzedPlayer = players.find(p => p.id === buzzerState.buzzedPlayerId);

  const handleWagerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(wagerInput, 10);
    if (!isNaN(val) && val >= 0) {
      setWager(val);
      setStep('CLUE');
    }
  };

  const handleAward = (playerId: string, delta: number) => {
    onAwardPoints(playerId, delta);
    // If incorrect answer, reset buzzers so others can try
    if (delta < 0 && !clue.isDailyDouble) {
      onResetBuzzers();
    } else {
      // If correct or passing, close modal
      onClose();
    }
  };

  const handlePass = () => {
    onAwardPoints(null, 0);
    onClose();
  };

  // --------------------------------------------------------------------------
  // RENDER: Daily Double Wager Screen
  // --------------------------------------------------------------------------
  if (step === 'DAILY_DOUBLE_WAGER') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <div className="w-full max-w-2xl bg-gradient-to-b from-blue-900 to-jeopardy-dark border-4 border-jeopardy-gold rounded-xl shadow-2xl overflow-hidden flex flex-col items-center p-8 text-center animate-in zoom-in duration-300">
          
          <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
            <h1 className="text-6xl md:text-8xl font-display font-bold text-jeopardy-gold drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-tighter -rotate-2">
              DAILY
            </h1>
            <h1 className="text-6xl md:text-8xl font-display font-bold text-jeopardy-gold drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-tighter rotate-2">
              DOUBLE
            </h1>
          </div>

          <p className="text-white/80 text-lg mb-6">Enter your wager</p>

          <form onSubmit={handleWagerSubmit} className="w-full max-w-sm flex flex-col gap-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-jeopardy-gold text-2xl font-bold">$</span>
              <input
                type="number"
                value={wagerInput}
                onChange={(e) => setWagerInput(e.target.value)}
                className="w-full bg-black/40 border-2 border-jeopardy-gold/50 rounded-lg py-4 pl-10 pr-4 text-3xl text-white font-bold text-center focus:outline-none focus:border-jeopardy-gold transition-colors"
                placeholder="0"
                autoFocus
                min="0"
              />
            </div>
            <button
              type="submit"
              disabled={!wagerInput}
              className="w-full py-4 bg-jeopardy-gold hover:bg-yellow-400 text-jeopardy-dark font-bold text-xl rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Place Wager
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: Clue & Answer Screen
  // --------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300">
      <div className={`
        w-full max-w-5xl bg-jeopardy-blue border-4 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]
        ${clue.isDailyDouble ? 'border-jeopardy-gold shadow-yellow-500/20' : 'border-white/20'}
      `}>
        
        {/* Header / Value */}
        <div className="bg-blue-900/50 p-4 text-center border-b border-white/10 shrink-0 flex justify-between items-center">
          <span className="w-8"></span>
          <div className="flex flex-col items-center">
             {clue.isDailyDouble && <span className="text-jeopardy-gold text-xs font-bold uppercase tracking-widest mb-1">Daily Double</span>}
             <span className="text-jeopardy-gold text-4xl font-bold font-display drop-shadow-md">
               {'$' + currentPointValue}
             </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
            title="Close without scoring"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 text-center relative overflow-hidden">
          
          {/* The Clue */}
          <div className="z-10 max-w-4xl flex flex-col items-center gap-6">
            {clue.imageUrl && (
              <img 
                src={clue.imageUrl} 
                alt="Clue Visual" 
                className="max-h-[35vh] w-auto rounded-lg shadow-2xl border-2 border-white/20 object-contain bg-black/20"
              />
            )}
            <div className="text-white text-3xl md:text-6xl font-bold uppercase leading-snug drop-shadow-lg tracking-wide font-display">
              {clue.question}
            </div>
          </div>

          {/* Buzzer Notification Overlay */}
          {!clue.isDailyDouble && buzzedPlayer && step === 'CLUE' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-200">
              <span className="text-white/80 uppercase tracking-widest mb-2">Buzzed In</span>
              <div className="text-jeopardy-gold text-6xl font-display font-bold animate-bounce">
                {buzzedPlayer.name}
              </div>
              <div className="mt-8 flex gap-4">
                 <button onClick={() => handleAward(buzzedPlayer.id, currentPointValue)} className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-green-500">Correct (+)</button>
                 <button onClick={() => handleAward(buzzedPlayer.id, -currentPointValue)} className="bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-red-500">Incorrect (-)</button>
              </div>
              <button onClick={onResetBuzzers} className="mt-4 text-white/50 hover:text-white underline">Ignore / Reset</button>
            </div>
          )}

          {/* The Answer (Revealed) */}
          {step === 'ANSWER' && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 z-10">
              <div className="text-jeopardy-gold text-xl uppercase font-bold mb-2">Correct Response</div>
              <div className="text-white text-2xl md:text-4xl font-medium bg-black/30 p-6 rounded-lg border border-white/10 inline-block">
                {clue.answer}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className="bg-black/20 p-6 border-t border-white/10 shrink-0">
          
          {/* Phase 1: Buzzer Controls (If not Daily Double) */}
          {!clue.isDailyDouble && step === 'CLUE' && !isPreview && (
            <div className="flex flex-col items-center gap-4">
              
              {buzzerState.status === 'LOCKED' ? (
                 <button 
                   onClick={onArmBuzzers}
                   className="w-full max-w-md py-4 bg-jeopardy-gold text-jeopardy-dark font-bold text-2xl rounded-lg uppercase tracking-widest shadow-lg hover:bg-yellow-300 active:scale-95 transition-all"
                 >
                   Open Buzzers
                 </button>
              ) : (
                <div className="text-white text-xl font-mono animate-pulse">
                  --- BUZZERS OPEN ---
                </div>
              )}

              <div className="h-px w-full bg-white/10 my-2"></div>
              
              <button
                onClick={() => setStep('ANSWER')}
                className="px-8 py-2 bg-blue-800 text-white font-bold rounded-full text-sm hover:bg-blue-700 uppercase tracking-wider"
              >
                Reveal Answer (No Correct Buzz)
              </button>
            </div>
          )}

          {/* Preview mode: simple reveal control */}
          {isPreview && step === 'CLUE' && (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setStep('ANSWER')}
                className="px-8 py-2 bg-blue-800 text-white font-bold rounded-full text-sm hover:bg-blue-700 uppercase tracking-wider"
              >
                Reveal Answer
              </button>
            </div>
          )}

          {/* Phase 2: Manual Scoring (Fallback or Daily Double) */}
          {(step === 'ANSWER' || clue.isDailyDouble) && (
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-white/70 uppercase tracking-widest text-sm font-semibold">Manual Adjustments</h3>
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {players.map(player => (
                  <div key={player.id} className="flex flex-col gap-2 bg-blue-900/40 p-2 rounded-lg border border-white/10">
                    <span className="text-white font-bold text-center text-xs truncate max-w-[100px]">{player.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleAward(player.id, currentPointValue)} className="flex-1 py-1 px-2 bg-green-600 text-white rounded text-xs">+</button>
                      <button onClick={() => handleAward(player.id, -currentPointValue)} className="flex-1 py-1 px-2 bg-red-600 text-white rounded text-xs">-</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handlePass} className="mt-2 text-white/50 text-sm hover:underline">Finish Clue</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};