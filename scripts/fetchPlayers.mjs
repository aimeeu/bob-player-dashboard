/**
 * scripts/fetchPlayers.js
 *
 * Downloads Premier League player data from API-Football (season 2023, league 39)
 * and saves the result to src/data/players.json.
 *
 * Run: node scripts/fetchPlayers.js
 */

import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = 'https://v3.football.api-sports.io';
const SEASON   = 2023;
const LEAGUE_ID = 39; // Premier League

// Team IDs on API-Football for six major PL clubs
const TEAMS = [
  { id: 50,  name: 'Manchester City'    },
  { id: 33,  name: 'Manchester United'  },
  { id: 40,  name: 'Liverpool'          },
  { id: 42,  name: 'Arsenal'            },
  { id: 49,  name: 'Chelsea'            },
  { id: 47,  name: 'Tottenham'          },
];

const DELAY_MS = 600; // stay well inside the free-plan rate limit

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = path.resolve(__dirname, '..', 'src', 'data');
const OUT_FILE  = path.join(OUT_DIR, 'players.json');

const API_KEY = process.env.API_FOOTBALL_KEY;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch all pages for a given team/season and return the raw response items.
 */
async function fetchTeamPlayers(teamId, teamName) {
  const players = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${API_BASE}/players?team=${teamId}&season=${SEASON}&page=${page}`;
    const res = await fetch(url, {
      headers: { 'x-apisports-key': API_KEY },
    });

    if (!res.ok) {
      throw new Error(`API request failed [${res.status}] for team "${teamName}" (id ${teamId}), page ${page}: ${await res.text()}`);
    }

    const json = await res.json();

    if (json.errors && Object.keys(json.errors).length > 0) {
      throw new Error(`API error for team "${teamName}": ${JSON.stringify(json.errors)}`);
    }

    players.push(...(json.response ?? []));

    totalPages = json.paging?.pages ?? 1;
    page += 1;

    // Delay between page requests too
    if (page <= totalPages) await sleep(DELAY_MS);

  } while (page <= totalPages);

  return players;
}

/**
 * Map a raw API response item to our domain shape.
 * Returns null if the player has no PL stats or no rating.
 */
function mapPlayer(item) {
  const { player, statistics } = item;

  if (!statistics?.length) return null;

  // Must have statistics specifically for the Premier League
  const plStats = statistics.find(s => s.league?.id === LEAGUE_ID);
  if (!plStats) return null;

  const rating = plStats.games?.rating != null
    ? parseFloat(plStats.games.rating)
    : null;

  // Skip players with no performance rating
  if (rating === null || isNaN(rating)) return null;

  // Height: "180 cm" → 180 (keep only digits)
  const height = player.height
    ? parseInt(player.height.replace(/\D/g, ''), 10)
    : null;

  return {
    name:        player.name,
    photo:       player.photo,
    position:    plStats.games?.position ?? null,
    age:         player.age,
    citizenship: player.nationality,
    height,
    club:        plStats.team?.name ?? null,
    form:        rating,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!API_KEY || API_KEY === 'your_api_key_here') {
    throw new Error(
      'API_FOOTBALL_KEY is not set or still has the placeholder value.\n' +
      'Edit .env and replace "your_api_key_here" with your real API-Football key.'
    );
  }

  // Ensure output directory exists
  if (!existsSync(OUT_DIR)) {
    await mkdir(OUT_DIR, { recursive: true });
    console.log(`Created directory: src/data`);
  }

  const allRaw = [];

  for (const team of TEAMS) {
    console.log(`Fetching players for ${team.name} (id ${team.id}, season ${SEASON})…`);
    const raw = await fetchTeamPlayers(team.id, team.name);
    console.log(`  → ${raw.length} player records received`);
    allRaw.push(...raw);

    // Delay between teams (skip after the last one)
    if (team !== TEAMS[TEAMS.length - 1]) await sleep(DELAY_MS);
  }

  console.log(`\nTotal player records fetched: ${allRaw.length}`);

  // Map and filter
  const mapped = allRaw
    .map(mapPlayer)
    .filter(Boolean);

  // Deduplicate by name (keep first occurrence)
  const seen = new Set();
  const unique = mapped.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });

  console.log(`Players with Premier League ratings: ${mapped.length}`);
  console.log(`After removing duplicates:           ${unique.length}`);

  await writeFile(OUT_FILE, JSON.stringify(unique, null, 2), 'utf8');
  console.log(`\n✓ Saved ${unique.length} players to src/data/players.json`);
}

main().catch(err => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
