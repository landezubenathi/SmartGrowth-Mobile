import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root=ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App/></React.StrictMode>);

// Cache the static build for offline web use. Native Capacitor apps already bundle these files.
if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('@capacitor/core').then(({Capacitor}) => {
      if (!Capacitor.isNativePlatform()) {
        navigator.serviceWorker.register(`${process.env.PUBLIC_URL || ''}/service-worker.js`)
          .catch(() => { /* Offline PWA is optional; the app remains usable online. */ });
      }
    }).catch(() => {});
  });
}
