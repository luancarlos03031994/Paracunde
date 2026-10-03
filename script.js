const BOARD_CELLS = 40;
const PLAYER_NAMES = ['Vermelho', 'Azul', 'Verde', 'Amarelo'];
const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'];
const SAFE_CELLS = [5, 12, 19, 26, 33];
const START_OFFSETS = [0, 10, 20, 30];

class ParacundeGame {
  constructor() {
    this.players = PLAYER_COLORS.map((color, index) => ({
      id: index,
      name: PLAYER_NAMES[index],
      color,
      start: START_OFFSETS[index],
      pieces: [0, 0, 0, 0],
      winner: false
    }));

    this.currentPlayerIndex = 0;
    this.diceValue = null;
    this.log = ['Jogo iniciado. O Vermelho começa.'];
    this.gameOver = false;
    this.winner = null;
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getValidMovesForPlayer(playerIndex) {
    const player = this.players[playerIndex];
    const moves = [];

    if (this.diceValue === null) return moves;

    player.pieces.forEach((progress, pieceIndex) => {
      const valid = this.isMoveValid(playerIndex, pieceIndex, this.diceValue);
      if (valid) {
        moves.push(pieceIndex);
      }
    });

    return moves;
  }

  isMoveValid(playerIndex, pieceIndex, roll) {
    const player = this.players[playerIndex];
    const progress = player.pieces[pieceIndex];

    if (progress === 0) {
      return roll === 6;
    }

    if (progress >= 40) {
      return false;
    }

    return progress + roll <= 40;
  }

  rollDice() {
    if (this.gameOver || this.diceValue !== null) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    this.diceValue = dice;
    this.log.unshift(`${this.currentPlayer.name} rolou ${dice}.`);

    const validMoves = this.getValidMovesForPlayer(this.currentPlayerIndex);
    if (validMoves.length === 0) {
      this.log.unshift(`${this.currentPlayer.name} não tem jogadas válidas e perde a vez.`);
      this.finishTurn();
      return;
    }

    this.render();
  }

  movePiece(pieceIndex) {
    if (this.gameOver || this.diceValue === null) return;

    const playerIndex = this.currentPlayerIndex;
    const player = this.players[playerIndex];

    if (!this.isMoveValid(playerIndex, pieceIndex, this.diceValue)) {
      return;
    }

    const previousProgress = player.pieces[pieceIndex];
    const nextProgress = previousProgress === 0 ? 1 : previousProgress + this.diceValue;

    player.pieces[pieceIndex] = nextProgress;

    const previousCell = this.getCellForProgress(playerIndex, previousProgress);
    const nextCell = this.getCellForProgress(playerIndex, nextProgress);

    if (previousCell !== null && nextCell !== null) {
      this.log.unshift(`${player.name} moveu a peça ${pieceIndex + 1} para a casa ${nextCell + 1}.`);
    } else {
      this.log.unshift(`${player.name} colocou a peça ${pieceIndex + 1} em jogo.`);
    }

    this.captureOpponentIfNeeded(playerIndex, nextCell);

    if (nextProgress >= 40) {
      this.log.unshift(`${player.name} concluiu uma peça!`);
    }

    const winner = this.checkWinner();
    if (winner) {
      this.gameOver = true;
      this.winner = winner;
      this.log.unshift(`${winner.name} venceu o jogo!`);
      this.diceValue = null;
      this.render();
      return;
    }

    if (this.diceValue === 6) {
      this.log.unshift(`${player.name} tirou 6 e joga novamente.`);
      this.diceValue = null;
      this.render();
      return;
    }

    this.finishTurn();
  }

  captureOpponentIfNeeded(playerIndex, targetCell) {
    if (targetCell === null || SAFE_CELLS.includes(targetCell)) {
      return;
    }

    this.players.forEach((otherPlayer, otherIndex) => {
      if (otherIndex === playerIndex) return;

      otherPlayer.pieces.forEach((progress, pieceIndex) => {
        if (progress <= 0 || progress >= 40) return;

        const opponentCell = this.getCellForProgress(otherIndex, progress);
        if (opponentCell === targetCell) {
          otherPlayer.pieces[pieceIndex] = 0;
          this.log.unshift(`${this.currentPlayer.name} capturou ${otherPlayer.name}!`);
        }
      });
    });
  }

  getCellForProgress(playerIndex, progress) {
    const player = this.players[playerIndex];

    if (progress <= 0) {
      return null;
    }

    if (progress >= 40) {
      return null;
    }

    return (player.start + progress - 1) % BOARD_CELLS;
  }

  checkWinner() {
    for (const player of this.players) {
      const allFinished = player.pieces.every((piece) => piece >= 40);
      if (allFinished) {
        return player;
      }
    }
    return null;
  }

  finishTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.diceValue = null;
    this.render();
  }

  render() {
    const app = document.getElementById('app');
    if (!app) return;

    const statusText = this.gameOver
      ? `Fim de jogo — ${this.winner.name} venceu!`
      : `${this.currentPlayer.name} está jogando`;

    app.innerHTML = `
      <div class="game-shell">
        <header>
          <h1>🎲 Paracundê</h1>
          <div class="status-pill">${statusText}</div>
        </header>

        <div class="board-panel">
          <div class="board-wrap">
            <div class="board" id="board"></div>
          </div>

          <aside class="side-panel">
            <div class="card turn-box">
              <h2>Jogadores</h2>
              <div id="players"></div>
              <div class="dice-display" id="dice">${this.diceValue ?? '-'}</div>
            </div>

            <div class="card controls">
              <button id="rollBtn" ${this.gameOver || this.diceValue !== null ? 'disabled' : ''}>Rolar dado</button>
            </div>

            <div class="card">
              <h2>Mensagens</h2>
              <ul class="log" id="log"></ul>
            </div>
          </aside>
        </div>
      </div>
    `;

    document.getElementById('rollBtn').addEventListener('click', () => this.rollDice());

    this.renderBoard();
    this.renderPlayers();
    this.renderLog();
  }

  renderBoard() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;

    boardEl.innerHTML = '';

    for (let cellIndex = 0; cellIndex < BOARD_CELLS; cellIndex++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      if (SAFE_CELLS.includes(cellIndex)) {
        cell.classList.add('safe');
      }

      const tokens = [];
      this.players.forEach((player, playerIndex) => {
        player.pieces.forEach((progress, pieceIndex) => {
          if (progress <= 0 || progress >= 40) return;

          const boardPos = this.getCellForProgress(playerIndex, progress);
          if (boardPos === cellIndex) {
            tokens.push({ player, pieceIndex });
          }
        });
      });

      tokens.forEach(({ player, pieceIndex }) => {
        const token = document.createElement('div');
        token.className = `token ${player.color}`;
        token.title = `${player.name} — Peça ${pieceIndex + 1}`;
        cell.appendChild(token);
      });

      if (tokens.length > 1) {
        const count = document.createElement('div');
        count.className = 'count';
        count.textContent = String(tokens.length);
        cell.appendChild(count);
      }

      boardEl.appendChild(cell);
    }
  }

  renderPlayers() {
    const playersEl = document.getElementById('players');
    if (!playersEl) return;

    playersEl.innerHTML = '';

    this.players.forEach((player, index) => {
      const row = document.createElement('div');
      row.className = `player-row ${index === this.currentPlayerIndex ? 'active' : ''}`;

      const meta = document.createElement('div');
      meta.className = 'player-meta';

      const dot = document.createElement('span');
      dot.className = `player-dot ${player.color}`;

      const name = document.createElement('span');
      name.textContent = player.name;

      meta.appendChild(dot);
      meta.appendChild(name);

      const status = document.createElement('div');
      status.textContent = `${player.pieces.filter((p) => p >= 40).length}/4 concluídas`;

      row.appendChild(meta);
      row.appendChild(status);

      const validMoves = this.getValidMovesForPlayer(index);
      if (this.diceValue !== null && validMoves.length > 0 && !this.gameOver && index === this.currentPlayerIndex) {
        const moveList = document.createElement('div');
        moveList.style.marginTop = '8px';
        moveList.style.display = 'flex';
        moveList.style.flexWrap = 'wrap';
        moveList.style.gap = '6px';

        validMoves.forEach((pieceIndex) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = `Mover peça ${pieceIndex + 1}`;
          btn.style.padding = '8px 10px';
          btn.style.fontSize = '0.8rem';
          btn.style.flex = '1 1 48%';
          btn.addEventListener('click', () => this.movePiece(pieceIndex));
          moveList.appendChild(btn);
        });

        row.appendChild(moveList);
      }

      playersEl.appendChild(row);
    });
  }

  renderLog() {
    const logEl = document.getElementById('log');
    if (!logEl) return;

    logEl.innerHTML = '';
    this.log.slice(0, 10).forEach((message) => {
      const item = document.createElement('li');
      item.textContent = message;
      logEl.appendChild(item);
    });
  }
}

function initGame() {
  const app = document.getElementById('app');
  if (!app) return;

  const game = new ParacundeGame();
  window.paracundeGame = game;
  game.render();
}

document.addEventListener('DOMContentLoaded', initGame);
