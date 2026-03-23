<script setup lang="ts">
type MediaItem = {
  id: string;
  name: string;
  url: string;
  kind: 'image' | 'video';
};

const props = defineProps<{
  visible: boolean;
  items: MediaItem[];
  grouped: boolean;
}>();

const emit = defineEmits<{
  'update:grouped': [value: boolean];
  remove: [id: string];
  cancel: [];
  confirm: [];
}>();

function setGrouped(event: Event) {
  emit('update:grouped', (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <div v-if="visible" class="mbm-backdrop" @click.self="emit('cancel')">
    <div class="mbm-modal">
      <div class="mbm-head">
        <div class="mbm-title">Выбрано {{ items.length }} {{ items.length === 1 ? 'файл' : items.length < 5 ? 'файла' : 'файлов' }}</div>
        <button type="button" class="mbm-close" @click="emit('cancel')">✕</button>
      </div>

      <div
        class="mbm-grid"
        :class="[
          items.length === 1 ? 'count-1' : '',
          items.length === 2 ? 'count-2' : '',
          items.length === 3 ? 'count-3' : '',
          items.length >= 4 ? 'count-many' : '',
        ]"
      >
        <div
          v-for="item in items"
          :key="item.id"
          class="mbm-card"
        >
          <button
            type="button"
            class="mbm-remove"
            @click="emit('remove', item.id)"
            title="Убрать"
          >
            🗑
          </button>

          <img
            v-if="item.kind === 'image'"
            class="mbm-thumb"
            :src="item.url"
            :alt="item.name"
          />

          <div v-else class="mbm-video-wrap">
            <video class="mbm-thumb mbm-video" :src="item.url" muted playsinline preload="metadata"></video>
            <div class="mbm-video-play">▶</div>
          </div>
        </div>
      </div>

      <label class="mbm-check">
        <input type="checkbox" :checked="grouped" @change="setGrouped" />
        <span>Группировать</span>
      </label>

      <div class="mbm-actions">
        <button type="button" class="mbm-btn ghost" @click="emit('cancel')">Отмена</button>
        <button type="button" class="mbm-btn primary" @click="emit('confirm')">Отправить</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mbm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 6000;
  background: rgba(6, 14, 24, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.mbm-modal {
  width: min(760px, 100%);
  max-height: min(88vh, 980px);
  overflow: auto;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(14, 28, 46, 0.98), rgba(9, 20, 34, 0.98));
  border: 1px solid rgba(130, 182, 255, 0.18);
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.45);
  padding: 18px;
}

.mbm-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.mbm-title {
  color: #eff5ff;
  font-size: 24px;
  font-weight: 800;
}

.mbm-close {
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #d8e5ff;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 18px;
}

.mbm-grid {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mbm-grid.count-1 {
  grid-template-columns: 1fr;
}

.mbm-grid.count-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mbm-grid.count-3,
.mbm-grid.count-many {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mbm-grid.count-3 .mbm-card:first-child,
.mbm-grid.count-many .mbm-card:first-child {
  grid-column: 1 / -1;
}

.mbm-card {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  min-height: 160px;
  background: rgba(255, 255, 255, 0.05);
}

.mbm-thumb {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 160px;
  max-height: 420px;
  object-fit: cover;
}

.mbm-video-wrap {
  position: relative;
}

.mbm-video-play {
  position: absolute;
  inset: auto auto 14px 14px;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 17, 30, 0.64);
  color: #fff;
  font-size: 18px;
  pointer-events: none;
}

.mbm-remove {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  border: none;
  border-radius: 12px;
  background: rgba(8, 17, 30, 0.58);
  color: #fff;
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.mbm-check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #dce8ff;
  font-size: 18px;
  margin-bottom: 16px;
}

.mbm-check input {
  width: 20px;
  height: 20px;
}

.mbm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mbm-btn {
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  font-size: 16px;
  cursor: pointer;
}

.mbm-btn.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #dce8ff;
}

.mbm-btn.primary {
  background: linear-gradient(135deg, #64b5ff, #7a5af8);
  color: #fff;
  font-weight: 700;
}
</style>
