import React from 'react';

export const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 bg-jeopardy-dark flex flex-col items-center justify-center z-50 text-white">
    <div className="relative w-32 h-32 mb-8">
      <div className="absolute inset-0 border-t-4 border-jeopardy-gold rounded-full animate-spin"></div>
      <div className="absolute inset-4 border-r-4 border-jeopardy-blue rounded-full animate-spin animation-delay-200"></div>
      <div className="absolute inset-8 border-b-4 border-white rounded-full animate-spin animation-delay-500"></div>
    </div>
    <h2 className="text-3xl font-bold font-display tracking-wider mb-4 animate-pulse text-jeopardy-gold">
      GENERATING BOARD
    </h2>
    <p className="text-blue-200 max-w-md text-center px-4">
      Consulting the AI Veterinary Board Specialists to prepare your exam...
    </p>
  </div>
);
