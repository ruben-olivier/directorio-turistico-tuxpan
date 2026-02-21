/* ============================================
   GALLERY.JS - Modal de detalle + Swiper
   ============================================ */

// Variable para el mini mapa del modal
let miniMapa = null;
let miniMapaMarcador = null;

// Abrir el modal con detalles de un lugar
function abrirDetalle(lugarId) {
    const lugar = LUGARES_DATA.find(l => l.id === lugarId);
    if (!lugar) return;

    const modal = document.getElementById('modal-detalle');

    // --- Galeria Swiper ---
    const galeriaContainer = document.getElementById('modal-galeria');
    const iconoCat = getIconoCategoria(lugar.categoria);

    if (lugar.imagenes && lugar.imagenes.length > 0) {
        const slidesHTML = lugar.imagenes.map(img =>
            `<div class="swiper-slide">
                <img src="${img}" alt="${lugar.nombre}" loading="lazy">
            </div>`
        ).join('');

        galeriaContainer.innerHTML = `
            <div class="swiper" id="swiper-detalle">
                <div class="swiper-wrapper">${slidesHTML}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-next"></div>
                <div class="swiper-button-prev"></div>
            </div>
        `;
    } else {
        // Placeholder si no hay imagenes
        galeriaContainer.innerHTML = `
            <div class="img-placeholder" style="height:100%;font-size:5rem;">
                ${iconoCat}
            </div>
        `;
    }

    // --- Info basica ---
    document.getElementById('modal-nombre').textContent = lugar.nombre;
    document.getElementById('modal-categoria-badge').textContent = `${iconoCat} ${getNombreCategoria(lugar.categoria)}`;

    // Rating
    const ratingEl = document.getElementById('modal-rating');
    ratingEl.innerHTML = `${generarEstrellas(lugar.calificacion)} <strong>${lugar.calificacion}</strong> <span style="color:var(--color-gray);font-size:0.85rem;">(${lugar.numResenas} resenas)</span>`;

    // Descripcion
    document.getElementById('modal-descripcion').textContent = lugar.descripcion;

    // --- Detalles ---
    const direccionEl = document.getElementById('modal-direccion');
    direccionEl.innerHTML = `<span class="detalle-label">📍 Direccion</span>${lugar.direccion}`;

    const telefonoEl = document.getElementById('modal-telefono');
    if (lugar.telefono) {
        telefonoEl.innerHTML = `<span class="detalle-label">📞 Telefono</span><a href="tel:${lugar.telefono}">${lugar.telefono}</a>`;
        telefonoEl.style.display = '';
    } else {
        telefonoEl.style.display = 'none';
    }

    const horarioEl = document.getElementById('modal-horario');
    horarioEl.innerHTML = `<span class="detalle-label">🕐 Horario</span>${lugar.horario}`;

    const precioEl = document.getElementById('modal-precio');
    precioEl.innerHTML = `<span class="detalle-label">💰 Precio</span>${lugar.precioRango === 'gratis' ? 'Gratis' : lugar.precioRango}`;

    // --- Servicios ---
    const serviciosEl = document.getElementById('modal-servicios');
    if (lugar.servicios && lugar.servicios.length > 0) {
        serviciosEl.innerHTML = lugar.servicios.map(s =>
            `<span class="servicio-badge">${s}</span>`
        ).join('');
    } else {
        serviciosEl.innerHTML = '';
    }

    // --- Enlaces ---
    const webEl = document.getElementById('modal-web');
    if (lugar.sitioWeb) {
        webEl.href = lugar.sitioWeb;
        webEl.style.display = '';
    } else {
        webEl.style.display = 'none';
    }

    const fbEl = document.getElementById('modal-facebook');
    if (lugar.redesSociales && lugar.redesSociales.facebook) {
        fbEl.href = lugar.redesSociales.facebook;
        fbEl.style.display = '';
    } else {
        fbEl.style.display = 'none';
    }

    const igEl = document.getElementById('modal-instagram');
    if (lugar.redesSociales && lugar.redesSociales.instagram) {
        igEl.href = lugar.redesSociales.instagram;
        igEl.style.display = '';
    } else {
        igEl.style.display = 'none';
    }

    // Enlace a Google Maps
    const mapsEl = document.getElementById('modal-maps');
    if (lugar.coordenadas) {
        mapsEl.href = `https://www.google.com/maps?q=${lugar.coordenadas.lat},${lugar.coordenadas.lng}`;
        mapsEl.style.display = '';
    }

    // --- Mini mapa ---
    const miniMapaContainer = document.getElementById('modal-mini-mapa');
    if (lugar.coordenadas && lugar.coordenadas.lat && lugar.coordenadas.lng) {
        miniMapaContainer.style.display = '';

        // Mostrar el modal ANTES de inicializar el mini mapa
        modal.classList.add('activo');
        document.body.style.overflow = 'hidden';

        // Esperar un frame para que el contenedor tenga dimensiones
        requestAnimationFrame(function () {
            // Destruir mini mapa anterior si existe
            if (miniMapa) {
                miniMapa.remove();
                miniMapa = null;
            }

            miniMapa = L.map('modal-mini-mapa', {
                scrollWheelZoom: false,
                dragging: true,
                zoomControl: false
            }).setView([lugar.coordenadas.lat, lugar.coordenadas.lng], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
                maxZoom: 18
            }).addTo(miniMapa);

            miniMapaMarcador = L.marker(
                [lugar.coordenadas.lat, lugar.coordenadas.lng],
                { icon: crearIconoMarcador(lugar.categoria) }
            ).addTo(miniMapa);

            // Forzar recalculo del tamano
            setTimeout(() => miniMapa.invalidateSize(), 100);

            // Inicializar Swiper despues de que el modal este visible
            if (lugar.imagenes && lugar.imagenes.length > 0) {
                new Swiper('#swiper-detalle', {
                    loop: lugar.imagenes.length > 1,
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true
                    },
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev'
                    }
                });
            }
        });
    } else {
        miniMapaContainer.style.display = 'none';

        // Mostrar modal sin mini mapa
        modal.classList.add('activo');
        document.body.style.overflow = 'hidden';

        // Inicializar Swiper
        if (lugar.imagenes && lugar.imagenes.length > 0) {
            requestAnimationFrame(function () {
                new Swiper('#swiper-detalle', {
                    loop: lugar.imagenes.length > 1,
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true
                    },
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev'
                    }
                });
            });
        }
    }
}

// Cerrar el modal
function cerrarDetalle() {
    const modal = document.getElementById('modal-detalle');
    modal.classList.remove('activo');
    document.body.style.overflow = '';

    // Limpiar mini mapa
    if (miniMapa) {
        miniMapa.remove();
        miniMapa = null;
    }
}

// --- Event Listeners del Modal ---

document.addEventListener('DOMContentLoaded', function () {
    // Boton cerrar
    const btnCerrar = document.getElementById('modal-cerrar');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarDetalle);
    }

    // Cerrar al hacer click fuera del contenido
    const modal = document.getElementById('modal-detalle');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                cerrarDetalle();
            }
        });
    }

    // Cerrar con tecla Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            cerrarDetalle();
        }
    });
});
