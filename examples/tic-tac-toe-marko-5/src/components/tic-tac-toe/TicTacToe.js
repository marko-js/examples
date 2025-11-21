'use strict';

const EventEmitter = require('events');

function getRandomInt(max) {
  const min = 0;
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

class TicTacToe extends EventEmitter {
  constructor() {
    super();
    this.newGame();
  }

  newGame() {
    this.state = {
      currentPlayer: 'X',
      moveCount: 0,
      winningPlayer: null,
      gameOver: false,
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ]
    };

    this.emit('change');
  }

  makeMove(player, row, col) {
    const currentPlayer = this.state.currentPlayer;

    if (this.isGameOver) {
      // Don't allow any moves if the game is over
      return false;
    }

    if (currentPlayer !== player) {
      // Don't allow the wrong player to make a move
      return false;
    }

    if (this.board[row][col] != null) {
      // Don't allow the move if the cell is already occupied
      return false;
    }

    this.board[row][col] = currentPlayer;

    const isWinner = this.checkWinner();

    this.state.moveCount++;

    if (isWinner) {
      this.state.winningPlayer = currentPlayer;
      this.state.gameOver = true;
    } else if (this.state.moveCount === 9) {
      this.state.gameOver = true;
    }

    this.state.currentPlayer = this.state.currentPlayer === 'X' ? 'O' : 'X';

    this.emit('change');

    return true;
  }

  computerMakeMove(player) {
    const emptyCells = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = this.board[row][col];
        if (!cell) {
          emptyCells.push({
            row,
            col
          });
        }
      }
    }

    const choice = emptyCells[getRandomInt(emptyCells.length)];
    this.makeMove(player, choice.row, choice.col);
  }

  checkLine(row, col, rowDelta, colDelta) {
    const player = this.currentPlayer;
    let board = this.board;

    for (let i = 0; i < 3; i++) {
      if (board[row][col] !== player) {
        return false;
      }
      col += colDelta;
      row += rowDelta;
    }

    return true;
  }

  checkWinner() {
    // Check the rows
    for (let row = 0; row < 3; row++) {
      if (this.checkLine(row, 0, 0, 1)) {
        return true;
      }
    }

    // Check the columns
    for (let col = 0; col < 3; col++) {
      if (this.checkLine(0, col, 1, 0)) {
        return true;
      }
    }

    return this.checkLine(0, 0, 1, 1) || // Check the diagonal
      this.checkLine(0, 2, 1, -1); // Check the anti diagonal
  }

  get board() {
    return this.state.board;
  }

  get isGameOver() {
    return this.state.gameOver === true;
  }

  get winningPlayer() {
    return this.state.winningPlayer;
  }

  get currentPlayer() {
    return this.state.currentPlayer;
  }

  toString() {
    const lines = [];
    this.board.forEach((row) => {
      lines.push(row.map((player) => {
        return player ? player : ' ';
      }).join(' | '));
    });

    return lines.join('\n-------------\n');
  }
}

module.exports = TicTacToe;
