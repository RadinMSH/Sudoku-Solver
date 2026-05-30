/*
    sudoku.js
    ------------
    Creates a Sudoku grid, enables the
buttons actions, reads the grid, and posts
it to the solver thread created by the web
worker.
*/

const worker = new Worker('src/solver-worker.js', {type:"module"});
const container = document.querySelector("#container");
const buttonsWrapper = document.querySelector("#buttons-wrapper");
const buttons = document.querySelector("#buttons")
const [clear_btn, solver_btn] = buttons.children;
const message = document.querySelector("#message");

// Create Sudoku grid.
const grid = document.createElement("table");
grid.id = "sudoku";
container.appendChild(grid);
for (let i = 0; i < 9; i++) {
    const tr = document.createElement("tr");
    grid.appendChild(tr);
    
    for (let j = 0; j < 9; j++) {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "tel";
        tr.appendChild(td);
        td.appendChild(input);
        
        // Only [1-9]
        input.addEventListener("beforeinput", e => {
            const text = input.value.trim();
            const range = /^[1-9]$/;
            
            if (e.inputType.startsWith("delete")) return;
            if (text.length >= 1 || !range.test(e.data))
                e.preventDefault();
        });
        input.addEventListener("input", e => {
            if (e.inputType.startsWith("delete"))
                input.classList.remove("input");
            else input.className = "input";
        });
    }
}

message.innerHTML = `
    Greetings... It's the Sudoku Solver!
    <br>
    Challenge me by entering your numbers into the grid, and click "Solve" to see my power 🌟
`;

// Clear button action: Empties all cells.
clear_btn.onclick = () => {
    message.innerText = "Let's try again!";
    
    const input = grid.querySelectorAll("input");
    for (const cell of input) {
        cell.value = '';
        cell.classList.remove("input");
    }
};

// Solver button action
solver_btn.onclick = () => {
    message.textContent = "Solving your Sudoku puzzle...";
    
    // Post data to the solver thread...
    const user_board = readGrid(grid);
    worker.postMessage(user_board);
};

// Receives the solver results and data from the solver thread.
worker.onmessage = e => {
    const {user_board, solved, solved_board} = e.data;
    
    if (solved) {
        message.innerText = "Done! No Sudoku is that hard ☄️\nWanna try again??";
        
        // Render solved board array back into the grid.
        const input = grid.querySelectorAll("input");
        input.forEach((cell, i) => {
            const row = Math.floor(i / 9);
            const column = i - 9*row;
            
            cell.value = solved_board[row][column];
        });
    } else message.innerText = "Oops! ❌️\nYour Sudoku seems invalid or unsolvable! Please check your input numbers.";
};

// Translates Sudoku grid into array of numbers (board) (only user-entered cells).
const readGrid = sudoku => {
    const cells = sudoku.querySelectorAll("input");
    const board = Array.from({length:9}, () => new Array(9).fill(0));
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const n = parseInt(cells[9*r + c].value);
            if (n && cells[9*r + c].className == "input") board[r][c] = n;
        }
    }
    
    return board;
};

// Resizes the grid and buttons when the screen orientation changes.
const SIZE = [
    grid.getBoundingClientRect().width,
    grid.getBoundingClientRect().height
];
buttons.style.width = SIZE[0] + 'px';
const resize = () => {
    const gridSize = Math.min(
        window.innerWidth * .9,
        window.innerHeight * .6
    );
    const scaleFactor = [gridSize/SIZE[0], gridSize/SIZE[1]];
    
    grid.style.transform = buttons.style.transform = `scale(${scaleFactor[0]}, ${scaleFactor[1]})`;
    container.style.height = grid.getBoundingClientRect().height + 'px';
    container.style.marginBottom = 20 * scaleFactor[1] + 'px';
    buttonsWrapper.style.height = buttons.getBoundingClientRect().height + 'px';
};
resize();
window.onresize = () => resize();
