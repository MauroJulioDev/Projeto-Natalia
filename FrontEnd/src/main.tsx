import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
// @ts-ignore
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {/* 2. Colocamos ele aqui. Agora ele vai aparecer em TODAS as páginas, sem exceção! */}
      <Toaster position="top-right" reverseOrder={false} />
    </BrowserRouter>
  </React.StrictMode>,
)