import type { Ref } from 'vue'

export interface ClickPosition {
  /** 相对于页面的 X 坐标 */
  pageX: number
  /** 相对于页面的 Y 坐标 */
  pageY: number
  /** 相对于客户端的 X 坐标 */
  clientX: number
  /** 相对于客户端的 Y 坐标 */
  clientY: number
  /** 相对于屏幕的 X 坐标 */
  screenX: number
  /** 相对于屏幕的 Y 坐标 */
  screenY: number
  /** 相对于目标元素的 X 坐标 */
  offsetX: number
  /** 相对于目标元素的 Y 坐标 */
  offsetY: number
  /** 点击的目标元素 */
  target: EventTarget | null
  /** 事件时间戳 */
  timestamp: number
}

export interface UseClickPositionOptions {
  /** 是否立即开始监听 */
  immediate?: boolean
  /** 是否捕获阶段监听事件 */
  capture?: boolean
  /** 是否被动监听事件 */
  passive?: boolean
  /** 点击时的回调函数 */
  onClick?: (position: ClickPosition, event: MouseEvent) => void
}

export type ElementTarget = string | Element | Document | Ref<Element | undefined | null>

/**
 * 获取元素实例
 * @param target 目标元素
 * @returns Element 实例、Document 或 null
 */
function resolveElement(target: ElementTarget): Element | Document | null {
  if (typeof target === 'string') return document.querySelector(target)
  if (target && 'value' in target) return unref(target) || null
  if (target instanceof Element || target instanceof Document) return target

  return null
}

/**
 * 获取点击事件位置信息的 hook
 * @param el 目标元素，可以是 CSS 选择器、ref 对象或 Element 实例，默认为 document
 * @param options 配置选项
 * @returns 包含位置信息和控制函数的对象
 */
export function useClickPosition(
  el: ElementTarget = document,
  options: UseClickPositionOptions = {}
) {
  const { immediate = true, capture = false, passive = true, onClick: initialOnClick } = options

  // 使用 ref 来存储回调，支持动态更新
  const onClickCallback = ref<((position: ClickPosition, event: MouseEvent) => void) | undefined>(
    initialOnClick
  )

  /** 当前点击位置信息 */
  const position = ref<ClickPosition | null>(null)
  /** 是否正在监听 */
  const isListening = ref(false)
  /** 是否暂停监听 */
  const isPaused = ref(false)
  /** 点击次数统计 */
  const clickCount = ref(0)
  /** 最后一次点击时间 */
  const lastClickTime = ref(0)

  /**
   * 处理点击事件
   * @param event 鼠标事件
   */
  function handleClick(event: Event) {
    const mouseEvent = event as MouseEvent
    if (isPaused.value) return

    const now = Date.now()
    clickCount.value++
    lastClickTime.value = now

    const clickPosition: ClickPosition = {
      pageX: mouseEvent.pageX,
      pageY: mouseEvent.pageY,
      clientX: mouseEvent.clientX,
      clientY: mouseEvent.clientY,
      screenX: mouseEvent.screenX,
      screenY: mouseEvent.screenY,
      offsetX: mouseEvent.offsetX,
      offsetY: mouseEvent.offsetY,
      target: mouseEvent.target,
      timestamp: now
    }

    position.value = clickPosition

    // 调用回调函数
    if (onClickCallback.value) {
      try {
        onClickCallback.value(clickPosition, mouseEvent)
      } catch (error) {
        console.error('[useClickPosition] Error in onClick callback:', error)
      }
    }
  }

  // 开始监听点击事件
  function start() {
    if (isListening.value) return

    const element = resolveElement(el) || document

    try {
      element.addEventListener('click', handleClick, {
        capture,
        passive
      })
      isListening.value = true
      isPaused.value = false
    } catch (error) {
      console.error('[useClickPosition] Failed to start listening:', error)
    }
  }

  // 停止监听点击事件
  function stop() {
    if (!isListening.value) return

    const element = resolveElement(el) || document

    try {
      element.removeEventListener('click', handleClick, {
        capture
      })
      isListening.value = false
      isPaused.value = false
    } catch (error) {
      console.error('[useClickPosition] Failed to stop listening:', error)
    }
  }

  // 暂停监听（不移除事件监听器）
  function pause() {
    isPaused.value = true
  }

  // 恢复监听
  function resume() {
    isPaused.value = false
  }

  // 重置位置信息和统计数据
  function reset() {
    position.value = null
    clickCount.value = 0
    lastClickTime.value = 0
  }

  // 切换监听状态
  function toggle() {
    if (isListening.value) {
      stop()
    } else {
      start()
    }
  }

  /**
   * 设置点击回调函数
   * @param callback 回调函数
   */
  function setOnClick(
    callback: ((position: ClickPosition, event: MouseEvent) => void) | undefined
  ) {
    onClickCallback.value = callback
  }

  // 组件卸载时自动停止监听
  onBeforeUnmount(stop)

  // 如果设置了立即开始，则自动开始监听
  if (immediate) {
    onMounted(start)
  }

  return {
    position: readonly(position),
    isListening: readonly(isListening),
    isPaused: readonly(isPaused),
    clickCount: readonly(clickCount),
    lastClickTime: readonly(lastClickTime),
    start,
    stop,
    pause,
    resume,
    reset,
    toggle,
    setOnClick
  }
}

export type UseClickPositionReturn = ReturnType<typeof useClickPosition>
