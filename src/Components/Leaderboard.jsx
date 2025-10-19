import React from 'react';

const Leaderboard = ({ leaderboard }) => {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="leaderboard">
        <h2>Leaderboard</h2>
        <p>No games played yet!</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2>🏆 Leaderboard</h2>
      <div className="leaderboard-table">
        <div className="leaderboard-header">
          <div>Rank</div>
          <div>Player</div>
          <div>Wins</div>
          <div>Losses</div>
          <div>Draws</div>
          <div>Total</div>
          <div>Win %</div>
        </div>
        {leaderboard.map((player, index) => (
          <div key={player.username} className="leaderboard-row">
            <div className="rank">#{index + 1}</div>
            <div className="username">{player.username}</div>
            <div className="wins">{player.wins}</div>
            <div className="losses">{player.losses}</div>
            <div className="draws">{player.draws}</div>
            <div className="total">{player.total_games}</div>
            <div className="percentage">{player.win_percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
