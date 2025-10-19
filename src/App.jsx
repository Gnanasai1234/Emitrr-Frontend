import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import config from './config';
import GameBoard from './Components/GameBoard';
import Leaderboard from './Components/Leaderboard';
import PlayerStats from './Components/PlayerStats';
import './styles/App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [gameState, setGameState] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // login, game, leaderboard, stats
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(config.SOCKET_URL);
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('gameStarted', (data) => {
      setGameState({
        gameId: data.gameId,
        opponent: data.opponent,
        isPlayer1: data.isPlayer1,
        currentPlayer: data.currentPlayer,
        board: Array(6).fill(null).map(() => Array(7).fill(null)),
        gameOver: false,
        winner: null,
        isDraw: false
      });
      setCurrentView('game');
    });

    newSocket.on('moveMade', (data) => {
      setGameState(prev => ({
        ...prev,
        board: data.board,
        currentPlayer: data.currentPlayer,
        gameOver: data.gameOver,
        winner: data.winner,
        isDraw: data.isDraw
      }));
    });

    newSocket.on('playerDisconnected', (data) => {
      setGameState(prev => ({
        ...prev,
        gameOver: true,
        winner: data.winner, // numeric 1 or 2
        isDraw: false,
        opponent: data.winnerName === prev?.opponent ? prev.opponent : prev?.opponent
      }));
    });

    newSocket.on('gameReconnected', (data) => {
      setGameState({
        gameId: data.gameId,
        opponent: data.player2,
        isPlayer1: data.player1 === username,
        currentPlayer: data.currentPlayer,
        board: data.board,
        gameOver: false,
        winner: null,
        isDraw: false
      });
      setCurrentView('game');
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    // Attempt automatic reconnect to game if username and we have a game in memory
    newSocket.on('connect', () => {
      if (username && gameState?.gameId) {
        newSocket.emit('reconnect', { username });
      }
    });

    return () => {
      newSocket.close();
    };
  }, [username]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit('joinGame', { username: username.trim() });
      setError('');
    } else {
      setError('Please enter a username');
    }
  };

  const handleMakeMove = (column) => {
    console.log('handleMakeMove called with column:', column);
    console.log('gameState:', gameState);
    console.log('socket:', socket);
    
    if (gameState && !gameState.gameOver && socket) {
      console.log('Emitting makeMove event');
      socket.emit('makeMove', {
        gameId: gameState.gameId,
        column: column
      });
    } else {
      console.log('Cannot make move - conditions not met');
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/leaderboard`);
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        setCurrentView('leaderboard');
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const loadPlayerStats = async () => {
    if (!username) return;
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/leaderboard/player/${username}`);
      const data = await response.json();
      if (data.success) {
        setPlayerStats(data.player);
        setCurrentView('stats');
      }
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  const resetGame = () => {
    setGameState(null);
    setCurrentView('login');
    setError('');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return (
          <div className="login-container">
            <h1>Connect Four</h1>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
              />
              <button type="submit">Join Game</button>
            </form>
            {error && <div className="error">{error}</div>}
            <div className="menu-buttons">
              <button onClick={loadLeaderboard}>View Leaderboard</button>
            </div>
          </div>
        );

      case 'game':
        return (
          <div className="game-container">
            <GameBoard
              gameState={gameState}
              username={username}
              onMakeMove={handleMakeMove}
              onReset={resetGame}
            />
          </div>
        );

      case 'leaderboard':
        return (
          <div className="leaderboard-container">
            <Leaderboard leaderboard={leaderboard} />
            <button onClick={() => setCurrentView('login')}>Back to Menu</button>
          </div>
        );

      case 'stats':
        return (
          <div className="stats-container">
            <PlayerStats stats={playerStats} username={username} />
            <button onClick={() => setCurrentView('login')}>Back to Menu</button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      {renderContent()}
    </div>
  );
}

export default App;
