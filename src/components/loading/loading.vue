<template>
  <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-[#fff9]">
    <div
      class="loader grid h-[50px] w-[50px] rounded-full border-4 border-transparent border-r-[#25b09b]"
    />
  </div>
</template>

<!--
  注意：首屏 loading（index.html 中的 .app-loading）使用了同样的视觉效果，
  修改本组件样式时请同步更新 index.html 顶部 <style> 内的 .app-loading__loader 样式。
-->
<style scoped>
.loader {
  animation: l15 1s infinite linear;
  aspect-ratio: 1;
}

.loader::before,
.loader::after {
  grid-area: 1/1;
  animation: l15 2s infinite;
  margin: 2px;
  border: inherit;
  border-radius: 50%;
  content: '';
}

.loader::after {
  animation-duration: 3s;
  margin: 8px;
}

@keyframes l15 {
  100% {
    transform: rotate(1turn);
  }
}
</style>
