import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Debe ir ANTES de App: envuelve axios.create para renovar la sesión en cada 401.
import './utils/sesionAxios';
import { iniciarMantenimientoSesion } from './utils/sesion';
import App from './App';
// Mantiene la sesión viva (renueva antes de que caduque el access token).
iniciarMantenimientoSesion();
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
