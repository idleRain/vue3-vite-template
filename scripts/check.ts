/**
 * 一键质量检查：lint → format → typecheck → test
 *
 * 用法: pnpm check
 */
import { spawnSync } from 'node:child_process'

// ─── ANSI 颜色─────────────

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
}

const CHECKS: Check[] = [
  { name: 'lint', label: 'ESLint', cmd: 'pnpm', args: ['lint'] },
  { name: 'format', label: 'Prettier', cmd: 'pnpm', args: ['format'] },
  { name: 'ts', label: 'TypeScript', cmd: 'pnpm', args: ['ts'] },
  { name: 'test', label: 'Vitest', cmd: 'pnpm', args: ['test'] }
]

const SEP = dim('─'.repeat(60))

// ─── 核心逻辑 ─────────────────────────────────

const runCheck = (check: Check): Result => {
  const start = Date.now()

  const proc = spawnSync(check.cmd, check.args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8',
    shell: true,
    timeout: 300_000
  })

  const duration = Date.now() - start
  const passed = proc.status === 0

  let errorCount = 0

  if (!passed) {
    const output = (proc.stdout ?? '') + (proc.stderr ?? '')

    if (check.name === 'ts') {
      const m = output.match(/Found (\d+) error/)
      errorCount = m ? Number(m[1]) : 0
    } else if (check.name === 'test') {
      const m = output.match(/Tests\s+(\d+)\s+failed/)
      errorCount = m ? Number(m[1]) : 0
    } else if (check.name === 'lint') {
      const m = output.match(/(\d+) problems?/)
      errorCount = m ? Number(m[1]) : 0
    }
    // format 不统计错误数
  }

  return { ...check, status: passed ? 'pass' : 'fail', exitCode: proc.status, errorCount, duration }
}

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ─── 主流程 ───────────────────────────────────

console.log(`\n${SEP}`)
console.log(`  ${bold('质量检查开始')}`)
console.log(`${SEP}\n`)

const results: Result[] = []

for (const check of CHECKS) {
  process.stdout.write(dim(`  [${check.label}] 运行中... `))
  const result = runCheck(check)
  results.push(result)

  const icon = result.status === 'pass' ? '✅' : '❌'
  const detail =
    result.status === 'pass'
      ? green(`通过 ${dim(`(${formatDuration(result.duration)})`)}`)
      : red(`失败 — ${result.errorCount} 个错误 ${dim(`(${formatDuration(result.duration)})`)}`)

  console.log(`${icon} ${detail}`)
}

// ─── 汇总 ─────────────────────────────────────

console.log(`\n${SEP}`)
console.log(`  ${bold('检查结果')}`)
console.log(SEP)

const passCount = results.filter(r => r.status === 'pass').length
const failCount = results.filter(r => r.status === 'fail').length

for (const r of results) {
  const icon = r.status === 'pass' ? green('✅') : red('❌')
  const label = r.status === 'pass' ? green('通过') : red(`${r.errorCount} 个错误`)
  console.log(`  ${icon} ${dim(r.label)}: ${label}`)
}

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

console.log(`${SEP}\n`)

process.exit(failCount > 0 ? 1 : 0)
