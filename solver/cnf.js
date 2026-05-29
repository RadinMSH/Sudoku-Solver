/*
    cnf.js
    ---------
    Rewrites Sudoku rules and constraints
in the form of CNF (Conjunctive Normal Form) logical statements.
*/

class CNF extends Array {
    constructor() {
        super();
        
        this.#singleValuePerCell();
        this.#row_column_uniqueness();
        this.#blockUniqueness();
        
        this.watched = this.#watch();
    }
    
    id(r,c,n) {
        return 81*r + 9*c + n;
    }
    
    // Init watched
    #watch() {
        const watched = [];
        for (let clause of this)
            watched.push([0,1]);
        
        return watched;
    }
    
    // Sudoku rules
    #singleValuePerCell() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const clause = [];
                for (let n = 1; n <= 9; n++) {
                    // at-least one
                    clause.push(this.id(r, c, n));
                    
                    // at-most one
                    for (let n2 = n+1; n2 <= 9; n2++) {
                        this.push([
                            - this.id(r, c, n),
                            - this.id(r, c, n2)
                        ]);
                    }
                }
                this.push(clause);
            }
        }
    }
    #row_column_uniqueness() {
        for (let i = 0; i < 9; i++) {
            for (let n = 1; n <= 9; n++) {
                const row = [];
                const col = [];
                
                for (let j = 0; j < 9; j++) {
                    // at-least one
                    row.push(this.id(i, j, n));
                    col.push(this.id(j, i, n));
                    
                    // at-most one
                    for (let jj = j+1; jj < 9; jj++) {
                        this.push([
                            - this.id(i, j , n),
                            - this.id(i, jj, n)
                        ]);
                        this.push([
                            - this.id(j , i, n),
                            - this.id(jj, i, n)
                        ]);
                    }
                }
                this.push(row, col);
            }
        }
    }
    #blockUniqueness() {
        for (let R = 0; R < 3; R++) {
            for (let C = 0; C < 3; C++) {
                for (let n = 1; n <= 9; n++) {
                    // at-least one
                    const clause = [];
                    const cells = [];
                    
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 3; c++) {
                            clause.push(this.id(3*R+r, 3*C+c, n));
                            cells.push([3*R+r, 3*C+c]);
                        }
                    }
                    this.push(clause);
                    
                    // at-most one
                    for (let cell1 = 0; cell1 < cells.length; cell1++) {
                        for (let cell2 = cell1+1; cell2 < cells.length; cell2++) {
                            const [r1, c1] = cells[cell1];
                            const [r2, c2] = cells[cell2];
                            
                            this.push([
                                - this.id(r1, c1, n),
                                - this.id(r2, c2, n)
                            ]);
                        }
                    }
                }
            }
        }
    }
}

export {CNF};