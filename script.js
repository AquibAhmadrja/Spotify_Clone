// Global variables
let currentSong = null;
let songs = [];
let currentFolder = '';
let currentFolderInfo = null;
let currentSongIndex = 0;

// Hamburger menu toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.left');
    sidebar.classList.toggle('active');
}

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.left');
    const hamburger = document.querySelector('.hamburger');
    
    if (sidebar && sidebar.classList.contains('active')) {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// Convert seconds to MM:SS format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch and load songs from info.json
async function loadSongsFromFolder(folder) {
    currentFolder = folder;
    songs = [];
    
    try {
        // Fetch the info.json file
        const response = await fetch(`songs/${folder}/info.json`);
        if (!response.ok) {
            console.error(`Failed to load info.json for ${folder}`);
            showNotification(`No songs found in ${folder}`);
            return [];
        }
        
        const info = await response.json();
        currentFolderInfo = info;
        
        console.log(`Loaded info for ${folder}:`, info);
        
        // Extract song filenames from info.json
        if (info.songs && Array.isArray(info.songs)) {
            songs = info.songs.map(song => `songs/${folder}/${song}`);
        } else {
            console.error('No songs array found in info.json');
            showNotification('No songs array in info.json');
            return [];
        }
        
        console.log(`✅ Loaded ${songs.length} songs from ${folder}:`, songs);
        return songs;
        
    } catch (error) {
        console.error(`Error loading songs from ${folder}:`, error);
        showNotification(`Error loading ${folder}`);
        return [];
    }
}

// Play a specific song
function playMusic(track) {
    console.log(`🎵 Playing: ${track}`);
    
    if (currentSong) {
        currentSong.pause();
        currentSong = null;
    }
    
    currentSong = new Audio(track);
    
    // Update time display as song plays
    currentSong.addEventListener('timeupdate', () => {
        const songTime = document.querySelector('.songtime');
        if (songTime) {
            songTime.innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        }
        
        // Update seek bar
        const circle = document.querySelector('.circle');
        if (circle && !isNaN(currentSong.duration)) {
            const percent = (currentSong.currentTime / currentSong.duration) * 100;
            circle.style.left = percent + "%";
        }
    });
    
    // When song ends, play next
    currentSong.addEventListener('ended', () => {
        console.log('Song ended, playing next...');
        playNext();
    });
    
    // Handle errors
    currentSong.addEventListener('error', (e) => {
        console.error('❌ Error playing song:', track);
        console.error('Error details:', e);
        showNotification(`Error playing: ${track.split('/').pop()}`);
        playNext(); // Try next song
    });
    
    // Start playing
    currentSong.play()
        .then(() => {
            document.getElementById('play').src = 'pause.svg';
            const songName = track.split('/').pop().replace('.mp3', '');
            showNotification(`Now Playing: ${songName}`);
        })
        .catch(error => {
            console.error('Play failed:', error);
            showNotification('Playback failed. Click play to retry.');
        });
}

// Play next song
function playNext() {
    if (songs.length === 0) {
        showNotification('No songs loaded');
        return;
    }
    
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    console.log(`⏭️ Next track: ${currentSongIndex + 1}/${songs.length}`);
    playMusic(songs[currentSongIndex]);
}

// Play previous song
function playPrevious() {
    if (songs.length === 0) {
        showNotification('No songs loaded');
        return;
    }
    
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    console.log(`⏮️ Previous track: ${currentSongIndex + 1}/${songs.length}`);
    playMusic(songs[currentSongIndex]);
}

// Show notification
function showNotification(message) {
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎵 Spotify Clone initialized!');
    console.log('🎧 Real MP3 playback enabled');
    
    // Play/Pause button
    const playBtn = document.getElementById('play');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (!currentSong) {
                showNotification('Please select an album first');
                return;
            }
            
            if (currentSong.paused) {
                currentSong.play();
                playBtn.src = 'pause.svg';
            } else {
                currentSong.pause();
                playBtn.src = 'play.svg';
            }
        });
    }
    
    // Previous button
    const previousBtn = document.getElementById('previous');
    if (previousBtn) {
        previousBtn.addEventListener('click', () => {
            if (!currentFolder) {
                showNotification('Please select an album first');
                return;
            }
            playPrevious();
        });
    }
    
    // Next button
    const nextBtn = document.getElementById('next');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!currentFolder) {
                showNotification('Please select an album first');
                return;
            }
            playNext();
        });
    }
    
    // Seek bar functionality
    const seekbar = document.querySelector('.seekbar');
    if (seekbar) {
        seekbar.addEventListener('click', (e) => {
            if (!currentSong) {
                showNotification('Please select an album first');
                return;
            }
            
            if (!isNaN(currentSong.duration)) {
                const rect = seekbar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                currentSong.currentTime = percent * currentSong.duration;
                console.log(`⏩ Seeked to ${Math.floor(percent * 100)}%`);
            }
        });
    }
    
    // Volume control
    const volumeRange = document.querySelector('.range input');
    if (volumeRange) {
        volumeRange.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            if (currentSong) {
                currentSong.volume = volume;
            }
            console.log(`🔊 Volume: ${e.target.value}%`);
        });
    }
    
    // Add click handlers to all album cards
    const cards = document.querySelectorAll('.card');
    console.log(`Found ${cards.length} album cards`);
    
    cards.forEach((card, index) => {
        const img = card.querySelector('img');
        if (img) {
            const src = img.src;
            console.log(`Card ${index}: ${src}`);
            
            // Check if image loads successfully
            img.addEventListener('error', () => {
                console.error(`❌ Failed to load image: ${src}`);
                // Show placeholder with folder name
                img.style.display = 'none';
                const folderMatch = src.match(/songs\/([^\/]+)\//);
                if (folderMatch) {
                    const folder = folderMatch[1];
                    const placeholder = document.createElement('div');
                    placeholder.className = 'cover-placeholder';
                    placeholder.textContent = folder.replace(/_/g, ' ').replace(/\([^)]*\)/g, '').trim();
                    card.appendChild(placeholder);
                }
            });
            
            img.addEventListener('load', () => {
                console.log(`✅ Loaded image: ${src}`);
            });
            
            const folderMatch = src.match(/songs\/([^\/]+)\//);
            if (folderMatch) {
                const folder = folderMatch[1];
                
                // Add play button overlay
                const playButton = document.createElement('div');
                playButton.className = 'play-overlay';
                playButton.innerHTML = `
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="black">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                `;
                card.appendChild(playButton);
                
                // Add album info overlay
                const infoOverlay = document.createElement('div');
                infoOverlay.className = 'album-info-overlay';
                card.appendChild(infoOverlay);
                
                // Load folder info on hover
                card.addEventListener('mouseenter', async () => {
                    try {
                        const response = await fetch(`songs/${folder}/info.json`);
                        if (response.ok) {
                            const info = await response.json();
                            infoOverlay.innerHTML = `
                                <div class="album-title">${info.title || folder}</div>
                                <div class="album-desc">${info.description || ''}</div>
                            `;
                        }
                    } catch (error) {
                        console.error(`Error loading info for ${folder}:`, error);
                    }
                });
                
                // Click to play album
                card.addEventListener('click', async () => {
                    console.log(`\n🎼 Loading album: ${folder}`);
                    
                    const loadedSongs = await loadSongsFromFolder(folder);
                    
                    if (loadedSongs.length > 0) {
                        currentSongIndex = 0;
                        playMusic(loadedSongs[0]);
                    } else {
                        showNotification(`No songs found in ${folder}`);
                        console.error(`❌ No songs loaded from ${folder}`);
                    }
                });
            }
        }
    });
    
    // Initialize display
    const songTime = document.querySelector('.songtime');
    if (songTime) {
        songTime.innerHTML = '00:00 / 00:00';
    }
    
    console.log('✅ Ready! Click any album to start playing.');
});

// Add CSS for notification and placeholders
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #2e2e2e;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10001;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    
    .notification.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
    
    .album-info-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
        padding: 12px;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }
    
    .card:hover .album-info-overlay {
        opacity: 1;
    }
    
    .album-title {
        color: white;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
    }
    
    .album-desc {
        color: #b3b3b3;
        font-size: 12px;
    }
    
    .cover-placeholder {
        width: 128px;
        height: 128px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        padding: 10px;
        border-radius: 4px;
        word-wrap: break-word;
    }
`;
document.head.appendChild(style);