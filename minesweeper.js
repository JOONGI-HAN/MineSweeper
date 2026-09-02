const difficultyPicker = document.querySelector(".difficulty--select");

const flagsCounter     = document.querySelector(".flags-remaining");
const newGameBtn       = document.querySelector(".new-game");
const timerCounter     = document.querySelector(".timer");

const gridContainer    = document.querySelector(".grid-container");


const GRIDSIZEMAPPING = {
    "easy" : {
        rows  : 9,
        cols  : 9,
        mines : 10, 
    },
    "medium" : {
        rows  : 16,
        cols  : 16,
        mines : 40,
    },
    "hard" : {
        rows  : 16,
        cols  : 30,
        mines : 99,
    }
};

const GAMESTATE = {
    "grid"     : [],
    "mines"    : new Set(),
    "revealed" : [],
    "flags"    : new Set(),
};

let gameEnded      = false;
let timerInterval  = null;
let secondsElapsed = 0;

function init(rows  = GRIDSIZEMAPPING.easy.rows, cols = GRIDSIZEMAPPING.easy.cols) {
    const grid      = drawGrid(rows, cols);
    const mineCells = _randomMineCells(rows*cols);

    GAMESTATE.grid     = grid;
    GAMESTATE.mines    = mineCells;
    GAMESTATE.revealed = new Array(rows*cols).fill(false);
    GAMESTATE.flags    = new Set();

    gameEnded = false;
    stopTimer();
    secondsElapsed = 0;
    timerCounter.textContent = formatTime(secondsElapsed);

    updateFlagsDisplay();
}

function gridDimensions(difficulty) {
    const dimensions = GRIDSIZEMAPPING[difficulty];

    if (!dimensions) {
        throw new Error("UNKNOWN VALUE: Invalid Difficulty.");
    }

    return dimensions;
}

function drawGrid(rowSize, colSize) {
    gridContainer.innerHTML = ""; // Clear old grid
    
    let grid = [];

    {/* set the "width" of grid to easy mode size by default */}
    gridContainer.style.setProperty("--cols", Math.max(colSize, 9));

    for (let i = 0; i < rowSize*colSize; i++) {
        const cell = document.createElement("div");

        cell.classList.add("cell");
        cell.setAttribute("data-index", i);
        
        grid.push(cell);
        gridContainer.appendChild(cell);
    }

    return grid;
}

function _randomMineCells(mineCount) {
    let index       = 0;
    const mineCells = new Set();

    // choose n random cells to place mines into equating to n allowed mines per difficulty
    while (index < GRIDSIZEMAPPING[difficultyPicker.value].mines) {
        const randomCell = Math.floor(Math.random() * mineCount);

        if (mineCells.has(randomCell)) continue;

        mineCells.add(randomCell);
        index++;
    }

    console.log(`All ${GRIDSIZEMAPPING[difficultyPicker.value].mines} cells containing mines: ${[...mineCells]}`);

    return mineCells;
}

function _findNeighbouringCells(cellIdx) {
    const neighbours = [] // indices
    const rows       = GRIDSIZEMAPPING[difficultyPicker.value].rows;
    const cols       = GRIDSIZEMAPPING[difficultyPicker.value].cols;
    const currentCol = cellIdx % cols

    {/* To find all neighbors; it's best to think of all valid "moves"
        that constitute a neighbor to cell "c":
            left by -1, right by 1, up by -width, down by width,
            for diagonal moves, you could move up and down by width, left and right by +-1 */}
    const horizontalOffsets = [-1, 0, 1];
    const verticalOffsets   = [-Math.abs(cols), 0, cols];

    for (const r of horizontalOffsets) {

        if (r === -1 && currentCol === 0) continue;
        if (r === 1 && currentCol === cols - 1) continue;

        for (const c of verticalOffsets) {
            const adjacentIndex = cellIdx + r + c

            if (
                adjacentIndex + 1 > rows*cols ||
                adjacentIndex < 0 ||
                adjacentIndex == cellIdx
            ) continue;
            
            neighbours.push(adjacentIndex);
        }
    }

    return neighbours;
}

// recursive reveal
function chainReveal(cell, accumulator = {}) {
    // accumulator ==> {cellIndex : NeighbouringMineCount}
    const [cellNeighbours, neighbourMineCount] = neighbouringMinesCount(cell);
    accumulator[cell] = neighbourMineCount;

    // recursion base case: if a cell has at least of mine neighbouring it, stop
    if (neighbourMineCount > 0) {
        return accumulator;
    }

    for (c of cellNeighbours) {
        if (c in accumulator) { // neighbour has already been inspected
            continue;
        }
        chainReveal(c, accumulator);
    }

    return accumulator;
}

function neighbouringMinesCount(cell) {
    const neighbours = _findNeighbouringCells(cell);
    let mineCount    = 0;

    for (const neighbour of neighbours) {
        if (GAMESTATE.mines.has(neighbour)) {
            ++mineCount;
        }
    }

    return [neighbours, mineCount];
}

function isMine(cell) {
    return GAMESTATE.mines.has(cell);
}

function renderRevealedCells(cells) {
    for (const [cell, mineCount] of Object.entries(cells)) {
        if (GAMESTATE.flags.has(Number(cell))) { // user placed flag there, don't reveal it
            continue;
        }

        GAMESTATE.grid[cell].classList.add("cell--revealed");
        GAMESTATE.revealed[cell] = true;

        if (mineCount === 0) {
            continue;
        }
        GAMESTATE.grid[cell].textContent = mineCount;
        GAMESTATE.grid[cell].classList.add(`cell--number-${mineCount}`);
    }
}

function checkWinCondition() {
    const revealedCount = GAMESTATE.revealed.filter(Boolean).length;

    return revealedCount + GAMESTATE.mines.size === GAMESTATE.grid.length;
}

function gameOver(hitCell) {
    gameEnded = true;
    stopTimer();

    for (mineCell of GAMESTATE.mines) {
        GAMESTATE.grid[mineCell].textContent = "💣";
        GAMESTATE.grid[mineCell].classList.add(mineCell === hitCell ? "cell--mine-hit" : "cell--mine");
    }

    const mineFlagDiff = GAMESTATE.flags.difference(GAMESTATE.mines);
    if (mineFlagDiff.size > 0) {
        for (diff of mineFlagDiff) {
            GAMESTATE.grid[diff].classList.add("cell--flag-incorrect");
        }
    }
}

function gameWin() {
    gameEnded = true;
    stopTimer();

    console.log("You Win!");
}

function startTimer() {
    secondsElapsed = 0;
    timerCounter.textContent = formatTime(secondsElapsed);

    timerInterval = setInterval(() => {
        secondsElapsed++;
        timerCounter.textContent = formatTime(secondsElapsed);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");

    return `${minutes}:${seconds}`;
}

function updateFlagsDisplay() {
    const totalMines = GRIDSIZEMAPPING[difficultyPicker.value].mines;

    flagsCounter.textContent = totalMines - GAMESTATE.flags.size;
}

function handleCellReveal(event) {
    if (gameEnded) return;

    const clickedCell = Number(event.target.dataset.index);

    if (GAMESTATE.revealed[clickedCell] || GAMESTATE.flags.has(clickedCell)) return;

    if (!timerInterval) startTimer();

    if (isMine(clickedCell)) {
        gameOver(clickedCell);
        return;
    }

    const revealedCells = chainReveal(clickedCell);

    renderRevealedCells(revealedCells);

    if (checkWinCondition()) {
        gameWin();
    }
}

function handleFlagMarker(event) {
    event.preventDefault();

    if (gameEnded) return;

    const flagTarget = Number(event.target.dataset.index);

    if (GAMESTATE.flags.has(flagTarget)) {
        GAMESTATE.flags.delete(flagTarget);
        GAMESTATE.grid[flagTarget].textContent = "";

        updateFlagsDisplay();
        return;
    }

    if (
        GAMESTATE.revealed[flagTarget] ||
        GAMESTATE.flags.size === GRIDSIZEMAPPING[difficultyPicker.value].mines
    ) {
        return;
    }

    GAMESTATE.flags.add(flagTarget);
    GAMESTATE.grid[flagTarget].textContent = "🚩";

    updateFlagsDisplay();
}

function registerEventListeners() {
    difficultyPicker.addEventListener("change", () => {
        const {rows, cols} = gridDimensions(difficultyPicker.value);
    
        init(rows, cols);
    });

    gridContainer.addEventListener("click", handleCellReveal);
    gridContainer.addEventListener("contextmenu", handleFlagMarker);

    newGameBtn.addEventListener("mousedown", () => {
        newGameBtn.textContent = "😵";
        newGameBtn.classList.add("new-game--pressed");
    });

    newGameBtn.addEventListener("mouseup", () => {
        newGameBtn.textContent = "😀";
        newGameBtn.classList.remove("new-game--pressed");

        const {rows, cols} = gridDimensions(difficultyPicker.value);

        init(rows, cols);
    });

    newGameBtn.addEventListener("mouseleave", () => {
        newGameBtn.textContent = "😀";
        newGameBtn.classList.remove("new-game--pressed");
    });
}

init();
registerEventListeners();