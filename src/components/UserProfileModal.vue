<script setup lang="ts">
type UserProfile = {
  id: string;
  username: string;
  description?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
};

const props = defineProps<{
  user: UserProfile | null;
  open: boolean;
  isCurrentUser?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  writeMessage: [userId: string];
  blockUser: [userId: string];
  reportUser: [userId: string];
}>();

function initials(value: string) {
  return value.trim().slice(0, 2).toUpperCase();
}

function closeOnBackdrop(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close');
  }
}
</script>

<template>
  <div
    v-if="open && user"
    class="tm-overlay tm-user-profile-overlay"
    @click="closeOnBackdrop"
  >
    <div class="tm-modal tm-user-profile-modal" @click.stop>
      <div class="tm-modal__header">
        <h3 class="tm-modal__title">Профиль пользователя</h3>
        <button class="tm-modal__close" @click="emit('close')">✕</button>
      </div>

      <div class="tm-user-profile">
        <div class="tm-user-profile__hero">
          <div class="tm-avatar large tm-user-profile__avatar">
            {{ initials(user.username) }}
          </div>

          <div class="tm-user-profile__identity">
            <div class="tm-user-profile__name-row">
              <div class="tm-user-profile__name">{{ user.username }}</div>
              <span
                :class="[
                  'tm-user-profile__status',
                  user.isOnline ? 'is-online' : 'is-offline',
                ]"
              >
                {{ user.isOnline ? 'в сети' : 'не в сети' }}
              </span>
            </div>

            <div class="tm-user-profile__subtitle">
              {{ isCurrentUser ? 'Это ваш профиль' : 'Профиль пользователя MyMessage' }}
            </div>
          </div>
        </div>

        <div class="tm-info-card" style="margin: 16px 0 0 0;">
          <div class="tm-user-profile__section-title">Описание</div>
          <div class="tm-user-profile__description">
            {{ user.description || 'Описание пока не указано.' }}
          </div>
        </div>

        <div class="tm-info-card" style="margin: 14px 0 0 0;">
          <div class="tm-user-profile__section-title">Действия</div>

          <div class="tm-user-profile__actions">
            <button
              class="tm-primary tm-user-profile__action"
              :disabled="isCurrentUser"
              @click="emit('writeMessage', user.id)"
            >
              Написать личное сообщение
            </button>

            <button
              class="tm-secondary tm-user-profile__action"
              disabled
              title="Будет доступно после добавления backend-поддержки блокировки"
              @click="emit('blockUser', user.id)"
            >
              Заблокировать
            </button>

            <button
              class="tm-secondary tm-user-profile__action"
              disabled
              title="Будет доступно после добавления backend-поддержки жалоб"
              @click="emit('reportUser', user.id)"
            >
              Пожаловаться
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
