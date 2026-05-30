/*
    sat-solver.js
    ----------------
    Implements a SAT solver to solve Sudoku
puzzles by encoding them into CNF clauses.
    The main entry point is the `solve()`
method, which applies:
    - Unit propagation
    - Watched literals optimization
    - Conflict detection and backtracking
    - Variable selection using scoring heuristics
    - Stack-based decision tracking
    Results are stored in `results` and
mapped back to the Sudoku board.
*/

import {CNF} from './cnf.js';
import {ResultsRecorder} from './results-recorder.js';

const cnf = new CNF();

class Solver {
    #recorder;
    #scores;
    #stack;
    
    constructor() {
        this.#recorder = new ResultsRecorder();
        ({results: this.results, board: this.board} = this.#recorder);
        this.#scores = new Array(9**3+1).fill(0);
        this.#stack = [];
    }

    // Solves the grid (main body)
    solve(board) {
        this.board.length = 0;
        this.board.push(...board.map(cols => [...cols]));
        this.#recorder.updateResults();
        
        while (true) {
            this.#unitPropagation();
            
            const ok = this.#handleConflicts();
            if (!ok) return false;
            
            const varId = this.#chooseVariable();
            if (!varId) {
                this.#recorder.updateBoard();
                this.#stack = [];
                return true;
            }
            
            // First guess
            this.#recorder.setLiteral(varId);
            this.#stack.push({varId, guess:true, implied:[]});
        }
    }
    
    // Scans CNF to collcet useful data (undefined literal of unit clauses, undefined clauses and conflicted clauses).
    #analyze() {
        const collections = {
            units: [],
            undefineds: [],
            conflicts: []
        };
        
        for (let i = 0; i < cnf.length; i++) {
            let satisfied = false;
            const clause = cnf[i];
            const watched = cnf.watched[i];
            
            // Quick satisfy check 
            for (const j of watched)
                if (this.#recorder.value(clause[j])) {
                    satisfied = true;
                    break;
                }
            if (satisfied) continue;
            
            this.#updateWatched(i, collections);
        }
        
        return collections;
    }
    
    // Updates watched indices.
    #updateWatched(index, collections) {
        const moved = [false, false];
        const clause = cnf[index];
        const watched = cnf.watched[index];
        const undefinedLits = [];
        
        for (let i = 0; i < clause.length; i++) {
            if (moved[0] && moved[1]) break;
            
            const lit = clause[i];
            const value = this.#recorder.value(lit);
            
            // Give priority to "true" and the first index, then to "undefined".
            if (value && !moved[0]) {
                watched[0] = i;
                moved[0] = true;
            }
            else if (value && !moved[1]) {
                watched[1] = i;
                moved[1] = true;
            }
            else if (value === undefined && moved[0] === false) {
                watched[0] = i;
                moved[0] = undefined;
            }
            else if (value === undefined && moved[1] === false) {
                watched[1] = i;
                moved[1] = undefined;
            }
            
            // Collect undefined values whether it's unsat.
            if (value === undefined && !moved[0]) undefinedLits.push(lit);
        }
        
        // Categorize and store in collections.
        if (moved[0]) return;
        else if (!undefinedLits.length)
            collections.conflicts.push(clause);
        else if (undefinedLits.length == 1)
            collections.units.push(undefinedLits[0]);
        else collections.undefineds.push(...undefinedLits);
    }
    
    // Satisfies unit clauses til finished.
    #unitPropagation() {
        let units = this.#analyze().units;
        while (units.length) {
            for (const u of units) this.#recorder.setLiteral(u);
            // Memorize set literals.
            if (this.#stack.length)
                this.#stack[this.#stack.length-1].implied.push(...units);
            
            units = this.#analyze().units;
        }
    }
    
    // Solves conflicts by flipping the guess and backtrack.
    #handleConflicts() {
        let conflicts = this.#analyze().conflicts;
        while (conflicts.length) {
            if (!this.#stack.length) return false;
            this.#increaseScores(conflicts);
            
            // Extract the last guess and its consequences (implied), reset "implied" based on the last changes.
            const top = this.#stack.pop();
            if (top.implied)
                for (let lit of top.implied)
                    this.#recorder.unsetLiteral(lit);
            if (top.guess) {
                // FLIP
                this.#recorder.setLiteral(-top.varId);
                top.guess = false;
                this.#stack.push(top);
                this.#unitPropagation();
            } else {
                // BACKTRACK!
                this.#recorder.unsetLiteral(top.varId)
                
                continue;
            }
            
            conflicts = this.#analyze().conflicts;
        }
        this.#decreaseScores(0.95);
        
        return true;
    }
    
    // Chooses an undefined variable with the highest score.
    #chooseVariable() {
        const undefineds = this.#analyze().undefineds;
        let best, bestScore = -Infinity;
        
        for (const lit of undefineds) {
            const id = Math.abs(lit);
            if (this.#scores[id] > bestScore) {
                best = id;
                bestScore = this.#scores[id];
            }
        }
        
        return best;
    }
    
    // Increases the score of conflicted clauses to prioritize variables involved in conflicts.
    #increaseScores(conflicts, point=1) {
        for (const clause of conflicts) {
            for (const lit of clause) {
                const id = Math.abs(lit);
                this.#scores[id] += point;
            }
        }
        
        return this.#scores;
    }
    // Decreases scores to avoid wasting time on less important variables and to forget former important ones.
    #decreaseScores(decay) {
        // this.#scores = this.#scores.map(score => score *= decay);
        for (let score of this.#scores) score *= decay;
        
        return this.#scores;
    }
}

export {Solver};
