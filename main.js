const DEFAULT_MAP_SIZE = 10
const EMPTY_CELL = 0
const REWARD = 1
const PENALTY = -1
const EDGE = -1

let learningRate = 0.2
let discountFactor = 0.5


var waitTime = 0
var isTraining = false
var divMatrix, walls, startPoint, goalPoint, currentPoint, rTable, qTable, shortestWayParts, controlButton,rowSize, columnSize
var atButton = true

class GridCell {
    constructor(row, column) {
        this.row = row
        this.column = column
        this.north = 0
        this.east = 0
        this.south = 0
        this.west = 0
    }
}
class GridPoint {
    constructor(div, row, column) {
        this.div = div
        this.row = row
        this.column = column
    }
}

function reset(){
    divMatrix = []
    walls = []
    rTable = []
    qTable = []
    shortestWayParts = []
    isTraining = false
    startPoint = new GridPoint(null,null,null)
    goalPoint = new GridPoint(null,null,null)
    currentPoint = new GridPoint(null,null,null)
}


function setWaitTime(newWaitTime) {
    const waitTimeLabel = document.getElementById('waitTimeLabel');
    waitTimeLabel.textContent = `${newWaitTime} second`;
    waitTime = newWaitTime * 1000;
}


async function setCurrentPoint(row, column){
    if(currentPoint.div){
        currentPoint.div.classList.remove("currentPoint")
        currentPoint.div.setAttribute('title',
            "Q Values" + "\n" +
            "North: " + qTable[currentPoint.row][currentPoint.column]['north'] + "\n" +
            "East: " + qTable[currentPoint.row][currentPoint.column]['east'] + "\n" +
            "South: " + qTable[currentPoint.row][currentPoint.column]['south'] + "\n" +
            "West: " + qTable[currentPoint.row][currentPoint.column]['west']
        )
    }
    currentPoint.row = row
    currentPoint.column = column
    currentPoint.div = divMatrix[row][column]
    currentPoint.div.classList.add('currentPoint')
}


function run() {
    isTraining = true;

    const generateMapButton = document.getElementById('generate');
    if (generateMapButton) {
        generateMapButton.classList.remove('able');
        generateMapButton.classList.add('disable');
    }

    atButton = false;

    controlButton.id = 'cancel';
    controlButton.innerText = 'CANCEL';

    if (shortestWayParts) {
        clearShortestWay();
    } else {
        shortestWayParts = [];
    }

    train();
}


function cancel() {
    isTraining = false;
    atButton = true;

    controlButton.id = 'train';
    controlButton.innerText = 'TRAIN';

    const generateMapButton = document.getElementById('generate');
    if (generateMapButton) {
        generateMapButton.classList.add('able');
        generateMapButton.classList.remove('disable');
    }
}


