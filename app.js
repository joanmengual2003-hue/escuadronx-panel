import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig } from "./firebaseConfig.js";

// ✅ Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const provider = new GoogleAuthProvider();

// ✅ Email del único admin permitido
const ADMIN_EMAIL = "joanmengualpardo@gmail.com";

// ✅ Elementos del DOM
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const dashboard = document.getElementById("dashboard");
const tabla = document.getElementById("miembrosTabla");

// ✅ Login con Google
loginBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    alert("Error al iniciar sesión.");
  }
};

// ✅ Logout
logoutBtn.onclick = async () => {
  await signOut(auth);
};

// ✅ Detectar cambios de sesión
auth.onAuthStateChanged(user => {
  if (user) {
    if (user.email === ADMIN_EMAIL) {
      // Es Joan → acceso total
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      dashboard.style.display = "block";
      cargarMiembros();
    } else {
      // No es Joan → acceso denegado
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      dashboard.style.display = "none";
      alert("❌ No tienes permiso para acceder a este panel.");
    }
  } else {
    // No logueado
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    dashboard.style.display = "none";
  }
});

// ✅ Cargar miembros en tiempo real (solo si es Joan)
function cargarMiembros() {
  onSnapshot(collection(db, "miembros"), (snapshot) => {
    tabla.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      tabla.innerHTML += `
        <tr>
          <td>${data.nombre}</td>
          <td>${data.rango}</td>
          <td>${data.puntos}</td>
          <td>
            <button onclick="sumarPuntos('${docSnap.id}')">+10</button>
            <button onclick="subirRango('${docSnap.id}')">Subir Rango</button>
          </td>
        </tr>
      `;
    });
  });
}

// ✅ Acciones (solo se ejecutan si el panel está visible)
window.sumarPuntos = async (id) => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("❌ No tienes permiso.");
  const ref = doc(db, "miembros", id);
  await updateDoc(ref, { puntos: 10 });
};

window.subirRango = async (id) => {
  const user = auth.currentUser;
  if (!user || user.email !== ADMIN_EMAIL) return alert("❌ No tienes permiso.");
  const ref = doc(db, "miembros", id);
  await updateDoc(ref, { rango: "Ascendido" });
};
