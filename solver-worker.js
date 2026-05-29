/*
    solver-worker.js
    -------------------
    Web Worker is used to create a thread to
separate the solver calculations with UI
animations to prevent blocking and make
animations smoother.
*/

import {Solver} from '/solver/sat-solver.js';

// Receives the input data (board) from the main thread.
self.onmessage = e => {
    const solver = new Solver();
    const solved = solver.solve(e.data);
    const board = solver.board;
    
    // Post the solver results to the main thread...
    self.postMessage({
        user_board: e.data,
        solved,
        solved_board: board
    });
};