var defaultGoalEpisode = 100
let epsilon = 0.1;

let stepsPerEpisode = [];
let episodeNumbers = [];
let brojacIstrazivanja = 0;
let brojacEksploatacije = 0;
let istrazivanjaPerEpisode = [];
let eksploatacijaPerEpisode = [];
let prosjecnaNagradaPerEpisode = [];


async function train() {
    const goalEpisode = getGoalEpisode();
    const startTimeTraining = new Date(); // Zapamti vrijeme početka treninga

    for (let episode = 0; episode < goalEpisode; episode++) {
        const startTimeEpisode = new Date(); // Zapamti vrijeme početka epizode
        await trainSingleEpisode(episode);

       /*const endTimeEpisode = new Date(); // Zapamti vrijeme kraja epizode
        const episodeTime = endTimeEpisode - startTimeEpisode; // Izračunaj trajanje epizode
        console.log('Epizoda:', episode + 1, 'Vrijeme epizode:', episodeTime, 'ms');
        // Dodano: pitaj korisnika želi li promijeniti parametre nakon završetka ciljane epizode
        if (episode === goalEpisode - 1) {
            showCurrentParameters();
            await askForParameterChange();
        }*/
    }

   /*const endTimeTraining = new Date(); // Zapamti vrijeme kraja treninga
    const trainingTime = endTimeTraining - startTimeTraining; // Izračunaj ukupno trajanje treninga
    console.log('Ukupno vrijeme treninga:', trainingTime, 'ms');*/

    drawShortestWay();
    analizaBrojaKoraka();
    analizaProsjecneNagrade();
    createTable() 
    resetTrainingState();
    
}

function updateNagradaPerEpisode(nagrada) {
    prosjecnaNagradaPerEpisode.push({ episode: stepsPerEpisode.length, nagrada });
}

function analizaBrojaKoraka() {
    console.log('Analiza broja koraka po epizodi:');
    for (let i = 0; i < stepsPerEpisode.length; i++) {
        const episodeData = stepsPerEpisode[i];
        console.log(`Epizoda ${episodeData.episode}: Broj koraka - ${episodeData.steps}, Vrijeme - ${episodeData.time}ms`);
    }
}

function analizaProsjecneNagrade() {
    //console.log('Analiza prosječne nagrade po epizodi:');
    for (let i = 0; i < prosjecnaNagradaPerEpisode.length; i++) {
        const episodeData = prosjecnaNagradaPerEpisode[i];
        //console.log(`Epizoda ${episodeData.episode}: Prosječna nagrada - ${episodeData.nagrada}`);
    }
}

async function trainSingleEpisode(episode) {
    if (!isTraining) {
        return;
    }
    const startTimeEpisode = new Date(); // Zapamti vrijeme početka epizode

    let steps = 0;

    while (isAgentOnMap() && !isGoalReached()) {
        const currentPointBeforeAction = { ...currentPoint };  // Kopiranje trenutnog položaja

        const action = chooseRandomAction();
        const nextPosition = getNextPosition(action);

        updateQValue(action, nextPosition);

        await waitBeforeNextStep();

        setCurrentPoint(nextPosition.row, nextPosition.column);

        if (isGoalReached() || isStartPoint()) {
            break;
        }

        // Provjera stvarne promjene položaja prije nego što se broj koraka poveća
        if (currentPointBeforeAction.row !== currentPoint.row || currentPointBeforeAction.column !== currentPoint.column) {
            steps++;
        }
    }

    const endTimeEpisode = new Date(); // Zapamti vrijeme kraja epizode
    const episodeTime = endTimeEpisode - startTimeEpisode; // Izračunaj trajanje epizode
    //console.log('Epizoda:', episode + 1, 'Vrijeme epizode:', episodeTime, 'ms');

    stepsPerEpisode.push({ episode: episode + 1, steps, time: episodeTime });
    episodeNumbers.push(episode + 1);
    istrazivanjaPerEpisode.push(brojacIstrazivanja);
    eksploatacijaPerEpisode.push(brojacEksploatacije);

    await finalizeEpisode(episode);
}

function showCurrentParameters() {
    console.log(`Trenutne postavke: Stopa učenja - ${learningRate}, It - ${discountFactor}`);
}

async function askForParameterChange() {
    const changeParameters = prompt("Želite li promijeniti postavke? (da/ne)");

    if (changeParameters && changeParameters.toLowerCase() === 'da') {
        learningRate = parseFloat(prompt("Unesite novu stopu učenja:")) || learningRate;
        discountFactor = parseFloat(prompt("Unesite novu stopu sniženja (It):")) || discountFactor;
        console.log(`Nove postavke: Stopa učenja - ${learningRate}, It - ${discountFactor}`);
    }
    else
{
    console.log("end");
}
}


function isAgentOnMap() {
    return !walls.includes(currentPoint.div);
}

function isGoalReached() {
    return currentPoint.div.id === 'goalPoint';
}

function isStartPoint() {
    return currentPoint.div.id === 'startPoint';
}



function setEpsilon(value) {
    epsilon = parseFloat(value);
    document.getElementById('epsilonLabel').innerText = value;
}


function chooseRandomAction() {
    const moguceAkcije = findPosibleActions(qTable[currentPoint.row][currentPoint.column]);

    if (Math.random() < epsilon) {
        // Istraživanje: Odaberi nasumičnu akciju
        brojacIstrazivanja++;
        const nasumicnaAkcija = moguceAkcije[Math.floor(Math.random() * moguceAkcije.length)];
        return nasumicnaAkcija;
    } else {
        // Eksploatacija: Odaberi akciju s najvećom Q-vrijednošću
        brojacEksploatacije++;
        const najboljaAkcija = moguceAkcije.reduce((najbolja, akcija) => {
            return akcija.point > najbolja.point ? akcija : najbolja;
        }, moguceAkcije[0]);
        
        return najboljaAkcija;
    }
}


function getNextPosition(action) {
    return {
        row: currentPoint.row + action.rowChanger,
        column: currentPoint.column + action.columnChanger
    };
}

function updateQValue(action, nextPosition) {
    const oldQValue = qTable[currentPoint.row][currentPoint.column][action.direction];
    const reward = getReward(nextPosition);
    const nextPossibleActions = findPosibleActions(qTable[nextPosition.row][nextPosition.column]);
    const nextMaximumQValue = Math.max(...nextPossibleActions.map(a => a.point));

    let newQValue = oldQValue + learningRate * (reward + discountFactor * nextMaximumQValue - oldQValue);

    if (reward === PENALTY) {
        newQValue = 'wall';
    }

    qTable[currentPoint.row][currentPoint.column][action.direction] = newQValue;
    updateNagradaPerEpisode(reward);
}

async function waitBeforeNextStep() {
    if (waitTime > 0) {
        await sleep(waitTime);
    }
}

async function finalizeEpisode(episode) {
    console.log('Epizoda:', episode + 1, 'Broj Istraživanja:', brojacIstrazivanja, 'Broj Eksploatacija:', brojacEksploatacije);
    brojacIstrazivanja = 0;  // Resetirajte brojače za sljedeću epizodu
    brojacEksploatacije = 0;
    await showEpisodeCount(episode);
    await waitBeforeNextStep();

    if (waitTime > 0) {
        document.getElementById('episodeCount').style.color = '#fff';
    }

    setCurrentPoint(startPoint.row, startPoint.column);

    //console.log('Epizoda:', episode + 1, 'Broj Istraživanja:', brojacIstrazivanja, 'Broj Eksploatacija:', brojacEksploatacije);
    brojacIstrazivanja = 0; 
    brojacEksploatacije = 0;
}


function getGoalEpisode() {
    return document.getElementById('generation').value == '' ? defaultGoalEpisode : document.getElementById('generation').value;
}

function resetTrainingState() {
    isTraining = false;
    atButton = true;

    controlButton.id = 'train';
    controlButton.innerText = 'TRAIN';

    let generateMapButton = document.getElementById('generate');
    generateMapButton.classList.add('able');
    generateMapButton.classList.remove('disable');
}

async function showEpisodeCount(episode) {
    document.getElementById('episodeCount').innerHTML = 'Episode: ' + (episode + 1);
}

function getReward(position) {
    if (!position) {
        return 'cliff';
    } else if (walls.includes(divMatrix[position.row][position.column])) {
        return PENALTY;
    } else if (divMatrix[position.row][position.column].id === 'goalPoint') {
        return REWARD;
    } else {
        return EMPTY_CELL;
    }
}


async function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function drawShortestWay() {
    let point = new GridPoint(startPoint.div, startPoint.row, startPoint.column);

    while (point.div.id !== 'goalPoint') {
        let possibleActions = findPosibleActions(qTable[point.row][point.column]);

        if (possibleActions.length === 0) {
            return;
        }

        let possibleMaxQActions = findMaxActions(possibleActions);

        if (possibleMaxQActions.every(item => item.point === 0)) {
            console.log('Not enough episodes to find an optima');
            return;
        }

        let maxQAction = possibleMaxQActions[Math.floor(Math.random() * possibleMaxQActions.length)];
        point.row += maxQAction.rowChanger;
        point.column += maxQAction.columnChanger;
        point.div = divMatrix[point.row][point.column];

        if (point.div.id === 'goalPoint') {
            return;
        }

        let innerDiv = document.createElement('div');
        innerDiv.style.width = '100%';
        innerDiv.style.height = '100%';
        innerDiv.classList.add('shortestWay');
        point.div.append(innerDiv);
        shortestWayParts.push(point.div);

        await sleep(75);
    }
}


function clearShortestWay(){
    shortestWayParts.forEach(
        part => {
            part.innerHTML = ''
        }
    )
    shortestWayParts = []
}

function findPosibleActions(point) {
    const actions = [];

    const addAction = (direction, rowChanger, columnChanger) => {
        const neighbor = point[direction];
        if (neighbor !== 'cliff' && neighbor !== 'wall') {
            actions.push({
                direction,
                point: neighbor,
                rowChanger,
                columnChanger
            });
        }
    };

    addAction('north', -1, 0);
    addAction('west', 0, -1);
    addAction('east', 0, 1);
    addAction('south', 1, 0);

    return actions;
}

function findMaxActions(posibleActions){
    const maxPoint = Math.max(...posibleActions.map(i => {return i.point} ))
    const optimumActions = []
    posibleActions.forEach((action) => action.point == maxPoint?optimumActions.push(action):null)
    return optimumActions
}


function createTable() {
    console.clear(); // Očisti konzolu
    console.log("Epizoda | Broj koraka | Broj istraživanja | Broj eksploatacija | Prosječna nagrada");

    for (let i = 0; i < episodeNumbers.length; i++) {
        const episode = episodeNumbers[i];
        const steps = stepsPerEpisode[i].steps;
        const istrazivanja = istrazivanjaPerEpisode[i];
        const eksploatacija = eksploatacijaPerEpisode[i];
        const prosjecnaNagrada = prosjecnaNagradaPerEpisode[i].nagrada;

        console.log(`${episode} | ${steps} | ${istrazivanja} | ${eksploatacija} | ${prosjecnaNagrada}`);
    }
}



