document.addEventListener('DOMContentLoaded', () => {
    
    // --- Configuration (now default values) ---
    // NEW: Changed from const to let
    let BOARD_SIZE = 10;
    let NUMBER_OF_MINES = 10;
    // ---------------------

    // --- DOM Elements ---
    const gameBoard = document.getElementById('game-board');
    const minesLeftText = document.getElementById('mines-left');
    const messageText = document.getElementById('message');
    const resetButton = document.getElementById('reset-button');
    
    // NEW: Get settings inputs
    const boardSizeInput = document.getElementById('board-size-input');
    const numMinesInput = document.getElementById('num-mines-input');
    
    // --- Game State ---
    let board = [];
    let minesLeft = NUMBER_OF_MINES;
    let gameOver = false;
    let firstClick = true;

    // --- Initialize Game ---
    function initGame() {
        
        // --- NEW: Read and validate settings ---
        let newSize = parseInt(boardSizeInput.value);
        let newMines = parseInt(numMinesInput.value);

        // Validate size
        if (isNaN(newSize) || newSize < 5 || newSize > 30) {
            newSize = 10; // Default
            boardSizeInput.value = 10;
        }
        BOARD_SIZE = newSize;

        // Validate mines (must be at least 1 and less than total cells)
        const maxMines = BOARD_SIZE * BOARD_SIZE - 1; // -1 to guarantee one safe click
        if (isNaN(newMines) || newMines < 1 || newMines > maxMines) {
            newMines = Math.min(10, maxMines); // Default or max, whichever is smaller
            numMinesInput.value = newMines;
        }
        NUMBER_OF_MINES = newMines;
        // --- END NEW ---

        // Reset game state
        board = [];
        minesLeft = NUMBER_OF_MINES; // Use the new value
        gameOver = false;
        firstClick = true;
        
        // Clear UI
        gameBoard.innerHTML = '';
        messageText.textContent = '';
        minesLeftText.textContent = minesLeft;
        
        // Set CSS variables
        gameBoard.style.setProperty('--board-size', BOARD_SIZE); // Use new value

        // Create board model
        for (let x = 0; x < BOARD_SIZE; x++) { // Use new value
            const row = [];
            for (let y = 0; y < BOARD_SIZE; y++) { // Use new value
                const element = document.createElement('div');
                element.classList.add('cell');
                
                const cell = {
                    x,
                    y,
                    element,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0,
                };
                
                // Add cell to board model
                row.push(cell);
                // Add cell element to DOM
                gameBoard.appendChild(element);

                // --- Event Listeners ---
                element.addEventListener('click', () => {
                    handleCellClick(cell);
                });

                element.addEventListener('contextmenu', (e) => {
                    e.preventDefault(); // Prevent right-click menu
                    handleRightClick(cell);
                });
            }
            board.push(row);
        }
    }

    // --- Place Mines (after first click) ---
    function placeMines(firstClickCell) {
        let minesPlaced = 0;
        while (minesPlaced < NUMBER_OF_MINES) { // Uses updated variable
            const x = Math.floor(Math.random() * BOARD_SIZE); // Uses updated variable
            const y = Math.floor(Math.random() * BOARD_SIZE); // Uses updated variable
            const cell = board[x][y];

            // Don't place a mine on the first clicked cell or an existing mine
            if (!cell.isMine && cell !== firstClickCell) {
                cell.isMine = true;
                minesPlaced++;
            }
        }
    }

    // --- Calculate Adjacent Mines ---
    function calculateAdjacentMines() {
        for (let x = 0; x < BOARD_SIZE; x++) { // Uses updated variable
            for (let y = 0; y < BOARD_SIZE; y++) { // Uses updated variable
                if (board[x][y].isMine) continue;
                
                const neighbors = getNeighbors(board[x][y]);
                const mineCount = neighbors.filter(n => n.isMine).length;
                board[x][y].adjacentMines = mineCount;
            }
        }
    }

    // --- Handle Left Click ---
    function handleCellClick(cell) {
        if (gameOver || cell.isRevealed || cell.isFlagged) return;

        // Handle first click
        if (firstClick) {
            placeMines(cell);
            calculateAdjacentMines();
            firstClick = false;
        }

        // Check for mine
        if (cell.isMine) {
            endGame(false); // Lost
            return;
        }

        revealCell(cell);
        checkWinCondition();
    }
    
    // --- Handle Right Click (Flagging) ---
    function handleRightClick(cell) {
        if (gameOver || cell.isRevealed) return;

        cell.isFlagged = !cell.isFlagged;

        if (cell.isFlagged) {
            cell.element.classList.add('flagged');
            minesLeft--;
        } else {
            cell.element.classList.remove('flagged');
            minesLeft++;
        }
        
        minesLeftText.textContent = minesLeft;
    }

    // --- Reveal a Cell ---
    function revealCell(cell) {
        if (cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;
        cell.element.classList.add('revealed');

        // If cell has adjacent mines, show the number
        if (cell.adjacentMines > 0) {
            cell.element.textContent = cell.adjacentMines;
            cell.element.dataset.adjacent = cell.adjacentMines;
        } 
        // If cell is empty (0 adjacent mines), flood-fill reveal neighbors
        else {
            const neighbors = getNeighbors(cell);
            neighbors.forEach(revealCell); // Recursive call
        }
    }

    // --- Get Cell Neighbors ---
    function getNeighbors(cell) {
        const neighbors = [];
        for (let xOffset = -1; xOffset <= 1; xOffset++) {
            for (let yOffset = -1; yOffset <= 1; yOffset++) {
                if (xOffset === 0 && yOffset === 0) continue; // Skip self

                const neighborX = cell.x + xOffset;
                const neighborY = cell.y + yOffset;

                // Check for out-of-bounds
                if (neighborX >= 0 && neighborX < BOARD_SIZE && // Uses updated variable
                    neighborY >= 0 && neighborY < BOARD_SIZE) { // Uses updated variable
                    neighbors.push(board[neighborX][neighborY]);
                }
            }
        }
        return neighbors;
    }

    // --- Check for Win ---
    function checkWinCondition() {
        const revealedNonMines = board.flat().filter(cell => !cell.isMine && cell.isRevealed).length;
        const totalNonMines = (BOARD_SIZE * BOARD_SIZE) - NUMBER_OF_MINES; // Uses updated variables

        if (revealedNonMines === totalNonMines) {
            endGame(true); // Won
        }
    }

    // --- End Game ---
    function endGame(isWin) {
        gameOver = true;
        
        if (isWin) {
            messageText.textContent = 'You Win! 🎉';
            messageText.style.color = 'green';
        } else {
            messageText.textContent = 'Game Over! 💥';
            messageText.style.color = 'red';
            revealAllMines();
        }
    }

    // --- Reveal All Mines (on loss) ---
    function revealAllMines() {
        board.flat().forEach(cell => {
            if (cell.isMine) {
                cell.element.classList.add('mine');
                // Remove flag if it was on a mine
                cell.element.classList.remove('flagged');
            }
            // Show incorrectly placed flags
            if (cell.isFlagged && !cell.isMine) {
                cell.element.classList.add('wrong-flag');
            }
        });
    }

    // --- Reset Button ---
    resetButton.addEventListener('click', initGame); // This now reads the new values

    // --- Start the game for the first time ---
    initGame();
});