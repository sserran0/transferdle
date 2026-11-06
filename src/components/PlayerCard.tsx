import type { Player } from '../types'

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('')
}

export function PlayerCard({ player, showName }: { player: Player; showName: boolean }) {
  return (
    <section className="card" aria-label="Player">
      <div className="avatar" aria-hidden="true">{initials(player.name)}</div>
      <h2 className="name">{showName ? player.name : 'Mystery Player'}</h2>
      <dl className="facts">
        <div><dt>Position</dt><dd>{player.position}</dd></div>
        <div><dt>Nationality</dt><dd>{player.nationalityFlag} {player.nationality}</dd></div>
        <div><dt>Club</dt><dd>{player.club}</dd></div>
        <div><dt>Club country</dt><dd>{player.clubCountryFlag} {player.clubCountry}</dd></div>
      </dl>
    </section>
  )
}
