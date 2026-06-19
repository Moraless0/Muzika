/**
 * api.js
 * Funciones de comunicación con Deezer.
 * Deezer no habilita CORS directo para navegadores, por eso se usan proxys públicos de respaldo.
 */

const API_BASE = 'https://api.deezer.com';

const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://thingproxy.freeboard.io/fetch/${url}`
];

/**
 * Prueba una petición usando varios proxys CORS hasta obtener una respuesta válida.
 * @param {string} endpoint - Endpoint relativo de Deezer.
 * @returns {Promise<Object>} - JSON de respuesta.
 */
async function fetchFromAPI(endpoint, options = {}) {
    const deezerUrl = `${API_BASE}${endpoint}`;
    let lastError = null;

    for (const buildProxyUrl of CORS_PROXIES) {
        try {
            const response = await fetch(buildProxyUrl(deezerUrl), { signal: options.signal });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data && data.error) {
                throw new Error(data.error.message || 'Respuesta inválida de Deezer');
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            lastError = error;
        }
    }

    throw new Error(`No se pudo conectar con Deezer. ${lastError ? lastError.message : ''}`);
}

/**
 * Obtiene canciones populares globales.
 * @param {number} limit - Cantidad de canciones.
 * @returns {Promise<Array>} - Lista de tracks.
 */
async function getTrendingTracks(limit = 18) {
    const data = await fetchFromAPI(`/chart/0/tracks?limit=${limit}`);
    return data.data || [];
}

/**
 * Busca canciones por artista, canción, álbum o género.
 * @param {string} query - Texto de búsqueda.
 * @param {number} limit - Cantidad de canciones.
 * @returns {Promise<Array>} - Lista de tracks.
 */
async function searchTracks(query, limit = 18, options = {}) {
    const data = await fetchFromAPI(`/search?q=${encodeURIComponent(query)}&limit=${limit}`, options);
    return data.data || [];
}

/**
 * Obtiene detalle completo de una canción.
 * @param {string|number} id - ID de Deezer.
 * @returns {Promise<Object>} - Track completo.
 */
async function getTrackById(id) {
    return fetchFromAPI(`/track/${id}`);
}

async function getArtistById(id) {
    return fetchFromAPI(`/artist/${id}`);
}

async function getArtistAlbums(id, limit = 6) {
    const data = await fetchFromAPI(`/artist/${id}/albums?limit=${limit}`);
    return data.data || [];
}

async function getArtistTopTracks(id, limit = 6) {
    const data = await fetchFromAPI(`/artist/${id}/top?limit=${limit}`);
    return data.data || [];
}

/**
 * Devuelve la URL del preview de 30 segundos.
 * @param {Object} track - Track de Deezer.
 * @returns {string} - URL del preview.
 */
function getTrackPreviewUrl(track) {
    if (!track || !track.preview) return '';
    return track.preview.replace(/^http:/, 'https:');
}
