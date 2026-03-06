import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { getStats, isTutorialDone } from './src/game/storage';
import { MenuScreen } from './src/screens/MenuScreen';
import { GameScreen } from './src/screens/GameScreen';

type Screen = 'menu' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [highScore, setHighScore] = useState(0);
  const [tutorialDone, setTutorialDone] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getStats(), isTutorialDone()]).then(([stats, done]) => {
      setHighScore(stats.highScore);
      setTutorialDone(done);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="light" />
      {screen === 'menu' && (
        <MenuScreen onPlay={() => setScreen('game')} />
      )}
      {screen === 'game' && (
        <GameScreen
          highScore={highScore}
          onHighScoreChange={setHighScore}
          onBackToMenu={() => setScreen('menu')}
          skipTutorial={tutorialDone}
        />
      )}
    </>
  );
}
