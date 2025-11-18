import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Since we know the #root element exists in our index.html, we can use a non-null assertion.
const container = document.getElementById('root')!; 
const root = createRoot(container);

// Define process.env if it doesn't exist, to prevent runtime errors
if (typeof process === 'undefined') {
  // @ts-ignore
  globalThis.process = { env: {} };
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
