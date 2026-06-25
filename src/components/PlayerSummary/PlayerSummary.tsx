import React from 'react';
import { Tile } from '@carbon/react';
import { Player } from '../PlayerSelect/PlayerSelect.tsx';
import './_player-summary.scss';

function formLabel(rating: number): string {
  if (rating >= 8.0) return 'in strong form';
  if (rating >= 6.0) return 'showing consistent form';
  return 'building form';
}

/** Builds a grounded summary sentence from available dataset fields only. */
function buildSummary(player: Player): string {
  const parts: string[] = [];

  if (player.name && player.position) {
    parts.push(`${player.name} is a ${player.position.toLowerCase()}`);
  } else if (player.name) {
    parts.push(player.name);
  }

  if (player.citizenship) {
    parts[0] += ` from ${player.citizenship}`;
  }

  if (player.club) {
    parts.push(`currently playing for ${player.club}`);
  }

  if (player.age) {
    parts.push(`aged ${player.age}`);
  }

  if (player.form != null) {
    parts.push(`and is ${formLabel(player.form)}`);
  }

  const sentence = parts.join(', ')
    .replace(/, (and is )/, ' $1')   // tidy trailing comma before "and"
    .replace(/,$/, '');              // strip any trailing comma

  return `${sentence}. This profile is based on the available dataset only.`;
}

interface PlayerSummaryProps {
  player: Player;
}

function PlayerSummary({ player }: PlayerSummaryProps) {
  return (
    <Tile className="player-summary">
      <h3 className="player-summary__heading">Player Summary</h3>
      <p className="player-summary__text">{buildSummary(player)}</p>
      <p className="player-summary__source">
        This summary is based only on the loaded dataset.
      </p>
    </Tile>
  );
}

export default PlayerSummary;
