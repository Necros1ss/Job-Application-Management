import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './Components/ErrorBoundary.jsx'
import { initializeSession } from './lib/api.js'
import './index.css'

// Start restoring the in-memory access token as early as possible. Protected
// layouts await the same promise before deciding whether to redirect.
void initializeSession()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
