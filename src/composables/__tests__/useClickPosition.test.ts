import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ClickPosition } from '../useClickPosition'
import { useClickPosition } from '../useClickPosition'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// 创建一个测试组件来使用 hook
const TestComponent = {
  template: '<div ref="testEl" data-testid="test-element">Test Element</div>',
  setup() {
    const testEl = ref<HTMLElement>()
    const clickPosition = useClickPosition(testEl, { immediate: false })

    return {
      testEl,
      ...clickPosition
    }
  }
}

// 创建 mock 的鼠标事件
function createMockClickEvent(overrides: Partial<MouseEvent> = {}): MouseEvent {
  const event = new MouseEvent('click', {
    pageX: 100,
    pageY: 150,
    clientX: 100,
    clientY: 150,
    screenX: 200,
    screenY: 250,
    ...overrides
  })

  // 手动添加 offsetX 和 offsetY，因为 MouseEvent 构造函数不支持
  Object.defineProperty(event, 'offsetX', { value: overrides.offsetX || 50 })
  Object.defineProperty(event, 'offsetY', { value: overrides.offsetY || 75 })

  return event
}

describe('useClickPosition', () => {
  let originalConsoleError: typeof console.error

  beforeEach(() => {
    // Mock console.error to avoid test output noise
    originalConsoleError = console.error
    console.error = vi.fn()

    // Mock Date.now for consistent timestamps
    vi.spyOn(Date, 'now').mockReturnValue(1234567890)
  })

  afterEach(() => {
    console.error = originalConsoleError
    vi.restoreAllMocks()
  })

  describe('基本功能', () => {
    it('应该正确初始化 hook', async () => {
      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      expect(vm.position).toBeNull()
      expect(vm.isListening).toBe(false)
      expect(vm.isPaused).toBe(false)
      expect(vm.clickCount).toBe(0)
      expect(vm.lastClickTime).toBe(0)
    })

    it('应该能够开始和停止监听', async () => {
      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      // 开始监听
      vm.start()
      await nextTick()
      expect(vm.isListening).toBe(true)

      // 停止监听
      vm.stop()
      await nextTick()
      expect(vm.isListening).toBe(false)
    })

    it('应该能够暂停和恢复监听', async () => {
      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      vm.start()
      await nextTick()

      // 暂停监听
      vm.pause()
      expect(vm.isPaused).toBe(true)

      // 恢复监听
      vm.resume()
      expect(vm.isPaused).toBe(false)
    })

    it('应该能够切换监听状态', async () => {
      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      expect(vm.isListening).toBe(false)

      // 切换为开始监听
      vm.toggle()
      await nextTick()
      expect(vm.isListening).toBe(true)

      // 切换为停止监听
      vm.toggle()
      await nextTick()
      expect(vm.isListening).toBe(false)
    })
  })

  describe('点击事件处理', () => {
    it('应该正确捕获点击位置信息', async () => {
      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any
      const element = wrapper.find('[data-testid="test-element"]').element

      vm.start()
      await nextTick()

      // 模拟点击事件
      const mockEvent = createMockClickEvent({
        pageX: 100,
        pageY: 150,
        clientX: 100,
        clientY: 150,
        screenX: 200,
        screenY: 250,
        offsetX: 50,
        offsetY: 75
      })

      element.dispatchEvent(mockEvent)
      await nextTick()

      const position = vm.position as ClickPosition
      expect(position).toBeDefined()
      expect(position.pageX).toBe(100)
      expect(position.pageY).toBe(150)
      expect(position.clientX).toBe(100)
      expect(position.clientY).toBe(150)
      expect(position.screenX).toBe(200)
      expect(position.screenY).toBe(250)
      expect(position.offsetX).toBe(50)
      expect(position.offsetY).toBe(75)
      expect(position.timestamp).toBe(1234567890)
      expect(vm.clickCount).toBe(1)
      expect(vm.lastClickTime).toBe(1234567890)
    })

    it('暂停状态下不应该更新位置信息', async () => {
      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any
      const element = wrapper.find('[data-testid="test-element"]').element

      vm.start()
      vm.pause()
      await nextTick()

      const mockEvent = createMockClickEvent()
      element.dispatchEvent(mockEvent)
      await nextTick()

      expect(vm.position).toBeNull()
      expect(vm.clickCount).toBe(0)
    })

    it('应该能够重置数据', async () => {
      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any
      const element = wrapper.find('[data-testid="test-element"]').element

      vm.start()
      await nextTick()

      // 先触发一次点击
      const mockEvent = createMockClickEvent()
      element.dispatchEvent(mockEvent)
      await nextTick()

      expect(vm.position).not.toBeNull()
      expect(vm.clickCount).toBe(1)

      // 重置数据
      vm.reset()
      expect(vm.position).toBeNull()
      expect(vm.clickCount).toBe(0)
      expect(vm.lastClickTime).toBe(0)
    })
  })

  describe('不同元素目标测试', () => {
    it('应该能够使用 CSS 选择器', () => {
      // 创建一个 DOM 元素
      const testElement = document.createElement('div')
      testElement.className = 'test-selector'
      document.body.appendChild(testElement)

      const TestComponentWithSelector = {
        template: '<div>Test with selector</div>',
        setup() {
          return useClickPosition('.test-selector', { immediate: false })
        }
      }

      const wrapper = mount(TestComponentWithSelector)
      const vm = wrapper.vm as any

      vm.start()
      expect(vm.isListening).toBe(true)

      // 清理
      document.body.removeChild(testElement)
    })

    it('应该能够使用 document 作为默认目标', () => {
      const TestComponentWithDocument = {
        template: '<div>Test with document</div>',
        setup() {
          return useClickPosition(undefined, { immediate: false })
        }
      }

      const wrapper = mount(TestComponentWithDocument)
      const vm = wrapper.vm as any

      vm.start()
      expect(vm.isListening).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('重复开始监听不应该报错', async () => {
      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      vm.start()
      vm.start() // 重复调用
      await nextTick()

      expect(vm.isListening).toBe(true)
    })

    it('未开始监听时停止不应该报错', async () => {
      const wrapper = mount(TestComponent)
      const vm = wrapper.vm as any

      vm.stop() // 在未开始监听时停止
      await nextTick()

      expect(vm.isListening).toBe(false)
    })

    it('无效的 CSS 选择器应该降级到 document', () => {
      const TestComponentWithInvalidSelector = {
        template: '<div>Test with invalid selector</div>',
        setup() {
          return useClickPosition('.non-existent-element', { immediate: false })
        }
      }

      const wrapper = mount(TestComponentWithInvalidSelector)
      const vm = wrapper.vm as any

      // 应该能够正常开始监听（降级到 document）
      vm.start()
      expect(vm.isListening).toBe(true)
    })
  })

  describe('选项配置', () => {
    it('immediate 选项应该正常工作', async () => {
      const TestComponentImmediate = {
        template: '<div>Test immediate</div>',
        setup() {
          return useClickPosition(document, { immediate: true })
        }
      }

      const wrapper = mount(TestComponentImmediate)
      const vm = wrapper.vm as any

      await nextTick()
      expect(vm.isListening).toBe(true)
    })
  })
})
