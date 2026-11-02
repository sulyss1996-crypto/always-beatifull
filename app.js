import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, query, where, onSnapshot, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "always-beautiful.firebaseapp.com",
  projectId: "always-beautiful",
  storageBucket: "always-beautiful.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const HORARIOS_BASE = [
  "08:00 AM", "09:30 AM", "11:00 AM", 
  "02:00 PM", "03:30 PM", "05:00 PM", "06:30 PM"
];

const WHATSAPP_ADMIN = "573194331506"; // Tu número registrado

document.addEventListener('DOMContentLoaded', () => {
  const fechaInput = document.getElementById('fechaCita');
  
  if (fechaInput) {
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.min = hoy;

    fechaInput.addEventListener('change', async (e) => {
      await cargarHorariosDisponibles(e.target.value);
    });

    const formCita = document.getElementById('form-cita');
    if (formCita) {
      formCita.addEventListener('submit', guardarCita);
    }
  }

  if (document.getElementById('galeria-servicios')) {
    escucharServicios();
  }

  if (document.getElementById('lista-citas-admin')) {
    escucharCitasAdmin();
    
    const formServicio = document.getElementById('form-nuevo-servicio');
    if (formServicio) formServicio.addEventListener('submit', publicarServicio);
  }
});

async function cargarHorariosDisponibles(fecha) {
  const selectHora = document.getElementById('horaCita');
  if (!selectHora) return;
  
  selectHora.innerHTML = '<option value="">Cargando horarios...</option>';

  try {
    const q = query(collection(db, "citas"), where("fecha", "==", fecha));
    const querySnapshot = await getDocs(q);
    
    const horasReservadas = [];
    querySnapshot.forEach(doc => {
      horasReservadas.push(doc.data().hora);
    });

    selectHora.innerHTML = '<option value="">-- Selecciona una Hora --</option>';

    HORARIOS_BASE.forEach(hora => {
      const option = document.createElement('option');
      option.value = hora;
      if (horasReservadas.includes(hora)) {
        option.textContent = `${hora} ❌ (Reservado)`;
        option.disabled = true;
      } else {
        option.textContent = `${hora} ✅ (Disponible)`;
      }
      selectHora.appendChild(option);
    });
  } catch (error) {
    console.error("Error al obtener horas: ", error);
  }
}

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
    alert("Hubo un error guardando tu cita. Inténtalo de nuevo.");
  }
}

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
            🔔 Enviar Recordatorio
          </button>
          <button class="btn-danger" onclick="eliminarCita('${id}')">🗑️ Cancelar Cita</button>
        </div>
      `;
      contenedor.appendChild(card);
    });
  });

  if (filtroFecha) {
    filtroFecha.addEventListener('change', () => {
      escucharCitasAdmin();
    });
  }
}

window.enviarRecordatorio = function(nombre, telefono, fecha, hora, servicio) {
  const mensaje = `¡Hola ${nombre}! 💖 Te recordamos tu cita en *Always Beautiful* programada para el día *${fecha}* a las *${hora}* para el servicio de *${servicio}*. ¿Nos confirmas tu asistencia? ¡Te esperamos! ✨`;
  const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
};

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
    alert("¡Servicio publicado con éxito!");
    document.getElementById('form-nuevo-servicio').reset();
  } catch (error) {
    alert("Error al publicar el servicio.");
  }
}

function escucharServicios() {
  const galeria = document.getElementById('galeria-servicios');
  if (!galeria) return;

  onSnapshot(collection(db, "servicios"), (snapshot) => {
    if (snapshot.empty) return; 
    galeria.innerHTML = '';
    snapshot.forEach(docSnap => {
      const item = docSnap.data();
      const div = document.createElement('div');
      div.className = 'card-servicio';
      div.innerHTML = `
        <img src="${item.imagenUrl}" alt="${item.titulo}">
        <h3>${item.titulo}</h3>
        <p class="categoria">${item.categoria}</p>
        <p class="precio">$${Number(item.precio || 0).toLocaleString('es-CO')} COP</p>
      `;
      galeria.appendChild(div);
    });
  });
}

window.eliminarCita = async function(id) {
  if (confirm("¿Estás segura de cancelar esta cita?")) {
    try {
      await deleteDoc(doc(db, "citas", id));
    } catch (error) {
      alert("No se pudo eliminar la cita.");
    }
  }
};
