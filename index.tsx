import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Aggressively suppress benign ResizeObserver loop errors
const resizeErrorPatterns = [
  'ResizeObserver loop completed with undelivered notifications',
  'ResizeObserver loop limit exceeded'
];

// 1. Trap window.onerror
const originalOnError = window.onerror;
window.onerror = function (msg, url, lineNo, columnNo, error) {
  if (typeof msg === 'string' && resizeErrorPatterns.some(pattern => msg.includes(pattern))) {
    return true; // Stop propagation
  }
  if (originalOnError) return originalOnError(msg, url, lineNo, columnNo, error);
  return false;
};

// 2. Trap window 'error' event
window.addEventListener('error', (e) => {
  if (resizeErrorPatterns.some(pattern => e.message.includes(pattern))) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// 3. Trap console.error just in case
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && 
    resizeErrorPatterns.some(pattern => args[0].includes(pattern))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);