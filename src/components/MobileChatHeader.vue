<script setup lang="ts">

import { computed } from 'vue';



type Conversation = {

  id: string;

  type: 'direct' | 'group' | 'channel';

  title: string | null;

};



const props = defineProps<{

  activeConversation: Conversation | null;

  presenceText?: string;

  isOnline?: boolean;

  isTyping?: boolean;

}>();



const emit = defineEmits<{

  back: [];

  openInfo: [];

}>();



function titleLabel() {

  if (!props.activeConversation) return 'Чаты';

  return props.activeConversation.title || 'Без названия';

}



const isDirectChat = computed(() => props.activeConversation?.type === 'direct');



const resolvedSubtitle = computed(() => {

  const external = (props.presenceText || '').trim();

  if (external) return external;



  if (!props.activeConversation) return '';



  if (props.activeConversation.type === 'direct') {

    if (props.isTyping) return 'Печатает..';

    return props.isOnline ? 'онлайн' : 'не в сети';

  }



  if (props.activeConversation.type === 'group') return 'Группа';

  return 'Канал';

});



const showStatusDot = computed(() => {

  return isDirectChat.value && !!props.isOnline && !props.isTyping;

});



const isActivePresence = computed(() => {

  return isDirectChat.value && (showStatusDot.value || !!props.isTyping);

});



function initials(value: string) {

  return value.trim().charAt(0).toUpperCase();

}

</script>



<template>

  <div class="tm-mobile-chat-header">

    <button

      type="button"

      class="tm-mobile-chat-header__back"

      aria-label="Назад"

      @click="emit('back')"

    >

      <svg viewBox="0 0 24 24" aria-hidden="true">

        <path

          d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11H20a1 1 0 1 1 0 2h-9.59l4.3 4.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.41 0Z"

          fill="currentColor"

        />

      </svg>

    </button>



    <div class="tm-mobile-chat-header__avatar">

      {{ initials(titleLabel()) }}

    </div>



    <div class="tm-mobile-chat-header__meta">

      <div class="tm-mobile-chat-header__title">{{ titleLabel() }}</div>



      <div

        class="tm-mobile-chat-header__subtitle"

        :class="{ 'tm-mobile-chat-header__subtitle--active': isActivePresence }"

      >

        <span

          v-if="showStatusDot"

          class="tm-mobile-chat-header__status-dot"

          aria-hidden="true"

        />

        <span>{{ resolvedSubtitle }}</span>

      </div>

    </div>



    <div class="tm-mobile-chat-header__actions">

      <button

        type="button"

        class="tm-mobile-chat-header__action"

        aria-label="Видео"

      >

        <svg viewBox="0 0 24 24" aria-hidden="true">

          <path

            d="M4 7a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2.2l3.35-2.01A1 1 0 0 1 20 8.05v7.9a1 1 0 0 1-1.65.86L15 14.8V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"

            fill="currentColor"

          />

        </svg>

      </button>



      <button

        type="button"

        class="tm-mobile-chat-header__action"

        aria-label="Звонок"

      >

        <svg viewBox="0 0 24 24" aria-hidden="true">

          <path

            d="M6.62 10.79a15.54 15.54 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.11.37 2.3.56 3.57.56a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.06 21 3 13.94 3 5a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.27.19 2.46.56 3.57a1 1 0 0 1-.24 1.02l-2.2 2.2Z"

            fill="currentColor"

          />

        </svg>

      </button>



      <button

        type="button"

        class="tm-mobile-chat-header__action tm-mobile-chat-header__action--more"

        aria-label="Информация"

        @click="emit('openInfo')"

      >

        <svg viewBox="0 0 24 24" aria-hidden="true">

          <circle cx="12" cy="5" r="1.9" fill="currentColor" />

          <circle cx="12" cy="12" r="1.9" fill="currentColor" />

          <circle cx="12" cy="19" r="1.9" fill="currentColor" />

        </svg>

      </button>

    </div>

  </div>

</template>



<style scoped>

.tm-mobile-chat-header {

  position: sticky;

  top: 0;

  z-index: 80;

  display: flex;

  align-items: center;

  gap: 12px;

  margin: 0;

  padding: calc(env(safe-area-inset-top, 0px) + 10px) 14px 12px;

  background: linear-gradient(180deg, #132c49 0%, #102742 100%);

  box-shadow: 0 14px 30px rgba(7, 20, 34, 0.22);

}



.tm-mobile-chat-header__back,

.tm-mobile-chat-header__action {

  width: 40px;

  height: 40px;

  border: 0;

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.1);

  color: #ffffff;

  cursor: pointer;

  flex: 0 0 auto;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  padding: 0;

  box-shadow: none;

}



.tm-mobile-chat-header__back svg,

.tm-mobile-chat-header__action svg {

  width: 20px;

  height: 20px;

  display: block;

}



.tm-mobile-chat-header__avatar {

  width: 44px;

  height: 44px;

  border-radius: 999px;

  background: linear-gradient(180deg, #ffbf4d 0%, #ff9e32 100%);

  color: #ffffff;

  font-size: 18px;

  font-weight: 800;

  display: grid;

  place-items: center;

  flex: 0 0 auto;

}



.tm-mobile-chat-header__meta {

  min-width: 0;

  flex: 1 1 auto;

}



.tm-mobile-chat-header__title {

  font-size: 16px;

  line-height: 1.05;

  font-weight: 800;

  color: #ffffff;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;

}



.tm-mobile-chat-header__subtitle {

  margin-top: 4px;

  font-size: 12px;

  line-height: 1.2;

  color: rgba(255, 255, 255, 0.82);

  display: flex;

  align-items: center;

  gap: 6px;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;

}



.tm-mobile-chat-header__subtitle--active {

  color: #42da69;

}



.tm-mobile-chat-header__status-dot {

  width: 8px;

  height: 8px;

  min-width: 8px;

  border-radius: 999px;

  background: #33d35e;

  box-shadow: 0 0 0 3px rgba(51, 211, 94, 0.14);

}



.tm-mobile-chat-header__actions {

  display: flex;

  align-items: center;

  gap: 8px;

  margin-left: auto;

  flex: 0 0 auto;

}



.tm-mobile-chat-header__action--more svg {

  width: 18px;

  height: 18px;

}



.tm-mobile-chat-header__back:active,

.tm-mobile-chat-header__action:active {

  transform: translateY(1px);

}

</style>

