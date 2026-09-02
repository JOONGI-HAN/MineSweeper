const difficultyPicker = document.querySelector(".difficulty--select");
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
    "grid"  : [],
    "mines" : [],
    "flags" : 0,
};

function init(rows  = GRIDSIZEMAPPING.easy.rows, cols = GRIDSIZEMAPPING.easy.cols) {
    const grid      = drawGrid(rows, cols);
    const mineCells = _randomMineCells(rows*cols);

    GAMESTATE.grid  = grid;
    GAMESTATE.mines = mineCells;
    GAMESTATE.flags = mineCells.length;
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
    const mineCells = [];

    // choose n random cells to place mines into equating to n allowed mines per difficulty
    while (index < GRIDSIZEMAPPING[difficultyPicker.value].mines) {
        const randomCell = Math.floor(Math.random() * mineCount);

        if (mineCells.includes(randomCell)) continue;

        mineCells.push(randomCell);
        index++;
    }

    console.log(`All ${GRIDSIZEMAPPING[difficultyPicker.value].mines} cells containing mines: ${mineCells}`);

    return mineCells;
}

function _findNeighbouringCells(cellIdx) {
    const neighbours = [] // indices

    {/* To find all neighbors; it's best to think of all valid "moves"
        that constitute a neighbor to cell "c":
            left by -1, right by 1, up by -width, down by width,
            for diagonal moves, you could move up and down by width, left and right by +-1 */}
    const horizontalOffsets = [-1, 0, 1];
    const verticalOffsets   = [-Math.abs(GRIDSIZEMAPPING[difficultyPicker.value].cols), 0, GRIDSIZEMAPPING[difficultyPicker.value].cols];

    for (const r of horizontalOffsets) {
        for (const c of verticalOffsets) {
            const adjacentIndex = cellIdx + r + c

            if (
                adjacentIndex + 1 > GRIDSIZEMAPPING[difficultyPicker.value].rows*GRIDSIZEMAPPING[difficultyPicker.value].cols ||
                adjacentIndex < 0 ||
                adjacentIndex % GRIDSIZEMAPPING[difficultyPicker.value].cols == 0 ||
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
        if (GAMESTATE.mines.includes(neighbour)) {
            ++mineCount;
        }
    }

    return [neighbours, mineCount];
}

function renderRevealedCells(cells) {
    for (const [cell, mineCount] of Object.entries(cells)) {
        GAMESTATE.grid[cell].style.backgroundColor = "cyan";
        if (mineCount === 0) {
            continue;
        }
        GAMESTATE.grid[cell].textContent = mineCount;
    }
}

function handleCellClick(event) {
    const clickedCell = Number(event.target.dataset.index);

    const revealedCells = chainReveal(clickedCell);

    renderRevealedCells(revealedCells);
}

function registerEventListeners() {
    difficultyPicker.addEventListener("change", () => {
        const {rows, cols} = gridDimensions(difficultyPicker.value);
    
        init(rows, cols);
    });

    gridContainer.addEventListener("click", handleCellClick) 
}

init();
registerEventListeners();