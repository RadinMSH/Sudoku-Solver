/*
    results-recorder.js
    ----------------------
    Creates a table of results to store the
value of variables. Each number in each cell
is a variable. 9 numbers, 9x9 cells; since
their IDs start at 001, the index '0' in the
results array will be left undefined.
    It also creates a board, which is an
array of Sudoku rows (array rows) that
stores the Sudoku numbers inside.
    It can update the board and results;
set, unset, and get the values of literals.
*/

class ResultsRecorder {
    constructor() {
        this.results = new Array(9**3+1).fill(undefined);
        this.board = Array.from({length:9}, () => new Array(9).fill(0));
    }
    
    // Update results based on board.
    updateResults() {
        this.results.fill(undefined);
        
        this.board.forEach((row, i) => {
            row.forEach((n, j) => {
                if (n) {
                    for (let m = 1; m <= 9; m++) {
                        if (m == n) this.results[81*i + 9*j + m] = true;
                        else this.results[81*i + 9*j + m] = false;
                    }
                }
            });
        });
    }
    // Update board based on results.
    updateBoard() {
        for (const row of this.board) row.fill(0);
        
        this.board.forEach((row,i) => {
            row.forEach((n,j) => {
                const varId = 81*i + 9*j;
                const numbers = this.results.slice(varId+1, varId+10);
                const index = numbers.indexOf(true);
                
                this.board[i][j] = index + 1;
            });
        });
    }
    
    // Get, set, and unset literal values.
    value(lit) {
        const vid = Math.abs(lit);
        const sign = lit > 0;
        
        if (this.results[vid] === undefined) return undefined;
        return this.results[vid] === sign;
    }
    setLiteral(lit) {
        const vid = Math.abs(lit);
        const sign = lit > 0;
        this.results[vid] = sign;
    }
    unsetLiteral(lit) {
        const vid = Math.abs(lit);
        this.results[vid] = undefined;
    }
}

export {ResultsRecorder};