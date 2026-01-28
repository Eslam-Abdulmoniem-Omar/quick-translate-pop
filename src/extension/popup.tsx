// Extension popup entry point
// Renders the Settings component in the extension popup

import React from 'react';
import ReactDOM from 'react-dom/client';
import Settings from '@/pages/Settings';
import '@/index.css';

function PopupApp() {
  return (
    <div className="w-[320px] min-h-[200px] bg-background">
      <Settings />
    </div>
  );
}

const rootElement = document.getElementById('settings-root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <PopupApp />
    </React.StrictMode>
  );
}
