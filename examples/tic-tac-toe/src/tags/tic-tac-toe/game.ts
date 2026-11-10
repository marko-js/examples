export type Player = "X" | "O";
export type Board = readonly (Player | null)[];

export const emptyBoard: Board = Array(9).fill(null);

const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function getWinner(board: Board) {
  for (const [a, b, c] of lines) {
    const player = board[a];
    if (player && player === board[b] && player === board[c]) {
      return player;
    }
  }

  return null;
}

export function getRandomEmptyCell(board: Board) {
  const emptyCells: number[] = [];
  board.forEach((player, cell) => {
    if (!player) emptyCells.push(cell);
  });

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}
