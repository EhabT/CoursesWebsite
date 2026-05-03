import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig';

export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL instance before rendering
msalInstance.initialize()
  .then(() => msalInstance.handleRedirectPromise())
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </React.StrictMode>
    );
  });
