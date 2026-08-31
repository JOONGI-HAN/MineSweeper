const difficultyPicker = document.querySelector(".difficulty--select");
const grid = document.querySelector(".grid-container");

const GRIDSIZEMAPPING = {
    "easy" : {
        rows : 9,
        cols : 9,
    },
    "medium" : {
        rows : 16,
        cols : 16,
    },
    "hard" : {
        rows : 16,
        cols : 30,
    }
}

function init() {
    difficultyPicker.addEventListener("change", () => {
        const {rows, cols} = gridDimensions(difficultyPicker.value);

        drawGrid(rows, cols);
    })

    drawGrid(GRIDSIZEMAPPING.easy.rows, GRIDSIZEMAPPING.easy.cols);
}

function drawGrid(rowSize, colSize) {
    grid.innerHTML = ""; // Clear old grid
    
    {/* set the "width" of grid to easy mode size by default */}
    grid.style.setProperty("--cols", Math.max(colSize, 9));

    for (let i = 0; i < rowSize; i++) {
        for (let j = 0; j < colSize; j++) {

            const cell = document.createElement("div");

            cell.setAttribute("class", "cell");
            cell.setAttribute("data-index", `${i},${j}`);

            grid.appendChild(cell);
        }
    }
}

function gridDimensions(difficulty) {
    const dimensions = GRIDSIZEMAPPING[difficulty]

    if (!dimensions) {
        throw new Error("UNKNOWN VALUE: Invalid Difficulty.")
    }

    return dimensions;
}

init();