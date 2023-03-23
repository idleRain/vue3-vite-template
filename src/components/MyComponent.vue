<script setup name="HelloWorld">
// 使用 store
import useStore from '@/store/index.js'

const { useTestStore: test } = useStore()
</script>

<template>
  <h1>{{ test.msg }}</h1>

  <el-input v-model="test.msg"/>

  <div class="card">
    <button type="button" @click="test.setCount(test.count + 1)">
      count is {{ test.count }}
    </button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Install
    <a href="https://github.com/vuejs/language-tools" target="_blank">Volar</a>
    in your IDE for a better DX
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
