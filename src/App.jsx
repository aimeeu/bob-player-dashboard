import React, { useState } from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  Button,
  SkipToContent,
} from '@carbon/react';
import PlayerSelect from './components/PlayerSelect/PlayerSelect.tsx';
import PlayerCard from './components/PlayerCard/PlayerCard.tsx';
import PlayerSummary from './components/PlayerSummary/PlayerSummary.tsx';
import FormationBoard from './components/FormationBoard/FormationBoard.tsx';
import { generateRandomTeam } from './utils/teamGenerator.ts';
import playersData from './data/players.json';
import './App.scss';

function App() {
  const [currentPage, setCurrentPage] = useState('browser');
  const [selectedName, setSelectedName] = useState('');
  const [teamPlayers, setTeamPlayers] = useState([]);

  const selectedPlayer = playersData.find((p) => p.name === selectedName) ?? null;

  function navigate(e, page) {
    e.preventDefault();
    setCurrentPage(page);
  }

  function handleGenerateTeam() {
    setTeamPlayers(generateRandomTeam(playersData));
  }

  return (
    <>
      <Header aria-label="Player Dashboard">
        <SkipToContent />
        <HeaderName href="#" prefix="">
          Player Dashboard
        </HeaderName>
        <HeaderNavigation aria-label="Main navigation">
          <HeaderMenuItem
            href="#"
            isActive={currentPage === 'browser'}
            onClick={(e) => navigate(e, 'browser')}
          >
            Player Browser
          </HeaderMenuItem>
          <HeaderMenuItem
            href="#"
            isActive={currentPage === 'formation'}
            onClick={(e) => navigate(e, 'formation')}
          >
            Team Formation
          </HeaderMenuItem>
        </HeaderNavigation>
      </Header>

      <main className="app__main">
        {currentPage === 'browser' && (
          <div className="app__page">
            <h2 className="app__page-heading">Player Browser</h2>
            <div className="app__selector">
              <PlayerSelect
                players={playersData}
                selectedName={selectedName}
                onChange={setSelectedName}
              />
            </div>
            {selectedPlayer && <PlayerCard player={selectedPlayer} />}
            {selectedPlayer && <PlayerSummary player={selectedPlayer} />}
          </div>
        )}

        {currentPage === 'formation' && (
          <div className="app__page app__page--formation">
            <h2 className="app__page-heading">Team Formation Visualizer</h2>
            <div className="app__formation-controls">
              <Button onClick={handleGenerateTeam} size="md">
                Generate Random Team
              </Button>
            </div>
            <div className="app__formation-wrap">
              <FormationBoard players={teamPlayers} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default App;
