import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { LangProvider } from './context/LangContext.jsx'
import './index.css'
import { installerFallbackImages } from './lib/images.js'

// Si le CDN photos ne répond pas, on repasse automatiquement par Supabase
installerFallbackImages()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </LangProvider>
  </React.StrictMode>,
)
