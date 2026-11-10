# Tic-Tac-Toe

A game of tic-tac-toe against the computer, built with Marko and [@marko/run](https://github.com/marko-js/run).

```
npm init marko -- --template tic-tac-toe
cd marko-app
npm install
npm run dev
```

The game lives in [`src/tags/tic-tac-toe`](./src/tags/tic-tac-toe/index.marko):

- The board is the only state (a `<let>`). Whose turn it is, the winner and whether the game is over are all derived from it with `<const>`.
- The computer's move is a `<script>` that reruns whenever the board changes, and uses `$signal` to cancel a pending move when a new game starts.
- The rules in [`game.ts`](./src/tags/tic-tac-toe/game.ts) are plain functions with no UI.
