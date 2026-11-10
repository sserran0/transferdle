import type { Stats } from '../lib/stats'

export function StatsPanel({ stats, todaysGuessCount, won }: { stats: Stats; todaysGuessCount: number; won: boolean }) {
  const max = Math.max(1, ...stats.distribution)
  const pct = stats.played ? Math.round((stats.won / stats.played) * 100) : 0
  const highlight = won ? todaysGuessCount - 1 : stats.distribution.length - 1
  return (
    <section className="stats" aria-label="Statistics">
      <dl className="stat-row">
        <div><dd>{stats.played}</dd><dt>Played</dt></div>
        <div><dd>{pct}%</dd><dt>Win rate</dt></div>
        <div><dd>{stats.currentStreak}</dd><dt>Streak</dt></div>
        <div><dd>{stats.maxStreak}</dd><dt>Best</dt></div>
      </dl>
      <ol className="histogram" aria-label="Guess distribution">
        {stats.distribution.map((n, i) => {
          const label = i === stats.distribution.length - 1 ? 'X' : String(i + 1)
          return (
            <li key={i}>
              <span>{label}</span>
              <span className={`bar${i === highlight ? ' today' : ''}`} style={{ width: `${Math.max(8, (n / max) * 100)}%` }}>{n}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
