import useTestStore from '@/store/modules/test'

// store 模块化中心
export default function useStore() {
  return {
    useTestStore: useTestStore()
  }
}
