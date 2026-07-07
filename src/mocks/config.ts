/**
 * Mock 接口开关，key 与 handlers/ 中各域 handler 的 guard() 调用一一对应
 * 设为 false 则该接口走真实网络，无需重启（HMR 热更 config 模块）
 *
 * 使用 `as const satisfies` 确保：
 * 1. 类型推断保留精确 string literal
 * 2. 超出此对象定义的 key 在 guard() 处编译报错
 */
export const mockConfig = {
  'POST /api/example/hello': true
} as const satisfies Record<string, boolean>

export type MockKey = keyof typeof mockConfig
