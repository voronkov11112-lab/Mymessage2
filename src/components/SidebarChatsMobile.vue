<script setup lang="ts">

type User = {

  id: string;

  username: string;

  description?: string | null;

  avatarUrl?: string | null;

};



type Conversation = {

  id: string;

  type: 'direct' | 'group' | 'channel';

  title: string | null;

  createdAt: string;

  lastMessageText: string | null;

  lastMessageCreatedAt: string | null;

  unreadCount: number;

};



const props = defineProps<{

  users: User[];

  conversations: Conversation[];

  activeConversationId: string | null;

  searchQuery: string;

  unreadMap: Record<string, number>;

  onlineUserIds: string[];

}>();



const emit = defineEmits<{

  menu: [];

  search: [value: string];

  openDirect: [userId: string];

  openConversation: [conversationId: string];

}>();



function initials(value: string | null) {

  return (value || '?').trim().slice(0, 2).toUpperCase();

}



function avatarStyle(seed: string) {

  const colors = [

    ['#7ec5ff', '#4f8df6'],

    ['#7ee2a8', '#39b56c'],

    ['#ffca7a', '#f1964f'],

    ['#ff8fb2', '#df5f8f'],

    ['#c3a0ff', '#8d69ff'],

    ['#83e0d3', '#3eb9aa'],

  ];



  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {

    hash = seed.charCodeAt(i) + ((hash << 5) - hash);

  }



  const pair = colors[Math.abs(hash) % colors.length];

  return {

    background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`,

  };

}



function titleLabel(conversation: Conversation) {

  return conversation.title || 'Без названия';

}



function previewLabel(conversation: Conversation) {

  return conversation.lastMessageText || 'Нет сообщений';

}



function formatTime(value: string | null) {

  if (!value) return '';

  const date = new Date(value);

  return date.toLocaleTimeString('ru-RU', {

    hour: '2-digit',

    minute: '2-digit',

  });

}

</script>



<template>

  <div class="tm-mobile-chats">

    <div class="tm-mobile-chats__top">

      <button

        type="button"

        class="tm-mobile-chats__menu"

        @click="emit('menu')"

        aria-label="Меню"

      >

        ☰

      </button>



      <div class="tm-mobile-chats__title-wrap">

        <div class="tm-mobile-chats__eyebrow">MyMessage</div>

        <div class="tm-mobile-chats__title">Сообщения</div>

      </div>

    </div>



    <div class="tm-mobile-chats__search-wrap">

      <input

        class="tm-mobile-chats__search"

        :value="searchQuery"

        placeholder="Поиск чатов"

        @input="emit('search', ($event.target as HTMLInputElement).value)"

      />

    </div>



    <div class="tm-mobile-chats__list">

      <button

        v-for="conversation in conversations"

        :key="conversation.id"

        type="button"

        class="tm-mobile-chat-row"

        :class="{ 'is-active': activeConversationId === conversation.id }"

        @click="emit('openConversation', conversation.id)"

      >

        <div

          class="tm-mobile-chat-row__avatar"

          :style="avatarStyle(titleLabel(conversation))"

        >

          {{ initials(titleLabel(conversation)) }}

        </div>



        <div class="tm-mobile-chat-row__body">

          <div class="tm-mobile-chat-row__head">

            <div class="tm-mobile-chat-row__title">

              {{ titleLabel(conversation) }}

            </div>

            <div class="tm-mobile-chat-row__time">

              {{ formatTime(conversation.lastMessageCreatedAt) }}

            </div>

          </div>



          <div class="tm-mobile-chat-row__foot">

            <div class="tm-mobile-chat-row__preview">

              {{ previewLabel(conversation) }}

            </div>



            <div

              v-if="(unreadMap[conversation.id] || 0) > 0"

              class="tm-mobile-chat-row__unread"

            >

              {{ unreadMap[conversation.id] }}

            </div>

          </div>

        </div>

      </button>



      <div

        v-if="!conversations.length"

        class="tm-mobile-chats__empty"

      >

        Чаты не найдены

      </div>

    </div>



    <div class="tm-mobile-chats__users">

      <div class="tm-mobile-chats__users-title">Быстрый старт</div>



      <button

        v-for="user in users.slice(0, 8)"

        :key="user.id"

        type="button"

        class="tm-mobile-user-pill"

        @click="emit('openDirect', user.id)"

      >

        <span

          class="tm-mobile-user-pill__avatar"

          :style="avatarStyle(user.username)"

        >

          {{ initials(user.username) }}

        </span>

        <span class="tm-mobile-user-pill__name">{{ user.username }}</span>

      </button>

    </div>

  </div>

</template>



<style scoped>

.tm-mobile-chats {

  min-height: 100vh;

  min-height: 100dvh;

  padding:

    calc(10px + env(safe-area-inset-top))

    12px

    calc(16px + env(safe-area-inset-bottom));

  background:

    radial-gradient(circle at top, rgba(110, 170, 255, 0.18), transparent 28%),

    linear-gradient(180deg, #f6faff 0%, #eef4ff 100%);

}



.tm-mobile-chats__top {

  display: flex;

  align-items: center;

  gap: 12px;

  margin-bottom: 14px;

}



.tm-mobile-chats__menu {

  width: 42px;

  height: 42px;

  border: none;

  border-radius: 14px;

  background: rgba(89, 132, 219, 0.12);

  color: #21456e;

  font-size: 18px;

  font-weight: 700;

}



.tm-mobile-chats__title-wrap {

  min-width: 0;

}



.tm-mobile-chats__eyebrow {

  font-size: 11px;

  line-height: 1.2;

  letter-spacing: 0.06em;

  text-transform: uppercase;

  color: #6f89a5;

}



.tm-mobile-chats__title {

  margin-top: 2px;

  font-size: 22px;

  line-height: 1.1;

  font-weight: 800;

  color: #16395c;

}



.tm-mobile-chats__search-wrap {

  margin-bottom: 14px;

}



.tm-mobile-chats__search {

  width: 100%;

  height: 46px;

  border: 1px solid rgba(112, 151, 217, 0.14);

  border-radius: 16px;

  background: rgba(255, 255, 255, 0.86);

  padding: 0 14px;

  font-size: 15px;

  color: #183a5e;

  box-shadow: 0 10px 24px rgba(48, 79, 130, 0.06);

}



.tm-mobile-chats__list {

  display: flex;

  flex-direction: column;

  gap: 10px;

}



.tm-mobile-chat-row {

  display: flex;

  align-items: center;

  gap: 12px;

  width: 100%;

  border: 1px solid rgba(113, 156, 226, 0.12);

  border-radius: 20px;

  background: rgba(255, 255, 255, 0.9);

  padding: 12px;

  text-align: left;

  box-shadow: 0 12px 30px rgba(56, 88, 140, 0.08);

}



.tm-mobile-chat-row.is-active {

  border-color: rgba(90, 134, 225, 0.26);

  box-shadow: 0 14px 30px rgba(65, 104, 170, 0.14);

}



.tm-mobile-chat-row__avatar {

  width: 48px;

  height: 48px;

  border-radius: 16px;

  display: grid;

  place-items: center;

  color: #fff;

  font-size: 15px;

  font-weight: 800;

  flex: 0 0 auto;

}



.tm-mobile-chat-row__body {

  min-width: 0;

  flex: 1 1 auto;

}



.tm-mobile-chat-row__head,

.tm-mobile-chat-row__foot {

  display: flex;

  align-items: center;

  gap: 10px;

}



.tm-mobile-chat-row__head {

  margin-bottom: 5px;

}



.tm-mobile-chat-row__title {

  min-width: 0;

  flex: 1 1 auto;

  font-size: 15px;

  line-height: 1.2;

  font-weight: 700;

  color: #173a5d;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;

}



.tm-mobile-chat-row__time {

  font-size: 12px;

  line-height: 1.2;

  color: #7d93ab;

  flex: 0 0 auto;

}



.tm-mobile-chat-row__preview {

  min-width: 0;

  flex: 1 1 auto;

  font-size: 13px;

  line-height: 1.25;

  color: #6d849d;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;

}



.tm-mobile-chat-row__unread {

  min-width: 22px;

  height: 22px;

  padding: 0 7px;

  border-radius: 999px;

  background: linear-gradient(135deg, #5fa8ff, #4b7dff);

  color: #fff;

  font-size: 12px;

  font-weight: 800;

  display: grid;

  place-items: center;

  flex: 0 0 auto;

}



.tm-mobile-chats__empty {

  padding: 22px 16px;

  text-align: center;

  color: #758ca5;

  font-size: 14px;

}



.tm-mobile-chats__users {

  margin-top: 18px;

  padding: 14px;

  border-radius: 20px;

  background: rgba(255, 255, 255, 0.82);

  border: 1px solid rgba(114, 160, 230, 0.12);

  box-shadow: 0 12px 28px rgba(56, 88, 140, 0.07);

}



.tm-mobile-chats__users-title {

  font-size: 13px;

  line-height: 1.2;

  font-weight: 800;

  color: #294e78;

  margin-bottom: 10px;

}



.tm-mobile-user-pill {

  display: flex;

  align-items: center;

  gap: 10px;

  width: 100%;

  border: none;

  background: transparent;

  border-radius: 14px;

  padding: 10px 4px;

  text-align: left;

}



.tm-mobile-user-pill__avatar {

  width: 34px;

  height: 34px;

  border-radius: 12px;

  display: grid;

  place-items: center;

  color: #fff;

  font-size: 12px;

  font-weight: 800;

  flex: 0 0 auto;

}



.tm-mobile-user-pill__name {

  min-width: 0;

  font-size: 14px;

  line-height: 1.2;

  font-weight: 600;

  color: #214569;

}

</style>

