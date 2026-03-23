<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

type MediaItem = {
  key: string;
  kind: 'image' | 'video';
  src: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  senderUsername: string;
  createdAt: string;
  canDeleteForSelf: boolean;
  canDeleteForEveryone: boolean;
};

const props = defineProps<{
  visible: boolean;
  items: MediaItem[];
  startIndex: number;
}>();

const emit = defineEmits<{
  close: [];
  reply: [];
  forward: [];
  deleteSelf: [];
  deleteEveryone: [];
  report: [];
}>();

const currentIndex = ref(0);
const controlsHidden = ref(false);
const videoEl = ref<HTMLVideoElement | null>(null);
const rootEl = ref<HTMLElement | null>(null);
const deleteMenuOpen = ref(false);
const isRootFullscreen = ref(false);

const progress = ref(0);
const duration = ref(0);
const currentTime = ref(0);
const volume = ref(1);
const isMuted = ref(false);
const isPlaying = ref(false);

let controlsHideTimer: number | null = null;

const currentItem = computed(() => props.items[currentIndex.value] || null);
const isVideo = computed(() => currentItem.value?.kind === 'video');
const isVideoFullscreenMode = computed(() => isRootFullscreen.value && isVideo.value);
const isImageFullscreenMode = computed(() => isRootFullscreen.value && !isVideo.value);

function tryFixMojibake(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (!/[ÐÑÃ]/.test(raw)) {
    return raw.replace(/\s+/g, ' ').trim();
  }

  try {
    const bytes = Uint8Array.from([...raw].map((ch) => ch.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes).trim();
    if (decoded) return decoded.replace(/\s+/g, ' ').trim();
  } catch {}

  return raw.replace(/\s+/g, ' ').trim();
}

const displayName = computed(() => {
  const item = currentItem.value;
  if (!item) return '';
  return tryFixMojibake(item.originalName) || (item.kind === 'video' ? 'Видео' : 'Изображение');
});

const displayType = computed(() => {
  const item = currentItem.value;
  if (!item) return '';
  return item.kind === 'video' ? 'Видео' : 'Изображение';
});

const displayExt = computed(() => {
  const item = currentItem.value;
  if (!item?.originalName) return item?.kind === 'video' ? 'MP4' : 'PNG';
  const normalized = tryFixMojibake(item.originalName);
  const parts = normalized.split('.');
  const ext = parts.length > 1 ? parts.pop() || '' : '';
  return (ext || (item.kind === 'video' ? 'MP4' : 'PNG')).toUpperCase();
});

const displaySize = computed(() => {
  const bytes = currentItem.value?.sizeBytes || 0;
  if (bytes <= 0) return '';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ГБ`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} МБ`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${bytes} Б`;
});

const formattedTime = computed(() => {
  const item = currentItem.value;
  if (!item?.createdAt) return '';
  return new Date(item.createdAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
});

function formatClock(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function syncVideoState() {
  const video = videoEl.value;
  if (!video) {
    progress.value = 0;
    duration.value = 0;
    currentTime.value = 0;
    isPlaying.value = false;
    return;
  }

  duration.value = Number.isFinite(video.duration) ? video.duration : 0;
  currentTime.value = Number.isFinite(video.currentTime) ? video.currentTime : 0;
  progress.value = duration.value > 0 ? currentTime.value / duration.value : 0;
  volume.value = video.volume;
  isMuted.value = video.muted;
  isPlaying.value = !video.paused && !video.ended;
}

function clearControlsTimer() {
  if (controlsHideTimer) {
    window.clearTimeout(controlsHideTimer);
    controlsHideTimer = null;
  }
}

function armControlsAutoHide() {
  clearControlsTimer();
  if (!isVideo.value) return;

  controlsHideTimer = window.setTimeout(() => {
    controlsHidden.value = true;
    controlsHideTimer = null;
  }, 4000);
}

function showControlsTemporarily() {
  if (!isVideo.value) return;
  controlsHidden.value = false;
  armControlsAutoHide();
}

function handleMouseActivity() {
  if (!isVideo.value) return;
  controlsHidden.value = false;
  armControlsAutoHide();
}

function closeDeleteMenu() {
  deleteMenuOpen.value = false;
}

function toggleDeleteMenu() {
  deleteMenuOpen.value = !deleteMenuOpen.value;
}

async function close() {
  closeDeleteMenu();
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch {}
  }
  emit('close');
}

function prev() {
  if (props.items.length <= 1) return;
  currentIndex.value = (currentIndex.value - 1 + props.items.length) % props.items.length;
  closeDeleteMenu();
}

function next() {
  if (props.items.length <= 1) return;
  currentIndex.value = (currentIndex.value + 1) % props.items.length;
  closeDeleteMenu();
}

function selectIndex(index: number) {
  currentIndex.value = index;
  closeDeleteMenu();
}

function togglePlay() {
  const video = videoEl.value;
  if (!video) return;

  if (video.paused) {
    video.play().catch(() => {});
  } else {
    video.pause();
  }

  syncVideoState();
  showControlsTemporarily();
}

function onSeek(event: Event) {
  const video = videoEl.value;
  if (!video || !duration.value) return;
  const input = event.target as HTMLInputElement;
  const ratio = Number(input.value) / 1000;
  video.currentTime = duration.value * ratio;
  syncVideoState();
  showControlsTemporarily();
}

function onVolume(event: Event) {
  const video = videoEl.value;
  const input = event.target as HTMLInputElement;
  const nextVolume = Math.max(0, Math.min(1, Number(input.value) / 100));
  volume.value = nextVolume;

  if (video) {
    video.volume = nextVolume;
    video.muted = nextVolume === 0;
  }

  isMuted.value = nextVolume === 0;
  showControlsTemporarily();
}

function toggleMute() {
  const video = videoEl.value;
  if (!video) return;

  video.muted = !video.muted;
  if (!video.muted && video.volume === 0) {
    video.volume = 1;
  }

  syncVideoState();
  showControlsTemporarily();
}

async function toggleFullscreen() {
  const root = rootEl.value;
  if (!root) return;

  try {
    if (document.fullscreenElement === root) {
      await document.exitFullscreen();
    } else {
      await root.requestFullscreen();
    }
  } catch {}

  if (isVideo.value) {
    showControlsTemporarily();
  }
}

function downloadCurrent() {
  const item = currentItem.value;
  if (!item) return;

  const a = document.createElement('a');
  a.href = item.src;
  a.download = displayName.value || 'media';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function emitDeleteSelf() {
  deleteMenuOpen.value = false;
  emit('deleteSelf');
}

function emitDeleteEveryone() {
  deleteMenuOpen.value = false;
  emit('deleteEveryone');
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.visible) return;

  if (event.key === 'Escape') {
    if (deleteMenuOpen.value) {
      deleteMenuOpen.value = false;
      return;
    }
    close();
    return;
  }

  if (event.key === 'ArrowLeft') {
    prev();
    return;
  }

  if (event.key === 'ArrowRight') {
    next();
    return;
  }

  if (event.key === ' ' && isVideo.value) {
    event.preventDefault();
    togglePlay();
  }
}

function onGlobalClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('.tm-media-viewer__delete-wrap')) {
    closeDeleteMenu();
  }
}

function onVideoLoadedMetadata() {
  syncVideoState();
  showControlsTemporarily();
}

function onVideoTimeUpdate() {
  syncVideoState();
}

function onVideoPlay() {
  syncVideoState();
  showControlsTemporarily();
}

function onVideoPause() {
  syncVideoState();
  showControlsTemporarily();
}

function onFullscreenChange() {
  isRootFullscreen.value = document.fullscreenElement === rootEl.value;

  if (isVideoFullscreenMode.value) {
    showControlsTemporarily();
    return;
  }

  controlsHidden.value = false;
  clearControlsTimer();
}

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      currentIndex.value = Math.max(0, Math.min(props.startIndex || 0, Math.max(0, props.items.length - 1)));
      controlsHidden.value = false;
      deleteMenuOpen.value = false;
      await nextTick();
      syncVideoState();
      showControlsTemporarily();
      document.addEventListener('keydown', handleKeydown);
      document.addEventListener('click', onGlobalClick);
      document.addEventListener('fullscreenchange', onFullscreenChange);
      return;
    }

    clearControlsTimer();
    deleteMenuOpen.value = false;
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', onGlobalClick);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
  },
  { immediate: true }
);

watch(
  () => props.startIndex,
  async (value) => {
    if (!props.visible) return;
    currentIndex.value = Math.max(0, Math.min(value || 0, Math.max(0, props.items.length - 1)));
    deleteMenuOpen.value = false;
    await nextTick();
    syncVideoState();
    showControlsTemporarily();
  }
);

watch(
  () => [currentIndex.value, currentItem.value?.kind],
  async () => {
    deleteMenuOpen.value = false;
    await nextTick();
    syncVideoState();
    showControlsTemporarily();
  }
);

onBeforeUnmount(() => {
  clearControlsTimer();
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', onGlobalClick);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="tm-media-viewer"
      :class="{ 'is-root-fullscreen': isRootFullscreen, 'is-video-fullscreen-mode': isVideoFullscreenMode }"
      @click.self="close"
    >
      <div
        ref="rootEl"
        class="tm-media-viewer__dialog"
        @mousemove="handleMouseActivity"
      >
        <div v-if="!(isVideoFullscreenMode || isImageFullscreenMode)" class="tm-media-viewer__header">
          <div class="tm-media-viewer__title-wrap">
            <div class="tm-media-viewer__title">{{ displayName }}</div>

            <div class="tm-media-viewer__chips">
              <span class="tm-media-viewer__chip">{{ displayType }}</span>
              <span class="tm-media-viewer__chip">{{ displayExt }}</span>
              <span v-if="displaySize" class="tm-media-viewer__chip">{{ displaySize }}</span>
            </div>

            <div class="tm-media-viewer__meta">
              <div class="tm-media-viewer__avatar">
                {{ (currentItem?.senderUsername || '?').slice(0, 1).toUpperCase() }}
              </div>
              <div class="tm-media-viewer__meta-text">
                <div class="tm-media-viewer__sender">{{ currentItem?.senderUsername }}</div>
                <div class="tm-media-viewer__meta-time">{{ formattedTime }}</div>
              </div>
            </div>
          </div>

          <div class="tm-media-viewer__counter">
            {{ props.items.length ? currentIndex + 1 : 0 }} / {{ props.items.length }}
          </div>

          <button type="button" class="tm-media-viewer__close" @click="close">✕</button>
        </div>

        <div class="tm-media-viewer__stage">
          <button
            v-if="props.items.length > 1 && !(isVideoFullscreenMode || isImageFullscreenMode)"
            type="button"
            class="tm-media-viewer__nav tm-media-viewer__nav--prev"
            @click.stop="prev"
          >
            ‹
          </button>

          <div class="tm-media-viewer__media-wrap">
            <div
              v-if="currentItem?.kind === 'image'"
              class="tm-media-viewer__image-stage"
            >
              <img
                class="tm-media-viewer__image"
                :src="currentItem.src"
                :alt="displayName"
              />
              <button
                v-if="!isRootFullscreen"
                type="button"
                class="tm-media-viewer__icon-btn tm-media-viewer__image-fs-btn"
                @click.stop="toggleFullscreen"
                title="Во весь экран"
              >
                ⛶
              </button>
              <button
                v-if="isRootFullscreen"
                type="button"
                class="tm-media-viewer__image-close-fs"
                @click.stop="toggleFullscreen"
                title="Закрыть полноэкранный режим"
              >
                ✕
              </button>
            </div>

            <video
              v-else-if="currentItem?.kind === 'video'"
              ref="videoEl"
              class="tm-media-viewer__video"
              :class="{ 'is-fullscreen-video': isVideoFullscreenMode }"
              :src="currentItem.src"
              preload="metadata"
              playsinline
              @loadedmetadata="onVideoLoadedMetadata"
              @timeupdate="onVideoTimeUpdate"
              @play="onVideoPlay"
              @pause="onVideoPause"
              @click.stop="togglePlay"
            />
          </div>

          <button
            v-if="props.items.length > 1 && !(isVideoFullscreenMode || isImageFullscreenMode)"
            type="button"
            class="tm-media-viewer__nav tm-media-viewer__nav--next"
            @click.stop="next"
          >
            ›
          </button>
        </div>

        <div
          v-if="currentItem?.kind === 'video'"
          class="tm-media-viewer__controls"
          :class="{ 'is-hidden': controlsHidden, 'is-floating': isVideoFullscreenMode }"
        >
          <button type="button" class="tm-media-viewer__play" @click="togglePlay">
            {{ isPlaying ? '❚❚' : '▶' }}
          </button>

          <div class="tm-media-viewer__time">{{ formatClock(currentTime) }}</div>

          <input
            class="tm-media-viewer__range tm-media-viewer__range--progress"
            type="range"
            min="0"
            max="1000"
            :value="Math.round(progress * 1000)"
            @input="onSeek"
          />

          <div class="tm-media-viewer__time">{{ formatClock(duration) }}</div>

          <button type="button" class="tm-media-viewer__icon-btn" @click="toggleMute">
            {{ isMuted || volume === 0 ? '🔇' : '🔊' }}
          </button>

          <input
            class="tm-media-viewer__range tm-media-viewer__range--volume"
            type="range"
            min="0"
            max="100"
            :value="Math.round((isMuted ? 0 : volume) * 100)"
            @input="onVolume"
          />

          <button type="button" class="tm-media-viewer__icon-btn" @click="toggleFullscreen">
            ⛶
          </button>
        </div>

        <div v-if="!(isVideoFullscreenMode || isImageFullscreenMode)" class="tm-media-viewer__actions">
          <button type="button" class="tm-media-viewer__action" @click="emit('reply')">
            <span class="tm-media-viewer__action-icon">↩</span>
            <span>Ответить</span>
          </button>

          <button type="button" class="tm-media-viewer__action" @click="emit('forward')">
            <span class="tm-media-viewer__action-icon">↪</span>
            <span>Переслать</span>
          </button>

          <button type="button" class="tm-media-viewer__action" @click="downloadCurrent">
            <span class="tm-media-viewer__action-icon">⇩</span>
            <span>Скачать</span>
          </button>

          <div class="tm-media-viewer__delete-wrap">
            <button
              v-if="currentItem?.canDeleteForSelf || currentItem?.canDeleteForEveryone"
              type="button"
              class="tm-media-viewer__action tm-media-viewer__action--danger"
              @click.stop="toggleDeleteMenu"
            >
              <span class="tm-media-viewer__action-icon">🗑</span>
              <span>Удалить</span>
            </button>

            <div v-if="deleteMenuOpen" class="tm-media-viewer__delete-menu" @click.stop>
              <button
                v-if="currentItem?.canDeleteForSelf"
                type="button"
                class="tm-media-viewer__delete-item"
                @click="emitDeleteSelf"
              >
                Удалить у себя
              </button>
              <button
                v-if="currentItem?.canDeleteForEveryone"
                type="button"
                class="tm-media-viewer__delete-item tm-media-viewer__delete-item--danger"
                @click="emitDeleteEveryone"
              >
                Удалить у всех
              </button>
            </div>
          </div>

          <button type="button" class="tm-media-viewer__action" @click="emit('report')">
            <span class="tm-media-viewer__action-icon">⚑</span>
            <span>Пожаловаться</span>
          </button>
        </div>

        <div v-if="props.items.length > 1 && !(isVideoFullscreenMode || isImageFullscreenMode)" class="tm-media-viewer__thumbs">
          <div class="tm-media-viewer__thumbs-track">
            <button
              v-for="(item, index) in props.items"
              :key="item.key"
              type="button"
              class="tm-media-viewer__thumb"
              :class="{ 'is-active': index === currentIndex }"
              @click="selectIndex(index)"
            >
              <img
                v-if="item.kind === 'image'"
                class="tm-media-viewer__thumb-image"
                :src="item.src"
                :alt="item.originalName"
              />
              <div v-else class="tm-media-viewer__thumb-video">
                <video class="tm-media-viewer__thumb-image" :src="item.src" preload="metadata" muted playsinline />
                <span class="tm-media-viewer__thumb-play">▶</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tm-media-viewer {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  box-sizing: border-box;
  background: rgba(2, 6, 16, 0.94);
}

.tm-media-viewer.is-root-fullscreen {
  padding: 0;
  background: #000;
}

.tm-media-viewer__dialog {
  position: relative;
  width: min(1600px, calc(100vw - 24px));
  height: min(950px, calc(100vh - 24px));
  max-width: 100%;
  max-height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto auto;
  overflow: hidden;
  border-radius: 16px;
  background: #050d24;
  border: 1px solid rgba(110, 126, 177, 0.16);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.48);
}

.tm-media-viewer.is-root-fullscreen .tm-media-viewer__dialog {
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  border-radius: 0;
  border: 0;
}

.tm-media-viewer.is-video-fullscreen-mode .tm-media-viewer__dialog {
  grid-template-rows: minmax(0, 1fr);
  background: #000;
}

.tm-media-viewer__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 14px;
  align-items: start;
  padding: 22px 22px 18px;
  border-bottom: 1px solid rgba(110, 126, 177, 0.1);
  background: #07112d;
}

.tm-media-viewer__title-wrap {
  min-width: 0;
}

.tm-media-viewer__title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  color: #eef3ff;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.tm-media-viewer__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.tm-media-viewer__chip {
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: #d8e2ff;
  background: rgba(54, 67, 112, 0.34);
  border: 1px solid rgba(110, 126, 177, 0.18);
}

.tm-media-viewer__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
}

.tm-media-viewer__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #4f7cff, #3158d8);
  flex: 0 0 auto;
}

.tm-media-viewer__meta-text {
  min-width: 0;
}

.tm-media-viewer__sender {
  font-size: 14px;
  font-weight: 600;
  color: #eef3ff;
}

.tm-media-viewer__meta-time {
  font-size: 13px;
  font-weight: 500;
  color: rgba(220, 228, 255, 0.72);
}

.tm-media-viewer__counter {
  align-self: start;
  padding: 10px 15px;
  border-radius: 999px;
  background: rgba(3, 8, 21, 0.88);
  color: #eef3ff;
  font-weight: 700;
  font-size: 15px;
}

.tm-media-viewer__close {
  align-self: start;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  background: rgba(3, 8, 21, 0.88);
  color: #eef3ff;
  font-size: 18px;
  cursor: pointer;
}

.tm-media-viewer__stage {
  position: relative;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.tm-media-viewer__media-wrap {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tm-media-viewer__image-stage {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tm-media-viewer__image,
.tm-media-viewer__video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  background: #000;
}

.tm-media-viewer__video.is-fullscreen-video {
  width: 100%;
  height: 100%;
}

.tm-media-viewer__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid rgba(110, 126, 177, 0.24);
  background: rgba(7, 14, 34, 0.82);
  color: #eef3ff;
  font-size: 34px;
  line-height: 1;
  cursor: pointer;
}

.tm-media-viewer__nav--prev {
  left: 20px;
}

.tm-media-viewer__nav--next {
  right: 20px;
}

.tm-media-viewer__controls {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: #050d24;
  border-top: 1px solid rgba(110, 126, 177, 0.08);
  transition: opacity 0.22s ease;
}

.tm-media-viewer__controls.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.tm-media-viewer__controls.is-floating {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 8;
  background: linear-gradient(180deg, rgba(2, 6, 16, 0.12), rgba(2, 6, 16, 0.95));
  border-top: 1px solid rgba(110, 126, 177, 0.12);
  padding: 16px 22px calc(16px + env(safe-area-inset-bottom, 0px));
}

.tm-media-viewer__play {
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #5d78f4, #415ad8);
  color: #fff;
  font-size: 21px;
  cursor: pointer;
  flex: 0 0 auto;
}

.tm-media-viewer__icon-btn {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: rgba(14, 24, 58, 0.98);
  color: #fff;
  font-size: 17px;
  cursor: pointer;
  flex: 0 0 auto;
}

.tm-media-viewer__image-fs-btn {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 6;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.32);
}

.tm-media-viewer__image-close-fs {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 9;
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 50%;
  background: rgba(3, 8, 21, 0.88);
  color: #eef3ff;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.tm-media-viewer__time {
  font-size: 14px;
  font-weight: 600;
  color: #dfe7ff;
  white-space: nowrap;
}

.tm-media-viewer__range {
  appearance: none;
  height: 6px;
  border-radius: 999px;
  outline: none;
  background: rgba(130, 145, 196, 0.22);
}

.tm-media-viewer__range::-webkit-slider-thumb {
  appearance: none;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: #d9e0ff;
  border: 3px solid #5871e7;
  cursor: pointer;
}

.tm-media-viewer__range--progress {
  flex: 1 1 auto;
  min-width: 80px;
}

.tm-media-viewer__range--volume {
  width: 140px;
  max-width: 18vw;
}

.tm-media-viewer__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid rgba(110, 126, 177, 0.08);
  background: #07112d;
}

.tm-media-viewer__action {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border: 0;
  border-radius: 12px;
  padding: 11px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #eef3ff;
  background: rgba(22, 34, 79, 0.96);
  cursor: pointer;
}

.tm-media-viewer__action-icon {
  width: 16px;
  text-align: center;
  opacity: 0.95;
}

.tm-media-viewer__action--danger {
  background: #7f3240;
}

.tm-media-viewer__delete-wrap {
  position: relative;
}

.tm-media-viewer__delete-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 180px;
  background: #081229;
  border: 1px solid rgba(110, 126, 177, 0.18);
  border-radius: 12px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.34);
  overflow: hidden;
  z-index: 10;
}

.tm-media-viewer__delete-item {
  width: 100%;
  border: 0;
  background: transparent;
  color: #eef3ff;
  text-align: left;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.tm-media-viewer__delete-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.tm-media-viewer__delete-item--danger {
  color: #ffb8bf;
}

.tm-media-viewer__thumbs {
  padding: 14px 18px 16px;
  border-top: 1px solid rgba(110, 126, 177, 0.08);
  background: #07112d;
  overflow-x: auto;
  overflow-y: hidden;
}

.tm-media-viewer__thumbs-track {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: max-content;
}

.tm-media-viewer__thumb {
  width: 110px;
  height: 80px;
  border: 0;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(6, 10, 24, 0.98);
  padding: 0;
  cursor: pointer;
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(110, 126, 177, 0.08);
}

.tm-media-viewer__thumb.is-active {
  box-shadow: inset 0 0 0 2px #5f78f3;
}

.tm-media-viewer__thumb-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tm-media-viewer__thumb-video {
  position: relative;
  width: 100%;
  height: 100%;
}

.tm-media-viewer__thumb-play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 20px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.tm-media-viewer.is-root-fullscreen:not(.is-video-fullscreen-mode) .tm-media-viewer__stage {
  width: 100vw;
  height: 100vh;
}

.tm-media-viewer.is-root-fullscreen:not(.is-video-fullscreen-mode) .tm-media-viewer__media-wrap,
.tm-media-viewer.is-root-fullscreen:not(.is-video-fullscreen-mode) .tm-media-viewer__image-stage {
  width: 100%;
  height: 100%;
}

.tm-media-viewer.is-root-fullscreen:not(.is-video-fullscreen-mode) .tm-media-viewer__image {
  max-width: 100vw;
  max-height: 100vh;
}

@media (max-width: 900px) {
  .tm-media-viewer {
    padding: 8px;
  }

  .tm-media-viewer__dialog {
    width: 100%;
    height: 100%;
    border-radius: 14px;
  }

  .tm-media-viewer__header {
    padding: 16px;
  }

  .tm-media-viewer__title {
    font-size: 16px;
  }

  .tm-media-viewer__controls {
    gap: 10px;
    padding: 12px 14px;
  }

  .tm-media-viewer__play {
    width: 48px;
    height: 48px;
    font-size: 19px;
  }

  .tm-media-viewer__range--volume {
    width: 84px;
  }

  .tm-media-viewer__thumb {
    width: 88px;
    height: 64px;
  }
}
</style>
