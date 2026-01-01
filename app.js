import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

// Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const provider = new GoogleAuthProvider();

// Solo tú
const ADMIN_EMAIL = "joanmengualpardo@gmail.com";

// DOM
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const dashboard = document.getElementById("dashboard");

const tablaMiembros = document.getElementById("miembrosTabla");
const tablaMisiones = document.getElementById("misionesTabla");
const tablaSanciones = document.getElementById("sancionesTabla");
const tablaHistorial = document.getElementById("historialTabla");

// Inputs misiones
const misionTitulo = document.getElementById("misionTitulo");
const misionDescripcion = document.getElementById("misionDescripcion");
const misionPuntos = document.getElementById("misionPuntos");
const crearMisionBtn = document.getElementById("crearMisionBtn");

// Inputs sanciones
const sancionUsuarioId = document.getElementById("sancionUsuarioId");
const sancionMotivo = document.getElementById("sancionMotivo");
const sancionTipo = document.getElementById("sancionTipo");
const crearSancionBtn = document.getElementById("crearSancionBtn");

// Login
loginBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error(e);
    alert("Error al iniciar sesión.");
  }
};

// Logout
logoutBtn.onclick = async () => {
  await signOut(auth);
};

// Estado de auth
auth.onAuthStateChanged(user => {
  if (user && user.email === ADMIN_EMAIL) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    dashboard.style.display = "block";
    iniciarPanel();
  } else if (user && user.email !== ADMIN_EMAIL) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    dashboard.style.display = "none";
    alert("❌ No tienes permiso para acceder a este panel.");
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    dashboard.style.display = "none";
  }
});

// Iniciar listeners
function iniciarPanel() {
  cargarMiembros();
  cargarMisiones();
  cargarSanciones();
  cargarHistorial();
}

// Miembros
function cargarMiembros() {
  onSnapshot(collection(db, "miembros"), (snapshot) => {
    tablaMiembros.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      tablaMiembros.innerHTML += `
        <tr>
          <td>${data.nombre}</td>
          <td>${data.rango}</td>
          <td>${data.puntos}</td>
          <td>
            <button onclick="sumarPuntos('${docSnap.id}', 10)">+10</button>
            <button onclick="sumarPuntos('${docSnap.id}', -10)">-10</button>
            <button onclick="subirRango('${docSnap.id}')">Subir Rango</button>
            <button class="danger" onclick="expulsarMiembro('${docSnap.id}')">Expulsar</button>
          </td>
        </tr>
      `;
    });
  });
}

// Misiones
function cargarMisiones() {
  const q = query(collection(db, "misiones"), orderBy("fechaAsignada", "desc"));
  onSnapshot(q, (snapshot) => {
    tablaMisiones.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      tablaMisiones.innerHTML += `
        <tr>
          <td>${data.titulo}</td>
          <td>${data.descripcion}</td>
          <td>${data.puntos}</td>
          <td>${data.estado || "Activa"}</td>
          <td>
            <button onclick="marcarMisionCompletada('${docSnap.id}')">Marcar completada</button>
            <button class="danger" onclick="borrarMision('${docSnap.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    });
  });
}

// Sanciones
function cargarSanciones() {
  const q = query(collection(db, "sanciones"), orderBy("fecha", "desc"));
  onSnapshot(q, (snapshot) => {
    tablaSanciones.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const fecha = data.fecha?.toDate ? data.fecha.toDate().toLocaleString() : "";
      tablaSanciones.innerHTML += `
        <tr>
          <td>${data.usuarioId}</td>
          <td>${data.tipo}</td>
          <td>${data.motivo}</td>
          <td>${fecha}</td>
          <td>
            <button class="danger" onclick="borrarSancion('${docSnap.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    });
  });
}

// Historial
function cargarHistorial() {
  const q = query(collection(db, "historial"), orderBy("fecha", "desc"));
  onSnapshot(q, (snapshot) => {
    tablaHistorial.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const fecha = data.fecha?.toDate ? data.fecha.toDate().toLocaleString() : "";
      tablaHistorial.innerHTML += `
        <tr>
          <td>${data.accion}</td>
          <td>${data.usuarioId || "-"}</td>
          <td>${data.realizadoPor || "-"}</td>
          <td>${fecha}</td>
        </tr>
      `;
    });
  });
}

// Crear misión
crearMisionBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("❌ No tienes permiso.");

  const titulo = misionTitulo.value.trim();
  const descripcion = misionDescripcion.value.trim();
  const puntos = parseInt(misionPuntos.value || "0", 10);

  if (!titulo || !descripcion || isNaN(puntos)) {
    return alert("Completa todos los campos de la misión.");
  }

  await addDoc(collection(db, "misiones"), {
    titulo,
    descripcion,
    puntos,
    estado: "Activa",
    asignadaPor: user.email,
    fechaAsignada: serverTimestamp()
  });

  await addDoc(collection(db, "historial"), {
    accion: `Creó misión: ${titulo}`,
    usuarioId: null,
    realizadoPor: user.email,
    fecha: serverTimestamp()
  });

  misionTitulo.value = "";
  misionDescripcion.value = "";
  misionPuntos.value = "";
};

// Crear sanción
crearSancionBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("❌ No tienes permiso.");

  const usuarioId = sancionUsuarioId.value.trim();
  const motivo = sancionMotivo.value.trim();
  const tipo = sancionTipo.value;

  if (!usuarioId || !motivo) {
    return alert("Completa todos los campos de la sanción.");
  }

  await addDoc(collection(db, "sanciones"), {
    usuarioId,
    motivo,
    tipo,
    fecha: serverTimestamp(),
    asignadaPor: user.email
  });

  await addDoc(collection(db, "historial"), {
    accion: `${tipo} a ${usuarioId}: ${motivo}`,
    usuarioId,
    realizadoPor: user.email,
    fecha: serverTimestamp()
  });

  sancionUsuarioId.value = "";
  sancionMotivo.value = "";
};

// Acciones globales
window.sumarPuntos = async (id, cantidad) => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("❌ No tienes permiso.");

  const ref = doc(db, "miembros", id);
  const snap = await (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const nuevosPuntos = (data.puntos || 0) + cantidad;

  await updateDoc(ref, { puntos: nuevosPuntos });

  await addDoc(collection(db, "historial"), {
    accion: `Modificó puntos (${cantidad > 0 ? "+" : ""}${cantidad})`,
    usuarioId: id,
    realizadoPor: user.email,
    fecha: serverTimestamp()
  });
};

window.subirRango = async (id) => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("❌ No tienes permiso.");

  const ref = doc(db, "miembros", id);
  const snap = await (await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js")).getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const nuevoRango = "Ascendido";

  await updateDoc(ref, { rango: nuevoRango });

  await addDoc(collection(db, "historial"), {
    accion: `Subió rango a ${nuevoRango}`,
    usuarioId: id,
    realizadoPor: user.email,
    fecha: serverTimestamp()
  });
};

window.expulsarMiembro = async (id) => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("❌ No tienes permiso.");

  if (!confirm("¿Seguro que quieres expulsar a este miembro?")) return;

  await deleteDoc(doc(db, "miembros", id));

  await addDoc(collection(db, "historial"), {
    accion: `Expulsó miembro`,
    usuarioId: id,
    realizadoPor: user.email,
    fecha: serverTimestamp()
  });
};

window.marcarMisionCompletada = async (id) => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("❌ No tienes permiso.");

  const ref = doc(db, "misiones", id);
  await updateDoc(ref, {
    estado: "Completada",
    fechaCompletada: serverTimestamp()
  });

  await addDoc(collection(db, "historial"), {
    accion: `Marcó misión como completada`,
    usuarioId: null,
    realizadoPor: user.email,
    fecha: serverTimestamp()
  });
};

window.borrarMision = async (id) => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("❌ No tienes permiso.");

  await deleteDoc(doc(db, "misiones", id));

  await addDoc(collection(db, "historial"), {
    accion: `Eliminó misión`,
    usuarioId: null,
    realizadoPor: user.email,
    fecha: serverTimestamp()
  });
};

window.borrarSancion = async (id) => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("❌ No tienes permiso.");

  await deleteDoc(doc(db, "sanciones", id));

  await addDoc(collection(db, "historial"), {
    accion: `Eliminó sanción`,
    usuarioId: null,
    realizadoPor: user.email,
    fecha: serverTimestamp()
  });
};
