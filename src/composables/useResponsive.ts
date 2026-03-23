import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const MOBILE_BREAKPOINT = 768;

export function useResponsive() {
  const width = ref<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  function handleResize() {
    width.value = window.innerWidth;
  }

  onMounted(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
  });

  const isMobile = computed(() => width.value < MOBILE_BREAKPOINT);
  const isDesktop = computed(() => !isMobile.value);

  return {
    width,
    isMobile,
    isDesktop,
  };
}
