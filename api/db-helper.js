const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function loadLocalEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value;
  });
  return env;
}

const LOCAL_ENV = loadLocalEnv();

// Configuración de Firebase
const DB_URL = process.env.FIREBASE_DB_URL || LOCAL_ENV.FIREBASE_DB_URL || "https://web-guate-xiter-default-rtdb.firebaseio.com";
const JWT_SECRET = process.env.JWT_SECRET || LOCAL_ENV.JWT_SECRET || "guate_xiter_super_secure_secret_key_2026";

// Soporte para ambos métodos de autenticación:
// 1) Legacy: FIREBASE_DB_SECRET (database secret) - ya no se genera en proyectos nuevos
// 2) Service Account: FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
const DB_SECRET = process.env.FIREBASE_DB_SECRET || LOCAL_ENV.FIREBASE_DB_SECRET;
const SA_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || LOCAL_ENV.FIREBASE_PROJECT_ID;
const SA_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || LOCAL_ENV.FIREBASE_CLIENT_EMAIL;
const SA_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || LOCAL_ENV.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

let cachedAccessToken = null;
let cachedAccessTokenExp = 0;

async function getAccessTokenFromServiceAccount() {
  if (cachedAccessToken && Date.now() < cachedAccessTokenExp - 60000) {
    return cachedAccessToken;
  }
  if (!SA_PROJECT_ID || !SA_CLIENT_EMAIL || !SA_PRIVATE_KEY) {
    throw new Error("Firebase no está configurado: faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: SA_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const signingInput = `${base64url(header)}.${base64url(payload)}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(SA_PRIVATE_KEY, "base64url");
  const assertion = `${signingInput}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error obteniendo access token: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  cachedAccessToken = data.access_token;
  cachedAccessTokenExp = Date.now() + (data.expires_in * 1000);
  return cachedAccessToken;
}

async function getAuthParam() {
  if (DB_SECRET) return DB_SECRET;
  return await getAccessTokenFromServiceAccount();
}

async function getFirebaseUrl(path) {
  if (!DB_URL) {
    throw new Error("Firebase no está configurado: variable FIREBASE_DB_URL faltante.");
  }
  const auth = await getAuthParam();
  return `${DB_URL}/${path}.json?auth=${encodeURIComponent(auth)}`;
}

// Funciones CRUD para Firebase
async function dbGet(path) {
  const url = await getFirebaseUrl(path);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Firebase GET error: ${response.statusText}`);
  }
  return await response.json();
}

async function dbSet(path, data) {
  const url = await getFirebaseUrl(path);
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Firebase PUT error: ${response.statusText}`);
  }
  return await response.json();
}

async function dbUpdate(path, data) {
  const url = await getFirebaseUrl(path);
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Firebase PATCH error: ${response.statusText}`);
  }
  return await response.json();
}

async function dbDelete(path) {
  const url = await getFirebaseUrl(path);
  const response = await fetch(url, {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error(`Firebase DELETE error: ${response.statusText}`);
  }
  return await response.json();
}

// Implementación de JWT nativo (sin dependencias)
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payloadStr}`)
    .digest("base64url");
  return `${header}.${payloadStr}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payloadStr, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payloadStr}`)
      .digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now()) return null; // Expirado
    return payload;
  } catch (e) {
    return null;
  }
}

// Helper para sanitizar claves de Firebase (evitar caracteres prohibidos)
function sanitizeKey(key) {
  if (!key) return "";
  return key.toLowerCase().replace(/[.@#$\/\[\]]/g, "_");
}

module.exports = {
  dbGet,
  dbSet,
  dbUpdate,
  dbDelete,
  generateToken,
  verifyToken,
  sanitizeKey
};
