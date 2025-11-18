import React from 'react';
import { BuzzerStatus, GameBoardData, Clue } from '../types';
import { GameBoard } from './GameBoard';

interface PlayerControllerProps {
  name: string;
  score: number;
  status: BuzzerStatus;
  onBuzz: () => void;
  boardData: GameBoardData | null;
  activeClue: Clue | null;
}

export const PlayerController: React.FC<PlayerControllerProps> = ({ 
  name, 
  score, 
  status, 
  onBuzz,
  boardData,
  activeClue
}) => {
  
  let buttonColor = "bg-gray-600";
  let buttonText = "WAIT";
  let disabled = true;

  if (status === 'ARMED') {
    buttonColor = "bg-green-600 hover:bg-green-500 active:bg-green-400";
    buttonText = "BUZZ!";
    disabled = false;
  } else if (status === 'BUZZED') {
    buttonColor = "bg-jeopardy-gold text-jeopardy-dark";
    buttonText = "LOCKED IN";
  } else {
    // LOCKED
    buttonColor = "bg-red-900/50";
    buttonText = "LOCKED";
  }

  return (
    <div className="min-h-screen bg-jeopardy-dark flex flex-col">
      {/* Header */}
      <div className="bg-blue-900 p-4 flex justify-between items-center border-b border-white/10 shrink-0 z-10 shadow-md">
        <span className="text-white font-bold text-lg truncate max-w-[150px]">{name}</span>
        <span className="text-jeopardy-gold font-display font-bold text-2xl">${score}</span>
      </div>

      {/* Main Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        
        {/* View 1: Active Clue & Buzzer (Overlay or conditional) */}
        {activeClue ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-jeopardy-blue z-20 animate-in slide-in-from-bottom-4 duration-300">
             <div className="mb-8 text-center space-y-4 max-w-lg flex flex-col items-center">
               <span className="text-jeopardy-gold font-display font-bold text-4xl">${activeClue.value}</span>
               
               {activeClue.imageUrl && (
                  <img 
                    src={activeClue.imageUrl} 
                    alt="Clue Visual" 
                    className="max-h-32 w-auto rounded shadow-md border border-white/20 mb-2"
                  />
               )}
               
               <p className="text-white font-medium text-xl md:text-2xl leading-relaxed uppercase font-display tracking-wide">
                 {activeClue.question}
               </p>
             </div>

             <button
                onClick={onBuzz}
                disabled={disabled}
                className={`
                  w-48 h-48 md:w-64 md:h-64 rounded-full shadow-2xl border-8 border-white/10
                  flex items-center justify-center text-3xl md:text-5xl font-bold tracking-widest
                  transition-all duration-100 active:scale-95
                  ${buttonColor} text-white
                `}
              >
                {buttonText}
              </button>
              
              <div className="mt-8 text-white/50 text-sm uppercase tracking-widest animate-pulse">
                {status === 'ARMED' ? "Quick! Tap now!" : "Waiting for Host..."}
              </div>
          </div>
        ) : (
          /* View 2: Game Board (Read Only) */
          <div className="flex-grow overflow-y-auto bg-jeopardy-dark">
             {boardData ? (
               <div className="pointer-events-none opacity-100 origin-top scale-90 md:scale-100">
                 <GameBoard categories={boardData.categories} onClueClick={() => {}} readOnly={true} />
               </div>
             ) : (
               <div className="flex h-full items-center justify-center text-white/30">
                 Waiting for game to start...
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};