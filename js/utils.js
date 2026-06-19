const toast = document.getElementById('toast');

const iconPaths = {
    play: [{ d: 'M8 5v14l11-7z' }],
    pause: [{ d: 'M6 4h4v16H6zM14 4h4v16h-4z' }],
    heart: [{ d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' }],
    moon: [{ d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }],
    sun: [
        { type: 'circle', cx: '12', cy: '12', r: '5' },
        { type: 'line', x1: '12', y1: '1', x2: '12', y2: '3' },
        { type: 'line', x1: '12', y1: '21', x2: '12', y2: '23' },
        { type: 'line', x1: '4.22', y1: '4.22', x2: '5.64', y2: '5.64' },
        { type: 'line', x1: '18.36', y1: '18.36', x2: '19.78', y2: '19.78' },
        { type: 'line', x1: '1', y1: '12', x2: '3', y2: '12' },
        { type: 'line', x1: '21', y1: '12', x2: '23', y2: '12' },
        { type: 'line', x1: '4.22', y1: '19.78', x2: '5.64', y2: '18.36' },
        { type: 'line', x1: '18.36', y1: '5.64', x2: '19.78', y2: '4.22' }
    ],
    share: [{ d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }, { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }],
    close: [{ d: 'M18 6 6 18' }, { d: 'M6 6l12 12' }],
    music: [{ d: 'M9 18V5l12-2v13' }, { type: 'circle', cx: '6', cy: '18', r: '3' }, { type: 'circle', cx: '18', cy: '16', r: '3' }]
};

function createIcon(name, className = 'btn-svg', filled = false) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', className);
    svg.setAttribute('fill', filled ? 'currentColor' : 'none');
    svg.setAttribute('stroke', filled ? 'none' : 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    iconPaths[name].forEach(item => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', item.type || 'path');
        Object.keys(item).forEach(key => {
            if (key !== 'type') node.setAttribute(key, item[key]);
        });
        svg.appendChild(node);
    });

    return svg;
}

function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
}

function clearElement(element) {
    element.replaceChildren();
}

function setButtonIcon(button, iconName, text = '', filled = false) {
    clearElement(button);
    button.appendChild(createIcon(iconName, 'btn-svg', filled));
    if (text) button.appendChild(document.createTextNode(` ${text}`));
}

function toggle(element, show) {
    if (element) element.classList.toggle('hidden', !show);
}

function getArtworkUrl(track) {
    return track?.album?.cover_big || track?.album?.cover_medium || track?.album?.cover || track?.cover || 'https://placehold.co/600x600/f5f5f7/1d1d1f?text=Muzika';
}

function normalizeTrack(track) {
    if (track.artist && typeof track.artist === 'object') return track;
    return {
        id: track.id,
        title: track.title,
        artist: { id: track.artistId || track.artist_id || '', name: track.artist || 'Artista desconocido' },
        album: { title: track.album || 'Álbum desconocido', cover_big: track.cover, cover_medium: track.cover },
        preview: track.preview,
        link: track.link || '#',
        duration: track.duration || 30
    };
}

function formatDuration(seconds) {
    if (!seconds) return 'Duración no disponible';
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${rest}`;
}

function formatTime(seconds) {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function formatNumber(value) {
    if (!value && value !== 0) return 'No disponible';
    return new Intl.NumberFormat('es-CO').format(value);
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2500);
}
