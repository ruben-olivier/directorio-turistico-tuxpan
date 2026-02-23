/* ============================================
   APP.JS - Logica principal del Directorio
   Layout Explorar con tabs movil + hover
   ============================================ */

// --- Utilidades ---

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function generarEstrellas(calificacion) {
    const llenas = Math.floor(calificacion);
    const media = calificacion % 1 >= 0.5 ? 1 : 0;
    const vacias = 5 - llenas - media;
    let html = '';
    for (let i = 0; i < llenas; i++) html += '★';
    if (media) html += '★';
    for (let i = 0; i < vacias; i++) html += '☆';
    return html;
}

function getNombreCategoria(categoriaId) {
    const cat = CATEGORIAS.find(c => c.id === categoriaId);
    return cat ? cat.nombre : categoriaId;
}

function getIconoCategoria(categoriaId) {
    const cat = CATEGORIAS.find(c => c.id === categoriaId);
    return cat ? cat.icono : '📍';
}

function getNombreZona(zonaId) {
    return ZONAS[zonaId] || zonaId;
}

// --- Chips de Categorias (dentro del Hero) ---

function renderChipsCategorias() {
    const container = document.getElementById('hero-categorias');
    if (!container) return;

    container.innerHTML = CATEGORIAS.map(cat => `
        <button class="cat-chip" data-categoria="${cat.id}">
            <span>${cat.icono}</span>
            <span>${cat.nombre}</span>
        </button>
    `).join('');

    container.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            const categoriaId = this.dataset.categoria;
            const selectCategoria = document.getElementById('filtro-categoria');

            // Toggle
            if (selectCategoria.value === categoriaId) {
                selectCategoria.value = '';
                this.classList.remove('activo');
            } else {
                container.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('activo'));
                this.classList.add('activo');
                selectCategoria.value = categoriaId;
            }

            filtrarLugares();

            // Scroll suave a la seccion explorar (no a "lugares" lejano)
            document.getElementById('explorar').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// --- Renderizado de Tarjetas ---

function crearTarjetaHTML(lugar) {
    const iconoCat = getIconoCategoria(lugar.categoria);
    const nombreCat = getNombreCategoria(lugar.categoria);
    const estrellas = generarEstrellas(lugar.calificacion);
    const nombreZona = getNombreZona(lugar.zona);

    const imagenHTML = lugar.imagenPrincipal
        ? `<img src="${lugar.imagenPrincipal}" alt="${lugar.nombre}" loading="lazy">`
        : `<div class="img-placeholder">${iconoCat}</div>`;

    return `
        <div class="lugar-card" data-id="${lugar.id}"
             onmouseenter="highlightMarcador('${lugar.id}', true)"
             onmouseleave="highlightMarcador('${lugar.id}', false)">
            <div class="lugar-card-img">
                ${imagenHTML}
                <span class="lugar-card-badge">${iconoCat} ${nombreCat}</span>
                ${lugar.precioRango !== 'gratis' ? `<span class="lugar-card-precio">${lugar.precioRango}</span>` : '<span class="lugar-card-precio">Gratis</span>'}
                ${lugar.destacado ? '<span class="lugar-card-destacado">⭐</span>' : ''}
            </div>
            <div class="lugar-card-body">
                <h3>${lugar.nombre}</h3>
                <div class="card-zona">📍 ${nombreZona}</div>
                <p class="card-descripcion">${lugar.descripcionCorta}</p>
                <div class="lugar-card-footer">
                    <div class="card-rating">
                        <span class="estrellas">${estrellas}</span>
                        <span class="rating-num">${lugar.calificacion}</span>
                        <span class="rating-count">(${lugar.numResenas})</span>
                    </div>
                    <span class="card-ver-mas">Ver mas →</span>
                </div>
            </div>
        </div>
    `;
}

function renderLugares(lugaresArray) {
    const container = document.getElementById('lugares-grid');
    if (!container) return;

    if (lugaresArray.length === 0) {
        container.innerHTML = `
            <div class="no-resultados">
                <span class="no-resultados-icon">🔍</span>
                No se encontraron lugares con esos filtros.<br>
                Intenta con otros criterios de busqueda.
            </div>
        `;
    } else {
        const ordenados = [...lugaresArray].sort((a, b) => {
            if (a.destacado && !b.destacado) return -1;
            if (!a.destacado && b.destacado) return 1;
            return b.calificacion - a.calificacion;
        });

        container.innerHTML = ordenados.map(lugar => crearTarjetaHTML(lugar)).join('');

        // Agregar click handlers para abrir detalle
        container.querySelectorAll('.lugar-card').forEach(card => {
            card.addEventListener('click', function () {
                abrirDetalle(this.dataset.id);
            });
        });
    }

    // Actualizar contador
    const countEl = document.getElementById('resultados-count');
    if (countEl) {
        countEl.textContent = `${lugaresArray.length} lugar${lugaresArray.length !== 1 ? 'es' : ''}`;
    }
}

// --- Highlight bidireccional: tarjeta <-> marcador ---

function highlightTarjeta(lugarId, activo) {
    const card = document.querySelector(`.lugar-card[data-id="${lugarId}"]`);
    if (!card) return;

    if (activo) {
        card.classList.add('highlighted');
        // Scroll la tarjeta a la vista dentro del sidebar
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        card.classList.remove('highlighted');
    }
}

// --- Filtrado ---

function filtrarLugares() {
    const textoBusqueda = document.getElementById('search-input').value.toLowerCase().trim();
    const categoriaSeleccionada = document.getElementById('filtro-categoria').value;
    const zonaSeleccionada = document.getElementById('filtro-zona').value;
    const precioSeleccionado = document.getElementById('filtro-precio').value;
    const calificacionMinima = parseFloat(document.getElementById('filtro-rating').value) || 0;

    const resultados = LUGARES_DATA.filter(lugar => {
        const coincideTexto = !textoBusqueda ||
            lugar.nombre.toLowerCase().includes(textoBusqueda) ||
            lugar.descripcion.toLowerCase().includes(textoBusqueda) ||
            lugar.descripcionCorta.toLowerCase().includes(textoBusqueda) ||
            lugar.etiquetas.some(e => e.toLowerCase().includes(textoBusqueda));

        const coincideCategoria = !categoriaSeleccionada || lugar.categoria === categoriaSeleccionada;
        const coincideZona = !zonaSeleccionada || lugar.zona === zonaSeleccionada;
        const coincidePrecio = !precioSeleccionado || lugar.precioRango === precioSeleccionado;
        const coincideRating = lugar.calificacion >= calificacionMinima;

        return coincideTexto && coincideCategoria && coincideZona && coincidePrecio && coincideRating;
    });

    renderLugares(resultados);

    // Sincronizar mapa
    if (typeof actualizarMarcadoresMapa === 'function') {
        actualizarMarcadoresMapa(resultados);
    }

    // Actualizar badge de filtros activos
    actualizarBadgeFiltros();
}

function limpiarFiltros() {
    document.getElementById('search-input').value = '';
    document.getElementById('filtro-categoria').value = '';
    document.getElementById('filtro-zona').value = '';
    document.getElementById('filtro-precio').value = '';
    document.getElementById('filtro-rating').value = '0';

    // Desactivar chips de categoria
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('activo'));

    filtrarLugares();
    actualizarBadgeFiltros();
}

// --- Toggle panel de filtros + badge ---

function initFiltrosToggle() {
    const btn = document.getElementById('btn-filtros-toggle');
    const panel = document.getElementById('filtros-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', function () {
        const abierto = panel.classList.toggle('abierto');
        btn.classList.toggle('activo', abierto);
    });
}

function actualizarBadgeFiltros() {
    const cat = document.getElementById('filtro-categoria').value;
    const zona = document.getElementById('filtro-zona').value;
    const precio = document.getElementById('filtro-precio').value;
    const rating = parseFloat(document.getElementById('filtro-rating').value) || 0;

    let activos = 0;
    if (cat) activos++;
    if (zona) activos++;
    if (precio) activos++;
    if (rating > 0) activos++;

    const badge = document.getElementById('filtros-badge');
    const btnLimpiar = document.getElementById('limpiar-filtros');
    const btnToggle = document.getElementById('btn-filtros-toggle');

    if (badge) {
        badge.textContent = activos;
        badge.style.display = activos > 0 ? '' : 'none';
    }
    if (btnLimpiar) {
        btnLimpiar.style.display = activos > 0 ? '' : 'none';
    }
    if (btnToggle) {
        btnToggle.classList.toggle('activo', document.getElementById('filtros-panel').classList.contains('abierto'));
    }
}

// --- Tabs Movil (Lista | Mapa) ---

function initTabs() {
    const tabsContainer = document.getElementById('explorar-tabs');
    const layout = document.querySelector('.explorar-layout');
    if (!tabsContainer || !layout) return;

    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tab = this.dataset.tab;

            // Actualizar botones activos
            tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');

            // Toggle layout
            if (tab === 'mapa') {
                layout.classList.add('tab-mapa');
            } else {
                layout.classList.remove('tab-mapa');
            }

            // Recalcular tamano del mapa
            if (tab === 'mapa' && typeof mapa !== 'undefined' && mapa) {
                setTimeout(() => mapa.invalidateSize(), 100);
            }
        });
    });
}

// --- Menu Hamburguesa ---

function initNavbar() {
    const toggle = document.getElementById('navbar-toggle');
    const menu = document.getElementById('navbar-menu');

    if (toggle && menu) {
        toggle.addEventListener('click', function () {
            this.classList.toggle('activo');
            menu.classList.toggle('activo');
        });

        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function () {
                toggle.classList.remove('activo');
                menu.classList.remove('activo');
            });
        });
    }
}

// --- Boton Volver Arriba ---

function initBotonArriba() {
    const btn = document.getElementById('btn-arriba');
    if (!btn) return;

    window.addEventListener('scroll', function () {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- Inicializacion ---

document.addEventListener('DOMContentLoaded', function () {
    // Chips de categorias en el hero
    renderChipsCategorias();

    // Renderizar todos los lugares
    filtrarLugares();

    // Event listeners de filtros
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filtrarLugares, 300));
    }

    document.getElementById('filtro-categoria').addEventListener('change', function () {
        // Sincronizar chip activo con select
        const val = this.value;
        document.querySelectorAll('.cat-chip').forEach(c => {
            c.classList.toggle('activo', c.dataset.categoria === val);
        });
        filtrarLugares();
    });

    document.getElementById('filtro-zona').addEventListener('change', filtrarLugares);
    document.getElementById('filtro-precio').addEventListener('change', filtrarLugares);
    document.getElementById('filtro-rating').addEventListener('change', filtrarLugares);

    // Boton limpiar
    const btnLimpiar = document.getElementById('limpiar-filtros');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFiltros);
    }

    // Toggle filtros
    initFiltrosToggle();

    // Tabs movil
    initTabs();

    // Navbar
    initNavbar();

    // Boton arriba
    initBotonArriba();
});
