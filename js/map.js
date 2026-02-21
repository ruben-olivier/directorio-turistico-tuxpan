/* ============================================
   MAP.JS - Mapa interactivo con Leaflet
   Hover highlight bidireccional con tarjetas
   ============================================ */

let mapa = null;
let marcadoresLayer = null;

// Almacenar referencia a marcadores por ID para hover
let marcadoresPorId = {};

const COLORES_CATEGORIA = {
    'playas':        '#0077B6',
    'restaurantes':  '#E76F51',
    'hoteles':       '#9B59B6',
    'historicos':    '#F4A261',
    'actividades':   '#2A9D8F',
    'vida-nocturna': '#6C3483',
    'transporte':    '#34495E',
    'servicios':     '#1ABC9C'
};

function crearIconoMarcador(categoria, destacado) {
    const color = COLORES_CATEGORIA[categoria] || '#0077B6';
    const icono = getIconoCategoria(categoria);
    const size = destacado ? 40 : 34;

    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${destacado ? 20 : 16}px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 3px solid white;
            transition: transform 0.2s ease, filter 0.2s ease;
        ">${icono}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2)]
    });
}

function crearIconoMarcadorHighlight(categoria) {
    const color = COLORES_CATEGORIA[categoria] || '#0077B6';
    const icono = getIconoCategoria(categoria);

    return L.divIcon({
        className: 'custom-marker marker-highlighted',
        html: `<div style="
            background: ${color};
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 0 12px rgba(0,119,182,0.6), 0 4px 12px rgba(0,0,0,0.3);
            border: 4px solid #F4A261;
            transform: scale(1.15);
        ">${icono}</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22]
    });
}

function crearPopupHTML(lugar) {
    const iconoCat = getIconoCategoria(lugar.categoria);

    return `
        <div class="popup-lugar">
            ${lugar.imagenPrincipal
                ? `<img src="${lugar.imagenPrincipal}" alt="${lugar.nombre}">`
                : ''}
            <h3>${iconoCat} ${lugar.nombre}</h3>
            <p>${lugar.descripcionCorta}</p>
            <button class="btn-ver-mas" onclick="abrirDetalle('${lugar.id}')">Ver detalles</button>
        </div>
    `;
}

// Highlight de marcador desde hover en tarjeta
function highlightMarcador(lugarId, activo) {
    const marcadorInfo = marcadoresPorId[lugarId];
    if (!marcadorInfo) return;

    const { marcador, lugar } = marcadorInfo;

    if (activo) {
        marcador.setIcon(crearIconoMarcadorHighlight(lugar.categoria));
        marcador.setZIndexOffset(1000);
        // Abrir popup al hacer hover
        marcador.openPopup();
    } else {
        marcador.setIcon(crearIconoMarcador(lugar.categoria, lugar.destacado));
        marcador.setZIndexOffset(0);
        marcador.closePopup();
    }
}

// Actualizar marcadores (llamada desde app.js al filtrar)
function actualizarMarcadoresMapa(lugaresArray) {
    if (!mapa || !marcadoresLayer) return;

    marcadoresLayer.clearLayers();
    marcadoresPorId = {};

    lugaresArray.forEach(lugar => {
        if (!lugar.coordenadas || !lugar.coordenadas.lat || !lugar.coordenadas.lng) return;

        const marcador = L.marker(
            [lugar.coordenadas.lat, lugar.coordenadas.lng],
            { icon: crearIconoMarcador(lugar.categoria, lugar.destacado) }
        );

        marcador.bindPopup(crearPopupHTML(lugar), {
            maxWidth: 220,
            className: 'popup-custom'
        });

        // Hover en marcador -> highlight tarjeta en sidebar
        marcador.on('mouseover', function () {
            this.setIcon(crearIconoMarcadorHighlight(lugar.categoria));
            this.setZIndexOffset(1000);
            highlightTarjeta(lugar.id, true);
        });

        marcador.on('mouseout', function () {
            this.setIcon(crearIconoMarcador(lugar.categoria, lugar.destacado));
            this.setZIndexOffset(0);
            highlightTarjeta(lugar.id, false);
        });

        // Click en marcador -> abrir detalle
        marcador.on('click', function () {
            abrirDetalle(lugar.id);
        });

        marcadoresLayer.addLayer(marcador);
        marcadoresPorId[lugar.id] = { marcador, lugar };
    });

    // Ajustar vista del mapa a los marcadores visibles
    if (lugaresArray.length > 0) {
        const bounds = marcadoresLayer.getBounds();
        if (bounds.isValid()) {
            mapa.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
    }
}

function centrarMapaEn(lat, lng, zoom) {
    if (!mapa) return;
    mapa.setView([lat, lng], zoom || 15);
}

function initMapa() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    const tuxpanLat = 20.9567;
    const tuxpanLng = -97.4008;

    mapa = L.map('map-container', {
        scrollWheelZoom: true,
        zoomControl: true
    }).setView([tuxpanLat, tuxpanLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
    }).addTo(mapa);

    marcadoresLayer = L.layerGroup().addTo(mapa);

    // Cargar todos los marcadores
    actualizarMarcadoresMapa(LUGARES_DATA);

    // Fix para cuando el mapa no es visible al inicio (tabs movil)
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && mapa) {
                setTimeout(() => mapa.invalidateSize(), 50);
            }
        });
    }, { threshold: 0.1 });

    observer.observe(mapContainer);
}

document.addEventListener('DOMContentLoaded', initMapa);
