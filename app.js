import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, query, where, onSnapshot, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 🔑 CONFIGURACIÓN DE FIREBASE
// Reemplaza los datos de abajo por los de tu pantalla de Firebase Console
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDSBd54HRqapxCdoLXBComoAaNyJ31l97U",
  authDomain: "always-beautiful-ebc5c.firebaseapp.com",
  projectId: "always-beautiful-ebc5c",
  storageBucket: "always-beautiful-ebc5c.firebasestorage.app",
  messagingSenderId: "768953502101",
  appId: "1:768953502101:web:20924257462f261e984e9c",
  measurementId: "G-VP92MHFRE4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Número de WhatsApp donde llegarán las reservas (Formato Internacional)
const WHATSAPP_ADMIN = "573194331506"; // Reemplaza con el número de tu esposa

// Lista de Horarios Disponibles por Día
const HORARIOS_BASE = [
   "09:00 AM", "11:00 AM", 
  "02:00 PM", "03:30 PM", "05:00 PM", "06:00 PM"
];

// ==========================================
// 🚀 INICIALIZACIÓN DE LA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const fechaInput = document.getElementById('fechaCita');
  
  if (fechaInput) {
    // Bloquear fechas pasadas en el calendario
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.min = hoy;

    // Escuchar cambios de fecha para actualizar las horas disponibles
    fechaInput.addEventListener('change', async (e) => {
      await cargarHorariosDisponibles(e.target.value);
    });

    // Guardar cita desde el formulario del cliente
    const formCita = document.getElementById('form-cita');
    if (formCita) {
      formCita.addEventListener('submit', guardarCita);
    }
  }

  // Cargar catálogo de servicios si estamos en index.html
  if (document.getElementById('galeria-servicios')) {
    escucharServicios();
  }

  // Cargar panel de administración si estamos en admin.html
  if (document.getElementById('lista-citas-admin')) {
    escucharCitasAdmin();
    
    const formServicio = document.getElementById('form-nuevo-servicio');
    if (formServicio) {
      formServicio.addEventListener('submit', publicarServicio);
    }
  }
});

// ==========================================
// 📅 1. CONSULTAR Y BLOQUEAR HORAS OCUPADAS (CLIENTAS)
// ==========================================
async function cargarHorariosDisponibles(fecha) {
  const selectHora = document.getElementById('horaCita');
  selectHora.innerHTML = '<option value="">Buscando horas disponibles...</option>';

  try {
    const q = query(collection(db, "citas"), where("fecha", "==", fecha));
    const querySnapshot = await getDocs(q);
    
    const horasReservadas = [];
    querySnapshot.forEach(docSnap => {
      horasReservadas.push(docSnap.data().hora);
    });

    selectHora.innerHTML = '<option value="">-- Selecciona una Hora --</option>';

    HORARIOS_BASE.forEach(hora => {
      const option = document.createElement('option');
      option.value = hora;
      if (horasReservadas.includes(hora)) {
        option.textContent = `${hora} ❌ (Ocupado)`;
        option.disabled = true;
      } else {
        option.textContent = `${hora} ✅ (Disponible)`;
      }
      selectHora.appendChild(option);
    });
  } catch (error) {
    console.error("Error consultando la base de datos:", error);
    selectHora.innerHTML = '<option value="">Error al cargar horas</option>';
  }
}

// ==========================================
// 📱 2. REGISTRAR CITA Y REDIRIGIR A WHATSAPP
// ==========================================
async function guardarCita(e) {
  e.preventDefault();

  const datosCita = {
    nombre: document.getElementById('nombreCliente').value,
    telefono: document.getElementById('telefonoCliente').value,
    servicio: document.getElementById('servicioSeleccionado').value,
    fecha: document.getElementById('fechaCita').value,
    hora: document.getElementById('horaCita').value,
    creadoEn: new Date()
  };

  try {
    await addDoc(collection(db, "citas"), datosCita);
    
    const mensaje = `¡Hola! 💖 Deseo agendar una cita en *Always Beautiful Studio*:\n\n` +
                    `👤 *Nombre:* ${datosCita.nombre}\n` +
                    `📱 *Teléfono:* ${datosCita.telefono}\n` +
                    `💅 *Servicio:* ${datosCita.servicio}\n` +
                    `📅 *Fecha:* ${datosCita.fecha}\n` +
                    `⏰ *Hora:* ${datosCita.hora}\n\n` +
                    `¿Me confirmas la disponibilidad, por favor?`;

    const url = `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');

    alert("¡Cita reservada con éxito! Te estamos redirigiendo a WhatsApp para confirmar.");
    document.getElementById('form-cita').reset();
  } catch (error) {
    console.error("Error guardando cita:", error);
    alert("Hubo un problema al guardar la cita. Inténtalo de nuevo.");
  }
}

// ==========================================
// 👑 3. PANEL DE ADMINISTRADORA (CITAS Y RECORDATORIOS)
// ==========================================
function escucharCitasAdmin() {
  const contenedor = document.getElementById('lista-citas-admin');
  const filtroFecha = document.getElementById('filtroFechaAdmin');

  onSnapshot(query(collection(db, "citas")), (snapshot) => {
    contenedor.innerHTML = '';

    if (snapshot.empty) {
      contenedor.innerHTML = '<p>No hay citas agendadas por el momento.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const cita = docSnap.data();
      const id = docSnap.id;

      if (filtroFecha && filtroFecha.value && cita.fecha !== filtroFecha.value) {
        return;
      }

      const card = document.createElement('div');
      card.className = 'cita-card';
      card.innerHTML = `
        <div class="cita-info">
          <h3>👤 ${cita.nombre}</h3>
          <p><strong>💅 Servicio:</strong> ${cita.servicio}</p>
          <p><strong>📅 Fecha:</strong> ${cita.fecha} | <strong>⏰ Hora:</strong> ${cita.hora}</p>
          <p><strong>📱 Teléfono:</strong> ${cita.telefono}</p>
        </div>
        <div class="cita-acciones">
          <button class="btn-reminder" onclick="enviarRecordatorio('${cita.nombre}', '${cita.telefono}', '${cita.fecha}', '${cita.hora}', '${cita.servicio}')">
            🔔 Enviar Recordatorio (1 día antes)
          </button>
          <button class="btn-danger" onclick="eliminarCita('${id}')">🗑️ Cancelar Cita</button>
        </div>
      `;
      contenedor.appendChild(card);
    });
  });
}

// Enviar mensaje de recordatorio por WhatsApp
window.enviarRecordatorio = function(nombre, telefono, fecha, hora, servicio) {
  const mensaje = `¡Hola ${nombre}! 💖 Te recordamos tu cita en *Always Beautiful Studio* para mañana *${fecha}* a las *${hora}* para el servicio de *${servicio}*. ¿Nos confirmas tu asistencia? ¡Te esperamos! ✨`;
  const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
};

// Cancelar/Eliminar Cita
window.eliminarCita = async function(id) {
  if (confirm("¿Estás segura de cancelar esta cita?")) {
    await deleteDoc(doc(db, "citas", id));
  }
};

// ==========================================
// 📸 4. GESTIÓN DEL CATÁLOGO DE SERVICIOS
// ==========================================
async function publicarServicio(e) {
  e.preventDefault();
  const nuevoServicio = {
    titulo: document.getElementById('tituloServicio').value,
    categoria: document.getElementById('categoriaServicio').value,
    precio: document.getElementById('precioServicio').value,
    imagenUrl: document.getElementById('urlImagen').value
  };

  try {
    await addDoc(collection(db, "servicios"), nuevoServicio);
    alert("¡Servicio publicado con éxito en el catálogo!");
    document.getElementById('form-nuevo-servicio').reset();
  } catch (error) {
    console.error("Error al publicar servicio:", error);
  }
}

function escucharServicios() {
  const galeria = document.getElementById('galeria-servicios');
  onSnapshot(collection(db, "servicios"), (snapshot) => {
    galeria.innerHTML = '';
    
    if (snapshot.empty) {
      galeria.innerHTML = '<p>No hay fotos disponibles en el catálogo.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const item = docSnap.data();
      const div = document.createElement('div');
      div.className = 'card-servicio';
      div.innerHTML = `
        <img src="${item.imagenUrl}" alt="${item.titulo}">
        <h3>${item.titulo}</h3>
        <p class="categoria">${item.categoria}</p>
        <p class="precio">$${Number(item.precio).toLocaleString('es-CO')} COP</p>
      `;
      galeria.appendChild(div);
    });
  });
}
