var initializedMaze = false;

function initializeMaze() {
    if (initializedMaze) return; // Ako je labirint već inicijaliziran, nemoj ponovno inicijalizirati

    var mapDiv = document.getElementById('map');
    var style = getComputedStyle(mapDiv);
    mapDiv.style.width = style.height;

    // Postavi veličinu labirinta
    var rowSize = 10;
    var columnSize = 10;

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

    // Označi da je labirint inicijaliziran
    initializedMaze = true;
}

// Pozovi funkciju za inicijalizaciju labirinta kada se stranica učita
window.onload = function () {
    initializeMaze();
};
