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

function init(rows = GRIDSIZEMAPPING.easy.rows, cols = GRIDSIZEMAPPING.easy.cols) {
    const grid = drawGrid(rows, cols);

    renderGridContents(grid);
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

    for (let i = 0; i < rowSize; i++) {
        for (let j = 0; j < colSize; j++) {

            const cell = document.createElement("div");

            cell.classList.add("cell");
            cell.setAttribute("data-index", `${i},${j}`);
            
            grid.push(cell);
            gridContainer.appendChild(cell);
        }
    }

    return grid;
}


function renderGridContents(grid) {
    const mineCells = _randomMineCells(grid);

    for (cellIdx of mineCells) {
        {/* Render mine sprite into it; Mark it as containing Mine
            & Mark the adjacent cells to it accordingly.*/}
        const neighbours = _findMineCellNeighbours(cellIdx, grid);
        grid[cellIdx].textContent = "B"; // Bomb

        for (let neighbour of neighbours) {
            if (!mineCells.includes(neighbour)) { // neighbour cell isn't also a bomb cell
                const neighbourCell = grid[neighbour]

                neighbourCell.textContent = neighbourCell.textContent === ""
                    ? "1" 
                    : ++neighbourCell.textContent;
            }
        }
    }
}

function _randomMineCells(grid) {
    let index       = 0;
    const mineCells = [];

    // choose n random cells to place mines into equating to n allowed mines per difficulty
    while (index < GRIDSIZEMAPPING[difficultyPicker.value].mines) {
        randomCell = Math.round(Math.random() * grid.length);

        if (mineCells.includes(randomCell)) continue;

        mineCells.push(randomCell);
        index++;
    }

    console.log(`All ${GRIDSIZEMAPPING[difficultyPicker.value].mines} cells containing mines: ${mineCells}`);

    return mineCells;
}

function _findMineCellNeighbours(mineCellIdx, grid) {
    const neighbours = []; // [indices]

    {/* To find all neighbors; it's best to think of all valid "moves"
        that constitute a neighbor to cell "c":
            left by -1, right by 1, up by -width, down by width,
            for diagonal moves, you could move up and down by width, left and right by +-1 */}

    const difficulty = difficultyPicker.value;

    // 2 sets to generate all possible moves using Cartesian product
    const horizontailOffsets = [-1, 0, 1];
    const verticalOffsets    = [-Math.abs(GRIDSIZEMAPPING[difficulty].cols), 0, GRIDSIZEMAPPING[difficulty].cols];

    for (let c of verticalOffsets) {
        for (let r of horizontailOffsets) {
            const neighbour = mineCellIdx + r + c

            // index out of range, or index is multiple of grid width means we wrapped to the next row, not a neighbour!
            if (
                grid[neighbour] == undefined ||
                neighbour % GRIDSIZEMAPPING[difficulty].cols == 0 ||
                neighbour === mineCellIdx
            ) continue;

            neighbours.push(neighbour);
        }
    }

    console.log(`Mine cell ${mineCellIdx}--("${grid[mineCellIdx].dataset.index}")'s neighbours are: ${neighbours}`);
    return neighbours;
}


difficultyPicker.addEventListener("change", () => {
    const {rows, cols} = gridDimensions(difficultyPicker.value);

    init(rows, cols)
})

init();