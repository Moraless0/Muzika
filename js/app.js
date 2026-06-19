const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const reloadBtn = document.getElementById('reloadBtn');
const loadingSection = document.getElementById('loadingSection');
const errorSection = document.getElementById('errorSection');
const emptySection = document.getElementById('emptySection');
const errorMessage = document.getElementById('errorMessage');
const resultsTitle = document.getElementById('resultsTitle');
const tracksGrid = document.getElementById('tracksGrid');
const totalTracks = document.getElementById('totalTracks');
const totalArtists = document.getElementById('totalArtists');
const trackModal = document.getElementById('trackModal');
const closeModal = document.getElementById('closeModal');
const modalImage = document.getElementById('modalImage');
const modalRank = document.getElementById('modalRank');
const modalTitle = document.getElementById('modalTitle');
const modalArtist = document.getElementById('modalArtist');
const modalAlbum = document.getElementById('modalAlbum');
const modalDuration = document.getElementById('modalDuration');
const modalLink = document.getElementById('modalLink');
const modalFavoriteBtn = document.getElementById('modalFavoriteBtn');
const modalShareBtn = document.getElementById('modalShareBtn');
const playerBar = document.getElementById('playerBar');
const playerImage = document.getElementById('playerImage');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const currentTime = document.getElementById('currentTime');
const totalTime = document.getElementById('totalTime');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const audioPlayer = document.getElementById('audioPlayer');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.querySelector('.theme-icon');
const favoritesBtn = document.getElementById('favoritesBtn');
const appLoader = document.getElementById('appLoader');
const navSearchInput = document.getElementById('navSearchInput');
const navSearchDropdown = document.getElementById('navSearchDropdown');
const navSearchClear = document.getElementById('navSearchClear');
const toolbar = document.querySelector('.toolbar');
const queuePanel = document.getElementById('queuePanel');
const queueList = document.getElementById('queueList');
const queueToggleBtn = document.getElementById('queueToggleBtn');
const shortcutsPanel = document.getElementById('shortcutsPanel');
const shortcutsBtn = document.getElementById('shortcutsBtn');
const closeShortcutsBtn = document.getElementById('closeShortcutsBtn');
const artistPanel = document.getElementById('artistPanel');
const artistPanelBody = document.getElementById('artistPanelBody');
const closeArtistPanelBtn = document.getElementById('closeArtistPanel');
const previewFilterBtn = document.getElementById('previewFilterBtn');
const listViewBtn = document.getElementById('listViewBtn');
const exportFavoritesBtn = document.getElementById('exportFavoritesBtn');

let currentTracks = [];
let currentTrackIndex = -1;
let isPlaying = false;
let isLightMode = true;
let favorites = [];
let currentModalTrack = null;
let currentPlayerTrack = null;
let navSearchDebounce = null;
let liveSearchController = null;
let searchHistory = [];
let artistCache = new Map();
let showOnlyPreview = false;
let isListView = false;

function loadFavorites() {
    try {
        favorites = JSON.parse(localStorage.getItem('muzika-favorites')) || [];
    } catch {
        favorites = [];
    }
}

function saveFavorites() {
    localStorage.setItem('muzika-favorites', JSON.stringify(favorites));
}

function loadSearchHistory() {
    try {
        searchHistory = JSON.parse(localStorage.getItem('muzika-search-history')) || [];
    } catch {
        searchHistory = [];
    }
}

function saveSearchTerm(term) {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;
    searchHistory = [cleanTerm, ...searchHistory.filter(item => item.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 6);
    localStorage.setItem('muzika-search-history', JSON.stringify(searchHistory));
}

function loadVolume() {
    const savedVolume = localStorage.getItem('muzika-volume');
    const volume = savedVolume !== null ? parseInt(savedVolume, 10) : 60;
    volumeBar.value = volume;
    audioPlayer.volume = volume / 100;
}

function isFavorite(track) {
    return favorites.some(fav => fav.id === track.id);
}

function buildFavorite(track) {
    return {
        id: track.id,
        title: track.title,
        artist: track.artist?.name || 'Artista desconocido',
        artistId: track.artist?.id || '',
        album: track.album?.title || 'Álbum desconocido',
        cover: getArtworkUrl(track),
        preview: track.preview || '',
        link: track.link || '#',
        duration: track.duration || 30
    };
}

function refreshFavoriteButtons(trackId) {
    const track = currentTracks.find(item => item.id === trackId) || currentModalTrack;
    const active = track ? isFavorite(track) : false;
    document.querySelectorAll(`[data-favorite-track-id="${trackId}"]`).forEach(button => {
        button.classList.toggle('favorited', active);
        setButtonIcon(button, 'heart', button.dataset.withText === 'true' ? 'Favorito' : '', active);
    });
}

function toggleFavorite(track, button) {
    const normalizedTrack = normalizeTrack(track);
    const index = favorites.findIndex(fav => fav.id === normalizedTrack.id);

    if (index > -1) {
        favorites.splice(index, 1);
        showToast(`"${normalizedTrack.title}" eliminado de favoritos`);
    } else {
        favorites.push(buildFavorite(normalizedTrack));
        showToast(`"${normalizedTrack.title}" agregado a favoritos`);
    }

    saveFavorites();
    refreshFavoriteButtons(normalizedTrack.id);
    if (button) button.classList.toggle('favorited', isFavorite(normalizedTrack));
}

function loadTheme() {
    const savedTheme = localStorage.getItem('muzika-theme') || 'light';
    isLightMode = savedTheme !== 'dark';
    document.body.classList.toggle('light-mode', isLightMode);
    setButtonIcon(themeIcon, isLightMode ? 'sun' : 'moon');
}

function toggleTheme() {
    isLightMode = !isLightMode;
    document.body.classList.toggle('light-mode', isLightMode);
    localStorage.setItem('muzika-theme', isLightMode ? 'light' : 'dark');
    setButtonIcon(themeIcon, isLightMode ? 'sun' : 'moon');
}

function setSearchTerm(term) {
    searchInput.value = term;
    navSearchInput.value = term;
}

function renderSkeletonCards(count = 8) {
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < count; index += 1) {
        const skeleton = document.createElement('article');
        const cover = document.createElement('div');
        const body = document.createElement('div');
        const pill = document.createElement('div');

        skeleton.className = 'skeleton-card';
        cover.className = 'skeleton-cover';
        body.className = 'skeleton-body';
        pill.className = 'skeleton-pill';
        body.append(
            createTextElement('div', 'skeleton-line', ''),
            createTextElement('div', 'skeleton-line short', ''),
            createTextElement('div', 'skeleton-line tiny', '')
        );
        skeleton.append(pill, cover, body);
        fragment.appendChild(skeleton);
    }

    tracksGrid.replaceChildren(fragment);
}

function hideAppLoader() {
    if (!appLoader) return;
    window.setTimeout(() => appLoader.classList.add('loader-hidden'), 900);
}

function setState({ loading = false, error = '', empty = false } = {}) {
    toggle(loadingSection, loading);
    toggle(errorSection, Boolean(error));
    toggle(emptySection, empty);
    toggle(tracksGrid, !error && !empty);

    if (loading) renderSkeletonCards();
    if (error) {
        clearElement(tracksGrid);
        errorMessage.textContent = error;
    }
    if (empty) clearElement(tracksGrid);
}

function updateStats(tracks) {
    const uniqueArtists = new Set(tracks.map(track => track.artist?.name).filter(Boolean));
    totalTracks.textContent = tracks.length;
    totalArtists.textContent = uniqueArtists.size;
}

function createDataBadge(track) {
    const badge = document.createElement('span');
    badge.className = track.preview ? 'data-badge' : 'data-badge muted';
    badge.textContent = track.preview ? 'Deezer · Preview' : 'Deezer · Sin preview';
    return badge;
}

function createTrackCard(track, index) {
    const card = document.createElement('article');
    const playButton = document.createElement('button');
    const favoriteButton = document.createElement('button');
    const rank = createTextElement('span', 'rank', `#${index + 1}`);
    const image = document.createElement('img');
    const info = document.createElement('div');
    const title = createTextElement('p', 'track-title', track.title || 'Sin título');
    const artist = document.createElement('button');
    const album = createTextElement('p', 'track-album', track.album?.title || 'Álbum desconocido');

    card.className = 'track-card';
    card.dataset.trackId = track.id;
    card.style.animationDelay = `${index * 0.04}s`;
    playButton.className = 'play-float';
    playButton.setAttribute('aria-label', `Reproducir ${track.title}`);
    playButton.dataset.action = 'play-track';
    playButton.dataset.trackId = String(track.id);
    setButtonIcon(playButton, 'play', '', true);
    favoriteButton.className = 'favorite-btn';
    favoriteButton.classList.toggle('favorited', isFavorite(track));
    favoriteButton.setAttribute('aria-label', 'Agregar a favoritos');
    favoriteButton.dataset.action = 'toggle-favorite';
    favoriteButton.dataset.trackId = String(track.id);
    favoriteButton.dataset.favoriteTrackId = String(track.id);
    setButtonIcon(favoriteButton, 'heart', '', isFavorite(track));
    image.className = 'track-image';
    image.src = getArtworkUrl(track);
    image.alt = `Portada de ${track.title}`;
    image.loading = 'lazy';
    image.onerror = () => { image.src = 'https://placehold.co/600x600/f5f5f7/1d1d1f?text=Muzika'; };
    info.className = 'track-info';
    artist.className = 'track-artist artist-link';
    artist.type = 'button';
    artist.textContent = track.artist?.name || 'Artista desconocido';
    artist.dataset.action = 'open-artist';
    artist.dataset.trackId = String(track.id);

    info.append(title, artist, album, createDataBadge(track));
    card.append(playButton, favoriteButton, rank, image, info);
    card.addEventListener('click', event => {
        if (event.target.closest('button')) return;
        openTrackModal(track, index);
    });
    return card;
}

function getVisibleTracks(tracks) {
    if (!showOnlyPreview) return tracks;
    return tracks.filter(track => Boolean(track.preview));
}

function renderTracks(tracks, title) {
    currentTracks = tracks.map(normalizeTrack);
    const visibleTracks = getVisibleTracks(currentTracks);
    const fragment = document.createDocumentFragment();
    resultsTitle.textContent = title;
    updateStats(visibleTracks);

    if (!visibleTracks.length) {
        setState({ empty: true });
        return;
    }

    visibleTracks.forEach((track, index) => fragment.appendChild(createTrackCard(track, index)));
    tracksGrid.replaceChildren(fragment);
    tracksGrid.classList.toggle('list-view', isListView);
    setState();
    renderQueue();
}

async function loadTrendingTracks() {
    setState({ loading: true });

    try {
        const tracks = await getTrendingTracks(18);
        renderTracks(tracks, 'Top global de Deezer');
    } catch (error) {
        console.error(error);
        setState({ error: 'No se pudo conectar con Deezer. Puede ser un bloqueo temporal del proxy CORS; intenta recargar o buscar otra vez.' });
    }
}

function showFavorites() {
    if (favorites.length === 0) {
        setState({ empty: true });
        resultsTitle.textContent = 'Favoritos';
        return;
    }

    renderTracks(favorites.map(normalizeTrack), 'Tus favoritos');
}

function renderSearchHistory() {
    const fragment = document.createDocumentFragment();

    if (!searchHistory.length) {
        const empty = createTextElement('div', 'search-dropdown-empty', 'Escribe para buscar canciones, artistas o álbumes.');
        navSearchDropdown.replaceChildren(empty);
        navSearchDropdown.classList.remove('hidden');
        return;
    }

    fragment.appendChild(createTextElement('div', 'search-dropdown-footer', 'Búsquedas recientes'));
    searchHistory.forEach(term => {
        const item = document.createElement('button');
        item.className = 'search-history-item';
        item.type = 'button';
        item.textContent = term;
        item.addEventListener('click', () => {
            setSearchTerm(term);
            navSearchDropdown.classList.add('hidden');
            performSearch(term);
        });
        fragment.appendChild(item);
    });
    navSearchDropdown.replaceChildren(fragment);
    navSearchDropdown.classList.remove('hidden');
}

function liveSearch(query) {
    clearTimeout(navSearchDebounce);
    const term = query.trim();

    if (!term) {
        navSearchClear.classList.add('hidden');
        renderSearchHistory();
        return;
    }

    navSearchClear.classList.remove('hidden');
    navSearchDebounce = setTimeout(async () => {
        try {
            if (liveSearchController) liveSearchController.abort();
            liveSearchController = new AbortController();
            const tracks = await searchTracks(term, 8, { signal: liveSearchController.signal });
            renderSearchDropdown(tracks.map(normalizeTrack), term);
        } catch (error) {
            if (error.name === 'AbortError') return;
            const empty = createTextElement('div', 'search-dropdown-empty', 'Error al buscar. Intenta de nuevo.');
            navSearchDropdown.replaceChildren(empty);
            navSearchDropdown.classList.remove('hidden');
        }
    }, 300);
}

function createSearchResultItem(track, index) {
    const item = document.createElement('div');
    const image = document.createElement('img');
    const info = document.createElement('div');
    const title = createTextElement('p', 'search-result-title', track.title);
    const artist = document.createElement('button');
    const playButton = document.createElement('button');

    item.className = 'search-result-item';
    item.setAttribute('role', 'option');
    image.src = getArtworkUrl(track);
    image.alt = track.title;
    image.loading = 'lazy';
    info.className = 'search-result-info';
    artist.className = 'search-result-artist artist-link';
    artist.type = 'button';
    artist.textContent = track.artist?.name || 'Artista desconocido';
    artist.addEventListener('click', event => {
        event.stopPropagation();
        openArtistPanel(track.artist?.id, track.artist?.name);
    });
    playButton.className = 'search-result-play';
    playButton.setAttribute('aria-label', `Reproducir ${track.title}`);
    setButtonIcon(playButton, 'play', '', true);
    info.append(title, artist);
    item.append(image, info, playButton);
    item.addEventListener('click', () => {
        navSearchInput.value = track.title;
        navSearchDropdown.classList.add('hidden');
        performSearch(track.title);
        playPreview(track, index);
    });
    return item;
}

function renderSearchDropdown(tracks, term) {
    const fragment = document.createDocumentFragment();

    if (tracks.length === 0) {
        const empty = createTextElement('div', 'search-dropdown-empty', `No hay resultados para "${term}"`);
        navSearchDropdown.replaceChildren(empty);
        navSearchDropdown.classList.remove('hidden');
        return;
    }

    tracks.forEach((track, index) => fragment.appendChild(createSearchResultItem(track, index)));
    fragment.appendChild(createTextElement('div', 'search-dropdown-footer', `Mostrando ${tracks.length} resultados · Presiona Enter para ver todos`));
    navSearchDropdown.replaceChildren(fragment);
    navSearchDropdown.classList.remove('hidden');
}

async function performSearch(query) {
    const term = query.trim();

    if (!term) {
        await loadTrendingTracks();
        return;
    }

    setState({ loading: true });
    saveSearchTerm(term);
    if (toolbar) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const tracks = await searchTracks(term, 18);
        renderTracks(tracks, `Resultados para “${term}”`);
    } catch (error) {
        console.error(error);
        setState({ error: 'La búsqueda falló. Revisa tu conexión o intenta con otro artista/canción.' });
    }
}

function updatePlayingCard(trackId) {
    document.querySelectorAll('.track-card').forEach(card => card.classList.remove('playing'));
    const activeCard = document.querySelector(`.track-card[data-track-id="${trackId}"]`);
    if (activeCard) activeCard.classList.add('playing');
    renderQueue();
}

function playPreview(track, index = 0) {
    const normalizedTrack = normalizeTrack(track);
    const previewUrl = getTrackPreviewUrl(normalizedTrack);

    if (!previewUrl) {
        showToast('Esta canción no tiene preview disponible en Deezer.');
        return;
    }

    currentTrackIndex = index;
    currentPlayerTrack = normalizedTrack;
    updatePlayingCard(normalizedTrack.id);
    playerImage.src = getArtworkUrl(normalizedTrack);
    playerTitle.textContent = normalizedTrack.title;
    playerArtist.textContent = `${normalizedTrack.artist?.name || 'Artista desconocido'} · Preview de 30s`;
    playerArtist.dataset.artistId = normalizedTrack.artist?.id || '';
    playerArtist.dataset.artistName = normalizedTrack.artist?.name || '';
    playerArtist.classList.add('artist-link');
    audioPlayer.volume = volumeBar.value / 100;
    audioPlayer.src = previewUrl;
    audioPlayer.load();
    playerBar.classList.remove('hidden');

    audioPlayer.play().then(() => {
        isPlaying = true;
        updatePlayPauseButton();
    }).catch(error => {
        console.error('Error al reproducir preview:', error?.name || error, error?.message || '', 'URL:', previewUrl);
        isPlaying = false;
        updatePlayPauseButton();
        showToast('No se pudo reproducir el preview. Puede estar restringido por Deezer.');
    });
}

function updatePlayPauseButton() {
    setButtonIcon(playPauseBtn, isPlaying ? 'pause' : 'play', '', true);
}

function updateProgress() {
    if (audioPlayer.duration) {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = progress;
        currentTime.textContent = formatTime(audioPlayer.currentTime);
        totalTime.textContent = formatTime(audioPlayer.duration);
    }
}

function playPrevious() {
    if (currentTrackIndex > 0) playPreview(currentTracks[currentTrackIndex - 1], currentTrackIndex - 1);
}

function playNext() {
    if (currentTrackIndex < currentTracks.length - 1) playPreview(currentTracks[currentTrackIndex + 1], currentTrackIndex + 1);
}

function togglePlayPause() {
    if (!audioPlayer.src) return;
    if (isPlaying) audioPlayer.pause();
    else audioPlayer.play();
}

function openTrackModal(track, index) {
    const normalizedTrack = normalizeTrack(track);
    currentModalTrack = normalizedTrack;
    modalImage.src = getArtworkUrl(normalizedTrack);
    modalRank.textContent = `Canción #${index + 1}`;
    modalTitle.textContent = normalizedTrack.title;
    modalArtist.textContent = `Artista: ${normalizedTrack.artist?.name || 'Artista desconocido'}`;
    modalArtist.dataset.artistId = normalizedTrack.artist?.id || '';
    modalArtist.dataset.artistName = normalizedTrack.artist?.name || '';
    modalArtist.classList.add('artist-link');
    modalAlbum.textContent = `Álbum: ${normalizedTrack.album?.title || 'Álbum desconocido'}`;
    modalDuration.textContent = `Duración: ${formatDuration(normalizedTrack.duration)}`;
    modalLink.href = normalizedTrack.link || '#';
    setButtonIcon(modalFavoriteBtn, 'heart', 'Favorito', isFavorite(normalizedTrack));
    modalFavoriteBtn.dataset.favoriteTrackId = String(normalizedTrack.id);
    modalFavoriteBtn.dataset.withText = 'true';
    modalFavoriteBtn.classList.toggle('favorited', isFavorite(normalizedTrack));
    trackModal.classList.remove('hidden');
    trackModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    playPreview(normalizedTrack, index);
}

function closeTrackModal() {
    trackModal.classList.add('hidden');
    trackModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

async function shareTrack(track) {
    if (!track?.link) return;
    const data = { title: track.title, text: `${track.title} - ${track.artist?.name || 'Muzika'}`, url: track.link };
    try {
        if (navigator.share) {
            await navigator.share(data);
            showToast('Canción compartida.');
            return;
        }
        await navigator.clipboard.writeText(track.link);
        showToast('Enlace copiado al portapapeles.');
    } catch {
        showToast('No se pudo compartir el enlace.');
    }
}

function renderQueue() {
    if (!queueList) return;
    const fragment = document.createDocumentFragment();
    currentTracks.forEach((track, index) => {
        const item = document.createElement('button');
        const title = createTextElement('strong', '', track.title);
        const artist = createTextElement('span', '', track.artist?.name || 'Artista desconocido');
        item.type = 'button';
        item.className = 'queue-item';
        item.classList.toggle('active', index === currentTrackIndex);
        item.append(title, artist);
        item.addEventListener('click', () => playPreview(track, index));
        fragment.appendChild(item);
    });
    queueList.replaceChildren(fragment);
}

async function getArtistBundle(artistId) {
    if (artistCache.has(artistId)) return artistCache.get(artistId);
    const bundle = await Promise.all([
        getArtistById(artistId),
        getArtistAlbums(artistId, 6),
        getArtistTopTracks(artistId, 6)
    ]).then(([artist, albums, tracks]) => ({ artist, albums, tracks: tracks.map(normalizeTrack) }));
    artistCache.set(artistId, bundle);
    return bundle;
}

function renderArtistSkeleton() {
    const wrapper = document.createElement('div');
    wrapper.className = 'artist-skeleton';
    wrapper.append(
        createTextElement('div', 'skeleton-cover circle', ''),
        createTextElement('div', 'skeleton-line', ''),
        createTextElement('div', 'skeleton-line short', ''),
        createTextElement('div', 'skeleton-line tiny', '')
    );
    artistPanelBody.replaceChildren(wrapper);
}

function createArtistList(titleText, items, type) {
    const section = document.createElement('section');
    const title = createTextElement('h4', '', titleText);
    const list = document.createElement('div');
    list.className = 'artist-mini-list';
    items.forEach(item => {
        const card = document.createElement(type === 'track' ? 'button' : 'a');
        const image = document.createElement('img');
        const text = document.createElement('span');
        card.className = 'artist-mini-item';
        image.src = type === 'track' ? getArtworkUrl(item) : (item.cover_medium || item.cover || 'https://placehold.co/120x120/f5f5f7/1d1d1f?text=Album');
        image.alt = item.title || 'Deezer';
        text.textContent = item.title || 'Sin título';
        if (type === 'track') {
            card.type = 'button';
            card.addEventListener('click', () => playPreview(item, 0));
        } else {
            card.href = item.link || '#';
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
        }
        card.append(image, text);
        list.appendChild(card);
    });
    section.append(title, list);
    return section;
}

function renderArtistPanel(bundle) {
    const { artist, albums, tracks } = bundle;
    const header = document.createElement('div');
    const image = document.createElement('img');
    const meta = document.createElement('div');
    const title = createTextElement('h3', '', artist.name || 'Artista');
    const fans = createTextElement('p', '', `${formatNumber(artist.nb_fan)} seguidores aproximados`);
    const source = createTextElement('span', 'data-badge', 'Fuente: Deezer API');
    const infoGrid = document.createElement('div');
    const radioButton = document.createElement('button');
    const link = document.createElement('a');

    header.className = 'artist-header';
    image.src = artist.picture_big || artist.picture_medium || 'https://placehold.co/300x300/f5f5f7/1d1d1f?text=Artist';
    image.alt = artist.name || 'Artista';
    meta.append(title, fans, source);
    header.append(image, meta);
    infoGrid.className = 'artist-info-grid';
    [['Biografía', 'No disponible en Deezer'], ['Género musical', 'No disponible en Deezer'], ['País de origen', 'No disponible en Deezer'], ['Inicio de carrera', 'No disponible en Deezer']].forEach(([label, value]) => {
        const item = document.createElement('div');
        item.append(createTextElement('strong', '', label), createTextElement('span', '', value));
        infoGrid.appendChild(item);
    });
    radioButton.className = 'primary-link artist-radio-btn';
    radioButton.type = 'button';
    radioButton.textContent = 'Iniciar radio del artista';
    radioButton.addEventListener('click', () => {
        if (!tracks.length) return;
        renderTracks(tracks, `Canciones de ${artist.name}`);
        playPreview(tracks[0], 0);
        closeArtistPanel();
    });
    link.className = 'deezer-link';
    link.href = artist.link || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Abrir artista en Deezer';
    artistPanelBody.replaceChildren(header, infoGrid, radioButton, createArtistList('Álbumes destacados', albums, 'album'), createArtistList('Canciones populares', tracks, 'track'), link);
}

async function openArtistPanel(artistId, artistName = '') {
    if (!artistId) {
        showToast('Deezer no entregó ID para este artista.');
        return;
    }
    artistPanel.classList.remove('hidden');
    artistPanel.setAttribute('aria-hidden', 'false');
    renderArtistSkeleton();

    try {
        const bundle = await getArtistBundle(artistId);
        renderArtistPanel(bundle);
    } catch (error) {
        console.error(error);
        const fallback = createTextElement('div', 'search-dropdown-empty', `No se pudo cargar la información de ${artistName || 'este artista'}.`);
        artistPanelBody.replaceChildren(fallback);
    }
}

function closeArtistPanel() {
    artistPanel.classList.add('hidden');
    artistPanel.setAttribute('aria-hidden', 'true');
}

function exportFavorites() {
    if (!favorites.length) {
        showToast('No hay favoritos para exportar.');
        return;
    }
    const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'muzika-favs.json';
    link.click();
    URL.revokeObjectURL(link.href);
}

function toggleShortcutsPanel() {
    shortcutsPanel.classList.toggle('hidden');
    shortcutsPanel.setAttribute('aria-hidden', shortcutsPanel.classList.contains('hidden') ? 'true' : 'false');
}

function isTyping() {
    const active = document.activeElement;
    return active && ['INPUT', 'TEXTAREA'].includes(active.tagName);
}

searchForm.addEventListener('submit', event => {
    event.preventDefault();
    const term = searchInput.value.trim();
    if (term) {
        setSearchTerm(term);
        performSearch(term);
    }
});

searchInput.addEventListener('input', () => {
    navSearchInput.value = searchInput.value;
});

reloadBtn.addEventListener('click', loadTrendingTracks);
favoritesBtn.addEventListener('click', showFavorites);
closeModal.addEventListener('click', closeTrackModal);
modalFavoriteBtn.addEventListener('click', () => {
    if (currentModalTrack) toggleFavorite(currentModalTrack, modalFavoriteBtn);
});
modalShareBtn.addEventListener('click', () => shareTrack(currentModalTrack));
trackModal.addEventListener('click', event => {
    if (event.target === trackModal) closeTrackModal();
});
modalArtist.addEventListener('click', () => openArtistPanel(modalArtist.dataset.artistId, modalArtist.dataset.artistName));
playerArtist.addEventListener('click', () => openArtistPanel(playerArtist.dataset.artistId, playerArtist.dataset.artistName));
playPauseBtn.addEventListener('click', togglePlayPause);
prevBtn.addEventListener('click', playPrevious);
nextBtn.addEventListener('click', playNext);
themeToggle.addEventListener('click', toggleTheme);

tracksGrid.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const trackId = button.dataset.trackId;
    const track = currentTracks.find(item => String(item.id) === String(trackId));
    const index = currentTracks.findIndex(item => String(item.id) === String(trackId));
    if (!track) return;
    if (button.dataset.action === 'play-track') playPreview(track, index);
    if (button.dataset.action === 'toggle-favorite') toggleFavorite(track, button);
    if (button.dataset.action === 'open-artist') openArtistPanel(track.artist?.id, track.artist?.name);
});

progressBar.addEventListener('input', () => {
    if (audioPlayer.duration) audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
});

volumeBar.addEventListener('input', () => {
    audioPlayer.volume = volumeBar.value / 100;
    localStorage.setItem('muzika-volume', volumeBar.value);
});

audioPlayer.addEventListener('timeupdate', updateProgress);
audioPlayer.addEventListener('error', () => {
    isPlaying = false;
    updatePlayPauseButton();
    showToast('Error al cargar el audio. Intenta con otra canción.');
});
audioPlayer.addEventListener('ended', () => {
    isPlaying = false;
    updatePlayPauseButton();
    playNext();
});
audioPlayer.addEventListener('play', () => {
    isPlaying = true;
    updatePlayPauseButton();
});
audioPlayer.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayPauseButton();
});

navSearchInput.addEventListener('input', () => liveSearch(navSearchInput.value));
navSearchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const term = navSearchInput.value.trim();
        if (term) {
            navSearchDropdown.classList.add('hidden');
            searchInput.value = term;
            performSearch(term);
            navSearchInput.blur();
        }
    } else if (event.key === 'Escape') {
        navSearchDropdown.classList.add('hidden');
        navSearchInput.blur();
    }
});
navSearchInput.addEventListener('focus', () => {
    if (!navSearchInput.value.trim()) renderSearchHistory();
    else if (navSearchDropdown.children.length > 0) navSearchDropdown.classList.remove('hidden');
});
navSearchClear.addEventListener('click', () => {
    navSearchInput.value = '';
    navSearchDropdown.classList.add('hidden');
    clearElement(navSearchDropdown);
    navSearchClear.classList.add('hidden');
    navSearchInput.focus();
});

document.addEventListener('click', event => {
    if (!event.target.closest('.nav-search-wrapper')) navSearchDropdown.classList.add('hidden');
});

document.querySelectorAll('.chip, .mood-card, .secondary-link').forEach(trigger => {
    trigger.addEventListener('click', () => {
        const query = trigger.dataset.query;
        setSearchTerm(query);
        performSearch(query);
    });
});

if (queueToggleBtn) queueToggleBtn.addEventListener('click', () => queuePanel.classList.toggle('hidden'));
if (shortcutsBtn) shortcutsBtn.addEventListener('click', toggleShortcutsPanel);
if (closeShortcutsBtn) closeShortcutsBtn.addEventListener('click', toggleShortcutsPanel);
if (closeArtistPanelBtn) closeArtistPanelBtn.addEventListener('click', closeArtistPanel);
if (artistPanel) artistPanel.addEventListener('click', event => { if (event.target === artistPanel) closeArtistPanel(); });
if (previewFilterBtn) previewFilterBtn.addEventListener('click', () => {
    showOnlyPreview = !showOnlyPreview;
    previewFilterBtn.classList.toggle('active', showOnlyPreview);
    renderTracks(currentTracks, resultsTitle.textContent);
});
if (listViewBtn) listViewBtn.addEventListener('click', () => {
    isListView = !isListView;
    listViewBtn.classList.toggle('active', isListView);
    tracksGrid.classList.toggle('list-view', isListView);
});
if (exportFavoritesBtn) exportFavoritesBtn.addEventListener('click', exportFavorites);

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        if (!trackModal.classList.contains('hidden')) closeTrackModal();
        if (artistPanel && !artistPanel.classList.contains('hidden')) closeArtistPanel();
        if (shortcutsPanel && !shortcutsPanel.classList.contains('hidden')) toggleShortcutsPanel();
        return;
    }
    if (isTyping()) return;
    if (event.key === '?' && shortcutsPanel) {
        event.preventDefault();
        toggleShortcutsPanel();
    }
    if (event.key === ' ' && !playerBar.classList.contains('hidden')) {
        event.preventDefault();
        togglePlayPause();
    }
    if (event.key === 'ArrowLeft' && !playerBar.classList.contains('hidden')) {
        event.preventDefault();
        playPrevious();
    }
    if (event.key === 'ArrowRight' && !playerBar.classList.contains('hidden')) {
        event.preventDefault();
        playNext();
    }
    if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        showFavorites();
    }
    if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        loadTrendingTracks();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
    loadSearchHistory();
    loadTheme();
    loadVolume();
    updatePlayPauseButton();
    hideAppLoader();
    loadTrendingTracks();
});
