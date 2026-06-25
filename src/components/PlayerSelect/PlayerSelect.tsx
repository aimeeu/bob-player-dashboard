import React from 'react';
import { Select, SelectItem } from '@carbon/react';

export interface Player {
  name: string;
  photo: string;
  position: string;
  age: number;
  citizenship: string;
  height: number | null;
  club: string;
  form: number;
}

interface PlayerSelectProps {
  players: Player[];
  selectedName: string;
  onChange: (name: string) => void;
}

function PlayerSelect({ players, selectedName, onChange }: PlayerSelectProps) {
  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Select
      id="player-select"
      labelText="Player"
      value={selectedName}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
    >
      <SelectItem value="" text="Select a player..." />
      {sorted.map((player) => (
        <SelectItem key={player.name} value={player.name} text={player.name} />
      ))}
    </Select>
  );
}

export default PlayerSelect;
