import React from 'react';
import { Player } from '../PlayerSelect/PlayerSelect.tsx';

// ---------------------------------------------------------------------------
// Field geometry — all derived from official FIFA proportions (105 × 68 m)
// displayed as a vertical pitch 520 × 800 px (inner play area 484 × 764).
// ---------------------------------------------------------------------------

const FIELD_W  = 520;   // total canvas width  (px)
const FIELD_H  = 800;   // total canvas height (px)
const BORDER   = 18;    // white touch-line inset from canvas edge

// Derived inner-play-area dimensions
const IW = FIELD_W - BORDER * 2;   // 484 px  (pitch width)
const IH = FIELD_H - BORDER * 2;   // 764 px  (pitch length)
const CX = FIELD_W / 2;            // 260     (horizontal centre)
const MID_Y = FIELD_H / 2;         // 400     (vertical centre / halfway line)

// Penalty box  — 40.32 m wide, 16.5 m deep  →  287 × 120 px
const PB_W     = Math.round(IW * (40.32 / 68));   // 287
const PB_DEPTH = Math.round(IH * (16.5 / 105));   // 120

// Goal area (6-yd box) — 18.32 m wide, 5.5 m deep  →  130 × 40 px
const GA_W     = Math.round(IW * (18.32 / 68));   // 130
const GA_DEPTH = Math.round(IH * (5.5 / 105));    //  40

// Penalty spot — 11 m from goal line  →  80 px
const PEN_DEPTH = Math.round(IH * (11 / 105));     //  80

// Centre circle & penalty arc radius — 9.15 m  →  67 px
const CC_R = Math.round(IW * (9.15 / 68));        //  65

// Corner arc radius — 1 m  →  7 px
const CORNER_R = Math.max(7, Math.round(IW * (1 / 68)));

// Goal width — 7.32 m  →  52 px, protrudes 12 px outside field
const GOAL_W    = Math.round(IW * (7.32 / 68));   //  52
const GOAL_PROJ = 14;   // how far goal rectangle sticks out beyond end line

// ---------------------------------------------------------------------------
// Player slot positions for a 4-4-2 (% of FIELD_W / FIELD_H)
// GK at bottom, FWD at top — attacking direction is upward
// ---------------------------------------------------------------------------
const SLOTS: { x: number; y: number }[] = [
  // GK
  { x: 50, y: 91 },
  // Defenders (L → R)
  { x: 18, y: 75 },
  { x: 36, y: 75 },
  { x: 64, y: 75 },
  { x: 82, y: 75 },
  // Midfielders (L → R)
  { x: 18, y: 55 },
  { x: 36, y: 55 },
  { x: 64, y: 55 },
  { x: 82, y: 55 },
  // Forwards (L → R)
  { x: 35, y: 28 },
  { x: 65, y: 28 },
];

// ---------------------------------------------------------------------------
// Helper: SVG arc path between two angles relative to a centre point
// ---------------------------------------------------------------------------
function arcPath(
  cx: number, cy: number, r: number,
  startDeg: number, endDeg: number,
  sweep: 0 | 1 = 1
): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`;
}

// ---------------------------------------------------------------------------
// Field markings — SVG overlay drawn entirely in SVG user-units
// ---------------------------------------------------------------------------
function FieldMarkings() {
  const S = { stroke: 'rgba(255,255,255,0.92)', strokeWidth: 1.5, fill: 'none' } as const;
  const SPOT = { fill: 'rgba(255,255,255,0.92)' } as const;

  // Reusable end-section markings (penalty box, goal area, spot, D-ring, goal)
  // `topY` = y of the end line (either BORDER for top, or BORDER+IH for bottom)
  // `dir`  = +1 if box extends downward (top end), -1 if upward (bottom end)
  function EndMarkings({ topY, dir }: { topY: number; dir: 1 | -1 }) {
    const penBoxX  = CX - PB_W / 2;
    const goalAreaX = CX - GA_W / 2;

    // Penalty box — open side faces field interior
    const pbInnerY = topY + dir * PB_DEPTH;
    // Goal area
    const gaInnerY = topY + dir * GA_DEPTH;
    // Penalty spot
    const spotY = topY + dir * PEN_DEPTH;
    // Penalty arc: the D extends into the field past the penalty box line.
    // We clip the arc so only the portion outside the penalty box is visible,
    // but SVG clipPath isn't available here in inline style context — instead
    // we draw the full semicircle and rely on it being partially hidden by the
    // grass gradient. The arc centre is the penalty spot; it curves away from goal.
    const arcStartDeg = dir === 1 ? 180 + 53 : 360 - 53;   // ~233° or ~307°
    const arcEndDeg   = dir === 1 ? 360 - 53 : 180 + 53;    // ~307° or ~233°
    // Goal rectangle — extends outside the field boundary
    const goalX = CX - GOAL_W / 2;
    const goalOuterY = topY - dir * GOAL_PROJ;

    return (
      <>
        {/* Penalty box */}
        <rect x={penBoxX} y={Math.min(topY, pbInnerY)}
              width={PB_W} height={PB_DEPTH} {...S} />

        {/* Goal area (6-yard box) */}
        <rect x={goalAreaX} y={Math.min(topY, gaInnerY)}
              width={GA_W} height={GA_DEPTH} {...S} />

        {/* Penalty spot */}
        <circle cx={CX} cy={spotY} r={3} {...SPOT} />

        {/* Penalty arc (D) — curves into field, away from goal */}
        <path d={arcPath(CX, spotY, CC_R, arcStartDeg, arcEndDeg, dir === 1 ? 1 : 0)} {...S} />

        {/* Goal — protrudes outside end line */}
        <rect
          x={goalX}
          y={Math.min(topY, goalOuterY)}
          width={GOAL_W}
          height={GOAL_PROJ}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={1.5}
          fill="rgba(255,255,255,0.08)"
        />
      </>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}
      aria-hidden
    >
      {/* ---- Pitch outline ---- */}
      <rect x={BORDER} y={BORDER} width={IW} height={IH} {...S} />

      {/* ---- Halfway line ---- */}
      <line x1={BORDER} y1={MID_Y} x2={BORDER + IW} y2={MID_Y} {...S} />

      {/* ---- Centre circle & spot ---- */}
      <circle cx={CX} cy={MID_Y} r={CC_R} {...S} />
      <circle cx={CX} cy={MID_Y} r={3} {...SPOT} />

      {/* ---- Top end (dir=+1 → box extends downward into pitch) ---- */}
      <EndMarkings topY={BORDER} dir={1} />

      {/* ---- Bottom end (dir=-1 → box extends upward into pitch) ---- */}
      <EndMarkings topY={BORDER + IH} dir={-1} />

      {/* ---- Corner arcs ---- */}
      {/* Top-left: arc sweeps from 0° (right) down to 90° (down) */}
      <path d={arcPath(BORDER, BORDER, CORNER_R, 0, 90, 1)} {...S} />
      {/* Top-right: from 90° to 180° */}
      <path d={arcPath(BORDER + IW, BORDER, CORNER_R, 90, 180, 1)} {...S} />
      {/* Bottom-right: from 180° to 270° */}
      <path d={arcPath(BORDER + IW, BORDER + IH, CORNER_R, 180, 270, 1)} {...S} />
      {/* Bottom-left: from 270° to 360° */}
      <path d={arcPath(BORDER, BORDER + IH, CORNER_R, 270, 360, 1)} {...S} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Player token
// ---------------------------------------------------------------------------
interface PlayerTokenProps {
  player: Player;
  slot: number;
  x: number;   // % of FIELD_W
  y: number;   // % of FIELD_H
}

function PlayerToken({ player, slot, x, y }: PlayerTokenProps) {
  const SIZE  = 44;
  const BADGE = 17;

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
    }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <img
          src={player.photo}
          alt={player.name}
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: '50%',
            border: '2px solid #fff',
            objectFit: 'cover',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            backgroundColor: '#2e7d32',
            display: 'block',
          }}
        />
        <div style={{
          position: 'absolute',
          top: -3,
          right: -3,
          width: BADGE,
          height: BADGE,
          borderRadius: '50%',
          backgroundColor: '#f9a825',
          color: '#000',
          fontSize: 9,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1.5px solid #fff',
          lineHeight: 1,
        }}>
          {slot}
        </div>
      </div>
      <span style={{
        color: '#fff',
        fontSize: 10,
        fontWeight: 600,
        textAlign: 'center',
        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
        maxWidth: 64,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {player.name}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormationBoard
// ---------------------------------------------------------------------------
interface FormationBoardProps {
  players: Player[];
}

function FormationBoard({ players }: FormationBoardProps) {
  return (
    // Outer wrapper absorbs the goal SVG overflow without affecting page layout
    <div style={{ display: 'inline-block', padding: `${GOAL_PROJ}px 0` }}>
      <div style={{
        position: 'relative',
        width: FIELD_W,
        height: FIELD_H,
        borderRadius: 4,
        overflow: 'visible',   // allows goal rects to peek outside
        background: [
          'linear-gradient(180deg,',
          '  #3a8c3f 0%, #45a84b 6%, #3a8c3f 12%,',
          '  #45a84b 18%, #3a8c3f 24%, #45a84b 30%,',
          '  #3a8c3f 36%, #45a84b 42%, #3a8c3f 48%,',
          '  #45a84b 54%, #3a8c3f 60%, #45a84b 66%,',
          '  #3a8c3f 72%, #45a84b 78%, #3a8c3f 84%,',
          '  #45a84b 90%, #3a8c3f 100%)',
        ].join(''),
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.25), 0 4px 20px rgba(0,0,0,0.35)',
        fontFamily: '-apple-system, "Segoe UI", system-ui, sans-serif',
        outline: `2px solid rgba(255,255,255,0.15)`,
      }}>
        <FieldMarkings />

        {players.length === 0 ? (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14,
            fontWeight: 500,
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            textAlign: 'center',
            padding: '0 3rem',
          }}>
            Click Generate Random Team to see the formation
          </div>
        ) : (
          players.slice(0, 11).map((player, idx) => (
            <PlayerToken
              key={player.name}
              player={player}
              slot={idx + 1}
              x={SLOTS[idx].x}
              y={SLOTS[idx].y}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default FormationBoard;
