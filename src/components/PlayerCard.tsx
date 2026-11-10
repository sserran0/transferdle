import { useState } from 'react'
import type { Player } from '../types'

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('')
}

export function PlayerCard({ player, showName }: { player: Player; showName: boolean }) {
  // Remember which URL failed so a new player with a working photo still shows.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const photo = player.imageUrl && player.imageUrl !== failedUrl ? player.imageUrl : null

  return (
    <section className="card" aria-label="Player">
      {photo ? (
        <img
          className="avatar photo" src={photo} width={96} height={96}
          alt={showName ? `Photo of ${player.name}` : 'Mystery player'}
          referrerPolicy="no-referrer" onError={() => setFailedUrl(photo)}
        />
      ) : (
        <div className="avatar" aria-hidden="true">{initials(player.name)}</div>
      )}
      <h2 className="name">{showName ? player.name : 'Mystery Player'}</h2>
      <dl className="facts">
        <div><dt>Position</dt><dd>{player.position}</dd></div>
        <div><dt>Nationality</dt><dd>{player.nationalityFlag} {player.nationality}</dd></div>
        <div><dt>Club</dt><dd>{player.club}</dd></div>
        <div><dt>Club country</dt><dd>{player.clubCountryFlag} {player.clubCountry}</dd></div>
      </dl>
      {photo && player.imageCredit && player.imagePageUrl && (
        <p className="credit">
          Photo: <a href={player.imagePageUrl} target="_blank" rel="noreferrer noopener">{player.imageCredit}</a>
        </p>
      )}
    </section>
  )
}
