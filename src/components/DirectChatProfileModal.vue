<script setup lang="ts">
import { computed } from 'vue';

type UserProfile = {
  id: string;
  username: string;
  description?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
};

const props = defineProps<{
  open: boolean;
  user: UserProfile | null;
  isMuted: boolean;
  isBlockedByMe: boolean;
  hasBlockedMe: boolean;
  linksCount: number;
  sharedGroupsCount: number;
}>();

const emit = defineEmits<{
  close: [];
  writeMessage: [userId: string];
  openProfile: [username: string];
  toggleMute: [];
  toggleBlock: [];
  shareContact: [];
  reportUser: [];
}>();

function initials(username: string) {
  return username.trim().slice(0, 2).toUpperCase();
}

const blockedMode = computed<'blocked-by-me' | 'blocked-me' | null>(() => {
  if (props.isBlockedByMe) return 'blocked-by-me';
  if (props.hasBlockedMe) return 'blocked-me';
  return null;
});

function statusText() {
  if (!props.user) return '';
  if (blockedMode.value === 'blocked-by-me') return 'Вы заблокировали этого пользователя';
  if (blockedMode.value === 'blocked-me') return 'Вас заблокировали';
  return props.user.isOnline ? 'в сети' : 'был(а) недавно';
}


const stats = computed(() => [
  { key: 'saved', icon: 'bookmark', label: '1 сообщение в Избранном' },
  { key: 'photos', icon: 'image', label: '0 фотографий' },
  { key: 'videos', icon: 'video', label: '0 видео' },
  { key: 'files', icon: 'file', label: '0 файлов' },
  { key: 'links', icon: 'link', label: `${props.linksCount} ссылок` },
  { key: 'groups', icon: 'users', label: `${props.sharedGroupsCount} общих групп` },
]);

const actionItems = computed(() => {
  if (props.isBlockedByMe) {
    return [
      {
        key: 'block',
        icon: 'block',
        label: 'Разблокировать',
        danger: true,
        event: 'toggleBlock',
      },
      {
        key: 'report',
        icon: 'report',
        label: 'Пожаловаться',
        danger: true,
        event: 'reportUser',
      },
    ];
  }

  if (props.hasBlockedMe) {
    return [
      {
        key: 'report',
        icon: 'report',
        label: 'Пожаловаться',
        danger: true,
        event: 'reportUser',
      },
    ];
  }

  return [
    {
      key: 'share',
      icon: 'share',
      label: 'Поделиться контактом',
      danger: false,
      event: 'shareContact',
    },
    {
      key: 'block',
      icon: 'block',
      label: 'Заблокировать',
      danger: true,
      event: 'toggleBlock',
    },
  ];
});

function handleAction(eventName: string) {
  if (eventName === 'shareContact') emit('shareContact');
  if (eventName === 'toggleBlock') emit('toggleBlock');
  if (eventName === 'reportUser') emit('reportUser');
}
</script>

<template>
  <transition name="tm-direct-profile-fade">
    <div v-if="open && user" class="tm-direct-profile-modal" @click.stop>
      <div class="tm-direct-profile-modal__hero">
        <button class="tm-direct-profile-modal__close" @click="emit('close')" aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <div class="tm-direct-profile-modal__avatar-wrap">
          <div v-if="user.avatarUrl" class="tm-direct-profile-modal__avatar-image-wrap">
            <img :src="user.avatarUrl" alt="avatar" class="tm-direct-profile-modal__avatar-image" />
          </div>
          <div v-else class="tm-direct-profile-modal__avatar">
            {{ initials(user.username) }}
          </div>
        </div>

        <div class="tm-direct-profile-modal__name">{{ user.username }}</div>
        <div class="tm-direct-profile-modal__status">{{ statusText() }}</div>
      </div>

      <div v-if="!blockedMode" class="tm-direct-profile-modal__quick-actions">
        <button class="tm-direct-profile-modal__quick-btn" @click="emit('writeMessage', user.id)" :disabled="hasBlockedMe || isBlockedByMe">
          <span class="tm-direct-profile-modal__quick-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M7 18.5H6.5C5.12 18.5 4 17.38 4 16V7.5C4 6.12 5.12 5 6.5 5H17.5C18.88 5 20 6.12 20 7.5V16C20 17.38 18.88 18.5 17.5 18.5H11L7 21V18.5Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span>Чат</span>
        </button>

        <button class="tm-direct-profile-modal__quick-btn" type="button" @click="emit('toggleMute')">
          <span class="tm-direct-profile-modal__quick-icon">
            <svg v-if="!isMuted" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L14.2 8.6L19 9.2L15.5 12.5L16.4 17.2L12 14.8L7.6 17.2L8.5 12.5L5 9.2L9.8 8.6L12 4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M12 4L14.2 8.6L19 9.2L15.5 12.5L16.4 17.2L12 14.8L7.6 17.2L8.5 12.5L5 9.2L9.8 8.6L12 4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
            </svg>
          </span>
          <span>{{ isMuted ? 'Выкл. звук' : 'Звук' }}</span>
        </button>

        <button class="tm-direct-profile-modal__quick-btn" type="button" disabled>
          <span class="tm-direct-profile-modal__quick-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M8.5 5.5C8.9 5.1 9.5 5 10 5.3L12.4 6.8C12.9 7.1 13.1 7.7 12.9 8.3L12.2 10.1C13 11.7 14.3 13 15.9 13.8L17.7 13.1C18.3 12.9 18.9 13.1 19.2 13.6L20.7 16C21 16.5 20.9 17.1 20.5 17.5L19.4 18.6C18.7 19.3 17.6 19.5 16.6 19.2C13.9 18.4 11.4 16.9 9.3 14.7C7.1 12.6 5.6 10.1 4.8 7.4C4.5 6.4 4.7 5.3 5.4 4.6L6.5 3.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span>Звонок</span>
        </button>

        <button class="tm-direct-profile-modal__quick-btn" @click="emit('openProfile', user.username)">
          <span class="tm-direct-profile-modal__quick-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="6" cy="12" r="1.6" fill="currentColor" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" />
              <circle cx="18" cy="12" r="1.6" fill="currentColor" />
            </svg>
          </span>
          <span>Профиль</span>
        </button>
      </div>

      <div v-if="!blockedMode" class="tm-direct-profile-modal__info-section">
        <div class="tm-direct-profile-modal__info-block">
          <div class="tm-direct-profile-modal__info-value">@{{ user.username }}</div>
          <div class="tm-direct-profile-modal__info-label">Имя пользователя</div>
        </div>
      </div>

      <div v-if="!blockedMode && user.description" class="tm-direct-profile-modal__info-section tm-direct-profile-modal__info-section--description">
        <div class="tm-direct-profile-modal__info-block">
          <div class="tm-direct-profile-modal__info-value tm-direct-profile-modal__info-value--description">
            {{ user.description }}
          </div>
          <div class="tm-direct-profile-modal__info-label">Описание</div>
        </div>
      </div>

      <div v-if="!blockedMode" class="tm-direct-profile-modal__list-section">
        <button
          v-for="item in stats"
          :key="item.key"
          class="tm-direct-profile-modal__list-row"
          type="button"
        >
          <span class="tm-direct-profile-modal__list-icon">
            <svg v-if="item.icon === 'bookmark'" viewBox="0 0 24 24" fill="none">
              <path d="M7 4.8H17C17.55 4.8 18 5.25 18 5.8V19L12 15.6L6 19V5.8C6 5.25 6.45 4.8 7 4.8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="item.icon === 'image'" viewBox="0 0 24 24" fill="none">
              <rect x="4.5" y="5.5" width="15" height="13" rx="2.2" stroke="currentColor" stroke-width="1.7" />
              <path d="M7.5 15L10.3 12.2L12.6 14.5L14.7 12.4L17 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="9" cy="9.2" r="1.2" fill="currentColor" />
            </svg>
            <svg v-else-if="item.icon === 'video'" viewBox="0 0 24 24" fill="none">
              <rect x="4.5" y="6" width="11.5" height="12" rx="2.2" stroke="currentColor" stroke-width="1.7" />
              <path d="M16 10L19.5 8V16L16 14V10Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="item.icon === 'file'" viewBox="0 0 24 24" fill="none">
              <path d="M8 4.8H13.5L18 9.3V18.2C18 18.75 17.55 19.2 17 19.2H8C7.45 19.2 7 18.75 7 18.2V5.8C7 5.25 7.45 4.8 8 4.8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
              <path d="M13 4.8V9.8H18" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="item.icon === 'link'" viewBox="0 0 24 24" fill="none">
              <path d="M10 14L14 10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              <path d="M8 15.5L6.7 16.8C5.2 18.3 2.8 18.3 1.3 16.8C-0.2 15.3 -0.2 12.9 1.3 11.4L4.3 8.4C5.8 6.9 8.2 6.9 9.7 8.4" transform="translate(6 0)" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              <path d="M16 8.5L17.3 7.2C18.8 5.7 21.2 5.7 22.7 7.2C24.2 8.7 24.2 11.1 22.7 12.6L19.7 15.6C18.2 17.1 15.8 17.1 14.3 15.6" transform="translate(-4 0)" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            </svg>
            <svg v-else-if="item.icon === 'users'" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.7" />
              <circle cx="16.5" cy="10.5" r="2.5" stroke="currentColor" stroke-width="1.7" />
              <path d="M4.8 18.5C5.5 15.9 7.5 14.5 9.9 14.5C12.3 14.5 14.3 15.9 15 18.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              <path d="M15.3 18.5C15.7 16.9 17 16 18.5 16C20 16 21.2 16.9 21.6 18.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            </svg>
          </span>
          <span class="tm-direct-profile-modal__list-text">{{ item.label }}</span>
        </button>
      </div>

      <div class="tm-direct-profile-modal__list-section tm-direct-profile-modal__list-section--actions">
        <button
          v-for="item in actionItems"
          :key="item.key"
          :class="['tm-direct-profile-modal__list-row', item.danger ? 'is-danger' : '']"
          type="button"
          @click="handleAction(item.event)"
        >
          <span class="tm-direct-profile-modal__list-icon">
            <svg v-if="item.icon === 'share'" viewBox="0 0 24 24" fill="none">
              <path d="M9 15L17.5 6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              <path d="M14 6H18V10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M7 8.5V17.2C7 17.75 7.45 18.2 8 18.2H16C16.55 18.2 17 17.75 17 17.2V15.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            </svg>
            <svg v-else-if="item.icon === 'block'" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.8" />
              <path d="M8.5 15.5L15.5 8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
            <svg v-else-if="item.icon === 'report'" viewBox="0 0 24 24" fill="none">
              <path d="M12 7V13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <circle cx="12" cy="17" r="1.2" fill="currentColor" />
              <path d="M12 4L20 19H4L12 4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="tm-direct-profile-modal__list-text">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.tm-direct-profile-fade-enter-active,
.tm-direct-profile-fade-leave-active {
  transition: opacity .16s ease, transform .16s ease;
}

.tm-direct-profile-fade-enter-from,
.tm-direct-profile-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(.985);
}

.tm-direct-profile-modal {
  position: fixed;
  z-index: 60;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: min(100vw - 28px, 420px);
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(90, 118, 148, 0.34);
  background: linear-gradient(180deg, rgba(30, 43, 57, 0.99) 0%, rgba(24, 34, 46, 0.995) 100%);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
  color: #edf4fb;
}

.tm-direct-profile-modal__hero {
  position: relative;
  padding: 20px 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: linear-gradient(180deg, #324457 0%, #2a394b 100%);
  border-bottom: 1px solid rgba(88, 113, 143, 0.22);
}

.tm-direct-profile-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: rgba(19, 30, 43, 0.58);
  color: #f1f5fa;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.tm-direct-profile-modal__close svg {
  width: 20px;
  height: 20px;
}

.tm-direct-profile-modal__avatar-wrap {
  margin-top: 2px;
  margin-bottom: 14px;
}

.tm-direct-profile-modal__avatar,
.tm-direct-profile-modal__avatar-image-wrap {
  width: 88px;
  height: 88px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tm-direct-profile-modal__avatar {
  background: linear-gradient(180deg, #86c2ff 0%, #5e8fff 100%);
  color: #fff;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: .02em;
}

.tm-direct-profile-modal__avatar-image-wrap {
  overflow: hidden;
  background: rgba(255,255,255,.08);
}

.tm-direct-profile-modal__avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tm-direct-profile-modal__name {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.1;
}

.tm-direct-profile-modal__status {
  margin-top: 8px;
  font-size: 14px;
  color: #9dcbf7;
}

.tm-direct-profile-modal__alert {
  margin: -2px 14px 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(57, 74, 94, 0.72);
  color: #d8e7f5;
  font-size: 13px;
  border: 1px solid rgba(119, 150, 184, 0.18);
}

.tm-direct-profile-modal__alert--danger {
  background: rgba(70, 34, 42, 0.58);
  color: #ffd7dc;
  border-color: rgba(255, 107, 129, 0.24);
}

.tm-direct-profile-modal__quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 14px 14px 16px;
  background: #2a394a;
  border-bottom: 1px solid rgba(88, 113, 143, 0.16);
}

.tm-direct-profile-modal__quick-btn {
  border: 1px solid rgba(104, 132, 163, 0.1);
  border-radius: 13px;
  background: linear-gradient(180deg, rgba(34, 49, 66, 0.96) 0%, rgba(28, 40, 54, 0.98) 100%);
  color: #f0f4f8;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.tm-direct-profile-modal__quick-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tm-direct-profile-modal__quick-icon,
.tm-direct-profile-modal__list-icon {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #eef3f8;
  flex: 0 0 22px;
}

.tm-direct-profile-modal__quick-icon svg,
.tm-direct-profile-modal__list-icon svg {
  width: 22px;
  height: 22px;
  display: block;
}

.tm-direct-profile-modal__info-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  background: #223243;
  border-bottom: 1px solid rgba(88, 113, 143, 0.08);
}

.tm-direct-profile-modal__info-section--description {
  align-items: flex-start;
}

.tm-direct-profile-modal__info-block {
  min-width: 0;
  flex: 1;
}

.tm-direct-profile-modal__info-value {
  font-size: 17px;
  color: #7ec5ff;
  word-break: break-word;
}

.tm-direct-profile-modal__info-value--description {
  color: #eef3f7;
  font-size: 15px;
}

.tm-direct-profile-modal__info-label {
  margin-top: 5px;
  font-size: 12px;
  color: #97adbf;
}

.tm-direct-profile-modal__list-section {
  padding: 8px 0;
  background: #1d2936;
  border-top: 5px solid #253547;
}

.tm-direct-profile-modal__list-section--actions {
  padding-bottom: 8px;
}

.tm-direct-profile-modal__list-row {
  width: 100%;
  border: 0;
  background: transparent;
  color: #f1f4f7;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 18px;
  text-align: left;
  cursor: pointer;
}

.tm-direct-profile-modal__list-row.is-danger {
  color: #ff6972;
}

.tm-direct-profile-modal__list-text {
  font-size: 15px;
  line-height: 1.3;
}

@media (max-width: 640px) {
  .tm-direct-profile-modal {
    top: 10px;
    width: calc(100vw - 16px);
    border-radius: 18px;
  }
}
</style>
