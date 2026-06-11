// ==========================================
// 🚀 NAVEGACIÓN Y CAMBIO DE SECCIONES (TABS)
// ==========================================
function show(id, clickedTabId) {
  // Cerrar menú móvil si está abierto
  const navList = document.getElementById("nav-list");
  if (navList) navList.classList.remove("open");
  const burgerBtn = document.getElementById("burger-btn");
  if (burgerBtn) burgerBtn.innerText = "☰";

  // Ocultar todas las secciones
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
  });

  if (id === 'buy') {
    renderBuySection();
  }
  if (id === 'rank') {
    renderRankSection();
  }
  if (id === 'recom') {
    renderRecommendations();
  }

  // Mostrar sección activa
  const targetSec = document.getElementById(id);
  if (targetSec) {
    targetSec.classList.add("active");
  }

  // Actualizar estado activo en la barra de navegación
  document.querySelectorAll("nav ul li").forEach(tab => {
    tab.classList.remove("active");
  });

  let tabId = clickedTabId || ("tab-" + id);
  if (id === 'auth') tabId = 'nav-auth-tab';
  if (id === 'profile') tabId = 'nav-profile-tab';
  if (id === 'recharge') tabId = 'nav-recharge-tab';

  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.classList.add("active");
  }
  
  // Agregar log a la consola si está logueado
  if (isLoggedIn()) {
    addConsoleLog(`Navegó a la sección: ${id.toUpperCase()}`, 'info');
  }
}

// Manejo global de errores para evitar que la página quede bloqueada
window.addEventListener("error", (event) => {
  console.error("[Global Error]", event.message, event.filename + ":" + event.lineno, event.error);
});
window.addEventListener("unhandledrejection", (event) => {
  console.error("[Unhandled Promise Rejection]", event.reason);
});

// Sonido de clic
function clickSound() {
  new Audio("https://www.myinstants.com/media/sounds/click.mp3").play().catch(() => {});
}

// 📱 Menú móvil responsive
window.toggleMobileMenu = function() {
  clickSound();
  const navList = document.getElementById("nav-list");
  const burgerBtn = document.getElementById("burger-btn");
  if (navList) {
    navList.classList.toggle("open");
    if (navList.classList.contains("open")) {
      if (burgerBtn) burgerBtn.innerHTML = "&#x2715;"; // Ícono '✕'
    } else {
      if (burgerBtn) burgerBtn.innerHTML = "&#x2630;"; // Ícono '☰'
    }
  }
};

// ==========================================
// 🎵 REPRODUCTOR DE MÚSICA PREMIUM 3D (DUAL AUDIO / YOUTUBE)
// ==========================================
const music = document.getElementById("bgmusic");
const musicWidget = document.getElementById("music-widget");
const musicCd = document.getElementById("music-cd");
const musicPlayBtn = document.getElementById("music-play-btn");
const musicVolume = document.getElementById("music-volume");

// Variables globales para la sincronización del reproductor dual
let isMusicPlayingGlobal = false;
let currentVolume = 0.5;
let currentMusicType = 'audio'; // 'audio' o 'youtube'
let ytPlayer = null;
let ytPlayerReady = false;
let userHasInteracted = false;

// Configurar volumen inicial
if (music) {
  music.volume = currentVolume;
}

// Cargar la API de YouTube dinámicamente
function loadYoutubeAPI() {
  if (window.YT) return;
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    document.head.appendChild(tag);
  }
}

// Extraer ID de video de YouTube desde cualquier enlace estándar (mejorado)
function getYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  // Soporta youtu.be, youtube.com/watch?v=, /embed/, /v/, /shorts/, music.youtube.com, con o sin parámetros extra (&si=, &t=)
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/,
    /music\.youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

// Validar si una URL parece un archivo de audio directo
function isDirectAudioUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp3|ogg|wav|m4a|aac|opus|flac)(\?.*)?$/i.test(url) || /^https?:\/\/.+/i.test(url);
}

// Inicializar / Actualizar el reproductor de YouTube
function initYoutubePlayer(videoId) {
  if (!window.YT || !window.YT.Player) {
    loadYoutubeAPI();
    setTimeout(() => initYoutubePlayer(videoId), 300);
    return;
  }

  if (ytPlayer && ytPlayerReady) {
    try {
      if (isMusicPlayingGlobal || userHasInteracted) {
        ytPlayer.loadVideoById(videoId);
        ytPlayer.setVolume(currentVolume * 100);
      } else {
        ytPlayer.cueVideoById(videoId);
      }
    } catch (err) {
      console.warn("Error loading YouTube video, recreating player:", err);
      recreateYtPlayer(videoId);
    }
  } else {
    recreateYtPlayer(videoId);
  }
}

function recreateYtPlayer(videoId) {
  ytPlayerReady = false;
  
  const container = document.getElementById("yt-player");
  if (container) {
    container.innerHTML = "";
    const inner = document.createElement("div");
    inner.id = "yt-player-inner";
    container.appendChild(inner);
  }
  
  try {
    ytPlayer = new YT.Player('yt-player-inner', {
      height: '200',
      width: '200',
      videoId: videoId,
      playerVars: {
        'autoplay': 1,
        'loop': 1,
        'playlist': videoId, // Necesario para loop en API
        'controls': 0,
        'playsinline': 1,
        'modestbranding': 1,
        'rel': 0,
        'iv_load_policy': 3,
        'origin': window.location.origin
      },
      events: {
        'onReady': (e) => {
          ytPlayerReady = true;
          try {
            e.target.setVolume(currentVolume * 100);
            e.target.unMute();
            if (isMusicPlayingGlobal) {
              e.target.playVideo();
            }
          } catch(err) {
            console.warn("YT onReady error:", err);
          }
        },
        'onStateChange': (e) => {
          if (e.data === YT.PlayerState.ENDED) {
            try { e.target.playVideo(); } catch(err){}
          }
          if (e.data === YT.PlayerState.PLAYING) {
            isMusicPlayingGlobal = true;
            syncMusicUI();
          }
          if (e.data === YT.PlayerState.PAUSED) {
            isMusicPlayingGlobal = false;
            syncMusicUI();
          }
        },
        'onError': (e) => {
          console.error("YouTube Player Error:", e.data);
          const errors = {
            2: "ID de video inválido",
            5: "Error de reproductor HTML5",
            100: "Video no encontrado o privado",
            101: "Reproducción embebida no permitida por el propietario",
            150: "Reproducción embebida no permitida por el propietario"
          };
          if (typeof showToast === "function") {
            showToast(`❌ Error YouTube: ${errors[e.data] || 'Desconocido (' + e.data + ')'}`, "error");
          }
        }
      }
    });
  } catch(err) {
    console.error("Error creando YT.Player:", err);
  }
}

// Sincronizar la UI del reproductor CD y botones rápidos
function syncMusicUI() {
  if (isMusicPlayingGlobal) {
    if (musicPlayBtn) musicPlayBtn.innerText = "⏸";
    if (musicCd) musicCd.classList.add("playing");
  } else {
    if (musicPlayBtn) musicPlayBtn.innerText = "▶";
    if (musicCd) musicCd.classList.remove("playing");
  }
}

// Actualizar la fuente y metadatos de la canción en tiempo real (para todos los clientes)
window.updatePlayerMusic = function(url, title, artist) {
  const titleEl = document.querySelector("#music-widget .music-title");
  const artistEl = document.querySelector("#music-widget .music-artist");
  if (titleEl) titleEl.innerText = title || "Canción en Vivo";
  if (artistEl) artistEl.innerText = artist || "GUATE XITER PRO";

  const ytId = getYouTubeId(url);
  if (ytId) {
    // Pausar audio local si está sonando
    if (music) {
      try { music.pause(); } catch(e){}
    }
    
    currentMusicType = 'youtube';
    // Asegurarse que la API esté cargada antes de inicializar
    loadYoutubeAPI();
    initYoutubePlayer(ytId);
    
    if (typeof isLoggedIn === "function" && isLoggedIn()) {
      addConsoleLog(`Música sincronizada (YouTube ID: ${ytId}): ${title} - ${artist}`, 'info');
    }
  } else {
    // Pausar y limpiar reproductor de YouTube
    if (ytPlayer && ytPlayerReady) {
      try { ytPlayer.pauseVideo(); ytPlayer.stopVideo(); } catch(e){}
    }
    
    currentMusicType = 'audio';
    
    if (music) {
      // Si la URL parece válida (http/https o ruta a mp3 local), úsala. Si no, usa el archivo por defecto.
      const isValidAudio = url && (/^https?:\/\//i.test(url) || /\.(mp3|ogg|wav|m4a|aac|opus|flac)$/i.test(url));
      const cleanUrl = isValidAudio ? url : "EMPILADAZO feat TYPEGE.mp3";
      
      if (!music.src.endsWith(cleanUrl) && !music.src.includes(encodeURI(cleanUrl))) {
        music.src = cleanUrl;
        try { music.load(); } catch(e){}
      }
      music.volume = currentVolume;
      
      if (isMusicPlayingGlobal) {
        const playPromise = music.play();
        if (playPromise && playPromise.catch) {
          playPromise.catch(e => console.log("Audio play blocked by browser:", e.message));
        }
      }
    }
    
    if (typeof isLoggedIn === "function" && isLoggedIn()) {
      addConsoleLog(`Música sincronizada (Audio): ${title} - ${artist}`, 'info');
    }
  }
  
  syncMusicUI();
};

// Control de Play / Pause alternado
window.togglePlayMusic = function() {
  if (typeof clickSound === "function") clickSound();
  userHasInteracted = true;
  isMusicPlayingGlobal = !isMusicPlayingGlobal;
  
  if (currentMusicType === 'youtube') {
    if (ytPlayer && ytPlayerReady) {
      try {
        if (isMusicPlayingGlobal) {
          ytPlayer.playVideo();
          if (typeof isLoggedIn === "function" && isLoggedIn()) addConsoleLog("Música YouTube: REPRODUCIR", 'info');
        } else {
          ytPlayer.pauseVideo();
          if (typeof isLoggedIn === "function" && isLoggedIn()) addConsoleLog("Música YouTube: PAUSAR", 'info');
        }
      } catch(e){}
    }
  } else {
    if (music) {
      if (isMusicPlayingGlobal) {
        const p = music.play();
        if (p && p.then) {
          p.then(() => {
            if (typeof isLoggedIn === "function" && isLoggedIn()) addConsoleLog("Música local MP3: REPRODUCIR", 'info');
          }).catch(err => console.log("Error al reproducir audio:", err));
        }
      } else {
        music.pause();
        if (typeof isLoggedIn === "function" && isLoggedIn()) addConsoleLog("Música local MP3: PAUSAR", 'info');
      }
    }
  }
  
  syncMusicUI();
};

// Evento de ajuste de volumen unificado
if (musicVolume) {
  musicVolume.addEventListener("input", (e) => {
    currentVolume = parseFloat(e.target.value);
    
    if (music) {
      music.volume = currentVolume;
    }
    
    if (currentMusicType === 'youtube' && ytPlayer && ytPlayerReady) {
      try {
        ytPlayer.setVolume(currentVolume * 100);
      } catch(err){}
    }
  });
}

// Auto-play con primera interacción del usuario en la página (gesto del usuario para desbloquear audio)
function unlockAudioPlayback() {
  if (userHasInteracted) return;
  userHasInteracted = true;
  
  if (!isMusicPlayingGlobal) {
    isMusicPlayingGlobal = true;
  }
  
  if (currentMusicType === 'youtube') {
    if (ytPlayer && ytPlayerReady) {
      try { ytPlayer.playVideo(); } catch(e){}
    } else {
      // Esperar a que el player esté listo
      const waitInterval = setInterval(() => {
        if (ytPlayer && ytPlayerReady) {
          try { ytPlayer.playVideo(); } catch(e){}
          clearInterval(waitInterval);
        }
      }, 200);
      setTimeout(() => clearInterval(waitInterval), 8000);
    }
  } else {
    if (music) {
      music.play().catch(err => console.log("Auto-play blocked by browser."));
    }
  }
  
  syncMusicUI();
}
document.body.addEventListener("click", unlockAudioPlayback, { once: true });
document.body.addEventListener("keydown", unlockAudioPlayback, { once: true });
document.body.addEventListener("touchstart", unlockAudioPlayback, { once: true });


// ==========================================
// 🌌 SISTEMA DE PARTÍCULAS INTERACTIVAS (NEON PLEXUS CONSTELLATION)
// ==========================================
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;

let numParticles = 75;
let particles = [];
let mouse = { x: null, y: null, radius: 180 };

// Clase Partícula
class Particle {
  constructor() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.8;
    this.vy = (Math.random() - 0.5) * 0.8;
    this.radius = Math.random() * 2 + 1;
    this.color = Math.random() > 0.6 
      ? "rgba(0, 232, 255, 0.55)"
      : (Math.random() > 0.5 
         ? "rgba(255, 46, 184, 0.5)"
         : "rgba(124, 58, 237, 0.5)");
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }

  update() {
    // Rebotar en bordes
    if (this.x < 0 || this.x > w) this.vx = -this.vx;
    if (this.y < 0 || this.y > h) this.vy = -this.vy;

    this.x += this.vx;
    this.y += this.vy;

    // Interacción con ratón: atracción leve
    if (mouse.x !== null && mouse.y !== null) {
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.radius) {
        let force = (mouse.radius - dist) / mouse.radius;
        // Mover levemente hacia el ratón
        this.x += (dx / dist) * force * 0.5;
        this.y += (dy / dist) * force * 0.5;
      }
    }
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
}
initParticles();

window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

window.addEventListener("mouseleave", () => {
  mouse.x = null;
  mouse.y = null;
});

// Dibujar conexiones entre partículas
function connect() {
  let maxDistance = 120;
  for (let a = 0; a < particles.length; a++) {
    for (let b = a + 1; b < particles.length; b++) {
      let dx = particles[a].x - particles[b].x;
      let dy = particles[a].y - particles[b].y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < maxDistance) {
        let alpha = (1 - dist / maxDistance) * 0.18;
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        
        // Si una de las partículas es rosada, hacer la línea morada/rosa
        if (particles[a].color.includes("255, 46") || particles[b].color.includes("255, 46")) {
          ctx.strokeStyle = `rgba(255, 0, 170, ${alpha})`;
        }
        
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
    
    // Conectar partículas con el ratón
    if (mouse.x !== null && mouse.y !== null) {
      let dx = particles[a].x - mouse.x;
      let dy = particles[a].y - mouse.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.radius) {
        let alpha = (1 - dist / mouse.radius) * 0.45;
        ctx.strokeStyle = `rgba(142, 45, 226, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, w, h);
  
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  
  connect();
  requestAnimationFrame(drawParticles);
}

drawParticles();

// Ajuste del lienzo al redimensionar
window.addEventListener("resize", () => {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  initParticles();
});


// ==========================================
// 📐 EFECTO INCLINACIÓN 3D INTERACTIVO (TILT)
// ==========================================
function initTiltEffect() {
  document.querySelectorAll(".tilt-3d").forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Inclinación máxima de 12 grados
      const rotateX = ((centerY - y) / centerY) * 12;
      const rotateY = ((x - centerX) / centerX) * 12;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
      
      // Resplandor que sigue al ratón
      card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 0, 170, 0.15), var(--card-bg) 65%)`;
    });
    
    card.addEventListener("mouseleave", () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
      card.style.background = `var(--card-bg)`;
      card.style.transition = "transform 0.5s ease, background 0.5s ease";
    });

    card.addEventListener("mouseenter", () => {
      card.style.transition = "none";
    });
  });
}

initTiltEffect();


// ==========================================
// 🔥 CONFIGURACIÓN GLOBAL DE FIREBASE
// ==========================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAgv5Aj2pfQdyznGy6rNQIH4QteO1abfck",
  authDomain: "web-guate-xiter.firebaseapp.com",
  databaseURL: "https://web-guate-xiter-default-rtdb.firebaseio.com",
  projectId: "web-guate-xiter",
  storageBucket: "web-guate-xiter.firebasestorage.app",
  messagingSenderId: "365511047657",
  appId: "1:365511047657:web:39300a8466621ac19db378",
  measurementId: "G-4N55H73286"
};

let firebaseDB = null; // Referencia global a Firebase Database

function isFirebaseConfigured() {
  return FIREBASE_CONFIG.apiKey && 
         FIREBASE_CONFIG.apiKey !== "REPLACE_WITH_YOUR_API_KEY" &&
         FIREBASE_CONFIG.databaseURL && 
         FIREBASE_CONFIG.databaseURL !== "REPLACE_WITH_YOUR_DATABASE_URL";
}

// Inicializar Firebase de forma global (una sola vez)
function initFirebaseGlobal() {
  if (firebaseDB) return; // Ya inicializado
  if (!isFirebaseConfigured()) return;
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    firebaseDB = firebase.database();
    console.log("%c🔥 Firebase conectado globalmente", "color:#39ff14; font-weight:bold;");
  } catch (error) {
    console.error("Error al inicializar Firebase:", error);
    firebaseDB = null;
  }
}

// Inicializar Firebase al cargar el script
initFirebaseGlobal();

// ==========================================
// 🔐 BASE DE DATOS DE USUARIOS (FIREBASE + LOCALSTORAGE)
// ==========================================
const DB_KEY = "guate_users";
const SESSION_KEY = "guate_logged_in";
const PAYPAL_ME = "https://paypal.me/david639935"; // Tu PayPal personal
const BG_URL_KEY = "guate_bg_url";
const PRODUCTS_KEY = "guate_products";
const CLAIMED_KEYS_KEY = "guate_claimed_keys";
const ADMIN_USERNAMES = ["xdavid", "luisdavid", "admin", "dev_david", "xdavidyt", "admin_example_com"];

// 🔥 Guardar productos en Firebase de forma segura (solo admin)
async function firebaseSaveProducts(products) {
  if (!isLoggedIn() || !products) return;
  const user = getActiveUser();
  const isAdmin = user && ADMIN_USERNAMES.includes(user.username.toLowerCase());
  if (!isAdmin) return;

  try {
    await fetchSecureAPI("/api/admin", {
      action: "save_products",
      products: products
    });
    console.log("%c🔥 Productos sincronizados a Firebase mediante API segura", "color:#39ff14; font-weight:bold;");
  } catch (err) {
    console.error('Error guardando productos en Firebase:', err);
  }
}

// 🔥 Recomendaciones globales (Firebase Realtime Database)
function parseRecommendationsSnapshot(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(r => r && r.id != null);
  return Object.values(val).filter(r => r && r.id != null);
}

function sortRecommendations(list) {
  return [...list].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
}

function getRecommendations() {
  try {
    return JSON.parse(localStorage.getItem(DB_RECOM_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function setRecommendationsCache(list) {
  localStorage.setItem(DB_RECOM_KEY, JSON.stringify(sortRecommendations(list)));
}

function firebaseSaveRecommendation(recom) {
  if (!firebaseDB || !recom || recom.id == null) return Promise.resolve();
  return firebaseDB.ref("recommendations/" + recom.id).set(recom);
}

function firebaseDeleteRecommendation(id) {
  if (!firebaseDB || id == null) return Promise.resolve();
  return firebaseDB.ref("recommendations/" + id).remove();
}

function firebaseLoadRecommendations() {
  return new Promise((resolve) => {
    if (!firebaseDB) {
      resolve(null);
      return;
    }
    firebaseDB.ref("recommendations").once("value")
      .then(snapshot => resolve(parseRecommendationsSnapshot(snapshot.val())))
      .catch(err => {
        console.error("Error cargando recomendaciones de Firebase:", err);
        resolve(null);
      });
  });
}

function firebaseSeedRecommendations() {
  return firebaseLoadRecommendations().then(async (fbList) => {
    if (fbList && fbList.length > 0) {
      setRecommendationsCache(fbList);
      return fbList;
    }
    const local = getRecommendations();
    const toSeed = local.length > 0 ? local : DEFAULT_RECOMMENDATIONS;
    setRecommendationsCache(toSeed);
    if (firebaseDB) {
      const updates = {};
      toSeed.forEach(r => { updates[r.id] = r; });
      await firebaseDB.ref("recommendations").update(updates);
    }
    return toSeed;
  });
}

let recommendationsFirebaseListener = false;

function attachRecommendationsRealtimeListener() {
  if (!firebaseDB || recommendationsFirebaseListener) return;
  recommendationsFirebaseListener = true;
  firebaseDB.ref("recommendations").on("value", (snapshot) => {
    const list = sortRecommendations(parseRecommendationsSnapshot(snapshot.val()));
    setRecommendationsCache(list);
    renderRecommendations();
  });
}

// 🔥 Cargar productos desde Firebase (retorna Promise)
function firebaseLoadProducts() {
  return new Promise((resolve) => {
    if (!firebaseDB) {
      resolve(null);
      return;
    }
    firebaseDB.ref('products').once('value')
      .then(snapshot => {
        const data = snapshot.val();
        if (!data || !Array.isArray(data) || data.length < 8) {
          resolve(null);
          return;
        }
        resolve(data);
      })
      .catch(err => {
        console.error('Error cargando productos de Firebase:', err);
        resolve(null);
      });
  });
}

// Marca de tiempo para resolver conflictos de saldo entre navegadores
function touchBalance(user) {
  if (user) user.balanceUpdatedAt = Date.now();
  return user;
}

// Combinar registro local + Firebase sin pisar el saldo más reciente
function mergeUserRecords(localUser, fbUser) {
  if (!localUser) return fbUser ? { ...fbUser } : null;
  if (!fbUser) return { ...localUser };

  const localTs = Number(localUser.balanceUpdatedAt) || 0;
  const fbTs = Number(fbUser.balanceUpdatedAt) || 0;
  const balanceFromLocal = localTs > fbTs;
  const balanceSource = balanceFromLocal ? localUser : fbUser;

  return {
    ...localUser,
    ...fbUser,
    balance: balanceSource.balance !== undefined && balanceSource.balance !== null
      ? balanceSource.balance
      : (localUser.balance ?? fbUser.balance ?? 0),
    balanceUpdatedAt: Math.max(localTs, fbTs),
    purchases: balanceSource.purchases?.length
      ? balanceSource.purchases
      : (fbUser.purchases || localUser.purchases || []),
    licenseKey: fbUser.licenseKey || localUser.licenseKey,
    panelKey: fbUser.panelKey || localUser.panelKey
  };
}

// --- FUNCIONES SEGURAS DE COMUNICACIÓN CON EL BACKEND (API VERCEL) ---

async function fetchSecureAPI(url, body) {
  const token = localStorage.getItem("session_token");
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error HTTP ${response.status}`);
  }
  return data;
}

// Reemplazos de compatibilidad para evitar errores en otras partes del código antiguo
function firebaseSaveUser(user) {
  // Obsoleto: las escrituras se hacen ahora de forma segura mediante API del servidor
  return Promise.resolve();
}

function firebaseLoadAllUsers() {
  // Obsoleto por seguridad: los usuarios ya no se cargan al cliente
  return Promise.resolve([]);
}

async function fetchPublicRankUsers() {
  try {
    const response = await fetch("/api/rank");
    const data = await response.json();
    if (!response.ok || !data.success) return [];
    return Array.isArray(data.users) ? data.users : [];
  } catch (error) {
    console.error("Error cargando ranking público:", error);
    return [];
  }
}

function firebaseSyncAllUsersUp() {
  // Obsoleto por seguridad
}

async function firebaseSyncAllUsersDown() {
  // Obsoleto por seguridad
  return { merged: null, fbUsers: [] };
}

// Obtener el registro global de keys reclamadas
function getClaimedKeys() {
  try {
    return JSON.parse(localStorage.getItem(CLAIMED_KEYS_KEY)) || [];
  } catch(e) {
    return [];
  }
}

// Registrar una key como reclamada en el registro global
function markKeyAsClaimed(key) {
  if (!key || key === "VINCULA_TU_CUENTA_PARA_GENERAR") return;
  const claimed = getClaimedKeys();
  if (!claimed.includes(key)) {
    claimed.push(key);
    localStorage.setItem(CLAIMED_KEYS_KEY, JSON.stringify(claimed));
  }
}

// Fondo premium CSS + capa opcional desde admin (Firebase)
const BLOCKED_BG_PATTERNS = [/circuit/i, /motherboard/i, /pcb/i, /grid.*line/i];
const BG_MIGRATION_KEY = 'guate_bg_premium_v2';

function isBlockedBackgroundUrl(url) {
  if (!url || typeof url !== 'string') return true;
  return BLOCKED_BG_PATTERNS.some((p) => p.test(url));
}

function applyCustomBackgroundLayer(url) {
  const layer = document.getElementById('bg-custom-image');
  if (!layer) return;
  if (url && !isBlockedBackgroundUrl(url)) {
    layer.style.backgroundImage = `url('${url.replace(/'/g, "%27")}')`;
    layer.classList.add('active');
  } else {
    layer.style.backgroundImage = '';
    layer.classList.remove('active');
  }
}

function initBackground() {
  document.body.classList.add('use-premium-bg');
  document.body.style.background = '';
  document.body.style.backgroundSize = '';

  if (!localStorage.getItem(BG_MIGRATION_KEY)) {
    localStorage.setItem(BG_MIGRATION_KEY, '1');
    localStorage.removeItem(BG_URL_KEY);
  }

  const stored = localStorage.getItem(BG_URL_KEY);
  if (stored && isBlockedBackgroundUrl(stored)) {
    localStorage.removeItem(BG_URL_KEY);
  }

  const validLocal = localStorage.getItem(BG_URL_KEY);
  if (validLocal) applyCustomBackgroundLayer(validLocal);

  if (!firebaseDB) return;

  const syncBackgroundFromFirebase = (url) => {
    if (url && typeof url === 'string' && url.trim() !== '' && !isBlockedBackgroundUrl(url)) {
      localStorage.setItem(BG_URL_KEY, url);
      applyCustomBackgroundLayer(url);
    } else {
      localStorage.removeItem(BG_URL_KEY);
      applyCustomBackgroundLayer(null);
    }
  };

  firebaseDB.ref('background_url').once('value').then((snapshot) => {
    syncBackgroundFromFirebase(snapshot.val());
  }).catch((err) => console.error('Error cargando fondo de Firebase:', err));

  firebaseDB.ref('background_url').on('value', (snapshot) => {
    syncBackgroundFromFirebase(snapshot.val());
  });
}
initBackground();

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Panel de 24 Horas",
    description: "Prueba el Panel completo y todas las herramientas durante un día de juego intenso.",
    price: 1,
    image: "https://file.vahalla.cc/1442f9d8.jpeg",
    badge: "DIARIO",
    badgeColor: "rgba(0, 240, 255, 0.1)",
    textColor: "var(--secondary)",
    keyType: "panel",
    category: "Panel",
    features: ["Panel Anti-Cheat (24h)", "Actualizaciones al instante", "Soporte prioritario", "Panel SaaS completo"]
  },
  {
    id: 2,
    name: "Panel Semanal",
    description: "Acceso por 7 días de Panel activo y soporte para inyecciones ilimitadas en el juego.",
    price: 8,
    image: "https://file.vahalla.cc/1442f9d8.jpeg",
    badge: "SEMANAL",
    badgeColor: "rgba(142, 45, 226, 0.15)",
    textColor: "#c084fc",
    keyType: "panel",
    category: "Panel",
    features: ["Panel Anti-Cheat (7 días)", "Soporte por WhatsApp", "Limpiador de HWID", "Soporte 24/7 prioritario"]
  },
  {
    id: 3,
    name: "Panel 15 Días",
    description: "Acceso por 15 días a todo el arsenal: Panel indetectado y Panel SaaS Pro.",
    price: 12,
    image: "https://file.vahalla.cc/1442f9d8.jpeg",
    badge: "15 DÍAS",
    badgeColor: "rgba(255,0,170,0.2)",
    textColor: "var(--primary)",
    keyType: "panel",
    category: "Panel",
    features: ["Panel Anti-Cheat (15 días)", "Panel SaaS Pro Completo", "Soporte 24/7 dedicado", "Licencia HWID exclusiva"]
  },
  {
    id: 4,
    name: "Panel Mensual",
    description: "Acceso completo por 30 días con actualizaciones del Panel, soporte VIP y HWID Reset.",
    price: 22,
    image: "https://file.vahalla.cc/1442f9d8.jpeg",
    badge: "⭐ RECOMENDADO",
    badgeColor: "rgba(57, 255, 20, 0.15)",
    textColor: "#39ff14",
    keyType: "panel",
    category: "Panel",
    features: ["Acceso completo (30 días)", "Actualizaciones VIP automáticas", "Soporte del Programador", "HWID Reset ilimitado"]
  },
  {
    id: 5,
    name: "Bypass Diario VIP",
    description: "Bypass de seguridad ultra estable de 1 día para inyección directa sin riesgos.",
    price: 1,
    image: "https://file.vahalla.cc/65aecf90.jpg",
    badge: "BYPASS DIARIO",
    badgeColor: "rgba(0, 240, 255, 0.1)",
    textColor: "var(--secondary)",
    keyType: "bypass",
    category: "Bypass",
    features: ["Bypass Anti-Cheat (24h)", "Actualizaciones instantáneas", "Soporte dedicado", "Uso seguro 100%"]
  },
  {
    id: 6,
    name: "Bypass Semanal VIP",
    description: "Acceso semanal de Bypass activo. Soporte completo e inyecciones ilimitadas.",
    price: 6,
    image: "https://file.vahalla.cc/65aecf90.jpg",
    badge: "BYPASS SEMANAL",
    badgeColor: "rgba(142, 45, 226, 0.15)",
    textColor: "#c084fc",
    keyType: "bypass",
    category: "Bypass",
    features: ["Bypass Anti-Cheat (7 días)", "Limpiador HWID incluido", "Soporte prioritario", "Actualización automática"]
  },
  {
    id: 7,
    name: "Bypass 15 Días VIP",
    description: "Bypass de seguridad por 15 días para evitar baneos por firmas y emulación.",
    price: 13,
    image: "https://file.vahalla.cc/65aecf90.jpg",
    badge: "BYPASS 15 DÍAS",
    badgeColor: "rgba(255,0,170,0.2)",
    textColor: "var(--primary)",
    keyType: "bypass",
    category: "Bypass",
    features: ["Bypass Anti-Cheat (15 días)", "HWID Vinculación única", "Soporte dedicado 24/7", "Ejecución oculta en la nube"]
  },
  {
    id: 8,
    name: "Bypass Mensual VIP",
    description: "Acceso completo por 30 días de Bypass con actualizaciones VIP y soporte del programador.",
    price: 18,
    image: "https://file.vahalla.cc/65aecf90.jpg",
    badge: "⭐ BYPASS RECOMENDADO",
    badgeColor: "rgba(57, 255, 20, 0.15)",
    textColor: "#39ff14",
    keyType: "bypass",
    category: "Bypass",
    features: ["Bypass Anti-Cheat (30 días)", "Actualizaciones VIP gratis", "HWID Reset ilimitado", "Soporte prioritario programador"]
  }
];

// Versión de los productos — incrementar cada vez que se modifiquen los DEFAULT_PRODUCTS
const PRODUCTS_VERSION = 4;
const PRODUCTS_VERSION_KEY = "guate_products_version";

function initProducts() {
  const savedVersion = parseInt(localStorage.getItem(PRODUCTS_VERSION_KEY)) || 0;
  const needsForceUpdate = savedVersion < PRODUCTS_VERSION;

  let products = localStorage.getItem(PRODUCTS_KEY);
  if (!products || needsForceUpdate) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    localStorage.setItem(PRODUCTS_VERSION_KEY, String(PRODUCTS_VERSION));
    // 🔥 Forzar subida a Firebase con los nuevos productos
    if (firebaseDB) {
      firebaseSaveProducts(DEFAULT_PRODUCTS);
      console.log("%c🔥 Productos actualizados en Firebase (versión " + PRODUCTS_VERSION + ")", "color:#ff00aa; font-weight:bold;");
    }
    if (typeof renderBuySection === 'function') renderBuySection();
  } else {
    try {
      const parsed = JSON.parse(products);
      const hasOutdatedPanelPackage = Array.isArray(parsed) && parsed.some(p => ["Panel de por Vida", "Bypass Permanente VIP"].includes(p.name));
      const lengthMismatch = !Array.isArray(parsed) || parsed.length !== DEFAULT_PRODUCTS.length;

      if (hasOutdatedPanelPackage || lengthMismatch) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
        localStorage.setItem(PRODUCTS_VERSION_KEY, String(PRODUCTS_VERSION));
        if (firebaseDB) firebaseSaveProducts(DEFAULT_PRODUCTS);
        if (typeof renderBuySection === 'function') renderBuySection();
      } else {
        let needsSave = false;
        parsed.forEach(p => {
          if (p.keyType === "both") {
            p.keyType = "panel";
            needsSave = true;
          }
        });
        if (needsSave) {
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(parsed));
          if (typeof renderBuySection === 'function') renderBuySection();
        }
      }
    } catch (e) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      localStorage.setItem(PRODUCTS_VERSION_KEY, String(PRODUCTS_VERSION));
      if (firebaseDB) firebaseSaveProducts(DEFAULT_PRODUCTS);
      if (typeof renderBuySection === 'function') renderBuySection();
    }
  }

  // 🔥 Sincronizar productos desde Firebase (verificar que no estén desactualizados)
  if (firebaseDB) {
    firebaseLoadProducts().then(fbProducts => {
      if (fbProducts && fbProducts.length >= 8) {
        // Verificar si Firebase tiene datos obsoletos
        const fbHasOutdated = fbProducts.some(p => ["Panel de por Vida", "Bypass Permanente VIP"].includes(p.name));
        const fbPricesMismatch = fbProducts.some(p => {
          const def = DEFAULT_PRODUCTS.find(d => d.id === p.id);
          return def && def.price !== p.price;
        });
        if (fbHasOutdated || fbPricesMismatch) {
          // Firebase tiene datos viejos, subir los nuevos
          firebaseSaveProducts(DEFAULT_PRODUCTS);
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
          console.log("%c🔥 Firebase tenía productos obsoletos — actualizados con nuevos precios", "color:#ff00aa; font-weight:bold;");
        } else {
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(fbProducts));
          console.log("%c🔥 Productos cargados desde Firebase (precios globales)", "color:#39ff14; font-weight:bold;");
        }
        if (typeof renderBuySection === 'function') renderBuySection();
      } else {
        // Si Firebase no tiene productos, subir los locales
        const localProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || DEFAULT_PRODUCTS;
        firebaseSaveProducts(localProducts);
      }
    });
  }
}
initProducts();

// Renderiza dinámicamente la sección de compra (8 cuadros personalizables con filtro por categoría)
let activeBuyFilter = "all";

function renderBuySection() {
  const container = document.getElementById("buy-products-grid");
  if (!container) return;

  const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || DEFAULT_PRODUCTS;
  
  const filteredProducts = activeBuyFilter === "all" 
    ? products 
    : products.filter(p => (p.category || "").toLowerCase() === activeBuyFilter);

  container.innerHTML = filteredProducts.map(p => {
    const featuresHTML = p.features ? p.features.map(f => `
      <div class="price-feature">${f}</div>
    `).join('') : '';

    const catColor = (p.category || "").toLowerCase() === "panel" 
      ? "rgba(142, 45, 226, 0.25)" 
      : "rgba(0, 240, 255, 0.25)";
    const catTextColor = (p.category || "").toLowerCase() === "panel" 
      ? "#c084fc" 
      : "var(--secondary)";

    return `
      <div class="card tilt-3d price-card ${p.badge.includes('RECOMENDADO') ? 'price-featured' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div class="price-tier-badge" style="background: ${p.badgeColor || 'rgba(0, 240, 255, 0.1)'}; color: ${p.textColor || 'var(--secondary)'};">${p.badge}</div>
          <span style="background: ${catColor}; color: ${catTextColor}; font-size:10px; padding:3px 8px; border-radius:6px; font-weight:600; letter-spacing:0.5px;">${p.category || 'N/A'}</span>
        </div>
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="price-feature-list">
          ${featuresHTML}
        </div>
        <div style="font-size: 24px; color: ${p.textColor || 'var(--secondary)'}; font-family: var(--font-tech); font-weight: bold; margin: 15px 0;">$${parseFloat(p.price).toFixed(2)} USD</div>
        <div class="product-buy-options">
          <button class="btn secondary-btn" style="flex:1" onclick="buyWithBalance('${p.name}', ${p.price})">💰 Usar Saldo</button>
          <button class="btn paypal-btn-small" onclick="openPayPalProduct('${p.name}', ${p.price})">🅿 PayPal</button>
        </div>
      </div>
    `;
  }).join('');

  if (typeof initTiltEffect === 'function') {
    initTiltEffect();
  }
}

window.filterBuyByCategory = function(category) {
  clickSound();
  activeBuyFilter = category;
  
  document.querySelectorAll(".buy-filter-btn").forEach(btn => btn.classList.remove("active"));
  const targetBtn = document.querySelector(`.buy-filter-btn[data-category="${category}"]`);
  if (targetBtn) targetBtn.classList.add("active");
  
  renderBuySection();
};

// Renderiza dinámicamente el ranking VIP de gastos
async function renderRankSection() {
  const container = document.getElementById("rank-list-container");
  if (!container) return;

  let users = JSON.parse(localStorage.getItem(DB_KEY)) || [];
  const publicRankUsers = await fetchPublicRankUsers();
  if (publicRankUsers.length > 0) {
    users = publicRankUsers;
  }
  
  // Calcular total gastado para cada usuario (excluyendo a la cuenta genérica admin)
  const rankedUsers = users
    .filter(u => !ADMIN_USERNAMES.includes(u.username.toLowerCase()))
    .map(u => {
      const totalSpent = u.purchases ? u.purchases.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) : 0;
      return { ...u, totalSpent };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);

  if (rankedUsers.length === 0) {
    container.innerHTML = `
      <p style="color: var(--text-muted); text-align: center; padding: 30px; font-size: 14px;">
        Aún no hay compras registradas en la plataforma. ¡Sé el primero en aparecer aquí!
      </p>
    `;
    return;
  }

  container.innerHTML = `
    <div class="leaderboard-header">
      <span class="leaderboard-col-rank">Posición</span>
      <span class="leaderboard-col-user">Usuario</span>
      <span class="leaderboard-col-status">Honores</span>
      <span class="leaderboard-col-spent">Total Gastado</span>
    </div>
    <div class="leaderboard-body">
      ${rankedUsers.map((u, index) => {
        let rankBadge = '';
        let rankClass = '';
        if (index === 0) {
          rankBadge = '👑 🥇';
          rankClass = 'first-place';
        } else if (index === 1) {
          rankBadge = '🥈';
          rankClass = 'second-place';
        } else if (index === 2) {
          rankBadge = '🥉';
          rankClass = 'third-place';
        } else {
          rankBadge = `#${index + 1}`;
        }

        // Título de honor según gasto
        let spentTitle = "Aspirante";
        let spentColor = "var(--text-muted)";
        if (u.totalSpent >= 100) {
          spentTitle = "👑 Magnate Supremo";
          spentColor = "#ffd700";
        } else if (u.totalSpent >= 50) {
          spentTitle = "💎 Inversor VIP";
          spentColor = "var(--secondary)";
        } else if (u.totalSpent >= 20) {
          spentTitle = "🔥 Comprador Fiel";
          spentColor = "var(--primary)";
        } else if (u.totalSpent > 0) {
          spentTitle = "⚡ Miembro Activo";
          spentColor = "#ffaa00";
        }

        return `
          <div class="leaderboard-row ${rankClass}">
            <div class="leaderboard-col-rank font-tech">${rankBadge}</div>
            <div class="leaderboard-col-user">
              <img src="${u.logoUrl || 'https://file.vahalla.cc/66b93f29.png'}" class="leaderboard-avatar" alt="avatar">
              <span class="leaderboard-username">${u.username}</span>
            </div>
            <div class="leaderboard-col-status">
              <span class="rank-badge" style="background: rgba(255,255,255,0.03); color: ${spentColor}; border: 1px solid ${spentColor}33; font-size:11px; padding: 4px 8px; border-radius: 8px;">
                ${spentTitle}
              </span>
            </div>
            <div class="leaderboard-col-spent font-tech" style="color: #39ff14; font-weight: bold; font-size: 13.5px;">
              $${u.totalSpent.toFixed(2)} USD
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Helper para buscar el tipo de key dinámicamente
function getProductKeyType(productName) {
  const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || DEFAULT_PRODUCTS;
  const prod = products.find(p => p.name === productName);
  if (prod) return prod.keyType;
  return "bypass";
}

// Crear base de datos de usuarios por defecto
function initDatabase() {
  let users = JSON.parse(localStorage.getItem(DB_KEY));
  if (!users) {
    users = [];
  }

  // Asegurar que el usuario admin siempre exista con la contraseña y el correo correctos
  // Migración: si existe un usuario "admin" antiguo en la DB, lo renombramos a "xDavid"
  let adminIndex = users.findIndex(u => u.username.toLowerCase() === "admin");
  if (adminIndex !== -1) {
    users[adminIndex].username = "xDavid";
    users[adminIndex].email = "xdavid@guatexiter.pro";
    users[adminIndex].password = "GuateXiter";
  }

  const xdavidIndex = users.findIndex(u => u.username.toLowerCase() === "xdavid");
  const xdavidUser = {
    username: "xDavid",
    email: "xdavid@guatexiter.pro",
    password: "GuateXiter",
    logoUrl: "https://file.vahalla.cc/66b93f29.png",
    rank: "DEVELOPER PRO",
    regDate: "19/05/2026",
    downloads: 14,
    balance: 90000000.00,
    licenseKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
    panelKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
    purchases: [],
    isAdmin: true
  };

  if (xdavidIndex === -1) {
    users.unshift(xdavidUser);
  } else {
    users[xdavidIndex].email = "xdavid@guatexiter.pro";
    users[xdavidIndex].password = "GuateXiter";
    users[xdavidIndex].isAdmin = true;
    if (!users[xdavidIndex].rank) users[xdavidIndex].rank = "DEVELOPER PRO";
    // NO resetear el saldo si ya existe — respetar el saldo real de Firebase/transacciones
    if (users[xdavidIndex].balance === undefined || users[xdavidIndex].balance === null) {
      users[xdavidIndex].balance = 90000000.00;
    }
  }

  // Asegurar que el nuevo admin luisdavid exista
  const luisdavidIndex = users.findIndex(u => u.username.toLowerCase() === "luisdavid");
  const luisdavidUser = {
    username: "luisdavid",
    email: "luisdavid@guatexiter.pro",
    password: "GuateXiter",
    logoUrl: "https://file.vahalla.cc/66b93f29.png",
    rank: "DEVELOPER PRO",
    regDate: "23/05/2026",
    downloads: 18,
    balance: 90000000.00,
    licenseKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
    panelKey: "VINCULA_TU_CUENTA_PARA_GENERAR",
    purchases: [],
    isAdmin: true
  };

  if (luisdavidIndex === -1) {
    users.push(luisdavidUser);
  } else {
    users[luisdavidIndex].email = "luisdavid@guatexiter.pro";
    users[luisdavidIndex].password = "GuateXiter";
    users[luisdavidIndex].isAdmin = true;
    if (!users[luisdavidIndex].rank) users[luisdavidIndex].rank = "DEVELOPER PRO";
    // NO resetear el saldo si ya existe — respetar el saldo real de Firebase/transacciones
    if (users[luisdavidIndex].balance === undefined || users[luisdavidIndex].balance === null) {
      users[luisdavidIndex].balance = 90000000.00;
    }
  }

  // Si el admin tiene sesión activa, asegurar que tenga flag de admin
  let activeUser = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (activeUser && ADMIN_USERNAMES.includes(activeUser.username.toLowerCase())) {
    activeUser.username = activeUser.username.toLowerCase() === "admin" ? "xDavid" : activeUser.username;
    activeUser.isAdmin = true;
    // Sincronizar el saldo actual del admin desde la DB (no resetear)
    const adminInDB = users.find(u => u.username.toLowerCase() === activeUser.username.toLowerCase());
    if (adminInDB) activeUser.balance = adminInDB.balance;
    localStorage.setItem(SESSION_KEY, JSON.stringify(activeUser));
  }

  localStorage.setItem(DB_KEY, JSON.stringify(users));

  // 🔥 Sincronizar sesión activa con el servidor (Vercel Backend)
  if (localStorage.getItem("session_token")) {
    fetchSecureAPI("/api/auth", { action: "profile" })
      .then(data => {
        if (data && data.success && data.user) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
          if (typeof updateUserState === 'function') updateUserState();
          if (typeof updateTransactionHistory === 'function') updateTransactionHistory();
        }
      })
      .catch(err => {
        console.error("Sesión inválida o expirada:", err.message);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem("session_token");
        if (typeof updateUserState === 'function') updateUserState();
      });
  }
}

initDatabase();

// Comprobar si hay sesión activa
function isLoggedIn() {
  return localStorage.getItem(SESSION_KEY) !== null;
}

// Obtener usuario activo
function getActiveUser() {
  return JSON.parse(localStorage.getItem(SESSION_KEY));
}

// Guardar/Actualizar perfil de usuario en base de datos local + Firebase
function saveUserInDB(user) {
  const users = JSON.parse(localStorage.getItem(DB_KEY)) || [];
  const index = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
  if (index !== -1) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(DB_KEY, JSON.stringify(users));
  return firebaseSaveUser(user);
}

// Generación de rangos aleatorios graciosos/premium
function getRandomRank() {
  const ranks = [
    "VIP MEMBER", "BYPASS MASTER", "PRO CHEATER", 
    "PREMIUM ACCESS", "ELITE GAMER", "CHITER PLATINUM"
  ];
  return ranks[Math.floor(Math.random() * ranks.length)];
}


// Alternar giro de tarjeta de Login/Registro
function toggleAuthCard() {
  const authCard = document.getElementById("auth-card");
  if (authCard) {
    authCard.classList.toggle("flipped");
    clickSound();
  }
}

// Registrar Usuario
async function handleRegister(e) {
  e.preventDefault();
  clickSound();

  const regUsername = document.getElementById("reg-username").value.trim();
  const regEmail = document.getElementById("reg-email").value.trim();
  const regPassword = document.getElementById("reg-password").value;
  const regLogo = document.getElementById("reg-logo").value.trim();

  if (regPassword.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  try {
    const data = await fetchSecureAPI("/api/auth", {
      action: "register",
      username: regUsername,
      email: regEmail,
      password: regPassword,
      logoUrl: regLogo
    });

    if (data.success) {
      alert("¡Registro Exitoso! Ahora puedes iniciar sesión.");
      document.getElementById("register-form").reset();
      toggleAuthCard();
      document.getElementById("login-username").value = regUsername;
    }
  } catch (err) {
    alert("Error al registrar: " + err.message);
  }
}

// Iniciar Sesión
async function handleLogin(e) {
  e.preventDefault();
  clickSound();

  const usernameInput = document.getElementById("login-username").value.trim();
  const passwordInput = document.getElementById("login-password").value;

  try {
    const data = await fetchSecureAPI("/api/auth", {
      action: "login",
      username: usernameInput,
      password: passwordInput
    });

    if (data.success && data.token) {
      localStorage.setItem("session_token", data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));

      // Manejar Recordarme (SOLO guarda username, NUNCA la contraseña)
      const rememberCheckbox = document.getElementById("login-remember");
      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem("remember_login", "true");
        localStorage.setItem("remember_username", usernameInput);
      } else {
        localStorage.setItem("remember_login", "false");
        localStorage.removeItem("remember_username");
      }
      localStorage.removeItem("remember_password");

      // Actualizar estado del panel y cambiar de vista
      updateUserState();
      updateTransactionHistory();
      show("profile");

      // Mostrar botón admin si es admin
      const adminBtn = document.getElementById("admin-panel-btn");
      if (adminBtn) adminBtn.style.display = data.user.isAdmin ? "block" : "none";

      document.getElementById("login-form").reset();
      addConsoleLog(`Sesión iniciada correctamente por el usuario: ${data.user.username}`, 'info');
      addConsoleLog(`HWID: ${generateSimulatedHWID()} verificado con éxito.`, 'info');
    }
  } catch (err) {
    alert("Error de inicio de sesión: " + err.message);
  }
}

// Alternar vista de login normal / login de administrador
function toggleAdminLogin(showAdmin) {
  clickSound();
  const normalCard = document.getElementById("normal-login-card");
  const adminCard = document.getElementById("admin-login-card");
  
  if (showAdmin) {
    if (normalCard) normalCard.style.display = "none";
    if (adminCard) adminCard.style.display = "flex";
  } else {
    if (normalCard) normalCard.style.display = "flex";
    if (adminCard) adminCard.style.display = "none";
  }
}

// Iniciar sesión desde el portal de administrador
async function handleAdminLogin(e) {
  e.preventDefault();
  clickSound();

  const usernameInput = document.getElementById("admin-username").value.trim();
  const passwordInput = document.getElementById("admin-password").value;

  try {
    const data = await fetchSecureAPI("/api/auth", {
      action: "login",
      username: usernameInput,
      password: passwordInput
    });

    if (data.success && data.token) {
      if (!data.user.isAdmin) {
        alert("Acceso denegado: Credenciales de administrador inválidas.");
        showToast("❌ Intento de acceso administrativo no autorizado.", "error");
        return;
      }

      localStorage.setItem("session_token", data.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));

      updateUserState();
      updateTransactionHistory();
      show("profile");

      const adminBtn = document.getElementById("admin-panel-btn");
      if (adminBtn) adminBtn.style.display = "block";

      document.getElementById("admin-login-form").reset();
      addConsoleLog(`Admin login exitoso: ${data.user.username}`, 'info');
      
      // Abrir panel admin de inmediato tras el login de admin
      setTimeout(showAdminPanel, 300);
    }
  } catch (err) {
    alert("Error de acceso admin: " + err.message);
  }
}



// Cargar credenciales recordadas (si existen)
function initRememberedCredentials() {
  try {
    const rememberLogin = localStorage.getItem("remember_login") === "true";
    if (rememberLogin) {
      const u = localStorage.getItem("remember_username") || "";
      const usernameField = document.getElementById("login-username");
      const rememberCheckbox = document.getElementById("login-remember");
      if (usernameField) usernameField.value = u;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }
    // NUNCA recuperar contraseñas de localStorage
    localStorage.removeItem("remember_password");
    localStorage.removeItem("remember_admin_password");
  } catch (e) {
    console.error("Error al cargar credenciales guardadas:", e);
  }
}

// Cerrar Sesión
function handleLogout() {
  clickSound();
  const user = getActiveUser();
  if (user) {
    addConsoleLog(`Cerrando sesión del usuario: ${user.username}`, 'warn');
  }

  localStorage.removeItem(SESSION_KEY);
  updateUserState();
  initRememberedCredentials(); // Pre-llenar campos al cerrar sesión
  show("home");
}

// Actualizar elementos dinámicos según el estado de sesión
function updateUserState() {
  const loggedIn = isLoggedIn();
  const authTab = document.getElementById("nav-auth-tab");
  const profileTab = document.getElementById("nav-profile-tab");
  const rechargeTab = document.getElementById("nav-recharge-tab");
  const navLogo = document.getElementById("nav-logo");

  const defaultLogo = "https://file.vahalla.cc/66b93f29.png";

  if (loggedIn) {
    const user = getActiveUser();
    
    // Cambiar pestañas
    if (authTab) authTab.style.display = "none";
    if (profileTab) profileTab.style.display = "flex";
    if (rechargeTab) rechargeTab.style.display = "flex";

    // Actualizar logotipos e imágenes en toda la interfaz
    if (navLogo) navLogo.src = user.logoUrl;
    
    // Rellenar información en la sección Mi Perfil
    const nameEl = document.getElementById("user-name");
    const emailEl = document.getElementById("user-email");
    const avatarEl = document.getElementById("user-avatar");
    const rankEl = document.getElementById("user-rank");
    const downloadEl = document.getElementById("download-count");
    const keyEl = document.getElementById("generated-key");

    if (nameEl) nameEl.innerText = user.username;
    if (emailEl) emailEl.innerText = user.email;
    if (avatarEl) avatarEl.src = user.logoUrl;
    if (rankEl) {
      rankEl.innerText = user.rank;
      if (user.rank.includes("DEV") || user.rank.includes("ELITE")) {
        rankEl.style.background = "linear-gradient(135deg, #00f0ff, #8e2de2)";
      } else {
        rankEl.style.background = "linear-gradient(135deg, #ff00aa, #8e2de2)";
      }
    }
    if (downloadEl) downloadEl.innerText = user.downloads;
    if (keyEl) keyEl.innerText = user.licenseKey || "VINCULA_TU_CUENTA_PARA_GENERAR";

    // Restaurar clave de Panel si ya fue generada
    const panelKeyEl = document.getElementById("generated-panel-key");
    if (panelKeyEl) panelKeyEl.innerText = user.panelKey || "VINCULA_TU_CUENTA_PARA_GENERAR";

    // Mostrar saldo actualizado
    updateBalanceDisplay(user);

    // Mostrar/Ocultar botón admin en perfil
    const adminBtn = document.getElementById("admin-panel-btn");
    if (adminBtn) {
      adminBtn.style.display = ADMIN_USERNAMES.includes(user.username.toLowerCase()) ? "block" : "none";
    }

    // Inicializar la consola virtual del dashboard
    initConsoleLogs(user.username, user.rank);

    // Rellenar alias en formulario de recomendaciones
    const recomNameInput = document.getElementById("recom-name");
    if (recomNameInput && !recomNameInput.value) {
      recomNameInput.value = user.username;
    }

  } else {
    // Si no está logueado
    if (authTab) authTab.style.display = "flex";
    if (profileTab) profileTab.style.display = "none";
    if (rechargeTab) rechargeTab.style.display = "none";
    if (navLogo) navLogo.src = defaultLogo;
    
    // Reiniciar logos de inicio
    document.getElementById("login-logo").src = defaultLogo;
    document.getElementById("register-logo").src = defaultLogo;
  }
  
  // Actualizar historial de keys
  updateKeysHistory();
}

// Actualizar todos los displays de saldo en la página
function updateBalanceDisplay(user) {
  const balance = parseFloat(user.balance || 0).toFixed(2);
  const displays = [
    document.getElementById("user-balance-display"),
    document.getElementById("recharge-balance-display")
  ];
  displays.forEach(el => {
    if (el) el.innerText = `$${balance} USD`;
  });
}


// ==========================================
// 🖥 CONSOLA DIGITAL SAAS SIMULADA
// ==========================================
const consoleBox = document.getElementById("console-logs");

function getTimeString() {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

function addConsoleLog(message, type = 'info') {
  if (!consoleBox) return;

  const line = document.createElement("div");
  line.className = `console-line ${type}`;
  line.innerText = `[${getTimeString()}] ${message}`;
  
  consoleBox.appendChild(line);
  consoleBox.scrollTop = consoleBox.scrollHeight;
}

function initConsoleLogs(username, rank) {
  if (!consoleBox) return;

  consoleBox.innerHTML = ""; // Limpiar
  addConsoleLog("Iniciando consola virtual de inyección...", "info");
  addConsoleLog("Conectando con el servidor central Guate Xiter...", "info");
  addConsoleLog(`Usuario activo: ${username} (Rango: ${rank})`, "info");
  addConsoleLog("Integridad del archivo de seguridad: COMPLETO (OK)", "info");
  addConsoleLog("Esperando instrucción de inyección...", "warn");
}

function generateSimulatedHWID() {
  const chars = "ABCDEF0123456789";
  let hwid = "";
  for (let i = 0; i < 16; i++) {
    hwid += chars[Math.floor(Math.random() * chars.length)];
    if (i === 3 || i === 7 || i === 11) hwid += "-";
  }
  return hwid;
}

// Bucle para añadir eventos en consola aleatoriamente mientras esté logueado
setInterval(() => {
  if (isLoggedIn()) {
    const events = [
      { text: "Ping al servidor de licencias: 18ms", type: "info" },
      { text: "Bypass anti-firmas ejecutando en segundo plano...", type: "info" },
      { text: "Limpiador de memoria RAM virtual activado.", type: "info" },
      { text: "HWID verificado contra base de datos SaaS.", type: "info" },
      { text: "Estado del juego detectado: Esperando ejecución...", type: "warn" }
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    addConsoleLog(event.text, event.type);
  }
}, 15000);


// ==========================================
// 🔑 POOL DE LICENCIAS DE ACCESO POR TIER Y DURACIÓN
// ==========================================
// Pool de keys: bypass + panel (free, daily, weekly, biweekly, monthly)
// Las keys se cargan desde Firebase al iniciar. El pool por defecto está vacío.
let KEYS_POOL = {
  bypass: {
    free: [],
    daily: [],
    weekly: [],
    biweekly: [],
    monthly: []
  },
  panel: {
    free: [],
    daily: [],
    weekly: [],
    biweekly: [],
    monthly: []
  }
};

// Limpieza única del registro local de keys legado (SIN tocar Firebase)
(function clearLegacyClaimedKeysLocal() {
  if (localStorage.getItem("guate_keys_pool_cleared_v6")) return;
  localStorage.removeItem(CLAIMED_KEYS_KEY);
  localStorage.removeItem("guate_extra_keys_pool");
  // NOTA: Ya NO se borra Firebase — las keys del admin se preservan
  localStorage.setItem("guate_keys_pool_cleared_v6", "true");
})();

// 🔥 Guardar keys pool completo en Firebase (a través del API seguro)
async function firebaseSaveKeysPool() {
  try {
    await fetchSecureAPI("/api/admin", {
      action: "save_keys",
      keysPool: KEYS_POOL
    });
    console.log("%c🔥 Keys pool sincronizado mediante API segura", "color:#39ff14; font-weight:bold;");
  } catch (err) {
    console.error('Error guardando keys pool:', err);
  }
}

// 🔥 Cargar keys pool desde la API segura (solo admin)
async function firebaseLoadKeysPool() {
  if (!isLoggedIn()) return null;
  const user = getActiveUser();
  const isAdmin = user && ADMIN_USERNAMES.includes(user.username.toLowerCase());
  if (!isAdmin) return null;

  try {
    const data = await fetchSecureAPI("/api/admin", { action: "load_keys" });
    if (data.success && data.keysPool) {
      return data.keysPool;
    }
  } catch (err) {
    console.error('Error cargando keys pool desde API segura:', err);
  }
  return null;
}

// 🔥 Inicializar keys pool desde localStorage
const EXTRA_KEYS_STORAGE = "guate_extra_keys_pool";
const KEY_DURATIONS = ["free", "daily", "weekly", "biweekly", "monthly"];

function initKeysPool() {
  // Cargar keys de localStorage como respaldo temporal
  try {
    const saved = JSON.parse(localStorage.getItem(EXTRA_KEYS_STORAGE));
    if (saved && typeof saved === 'object') {
      ['bypass', 'panel'].forEach(type => {
        if (!saved[type]) return;
        KEY_DURATIONS.forEach(dur => {
          if (saved[type][dur] && Array.isArray(saved[type][dur])) {
            if (!KEYS_POOL[type]) KEYS_POOL[type] = {};
            if (!KEYS_POOL[type][dur]) KEYS_POOL[type][dur] = [];
            saved[type][dur].forEach(key => {
              if (!KEYS_POOL[type][dur].includes(key)) {
                KEYS_POOL[type][dur].push(key);
              }
            });
          }
        });
      });
    }
  } catch(e) {
    console.error("Error cargando keys extra locales:", e);
  }

  // Si es admin, cargar keys frescas desde el servidor
  const user = getActiveUser();
  const isAdmin = user && ADMIN_USERNAMES.includes(user.username.toLowerCase());
  if (isLoggedIn() && isAdmin) {
    firebaseLoadKeysPool().then(fbKeys => {
      if (fbKeys) {
        ['bypass', 'panel'].forEach(type => {
          if (!KEYS_POOL[type]) KEYS_POOL[type] = {};
          const typeData = fbKeys[type] || {};
          KEY_DURATIONS.forEach(dur => {
            if (typeData[dur] && Array.isArray(typeData[dur])) {
              KEYS_POOL[type][dur] = [...typeData[dur]];
            } else {
              KEYS_POOL[type][dur] = [];
            }
          });
        });
        localStorage.setItem(EXTRA_KEYS_STORAGE, JSON.stringify(KEYS_POOL));
        console.log("%c🔥 Keys pool cargado desde la API del servidor", "color:#39ff14; font-weight:bold;");
      }
    });
  }
}
initKeysPool();

function getProductDuration(productName) {
  const nameLower = productName.toLowerCase();
  if (nameLower.includes("15 día") || nameLower.includes("15 dia") || nameLower.includes("quincen")) return "biweekly";
  if (nameLower.includes("semanal") || nameLower.includes("semana")) return "weekly";
  if (nameLower.includes("mensual") || nameLower.includes("mes")) return "monthly";
  return "daily";
}

function getAvailableKey(keyType, duration) {
  // Verificar que el pool tiene keys para este tipo y duración
  if (!KEYS_POOL[keyType] || !KEYS_POOL[keyType][duration] || KEYS_POOL[keyType][duration].length === 0) {
    console.warn(`⚠️ No hay keys disponibles para ${keyType}/${duration}. Pool actual:`, JSON.stringify(KEYS_POOL[keyType]?.[duration]));
    return null;
  }

  // Obtener la primera key disponible y removerla del stock
  const key = KEYS_POOL[keyType][duration].shift();
  console.log(`🔑 Key asignada: ${key} (${keyType}/${duration}). Quedan: ${KEYS_POOL[keyType][duration].length}`);

  // Guardar de inmediato en localStorage y sincronizar con Firebase
  localStorage.setItem(EXTRA_KEYS_STORAGE, JSON.stringify(KEYS_POOL));
  firebaseSaveKeysPool()
    .then(() => console.log(`✅ Pool actualizado en Firebase tras asignar key ${keyType}/${duration}`))
    .catch(err => console.error(`❌ Error guardando pool en Firebase:`, err));

  return key;
}

async function generateLicenseKey() {
  clickSound();
  if (!isLoggedIn()) {
    alert("Inicia sesión para poder generar claves de licencia.");
    return;
  }

  const user = getActiveUser();

  if (user.licenseKey && user.licenseKey !== "VINCULA_TU_CUENTA_PARA_GENERAR") {
    alert("Ya has generado tu clave de licencia de Bypass.");
    return;
  }

  // Restricción: solo una demo gratis en total (Bypass o Panel)
  if (user.panelKey && user.panelKey !== "VINCULA_TU_CUENTA_PARA_GENERAR") {
    alert("Ya has obtenido una key de Panel gratis. Solo puedes elegir una opción gratis en tu cuenta (Bypass o Panel).");
    return;
  }

  try {
    showToast("⏳ Solicitando key Bypass gratis...", "info");
    const data = await fetchSecureAPI("/api/claim", {
      action: "free_demo",
      type: "bypass"
    });

    if (data.success && data.user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      document.getElementById("generated-key").innerText = data.key;
      addConsoleLog(`Nueva clave Bypass asignada: ${data.key}`, 'info');
      addConsoleLog("Actualiza la clave en tu cliente .exe para sincronizar.", 'warn');
      updateKeysHistory();
    }
  } catch (err) {
    console.error("Error al generar key gratis:", err);
    showToast("❌ " + err.message, "error");
  }
}

function copyLicenseKey() {
  clickSound();
  const keyText = document.getElementById("generated-key").innerText;
  
  if (keyText === "VINCULA_TU_CUENTA_PARA_GENERAR") {
    alert("Primero genera una licencia.");
    return;
  }

  navigator.clipboard.writeText(keyText).then(() => {
    alert("Clave de licencia copiada al portapapeles: " + keyText);
    if (isLoggedIn()) addConsoleLog("Clave de licencia copiada al portapapeles.", 'info');
  }).catch(err => {
    console.error("Error al copiar clave:", err);
  });
}

async function generatePanelKey() {
  clickSound();
  if (!isLoggedIn()) {
    alert("Inicia sesión para poder generar claves de Panel.");
    return;
  }

  const user = getActiveUser();

  if (user.panelKey && user.panelKey !== "VINCULA_TU_CUENTA_PARA_GENERAR") {
    alert("Ya has generado tu clave de Panel. Solo puedes obtener una.");
    document.getElementById("generated-panel-key").innerText = user.panelKey;
    return;
  }

  // Restricción: solo una demo gratis en total (Bypass o Panel)
  if (user.licenseKey && user.licenseKey !== "VINCULA_TU_CUENTA_PARA_GENERAR") {
    alert("Ya has obtenido una clave de Bypass gratis. Solo puedes elegir una opción gratis en tu cuenta (Bypass o Panel).");
    return;
  }

  try {
    showToast("⏳ Solicitando key de Panel gratis...", "info");
    const data = await fetchSecureAPI("/api/claim", {
      action: "free_demo",
      type: "panel"
    });

    if (data.success && data.user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      document.getElementById("generated-panel-key").innerText = data.key;
      addConsoleLog(`🛡 Nueva clave de Panel asignada: ${data.key}`, 'info');
      addConsoleLog("Ingresa esta clave en el campo KEY del Panel para activarlo.", 'warn');
      updateKeysHistory();
    }
  } catch (err) {
    console.error("Error al generar key gratis:", err);
    showToast("❌ " + err.message, "error");
  }
}

function copyPanelKey() {
  clickSound();
  const keyText = document.getElementById("generated-panel-key").innerText;

  if (keyText === "VINCULA_TU_CUENTA_PARA_GENERAR") {
    alert("Primero genera una clave de Panel.");
    return;
  }

  navigator.clipboard.writeText(keyText).then(() => {
    alert("Clave de Panel copiada al portapapeles: " + keyText);
    if (isLoggedIn()) addConsoleLog("🛡 Clave de Panel copiada al portapapeles.", 'info');
  }).catch(err => {
    console.error("Error al copiar clave de Panel:", err);
  });
}


// ==========================================
// 📦 SIMULACIÓN DE DESCARGAS DIGITALES
// ==========================================
let isDownloading = false;

function simulateDownload(fileName) {
  if (isDownloading) {
    alert("Ya hay una descarga simulada en progreso.");
    return;
  }

  isDownloading = true;
  const progressContainer = document.getElementById("download-progress-container");
  const progressBar = document.getElementById("download-progress-bar");
  const percentText = document.getElementById("download-percent");
  const fileNameText = document.getElementById("downloading-file-name");

  if (progressContainer && progressBar && percentText && fileNameText) {
    progressContainer.style.display = "block";
    fileNameText.innerText = `Descargando: ${fileName}...`;
    
    if (isLoggedIn()) {
      addConsoleLog(`Iniciando descarga simulada de: ${fileName}`, 'info');
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Completar descarga
        progressBar.style.width = "100%";
        percentText.innerText = "100%";
        
        setTimeout(() => {
          progressContainer.style.display = "none";
          progressBar.style.width = "0%";
          percentText.innerText = "0%";
          isDownloading = false;
          
          alert(`¡Descarga completada de: ${fileName}!`);

          if (isLoggedIn()) {
            const user = getActiveUser();
            user.downloads = (user.downloads || 0) + 1;
            
            // Guardar cambios
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            saveUserInDB(user);
            
            // Refrescar perfil
            updateUserState();
            addConsoleLog(`Archivo descargo con éxito: ${fileName}. Contador de descargas incrementado.`, 'info');
          }
        }, 800);
      } else {
        progressBar.style.width = `${progress}%`;
        percentText.innerText = `${progress}%`;
      }
    }, 100);
  }
}


// ==========================================
// 💰 SISTEMA DE COMPRAS CON SALDO + ENTREGA AUTOMÁTICA DE KEYS
// ==========================================

// Comprar con saldo: descuenta, asigna key, registra transacción
async function buyWithBalance(productName, price) {
  clickSound();

  if (!isLoggedIn()) {
    showToast("⚠️ Inicia sesión primero para comprar con saldo.", "warn");
    show('auth');
    return;
  }

  const user = getActiveUser();
  const balance = parseFloat(user.balance || 0);

  if (balance < price) {
    showToast(`❌ Saldo insuficiente. Tienes $${balance.toFixed(2)} y necesitas $${price.toFixed(2)}.`, "error");
    show('recharge');
    return;
  }

  // Confirmar compra
  if (!confirm(`¿Confirmas la compra de "${productName}" por $${price}.00 USD?\n\nSaldo actual: $${balance.toFixed(2)}`)) return;

  try {
    showToast("⏳ Procesando compra segura...", "info");

    const data = await fetchSecureAPI("/api/claim", {
      action: "buy",
      productName: productName,
      price: price
    });

    if (data.success && data.user) {
      // Guardar usuario actualizado en la sesión
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));

      // Refrescar UI
      updateUserState();
      updateTransactionHistory();

      // Mostrar modal de confirmación con las keys
      showPurchaseSuccessModal(productName, price, data.deliveredKeys);
      addConsoleLog(`✅ Compra exitosa: "${productName}" por $${price} USD (saldo restante: $${data.user.balance})`, 'info');
    }
  } catch (err) {
    console.error("Error al comprar:", err);
    showToast("❌ Error al procesar la compra: " + err.message, "error");
  }
}

// Funciones obsoletas por seguridad (ya gestionadas de forma segura en el servidor)
function assignBypassKey(user, duration = "daily") { return null; }
function assignPanelKey(user, duration = "daily") { return null; }

// Modal de compra exitosa con keys
function showPurchaseSuccessModal(productName, price, deliveredKeys) {
  // Crear modal dinámico
  const existing = document.getElementById("purchase-success-modal");
  if (existing) existing.remove();

  const isNoStock = !deliveredKeys || deliveredKeys.length === 0;

  let keysHTML = "";
  if (!isNoStock) {
    keysHTML = deliveredKeys.map(k => `
      <div style="background: rgba(57,255,20,0.08); border: 1px solid rgba(57,255,20,0.3); border-radius: 10px; padding: 15px; margin: 10px 0; text-align:left;">
        <div style="color:#39ff14; font-size:13px; margin-bottom:6px;">🔑 Tu Key de ${k.type}:</div>
        <div style="font-family: 'Orbitron', monospace; color: var(--secondary); font-size: 13px; word-break: break-all; letter-spacing: 1px;">${k.key}</div>
        <button onclick="copyText('${k.key}')" style="margin-top:8px; background:rgba(0,240,255,0.15); border:1px solid rgba(0,240,255,0.3); color:var(--secondary); padding:5px 14px; border-radius:6px; cursor:pointer; font-size:12px;">📋 Copiar</button>
      </div>
    `).join('');
  } else {
    keysHTML = `
      <div style="background: rgba(255,170,0,0.08); border: 1px solid rgba(255,170,0,0.3); border-radius: 10px; padding: 15px; margin: 10px 0; text-align:left;">
        <p style="color: #ffaa00; font-size: 12.5px; line-height: 1.4; margin: 0;">
          ⚠️ <strong>Aviso de Stock:</strong> Tu compra se procesó correctamente y se descontó de tu saldo, pero actualmente nos encontramos sin claves automáticas en stock para este plan. El administrador te enviará tu clave manualmente a la brevedad.
        </p>
      </div>
    `;
  }

  const modal = document.createElement("div");
  modal.id = "purchase-success-modal";
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  `;
  modal.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #0d0d1a, #11111f);
      border: 1px solid ${isNoStock ? 'rgba(255,170,0,0.4)' : 'rgba(57,255,20,0.4)'};
      border-radius: 20px; padding: 35px; max-width: 480px; width: 100%;
      box-shadow: 0 0 40px ${isNoStock ? 'rgba(255,170,0,0.2)' : 'rgba(57,255,20,0.2)'}; text-align: center;
    ">
      <div style="font-size: 3rem; margin-bottom: 10px;">${isNoStock ? '⚠️' : '✅'}</div>
      <h3 style="color: ${isNoStock ? '#ffaa00' : '#39ff14'}; font-family: 'Orbitron', sans-serif; margin-bottom: 6px;">
        ${isNoStock ? '¡COMPRA REGISTRADA!' : '¡COMPRA EXITOSA!'}
      </h3>
      <p style="color: var(--text-muted); margin-bottom: 5px;">${productName}</p>
      <p style="color: var(--secondary); font-family: 'Orbitron'; font-size: 1.3rem; margin-bottom: 20px;">-$${price}.00 USD</p>
      <div style="margin-bottom: 20px;">
        ${keysHTML}
      </div>
      <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 20px;">
        ${isNoStock ? '📌 El administrador ha sido notificado y te asignará la clave manualmente.' : '📌 Ve a <strong>Mi Perfil → Generador de Licencias</strong> para ver todas tus claves en cualquier momento.'}
      </p>
      <button onclick="document.getElementById('purchase-success-modal').remove(); show('profile');"
        style="background: linear-gradient(135deg, ${isNoStock ? '#ffaa00, #ff5500' : '#39ff14, #00f0ff'}); color: #000; border: none;
        padding: 12px 30px; border-radius: 10px; font-family: 'Orbitron'; font-weight: bold;
        cursor: pointer; font-size: 14px; width: 100%;">
        Ver Mi Perfil
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("✅ Clave copiada al portapapeles!", "success");
  });
}

// Actualizar historial de transacciones en el perfil
function updateTransactionHistory() {
  const container = document.getElementById("transaction-history");
  if (!container) return;
  
  if (!isLoggedIn()) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">Inicia sesión para ver el historial.</p>`;
    return;
  }

  const user = getActiveUser();
  const purchases = user.purchases || [];

  if (purchases.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">No hay transacciones aún.</p>`;
    return;
  }

  container.innerHTML = purchases.slice(0, 10).map(p => `
    <div style="display:flex; justify-content:space-between; align-items:center;
      padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 13px;">
      <div>
        <div style="color: var(--text-primary); font-weight: 600;">${p.product}</div>
        <div style="color: var(--text-muted); font-size: 11px;">${p.date} · ${p.method}</div>
      </div>
      <div style="color: #ff4444; font-family: 'Orbitron'; font-weight: bold;">-$${p.price}</div>
    </div>
  `).join('');
}

// Actualizar historial de keys adquiridas en el perfil
function updateKeysHistory() {
  const container = document.getElementById("keys-history");
  if (!container) return;

  if (!isLoggedIn()) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">Inicia sesión para ver tu historial de keys.</p>`;
    return;
  }

  const user = getActiveUser();
  let keysList = [];

  // 1. Claves del perfil generadas manualmente
  if (user.licenseKey && user.licenseKey !== "VINCULA_TU_CUENTA_PARA_GENERAR" && !user.licenseKey.includes("DEV")) {
    keysList.push({
      type: "Bypass (Perfil)",
      key: user.licenseKey,
      source: "Generada desde Perfil",
      date: user.regDate || "N/A"
    });
  }
  if (user.panelKey && user.panelKey !== "VINCULA_TU_CUENTA_PARA_GENERAR" && !user.panelKey.includes("DEV")) {
    keysList.push({
      type: "Panel (Perfil)",
      key: user.panelKey,
      source: "Generada desde Perfil",
      date: user.regDate || "N/A"
    });
  }

  // 2. Claves de compras exitosas
  const purchases = user.purchases || [];
  purchases.forEach(p => {
    if (p.keys && p.keys.length > 0) {
      p.keys.forEach(k => {
        keysList.push({
          type: k.type,
          key: k.key,
          source: p.product,
          date: p.date.split(',')[0] // solo la fecha
        });
      });
    }
  });

  if (keysList.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">No hay keys adquiridas aún.</p>`;
    return;
  }

  container.innerHTML = keysList.map(k => `
    <div style="display:flex; justify-content:space-between; align-items:center;
      padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 13px; gap: 10px;">
      <div style="flex: 1; min-width: 0; text-align: left;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
          <span class="rank-badge" style="background: ${k.type.includes('Panel') ? 'linear-gradient(135deg, #ff00aa, #8e2de2)' : 'linear-gradient(135deg, #00f0ff, #8e2de2)'}; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
            ${k.type}
          </span>
          <span style="color: var(--text-muted); font-size: 11px;">${k.date}</span>
        </div>
        <div style="font-family: 'Orbitron', monospace; color: var(--secondary); font-size: 12px; word-break: break-all; letter-spacing: 0.5px; text-shadow: 0 0 5px rgba(0, 240, 255, 0.2);">
          ${k.key}
        </div>
        <div style="color: var(--text-muted); font-size: 10px; margin-top: 2px;">Origen: ${k.source}</div>
      </div>
      <button onclick="copyText('${k.key}')" 
        style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); 
        color: var(--secondary); padding: 6px 12px; border-radius: 6px; cursor: pointer; 
        font-size: 12px; font-weight: bold; white-space: nowrap; transition: all 0.2s;"
        onmouseover="this.style.background='rgba(0, 240, 255, 0.2)'"
        onmouseout="this.style.background='rgba(0, 240, 255, 0.1)'">
        📋 Copiar
      </button>
    </div>
  `).join('');
}


// ==========================================
// 🅿 SISTEMA DE PAGO CON PAYPAL.ME (TU PAYPAL REAL)
// ==========================================

// Abrir PayPal para comprar un producto directo
function openPayPalProduct(productName, price) {
  clickSound();

  if (!isLoggedIn()) {
    showToast("⚠️ Inicia sesión primero para comprar.", "warn");
    show('auth');
    return;
  }

  // Nota: PayPal.me /amount redirige al pago
  const paypalURL = `${PAYPAL_ME}/${price}USD`;
  
  const existing = document.getElementById("paypal-product-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "paypal-product-modal";
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  `;
  modal.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #0d0d1a, #11111f);
      border: 1px solid rgba(0,112,240,0.5); border-radius: 20px; padding: 35px;
      max-width: 460px; width: 100%; box-shadow: 0 0 40px rgba(0,112,240,0.2); text-align: center;
    ">
      <div style="font-size: 3rem; margin-bottom: 10px;">🅿</div>
      <h3 style="color: #009cde; font-family: 'Orbitron', sans-serif; margin-bottom: 6px;">PAGAR CON PAYPAL</h3>
      <p style="color: var(--text-muted); margin-bottom: 5px;">${productName}</p>
      <p style="color: #009cde; font-family: 'Orbitron'; font-size: 1.5rem; margin-bottom: 20px; font-weight: bold;">$${price}.00 USD</p>

      <div style="background: rgba(255,170,0,0.1); border: 1px solid rgba(255,170,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: left;">
        <p style="color: #ffaa00; font-size: 13px; margin: 0 0 8px 0;"><strong>📋 Instrucciones:</strong></p>
        <ol style="color: var(--text-muted); font-size: 12px; padding-left: 18px; margin: 0; line-height: 1.8;">
          <li>Haz clic en "Pagar con PayPal" abajo</li>
          <li>Completa el pago de <strong style="color:#009cde;">$${price} USD</strong></li>
          <li>Toma captura del comprobante de pago</li>
          <li>Envía la captura por WhatsApp: <strong style="color: #25d366;">+502 3250 9982</strong></li>
          <li>El admin recargará tu saldo y recibirás tu key</li>
        </ol>
      </div>

      <a href="${paypalURL}" target="_blank" onclick="document.getElementById('paypal-product-modal').remove();"
        style="display: block; background: linear-gradient(135deg, #009cde, #003087);
        color: white; text-decoration: none; padding: 15px; border-radius: 12px;
        font-family: 'Orbitron'; font-weight: bold; font-size: 15px;
        box-shadow: 0 0 20px rgba(0,156,222,0.4); margin-bottom: 12px;">
        🅿 Pagar $${price} USD con PayPal
      </a>
      <a href="https://wa.me/50232509982?text=Hola!%20Acabo%20de%20pagar%20$${price}%20por%20${encodeURIComponent(productName)}%20en%20PayPal.%20Adjunto%20comprobante." 
        target="_blank"
        style="display: block; background: rgba(37,211,102,0.15); border: 1px solid rgba(37,211,102,0.4);
        color: #25d366; text-decoration: none; padding: 12px; border-radius: 12px;
        font-size: 13px; margin-bottom: 12px;">
        📱 Enviar comprobante por WhatsApp
      </a>
      <button onclick="document.getElementById('paypal-product-modal').remove();"
        style="background: transparent; border: 1px solid rgba(255,255,255,0.15); color: var(--text-muted);
        padding: 10px 25px; border-radius: 10px; cursor: pointer; font-size: 13px; width: 100%;">
        Cancelar
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}


// ==========================================
// 💳 SISTEMA DE RECARGA CON PAYPAL.ME
// ==========================================

let selectedRechargeAmount = 0;

function selectRechargePackage(el, amount) {
  clickSound();
  selectedRechargeAmount = amount;

  // Resaltar la tarjeta seleccionada
  document.querySelectorAll(".recharge-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");

  // Mostrar texto del monto seleccionado
  const textEl = document.getElementById("paypal-selected-amount-text");
  if (textEl) textEl.innerText = `Paquete seleccionado: $${amount} USD. Haz clic abajo para pagar.`;

  // Mostrar botón de pago PayPal real
  const container = document.getElementById("paypal-recharge-buttons");
  if (!container) return;

  let bonusAmount = 0;
  if (amount === 15) bonusAmount = 1.5;
  else if (amount === 30) bonusAmount = 3.5;
  else if (amount === 50) bonusAmount = 7;
  else if (amount === 90) bonusAmount = 15;
  const totalCredit = amount + bonusAmount;

  container.innerHTML = `
    <div style="text-align: center;">
      <a href="${PAYPAL_ME}/${amount}USD" target="_blank" id="paypal-recharge-link"
        style="display: block; background: linear-gradient(135deg, #009cde, #003087);
        color: white; text-decoration: none; padding: 16px; border-radius: 14px;
        font-family: 'Orbitron'; font-weight: bold; font-size: 15px;
        box-shadow: 0 0 25px rgba(0,156,222,0.4); margin-bottom: 12px;
        transition: transform 0.2s, box-shadow 0.2s;"
        onmouseover="this.style.transform='scale(1.03)'; this.style.boxShadow='0 0 35px rgba(0,156,222,0.6)';"
        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 25px rgba(0,156,222,0.4)';">
        🅿 Pagar $${amount} USD con PayPal
      </a>
      <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 12px;">
        Después de pagar → envía captura por WhatsApp y el admin acredita tu saldo de
        <strong style="color: #39ff14;">$${totalCredit} USD</strong> ${bonusAmount > 0 ? `(+$${bonusAmount} bonus)` : ''} 
      </p>
      <a href="https://wa.me/50232509982?text=Hola!%20Pague%20$${amount}%20USD%20para%20recargar%20mi%20saldo.%20Adjunto%20comprobante%20de%20PayPal." 
        target="_blank"
        style="display: block; background: rgba(37,211,102,0.12); border: 1px solid rgba(37,211,102,0.35);
        color: #25d366; text-decoration: none; padding: 12px; border-radius: 12px;
        font-size: 13px; margin-bottom: 10px;">
        📱 Enviar comprobante de pago por WhatsApp
      </a>
    </div>
  `;
}


// ==========================================
// 🔧 PANEL DE ADMINISTRADOR (Solo usuario admin)
// ==========================================

async function showAdminPanel() {
  if (!isLoggedIn()) return;
  const user = getActiveUser();
  const u = user.username.toLowerCase();
  if (!ADMIN_USERNAMES.includes(u)) {
    showToast("❌ Solo el administrador puede acceder a este panel.", "error");
    return;
  }

  const existing = document.getElementById("admin-modal");
  if (existing) existing.remove();

  // 🔥 Cargar usuarios desde la API segura en el servidor
  let users = [];
  try {
    const data = await fetchSecureAPI("/api/admin", { action: "load_users" });
    if (data.success && data.users) {
      users = data.users;
    }
  } catch (err) {
    console.error("Error al cargar usuarios para admin:", err);
    showToast("⚠️ Error al cargar usuarios: " + err.message, "error");
  }

  // 🔥 Cargar keys pool fresquito desde la API del servidor
  try {
    const fbKeys = await firebaseLoadKeysPool();
    if (fbKeys) {
      ['bypass', 'panel'].forEach(type => {
        if (!KEYS_POOL[type]) KEYS_POOL[type] = {};
        const typeData = fbKeys[type] || {};
        KEY_DURATIONS.forEach(dur => {
          if (typeData[dur] && Array.isArray(typeData[dur])) {
            KEYS_POOL[type][dur] = [...typeData[dur]];
          } else {
            KEYS_POOL[type][dur] = [];
          }
        });
      });
      localStorage.setItem(EXTRA_KEYS_STORAGE, JSON.stringify(KEYS_POOL));
    }
  } catch (err) {
    console.error("Error al sincronizar keys pool para el panel de admin:", err);
  }
  // Calcular estadísticas de keys disponibles
  const keyStats = {
    bypass: { free: 0, daily: 0, weekly: 0, biweekly: 0, monthly: 0 },
    panel: { free: 0, daily: 0, weekly: 0, biweekly: 0, monthly: 0 }
  };

  const types = ["bypass", "panel"];
  const durations = ["free", "daily", "weekly", "biweekly", "monthly"];
  types.forEach(type => {
    durations.forEach(dur => {
      const pool = KEYS_POOL[type] ? KEYS_POOL[type][dur] : [];
      keyStats[type][dur] = Array.isArray(pool) ? pool.length : 0;
    });
  });

  const userListHTML = users.filter(u => u.username.toLowerCase() !== "xdavid" && u.username.toLowerCase() !== "luisdavid").map(u => `
    <div data-admin-user-row="${u.username}" style="display:flex; justify-content:space-between; align-items:center; padding:12px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.07); font-size:13px; gap: 10px; flex-wrap: wrap;">
      <div>
        <strong style="color: var(--secondary);">${u.username}</strong>
        <span style="color: var(--text-muted); font-size:11px;"> · Saldo: <span style="color:#39ff14; font-weight:bold;">$${parseFloat(u.balance||0).toFixed(2)}</span></span>
      </div>
      <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
        <input type="number" id="add-balance-${u.username}" placeholder="$USD" min="0" step="0.01"
          style="width:75px; background: rgba(0,240,255,0.08); border: 1px solid rgba(0,240,255,0.3);
          color: var(--secondary); padding: 5px 8px; border-radius:6px; font-size:12px; height: 30px; box-sizing: border-box;">
        <button onclick="adminAddBalance('${u.username}')"
          style="background: rgba(57,255,20,0.15); border: 1px solid rgba(57,255,20,0.35);
          color: #39ff14; padding: 0 10px; border-radius:6px; cursor:pointer; font-size:12px; height: 30px; white-space:nowrap;">
          ➕ Recargar
        </button>
        <button onclick="adminSubtractBalance('${u.username}')"
          style="background: rgba(255,51,51,0.15); border: 1px solid rgba(255,51,51,0.35);
          color: #ff3333; padding: 0 10px; border-radius:6px; cursor:pointer; font-size:12px; height: 30px; white-space:nowrap;">
          ➖ Quitar
        </button>
      </div>
    </div>
  `).join('');

  const recommendations = getRecommendations();
  const recomListHTML = recommendations.map(r => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px;
      border-bottom: 1px solid rgba(255,255,255,0.07); font-size:12px; gap: 10px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px;">
        <strong style="color: var(--secondary);">${escapeHTML(r.name)}</strong> 
        <span style="color:#ffaa00;">${"★".repeat(r.rating)}</span>
        <p style="margin:4px 0 0 0; color:#e2e8f0; font-size:11.5px; line-height:1.4;">${escapeHTML(r.message)}</p>
      </div>
      <div style="display:flex; gap:6px;">
        <button onclick="adminDeleteRecom(${r.id})"
          style="background: rgba(255,51,51,0.15); border: 1px solid rgba(255,51,51,0.35);
          color: #ff3333; padding: 5px 8px; border-radius:6px; cursor:pointer; font-size:11px; white-space:nowrap;">
          🗑 Eliminar
        </button>
      </div>
    </div>
  `).join('');

  // 📜 Recopilar compras de todos los usuarios registrados
  const allPurchases = [];
  users.forEach(u => {
    if (u.purchases && Array.isArray(u.purchases)) {
      u.purchases.forEach(p => {
        allPurchases.push({
          username: u.username,
          date: p.date,
          timestamp: p.timestamp || 0,
          product: p.product,
          price: p.price,
          method: p.method || "Saldo",
          keys: p.keys || []
        });
      });
    }
  });

  // Ordenar cronológicamente (más recientes primero)
  allPurchases.sort((a, b) => {
    const timeA = a.timestamp || new Date(a.date).getTime() || 0;
    const timeB = b.timestamp || new Date(b.date).getTime() || 0;
    return timeB - timeA;
  });

  const purchasesListHTML = allPurchases.map(p => {
    let keysText = `<span style="color: var(--text-muted); font-style: italic;">Sin keys asignadas (entregada manualmente)</span>`;
    if (p.keys && p.keys.length > 0) {
      keysText = p.keys.map(k => `
        <div style="margin-top: 4px; display: flex; align-items: center; gap: 8px;">
          <strong style="color: var(--primary); font-size: 11px;">${k.type}:</strong>
          <code style="font-family: 'Orbitron', monospace; color: var(--secondary); background: rgba(0,0,0,0.4); padding: 3px 8px; border-radius: 6px; font-size: 12px; border: 1px solid rgba(0,240,255,0.25); word-break: break-all; letter-spacing: 0.5px;">${k.key}</code>
          <button onclick="navigator.clipboard.writeText('${k.key}'); alert('Key copiada: ${k.key}');" style="background: rgba(0,240,255,0.15); border: 1px solid rgba(0,240,255,0.3); color: var(--secondary); padding: 2px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;">Copiar</button>
        </div>
      `).join('');
    }
    return `
      <div style="padding: 12px 15px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.01); border-radius: 8px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 10px;">
          <div>
            <span style="color: var(--secondary); font-weight: bold; font-size: 14px;">👤 ${p.username}</span>
            <span style="color: var(--text-muted); font-size: 11px; margin-left: 8px;">📅 ${p.date}</span>
          </div>
          <span style="color: #39ff14; font-weight: bold; font-family: 'Orbitron', sans-serif; font-size: 13.5px;">$${parseFloat(p.price || 0).toFixed(2)} USD</span>
        </div>
        <div style="color: #e2e8f0; font-size: 12px; margin-bottom: 8px;">
          <strong>Producto:</strong> <span style="color: var(--accent);">${p.product}</span> <span style="color: var(--text-muted); font-size: 10.5px;">(Vía ${p.method})</span>
        </div>
        <div style="border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 8px; margin-top: 8px;">
          ${keysText}
        </div>
      </div>
    `;
  }).join('');

  const modal = document.createElement("div");
  modal.id = "admin-modal";
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  `;
  modal.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #0d0d1a, #11111f);
      border: 1px solid rgba(255,0,170,0.4); border-radius: 20px; padding: 25px 30px;
      max-width: 600px; width: 100%; max-height: 85vh; overflow-y: auto;
      box-shadow: 0 0 40px rgba(255,0,170,0.2);
    ">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3 style="color: var(--primary); font-family:'Orbitron'; margin:0;">🔧 PANEL ADMIN</h3>
        <button onclick="document.getElementById('admin-modal').remove();"
          style="background:transparent; border:1px solid rgba(255,255,255,0.2); color:white;
          padding:5px 12px; border-radius:6px; cursor:pointer;">✕</button>
      </div>
      
      <!-- Pestañas de Administración -->
      <div class="admin-tabs" style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:15px;">
        <button class="admin-tab-btn active" onclick="switchAdminTab('users')" style="flex:1; min-width:80px;">👥 Usuarios</button>
        <button class="admin-tab-btn" onclick="switchAdminTab('keys')" style="flex:1; min-width:80px;">🔑 Keys Pool</button>
        <button class="admin-tab-btn" onclick="switchAdminTab('free_keys')" style="flex:1; min-width:80px;">🎁 Keys Gratis</button>
        <button class="admin-tab-btn" onclick="switchAdminTab('purchases')" style="flex:1; min-width:80px;">📜 Ventas</button>
        <button class="admin-tab-btn" onclick="switchAdminTab('products')" style="flex:1; min-width:80px;">🛍️ Productos</button>
        <button class="admin-tab-btn" onclick="switchAdminTab('background')" style="flex:1; min-width:80px;">🖼️ Fondo</button>
        <button class="admin-tab-btn" onclick="switchAdminTab('recoms')" style="flex:1; min-width:80px;">💬 Moderación</button>
        <button class="admin-tab-btn" onclick="switchAdminTab('music')" style="flex:1; min-width:80px;">🎵 Música</button>
        <button class="admin-tab-btn" onclick="switchAdminTab('ia_config')" style="flex:1; min-width:80px;">🤖 IA Config</button>
        <button class="admin-tab-btn" onclick="switchAdminTab('reset_db')" style="flex:1; min-width:80px;">🧹 Reiniciar DB</button>
      </div>
      
      <!-- SECCIÓN USUARIOS -->
      <div id="admin-sec-users" class="admin-section active">
        <p style="color: var(--text-muted); font-size:12px; margin-bottom:15px;">
          Recarga o quita saldo a los usuarios. Los cambios se sincronizarán directamente en la base de datos de Firebase.
        </p>
        <div style="position: relative; margin-bottom: 15px;">
          <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 16px; color: var(--secondary); pointer-events: none;">🔍</span>
          <input type="text" id="admin-user-search" class="input-glass" placeholder="Buscar usuario..." oninput="adminFilterUsers()" style="width: 100%; padding-left: 38px; box-sizing: border-box; font-size: 13px;">
        </div>
        <div id="admin-users-list-container" class="custom-scroll" style="max-height: 300px; overflow-y: auto;">
          ${userListHTML || `<p style="color:var(--text-muted); text-align:center;">No hay otros usuarios registrados.</p>`}
        </div>
      </div>

      <!-- SECCIÓN KEYS POOL (GESTIÓN DE STOCK DE PAGO) -->
      <div id="admin-sec-keys" class="admin-section">
        <p style="color: var(--text-muted); font-size:12px; margin-bottom:15px;">
          Gestiona el stock de claves de Bypass e Inyectores Panel de pago. Agrega nuevas keys al pool para entrega automática.
        </p>
        
        <!-- Estadísticas de Stock -->
        <h4 style="color: var(--secondary); margin-bottom: 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">📊 Stock Disponible</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div style="border: 1px solid rgba(0, 240, 255, 0.2); padding: 12px; border-radius: 12px; background: rgba(0,0,0,0.2);">
            <div style="color: var(--secondary); font-weight:bold; font-size:12.5px; border-bottom: 1px dashed rgba(0,240,255,0.2); padding-bottom:4px; margin-bottom:6px;">🔑 BYPASS KEYS</div>
            <div style="font-size:12px; display:flex; flex-direction:column; gap:4px;">
              <div style="display:flex; justify-content:space-between;"><span>Día (Daily):</span><strong style="color:#39ff14;">${keyStats.bypass.daily} disp.</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Semana (Weekly):</span><strong style="color:#39ff14;">${keyStats.bypass.weekly} disp.</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>15 Días (Biweekly):</span><strong style="color:#39ff14;">${keyStats.bypass.biweekly} disp.</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Mes (Monthly):</span><strong style="color:#39ff14;">${keyStats.bypass.monthly} disp.</strong></div>
            </div>
          </div>
          <div style="border: 1px solid rgba(255, 0, 170, 0.2); padding: 12px; border-radius: 12px; background: rgba(0,0,0,0.2);">
            <div style="color: var(--primary); font-weight:bold; font-size:12.5px; border-bottom: 1px dashed rgba(255,0,170,0.2); padding-bottom:4px; margin-bottom:6px;">🛡️ PANEL KEYS</div>
            <div style="font-size:12px; display:flex; flex-direction:column; gap:4px;">
              <div style="display:flex; justify-content:space-between;"><span>Día (Daily):</span><strong style="color:#39ff14;">${keyStats.panel.daily} disp.</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Semana (Weekly):</span><strong style="color:#39ff14;">${keyStats.panel.weekly} disp.</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>15 Días (Biweekly):</span><strong style="color:#39ff14;">${keyStats.panel.biweekly} disp.</strong></div>
              <div style="display:flex; justify-content:space-between;"><span>Mes (Monthly):</span><strong style="color:#39ff14;">${keyStats.panel.monthly} disp.</strong></div>
            </div>
          </div>
        </div>

        <!-- Formulario para agregar Keys -->
        <h4 style="color: var(--primary); margin-bottom: 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">➕ Agregar Nuevas Keys al Stock</h4>
        <div style="border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; background: rgba(0,0,0,0.25);">
          <div class="admin-form-group">
            <label>Tipo de Clave</label>
            <select id="admin-addkey-type" class="admin-select">
              <option value="bypass">🔑 Clave de Bypass</option>
              <option value="panel">🛡️ Clave de Panel</option>
            </select>
          </div>
          <div class="admin-form-group" style="margin-top: 10px;">
            <label>Duración</label>
            <select id="admin-addkey-duration" class="admin-select">
              <option value="daily">Día (Daily)</option>
              <option value="weekly">Semana (Weekly)</option>
              <option value="biweekly">15 Días (Biweekly)</option>
              <option value="monthly">Mes (Monthly)</option>
            </select>
          </div>
          <div class="admin-form-group" style="margin-top: 10px;">
            <label>Escribe la Key o pega varias (una por línea)</label>
            <textarea id="admin-addkey-content" class="admin-textarea" placeholder="GuateXiter-XXXXXX&#10;GuateXiter-YYYYYY" style="height: 100px; font-family: monospace;"></textarea>
          </div>
          <button onclick="adminAddKeysToPool()" class="btn" style="width: 100%; margin-top: 10px; background: linear-gradient(135deg, var(--secondary), var(--primary));">🚀 Cargar Keys al Stock</button>
        </div>

        <h4 style="color: var(--primary); margin: 20px 0 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">❌ Eliminar Keys del Stock</h4>
        <div style="border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; background: rgba(0,0,0,0.25);">
          <div class="admin-form-group">
            <label>Tipo de Clave</label>
            <select id="admin-deletekey-type" class="admin-select">
              <option value="bypass">🔑 Clave de Bypass</option>
              <option value="panel">🛡️ Clave de Panel</option>
            </select>
          </div>
          <div class="admin-form-group" style="margin-top: 10px;">
            <label>Duración</label>
            <select id="admin-deletekey-duration" class="admin-select">
              <option value="daily">Día (Daily)</option>
              <option value="weekly">Semana (Weekly)</option>
              <option value="biweekly">15 Días (Biweekly)</option>
              <option value="monthly">Mes (Monthly)</option>
            </select>
          </div>
          <p style="font-size:12px; color:var(--text-muted); margin-top: 10px; line-height:1.4;">Esta acción eliminará todas las keys de la categoría seleccionada del stock. No se requiere pegar ninguna key.</p>
          <button onclick="adminDeleteKeysFromPool()" class="btn" style="width: 100%; margin-top: 10px; background: linear-gradient(135deg, #ff2e63, #ff6b81);">🗑️ Eliminar Todas las Keys del Stock</button>
        </div>
      </div>

      <!-- SECCIÓN KEYS GRATIS (GESTIÓN EXCLUSIVA DE DEMOS) -->
      <div id="admin-sec-free_keys" class="admin-section">
        <p style="color: var(--text-muted); font-size:12px; margin-bottom:15px;">
          Gestiona el stock de claves de Bypass e Inyectores Panel gratuitas (trials) que los usuarios generan desde su perfil.
        </p>
        
        <!-- Estadísticas de Stock Gratis -->
        <h4 style="color: var(--secondary); margin-bottom: 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">📊 Stock Gratis Disponible</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div style="border: 1px solid rgba(0, 240, 255, 0.2); padding: 12px; border-radius: 12px; background: rgba(0,0,0,0.2); text-align:center;">
            <div style="color: var(--secondary); font-weight:bold; font-size:12.5px; border-bottom: 1px dashed rgba(0,240,255,0.2); padding-bottom:4px; margin-bottom:6px;">🔑 BYPASS GRATIS</div>
            <div style="font-size:22px; font-weight:bold; color:#39ff14; font-family:'Orbitron';">${keyStats.bypass.free} <span style="font-size:11px; color:var(--text-muted);">disp.</span></div>
          </div>
          <div style="border: 1px solid rgba(255, 0, 170, 0.2); padding: 12px; border-radius: 12px; background: rgba(0,0,0,0.2); text-align:center;">
            <div style="color: var(--primary); font-weight:bold; font-size:12.5px; border-bottom: 1px dashed rgba(255,0,170,0.2); padding-bottom:4px; margin-bottom:6px;">🛡️ PANEL GRATIS</div>
            <div style="font-size:22px; font-weight:bold; color:#39ff14; font-family:'Orbitron';">${keyStats.panel.free} <span style="font-size:11px; color:var(--text-muted);">disp.</span></div>
          </div>
        </div>

        <!-- Formulario para agregar Keys Gratis -->
        <h4 style="color: var(--primary); margin-bottom: 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">➕ Cargar Nuevas Keys Gratis</h4>
        <div style="border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; background: rgba(0,0,0,0.25);">
          <div class="admin-form-group">
            <label>Tipo de Clave Gratis</label>
            <select id="admin-addfreekey-type" class="admin-select">
              <option value="bypass">🔑 Clave Bypass Gratis</option>
              <option value="panel">🛡️ Clave Panel Gratis</option>
            </select>
          </div>
          <div class="admin-form-group" style="margin-top: 10px;">
            <label>Escribe la Key o pega varias (una por línea)</label>
            <textarea id="admin-addfreekey-content" class="admin-textarea" placeholder="GuateFree-XXXXXX&#10;GuateFree-YYYYYY" style="height: 100px; font-family: monospace;"></textarea>
          </div>
          <button onclick="adminAddFreeKeysToPool()" class="btn" style="width: 100%; margin-top: 10px; background: linear-gradient(135deg, var(--accent), var(--primary));">🚀 Cargar Keys Gratis al Stock</button>
        </div>
      </div>

      <!-- SECCIÓN HISTORIAL DE VENTAS (COMPRAS DE USUARIOS) -->
      <div id="admin-sec-purchases" class="admin-section">
        <p style="color: var(--text-muted); font-size:12px; margin-bottom:15px;">
          Listado de compras y activaciones de licencias de todos los usuarios registrados.
        </p>
        <div class="custom-scroll" style="max-height: 350px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px; background: rgba(0,0,0,0.25); margin-bottom:15px;">
          ${purchasesListHTML || `<p style="color:var(--text-muted); text-align:center; font-size:12px; padding: 20px 0;">No hay compras registradas en el historial.</p>`}
        </div>
      </div>

      <!-- SECCIÓN PRODUCTOS -->
      <div id="admin-sec-products" class="admin-section">
        <p style="color: var(--text-muted); font-size:12px; margin-bottom:15px;">
          Modifica los detalles y precios de los 8 productos del catálogo dinámico "Comprar".
        </p>
        
        <div class="admin-form-group">
          <label>Seleccionar Producto a Editar</label>
          <select id="admin-product-select" class="admin-select" onchange="adminLoadProductToEdit()">
            <!-- Rellenado con JS -->
          </select>
        </div>

        <div id="admin-product-editor-fields" style="border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; background: rgba(0,0,0,0.25);">
          <div class="admin-form-group">
            <label>Título del Producto / Plan</label>
            <input type="text" id="admin-prod-name" class="input-glass">
          </div>
          <div class="admin-form-group">
            <label>Descripción Corta</label>
            <textarea id="admin-prod-desc" class="admin-textarea"></textarea>
          </div>
          <div class="admin-form-group">
            <label>Precio (USD)</label>
            <input type="number" id="admin-prod-price" class="input-glass" min="0" step="0.01">
          </div>
          <div class="admin-form-group">
            <label>URL de la Imagen</label>
            <input type="url" id="admin-prod-image" class="input-glass">
          </div>
          <div class="admin-form-group">
            <label>Tipo de Entrega Key</label>
            <select id="admin-prod-keytype" class="admin-select">
              <option value="bypass">🔑 Clave Bypass</option>
              <option value="panel">🛡️ Clave Panel</option>
            </select>
          </div>
          <div class="admin-form-group">
            <label>Categoría del Producto</label>
            <select id="admin-prod-category" class="admin-select">
              <option value="Panel">🛡️ Panel</option>
              <option value="Bypass">🔑 Bypass</option>
            </select>
          </div>
          <button onclick="adminSaveProduct()" class="btn" style="width: 100%; margin-top: 10px; background: linear-gradient(135deg, var(--secondary), var(--accent));">💾 Guardar Cambios del Producto</button>
        </div>
      </div>

      <!-- SECCIÓN FONDO -->
      <div id="admin-sec-background" class="admin-section">
        <p style="color: var(--text-muted); font-size:12px; margin-bottom:15px;">
          Ingresa un enlace (URL) de imagen para cambiar el fondo de pantalla del sitio web instantáneamente.
        </p>
        <div class="admin-form-group">
          <label>Enlace de la Imagen (URL)</label>
          <input type="url" id="admin-bg-url-input" class="input-glass" placeholder="https://..." value="${localStorage.getItem(BG_URL_KEY) || ''}">
        </div>
        <button onclick="adminSaveBackground()" class="btn" style="width: 100%; margin-top: 10px;">💾 Guardar Fondo</button>
      </div>

      <!-- SECCIÓN RECOMENDACIONES -->
      <div id="admin-sec-recoms" class="admin-section">
        <p style="color: var(--text-muted); font-size:12px; margin-bottom:15px;">
          Modera las opiniones y recomendaciones de los usuarios. Elimina las no deseadas o copia el bloque JSON completo para pegarlo en tu código fuente y dejarlas fijas.
        </p>
        <div style="max-height: 250px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px; background: rgba(0,0,0,0.25); margin-bottom:15px;">
          ${recomListHTML || `<p style="color:var(--text-muted); text-align:center; font-size:12px; padding: 20px 0;">No hay recomendaciones registradas.</p>`}
        </div>
        <button onclick="adminExportRecoms()" class="btn" style="width: 100%; margin-top: 5px; background: linear-gradient(135deg, var(--primary), var(--accent)); box-shadow: 0 5px 15px rgba(255,0,170,0.15);">📋 Copiar Código de Publicación (JSON)</button>
      </div>
      
      <!-- SECCIÓN REINICIAR DB -->
      <div id="admin-sec-reset_db" class="admin-section">
        <p style="color: var(--text-muted); font-size:12px; margin-bottom:15px;">
          Esta acción restablecerá por completo la base de datos de Firebase para iniciar de nuevo las ventas desde cero.
        </p>
        <div style="border: 1px solid rgba(255, 107, 107, 0.3); padding: 15px; border-radius: 12px; background: rgba(255,107,107,0.05); text-align: center;">
          <h4 style="color: #ff6b6b; margin-bottom: 10px; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; font-family:'Orbitron';">⚠️ ¡ZONA DE PELIGRO!</h4>
          <p style="font-size:11.5px; color: var(--text-muted); margin-bottom: 15px; line-height:1.5;">
            Se eliminarán todos los usuarios de prueba (excepto <strong>xDavid</strong> y <strong>luisdavid</strong>), se vaciará el stock de claves, se borrará el historial de ventas y las recomendaciones, y se restablecerán las estadísticas globales de visitas.
          </p>
          <div class="admin-form-group" style="text-align: left; margin-bottom: 15px;">
            <label style="color: var(--text-muted); font-size:11px; display:block; margin-bottom:5px;">Escribe <strong>REINICIAR</strong> para confirmar:</label>
            <input type="text" id="admin-reset-confirm-input" class="input-glass" placeholder="REINICIAR" style="text-align: center; font-weight: bold; letter-spacing: 1px; font-family:'Orbitron'; width:100%; box-sizing:border-box;">
          </div>
          <button onclick="adminResetDatabase()" class="btn" style="width: 100%; background: linear-gradient(135deg, #ff416c, #ff4b2b); box-shadow: 0 5px 15px rgba(255,75,43,0.35); color: white; border: none; font-weight: bold; font-family:'Orbitron';">🧹 Ejecutar Reinicio Completo</button>
        </div>
      </div>
      
      <!-- SECCIÓN IA CONFIG (GEMINI API KEY) -->
      <div id="admin-sec-ia_config" class="admin-section">
        <p style="color: var(--text-muted); font-size:12px; margin-bottom:15px;">
          Configura la clave de la API de Gemini para habilitar la Inteligencia Artificial avanzada en tiempo real en el chatbot de soporte y el tutor de estudiantes.
        </p>
        <div style="border: 1px solid rgba(0, 240, 255, 0.2); padding: 15px; border-radius: 12px; background: rgba(0,0,0,0.25); margin-bottom: 15px;">
          <h4 style="color: var(--secondary); margin-bottom: 10px; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">🧠 Estado de la IA</h4>
          <div id="admin-ia-status" style="display:flex; align-items:center; gap:10px; padding:10px; border-radius:8px; background:rgba(0,0,0,0.3); font-size:13px;">
            <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${GEMINI_API_KEY && GEMINI_API_KEY.length > 10 ? '#39ff14' : '#ff4444'}; box-shadow:0 0 8px ${GEMINI_API_KEY && GEMINI_API_KEY.length > 10 ? '#39ff14' : '#ff4444'};"></span>
            <span>${GEMINI_API_KEY && GEMINI_API_KEY.length > 10 ? '✅ IA Gemini ACTIVA — Respuestas ilimitadas habilitadas' : '❌ IA Gemini INACTIVA — Usando respuestas offline limitadas'}</span>
          </div>
        </div>
        <div class="admin-form-group">
          <label>🔑 Clave API de Gemini (Google AI Studio)</label>
          <input type="password" id="admin-gemini-key-input" class="input-glass" placeholder="AIzaSy... (Ingresa nueva clave para cambiarla)" style="width:100%; box-sizing:border-box; font-family:monospace; letter-spacing:0.5px;">
        </div>
        <p style="color: var(--text-muted); font-size:11px; margin:8px 0 15px 0;">
          Obtén tu clave gratis en: <a href="https://aistudio.google.com/" target="_blank" style="color:var(--secondary); text-decoration:underline;">aistudio.google.com</a>
        </p>
        <button onclick="adminSaveGeminiKey()" class="btn" style="width: 100%; background: linear-gradient(135deg, var(--secondary), var(--accent)); box-shadow: 0 5px 15px rgba(0,240,255,0.2);">🚀 Guardar y Activar IA de Gemini</button>
      </div>

      <!-- SECCIÓN MÚSICA -->
      <div id="admin-sec-music" class="admin-section">
        <p style="color: var(--text-muted); font-size:12px; margin-bottom:15px;">
          Ingresa un enlace de YouTube o de audio directo (.mp3) para cambiar la música de fondo de la tienda en tiempo real para todos los usuarios.
        </p>
        <div class="admin-form-group">
          <label>Enlace de la Música (URL)</label>
          <input type="url" id="admin-music-url-input" class="input-glass" placeholder="https://www.youtube.com/watch?v=..." style="width:100%; box-sizing:border-box;">
        </div>
        <div class="admin-form-group">
          <label>Título de la Canción</label>
          <input type="text" id="admin-music-title-input" class="input-glass" placeholder="Ej: EMPILADAZO feat TYPEGE" style="width:100%; box-sizing:border-box;">
        </div>
        <div class="admin-form-group">
          <label>Nombre del Artista / Autor</label>
          <input type="text" id="admin-music-artist-input" class="input-glass" placeholder="Ej: TYPEGE" style="width:100%; box-sizing:border-box;">
        </div>
        <button onclick="adminSaveMusic()" class="btn" style="width: 100%; margin-top: 10px; background: linear-gradient(135deg, var(--secondary), var(--accent));">💾 Guardar y Sincronizar Música</button>
      </div>

    </div>
  `;
  document.body.appendChild(modal);

  // Inicializar cargando la lista de productos, música y clave Gemini
  setTimeout(() => {
    adminLoadProductsList();
    if (firebaseDB) {
      firebaseDB.ref("music_config").once("value").then(snap => {
        const config = snap.val();
        if (config) {
          const urlInp = document.getElementById("admin-music-url-input");
          const titInp = document.getElementById("admin-music-title-input");
          const artInp = document.getElementById("admin-music-artist-input");
          if (urlInp) urlInp.value = config.url || "";
          if (titInp) titInp.value = config.title || "";
          if (artInp) artInp.value = config.artist || "";
        }
      });
      // Cargar la clave Gemini actual de forma segura (solo estado activo)
      fetchSecureAPI("/api/chat", { action: "get_gemini_status" })
        .then(data => {
          const keyInp = document.getElementById("admin-gemini-key-input");
          if (keyInp && data.success && data.isActive) {
            keyInp.placeholder = "Clave configurada (Ingresa una nueva para cambiarla)";
          }
        })
        .catch(err => console.error("Error al cargar estado de Gemini:", err));
    }
  }, 50);
}

// Funciones globales expuestas al objeto window para el panel de administración
window.switchAdminTab = function(tabName) {
  clickSound();
  document.querySelectorAll(".admin-tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".admin-section").forEach(sec => sec.classList.remove("active"));

  const tabTextMap = {
    users: 'usuarios',
    keys: 'keys pool',
    free_keys: 'keys gratis',
    purchases: 'ventas',
    products: 'productos',
    background: 'fondo',
    recoms: 'moderación',
    music: 'música',
    ia_config: 'ia config',
    reset_db: 'reiniciar'
  };

  const searchText = tabTextMap[tabName] || tabName;
  const clickedBtn = Array.from(document.querySelectorAll(".admin-tab-btn")).find(btn => 
    btn.innerText.toLowerCase().includes(searchText)
  );
  if (clickedBtn) clickedBtn.classList.add("active");

  const targetSec = document.getElementById(`admin-sec-${tabName}`);
  if (targetSec) targetSec.classList.add("active");
};

// 🎵 Función de Guardado y Sincronización de Música en Vivo
window.adminSaveMusic = async function() {
  clickSound();
  const url = document.getElementById("admin-music-url-input")?.value.trim() || "";
  const title = document.getElementById("admin-music-title-input")?.value.trim() || "";
  const artist = document.getElementById("admin-music-artist-input")?.value.trim() || "";

  if (!url) {
    showToast("❌ Debes ingresar un enlace de música válido.", "error");
    return;
  }

  // Validar que sea un enlace de YouTube válido o un archivo de audio directo
  const ytId = getYouTubeId(url);
  const isHttpAudio = /^https?:\/\/.+\.(mp3|ogg|wav|m4a|aac|opus|flac)(\?.*)?$/i.test(url);
  const isLocalAudio = /^[^\s\/].*\.(mp3|ogg|wav|m4a|aac|opus|flac)$/i.test(url);
  const isHttp = /^https?:\/\/.+/i.test(url);

  if (!ytId && !isHttpAudio && !isLocalAudio && !isHttp) {
    showToast("❌ URL inválida. Usa un enlace de YouTube (ej: https://youtu.be/XXXX) o un archivo .mp3", "error");
    return;
  }

  try {
    showToast("⏳ Sincronizando nueva música en vivo...", "info");
    const data = await fetchSecureAPI("/api/admin", {
      action: "update_music",
      url: url,
      title: title || "Canción en Vivo",
      artist: artist || "GUATE XITER PRO",
      type: ytId ? "youtube" : "audio",
      videoId: ytId || null
    });

    if (data.success) {
      // Activar reproducción inmediata (el click del usuario en Guardar cuenta como gesto)
      isMusicPlayingGlobal = true;
      showToast(`✅ ¡Música sincronizada! (${ytId ? 'YouTube' : 'Audio directo'})`, "success");
      addConsoleLog(`Cambió la música a: ${title} - ${artist} [${ytId ? 'YT:' + ytId : 'AUDIO'}]`, 'info');
    }
  } catch (err) {
    console.error("Error al guardar música:", err);
    showToast("❌ Error al guardar música: " + err.message, "error");
  }
};

// 🤖 Función de Guardado de la Clave de Gemini AI
window.adminSaveGeminiKey = async function() {
  clickSound();
  const keyInput = document.getElementById("admin-gemini-key-input");
  const newKey = keyInput ? keyInput.value.trim() : "";

  if (!firebaseDB) {
    showToast("❌ Firebase no está conectado.", "error");
    return;
  }

  try {
    showToast("⏳ Guardando clave de Gemini...", "info");
    const data = await fetchSecureAPI("/api/admin", {
      action: "update_gemini",
      newGeminiKey: newKey
    });

    if (data.success) {
      GEMINI_API_KEY = newKey;
      
      const statusEl = document.getElementById("admin-ia-status");
      if (statusEl) {
        const isActive = newKey && newKey.length > 10;
        statusEl.innerHTML = `
          <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${isActive ? '#39ff14' : '#ff4444'}; box-shadow:0 0 8px ${isActive ? '#39ff14' : '#ff4444'};"></span>
          <span>${isActive ? '✅ IA Gemini ACTIVA — Respuestas ilimitadas habilitadas' : '❌ IA Gemini INACTIVA — Usando respuestas offline limitadas'}</span>
        `;
      }
      
      if (newKey && newKey.length > 10) {
        showToast("✅ ¡Clave de Gemini guardada! La IA avanzada está ACTIVADA para todos.", "success");
        addConsoleLog("IA Gemini activada con nueva clave API", "info");
      } else {
        showToast("⚠️ Clave vacía guardada. La IA usará respuestas offline.", "warning");
        addConsoleLog("IA Gemini desactivada (clave vacía)", "warning");
      }
    }
  } catch (err) {
    console.error("Error al guardar clave de Gemini:", err);
    showToast("❌ Error al guardar: " + err.message, "error");
  }
};

// 🤖 Sincronización de Clave Gemini — YA NO SE NECESITA EN EL CLIENTE
// La clave de Gemini ahora vive solo en el servidor (/api/chat proxy)
function initGeminiKeySync() {
  // Las llamadas a Gemini ahora pasan por /api/chat que lee la clave del servidor
  console.log("%c🤖 Gemini IA configurada en modo proxy seguro", "color:#39ff14; font-weight:bold;");
}

// 🧹 Función de Reinicio Completo de Base de Datos (Zona de Peligro)
window.adminResetDatabase = async function() {
  clickSound();
  const confirmInput = document.getElementById("admin-reset-confirm-input");
  if (!confirmInput || confirmInput.value.trim() !== "REINICIAR") {
    showToast("❌ Debes escribir REINICIAR en mayúsculas para confirmar.", "error");
    return;
  }

  if (!confirm("⚠️ ¿Estás 100% seguro? Esta acción eliminará TODOS los usuarios (excepto xDavid y luisdavid), vaciará las keys, el historial y las recomendaciones. NO se puede deshacer.")) {
    return;
  }

  try {
    showToast("⏳ Reiniciando base de datos...", "info");
    const data = await fetchSecureAPI("/api/admin", { action: "reset_db" });

    if (data.success) {
      KEYS_POOL = {
        bypass: { free: [], daily: [], weekly: [], biweekly: [], monthly: [] },
        panel: { free: [], daily: [], weekly: [], biweekly: [], monthly: [] }
      };
      localStorage.setItem(EXTRA_KEYS_STORAGE, JSON.stringify(KEYS_POOL));

      localStorage.removeItem(CLAIMED_KEYS_KEY);
      localStorage.removeItem("guate_extra_keys_pool");
      localStorage.removeItem("guate_keys_pool_cleared_v6");

      let session = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (session) {
        session.purchases = [];
        session.keyHistory = [];
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }

      confirmInput.value = "";
      showToast("✅ ¡Base de datos reiniciada exitosamente! La tienda está lista para nuevas ventas.", "success");
      addConsoleLog("🧹 Base de datos reiniciada por completo. Solo se preservaron xDavid y luisdavid.", "warn");
      
      document.getElementById("admin-modal").remove();
      setTimeout(showAdminPanel, 100);
    }
  } catch (err) {
    console.error("Error al reiniciar base de datos:", err);
    showToast("❌ Error al reiniciar: " + err.message, "error");
  }
};

// 🔍 Función de búsqueda/filtro de usuarios en el panel admin
window.adminFilterUsers = function() {
  const searchInput = document.getElementById("admin-user-search");
  if (!searchInput) return;
  const query = searchInput.value.trim().toLowerCase();
  const container = document.getElementById("admin-users-list-container");
  if (!container) return;

  const userRows = container.querySelectorAll("[data-admin-user-row]");
  let visibleCount = 0;

  userRows.forEach(row => {
    const username = row.getAttribute("data-admin-user-row").toLowerCase();
    if (query === "" || username.includes(query)) {
      row.style.display = "flex";
      visibleCount++;
    } else {
      row.style.display = "none";
    }
  });

  // Mostrar mensaje si no se encontraron resultados
  let noResultsMsg = container.querySelector("#admin-no-results-msg");
  if (visibleCount === 0 && query !== "") {
    if (!noResultsMsg) {
      noResultsMsg = document.createElement("p");
      noResultsMsg.id = "admin-no-results-msg";
      noResultsMsg.style.cssText = "color: #ff6b6b; text-align: center; padding: 20px 0; font-size: 13px; animation: fadeIn 0.3s ease;";
      container.appendChild(noResultsMsg);
    }
    noResultsMsg.innerHTML = `🔍 No se encontró ningún usuario con "<strong style="color: var(--secondary);">${query}</strong>"`;
    noResultsMsg.style.display = "block";
  } else if (noResultsMsg) {
    noResultsMsg.style.display = "none";
  }
};

window.adminSaveBackground = async function() {
  clickSound();
  const bgInput = document.getElementById("admin-bg-url-input");
  if (!bgInput) return;
  const url = bgInput.value.trim();

  if (url === "") {
    localStorage.removeItem(BG_URL_KEY);
    applyCustomBackgroundLayer(null);
    try {
      await fetchSecureAPI("/api/admin", {
        action: "update_background",
        backgroundUrl: ""
      });
      showToast("Fondo restablecido al estilo aurora premium.", "info");
    } catch (err) {
      console.error("Error eliminando fondo:", err);
      showToast("❌ Error al restablecer fondo: " + err.message, "error");
    }
  } else if (isBlockedBackgroundUrl(url)) {
    showToast("Esa URL no se permite (imagen antigua o bloqueada). Usa otra imagen limpia.", "warn");
  } else {
    localStorage.setItem(BG_URL_KEY, url);
    applyCustomBackgroundLayer(url);
    try {
      await fetchSecureAPI("/api/admin", {
        action: "update_background",
        backgroundUrl: url
      });
      showToast("Fondo personalizado aplicado (capa suave sobre aurora).", "success");
      addConsoleLog(`El administrador cambió el fondo de pantalla: ${url}`, 'info');
    } catch (err) {
      console.error("Error guardando fondo:", err);
      showToast("❌ Error al guardar fondo: " + err.message, "error");
    }
  }
};

window.adminLoadProductsList = function() {
  const select = document.getElementById("admin-product-select");
  if (!select) return;

  const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || DEFAULT_PRODUCTS;
  select.innerHTML = products.map(p => `
    <option value="${p.id}">${p.id}. ${p.name} ($${parseFloat(p.price).toFixed(2)})</option>
  `).join('');
  
  adminLoadProductToEdit();
};

window.adminLoadProductToEdit = function() {
  const select = document.getElementById("admin-product-select");
  if (!select) return;
  const productId = parseInt(select.value);

  const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || DEFAULT_PRODUCTS;
  const product = products.find(p => p.id === productId);
  if (!product) return;

  document.getElementById("admin-prod-name").value = product.name;
  document.getElementById("admin-prod-desc").value = product.description;
  document.getElementById("admin-prod-price").value = product.price;
  document.getElementById("admin-prod-image").value = product.image;
  document.getElementById("admin-prod-keytype").value = product.keyType || "bypass";
  document.getElementById("admin-prod-category").value = product.category || "Panel";
};

window.adminSaveProduct = function() {
  clickSound();
  const select = document.getElementById("admin-product-select");
  if (!select) return;
  const productId = parseInt(select.value);

  const name = document.getElementById("admin-prod-name").value.trim();
  const desc = document.getElementById("admin-prod-desc").value.trim();
  const price = parseFloat(document.getElementById("admin-prod-price").value);
  const image = document.getElementById("admin-prod-image").value.trim();
  const keyType = document.getElementById("admin-prod-keytype").value;
  const category = document.getElementById("admin-prod-category").value;

  if (!name || !desc || isNaN(price) || price < 0 || !image) {
    showToast("⚠️ Rellena todos los campos con valores válidos.", "warn");
    return;
  }

  const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || DEFAULT_PRODUCTS;
  const idx = products.findIndex(p => p.id === productId);
  if (idx === -1) return;

  products[idx].name = name;
  products[idx].description = desc;
  products[idx].price = price;
  products[idx].image = image;
  products[idx].keyType = keyType;
  products[idx].category = category;

  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  
  // 🔥 Sincronizar productos actualizados a Firebase (precios globales para todos)
  firebaseSaveProducts(products);
  
  showToast(`✅ Producto "${name}" actualizado (${category}). Sincronizado globalmente.`, "success");
  addConsoleLog(`El administrador actualizó el producto ${productId}: "${name}" ($${price} USD, cat: ${category}) — sincronizado globalmente`, 'info');

  adminLoadProductsList();
  
  // Si estamos en la pestaña buy, recargarla
  const buySec = document.getElementById("buy");
  if (buySec && buySec.classList.contains("active")) {
    renderBuySection();
  }
};

async function adminAddBalance(username) {
  const input = document.getElementById(`add-balance-${username}`);
  if (!input) return;
  const amount = parseFloat(input.value);
  if (isNaN(amount) || amount <= 0) {
    showToast("⚠️ Ingresa un monto válido.", "warn");
    return;
  }

  const activeUser = getActiveUser();
  if (!activeUser || !activeUser.isAdmin) {
    showToast("❌ Solo los admins pueden recargar saldo.", "error");
    return;
  }

  try {
    showToast("⏳ Procesando recarga en el servidor...", "info");
    const data = await fetchSecureAPI("/api/admin", {
      action: "change_balance",
      targetUsername: username,
      amount: amount,
      operation: "add"
    });

    if (data.success) {
      activeUser.balance = data.adminBalance;
      localStorage.setItem(SESSION_KEY, JSON.stringify(activeUser));
      updateBalanceDisplay(activeUser);

      showToast(`✅ Se enviaron $${amount} USD a ${username}. Tu saldo restante: $${data.adminBalance.toFixed(2)}`, "success");
      input.value = "";

      // Refrescar modal
      document.getElementById("admin-modal").remove();
      setTimeout(showAdminPanel, 100);
    }
  } catch (err) {
    console.error("Error al recargar saldo:", err);
    showToast("❌ Error al recargar saldo: " + err.message, "error");
  }
}

// ➖ Quitar saldo de un usuario (devolver al admin)
async function adminSubtractBalance(username) {
  const input = document.getElementById(`add-balance-${username}`);
  if (!input) return;
  const amount = parseFloat(input.value);
  if (isNaN(amount) || amount <= 0) {
    showToast("⚠️ Ingresa un monto válido para retirar.", "warn");
    return;
  }

  const activeUser = getActiveUser();
  if (!activeUser || !activeUser.isAdmin) {
    showToast("❌ Solo los admins pueden quitar saldo.", "error");
    return;
  }

  try {
    showToast("⏳ Procesando retiro en el servidor...", "info");
    const data = await fetchSecureAPI("/api/admin", {
      action: "change_balance",
      targetUsername: username,
      amount: amount,
      operation: "subtract"
    });

    if (data.success) {
      activeUser.balance = data.adminBalance;
      localStorage.setItem(SESSION_KEY, JSON.stringify(activeUser));
      updateBalanceDisplay(activeUser);

      showToast(`✅ Se retiraron $${amount} USD de ${username}. Tu saldo: $${data.adminBalance.toFixed(2)}`, "success");
      input.value = "";

      // Refrescar modal
      document.getElementById("admin-modal").remove();
      setTimeout(showAdminPanel, 100);
    }
  } catch (err) {
    console.error("Error al retirar saldo:", err);
    showToast("❌ Error al retirar saldo: " + err.message, "error");
  }
}

// 🚀 Agregar nuevas keys al pool desde el Admin Panel
async function adminAddKeysToPool() {
  clickSound();

  const activeUser = getActiveUser();
  if (!activeUser || !activeUser.isAdmin) {
    showToast("❌ Solo los admins pueden agregar keys.", "error");
    return;
  }

  const typeSelect = document.getElementById("admin-addkey-type");
  const durationSelect = document.getElementById("admin-addkey-duration");
  const textarea = document.getElementById("admin-addkey-content");

  if (!typeSelect || !durationSelect || !textarea) {
    showToast("❌ Error: elementos del formulario no encontrados.", "error");
    return;
  }

  const keyType = typeSelect.value;       // "bypass" o "panel"
  const duration = durationSelect.value;  // "daily", "weekly", "biweekly", "monthly"
  const rawText = textarea.value.trim();

  if (!rawText) {
    showToast("⚠️ Escribe al menos una key para agregar.", "warn");
    return;
  }

  const newKeys = rawText
    .split('\n')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  if (newKeys.length === 0) {
    showToast("⚠️ No se detectaron keys válidas.", "warn");
    return;
  }

  try {
    showToast("⏳ Agregando keys en el servidor...", "info");
    const data = await fetchSecureAPI("/api/admin", {
      action: "add_keys",
      type: keyType,
      duration: duration,
      keysList: newKeys
    });

    if (data.success) {
      if (!KEYS_POOL[keyType]) KEYS_POOL[keyType] = {};
      KEYS_POOL[keyType][duration] = [...(KEYS_POOL[keyType][duration] || []), ...newKeys];
      localStorage.setItem(EXTRA_KEYS_STORAGE, JSON.stringify(KEYS_POOL));

      const typeLabel = keyType === 'bypass' ? 'Bypass' : 'Panel';
      const durLabel = { free: 'Gratis', daily: 'Día', weekly: 'Semana', biweekly: '15 Días', monthly: 'Mes' }[duration];
      
      showToast(`✅ Claves agregadas con éxito al servidor (Total stock: ${data.poolSize})`, "success");
      addConsoleLog(`Admin agregó keys [${typeLabel}/${durLabel}] al pool.`, 'info');
      textarea.value = "";

      document.getElementById("admin-modal").remove();
      setTimeout(showAdminPanel, 100);
    }
  } catch (err) {
    console.error("Error al agregar keys:", err);
    showToast("❌ Error al agregar keys: " + err.message, "error");
  }
}

// 🚀 Eliminar keys del pool desde el Admin Panel
async function adminDeleteKeysFromPool() {
  clickSound();

  const activeUser = getActiveUser();
  if (!activeUser || !activeUser.isAdmin) {
    showToast("❌ Solo los admins pueden eliminar keys.", "error");
    return;
  }

  const typeSelect = document.getElementById("admin-deletekey-type");
  const durationSelect = document.getElementById("admin-deletekey-duration");

  if (!typeSelect || !durationSelect) {
    showToast("❌ Error: elementos del formulario no encontrados.", "error");
    return;
  }

  const keyType = typeSelect.value;
  const duration = durationSelect.value;

  try {
    showToast("⏳ Eliminando todas las keys en el servidor...", "info");
    const data = await fetchSecureAPI("/api/admin", {
      action: "delete_keys",
      type: keyType,
      duration: duration
    });

    if (data.success) {
      if (!KEYS_POOL[keyType]) KEYS_POOL[keyType] = {};
      KEYS_POOL[keyType][duration] = [];
      localStorage.setItem(EXTRA_KEYS_STORAGE, JSON.stringify(KEYS_POOL));

      const typeLabel = keyType === 'bypass' ? 'Bypass' : 'Panel';
      const durLabel = { free: 'Gratis', daily: 'Día', weekly: 'Semana', biweekly: '15 Días', monthly: 'Mes' }[duration];

      showToast(`✅ Todas las keys [${typeLabel}/${durLabel}] se eliminaron del servidor (Stock restante: ${data.poolSize})`, "success");
      addConsoleLog(`Admin eliminó todas las keys [${typeLabel}/${durLabel}] del pool.`, 'info');

      document.getElementById("admin-modal").remove();
      setTimeout(showAdminPanel, 100);
    }
  } catch (err) {
    console.error("Error al eliminar keys:", err);
    showToast("❌ Error al eliminar keys: " + err.message, "error");
  }
}

// 🚀 Agregar keys gratis al pool desde el Admin Panel
async function adminAddFreeKeysToPool() {
  clickSound();

  const activeUser = getActiveUser();
  if (!activeUser || !activeUser.isAdmin) {
    showToast("❌ Solo los admins pueden agregar keys.", "error");
    return;
  }

  const typeSelect = document.getElementById("admin-addfreekey-type");
  const textarea = document.getElementById("admin-addfreekey-content");

  if (!typeSelect || !textarea) {
    showToast("❌ Error: elementos del formulario no encontrados.", "error");
    return;
  }

  const keyType = typeSelect.value;       // "bypass" o "panel"
  const duration = "free";
  const rawText = textarea.value.trim();

  if (!rawText) {
    showToast("⚠️ Escribe al menos una key gratis para agregar.", "warn");
    return;
  }

  const newKeys = rawText
    .split('\n')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  if (newKeys.length === 0) {
    showToast("⚠️ No se detectaron keys gratis válidas.", "warn");
    return;
  }

  try {
    showToast("⏳ Agregando keys gratis en el servidor...", "info");
    const data = await fetchSecureAPI("/api/admin", {
      action: "add_keys",
      type: keyType,
      duration: duration,
      keysList: newKeys
    });

    if (data.success) {
      if (!KEYS_POOL[keyType]) KEYS_POOL[keyType] = {};
      KEYS_POOL[keyType][duration] = [...(KEYS_POOL[keyType][duration] || []), ...newKeys];
      localStorage.setItem(EXTRA_KEYS_STORAGE, JSON.stringify(KEYS_POOL));

      const typeLabel = keyType === 'bypass' ? 'Bypass Gratis' : 'Panel Gratis';

      showToast(`✅ Claves gratis agregadas con éxito al servidor (Total stock: ${data.poolSize})`, "success");
      addConsoleLog(`Admin agregó keys gratis [${typeLabel}] al pool.`, 'info');
      textarea.value = "";

      document.getElementById("admin-modal").remove();
      setTimeout(showAdminPanel, 100);
    }
  } catch (err) {
    console.error("Error al agregar keys gratis:", err);
    showToast("❌ Error al agregar keys gratis: " + err.message, "error");
  }
}
window.adminAddFreeKeysToPool = adminAddFreeKeysToPool;

// Toast notification helper
function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}


// ==========================================
// 🛡 PROTECCIONES DE SEGURIDAD (CON EXCEPCIÓN LOCAL)
// ==========================================
// Desactiva las protecciones al estar en localhost para facilitar el desarrollo
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.href.includes("antigravity");

if (!isLocalhost) {
  // Desactivar clic derecho
  document.addEventListener("contextmenu", e => {
    e.preventDefault();
  });

  // Desactivar atajos de desarrollo
  document.onkeydown = function(e) {
    // F12
    if (e.keyCode == 123) {
      return false;
    }
    // Ctrl + Shift + I
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73) {
      return false;
    }
    // Ctrl + Shift + J
    if (e.ctrlKey && e.shiftKey && e.keyCode == 74) {
      return false;
    }
    // Ctrl + U (Código fuente)
    if (e.ctrlKey && e.keyCode == 85) {
      return false;
    }
    // Ctrl + S (Guardar página)
    if (e.ctrlKey && e.keyCode == 83) {
      return false;
    }
  };

  // Detección de DevTools por tamaño de ventana
  setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;

    if (widthThreshold || heightThreshold) {
      document.body.innerHTML = `
        <div style="
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #06060c;
          color: #ff00aa;
          font-size: 35px;
          font-family: 'Orbitron', sans-serif;
          text-shadow: 0 0 15px rgba(255, 0, 170, 0.6);
          letter-spacing: 2px;
          text-align: center;
          padding: 20px;
        ">
          ACCESO DENEGADO / PROTOCOLO ANTI-DEPURACIÓN
        </div>
      `;
    }
  }, 1200);
}


// ==========================================
// 👁️ SISTEMA DE RASTREO DE VISITANTES EN TIEMPO REAL
// ==========================================

// ID único por navegador (persiste aunque cierres la pestaña)
function getVisitorId() {
  let id = localStorage.getItem("guate_visitor_id");
  if (!id) {
    id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 12);
    localStorage.setItem("guate_visitor_id", id);
  }
  return id.replace(/[.#$\/\[\]]/g, "_");
}

function hasThisBrowserCountedView(visitorId) {
  return localStorage.getItem("guate_view_registered_" + visitorId) === "true";
}

function markThisBrowserCountedView(visitorId) {
  localStorage.setItem("guate_view_registered_" + visitorId, "true");
}

// Cuenta 1 vista de forma única usando la IP pública (para evitar duplicación entre distintos navegadores)
async function registerUniqueView(db) {
  let visitorId = localStorage.getItem("guate_visitor_id");
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    if (data.ip) {
      visitorId = "ip_" + data.ip.replace(/[.#$\/\[\]]/g, "_");
    }
  } catch (e) {
    if (!visitorId) {
      visitorId = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 12);
      localStorage.setItem("guate_visitor_id", visitorId);
    }
  }

  if (hasThisBrowserCountedView(visitorId)) return;

  if (db) {
    const viewedRef = db.ref("stats/viewed_visitors/" + visitorId);
    const snap = await viewedRef.once("value");
    if (snap.val()) {
      markThisBrowserCountedView(visitorId);
      return;
    }
    const tx = await db.ref("stats/total_views").transaction((current) => (current || 0) + 1);
    if (!tx.committed) return;
    await viewedRef.set({ at: firebase.database.ServerValue.TIMESTAMP });
    markThisBrowserCountedView(visitorId);
    return;
  }

  // Modo sin Firebase: contador local solo para este navegador
  let total = parseInt(localStorage.getItem("guate_simulated_views") || "0", 10);
  if (total < 1) total = 37;
  else total += 1;
  localStorage.setItem("guate_simulated_views", String(total));
  markThisBrowserCountedView(visitorId);
}

async function initOnlinePresence(db, activeEl) {
  const onlineUsersRef = db.ref("stats/online_users");
  
  // Identificar el dispositivo usando IP pública para evitar duplicados en el mismo equipo/red
  let deviceId = localStorage.getItem("guate_presence_device_id");
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    if (data.ip) {
      deviceId = "ip_" + data.ip.replace(/[.#$\/\[\]]/g, "_");
    }
  } catch (e) {
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("guate_presence_device_id", deviceId);
    }
  }
  
  // Identificar la pestaña activa de manera única (sobrevive a recargas F5)
  let tabId = sessionStorage.getItem("guate_presence_tab_id");
  if (!tabId) {
    tabId = "tab_" + Math.random().toString(36).substring(2, 11);
    sessionStorage.setItem("guate_presence_tab_id", tabId);
  }

  // Escribir bajo el nodo único del dispositivo y la pestaña activa
  const myTabRef = onlineUsersRef.child(deviceId).child(tabId);

  db.ref(".info/connected").on("value", (snap) => {
    if (snap.val() === true) {
      myTabRef.set({ timestamp: firebase.database.ServerValue.TIMESTAMP });
      myTabRef.onDisconnect().remove();
    }
  });

  onlineUsersRef.on("value", (snapshot) => {
    // El conteo de hijos en el nodo raíz de online_users corresponde exactamente a las IPs/dispositivos únicos activos
    const activeCount = snapshot.numChildren() || 0;
    if (activeEl) activeEl.innerText = activeCount;
  });
}

function initVisitorCounter() {
  const viewsEl = document.getElementById("total-views-count");
  const activeEl = document.getElementById("active-users-count");
  const statusEl = document.getElementById("visitor-db-status");

  if (firebaseDB) {
    try {
      const db = firebaseDB;

      if (statusEl) {
        statusEl.innerText = "Real";
        statusEl.classList.add("real");
      }
      if (isLoggedIn()) {
        addConsoleLog("Módulo de visitas: CONECTADO A FIREBASE (Modo Real)", "info");
      }

      // Mostrar total global en tiempo real (todas las visitas únicas)
      db.ref("stats/total_views").on("value", (snapshot) => {
        const count = snapshot.val();
        if (viewsEl) viewsEl.innerText = count != null ? count : 0;
      });

      // 1 vista por navegador (no suma al recargar F5 ni abrir otra pestaña del mismo PC)
      registerUniqueView(db).catch((err) => {
        console.error("Error registrando vista única:", err);
      });

      initOnlinePresence(db, activeEl);
    } catch (error) {
      console.error("Error al inicializar contador. Modo simulado:", error);
      startSimulation(viewsEl, activeEl, statusEl);
    }
  } else {
    startSimulation(viewsEl, activeEl, statusEl);
  }
}

function startSimulation(viewsEl, activeEl, statusEl) {
  if (statusEl) {
    statusEl.innerText = "Simulado";
    statusEl.classList.remove("real");
  }

  const visitorId = getVisitorId();
  let simulatedViews = parseInt(localStorage.getItem("guate_simulated_views") || "37", 10);

  if (!hasThisBrowserCountedView(visitorId)) {
    if (localStorage.getItem("guate_simulated_views")) {
      simulatedViews += 1;
    }
    localStorage.setItem("guate_simulated_views", String(simulatedViews));
    markThisBrowserCountedView(visitorId);
  }

  if (viewsEl) viewsEl.innerText = simulatedViews;

  if (isLoggedIn()) {
    addConsoleLog("Módulo de visitas: INICIADO (Modo Simulado)", "info");
  }

  let currentActive = Math.floor(Math.random() * 3) + 2;
  if (activeEl) activeEl.innerText = currentActive;

  setInterval(() => {
    const change = Math.floor(Math.random() * 3) - 1;
    currentActive += change;
    if (currentActive < 1) currentActive = 1;
    if (currentActive > 6) currentActive = 6;
    if (activeEl) activeEl.innerText = currentActive;
  }, 12000);
}

// ==========================================
// 💬 SITEMA DE RECOMENDACIONES Y SUGERENCIAS
// ==========================================
const DB_RECOM_KEY = "guate_recommendations";

const DEFAULT_RECOMMENDATIONS = [
  {
    id: 1,
    name: "xDavid",
    message: "¡Bienvenidos a la plataforma oficial de Guate Xiter Pro! Este sistema ha sido actualizado con el nuevo bypass indetectable y un centro de descargas integrado de alta velocidad. Deja tu recomendación o sugerencia aquí.",
    rating: 5,
    date: "23/5/2026, 21:05:00",
    avatar: "https://file.vahalla.cc/66b93f29.png",
    isAdmin: true
  },
  {
    id: 2,
    name: "SAMU (Vendedor)",
    message: "Excelente actualización. Mis clientes están encantados con el soporte del Panel SaaS. Las inyecciones son súper rápidas y sin lag. 10/10 recomendado.",
    rating: 5,
    date: "23/5/2026, 18:30:00",
    avatar: "https://file.vahalla.cc/be77f985.png",
    isAdmin: false
  },
  {
    id: 3,
    name: "Lucrecia_GT",
    message: "El bypass para Free Fire es el mejor de toda Guatemala, llevo 2 semanas seguidas jugando torneos y todo va perfecto, muy estable.",
    rating: 5,
    date: "23/5/2026, 14:15:00",
    avatar: "https://file.vahalla.cc/66b93f29.png",
    isAdmin: false
  },
  {
    id: 4,
    name: "Zero_Player",
    message: "Me gustaría que agregaran una opción de modo oscuro extremo en el menú de perfil, pero por lo demás el panel v3.2 está brutal.",
    rating: 4,
    date: "22/5/2026, 10:45:00",
    avatar: "https://file.vahalla.cc/88e302f9.png",
    isAdmin: false
  }
];

function initRecommendationsLocal() {
  const data = localStorage.getItem(DB_RECOM_KEY);
  if (!data) {
    localStorage.setItem(DB_RECOM_KEY, JSON.stringify(DEFAULT_RECOMMENDATIONS));
  }
}

function initRecommendationsSync() {
  initRecommendationsLocal();
  if (!firebaseDB) return;
  firebaseSeedRecommendations()
    .then(() => {
      attachRecommendationsRealtimeListener();
      renderRecommendations();
      console.log("%c🔥 Recomendaciones conectadas a Firebase (tiempo real)", "color:#39ff14; font-weight:bold;");
    })
    .catch(err => console.error("Error sincronizando recomendaciones:", err));
}

initRecommendationsSync();

function setRecomRating(rating) {
  clickSound();
  const hiddenInput = document.getElementById("recom-rating");
  if (hiddenInput) {
    hiddenInput.value = rating;
  }
  
  const starsContainer = document.getElementById("stars-container");
  if (starsContainer) {
    const stars = starsContainer.querySelectorAll(".star-btn");
    stars.forEach((star, index) => {
      if (index < rating) {
        star.style.color = "#ffaa00";
        star.style.textShadow = "0 0 8px rgba(255, 170, 0, 0.6)";
        star.style.transform = "scale(1.15)";
      } else {
        star.style.color = "rgba(255, 255, 255, 0.2)";
        star.style.textShadow = "none";
        star.style.transform = "scale(1)";
      }
    });
  }
}

async function handleSendRecommendation(e) {
  e.preventDefault();
  clickSound();

  const nameInput = document.getElementById("recom-name");
  const messageInput = document.getElementById("recom-message");
  const ratingInput = document.getElementById("recom-rating");
  const submitBtn = e.target.querySelector("button[type='submit']");

  if (!nameInput || !messageInput || !ratingInput) return;

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  const rating = parseInt(ratingInput.value) || 5;

  if (!name || !message) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  const allUsers = JSON.parse(localStorage.getItem(DB_KEY)) || [];
  const activeUser = getActiveUser();
  const isRegisteredName = allUsers.some(u => u.username.toLowerCase() === name.toLowerCase());

  if (isRegisteredName && (!activeUser || activeUser.username.toLowerCase() !== name.toLowerCase())) {
    let warningEl = document.getElementById("recom-username-warning");
    if (!warningEl) {
      warningEl = document.createElement("div");
      warningEl.id = "recom-username-warning";
      nameInput.parentNode.appendChild(warningEl);
    }
    warningEl.style.cssText = `
      background: rgba(255, 68, 68, 0.12); border: 1px solid rgba(255, 68, 68, 0.35);
      border-radius: 8px; padding: 10px 14px; margin-top: 8px; font-size: 12px;
      color: #ff6b6b; animation: fadeIn 0.3s ease; display: flex; align-items: center; gap: 8px;
    `;
    warningEl.innerHTML = `
      <span style="font-size: 18px;">⚠️</span>
      <div>
        <strong style="color: #ff4444;">¡Usuario ya registrado!</strong><br>
        El alias "<strong style="color: var(--secondary);">${name}</strong>" ya pertenece a un usuario registrado.
        Cambia tu alias para enviar tu recomendación.
      </div>
    `;
    nameInput.style.borderColor = "rgba(255, 68, 68, 0.6)";
    nameInput.style.boxShadow = "0 0 10px rgba(255, 68, 68, 0.2)";
    nameInput.focus();
    showToast("⚠️ Ese alias ya está registrado. Usa otro nombre.", "warn");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "☁️ Publicando...";
  }

  let avatar = "https://file.vahalla.cc/66b93f29.png";
  let isAdmin = false;

  if (activeUser) {
    avatar = activeUser.logoUrl || avatar;
    if (ADMIN_USERNAMES.includes(activeUser.username.toLowerCase())) {
      isAdmin = true;
    }
  } else {
    const randomAvatars = [
      "https://file.vahalla.cc/be77f985.png",
      "https://file.vahalla.cc/8f0089d0.png",
      "https://file.vahalla.cc/d3b17e2a.png",
      "https://file.vahalla.cc/66b93f29.png"
    ];
    avatar = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
  }

  const newRecom = {
    id: Date.now(),
    name: name,
    message: message,
    rating: rating,
    date: new Date().toLocaleString(),
    avatar: avatar,
    isAdmin: isAdmin
  };

  try {
    if (firebaseDB) {
      await firebaseSaveRecommendation(newRecom);
    } else {
      const recommendations = getRecommendations();
      recommendations.unshift(newRecom);
      setRecommendationsCache(recommendations);
      renderRecommendations();
    }

    messageInput.value = "";
    setRecomRating(5);

    const warningEl = document.getElementById("recom-username-warning");
    if (warningEl) warningEl.remove();
    nameInput.style.borderColor = "";
    nameInput.style.boxShadow = "";

    showToast("✅ ¡Publicado! Todos pueden ver tu mensaje.", "success");

    if (isLoggedIn()) {
      addConsoleLog(`Recomendación publicada: ${name} (${rating}★)`, "info");
    }
  } catch (err) {
    console.error("Error publicando recomendación:", err);
    showToast("❌ No se pudo publicar. Revisa tu conexión o las reglas de Firebase.", "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "🚀 Enviar Recomendación";
    }
  }
}

// 🔍 Validación en tiempo real del alias en el formulario de recomendaciones
(function() {
  // Ejecutar después de que el DOM cargue
  const initRecomValidation = () => {
    const nameInput = document.getElementById("recom-name");
    if (!nameInput) return;
    
    nameInput.addEventListener("input", function() {
      const name = this.value.trim().toLowerCase();
      const warningEl = document.getElementById("recom-username-warning");
      
      if (name.length === 0) {
        if (warningEl) warningEl.remove();
        this.style.borderColor = "";
        this.style.boxShadow = "";
        return;
      }
      
      const allUsers = JSON.parse(localStorage.getItem(DB_KEY)) || [];
      const activeUser = getActiveUser();
      const isRegisteredName = allUsers.some(u => u.username.toLowerCase() === name);
      
      if (isRegisteredName && (!activeUser || activeUser.username.toLowerCase() !== name)) {
        if (!warningEl) {
          const warning = document.createElement("div");
          warning.id = "recom-username-warning";
          warning.style.cssText = `
            background: rgba(255, 68, 68, 0.12); border: 1px solid rgba(255, 68, 68, 0.35);
            border-radius: 8px; padding: 10px 14px; margin-top: 8px; font-size: 12px;
            color: #ff6b6b; animation: fadeIn 0.3s ease; display: flex; align-items: center; gap: 8px;
          `;
          warning.innerHTML = `
            <span style="font-size: 18px;">⚠️</span>
            <div>
              <strong style="color: #ff4444;">¡Usuario ya registrado!</strong><br>
              Cambia tu alias, "<strong style="color: var(--secondary);">${this.value.trim()}</strong>" ya está en uso.
            </div>
          `;
          this.parentNode.appendChild(warning);
        }
        this.style.borderColor = "rgba(255, 68, 68, 0.6)";
        this.style.boxShadow = "0 0 10px rgba(255, 68, 68, 0.2)";
      } else {
        if (warningEl) warningEl.remove();
        if (isRegisteredName && activeUser && activeUser.username.toLowerCase() === name) {
          // Es el usuario actual logueado - borde verde
          this.style.borderColor = "rgba(57, 255, 20, 0.5)";
          this.style.boxShadow = "0 0 10px rgba(57, 255, 20, 0.15)";
        } else {
          this.style.borderColor = "";
          this.style.boxShadow = "";
        }
      }
    });
  };
  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRecomValidation);
  } else {
    setTimeout(initRecomValidation, 100);
  }
})();

function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function renderRecommendations() {
  const container = document.getElementById("recommendations-list");
  if (!container) return;

  const recommendations = getRecommendations();
  
  if (recommendations.length === 0) {
    container.innerHTML = `
      <p style="color: var(--text-muted); text-align: center; padding: 30px; font-size: 14px;">
        Aún no hay recomendaciones. ¡Sé el primero en dejar tu opinión!
      </p>
    `;
    return;
  }
  
  container.innerHTML = recommendations.map(r => {
    let starsHTML = "";
    for (let i = 0; i < 5; i++) {
      if (i < r.rating) {
        starsHTML += '<span style="color: #ffaa00; text-shadow: 0 0 5px rgba(255, 170, 0, 0.4);">★</span>';
      } else {
        starsHTML += '<span style="color: rgba(255,255,255,0.15);">★</span>';
      }
    }
    
    const adminBadgeHTML = r.isAdmin ? `
      <span class="rank-badge" style="position: static; transform: none; display: inline-block; font-size: 8px; margin-left: 6px; padding: 2px 6px; background: linear-gradient(135deg, #ff00aa, #8e2de2); border-radius: 4px; vertical-align: middle;">
        DEVELOPER PRO
      </span>
    ` : '';
    
    return `
      <div class="recom-item" style="display: flex; gap: 15px; align-items: start; padding: 15px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 2px; transition: all 0.3s ease;">
        <img src="${escapeHTML(r.avatar || 'https://file.vahalla.cc/66b93f29.png')}" alt="avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; box-shadow: 0 0 10px rgba(0,240,255,0.2);">
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; flex-wrap: wrap; gap: 5px;">
            <div>
              <strong style="color: var(--secondary); font-size: 13px;">${escapeHTML(r.name)}</strong>
              ${adminBadgeHTML}
            </div>
            <div style="font-size: 13px;">
              ${starsHTML}
            </div>
          </div>
          <p style="color: #e2e8f0; font-size: 12.5px; line-height: 1.5; margin: 0; word-break: break-word;">${escapeHTML(r.message)}</p>
          <div style="font-size: 10px; color: var(--text-muted); text-align: right; margin-top: 5px; font-family: var(--font-tech);">${escapeHTML(r.date)}</div>
        </div>
      </div>
    `;
  }).join('');
}


// ==========================================
// 🛡️ PROTECCIÓN DE CÓDIGO FUENTE (SEGURIDAD)
// ==========================================
function preventCodeInspection() {
  // 1. Deshabilitar menú contextual (clic derecho)
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showToast("⚠️ Seguridad: Inspección deshabilitada en esta plataforma.", "warn");
  });

  // 2. Deshabilitar atajos de teclado para herramientas de desarrollo
  document.addEventListener("keydown", (e) => {
    if (
      // F12
      e.key === "F12" ||
      // Ctrl + Shift + I (Inspeccionar)
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.keyCode === 73)) ||
      // Ctrl + Shift + J (Consola)
      (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j" || e.keyCode === 74)) ||
      // Ctrl + Shift + C (Selector de elementos)
      (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c" || e.keyCode === 67)) ||
      // Ctrl + U (Código fuente)
      (e.ctrlKey && (e.key === "U" || e.key === "u" || e.keyCode === 85)) ||
      // Ctrl + S (Guardar página)
      (e.ctrlKey && (e.key === "S" || e.key === "s" || e.keyCode === 83))
    ) {
      e.preventDefault();
      showToast("⚠️ Seguridad: Acceso al código fuente bloqueado.", "warn");
    }
  });

  console.log("%c[SEGURIDAD] Protección de código activa - Bloqueo de F12 / Clic Derecho habilitado.", "color:#ff3333; font-weight:bold;");
}

// ==========================================
// 💬 MODERACIÓN Y EXPORTACIÓN DE RECOMENDACIONES
// ==========================================
window.adminDeleteRecom = async function(id) {
  clickSound();
  try {
    if (firebaseDB) {
      await firebaseDeleteRecommendation(id);
    } else {
      const recommendations = getRecommendations().filter(r => r.id !== id);
      setRecommendationsCache(recommendations);
      renderRecommendations();
    }
    showToast("🗑 Recomendación eliminada.", "info");
  } catch (err) {
    console.error("Error eliminando recomendación:", err);
    showToast("❌ No se pudo eliminar en Firebase.", "error");
    return;
  }

  const modal = document.getElementById("admin-modal");
  if (modal) modal.remove();
  showAdminPanel();
  switchAdminTab("recoms");
};

window.adminExportRecoms = function() {
  clickSound();
  const recommendations = getRecommendations();
  const codeStr = JSON.stringify(recommendations, null, 2);
  
  navigator.clipboard.writeText(codeStr).then(() => {
    showToast("📋 ¡Código JSON copiado! Pégalo en DEFAULT_RECOMMENDATIONS.", "success");
  }).catch(() => {
    alert("No se pudo copiar automáticamente. Aquí está el código:\n\n" + codeStr);
  });
};


// ==========================================
// 🤖 INTEGRACIÓN DE CHATBOT DE INTELIGENCIA ARTIFICIAL (GEMINI IA) — DUAL MODE
// ==========================================
let GEMINI_API_KEY = ""; // Se carga dinámicamente desde Firebase (admin configurable)
let activeAiMode = "support"; // "support" o "student"

const STORE_DOWNLOADS = [
  { label: "FF TELA - GUATE XITER", url: "https://www.mediafire.com/file/lbkphj2r4083kt8/Free+Fire+-+Tela.xapk/file", icon: "📱" },
  { label: "FF NORMAL - GUATE XITER", url: "https://www.mediafire.com/file/5kwmcyexfuv8q2m/Free+Fire+-+V7.xapk/file", icon: "🔥" },
  { label: "EXE BYPASS (Inyector)", url: "https://www.mediafire.com/file/jv02gusw3tlakoj/GuateXiters__-_Bypass.exe/file", icon: "🛡️" },
  { label: "EXE PANEL (Instalador)", url: "https://www.mediafire.com/file/anpzlzpy0exrg48/Guate_Xiter.exe/file", icon: "🧩" },
  { label: "REQUERIMIENTOS DE SISTEMA", url: "https://www.mediafire.com/file/2n1qkliw3e3q2w5/Instalar_Requisitos.rar/file", icon: "🛠️" },
  { label: "LIMPIAR EMULADOR", url: "https://www.mediafire.com/file/0v0vd4onbdhjpp2/BSTCleaner_native.exe/file", icon: "🧹" },
  { label: "EMULADOR RECOMENDADO 1", url: "https://www.mediafire.com/file/lopw3stee0oasp6/BlueStacks_5.22.130_%252829%2529.exe/file", icon: "🟦" },
  { label: "BST Micro 5.22 optimizado", url: "https://www.mediafire.com/file/19fnc5dzogdqjih/BlueStacksMicroInstaller_5.22.75.6322_native.exe/file", icon: "🟦" }
];

function extractAndFormatLinksStore(text) {
  const urls = text.match(/(https?:\/\/[^\s()<>]+)/gi) || [];
  const uniqueUrls = [...new Set(urls)];
  const links = [];

  uniqueUrls.forEach(url => {
    let cleanUrl = url.replace(/[.,;:!?)]+$/, "");
    let matched = null;
    
    const storeMatch = STORE_DOWNLOADS.find(d => cleanUrl.toLowerCase().includes(d.url.toLowerCase()) || d.url.toLowerCase().includes(cleanUrl.toLowerCase()));
    if (storeMatch) matched = { label: storeMatch.label, icon: storeMatch.icon, url: storeMatch.url };
    
    if (cleanUrl.includes("paypal.me")) {
      matched = { label: "💳 PayPal xDavid", icon: "💳", url: cleanUrl, gold: true };
    } else if (cleanUrl.includes("guate-xiter-store.vercel.app") || cleanUrl.includes("guate-xiter-store")) {
      matched = { label: "🛒 Tienda Guate Xiter PRO", icon: "🛒", url: cleanUrl, gold: true };
    } else if (cleanUrl.includes("wa.me") || cleanUrl.includes("whatsapp.com")) {
      matched = { label: "📱 Contactar por WhatsApp", icon: "📱", url: cleanUrl };
    } else if (cleanUrl.includes("tiktok.com")) {
      matched = { label: "🎵 TikTok Oficial", icon: "🎵", url: cleanUrl };
    } else if (cleanUrl.includes("youtube.com")) {
      matched = { label: "▶️ YouTube Canal", icon: "▶️", url: cleanUrl };
    } else if (cleanUrl.includes("discord.com") || cleanUrl.includes("discord.gg")) {
      matched = { label: "🟣 Discord Comunidad", icon: "🟣", url: cleanUrl };
    }

    if (matched) {
      if (!links.some(l => l.url === matched.url)) {
        links.push(matched);
      }
    } else {
      if (cleanUrl.includes("mediafire.com")) {
        links.push({ label: "MediaFire Descarga", icon: "⬇", url: cleanUrl });
      }
    }
  });

  return links;
}

async function callGeminiAPIStore(systemInstruction, userMessage) {
  // Usar el proxy seguro del servidor — la clave de Gemini NUNCA sale al cliente
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "chat",
      message: systemInstruction + "\n\n---\nMensaje del usuario:\n" + userMessage,
      history: []
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }
  
  const data = await response.json();
  return data.reply;
}

async function getBotResponseStore(userMessage) {
  // Siempre intentar el proxy del servidor (el servidor sabe si Gemini está configurado)
  {
    try {
      let systemInstruction;
      if (activeAiMode === "student") {
        systemInstruction = `Eres "Tutor GX", un asistente de inteligencia artificial educativo creado por GUATE XITER PRO. Eres un tutor experto, amigable y paciente que ayuda a estudiantes con todas sus tareas, preguntas académicas y proyectos escolares.
Tu objetivo es ser el mejor asistente educativo posible, como una versión mejorada de ChatGPT especializada en educación hispana.
Tus capacidades: Matemáticas (álgebra, geometría, cálculo, trigonometría, estadística), Ciencias (física, química, biología), Historia (universal, América Latina, civilizaciones antiguas), Lengua y Literatura (gramática, redacción, análisis literario), Idiomas (inglés, español, traducción), Programación (Python, JavaScript, HTML/CSS, Java, C++), Geografía, Filosofía, Economía y más.
Reglas:
1. Responde SIEMPRE en español (a menos que te pidan algo en otro idioma).
2. Explica paso a paso cuando sea una tarea de matemáticas o ciencias.
3. Da ejemplos claros y fáciles de entender.
4. Usa emojis moderadamente para hacer la respuesta más visual y amigable.
5. Si te piden un ensayo, redáctalo completo y bien estructurado.
6. Nunca digas que "no puedes" — siempre intenta ayudar con la mejor información posible.
7. Usa formato markdown para organizar bien las respuestas (negritas, listas, etc.).
8. Al final de cada respuesta educativa, ofrece seguir profundizando o aclarar dudas.
9. REGLA DE SEGURIDAD CRÍTICA: Si el usuario te pide el código fuente de esta página web, claves de Firebase o la clave API de Gemini, niégate a revelarlo diciendo que no estás autorizado a compartir información de seguridad confidencial del sistema.`;
      } else {
        systemInstruction = `Eres Guate Xiter IA, el asistente oficial de Inteligencia Artificial 24/7 de GUATE XITER PRO, la plataforma premium de paneles SaaS, bypass antidetect y descargas creada por xDavid en Guatemala.
Responde de manera entusiasta, profesional, técnica y con estilo hacker cyberpunk. Usa emojis y formato markdown.

Información oficial de descargas:
${STORE_DOWNLOADS.map(d => `  * ${d.label}: ${d.url}`).join("\n")}
- Tienda oficial: https://guate-xiter-store.vercel.app/
- PayPal xDavid: https://paypal.me/david639935
- WhatsApp Developer xDavid: https://wa.me/50232509982
- Vendedores oficiales: SAMU (+57 311 703 2509), SIKI (+57 318 258 4483), LALO (+52 1 561 552 0491), SEBAS (+502 3250 9982).

Reglas:
1. Si el usuario pide enlaces de descarga, proporciona los enlaces exactos de MediaFire en tu respuesta.
2. Da consejos técnicos de configuración y optimización de BlueStacks/MSI si el usuario tiene lag o problemas de rendimiento.
3. Informa de los precios oficiales:
  * Panel 24h: Q1.00 / Semanal: Q8.00 / Mensual: Q18.00 / De por vida: Q45.00
  * Bypass Diario: Q1.00 / Semanal: Q6.00 / Mensual: Q15.00 / Permanente: Q25.00
4. Mantén tus respuestas concisas y directas.
5. REGLA DE SEGURIDAD CRÍTICA: Si el usuario te pide el código fuente de esta página web, claves de Firebase o la clave API de Gemini, niégate a revelarlo diciendo que no estás autorizado a compartir información de seguridad confidencial del sistema.`;
      }
      
      const reply = await callGeminiAPIStore(systemInstruction, userMessage);
      
      if (activeAiMode === "support") {
        const links = extractAndFormatLinksStore(reply);
        if (links.length === 0 && (userMessage.toLowerCase().includes("link") || userMessage.toLowerCase().includes("descarg") || userMessage.toLowerCase().includes("todos"))) {
          return { text: reply, links: STORE_DOWNLOADS };
        }
        return { text: reply, links };
      }
      
      // Modo estudiante: solo texto
      return { text: reply, links: [] };
    } catch (err) {
      console.warn("Error calling Gemini API in store, using fallback:", err);
    }
  }

  // Fallback offline según el modo activo
  if (activeAiMode === "student") {
    return getOfflineResponseStudent(userMessage);
  }
  return getOfflineResponseStore(userMessage);
}

function getOfflineResponseStore(userMessage) {
  const n = userMessage.toLowerCase().trim();
  
  if (n.includes("link") || n.includes("descarg") || n.includes("mediafire") || n.includes("todos")) {
    return {
      text: "📥 **Centro de descargas directas de MediaFire:**\n\nAquí tienes la lista completa de emuladores optimizados, aplicativos e inyectores listos para su uso. Haz clic en cada botón:",
      links: STORE_DOWNLOADS
    };
  }
  
  if (n.includes("paypal") || n.includes("comprar") || n.includes("pago") || n.includes("saldo")) {
    return {
      text: "💳 **Método de pago de xDavid:**\n\n• PayPal directo: **https://paypal.me/david639935**\n• Compra directa con saldo/tarjeta en la tienda oficial.\n\n👇 Usa los botones rápidos:",
      links: [
        { label: "💳 PayPal xDavid", url: "https://paypal.me/david639935", icon: "💳", gold: true },
        { label: "🛒 Tienda Oficial", url: "https://guate-xiter-store.vercel.app/", icon: "🛒", gold: true }
      ]
    };
  }

  if (n.includes("precios") || n.includes("planes") || n.includes("cuanto cuesta") || n.includes("bypass") || n.includes("panel")) {
    return {
      text: "💰 **Suscripciones Oficiales de Guate Xiter PRO:**\n\n**🎮 Panel por Tiempo:**\n• Panel 24 Horas: Q1.00\n• Panel Semanal: Q8.00\n• Panel Mensual: Q18.00\n• Panel de por Vida: Q45.00\n\n**🛡️ Bypass VIP Anti-Ban:**\n• Bypass Diario: Q1.00\n• Bypass Semanal: Q6.00\n• Bypass Mensual: Q15.00\n• Bypass Permanente: Q25.00\n\nAdquiérelos al instante en nuestra tienda:",
      links: [
        { label: "🛒 Tienda Oficial", url: "https://guate-xiter-store.vercel.app/", icon: "🛒", gold: true }
      ]
    };
  }

  if (n.includes("vendedor") || n.includes("distribuidor") || n.includes("samu") || n.includes("siki") || n.includes("lalo") || n.includes("sebas")) {
    return {
      text: "🔥 **Vendedores autorizados del inyector:**\n\n• **SAMU** (Colombia): +57 311 703 2509\n• **SIKI** (Colombia): +57 318 258 4483\n• **LALO** (México): +52 1 561 552 0491\n• **SEBAS** (Guatemala): +502 3250 9982\n\n👇 Clic abajo para contactarlos:",
      links: [
        { label: "📱 WhatsApp SAMU", url: "https://wa.me/573117032509", icon: "✅" },
        { label: "📱 WhatsApp SIKI", url: "https://wa.me/573182584483", icon: "✅" },
        { label: "📱 WhatsApp LALO", url: "https://wa.me/5215615520491", icon: "✅" },
        { label: "📱 WhatsApp SEBAS", url: "https://wa.me/50232509982", icon: "✅" }
      ]
    };
  }

  if (n.includes("bluestacks") || n.includes("msi") || n.includes("lag") || n.includes("configurar")) {
    return {
      text: "🖥️ **Emuladores y Configuración de Rendimiento:**\n\nRecomendamos **BlueStacks 5** o **MSI App Player** optimizado. Para reducir el lag, asegúrate de:\n1. Activar la virtualización (VT) en la BIOS.\n2. Asignar 4 núcleos y 4GB de RAM en la configuración del emulador.\n3. Ejecutar BST Cleaner para limpiar versiones anteriores.\n\n👇 Descarga los emuladores directo:",
      links: [
        { label: "BST Cleaner native", url: "https://www.mediafire.com/file/0v0vd4onbdhjpp2/BSTCleaner_native.exe/file", icon: "🧹" },
        { label: "BlueStacks 5 optimizado", url: "https://www.mediafire.com/file/lopw3stee0oasp6/BlueStacks_5.22.130_%252829%2529.exe/file", icon: "🟦" },
        { label: "MSI App Player", url: "https://www.mediafire.com/file/19fnc5dzogdqjih/BlueStacksMicroInstaller_5.22.75.6322_native.exe/file", icon: "🟥" }
      ]
    };
  }

  return {
    text: "👋 **¿Cómo puedo ayudarte hoy?**\n\nPregúntame sobre:\n• **descargas** o **links** directos.\n• **precios** del panel o bypass.\n• **pagos** por PayPal.\n• **vendedores** autorizados de confianza.\n• **emuladores** o cómo quitar el lag.",
    links: [
      { label: "🛒 Tienda Oficial", url: "https://guate-xiter-store.vercel.app/", icon: "🛒", gold: true }
    ]
  };
}

// ==========================================
// 📚 RESPUESTAS OFFLINE PARA MODO ESTUDIANTE
// ==========================================
function getOfflineResponseStudent(userMessage) {
  const n = userMessage.toLowerCase().trim();
  
  if (n.includes("matemática") || n.includes("ecuación") || n.includes("ecuacion") || n.includes("álgebra") || n.includes("algebra") || n.includes("calcul") || n.includes("derivad") || n.includes("integral") || n.includes("trigonometría") || n.includes("trigonometria")) {
    return {
      text: "🔢 **Tutor GX — Matemáticas**\n\nEstoy listo para ayudarte con cualquier tema de matemáticas:\n\n• **Álgebra:** ecuaciones lineales, cuadráticas, sistemas de ecuaciones, factorización.\n• **Geometría:** áreas, volúmenes, teorema de Pitágoras, congruencia.\n• **Trigonometría:** seno, coseno, tangente, identidades trigonométricas.\n• **Cálculo:** límites, derivadas, integrales.\n• **Estadística:** media, mediana, moda, probabilidad.\n\n📝 **Escribe tu problema exacto** y te lo resolveré paso a paso.",
      links: []
    };
  }

  if (n.includes("ciencia") || n.includes("física") || n.includes("fisica") || n.includes("química") || n.includes("quimica") || n.includes("biología") || n.includes("biologia") || n.includes("célula") || n.includes("celula") || n.includes("fotosíntesis") || n.includes("fotosintesis") || n.includes("átomo") || n.includes("atomo")) {
    return {
      text: "🔬 **Tutor GX — Ciencias Naturales**\n\n¡Las ciencias son fascinantes! Puedo ayudarte con:\n\n• **Física:** movimiento, fuerza, energía, electricidad, ondas, óptica.\n• **Química:** tabla periódica, reacciones químicas, estequiometría, enlaces.\n• **Biología:** células, ADN, ecosistemas, fotosíntesis, evolución, anatomía.\n\n📝 **Escribe tu pregunta específica** y te daré una explicación clara con ejemplos.",
      links: []
    };
  }

  if (n.includes("historia") || n.includes("guerra") || n.includes("revolución") || n.includes("revolucion") || n.includes("independencia") || n.includes("civilización") || n.includes("civilizacion") || n.includes("maya") || n.includes("azteca") || n.includes("colonial")) {
    return {
      text: "📜 **Tutor GX — Historia**\n\nLa historia nos ayuda a comprender el presente:\n\n• **Historia Universal:** Antiguo Egipto, Grecia, Roma, Edad Media, Renacimiento.\n• **Historia de América:** civilizaciones precolombinas (Mayas, Aztecas, Incas), conquista española, independencias.\n• **Historia Contemporánea:** Primera y Segunda Guerra Mundial, Guerra Fría, siglo XXI.\n• **Historia de Guatemala y Centroamérica.**\n\n📝 **Dime el tema o período histórico** y te haré un resumen completo.",
      links: []
    };
  }

  if (n.includes("español") || n.includes("gramática") || n.includes("gramatica") || n.includes("ortografía") || n.includes("ortografia") || n.includes("ensayo") || n.includes("redacción") || n.includes("redaccion") || n.includes("literatura") || n.includes("poema") || n.includes("cuento") || n.includes("verbo")) {
    return {
      text: "📖 **Tutor GX — Lengua y Literatura**\n\nPuedo ayudarte con todo lo relacionado al español:\n\n• **Gramática:** tiempos verbales, sujeto y predicado, oraciones compuestas.\n• **Ortografía:** reglas de acentuación, signos de puntuación, b/v, s/c/z.\n• **Redacción:** ensayos, informes, resúmenes, síntesis, argumentación.\n• **Literatura:** análisis literario, corrientes literarias, obras clásicas.\n\n📝 **Escribe lo que necesitas** y te ayudaré de inmediato.",
      links: []
    };
  }

  if (n.includes("programa") || n.includes("código") || n.includes("codigo") || n.includes("python") || n.includes("javascript") || n.includes("html") || n.includes("css") || n.includes("java") || n.includes("c++") || n.includes("algoritmo")) {
    return {
      text: "💻 **Tutor GX — Programación y Tecnología**\n\n¡La programación es el futuro! Puedo ayudarte con:\n\n• **Python:** variables, listas, funciones, ciclos, POO.\n• **JavaScript:** DOM, eventos, funciones, async/await.\n• **HTML/CSS:** estructura web, diseño responsive, Flexbox, Grid.\n• **Java / C++:** clases, herencia, arrays, algoritmos.\n• **Algoritmos y Lógica:** diagramas de flujo, pseudocódigo.\n\n📝 **Pega tu código o describe el problema** y te ayudaré paso a paso.",
      links: []
    };
  }

  if (n.includes("inglés") || n.includes("ingles") || n.includes("english") || n.includes("traducir") || n.includes("traducción") || n.includes("traduccion") || n.includes("grammar")) {
    return {
      text: "🌎 **Tutor GX — Inglés / English**\n\nI can help you with English! Te ayudo con:\n\n• **Gramática:** present simple, past tense, future, conditionals, modal verbs.\n• **Vocabulario:** palabras comunes, expresiones idiomáticas, phrasal verbs.\n• **Traducción:** español ↔ inglés con explicación.\n• **Redacción en inglés:** essays, paragraphs, formal/informal writing.\n\n📝 **Write your question o pega tu texto** y te ayudo.",
      links: []
    };
  }

  if (n.includes("guía de matemáticas") || n.includes("guia de matematicas") || n.includes("guía matemáticas") || n.includes("guia matematicas")) {
    return {
      text: "📐 **Tutor GX — Guía Completa de Matemáticas** 📊\n\nAquí tienes un resumen temático clave para tus estudios:\n\n1. **Álgebra - Ecuaciones de 2º Grado:**\n   * Fórmula general: `x = (-b ± √(b² - 4ac)) / 2a`\n   * El discriminante `Δ = b² - 4ac` determina el número de soluciones reales (2 si Δ>0, 1 si Δ=0, 0 si Δ<0).\n\n2. **Geometría - Teorema de Pitágoras:**\n   * En un triángulo rectángulo: `a² + b² = c²` (donde `c` es la hipotenusa).\n\n3. **Cálculo - Derivadas Básicas:**\n   * Derivada de una potencia: `d/dx(x^n) = n * x^(n-1)`\n   * Derivada de una constante: `d/dx(C) = 0`\n\n💡 *Tip: Si necesitas resolver un problema específico paso a paso, escríbelo aquí y te daré la solución.*",
      links: []
    };
  }

  if (n.includes("guía de ciencias") || n.includes("guia de ciencias") || n.includes("guía ciencias") || n.includes("guia ciencias")) {
    return {
      text: "🔬 **Tutor GX — Guía Completa de Ciencias Naturales** 🌌\n\nRepasa estos conceptos fundamentales de Física, Química y Biología:\n\n1. **Biología - La Fotosíntesis:**\n   * Proceso mediante el cual las plantas convierten agua, dióxido de carbono y luz solar en oxígeno y glucosa (energía).\n   * Ecuación: `6CO₂ + 6H₂O + Luz → C₆H₁₂O₆ + 6O₂`\n\n2. **Física - Segunda Ley de Newton:**\n   * La fuerza aplicada sobre un cuerpo es proporcional a su aceleración.\n   * Fórmula: `F = m * a` (Fuerza = Masa x Aceleración).\n\n3. **Química - El Átomo:**\n   * Formado por Protones (carga positiva) y Neutrones (sin carga) en el núcleo, y Electrones (carga negativa) en la corteza.\n\n💡 *Tip: Escribe tu pregunta sobre cualquier elemento químico o fenómeno físico y te lo explico.*",
      links: []
    };
  }

  if (n.includes("guía de historia") || n.includes("guia de historia") || n.includes("guía historia") || n.includes("guia historia")) {
    return {
      text: "📜 **Tutor GX — Guía de Historia Universal y de Guatemala** 🌍\n\nUn recorrido rápido por hechos históricos trascendentales:\n\n1. **Civilización Maya (300 a.C. - 900 d.C.):**\n   * Destacaron en astronomía, matemáticas (uso del cero), arquitectura (pirámides como Tikal) y escritura jeroglífica.\n\n2. **La Revolución Industrial (Siglo XVIII):**\n   * Surgimiento de las máquinas de vapor y automatización en Gran Bretaña, marcando el paso de una economía agrícola a una industrializada.\n\n3. **Independencia de Centroamérica (15 de Septiembre de 1821):**\n   * Firma del acta que declaró a Guatemala y las demás provincias libres del dominio del Imperio Español.\n\n💡 *Tip: Pregúntame sobre cualquier personaje histórico o guerra para darte un resumen detallado.*",
      links: []
    };
  }

  if (n.includes("guía de programación") || n.includes("guia de programacion") || n.includes("guía programación") || n.includes("guia programacion")) {
    return {
      text: "💻 **Tutor GX — Guía Básica de Programación** 🚀\n\nConceptos iniciales para crear tus propios programas:\n\n1. **Variables (Guardar Datos en Python):**\n   `nombre = 'xDavid'`\n   `edad = 19`\n\n2. **Condicionales (Tomar Decisiones en JS):**\n   ```javascript\n   if (saldo >= precio) {\n     console.log('Compra aprobada');\n   } else {\n     console.log('Saldo insuficiente');\n   }\n   ```\n\n3. **Bucles (Repetir código en JS):**\n   ```javascript\n   for (let i = 0; i < 5; i++) {\n     console.log('Línea número ' + i);\n   }\n   ```\n\n💡 *Tip: Pega tu código con errores y te diré cómo solucionarlo de inmediato.*",
      links: []
    };
  }

  if (n.includes("guía") || n.includes("guia") || n.includes("estudio") || n.includes("curso") || n.includes("clase") || n.includes("materia")) {
    return {
      text: "📚 **Tutor GX — Guías de Estudio Temáticas** 🎓\n\nHe preparado guías interactivas de estudio para ayudarte a comprender mejor los temas escolares más importantes. Dime cuál te interesa:\n\n• 📐 **Guía de Matemáticas** — Álgebra, Geometría y Cálculo.\n• 🔬 **Guía de Ciencias** — Fotosíntesis, Leyes de Newton y Átomos.\n• 📜 **Guía de Historia** — Los Mayas, Revolución Industrial e Independencia.\n• 💻 **Guía de Programación** — Primeros pasos en Python y JavaScript.\n\n✏️ **Escribe el nombre de la guía** que quieres abrir (ej: *Guía de Matemáticas*) y te mostraré el contenido detallado.",
      links: []
    };
  }

  if (n.includes("tarea") || n.includes("ayuda") || n.includes("ejercicio") || n.includes("examen") || n.includes("trabajo") || n.includes("proyecto")) {
    return {
      text: "📚 **Tutor GX — Asistente de Tareas**\n\n¡Estoy aquí para ayudarte! Dime:\n\n• 📐 **La materia** (matemáticas, ciencias, historia, etc.)\n• 📝 **El ejercicio o pregunta exacta**\n• 📄 Si es un **ensayo o redacción**, dime el tema y la extensión.\n\nMientras más detallada sea tu pregunta, ¡mejor será mi respuesta! 💪",
      links: []
    };
  }

  // Respuestas dinámicas generales para que responda "de todo" (modo offline inteligente)
  if (n.includes("casa") || n.includes("edificio") || n.includes("hogar") || n.includes("vivienda")) {
    return {
      text: "📚 **Tutor GX — Definición y Análisis** 🏠\n\nUna **casa** o vivienda es una estructura arquitectónica diseñada para ser habitada por seres humanos, sirviendo como hogar y refugio contra las inclemencias climáticas.\n\n• **Propósito:** Brinda seguridad, privacidad, resguardo y espacio de convivencia familiar.\n• **Estructura básica:** Cimientos, paredes portantes, vigas, cubierta/techo, y divisiones internas (habitaciones, baño, cocina).\n• **Materiales:** Varían según la región y época (ladrillo, cemento, madera, adobe, piedra).\n• **Concepto social:** Va más allá de lo físico; representa pertenencia, protección y el núcleo social básico (el hogar).\n\n✏️ **Escríbeme tu pregunta específica** y te daré la mejor respuesta posible.",
      links: []
    };
  }

  // Detectar solicitudes de resúmenes genéricos
  if (n.includes("resumen") || n.includes("sintesis") || n.includes("resumir")) {
    const subject = userMessage.replace(/resumen|síntesis|resumir|sintetizar|de|la|el|los|las/gi, "").trim();
    return {
      text: `📚 **Tutor GX — Módulo de Resúmenes** 📄\n\nHas solicitado un resumen sobre: **"${subject || "tu tema"}"**.\n\nAquí tienes un marco educativo y conceptual general:\n\n1. **Contexto Principal:** Este tema abarca conceptos fundamentales que influyen en el aprendizaje y la cultura general.\n2. **Puntos Clave:** Se destaca por su relevancia en el ámbito académico, permitiendo a los estudiantes analizar sus causas, efectos y aplicaciones prácticas.\n3. **Conclusión:** Comprender este tema es clave para desarrollar un pensamiento crítico y resolver problemas cotidianos.\n\n✏️ **Escríbeme el tema exacto** y te daré un resumen más detallado y personalizado.`,
      links: []
    };
  }

  // Analizador genérico de preguntas "Qué es / Cómo es"
  if (n.startsWith("qué ") || n.startsWith("que ") || n.startsWith("cómo ") || n.startsWith("como ") || n.startsWith("definición") || n.startsWith("definicion")) {
    const subject = userMessage.replace(/^(qué es|que es|cómo funciona|como funciona|cómo es|como es|definición de|definicion de|la|el|los|las)\s+/i, "").trim();
    return {
      text: `📚 **Tutor GX — Enciclopedia Escolar** 🎓\n\nHas preguntado sobre: **"${subject || "este tema"}"**\n\nAquí tienes una explicación general del concepto:\n\n• **Definición:** Es un elemento o fenómeno importante que se estudia en el ámbito educativo para comprender cómo funciona el mundo.\n• **Aplicación:** Dependiendo del área (Ciencias, Humanidades, Matemáticas), tiene un impacto directo en el desarrollo técnico o social.\n• **Estudio:** Se analiza mediante la observación, la experimentación o el estudio histórico.\n\n✏️ **Pregúntame con más detalle** y te daré una respuesta completa y personalizada.`,
      links: []
    };
  }

  return {
    text: "📚 **¡Hola! Soy Tutor GX, tu asistente educativo inteligente.** 🎓\n\nPuedo ayudarte con **cualquier materia escolar**:\n\n• 🔢 **Matemáticas** — ecuaciones, álgebra, geometría, cálculo\n• 🔬 **Ciencias** — física, química, biología\n• 📜 **Historia** — universal, de América, contemporánea\n• 📖 **Español** — gramática, redacción, ensayos, literatura\n• 🌎 **Inglés** — traducción, gramática, vocabulario\n• 💻 **Programación** — Python, JavaScript, HTML, algoritmos\n\n✏️ **Escribe tu pregunta o pega tu tarea** y te la resuelvo al instante. O escribe **guía** para ver nuestras guías de estudio interactivas.",
    links: []
  };
}

// ==========================================
// 🔄 SWITCH ENTRE MODOS DE IA (SOPORTE / ESTUDIANTE)
// ==========================================
window.switchAiMode = function(mode) {
  clickSound();
  activeAiMode = mode;

  const supportBtn = document.getElementById("ai-mode-support");
  const studentBtn = document.getElementById("ai-mode-student");
  if (supportBtn) supportBtn.classList.remove("active", "student-active");
  if (studentBtn) studentBtn.classList.remove("active", "student-active");

  if (mode === "support") {
    if (supportBtn) supportBtn.classList.add("active");
  } else {
    if (studentBtn) studentBtn.classList.add("active", "student-active");
  }

  const avatar = document.getElementById("ai-bot-avatar");
  const title = document.getElementById("ai-chat-title");
  const status = document.getElementById("ai-chat-status");

  if (mode === "student") {
    if (avatar) avatar.textContent = "📚";
    if (title) title.textContent = "Tutor GX — IA Educativa";
    if (status) status.textContent = "Asistente de tareas y estudios 24/7";
  } else {
    if (avatar) avatar.textContent = "🤖";
    if (title) title.textContent = "IA Asistente Guate Xiter";
    if (status) status.textContent = "Inteligencia Artificial activa 24/7";
  }

  const chatBox = document.getElementById("chat-descargas");
  if (chatBox) chatBox.innerHTML = "";

  const quickContainer = document.getElementById("quick-descargas");
  if (quickContainer) {
    quickContainer.innerHTML = "";
    const phrases = mode === "student"
      ? ["Ayúdame con matemáticas", "Explicame fotosíntesis", "Traduce al inglés", "Ayuda con mi tarea", "Cómo programar en Python"]
      : ["Dame todos los enlaces", "Bypass Diario VIP", "BlueStacks optimizado", "Vendedores autorizados", "Contacto programador"];

    phrases.forEach(phrase => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = phrase;
      btn.addEventListener("click", () => {
        const input = document.getElementById("input-descargas");
        if (input) input.value = phrase;
        document.getElementById("form-descargas")?.dispatchEvent(new Event("submit", { cancelable: true }));
      });
      quickContainer.appendChild(btn);
    });
  }

  const input = document.getElementById("input-descargas");
  if (input) {
    input.placeholder = mode === "student"
      ? "Escribe tu pregunta o pega tu tarea aquí..."
      : "Pregúntale a la IA (ej: dame los links, cómo quito el lag)...";
  }

  if (mode === "student") {
    appendMessageStore("chat-descargas", "bot", {
      text: "📚 **¡Hola! Soy Tutor GX, tu Inteligencia Artificial educativa de GUATE XITER PRO.** 🎓\n\nEstoy aquí para ayudarte con **todas tus tareas y estudios**:\n\n• 🔢 Matemáticas — 🔬 Ciencias — 📜 Historia\n• 📖 Español y Literatura — 🌎 Inglés\n• 💻 Programación — 🌍 Geografía — y más\n\n✏️ **Escribe tu pregunta o pega tu tarea** y te la resuelvo paso a paso. ¡Usa los botones rápidos!",
      links: []
    });
  } else {
    appendMessageStore("chat-descargas", "bot", {
      text: "🤖 **¡Hola! Bienvenido a la Inteligencia Artificial oficial de GUATE XITER PRO.** 🇬🇹\n\nPregúntame cualquier duda sobre el **Bypass**, **precios**, **vendedores autorizados**, o pídeme **enlaces de descarga directa** y te los entregaré al instante.",
      links: [
        { label: "🛒 Tienda Guate Xiter PRO", url: "https://guate-xiter-store.vercel.app/", icon: "🛒", gold: true },
        { label: "💳 PayPal xDavid", url: "https://paypal.me/david639935", icon: "💳", gold: true }
      ]
    });
  }
};

function nowStore() {
  return new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
}

function formatTextStore(text) {
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, "<br>");
}

function buildLinkCardsStore(links) {
  if (!links || !links.length) return "";
  let html = '<div class="link-cards">';
  links.forEach((l) => {
    let cls = " link-btn";
    if (l.blue) cls += " blue";
    if (l.gold) cls += " gold";
    html += `<a class="${cls.trim()}" href="${l.url}" target="_blank" rel="noopener noreferrer">`;
    html += `<span class="lb-icon">${l.icon || "⬇"}</span>`;
    html += `<span class="lb-text">${l.label}</span>`;
    html += `<span class="lb-arrow">↗</span></a>`;
    html += `<div class="url-copy">${l.url}</div>`;
  });
  html += '<p class="copy-hint">↑ Clic en el botón o copia el link</p></div>';
  return html;
}

function appendMessageStore(containerId, role, content) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const div = document.createElement("div");
  div.className = `msg ${role}`;

  const payload = typeof content === "string" ? { text: content, links: [] } : content;
  let html = formatTextStore(payload.text) + buildLinkCardsStore(payload.links);
  div.innerHTML = html + `<span class="time">${nowStore()}</span>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function appendTypingIndicatorStore(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const div = document.createElement("div");
  const id = "typing-" + Math.random().toString(36).substring(2, 9);
  div.id = id;
  div.className = "msg bot typing-indicator-msg";
  div.innerHTML = `
    <div class="typing-indicator">
      <span></span><span></span><span></span>
    </div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return id;
}

function removeTypingIndicatorStore(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function initChatbotStore() {
  const form = document.getElementById("form-descargas");
  const input = document.getElementById("input-descargas");
  const chatId = "chat-descargas";

  if (!form || !input) return;

  // Botones de respuesta rápida
  const quickContainer = document.getElementById("quick-descargas");
  if (quickContainer) {
    const quickPhrases = [
      "Dame todos los enlaces",
      "Bypass Diario VIP",
      "BlueStacks optimizado",
      "Vendedores autorizados",
      "Contacto programador"
    ];
    quickPhrases.forEach(phrase => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = phrase;
      btn.addEventListener("click", () => {
        sendMessage(phrase);
      });
      quickContainer.appendChild(btn);
    });
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    appendMessageStore(chatId, "user", text);
    input.value = "";

    const typingId = appendTypingIndicatorStore(chatId);

    try {
      const reply = await getBotResponseStore(text);
      removeTypingIndicatorStore(typingId);
      appendMessageStore(chatId, "bot", reply);
    } catch (err) {
      removeTypingIndicatorStore(typingId);
      appendMessageStore(chatId, "bot", { text: "❌ Ocurrió un error al procesar tu solicitud con el asistente virtual." });
      console.error(err);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(input.value.trim());
  });

  // Mensaje de bienvenida inicial
  appendMessageStore(chatId, "bot", {
    text: "🤖 **¡Hola! Bienvenido a la Inteligencia Artificial oficial de GUATE XITER PRO.** 🇬🇹\n\nPregúntame cualquier duda sobre el **Bypass**, **precios**, **vendedores autorizados**, o pídeme **enlaces de descarga directa** (como emuladores y Free Fire) y te los entregaré al instante. ¡Usa los botones rápidos para empezar!\n\n💡 *Cambia a modo **📚 IA Estudiantes** arriba para ayuda con tareas, matemáticas, ciencias y más.*",
    links: [
      { label: "🛒 Tienda Guate Xiter PRO", url: "https://guate-xiter-store.vercel.app/", icon: "🛒", gold: true },
      { label: "💳 PayPal xDavid", url: "https://paypal.me/david639935", icon: "💳", gold: true }
    ]
  });
}


// ==========================================
// 🎵 SINCRONIZACIÓN DE MÚSICA EN TIEMPO REAL CON FIREBASE
// ==========================================
function initMusicSync() {
  if (firebaseDB) {
    firebaseDB.ref("music_config").on("value", (snap) => {
      const config = snap.val();
      if (config && config.url) {
        updatePlayerMusic(config.url, config.title || "Canción en Vivo", config.artist || "GUATE XITER PRO");
      }
    });
  }
}


// ==========================================
// 🏁 INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================
window.addEventListener("load", () => {
  updateUserState();
  initRememberedCredentials(); // Cargar credenciales guardadas al iniciar la página
  
  // Registrar el estado activo de la pestaña de inicio
  const homeTab = document.getElementById("tab-home");
  if (homeTab) {
    homeTab.classList.add("active");
  }

  // Inicializar contador de visitantes
  initVisitorCounter();

  // Inicializar seguridad de código fuente
  preventCodeInspection();

  // Inicializar Chatbot de Inteligencia Artificial
  initChatbotStore();

  // Inicializar sincronización de música en vivo
  initMusicSync();

  // Precargar la API de YouTube para reproducción instantánea
  loadYoutubeAPI();

  // Inicializar sincronización de clave Gemini AI desde Firebase
  initGeminiKeySync();
  
  console.log("%cGUATE XITER PRO v3.2 - LOADED", "color:#ff00aa; font-family: 'Orbitron'; font-size:18px; font-weight:bold; text-shadow:0 0 10px rgba(255,0,170,0.5)");
});