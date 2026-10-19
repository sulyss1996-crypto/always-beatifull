// REGISTRO DE SERVICE WORKER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('Service Worker Registrado'))
    .catch(err => console.log('Error SW:', err));
}

// BASE DE DATOS LOCAL
let catalogoFotos = JSON.parse(localStorage.getItem('ab_catalogo')) || [
  { id: 1, titulo: "Uñas Estilo Mariposa", categoria: "uñas", img: "portada.jpg" }
];

let citasAgendadas = JSON.parse(localStorage.getItem('ab_citas')) || [];
let filtroActual = 'todos';

// INICIALIZACIÓN DE PÁGINA
document.addEventListener('DOMContentLoaded', () => {
  renderizarCatalogo();
  renderizarAdminGaleria();
  renderizarCitasAdmin();
});

// FILTRAR Y RENDERIZAR CATÁLOGO CLIENTA
function filtrarCatalogo(categoria) {
  filtroActual = categoria;
  document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
  if (event) event.target.classList.add('active');
  renderizarCatalogo();
}

function renderizarCatalogo() {
  const contenedor = document.getElementById('galeria-servicios');
  if (!contenedor) return;

  contenedor.innerHTML = '';
  const filtrados = filtroActual === 'todos' 
    ? catalogoFotos 
    : catalogoFotos.filter(item => item.categoria === filtroActual);

  if (filtrados.length === 0) {
    contenedor.innerHTML = '<p class="subtext">No hay diseños en esta categoría por ahora.</p>';
    return;
  }

  filtrados.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card-foto';
    card.innerHTML = `
      <img src="${item.img}" alt="${item.titulo}">
      <div class="card-body">
        <h4>${item.titulo}</h4>
        <button class="btn-seleccionar" onclick="seleccionarEstilo('${item.titulo}')">✨ Elegir este diseño</button>
      </div>
    `;
    contenedor.appendChild(card);
  });
}

function seleccionarEstilo(titulo) {
  const inputDiseno = document.getElementById('diseno-seleccionado');
  if (inputDiseno) {
    inputDiseno.value = titulo;
    window.location.hash = "#reservas";
  }
}

// AGENDAR CITA Y GUARDAR
function agendarCita(e) {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const servicio = document.getElementById('servicio').value;
  const diseno = document.getElementById('diseno-seleccionado').value || 'Sin diseño específico';
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;

  const nuevaCita = { id: Date.now(), nombre, servicio, diseno, fecha, hora };
  citasAgendadas.push(nuevaCita);
  localStorage.setItem('ab_citas', JSON.stringify(citasAgendadas));

  // MENSAJE WHATSAPP (3194331506)
  const telefono = "573194331506";
  const mensaje = `Hola! Deseo agendar una cita.%0A%0A👤 *Cliente:* ${nombre}%0A💅 *Servicio:* ${servicio}%0A🎨 *Estilo Elegido:* ${diseno}%0A📅 *Fecha:* ${fecha}%0A⏰ *Hora:* ${hora}`;

  window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
}

// FUNCIONES ADMIN
function cambiarPestana(pestana) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.btn-tab').forEach(el => el.classList.remove('active'));

  if (pestana === 'subir') {
    document.getElementById('sec-subir').classList.add('active');
  } else {
    document.getElementById('sec-citas').classList.add('active');
    renderizarCitasAdmin();
  }
  if (event) event.target.classList.add('active');
}

function guardarFotoCatalogo(e) {
  e.preventDefault();
  const titulo = document.getElementById('titulo-foto').value;
  const categoria = document.getElementById('categoria-foto').value;
  const inputArchivo = document.getElementById('archivo-foto');

  if (inputArchivo.files && inputArchivo.files[0]) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      const nuevaFoto = {
        id: Date.now(),
        titulo: titulo,
        categoria: categoria,
        img: evt.target.result
      };
      catalogoFotos.push(nuevaFoto);
      localStorage.setItem('ab_catalogo', JSON.stringify(catalogoFotos));
      alert('¡Foto subida con éxito!');
      document.getElementById('form-subir').reset();
      renderizarAdminGaleria();
    };
    reader.readAsDataURL(inputArchivo.files[0]);
  }
}

function renderizarAdminGaleria() {
  const contenedor = document.getElementById('admin-galeria-lista');
  if (!contenedor) return;

  contenedor.innerHTML = '';
  catalogoFotos.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-admin-foto';
    div.innerHTML = `
      <img src="${item.img}" alt="${item.titulo}">
      <p><strong>${item.titulo}</strong> (${item.categoria})</p>
      <button onclick="borrarFoto(${item.id})" class="btn-borrar">Eliminar</button>
    `;
    contenedor.appendChild(div);
  });
}

function borrarFoto(id) {
  catalogoFotos = catalogoFotos.filter(item => item.id !== id);
  localStorage.setItem('ab_catalogo', JSON.stringify(catalogoFotos));
  renderizarAdminGaleria();
}

function renderizarCitasAdmin() {
  const contenedor = document.getElementById('lista-citas-agendadas');
  if (!contenedor) return;

  contenedor.innerHTML = '';
  if (citasAgendadas.length === 0) {
    contenedor.innerHTML = '<p>No hay citas registradas por ahora.</p>';
    return;
  }

  citasAgendadas.slice().reverse().forEach(cita => {
    const div = document.createElement('div');
    div.className = 'card-cita-item';
    div.innerHTML = `
      <p><strong>👤 Cliente:</strong> ${cita.nombre}</p>
      <p><strong>💅 Servicio:</strong> ${cita.servicio}</p>
      <p><strong>🎨 Diseños:</strong> ${cita.diseno}</p>
      <p><strong>📅 Fecha y Hora:</strong> ${cita.fecha} a las ${cita.hora}</p>
      <hr>
    `;
    contenedor.appendChild(div);
  });
}