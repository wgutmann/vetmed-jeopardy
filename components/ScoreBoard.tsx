import React from 'react';
import { Player } from '../types';

interface ScoreBoardProps {
  players: Player[];
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ players }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 p-2 md:p-4 backdrop-blur-md z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
        
        <div className="flex items-center space-x-4 mb-2 md:mb-0">
           <div className="h-10 w-10 bg-jeopardy-blue rounded-full flex items-center justify-center border border-white/20 shrink-0">
             <span className="text-xl">🩺</span>
           </div>
           <span className="text-white/70 font-medium hidden md:inline">VetMed Jeopardy</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 overflow-x-auto">
          {players.map((player) => (
            <div key={player.id} className="flex flex-col items-center min-w-[80px]">
              <span className="text-jeopardy-gold font-display font-bold text-2xl md:text-3xl drop-shadow-md">
                {'$' + player.score}
              </span>
              <span className="text-white/80 text-sm font-medium uppercase tracking-wide truncate max-w-[120px]">
                {player.name}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
