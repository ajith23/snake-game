const DIRECTION = {
    RIGHT: "RIGHT",
    LEFT: "LEFT",
    UP: "UP",
    DOWN: "DOWN"
}
var isSpeedConstant = false
var isGhost = true // can go through walls
var boardSize = {x: 20, y: 20}
var snakeSpeed = 100
var snakeStartSpeed = 300
var freedCell, foodCell, latestBrickCell
var currentDirection, nextDirection, snakeHead, snake, intervalId, timeoutIntervalId, currentSpeed, currentMaxScore = 0

const getBoardCellId = (point) => {
    if (!point) return null
    return `cell-${point.x}-${point.y}`
}

const isMoveValid = (currentMove, nextMove) => {
    if (!currentMove || ! nextMove) return false
    return (nextMove === DIRECTION.DOWN && currentMove !== DIRECTION.UP) ||
    (nextMove === DIRECTION.UP && currentMove !== DIRECTION.DOWN) ||
    (nextMove === DIRECTION.RIGHT && currentMove !== DIRECTION.LEFT) ||
    (nextMove === DIRECTION.LEFT && currentMove !== DIRECTION.RIGHT)
}

const move = {
    LEFT: (point) =>  ({x: point.x, y: point.y - 1}),
    RIGHT: (point) =>  ({x: point.x, y: point.y + 1}),
    UP: (point) =>  ({x: point.x - 1, y: point.y}),
    DOWN: (point) =>  ({x: point.x + 1, y: point.y})
}


function screenControlButtonClicked(direction) {
    nextDirection = direction
    if (direction === 'UP-LEFT') {
        if (currentDirection === DIRECTION.UP || currentDirection === DIRECTION.DOWN) {
            nextDirection = DIRECTION.LEFT
        } else {
            nextDirection = DIRECTION.UP
        }
    } else {
        if (currentDirection === DIRECTION.UP || currentDirection === DIRECTION.DOWN) {
            nextDirection = DIRECTION.RIGHT
        } else {
            nextDirection = DIRECTION.DOWN
        }
    }
}

function updateUserMove(e) {
    e = e || window.event;
    var reactInstantly = true
    if (e.keyCode == '38') {
        nextDirection = DIRECTION.UP
    } else if (e.keyCode == '40') {
        nextDirection = DIRECTION.DOWN
    } else if (e.keyCode == '37') {
       nextDirection = DIRECTION.LEFT
    } else if (e.keyCode == '39') {
       nextDirection = DIRECTION.RIGHT
    } else {
      reactInstantly = false
    }
    if (reactInstantly) updateSnakePosition()
}

const generateRandomPoint = (size) => {
    return {
        x: Math.floor(Math.random() * size.x),
        y: Math.floor(Math.random() * size.y)
    }
}

function generateNewFood() {
    var x = Math.floor(Math.random() * boardSize.x);  
    var y = Math.floor(Math.random() * boardSize.y);
    var randomPoint = generateRandomPoint(boardSize)
    while (snake.filter(part => part.x == randomPoint.x && part.y == randomPoint.y).length) {
        randomPoint = generateRandomPoint(boardSize)
    }
    return randomPoint
}

function generateNewBrick() {
    var randomPoint = generateRandomPoint(boardSize)
    while (snake.filter(part => part.x == randomPoint.x && part.y == randomPoint.y).length) {
        randomPoint = generateRandomPoint(boardSize)
    }
    while (foodCell.x == randomPoint.x && foodCell.y == randomPoint.y) {
        randomPoint = generateRandomPoint(boardSize)
    }
    
    return randomPoint
}

function initializeBoard(x, y) {
    var board = document.getElementById("board")
    var tempTable = board.getElementsByTagName("table")
    if (tempTable.length > 0) board.removeChild(tempTable[0])
    var boardTable = document.createElement("table")
    for(var i=0; i<x; i++) {
        var boardRow = document.createElement("tr")
        for(var j=0; j<y; j++) {
            var point = {x:i, y:j}
            var boardCell = document.createElement("td")
            boardCell.classList.add("board-cell")
            boardCell.classList.add("board-cell-vacant")
            boardCell.setAttribute("id", getBoardCellId(point));
            
            boardRow.appendChild(boardCell)
        }
        boardTable.appendChild(boardRow)
    }
    board.appendChild(boardTable)
}

function isFood(point) {
    return point.x == foodCell.x && point.y == foodCell.y
}

function updateSnakePosition() {
    var newHead = {x: -1, y: -1}
    if (isMoveValid(currentDirection, nextDirection)) {
        newHead = move[nextDirection](snakeHead)
        currentDirection = nextDirection
    } else  {
        newHead = move[currentDirection](snakeHead)
    }
    
    if (isGhost) {
        // go through walls
        if (newHead.x < 0) newHead.x = boardSize.x - 1
        else if (newHead.x >= boardSize.x) newHead.x = 0
        if (newHead.y < 0) newHead.y = boardSize.y - 1
        else if (newHead.y >= boardSize.y) newHead.y = 0
    }
    
    snake.push(newHead)
    var foundFood =  isFood(newHead)
    freedCell = foundFood ? null : snake.shift()
    foodCell = foundFood ? generateNewFood() : foodCell
    latestBrickCell = foundFood ? generateNewBrick() : null
    snakeHead = newHead
    
    currentMaxScore = Math.max(snake.length, currentMaxScore)
    updateUI()
}

function killSnake() {
    alert("Snake died")
    window.clearInterval(intervalId);
    window.clearTimeout(timeoutIntervalId);
}

function updateUI() {
    //update food cell
    var foodElement = document.getElementById(getBoardCellId(foodCell))
    if (foodElement) {
        foodElement.className = ""
        foodElement.classList.add("board-cell", "board-cell-with-food")
    }
    
    //update brick cell
    var latestBrickCellElement = document.getElementById(getBoardCellId(latestBrickCell))
    if (latestBrickCellElement) {
        latestBrickCellElement.className = ""
        latestBrickCellElement.classList.add("board-cell", "board-cell-with-brick")
    }
    
    // update snake head style
    var snakeHeadElement = document.getElementById(getBoardCellId(snakeHead))
    if (!snakeHeadElement 
        || snakeHeadElement.classList.contains("board-cell-occupied")) {
        killSnake()
        return
    }
    
    // reduce snake size on collison with brick 
    if (snakeHeadElement.classList.contains("board-cell-with-brick")) {
        if (snake.length > 1) {
            snakeHeadElement.className = ""
            snakeHeadElement.classList.add("board-cell", "board-cell-occupied")
            var lastElement = document.getElementById(getBoardCellId(snake.shift()))
            lastElement.className = ""
            lastElement.classList.add("board-cell", "board-cell-vacant")
        } else {
            killSnake()
            return
        }
    }
    
    document.getElementById("speed").innerHTML = currentSpeed
    document.getElementById("score").innerHTML = snake.length
    document.getElementById("max-score").innerHTML = currentMaxScore

    snake.forEach(part => {
        var snakeElement = document.getElementById(getBoardCellId(part))
        snakeElement.className = ""
        snakeElement.classList.add("board-cell", "board-cell-occupied")
    });
    snakeHeadElement.classList.add(`snake-head-moving-${currentDirection}`)
    
    var freedElement = document.getElementById(getBoardCellId(freedCell))
    if (freedElement) {
        freedElement.className = ""
        freedElement.classList.add("board-cell", "board-cell-vacant")
    }
}

function initializeGameStartData() {
    currentDirection = DIRECTION.RIGHT
    nextDirection = DIRECTION.RIGHT
    snakeHead = {x: 0, y: 0}
    snake = []
    freedCell =  {x: -1, y: -1}
    intervalId = -1
    modulo = 2
    accelerationFactor = 50

    isGhost = document.getElementById('ghost').checked
    isSpeedConstant = document.getElementById('constant-speed').checked
    
    snake.push(snakeHead)
}

function startGameClicked() {
    initializeGameStartData()
    initializeBoard(boardSize.x, boardSize.y)
    foodCell = generateNewFood()
    if (isSpeedConstant) {
        currentSpeed = snakeSpeed
        intervalId = window.setInterval(updateSnakePosition, snakeSpeed)
    } else
        setAcceleratingTimeout(updateSnakePosition, snakeStartSpeed)
}

var modulo = 2
var accelerationFactor = 50
function setAcceleratingTimeout(callback, startSpeed)
{
    var internalCallback = function(counter) {
        return function() {
            if (snake.length % modulo === 0) {
                counter += accelerationFactor
                modulo++
                if (currentSpeed === 200) {
                    accelerationFactor = 10
                }
            }
            currentSpeed = Math.max(startSpeed - counter, 50)
            timeoutIntervalId = window.setTimeout(internalCallback, currentSpeed);
            callback();
        }
    }(0);

    window.setTimeout(internalCallback, startSpeed);
};


document.onkeydown = updateUserMove;
