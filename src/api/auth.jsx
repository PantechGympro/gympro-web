//frontend\src\api\auth.jsx
import { peticion } from "./cliente";
import { cabecerasHuella } from "../utils/huella";

const API_URL = "/api/auth";

export async function login(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.msg || "Error al iniciar sesión");
  }

  return data;
}
export async function register(userData) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.msg || "Error al registrarse");
  }

  return data;
}

// ── Recuperación de contraseña (código de 6 dígitos por correo) ──────────────
export async function forgotPassword(email) {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || "Error al solicitar el código");
  return data;
}

export async function resetPassword(email, code, newPassword) {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password: newPassword }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || "Error al restablecer la contraseña");
  return data;
}

// Actividad 09, PR-01 (M. Arriaga Mora): antes leía el token directamente
// de localStorage, legible por cualquier script que corra en el origen.
// Ahora pasa por el cliente centralizado (web/src/api/cliente.js), que
// envía la cookie de sesión HttpOnly en vez de un token en memoria legible.
export async function completeOnboarding(payload) {
  return peticion("/api/onboarding/complete-setup", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// SCRUM-224: cambio de contraseña obligatorio en el primer login para
// cuentas creadas por un Propietario/Administrador (miembro, staff,
// administrador) -- mismo cliente que completeOnboarding (ver
// api/cliente.js), que ya envía la sesión vigente.
export async function cambiarPasswordInicial(nuevaPassword) {
  return peticion("/api/auth/cambiar-password-inicial", {
    method: "PUT",
    body: JSON.stringify({ nueva_password: nuevaPassword }),
  });
}

export async function getPlanesPublicos() {
  const response = await fetch("/api/onboarding/planes");
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || "Error al obtener los planes");
  return data.planes || [];
}

export async function registerGym(gymData, adminData, idPlan = null) {
  const body = { gym: gymData, admin: adminData };
  if (idPlan) body.id_plan = idPlan;

  // Huella del equipo: el servidor la usa para frenar altas en serie desde la
  // misma máquina (ver utils/huella.js y app/utils/antiabuso.py). Solo viaja
  // aquí, en el registro, y es un hash. Si el navegador no puede calcularla,
  // la petición sale igual: el servidor trata su ausencia como "no se sabe".
  const response = await fetch("/api/onboarding/register-gym", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await cabecerasHuella()) },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || "Error al registrar el gimnasio");
  return data;
}

// ── Aviso de privacidad (migración 036) ──────────────────────────────────────
// La LFPDPPP exige poder acreditar qué versión aceptó cada persona y cuándo.
// `peticion` adjunta la sesión y renueva el token si hiciera falta.
export function aceptarAvisoPrivacidad(version) {
  return peticion("/api/auth/aviso-privacidad", {
    method: "POST",
    body: JSON.stringify({ version }),
  });
}
