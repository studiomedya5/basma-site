import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { LangProvider } from './context/LangContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </LangProvider>
  </React.StrictMode>,
)
