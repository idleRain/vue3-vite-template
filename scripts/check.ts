/**
 * 一键质量检查：lint / format / typecheck / test 并行执行
 *
 * - 并行执行，总耗时取决于最慢的检查项
 * - 错误隔离：单个进程失败 / 超时 / 崩溃仅标记为 fail，不影响其他进程
 *
 * 用法: pnpm check
 */
import { spawn, type ChildProcess } from 'node:child_process'

// ─── ANSI 颜色 ──────────────

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
}

const green = (s: string) => `${c.green}${s}${c.reset}`
const red = (s: string) => `${c.red}${s}${c.reset}`
const dim = (s: string) => `${c.dim}${s}${c.reset}`
const bold = (s: string) => `${c.bold}${s}${c.reset}`

// ─── 类型 ─────────────────────────────────────

interface Check {
  name: string
  label: string
  cmd: string
  args: string[]
}

interface Result {
  name: string
  label: string
  status: 'pass' | 'fail'
  exitCode: number | null
  errorCount: number
  duration: number
  /** 失败时的完整输出，便于排错 */
  output: string
  /** 非正常退出原因（超时 / 信号 / 启动失败） */
  reason?: string
}

const CHECKS: Check[] = [
  { name: 'lint', label: 'ESLint', cmd: 'pnpm', args: ['lint'] },
  { name: 'format', label: 'Prettier', cmd: 'pnpm', args: ['format'] },
  { name: 'ts', label: 'TypeScript', cmd: 'pnpm', args: ['ts'] },
  { name: 'test', label: 'Vitest', cmd: 'pnpm', args: ['test', '--', 'run'] }
]

/** 单个检查超时上限（ms） */
const TIMEOUT_MS = 300_000

const SEP = dim('─'.repeat(60))

// ─── 核心逻辑 ─────────────────────────────────

/** 从子进程输出中按检查类型提取错误数 */
const countErrors = (name: string, output: string): number => {
  if (name === 'ts') {
    const m = output.match(/Found (\d+) error/)
    return m ? Number(m[1]) : 0
  }
  if (name === 'test') {
    const m = output.match(/Tests\s+(\d+)\s+failed/)
    return m ? Number(m[1]) : 0
  }
  if (name === 'lint') {
    const m = output.match(/(\d+) problems?/)
    return m ? Number(m[1]) : 0
  }
  // format 不统计错误数
  return 0
}

/**
 * 异步运行单个检查
 *
 * 进程正常退出、被信号终止、超时或启动失败时均 resolve 一个 Result，
 * 单个进程的异常不会影响其他并行进程。
 */
const runCheck = (check: Check): Promise<Result> =>
  new Promise(resolve => {
    const start = Date.now()
    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    let settled = false
    let timedOut = false
    let timer: NodeJS.Timeout | null = null

    // 幂等收口：防止 error / close / timeout 重复 resolve
    const finish = (result: Omit<Result, 'name' | 'label'>) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve({ name: check.name, label: check.label, ...result })
    }

    const collectOutput = () => Buffer.concat([...stdoutChunks, ...stderrChunks]).toString('utf-8')

    let proc: ChildProcess
    try {
      proc = spawn(check.cmd, check.args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        windowsHide: true
      })
    } catch (err) {
      // spawn 同步异常
      finish({
        status: 'fail',
        exitCode: null,
        errorCount: 0,
        duration: Date.now() - start,
        output: '',
        reason: `进程启动异常: ${(err as Error).message}`
      })
      return
    }

    timer = setTimeout(() => {
      timedOut = true
      // Windows + shell:true 下 kill 仅终止 shell，子进程可能成为孤儿
      proc.kill('SIGKILL')
    }, TIMEOUT_MS)

    proc.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(chunk))
    proc.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk))

    // 命令不存在 / 无法 spawn（ENOENT 等）
    proc.on('error', err => {
      finish({
        status: 'fail',
        exitCode: null,
        errorCount: 0,
        duration: Date.now() - start,
        output: collectOutput(),
        reason: `进程启动失败: ${err.message}`
      })
    })

    // close 事件：stdout/stderr 流已结束，输出收集完整
    proc.on('close', (code, signal) => {
      const passed = code === 0 && !timedOut
      finish({
        status: passed ? 'pass' : 'fail',
        exitCode: code,
        errorCount: passed ? 0 : countErrors(check.name, collectOutput()),
        duration: Date.now() - start,
        output: collectOutput(),
        reason: timedOut
          ? `超时（>${Math.round(TIMEOUT_MS / 1000)}s 被终止）`
          : signal
            ? `进程被信号终止: ${signal}`
            : undefined
      })
    })
  })

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/** 任务完成时打印结果 */
const printResult = (r: Result): Result => {
  const icon = r.status === 'pass' ? '✅' : '❌'
  const verdict =
    r.status === 'pass'
      ? green(`通过 ${dim(`(${formatDuration(r.duration)})`)}`)
      : red(
          `${r.reason ?? (r.errorCount > 0 ? `失败 - ${r.errorCount} 个错误` : '失败')} ${dim(`(${formatDuration(r.duration)})`)}`
        )
  console.log(`  ${icon} ${r.label.padEnd(10)} ${verdict}`)
  return r
}

// ─── 主流程 ───────────────────────────────────

console.log(`\n${SEP}`)
console.log(`  ${bold('质量检查开始')}`)
console.log(SEP)
console.log(`  ${dim('并行运行:')} ${CHECKS.map(c => c.label).join(dim(' · '))}\n`)

// allSettled 兜底：runCheck 不会 reject，此处为防御
const settled = await Promise.allSettled(CHECKS.map(check => runCheck(check).then(printResult)))

// settled 与 CHECKS 同序，以 CHECKS 为基准配对，保留定义顺序
const results: Result[] = CHECKS.map((check, i) => {
  const s = settled[i]
  if (s && s.status === 'fulfilled') return s.value
  // 防御分支：runCheck 不会 reject，理论不可达
  return {
    name: check.name,
    label: check.label,
    status: 'fail',
    exitCode: null,
    errorCount: 0,
    duration: 0,
    output: '',
    reason: `未捕获异常: ${String(s?.reason)}`
  }
})

// ─── 汇总 ─────────────────────────────────────

const passCount = results.filter(r => r.status === 'pass').length
const failCount = results.length - passCount

console.log(`\n${SEP}`)
console.log(`  ${bold('检查结果')}`)
console.log(SEP)
console.log(`  ${bold(`通过 ${green(String(passCount))} / ${String(CHECKS.length)}`)}`)

if (failCount > 0) {
  const failed = results
    .filter(r => r.status === 'fail')
    .map(r => r.label)
    .join(', ')
  console.log(`  ${red(`失败项: ${failed}`)}`)

  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0)
  console.log(`  ${red(`错误总数: ${totalErrors}`)}`)
}

console.log(SEP)

// 打印失败任务的完整输出
const failedResults = results.filter(r => r.status === 'fail')
if (failedResults.length > 0) {
  console.log(`\n  ${bold('失败详情')}`)
  for (const r of failedResults) {
    console.log(`\n  ${dim('───')} ${r.label} ${dim('输出 ───')}`)
    if (r.reason) console.log(`  ${red(r.reason)}`)
    const output = r.output.trim()
    // 缩进输出，空输出给出提示
    console.log(
      output
        ? output
            .split('\n')
            .map(l => `  ${l}`)
            .join('\n')
        : dim('  (无输出)')
    )
  }
  console.log(`\n${SEP}`)
}

console.log()

process.exit(failCount > 0 ? 1 : 0)
