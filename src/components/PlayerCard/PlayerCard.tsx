import React from 'react';
import { Tile } from '@carbon/react';
import { Player } from '../PlayerSelect/PlayerSelect.tsx';
import './_player-card.scss';

const fmt = (val: string | number | null | undefined): string =>
  val != null && val !== '' ? String(val) : '—';

interface PlayerCardProps {
  player: Player;
}

function PlayerCard({ player }: PlayerCardProps) {
  const stats: { label: string; value: string }[] = [
    { label: 'Position',    value: fmt(player.position) },
    { label: 'Age',         value: fmt(player.age) },
    { label: 'Nationality', value: fmt(player.citizenship) },
    { label: 'Club',        value: fmt(player.club) },
    { label: 'Form',        value: player.form != null ? `${player.form.toFixed(1)} / 10` : '—' },
  ];

  return (
    <Tile className="player-card">
      {player.photo && (
        <div className="player-card__photo-wrap">
          <img
            className="player-card__photo"
            src={player.photo}
            alt={player.name}
            width={120}
            height={120}
          />
        </div>
      )}
      <h2 className="player-card__name">{player.name}</h2>
      <dl className="player-card__stats">
        {stats.map(({ label, value }) => (
          <div key={label} className="player-card__stat-row">
            <dt className="player-card__stat-label">{label}</dt>
            <dd className="player-card__stat-value">{value}</dd>
          </div>
        ))}
      </dl>
    </Tile>
  );
}

export default PlayerCard;
