import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initializeSession } from './lib/api.js'
import './index.css'

const storedTheme = (() => {
  try {
    return window.localStorage.getItem('theme')
  } catch {
    return null
  }
})()
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
const initialTheme = storedTheme === 'dark' || storedTheme === 'light'
  ? storedTheme
  : prefersDark
    ? 'dark'
    : 'light'

document.documentElement.classList.toggle('dark', initialTheme === 'dark')
document.documentElement.dataset.theme = initialTheme

// Start restoring the in-memory access token as early as possible. Protected
// layouts await the same promise before deciding whether to redirect.
void initializeSession()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
