// 请求失败后重试次数
export const RETRY_COUNT = 3

// 请求超时时间
export const REQUEST_TIMEOUT = 15000

// 业务接口成功码（响应体 data.code 与此值相等视为业务成功）
// 不同后端约定可能不同（常见：0 / 200 / 10000），按需修改
export const SUCCESS_CODE = 200
