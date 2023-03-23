import { defineStore } from 'pinia'

export default defineStore('test', {
  state: () => ({
    count: 0,
    msg: '哈哈哈好耶！'
  }),
  actions: {
    setCount(num) {
      this.count = num
    },
    setMsg(msg) {
      this.msg = msg
    }
  },
  getters: {
    bigCount() {
      return this.count * 10
    },
    doubleCount: (state) => state.count * 2
  }
})
