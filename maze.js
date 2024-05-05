var defaultWallRate = 0.2

function generateMaze() {
    var mapDiv = document.getElementById('map');
    var style = getComputedStyle(mapDiv);
    mapDiv.style.width = style.height;

    if (isTraining) return;

    rowSize = getValidInput(document.querySelector("input#row"), DEFAULT_MAP_SIZE, 3, 100);
    columnSize = getValidInput(document.querySelector("input#column"), DEFAULT_MAP_SIZE, 3, 100);

    mapDiv.innerHTML = '';
    reset();

    for (let i = 0; i < rowSize; i++) {
        let newRow = document.createElement('div');
        newRow.classList.add('row');

        let matrixRow = [];

        for (let j = 0; j < columnSize; j++) {
            let cell = document.createElement('div');
            cell.classList.add('cell');

            newRow.append(cell);
            matrixRow.push(cell);
        }

        mapDiv.append(newRow);
        divMatrix.push(matrixRow);
    }

    addWallsRandomly(rowSize, columnSize);
    addStartAndGoalRandomly(rowSize, columnSize);

    controlButton = document.getElementById('train');

    controlButton.onclick = () => {
        atButton ? run() : cancel();
    };
}


function getValidInput(inputElement, defaultValue, minValue, maxValue) {
    return inputElement.value !== '' ? Math.max(minValue, Math.min(maxValue, inputElement.value)) : defaultValue;
}

generateMaze();



function addStartAndGoalRandomly(rowSize, columnSize) {
    let startRow = Math.floor(Math.random() * rowSize);
    let startColumn = Math.floor(Math.random() * columnSize);

    while (walls.includes(divMatrix[startRow][startColumn])) {
        startRow = Math.floor(Math.random() * rowSize);
        startColumn = Math.floor(Math.random() * columnSize);
    }

    setStartPoint(startRow, startColumn);

    let goalRow = Math.floor(Math.random() * rowSize);
    let goalColumn = Math.floor(Math.random() * columnSize);

    while (walls.includes(divMatrix[goalRow][goalColumn]) || (goalRow === startRow && goalColumn === startColumn)) {
        goalRow = Math.floor(Math.random() * rowSize);
        goalColumn = Math.floor(Math.random() * columnSize);
    }

    setGoalPoint(goalRow, goalColumn);
}


function setStartPoint(row, column) {
    if (isTraining || divMatrix[row][column] === goalPoint.div) {
        return;
    }

    if (startPoint.div) {
        startPoint.div.removeAttribute('id');
    }

    startPoint.row = row;
    startPoint.column = column;
    startPoint.div = divMatrix[row][column];
    startPoint.div.id = 'startPoint';

    setCurrentPoint(row, column);
}

function setGoalPoint(row, column) {
    if (isTraining || divMatrix[row][column] === startPoint.div) {
        return;
    }

    if (goalPoint.div) {
        goalPoint.div.removeAttribute('id');
    }

    goalPoint.row = row;
    goalPoint.column = column;
    goalPoint.div = divMatrix[row][column];
    goalPoint.div.id = 'goalPoint';

    rTable = [];
    qTable = [];
    rewardTable();
    qTableInit();
}

function rValue(neighbor){
    if(!neighbor){
        return 'cliff'
    }else if(neighbor.classList.contains('wall')){
        return PENALTY
    }else if(neighbor.id == 'goalPoint'){
        return REWARD
    }else{
        return EMPTY_CELL
    }
}

function rewardTable(){
    for(let i = 0; i < rowSize; i++){
        let row = [];
        for(let j = 0; j < columnSize; j++){
            let cell = new GridCell(i,j);

            let north = divMatrix[i-1]?divMatrix[i-1][j]:undefined
            let west = divMatrix[i][j-1]
            let east = divMatrix[i][j+1]
            let south = divMatrix[i+1]?divMatrix[i+1][j]:undefined

            cell.north = rValue(north)
            cell.west = rValue(west)
            cell.east = rValue(east)
            cell.south = rValue(south)

            row.push(cell);
        }
        rTable.push(row);
    }
}

function qTableInit(){
    for(let i = 0; i < rowSize; i++){
        let row = [];
        for(let j = 0; j < columnSize; j++){
            let cell = new GridCell(i, j);

            const directions = ['north', 'east', 'west', 'south'];
            for (const direction of directions) {
                if (rTable[i][j][direction] === 'cliff') {
                    cell[direction] = 'cliff';
                }
            }

            const titleText = directions.map(direction => `${direction.charAt(0).toUpperCase() + direction.slice(1)}: ${cell[direction]}`).join("\n");
            divMatrix[i][j].setAttribute('title', "Q Values\n" + titleText);

            row.push(cell);
        }
        qTable.push(row);
    }
}


async function addWallsRandomly(rowSize, columnSize) {
    let rateInput = document.getElementById('wallRate');
    let wallRate = rateInput.value == '' ? defaultWallRate : rateInput.value / 100;
    if (wallRate > 80) wallRate = 80;
    if (wallRate < 0) wallRate = 0;

    addStartAndGoalRandomly(rowSize, columnSize);

    let wallNumber = parseInt(wallRate * rowSize * columnSize);

    walls.forEach((wall) => wall.classList.remove('wall'));
    walls = [];

    let n = 0;
    while (n < wallNumber) {
        let rowIndex = Math.floor(Math.random() * rowSize);
        let columnIndex = Math.floor(Math.random() * columnSize);

        let newWall = divMatrix[rowIndex][columnIndex];

        if (
            newWall !== startPoint.div &&
            newWall !== goalPoint.div &&
            !walls.includes(newWall) &&
            await isPathOpen(startPoint, goalPoint, walls.concat([newWall]))
        ) {
            newWall.classList.add('wall');
            walls.push(newWall);
            n++;
        }
    }
}

async function isPathOpen(start, goal, walls) {
    let visited = new Set();
    let stack = [start];

    while (stack.length > 0) {
        let current = stack.pop();

        if (current.row === goal.row && current.column === goal.column) {
            return true;
        }

        visited.add(`${current.row},${current.column}`);

        if (
            current.row - 1 >= 0 &&
            !walls.includes(divMatrix[current.row - 1][current.column]) &&
            !visited.has(`${current.row - 1},${current.column}`)
        ) {
            stack.push({ row: current.row - 1, column: current.column });
        }
        if (
            current.row + 1 < rowSize &&
            !walls.includes(divMatrix[current.row + 1][current.column]) &&
            !visited.has(`${current.row + 1},${current.column}`)
        ) {
            stack.push({ row: current.row + 1, column: current.column });
        }
        if (
            current.column - 1 >= 0 &&
            !walls.includes(divMatrix[current.row][current.column - 1]) &&
            !visited.has(`${current.row},${current.column - 1}`)
        ) {
            stack.push({ row: current.row, column: current.column - 1 });
        }
        if (
            current.column + 1 < columnSize &&
            !walls.includes(divMatrix[current.row][current.column + 1]) &&
            !visited.has(`${current.row},${current.column + 1}`)
        ) {
            stack.push({ row: current.row, column: current.column + 1 });
        }
    }

    return false;
}
