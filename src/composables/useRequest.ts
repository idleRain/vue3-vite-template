import type { Ref } from 'vue'

export interface UseRequestOptions<T> {
  /** 是否在 setup 阶段立即执行一次（默认 false） */
  immediate?: boolean
  /** 初始数据 */
  initialData?: T
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 失败回调（在 toast 之后触发） */
  onError?: (error: Error) => void
  /** 完成回调（无论成功失败） */
  onFinally?: () => void
}

export interface UseRequestReturn<T, Args extends unknown[]> {
  /** 响应数据 */
  data: Ref<T | null>
  /** 加载中 */
  loading: Ref<boolean>
  /** 错误对象 */
  error: Ref<Error | null>
  /** 执行请求（与 fetcher 同参数） */
  execute: (...args: Args) => Promise<T | null>
  /** 用上一次的参数重新执行 */
  refresh: () => Promise<T | null>
  /** 重置所有状态 */
  reset: () => void
}

/**
 * 请求状态管理 composable
 *
 * 在组件里包装异步请求，自动管理 loading / data / error 三种状态，
 * 配合 services 层的 hooks（自动 toast + 类型守卫），组件代码可以保持纯粹。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useRequest } from '@/composables'
 * import API from '@/api'
 *
 * const { data, loading, error, execute } = useRequest(
 *   (userId: string) => API.user.getDetail(userId),
 *   { immediate: false }
 * )
 *
 * const submit = () => execute('123')
 * </script>
 * ```
 */
export function useRequest<T, Args extends unknown[] = []>(
  fetcher: (...args: Args) => Promise<T>,
  options: UseRequestOptions<T> = {}
): UseRequestReturn<T, Args> {
  const { immediate = false, initialData, onSuccess, onError, onFinally } = options

  const data = ref(initialData ?? null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // 保存最近一次参数，供 refresh 使用
  let lastArgs: Args | null = null

  const execute = async (...args: Args): Promise<T | null> => {
    lastArgs = args
    loading.value = true
    error.value = null

    try {
      const result = await fetcher(...args)
      data.value = result
      onSuccess?.(result)
      return result
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err
      onError?.(err)
      return null
    } finally {
      loading.value = false
      onFinally?.()
    }
  }

  const refresh = (): Promise<T | null> => {
    if (lastArgs === null) {
      // 从未执行过，用零参数尝试
      return execute(...([] as unknown as Args))
    }
    return execute(...lastArgs)
  }

  const reset = (): void => {
    data.value = initialData ?? null
    loading.value = false
    error.value = null
    lastArgs = null
  }

  if (immediate) {
    // 立即执行（用零参数，组件场景下 fetcher 通常无参或参数已在闭包内）
    execute(...([] as unknown as Args))
  }

  return { data, loading, error, execute, refresh, reset }
}
