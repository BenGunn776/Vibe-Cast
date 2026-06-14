const audio = document.getElementById('audio-element')
const playlist = document.getElementById('playlist')
const loader = document.getElementById('loader')
const volumeSlider = document.getElementById('volume-slider')
const volumeLabel = document.getElementById('volume-label')

const miniPlayer = document.getElementById('mini-player')
const miniPlayBtn = document.getElementById('mini-play-btn')
const mainPlayBtn = document.getElementById('main-play-btn')
const mainPlayTrigger = document.getElementById('main-play-trigger')

const mainPrevBtn = document.getElementById('main-prev-btn')
const mainNextBtn = document.getElementById('main-next-btn')
const miniPrevBtn = document.getElementById('mini-prev-btn')
const miniNextBtn = document.getElementById('mini-next-btn')

const miniLogo = document.getElementById('mini-logo')
const miniName = document.getElementById('mini-name')
const miniGenre = document.getElementById('mini-genre')
const miniInfoTrigger = document.getElementById('mini-info-trigger')

const mainLogo = document.getElementById('main-logo')
const mainName = document.getElementById('main-name')
const mainGenre = document.getElementById('main-genre')
const genreMarqueeContainer = document.getElementById('genre-marquee-container')

// Элементы переключения экранов на мобилках
const appWrapper = document.getElementById('app-wrapper')
const backToListBtn = document.getElementById('back-to-list-btn')
const openPlayerBtn = document.getElementById('open-player-btn')

const moodBanner = document.getElementById('mood-banner')
const bannerStatus = document.getElementById('banner-status')
const bannerStationName = document.getElementById('banner-station-name')
const bannerPlayBtn = document.getElementById('banner-play-btn')
const bannerPlayIcon = document.getElementById('banner-play-icon')
const streamStatusIcon = document.getElementById('stream-status-icon')
const bannerQuality = document.getElementById('banner-quality')
const bannerClicks = document.getElementById('banner-clicks')
const bannerActions = document.getElementById('banner-actions')
const bannerLikeBtn = document.getElementById('banner-like-btn')
const bannerShareBtn = document.getElementById('banner-share-btn')
const mainHeartBtn = document.getElementById('main-heart-btn')
const mainHeartIcon = document.getElementById('main-heart-icon')

const visualizer = document.getElementById('visualizer')
const visualizerBars = document.querySelectorAll('.visualizer .bar')

const liveDot = document.getElementById('live-dot')
const broadcastDot = document.getElementById('broadcast-dot')

const tabButtons = document.querySelectorAll('.tab-btn')

const themeToggleBtn = document.getElementById('theme-toggle-btn')
const themeIcon = document.getElementById('theme-icon')

let isPlaying = false
let currentActiveStation = null
let currentGenreVibe = 'POP'

let likedStations = new Set(
	JSON.parse(localStorage.getItem('radio_favorites')) || [],
)
let currentStationsList = []
let currentStationIndex = -1

let audioContext = null
let analyser = null
let dataArray = null
let source = null
let animationFrameId = null
let autoSwitchTimeout = null
let isSwitching = false

const genreCovers = {
	POP: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=70',
	DANCE:
		'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=70',
	TECHNO:
		'https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&auto=format&fit=crop&q=70',
	HOUSE:
		'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=70',
	TRANCE:
		'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=70',
	DNB: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&auto=format&fit=crop&q=70',
	LOFI: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=70',
	AMBIENT:
		'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=400&auto=format&fit=crop&q=70',
	COUNTRY:
		'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&auto=format&fit=crop&q=70',
	RUSSIAN:
		'https://images.unsplash.com/photo-1561542320-9a18cd340469?w=400&auto=format&fit=crop&q=70',
	DEFAULT:
		'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=400&auto=format&fit=crop&q=70',
}

audio.volume = volumeSlider.value
updateSliderBackground(volumeSlider.value)

setControlsState(true)

function setControlsState(enabled) {
	const state = enabled ? 'auto' : 'none'
	const opacity = enabled ? '1' : '0.5'

	mainPlayTrigger.style.pointerEvents = state
	mainPlayTrigger.style.opacity = opacity

	mainPrevBtn.disabled = !enabled
	mainNextBtn.disabled = !enabled
	miniPrevBtn.disabled = !enabled
	miniNextBtn.disabled = !enabled
}

function initAudioAnalyzer() {
	if (audioContext) return
	try {
		audioContext = new (window.AudioContext || window.webkitAudioContext)()
		analyser = audioContext.createAnalyser()
		source = audioContext.createMediaElementSource(audio)
		source.connect(analyser)
		analyser.connect(audioContext.destination)
		analyser.fftSize = 64
		dataArray = new Uint8Array(analyser.frequencyBinCount)
	} catch (e) {
		console.error('Web Audio API не поддерживается:', e)
	}
}

function renderAudioFrame() {
	if (!isPlaying || !analyser) {
		visualizerBars.forEach(bar => (bar.style.transform = 'scaleY(0.14)'))
		return
	}
	animationFrameId = requestAnimationFrame(renderAudioFrame)
	analyser.getByteFrequencyData(dataArray)

	const totalBars = visualizerBars.length
	const usableDataLength = Math.floor(dataArray.length * 0.65)

	for (let i = 0; i < totalBars; i++) {
		const index = Math.floor((i / totalBars) * usableDataLength)
		let value = dataArray[index] || 0

		if (i > totalBars * 0.7 && value < 40) {
			value = (dataArray[index - 2] || 0) * 0.5
		}

		const scaleValue = Math.max(0.14, value / 255)
		visualizerBars[i].style.transform = `scaleY(${scaleValue})`
	}
}

function openPlayerScreen() {
	appWrapper.classList.add('show-right-screen')
}
function closePlayerScreen() {
	appWrapper.classList.remove('show-right-screen')
}

miniInfoTrigger.addEventListener('click', openPlayerScreen)
openPlayerBtn.addEventListener('click', openPlayerScreen)
backToListBtn.addEventListener('click', closePlayerScreen)

async function loadStations(genre) {
	loader.classList.remove('hidden')
	playlist.innerHTML = ''

	if (genre === 'favorites') {
		const storedFavs =
			JSON.parse(localStorage.getItem('radio_favorites_data')) || []
		currentStationsList = storedFavs.filter(station =>
			likedStations.has(station.stationuuid),
		)
		localStorage.setItem(
			'radio_favorites_data',
			JSON.stringify(currentStationsList),
		)

		renderPlaylist(currentStationsList, 'DEFAULT')
		loader.classList.add('hidden')
		syncCurrentStationIndex()
		return
	}

	const url = `https://de1.api.radio-browser.info/json/stations/bytag/${genre}?limit=40&order=clickcount&reverse=true&https=true`

	try {
		const response = await fetch(url)
		const data = await response.json()

		currentStationsList = data.filter(station => {
			const name = station.name.trim()
			if (!name) return false

			const lowerName = name.toLowerCase()
			if (
				lowerName.includes('gachi') ||
				lowerName.includes('глад валакас') ||
				lowerName.includes('valakas')
			) {
				return false
			}

			return true
		})

		renderPlaylist(currentStationsList, genre.toUpperCase())
		syncCurrentStationIndex()
	} catch (error) {
		console.error(error)
		loader.innerHTML = '<span>Ошибка получения потоков...</span>'
	} finally {
		if (playlist.children.length > 0 || genre === 'favorites')
			loader.classList.add('hidden')
	}
}

function syncCurrentStationIndex() {
	if (!currentActiveStation || currentStationsList.length === 0) {
		currentStationIndex = -1
		return
	}
	currentStationIndex = currentStationsList.findIndex(
		station => station.stationuuid === currentActiveStation.stationuuid,
	)
}

function renderPlaylist(stations, genreTag) {
	if (stations.length === 0) {
		loader.classList.remove('hidden')
		loader.innerHTML = `<span>${genreTag === 'DEFAULT' ? 'Список избранного пуст' : 'Нет доступных станций'}</span>`
		return
	}

	const fallbackCover = genreCovers[genreTag] || genreCovers['DEFAULT']

	stations.forEach((station, index) => {
		const li = document.createElement('li')
		li.setAttribute('role', 'button')
		li.setAttribute('tabindex', '0')
		li.setAttribute('data-uuid', station.stationuuid)

		const icon =
			station.favicon && station.favicon.startsWith('https://')
				? station.favicon
				: fallbackCover

		li.innerHTML = `
			<div class="li-left-block">
				<img src="${icon}" onerror="this.src='${fallbackCover}'" alt="Station" draggable="false">
				<div class="li-info">
					<span class="li-title">${station.name}</span>
					<span class="li-sub">${(station.tags || 'Secure Stream').split(',')[0]}</span>
				</div>
			</div>
		`
		const action = () => {
			currentStationIndex = index
			selectStation(station, icon, fallbackCover)
			openPlayerScreen()
		}

		li.addEventListener('click', action)
		li.addEventListener('keydown', e => {
			if (e.key === 'Enter') action()
		})
		playlist.appendChild(li)
	})

	updatePlaylistHighlight()
}

function updatePlaylistHighlight() {
	const items = playlist.querySelectorAll('li')
	items.forEach(li => li.classList.remove('active-station'))

	if (currentActiveStation) {
		const currentLi = playlist.querySelector(
			`li[data-uuid="${currentActiveStation.stationuuid}"]`,
		)
		if (currentLi) {
			currentLi.classList.add('active-station')
		}
	}
}

function updateGenreMarquee() {
	if (!mainGenre || !genreMarqueeContainer) return

	genreMarqueeContainer.classList.remove('marquee-mode')

	const existingDuplicates =
		genreMarqueeContainer.querySelectorAll('.genre-duplicate')
	existingDuplicates.forEach(el => el.remove())

	const containerWidth = genreMarqueeContainer.clientWidth
	const textWidth = mainGenre.scrollWidth

	if (textWidth > containerWidth) {
		const duplicate = mainGenre.cloneNode(true)
		duplicate.id = ''
		duplicate.classList.add('genre-duplicate')
		genreMarqueeContainer.appendChild(duplicate)

		const speedPixelsPerSecond = 45
		const duration = textWidth / speedPixelsPerSecond

		genreMarqueeContainer.style.setProperty(
			'--marquee-duration',
			`${duration}s`,
		)
		genreMarqueeContainer.style.setProperty(
			'--marquee-distance',
			`-${textWidth}px`,
		)

		genreMarqueeContainer.classList.add('marquee-mode')
	}
}

function selectStation(station, icon, fallbackCover) {
	if (autoSwitchTimeout) {
		clearTimeout(autoSwitchTimeout)
		autoSwitchTimeout = null
	}

	const tag = station.tags ? station.tags.split(',')[0].toUpperCase() : 'RADIO'
	currentActiveStation = station
	currentGenreVibe = tag

	miniName.innerText = station.name
	miniGenre.innerText = tag

	miniLogo.src = icon
	mainLogo.src = icon
	mainLogo.onerror = () => {
		mainLogo.src = fallbackCover
		miniLogo.src = fallbackCover
	}

	bannerStationName.innerText = station.name

	bannerQuality.classList.remove('hidden')
	if (station.bitrate && station.bitrate > 0) {
		bannerQuality.innerText = `${station.bitrate} kbps`
	} else if (station.codec) {
		bannerQuality.innerText = station.codec.toUpperCase()
	} else {
		bannerQuality.innerText = 'HQ Stream'
	}

	bannerClicks.classList.remove('hidden')
	bannerActions.classList.remove('hidden')
	bannerClicks.innerHTML = `<i class="fa-solid fa-fire"></i> ${station.clickcount || 0}`

	mainName.innerText = station.name
	mainGenre.innerText = `Станция: ${station.name} (${tag})`

	syncLikeUI()
	audio.pause()
	audio.src = ''

	streamStatusIcon.className = 'fa-solid fa-wifi stream-icon-loading'
	streamStatusIcon.style.color = ''
	bannerStatus.innerText = 'Loading...'

	let streamUrl = station.url_resolved || station.url
	if (streamUrl && streamUrl.startsWith('http://')) {
		streamUrl = streamUrl.replace('http://', 'https://')
	}

	setControlsState(true)
	audio.src = streamUrl

	miniPlayer.classList.add('show')
	updatePlaylistHighlight()

	playAudio()

	setTimeout(updateGenreMarquee, 60)

	autoSwitchTimeout = setTimeout(() => {
		if (isPlaying === false || audio.readyState < 2) {
			console.log('Станция не ответила вовремя. Автоматический пропуск...')
			handleAudioError()
			playNextStation()
		}
	}, 6000)
}

function playNextStation() {
	if (currentStationsList.length === 0 || isSwitching) return
	isSwitching = true

	if (currentStationIndex === -1) {
		currentStationIndex = 0
	} else {
		currentStationIndex = (currentStationIndex + 1) % currentStationsList.length
	}
	triggerStationChange()

	setTimeout(() => {
		isSwitching = false
	}, 250)
}

function playPrevStation() {
	if (currentStationsList.length === 0 || isSwitching) return
	isSwitching = true

	if (currentStationIndex === -1) {
		currentStationIndex = currentStationsList.length - 1
	} else {
		currentStationIndex =
			(currentStationIndex - 1 + currentStationsList.length) %
			currentStationsList.length
	}
	triggerStationChange()

	setTimeout(() => {
		isSwitching = false
	}, 250)
}

function triggerStationChange() {
	const nextStation = currentStationsList[currentStationIndex]
	if (!nextStation) return
	const activeTab = document.querySelector('.tab-btn.active')
	const activeGenre = activeTab
		? activeTab.getAttribute('data-genre').toUpperCase()
		: 'DEFAULT'
	const fallback = genreCovers[activeGenre] || genreCovers['DEFAULT']
	const icon =
		nextStation.favicon && nextStation.favicon.startsWith('https://')
			? nextStation.favicon
			: fallback
	selectStation(nextStation, icon, fallback)
}

function updateFlashingDots(playing) {
	const action = playing ? 'add' : 'remove'
	liveDot.classList[action]('flashing')
	broadcastDot.classList[action]('flashing')
}

function toggleLike() {
	if (!currentActiveStation) return
	const id = currentActiveStation.stationuuid
	let storedData =
		JSON.parse(localStorage.getItem('radio_favorites_data')) || []

	if (likedStations.has(id)) {
		likedStations.delete(id)
		storedData = storedData.filter(s => s.stationuuid !== id)
	} else {
		likedStations.add(id)
		storedData.push(currentActiveStation)
	}

	localStorage.setItem('radio_favorites', JSON.stringify([...likedStations]))
	localStorage.setItem('radio_favorites_data', JSON.stringify(storedData))
	syncLikeUI()

	const activeTab = document.querySelector('.tab-btn.active')
	if (activeTab && activeTab.getAttribute('data-genre') === 'favorites') {
		loadStations('favorites')
	}
}

function syncLikeUI() {
	if (!currentActiveStation) return
	const isLiked = likedStations.has(currentActiveStation.stationuuid)
	bannerLikeBtn.classList.toggle('liked', isLiked)
	mainHeartIcon.className = isLiked
		? 'fa-solid fa-heart heart-icon liked'
		: 'fa-regular fa-heart heart-icon'
}

function shareStream() {
	if (!currentActiveStation) return
	const shareIcon = bannerShareBtn.querySelector('i')
	navigator.clipboard
		.writeText(currentActiveStation.url_resolved || currentActiveStation.url)
		.then(() => {
			shareIcon.className = 'fa-solid fa-check'
			bannerShareBtn.style.color = '#22c55e'
			setTimeout(() => {
				shareIcon.className = 'fa-solid fa-share-nodes'
				bannerShareBtn.style.color = ''
			}, 1200)
		})
}

function handleAudioError() {
	isPlaying = false
	setControlsState(true)
	streamStatusIcon.className = 'fa-solid fa-wifi'
	streamStatusIcon.style.color = '#ef4444'
	if (currentActiveStation) {
		moodBanner.classList.remove('playing-mode')
		visualizer.classList.add('hidden')
		bannerStatus.innerText = 'Unavailable'
		cancelAnimationFrame(animationFrameId)
		visualizerBars.forEach(bar => (bar.style.transform = 'scaleY(0.14)'))
	}
	updateMediaSession()
}

function updateUIState(playing) {
	updateFlashingDots(playing)
	if (playing) {
		if (autoSwitchTimeout) {
			clearTimeout(autoSwitchTimeout)
			autoSwitchTimeout = null
		}
		streamStatusIcon.style.color = ''
		miniPlayBtn.querySelector('i').className = 'fa-solid fa-pause'
		mainPlayBtn.className = 'fa-solid fa-pause main-play-icon'
		bannerPlayIcon.className = 'fa-solid fa-pause'
		streamStatusIcon.className = 'fa-solid fa-wifi stream-icon-good'
		if (currentActiveStation) {
			moodBanner.classList.add('playing-mode')
			visualizer.classList.remove('hidden')
			bannerStatus.innerText = 'Now Playing'
			cancelAnimationFrame(animationFrameId)
			renderAudioFrame()
		}
	} else {
		miniPlayBtn.querySelector('i').className = 'fa-solid fa-play'
		mainPlayBtn.className = 'fa-solid fa-play main-play-icon'
		bannerPlayIcon.className = 'fa-solid fa-play'
		if (currentActiveStation) {
			moodBanner.classList.remove('playing-mode')
			visualizer.classList.add('hidden')
			if (
				bannerStatus.innerText !== 'Unavailable' &&
				bannerStatus.innerText !== 'Loading...'
			) {
				bannerStatus.innerText = 'Paused'
			}
			cancelAnimationFrame(animationFrameId)
			visualizerBars.forEach(bar => (bar.style.transform = 'scaleY(0.14)'))
		}
	}
	updateMediaSession()
}

function playAudio() {
	if (!audio.src) return
	initAudioAnalyzer()
	if (audioContext && audioContext.state === 'suspended') audioContext.resume()

	audio
		.play()
		.then(() => {
			isPlaying = true
			updateUIState(true)
		})
		.catch(err => {
			console.log('Поток недоступен или заблокирован:', err)
			handleAudioError()
		})
}

function stopAudio() {
	audio.pause()
	isPlaying = false
	updateUIState(false)
}

function updateMediaSession() {
	if ('mediaSession' in navigator && currentActiveStation) {
		navigator.mediaSession.metadata = new MediaMetadata({
			title: currentActiveStation.name,
			artist: 'Vibe-Cast Radio',
			album: currentGenreVibe,
			artwork: [{ src: mainLogo.src, sizes: '512x512', type: 'image/jpeg' }],
		})

		navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
	}
}

function initMediaSessionActions() {
	if ('mediaSession' in navigator) {
		navigator.mediaSession.setActionHandler('play', () => {
			playAudio()
		})
		navigator.mediaSession.setActionHandler('pause', () => {
			stopAudio()
		})
		navigator.mediaSession.setActionHandler('previoustrack', () => {
			playPrevStation()
		})
		navigator.mediaSession.setActionHandler('nexttrack', () => {
			playNextStation()
		})
	}
}

function initKeyboardControls() {
	window.addEventListener('keydown', e => {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

		switch (e.code) {
			case 'Space':
				e.preventDefault()
				if (currentActiveStation) {
					isPlaying ? stopAudio() : playAudio()
				}
				break
			case 'ArrowRight':
				e.preventDefault()
				playNextStation()
				break
			case 'ArrowLeft':
				e.preventDefault()
				playPrevStation()
				break
			default:
				break
		}
	})
}

miniPlayBtn.addEventListener('click', e => {
	e.stopPropagation()
	isPlaying ? stopAudio() : playAudio()
})
mainPlayTrigger.addEventListener('click', () => {
	isPlaying ? stopAudio() : playAudio()
})
bannerPlayBtn.addEventListener('click', e => {
	e.stopPropagation()
	if (audio.src) isPlaying ? stopAudio() : playAudio()
})

bannerLikeBtn.addEventListener('click', e => {
	e.stopPropagation()
	toggleLike()
})
mainHeartBtn.addEventListener('click', toggleLike)
bannerShareBtn.addEventListener('click', e => {
	e.stopPropagation()
	shareStream()
})

mainNextBtn.addEventListener('click', playNextStation)
mainPrevBtn.addEventListener('click', playPrevStation)
miniNextBtn.addEventListener('click', e => {
	e.stopPropagation()
	playNextStation()
})
miniPrevBtn.addEventListener('click', e => {
	e.stopPropagation()
	playPrevStation()
})

volumeSlider.addEventListener('input', e => {
	const val = e.target.value
	audio.volume = val
	volumeLabel.innerText = `Громкость: ${Math.round(val * 100)}%`
	updateSliderBackground(val)
})

function updateSliderBackground(val) {
	const percentage = val * 100
	const isDark = document.body.classList.contains('dark-mode')
	const activeColor = isDark ? '#00f0ff' : '#2546e6'
	const trackColor = isDark ? '#1e293b' : '#cbd5e1'
	volumeSlider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, ${trackColor} ${percentage}%, ${trackColor} 100%)`
}

tabButtons.forEach(button => {
	button.addEventListener('click', e => {
		const container = document.querySelector('.genre-tabs')
		if (container && container.classList.contains('dragging')) return

		tabButtons.forEach(btn => btn.classList.remove('active'))
		const target = e.currentTarget
		target.classList.add('active')
		loadStations(target.getAttribute('data-genre'))
	})
})

themeToggleBtn.addEventListener('click', () => {
	document.body.classList.toggle('dark-mode')
	themeIcon.className = document.body.classList.contains('dark-mode')
		? 'fa-solid fa-sun'
		: 'fa-solid fa-moon'
	updateSliderBackground(volumeSlider.value)
	updateGenreMarquee()
})

audio.addEventListener('playing', () => updateUIState(true))
audio.addEventListener('pause', () => updateUIState(false))

audio.addEventListener('error', () => {
	handleAudioError()
	setTimeout(playNextStation, 1200)
})
audio.addEventListener('stalled', handleAudioError)

window.addEventListener('resize', () => {
	updateGenreMarquee()
	updateTabsMaskState()
	if (window.innerWidth > 680) closePlayerScreen()
})

function updateTabsMaskState() {
	const slider = document.querySelector('.genre-tabs')
	const wrapper = document.getElementById('genre-tabs-container')
	if (!slider || !wrapper) return

	const scrollLeft = slider.scrollLeft
	const maxScrollLeft = slider.scrollWidth - slider.clientWidth

	let leftFade = scrollLeft > 2 ? 'transparent 0%, #000 8%' : '#000 0%'
	let rightFade =
		scrollLeft < maxScrollLeft - 2 ? '#000 92%, transparent 100%' : '#000 100%'

	const maskStyle = `linear-gradient(to right, ${leftFade}, ${rightFade})`
	wrapper.style.webkitMaskImage = maskStyle
	wrapper.style.maskImage = maskStyle
}

function initTabsDragScroll() {
	const slider = document.querySelector('.genre-tabs')
	if (!slider) return

	let isDown = false
	let startX
	let scrollLeft
	let startY
	let isScrolling = false

	slider.addEventListener('scroll', updateTabsMaskState)

	slider.addEventListener('mousedown', e => {
		isDown = true
		isScrolling = false
		startX = e.pageX - slider.offsetLeft
		startY = e.pageY - slider.offsetTop
		scrollLeft = slider.scrollLeft
	})

	slider.addEventListener('mouseleave', () => {
		isDown = false
		slider.classList.remove('dragging')
	})

	slider.addEventListener('mouseup', () => {
		isDown = false
		setTimeout(() => {
			slider.classList.remove('dragging')
		}, 10)
	})

	slider.addEventListener('mousemove', e => {
		if (!isDown) return

		const x = e.pageX - slider.offsetLeft
		const y = e.pageY - slider.offsetTop

		if (Math.abs(x - startX) > 5 || Math.abs(y - startY) > 5) {
			isScrolling = true
			slider.classList.add('dragging')
		}

		if (isScrolling) {
			e.preventDefault()
			const walk = (x - startX) * 1.5
			slider.scrollLeft = scrollLeft - walk
			updateTabsMaskState()
		}
	})

	setTimeout(updateTabsMaskState, 200)
}

loadStations('pop')
initTabsDragScroll()
initMediaSessionActions()
initKeyboardControls()
