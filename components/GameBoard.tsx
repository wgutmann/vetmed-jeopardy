import React from 'react';
import { Category, Clue } from '../types';

interface GameBoardProps {
  categories: Category[];
  onClueClick: (clue: Clue) => void;
  readOnly?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ categories, onClueClick, readOnly = false }) => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      {/* Grid Container - Scrollable on mobile */}
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="min-w-[900px] grid grid-cols-6 gap-2 md:gap-4">
          
          {/* Category Headers */}
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className="bg-jeopardy-blue aspect-[4/3] flex items-center justify-center p-2 text-center border-2 border-black/30 shadow-lg rounded-sm"
            >
              <h2 className="text-white font-bold text-sm md:text-lg uppercase tracking-wide drop-shadow-md font-display">
                {cat.title}
              </h2>
            </div>
          ))}

          {/* Clues Grid - Transposing rows/cols mentally by mapping row-first */}
          {[0, 1, 2, 3, 4].map((rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              {categories.map((cat) => {
                const clue = cat.clues[rowIndex];
                return (
                  <button
                    key={clue.id}
                    onClick={() => !readOnly && !clue.isAnswered && onClueClick(clue)}
                    disabled={readOnly || clue.isAnswered}
                    className={`
                      aspect-[4/3] flex items-center justify-center 
                      border-2 border-black/30 rounded-sm shadow-md transition-all duration-200
                      ${clue.isAnswered 
                        ? 'bg-jeopardy-blue/40 cursor-default' 
                        : readOnly 
                          ? 'bg-jeopardy-blue cursor-default'
                          : 'bg-jeopardy-blue hover:bg-blue-800 hover:brightness-110 hover:scale-[1.02] cursor-pointer'
                      }
                    `}
                  >
                    {!clue.isAnswered && (
                      <span className="text-jeopardy-gold font-display font-bold text-2xl md:text-4xl drop-shadow-sm">
                        {'$' + clue.value}
                      </span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};