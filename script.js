const BOARD_SIZE = 40;
const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'];
const PLAYER_NAMES = ['Vermelho', 'Azul', 'Verde', 'Amarelo'];

class ParacundeGame {
  constructor() {
    this.players = PLAYER_COLORS.map((color, index) => ({
      id: index,
      name: PLAYER_NAMES[index],
      color,
      pieces: [0, 0, 0, 0],
      active: index === 0,
      finished: false
    }));

    this.currentPlayerIndex = 0;
    this.diceValue = null;
    this.selectedPiece = null;
    this.log = ['Jogo iniciado. O Vermelho começa.'];
    this.gameOver = false;
    this.winner = null;
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  rollDice() {
    if (this.gameOver || this.diceValue !== null) return;

    this.diceValue = Math.floor(Math.random() * 6) + 1;
    this.log.unshift(`${this.currentPlayer.name} rolou ${this.diceValue}.`);
    this.selectedPiece = null;
    this.render();
  }

  getMovablePieces() {
    const pieces = [];

    this.currentPlayer.pieces.forEach((position, index) => {
      if (position === 0 && this.diceValue === 6) {
        pieces.push(index);
        return;
      }

      if (position > 0 && position + this.diceValue <= 45) {
        pieces.push(index);
      }
    });

    return pieces;
  }

  movePiece(pieceIndex) {
    if (this.gameOver || this.diceValue === null) return;

    const player = this.currentPlayer;
    const currentPosition = player.pieces[pieceIndex];
    let nextPosition;

    if (currentPosition === 0 && this.diceValue === 6) {
      nextPosition = 1 + player.id * 0;
    } else if (currentPosition > 0) {
      nextPosition = currentPosition + this.diceValue;
    } else {
      return;
    }

    const valid = this.isValidMovement(player.id, pieceIndex, currentPosition, nextPosition);
    if (!valid) return;

    player.pieces[pieceIndex] = nextPosition;
    this.captureIfNeeded(player.id, pieceIndex, nextPosition);

    this.log.unshift(`${player.name} moveu a peça ${pieceIndex + 1}.`);

    if (nextPosition >= 45) {
      this.log.unshift(`${player.name} concluiu a peça ${pieceIndex + 1}!`);
    }

    const allFinished = this.players.every((p) => p.pieces.every((pos) => pos >= 45));
    if (allFinished) {
      this.gameOver = true;
      this.winner = this.currentPlayer;
      this.log.unshift(`${this.currentPlayer.name} venceu!`);
      this.diceValue = null;
      this.render();
      return;
    }

    if (this.diceValue !== 6) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      this.currentPlayer.active = true;
    }

    this.diceValue = null;
    this.selectedPiece = null;
    this.render();
  }

  isValidMovement(playerId, pieceIndex, currentPosition, nextPosition) {
    const player = this.players[playerId];
    if (currentPosition === 0 && this.diceValue !== 6) return false;
    if (nextPosition > 45) return false;

    if (nextPosition === 45) {
      return true;
    }

    return true;
  }

  captureIfNeeded(playerId, pieceIndex, nextPosition) {
    if (nextPosition <= 40) {
      const targetBoardIndex = this.getBoardIndex(playerId, nextPosition);

      this.players.forEach((otherPlayer, otherIndex) => {
        if (otherIndex === playerId) return;

        otherPlayer.pieces.forEach((otherPosition, otherPieceIndex) => {
          if (otherPosition <= 0) return;
          if (otherPosition > 40) return;

          const otherBoardIndex = this.getBoardIndex(otherIndex, otherPosition);
          if (otherBoardIndex === targetBoardIndex && this.isBoardCellOccupiedByOpponent(playerId, otherIndex)) {
            otherPlayer.pieces[otherPieceIndex] = 0;
            this.log.unshift(`${this.currentPlayer.name} capturou ${otherPlayer.name}!`);
          }
        });
      });
    }
  }

  isBoardCellOccupiedByOpponent(playerId, otherIndex) {
    return true;
  }

  getBoardIndex(playerId, piecePosition) {
    const startOffset = playerId * 10;

    if (piecePosition <= 0) return -1;
    if (piecePosition > 40) return -1;

    return (startOffset + piecePosition - 1) % BOARD_SIZE;
  }

  render() {
    if (typeof window === 'undefined') return;
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
              <button id="nextBtn" class="secondary" ${this.gameOver ? 'disabled' : ''}>Próximo</button>
            </div>

            <div class="card">
              <h2>Histórico</h2>
              <ul class="log" id="log"></ul>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.renderBoard();
    this.renderPlayers();
    this.renderLog();

    document.getElementById('rollBtn').addEventListener('click', () => this.rollDice());
    document.getElementById('nextBtn').addEventListener('click', () => {
      if (!this.gameOver) {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.diceValue = null;
        this.render();
      }
    });
  }

  renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    for (let i = 0; i < BOARD_SIZE; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = String(i);

      if (i % 10 === 0) cell.classList.add('home');
      if ([5, 12, 19, 26, 33].includes(i)) cell.classList.add('safe');
      if ([9, 19, 29, 39].includes(i)) cell.classList.add('goal');

      const pieceGroups = [];
      this.players.forEach((player, playerIndex) => {
        player.pieces.forEach((piecePosition, pieceIndex) => {
          if (piecePosition > 0 && piecePosition <= 40) {
            const boardIndex = this.getBoardIndex(playerIndex, piecePosition);
            if (boardIndex === i) {
              pieceGroups.push({ player, pieceIndex });
            }
          }
        });
      });

      pieceGroups.forEach(({ player, pieceIndex }) => {
        const token = document.createElement('div');
        token.className = `token ${player.color}`;
        token.title = `${player.name} — peça ${pieceIndex + 1}`;
        cell.appendChild(token);
      });

      if (pieceGroups.length > 1) {
        const count = document.createElement('div');
        count.className = 'count';
        count.textContent = String(pieceGroups.length);
        cell.appendChild(count);
      }

      cell.addEventListener('click', () => {
        if (this.diceValue === null || this.gameOver) return;

        const movable = this.getMovablePieces();
        if (movable.length === 0) {
          this.log.unshift('Sem peças válidas para esse valor.');
          this.render();
          return;
        }

        const playerIndex = this.currentPlayerIndex;
        const clickedCellIndex = Number(cell.dataset.index);

        for (let pieceIndex = 0; pieceIndex < 4; pieceIndex++) {
          const pos = this.players[playerIndex].pieces[pieceIndex];
          if (pos <= 0) continue;

          const boardIndex = this.getBoardIndex(playerIndex, pos);
          if (boardIndex === clickedCellIndex) {
            this.movePiece(pieceIndex);
            return;
          }
        }

        if (this.players[playerIndex].pieces.every((p) => p === 0)) {
          this.movePiece(0);
        }
      });

      boardEl.appendChild(cell);
    }
  }

  renderPlayers() {
    const playersEl = document.getElementById('players');
    playersEl.innerHTML = '';

    this.players.forEach((player, index) => {
      const row = document.createElement('div');
      row.className = `player-row ${index === this.currentPlayerIndex ? 'active' : ''}`;

      row.innerHTML = `
        <div class="player-meta">
          <span class="player-dot ${player.color}"></span>
          <span>${player.name}</span>
        </div>
        <div>${player.pieces.filter((p) => p > 0).length}/4</div>
      `;

      playersEl.appendChild(row);
    });
  }

  renderLog() {
    const logEl = document.getElementById('log');
    logEl.innerHTML = '';

    this.log.slice(0, 12).forEach((entry) => {
      const item = document.createElement('li');
      item.textContent = entry;
      logEl.appendChild(item);
    });
  }
}

function initParacundeGame() {
  const app = document.getElementById('app');
  if (!app) return;

  const game = new ParacundeGame();
  game.render();
  window.paracundeGame = game;
}

document.addEventListener('DOMContentLoaded', initParacundeGame);
