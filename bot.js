import { Client } from "discord.io";
import { token as _token } from "./auth.json";

// initialize Discord Bot
const bot = new Client({
    token: _token,
    autorun: true,
});

bot.on("ready", function () {
    console.log("Logged in as %s - %s\n", bot.username, bot.id);
});

// arrays that hold all of the game instances
const tGames = [];
const cGames = [];
const bGames = [];

const boardSide = 3;
const bBoardSide = 10;

bot.on("message", function (user, userID, channelID, message, evt) {
    // bot will listen for messages that will start with `$`
    if (channelID == 408777670030000129 && message.substring(0, 1) == "$") {
        let args = message.substring(1).split(" ");
        let cmd = args[0];
        args = args.splice(1);
        switch (cmd) {
            case "help":
                bot.sendMessage({
                    to: channelID,
                    message: "`" + printCommandTable() + "`",
                });
                break;
            case "pt":
                let tGame = evalInstanceT(userID, channelID);
                bot.sendMessage({
                    to: channelID,
                    message:
                        "<@!" +
                        userID +
                        ">" +
                        "'s TicTacToe Board:\n\n   " +
                        "`" +
                        printBoardT(tGame, userID) +
                        "`",
                });
                break;
            case "pc":
                let cGame = evalInstanceC(userID, channelID);
                bot.sendMessage({
                    to: channelID,
                    message:
                        "<@!" +
                        userID +
                        ">" +
                        "'s Connect-4 Board:\n\n " +
                        "`" +
                        printBoardC(cGame, userID) +
                        "`",
                });
                break;
            case "pb":
                let bGame = evalInstanceB(userID, channelID);
                bot.sendMessage({
                    to: channelID,
                    message:
                        "<@!" +
                        userID +
                        ">" +
                        "'s Blokus Board:\n\n   " +
                        "`" +
                        printBoardB(bGame, userID) +
                        "`",
                });
                break;
            case "t":
                bot.sendMessage({
                    to: channelID,
                    message: playTicTacToe(
                        parseInt(args[0]),
                        parseInt(args[1]),
                        userID
                    ),
                });
                break;
            case "c":
                bot.sendMessage({
                    to: channelID,
                    message: playConnect4(parseInt(args[0]), userID),
                });
                break;
            case "b":
                bot.sendMessage({
                    to: channelID,
                    message: playBlokus(
                        parseInt(args[0]),
                        parseInt(args[1]),
                        parseInt(args[2]),
                        userID
                    ),
                });
                break;
            default:
                bot.sendMessage({
                    to: channelID,
                    message:
                        "<@!" +
                        userID +
                        ">" +
                        " No commands matching! Type !help for list of commands",
                });
        }
    }
});
//-------------------------------------------------------------------------------------------------------------
/**
 * removes a game instance once a player finishes a game
 * @param {object} game - a game instance
 */
function removeInstance(game) {
    if (game.type == "tictactoe") {
        for (i = 0; i < tGames.length; i++) {
            if (tGames[i].id == game.id) {
                tGames.splice(i, 1);
                return;
            }
        }
    } else if (game.type == "connect4") {
        for (i = 0; i < cGames.length; i++) {
            if (cGames[i].id == game.id) {
                cGames.splice(i, 1);
                return;
            }
        }
    } else if (game.type == "blokus") {
        for (i = 0; i < bGames.length; i++) {
            if (bGames[i].id == game.id) {
                bGames.splice(i, 1);
                return;
            }
        }
    } else {
        console.log(
            "Error should not be printing. Not an instance of any games"
        );
    }
}

/**
 * Used to check if an input can be an int
 * https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
 * @param {int} value - the input being checked
 */
function isInt(value) {
    return (
        !isNaN(value) &&
        parseInt(Number(value)) == value &&
        !isNaN(parseInt(value, 10))
    );
}

/**
 * Used for cloning an array
 * https://blog.andrewray.me/how-to-clone-a-nested-array-in-javascript/
 * @param {array} arr - the array being cloned
 */
function arrayClone(arr) {
    let i, copy;
    if (Array.isArray(arr)) {
        copy = arr.slice(0);
        for (i = 0; i < copy.length; i++) {
            copy[i] = arrayClone(copy[i]);
        }
        return copy;
    } else if (typeof arr === "object") {
        throw "Cannot clone array containing an object!";
    } else {
        return arr;
    }
}

/**
 * Prints a menu that displays all commands
 */
function printCommandTable() {
    let command =
        "`$help				    -print out all commands\n" +
        "$t <row> <col>		    -mark x at row/column on tic-tac-toe board\n" +
        "$c <col>				    -drop x on column on the connect4 board\n" +
        "$b <block> <row> <col>   -place a block's pin to row/column\n" +
        "$pt    -print the tic-tac-toe board\n" +
        "$pc    -print the connect 4 board\n" +
        "$pb    -print the blokus board\n`";
    return command;
}
//-------------------------------------------------------------------------------------------------------------
/**
 * Main function to launch Tic Tac Toe
 * @param {int} row - the row to mark at
 * @param {int} col - the col to mark at
 * @param {int} userID - the userID to pass modify credits to
 * @param {int} channelID - the channelID to modify credits to
 */
function playTicTacToe(row, col, userID, channelID) {
    if (!isInt(row) || !isInt(col)) {
        return "`Invalid Argument(s). Try again.`";
    }

    let tGame = evalInstanceT(userID, channelID);
    if (
        row < 0 ||
        row > boardSide - 1 ||
        col < 0 ||
        col > boardSide - 1 ||
        tGame.board[row][col] != ""
    ) {
        return "`Out of bound or cell not available. Try again.`";
    }

    // player move
    tGame.board[row][col] = "x";
    let index = checkItemInArrayT(tGame.availableCells, [row, col]);
    tGame.availableCells.splice(index, 1);
    let winnerString = checkIfWinnerT(tGame);
    if (
        winnerString == "You just won!" ||
        winnerString == "You just lost!" ||
        winnerString == "Tie!"
    ) {
        if (winnerString == "You just won!") {
            // insertCreditBot(userID,channelID, 3);
        }
        removeInstance(tGame);
        return (
            "<@!" +
            userID +
            ">" +
            "'s TicTacToe Board:\n\n   " +
            "`" +
            printBoardT(tGame, userID) +
            winnerString +
            "`"
        );
    }

    // bot move
    let move = checkNextMoveT(tGame);
    let indexOfCellToBeRemoved;
    if (move[0] == -1 && move[1] == -1) {
        // random move
        indexOfCellToBeRemoved = Math.floor(
            Math.random() * tGame.availableCells.length
        );
    } else {
        // smart move
        indexOfCellToBeRemoved = checkItemInArrayT(tGame.availableCells, [
            move[0],
            move[1],
        ]);
    }
    move = tGame.availableCells[indexOfCellToBeRemoved];
    tGame.board[move[0]][move[1]] = "o";
    tGame.availableCells.splice(indexOfCellToBeRemoved, 1);

    winnerString = checkIfWinnerT(tGame);
    if (
        winnerString == "You just won!" ||
        winnerString == "You just lost!" ||
        winnerString == "Tie!"
    ) {
        if (winnerString == "You just won!") {
            // insertCreditBot(userID,channelID, 3);
        }
        removeInstance(tGame);
    }
    return (
        "<@!" +
        userID +
        ">" +
        "'s TicTacToe Board:\n\n   " +
        "`" +
        printBoardT(tGame, userID) +
        winnerString +
        "`"
    );
}
// check for horizontals, verticals, and diagonals
function checkIfWinnerT(tGame) {
    if (tGame.availableCells.length == 0) {
        return "Tie!";
    }
    let numWins = 0;
    // horizontals
    for (i = 0; i < boardSide; i++) {
        for (j = 0; j < boardSide; j++) {
            if (tGame.board[i][j] == "x") numWins++;
            else if (tGame.board[i][j] == "o") numWins--;
        }
        if (numWins == boardSide) return "You just won!";
        else if (numWins == -boardSide) return "You just lost!";
        else numWins = 0;
    }
    // verticals
    for (j = 0; j < boardSide; j++) {
        for (i = 0; i < boardSide; i++) {
            if (tGame.board[i][j] == "x") numWins++;
            else if (tGame.board[i][j] == "o") numWins--;
        }
        if (numWins == boardSide) return "You just won!";
        else if (numWins == -boardSide) return "You just lost!";
        else numWins = 0;
    }
    // diagonals
    for (i = 0; i < boardSide; i++) {
        if (tGame.board[i][i] == "x") numWins++;
        else if (tGame.board[i][i] == "o") numWins--;
    }
    if (numWins == boardSide) return "You just won!";
    else if (numWins == -boardSide) return "You just lost!";
    else numWins = 0;

    for (i = 0; i < boardSide; i++) {
        if (tGame.board[i][boardSide - 1 - i] == "x") numWins++;
        else if (tGame.board[i][boardSide - 1 - i] == "o") numWins--;
    }
    if (numWins == boardSide) return "You just won!";
    else if (numWins == -boardSide) return "You just lost!";
    else numWins = 0;

    return "No winner yet. Keep playing!";
}

// check one move ahead of the game to win against
// the player or to block user's winning move
function checkNextMoveT(tGame) {
    for (a = 0; a < boardSide; a++) {
        for (b = 0; b < boardSide; b++) {
            if (tGame.board[a][b] == "") {
                tGame.board[a][b] = "o";
                if (checkIfWinnerT(tGame) == "You just lost!") {
                    tGame.board[a][b] = "";
                    return [a, b];
                }
                tGame.board[a][b] = "";
            }
        }
    }
    for (a = 0; a < boardSide; a++) {
        for (b = 0; b < boardSide; b++) {
            if (tGame.board[a][b] == "") {
                tGame.board[a][b] = "x";
                if (checkIfWinnerT(tGame) == "You just won!") {
                    tGame.board[a][b] = "";
                    return [a, b];
                }
                tGame.board[a][b] = "";
            }
        }
    }
    return [-1, -1];
}

// https://stackoverflow.com/questions/24943200/javascript-2d-array-indexof
function checkItemInArrayT(array, item) {
    for (i = 0; i < array.length; i++) {
        // This if statement depends on the format of your array
        if (array[i][0] == item[0] && array[i][1] == item[1]) {
            return i; // Found it
        }
    }
    return -1; // Not found
}

// check if the game instance exists. If yes, access it
// If no, create it and initialize members.
function evalInstanceT(idCheck, channelID) {
    for (i = 0; i < tGames.length; i++) {
        if (tGames[i].id == idCheck) {
            return tGames[i];
        }
    }
    let tGame = {
        id: idCheck,
        type: "tictactoe",
        board: [],
        availableCells: [],
    };
    initBoardT(tGame, idCheck, channelID);
    tGames.push(tGame);
    return tGame;
}

// initialize members in the game object
function initBoardT(tGame, userID, channelID) {
    for (i = 0; i < boardSide; i++) {
        tGame.board[i] = [];
        for (j = 0; j < boardSide; j++) {
            tGame.board[i][j] = "";
            tGame.availableCells[i * boardSide + j] = [i, j];
        }
    }
    // insertCreditBot(userID,channelID,-1);
}

// display the board as a string
function printBoardT(tGame, userID) {
    let boardString = "0 1 2 \n";
    for (i = 0; i < boardSide; i++) {
        boardString += i + "|";
        for (j = 0; j < boardSide; j++) {
            if (tGame.board[i][j] == "x" || tGame.board[i][j] == "o")
                boardString += tGame.board[i][j] + "|";
            else boardString += " |";
        }
        boardString += "\n";
    }
    return boardString;
}
//-------------------------------------------------------------------------------------------------------------
/**
 * Main function to launch Connect-4
 * @param {int} col - the col to drop a marker on
 * @param {int} userID - the userID to pass modify credits to
 * @param {int} channelID - the channelID to modify credits to
 */
function playConnect4(col, userID, channelID) {
    if (!isInt(col) || col < 0 || col > 6) {
        return "`Invalid Argument. Try again.`";
    }
    let cGame = evalInstanceC(userID, channelID);
    if (cGame.board[0][col] != "") {
        return "`Column Full. Try again.`";
    }

    // player move
    let row;
    for (i = 5; i >= 0; i--) {
        if (cGame.board[i][col] != "x" && cGame.board[i][col] != "o") {
            cGame.board[i][col] = "x";
            row = i;
            break;
        }
    }
    updateAvailableCols(cGame, col);
    let winnerString = checkIfWinnerC(cGame, [row, col]);
    if (
        winnerString == "You just won!" ||
        winnerString == "You just lost!" ||
        winnerString == "Tie!"
    ) {
        if (winnerString == "You just won!") {
            // insertCreditBot(userID,channelID, 6);
        }
        removeInstance(cGame);
        return (
            "<@!" +
            userID +
            ">" +
            "'s Connect-4 Board:\n\n " +
            "`" +
            printBoardC(cGame, userID) +
            winnerString +
            "`"
        );
    }

    // bot move
    let move = checkNextMoveC(cGame);
    let indexOfCellToBeRemoved;
    if (move[0] == -1 && move[1] == -1) {
        // random move
        indexOfCellToBeRemoved = Math.floor(
            Math.random() * cGame.availableCols.length
        );
    } else {
        // smart move
        indexOfCellToBeRemoved = checkItemInArrayC(
            cGame.availableCols,
            move[1]
        );
    }
    col = cGame.availableCols[indexOfCellToBeRemoved];
    for (i = 5; i >= 0; i--) {
        if (cGame.board[i][col] != "x" && cGame.board[i][col] != "o") {
            row = i;
            break;
        }
    }
    cGame.board[row][col] = "o";
    if (cGame.board[0][col] == "x" || cGame.board[0][col] == "o") {
        cGame.availableCols.splice(indexOfCellToBeRemoved, 1);
    }
    winnerString = checkIfWinnerC(cGame, [row, col]);
    if (
        winnerString == "You just won!" ||
        winnerString == "You just lost!" ||
        winnerString == "Tie!"
    ) {
        if (winnerString == "You just won!") {
            // insertCreditBot(userID,channelID, 6);
        }
        removeInstance(cGame);
    }
    return (
        "<@!" +
        userID +
        ">" +
        "'s Connect-4 Board:\n\n " +
        "`" +
        printBoardC(cGame, userID) +
        winnerString +
        "`"
    );
}
// update the availableCols
function updateAvailableCols(cGame, col) {
    if (cGame.board[0][col] == "x" || cGame.board[0][col] == "o") {
        for (i = 0; i < cGame.availableCols.length; i++) {
            if (cGame.availableCols[i] == col) {
                cGame.availableCols.splice(i, 1);
                break;
            }
        }
    }
}

// check for horizontals, verticals, and diagonals
function checkIfWinnerC(cGame, move) {
    if (cGame.availableCols.length == 0) return "Tie!";
    let numWins = 0;
    let returnString;
    let val = cGame.board[move[0]][move[1]];

    if (val == "x") returnString = "You just won!";
    else if (val == "o") returnString = "You just lost!";

    // down
    for (let i = move[0]; i < 6; i++) {
        if (cGame.board[i][move[1]] == val) numWins++;
        else break;
    }
    if (numWins == 4) return returnString;
    else numWins = 0;

    // right and left
    for (let j = move[1]; j < 7; j++) {
        if (cGame.board[move[0]][j] == val) numWins++;
        else break;
    }
    for (j = move[1]; j >= 0; j--) {
        if (cGame.board[move[0]][j] == val) numWins++;
        else break;
    }
    numWins--;
    if (numWins == 4) return returnString;
    else numWins = 0;

    // diagonals
    let i = move[0];
    let j = move[1];
    while (i >= 0 && j < 7) {
        // top right
        if (cGame.board[i][j] == val) numWins++;
        else break;
        i--;
        j++;
    }
    i = move[0];
    j = move[1];
    while (i < 6 && j >= 0) {
        // bottom left
        if (cGame.board[i][j] == val) numWins++;
        else {
            i = move[0];
            j = move[1];
            break;
        }
        i++;
        j--;
    }
    numWins--;
    if (numWins == 4) return returnString;
    else numWins = 0;

    i = move[0];
    j = move[1];
    while (i >= 0 && j >= 0) {
        // top left
        if (cGame.board[i][j] == val) numWins++;
        else {
            i = move[0];
            j = move[1];
            break;
        }
        i--;
        j--;
    }
    i = move[0];
    j = move[1];
    while (i < 6 && j < 7) {
        // bottom right
        if (cGame.board[i][j] == val) numWins++;
        else {
            i = move[0];
            j = move[1];
            break;
        }
        i++;
        j++;
    }
    numWins--;
    if (numWins == 4) return returnString;
    else numWins = 0;

    return "No winner yet. Keep playing!";
}

// check one move ahead of the game to win against
// the player or to block user's winning move
function checkNextMoveC(cGame) {
    for (a = 0; a < 6; a++) {
        for (b = 0; b < 7; b++) {
            if (cGame.board[a][b] == "") {
                cGame.board[a][b] = "o";
                if (checkIfWinnerC(cGame, [a, b]) == "You just lost!") {
                    cGame.board[a][b] = "";
                    return [a, b];
                }
                cGame.board[a][b] = "";
            }
        }
    }
    for (a = 0; a < 6; a++) {
        for (b = 0; b < 7; b++) {
            if (cGame.board[a][b] == "") {
                cGame.board[a][b] = "x";
                if (checkIfWinnerC(cGame, [a, b]) == "You just won!") {
                    cGame.board[a][b] = "";
                    return [a, b];
                }
                cGame.board[a][b] = "";
            }
        }
    }
    return [-1, -1];
}

// check for an item in an array and return the index
function checkItemInArrayC(array, item) {
    for (i = 0; i < array.length; i++) {
        if (array[i] == item) {
            return i; // Found it
        }
    }
    return -1; // Not found
}

// check if the game instance exists. If yes, access it
// If no, create it and initialize members.
function evalInstanceC(idCheck, channelID) {
    for (i = 0; i < cGames.length; i++) {
        if (cGames[i].id == idCheck) {
            return cGames[i];
        }
    }
    let cGame = {
        id: idCheck,
        type: "connect4",
        board: [],
        availableCols: [],
    };
    initBoardC(cGame, idCheck, channelID);
    cGames.push(cGame);
    return cGame;
}

// initialize members in the game object
function initBoardC(cGame, userId, channelID) {
    for (i = 0; i < 6; i++) {
        cGame.board[i] = [];
        for (j = 0; j < 7; j++) {
            cGame.board[i][j] = "";
        }
    }
    for (i = 0; i < 7; i++) {
        cGame.availableCols[i] = i;
    }
    // insertCreditBot(userID,channelID,-2);
}

// display the current board of the game
function printBoardC(cGame, userID) {
    let boardString = "0 1 2 3 4 5 6 \n";
    for (i = 0; i < 6; i++) {
        boardString += "|";
        for (j = 0; j < 7; j++) {
            if (cGame.board[i][j] == "x" || cGame.board[i][j] == "o")
                boardString += cGame.board[i][j] + "|";
            else boardString += " |";
        }
        boardString += "\n";
    }
    boardString += " 0 1 2 3 4 5 6 \n";
    return boardString;
}
//-------------------------------------------------------------------------------------------------------------
/**
 * Main function to launch Blokus
 * @param {[]} piece - the piece to pin
 * @param {int} row - the row to pin the piece on
 * @param {int} col - the col to pin the piece on
 * @param {int} userID - the userID to pass modify credits to
 * @param {int} channelID - the channelID to modify credits to
 */
function playBlokus(piece, row, col, userID, channelID) {
    if (
        !isInt(piece) ||
        piece < 0 ||
        piece > 15 ||
        !isInt(row) ||
        row < 0 ||
        row > 15 ||
        !isInt(col) ||
        col < 0 ||
        col > 15
    ) {
        return "`Invalid Argument(s). Try again.`";
    }
    let bGame = evalInstanceB(userID, channelID);
    if (
        bGame.board[row][col] != "" ||
        !hasAtLeastOneDiagonal(bGame, [row, col], "x") ||
        !isValidMove(bGame, bGame.availablePiecesX[piece], row, col, "x")
    ) {
        return "Either the pieces' components are overlapping, the pieces are out of bounds, or the components are adjacent to other blocks. Try Again.";
    }
    //user move
    let result;
    result = markPiece(bGame, bGame.availablePiecesX[piece], row, col, "x");

    if (result == "N/A") {
        return "Block already used. Try Again.";
    }

    let indexOfPiece1 = findPiece(
        bGame.availablePiecesXS,
        bGame.availablePiecesX[piece]
    );
    console.log("indexOfPiece1");
    console.log(indexOfPiece1);
    bGame.availablePiecesXS.splice(indexOfPiece1, 1);
    bGame.availablePiecesX[piece] = "N/A";
    let winnerString = checkIfWinnerB(bGame, "x");
    if (winnerString == "You just won!" || winnerString == "You just lost!") {
        removeInstance(bGame);
        if (winnerString == "You just won!") {
            // insertCreditBot(userID,channelID, 9);
        }
        return (
            "<@!" +
            userID +
            ">" +
            "'s Blokus Board:\n\n   " +
            "`" +
            printBoardB(bGame, userID) +
            "\n" +
            winnerString +
            "`"
        );
    }

    //bot move
    let randomSpaceIndex = Math.floor(
        Math.random() * bGame.availableCells.length
    );
    let randomPieceAtRandomSpaceIndex = Math.floor(
        Math.random() * bGame.availablePiecesAtCell[randomSpaceIndex].length
    );
    let piece2 =
        bGame.availablePiecesAtCell[randomSpaceIndex][
            randomPieceAtRandomSpaceIndex
        ];
    markPiece(
        bGame,
        piece2,
        bGame.availableCells[randomSpaceIndex][0],
        bGame.availableCells[randomSpaceIndex][1],
        "o"
    );
    let indexOfPiece2 = findPiece(bGame.availablePiecesOS, piece2);

    bGame.availableCells = [];
    bGame.availablePiecesAtCell = [];
    bGame.availablePiecesOS.splice(indexOfPiece2, 1);
    bGame.availablePiecesO[randomPieceAtRandomSpaceIndex] = "N/A";
    winnerString = checkIfWinnerB(bGame, "o");
    let arrayStr = displayArray(bGame);
    bGame.availableCells = [];
    bGame.availablePiecesAtCell = [];
    if (winnerString == "You just won!" || winnerString == "You just lost!") {
        if (winnerString == "You just won!") {
            // insertCreditBot(userID,channelID, 9);
        }
        removeInstance(bGame);
    }
    return (
        "<@!" +
        userID +
        ">" +
        "'s Blokus Board:\n\n   " +
        "`" +
        printBoardB(bGame, userID) +
        "\n" +
        arrayStr +
        winnerString +
        "`"
    );
}

// Check if each component in the piece can fit on the board
// without being out of bound, overlapping, or having an adjacent
// component given a specified row and column
function isValidMove(bGame, piece, row, col, player) {
    if (piece == "N/A") return true;
    for (i = 1; i < piece.length; i++) {
        try {
            if (
                bGame.board[row + piece[i][0]][col + piece[i][1]] != "" ||
                hasAdjacent(bGame, row + piece[i][0], col + piece[i][1], player)
            )
                return false;
        } catch (err) {
            return false; // out of bounds
        }
    }
    return true;
}

// Check for at least one diagonal occupied block at the specified component
function hasAtLeastOneDiagonal(bGame, component, player) {
    try {
        if (bGame.board[component[0] - 1][component[1] - 1] == player)
            return true; //top left
    } catch (err) {
        /*Ignore out of bounds*/
    }
    try {
        if (bGame.board[component[0] - 1][component[1] + 1] == player)
            return true; // top right
    } catch (err) {
        /*Ignore out of bounds*/
    }
    try {
        if (bGame.board[component[0] + 1][component[1] - 1] == player)
            return true; // bottom left
    } catch (err) {
        /*Ignore out of bounds*/
    }
    try {
        if (bGame.board[component[0] + 1][component[1] + 1] == player)
            return true; // bottom right
    } catch (err) {
        /*Ignore out of bounds*/
    }
    return false;
}

// Check for any adjacent occupied block at specified row and column
function hasAdjacent(bGame, row, col, player) {
    try {
        if (bGame.board[row][col - 1] == player) return true; // left
    } catch (err) {
        /*Ignore out of bounds*/
    } // console.log("out of bounds -left");}
    try {
        if (bGame.board[row][col + 1] == player) return true; // right
    } catch (err) {
        /*Ignore out of bounds*/
    } // console.log("out of bounds -right");}
    try {
        if (bGame.board[row - 1][col] == player) return true; // up
    } catch (err) {
        /*Ignore out of bounds*/
    } // console.log("out of bounds -up");}
    try {
        if (bGame.board[row + 1][col] == player) return true; // down
    } catch (err) {
        /*Ignore out of bounds*/
    } // console.log("out of bounds -down");}
    return false;
}

// mark all the components in the piece on the board at row/col with marker
function markPiece(bGame, piece, row, col, player) {
    if (piece == "N/A") {
        return "N/A";
    }
    for (i = 1; i < piece.length; i++) {
        bGame.board[row + piece[i][0]][col + piece[i][1]] = player;
    }
}

// search for a piece in the shrink array and return the index
function findPiece(shrinkArray, p) {
    for (i = 0; i < shrinkArray.length; i++) {
        for (j = 1; j < shrinkArray[i].length; j++) {
            if (shrinkArray[i].length != p.length) {
                break;
            }
            if (
                shrinkArray[i][j][0] != p[j][0] ||
                shrinkArray[i][j][1] != p[j][1]
            ) {
                break;
            }
            if (j == shrinkArray[i].length - 1) {
                return i;
            }
        }
    }
    //console.log("Can't find the piece.");
}

// check all available cells and which corresponding pieces can
// be pinned to those cells and store them in the 2 temp arrays
function fillArrays(bGame, availablePieces, player) {
    for (a = 0; a < bGame.board.length; a++) {
        for (b = 0; b < bGame.board[a].length; b++) {
            if (bGame.board[a][b] != "") {
                continue;
            }
            let secondLayer = [];
            for (k = 0; k < availablePieces.length; k++) {
                if (
                    hasAtLeastOneDiagonal(bGame, [a, b], player) &&
                    isValidMove(bGame, availablePieces[k], a, b, player)
                ) {
                    secondLayer.push(availablePieces[k]);
                }
            }

            if (secondLayer.length != 0) {
                bGame.availableCells.push([a, b]);
                bGame.availablePiecesAtCell.push(secondLayer);
            }
        }
    }
}

// displays all the elements in an array
function displayArray(bGame) {
    let arrayStr = "Cells available for move: {";
    for (i = 0; i < bGame.availableCells.length; i++) {
        arrayStr +=
            "(" +
            bGame.availableCells[i][0] +
            ", " +
            bGame.availableCells[i][1] +
            ")";
    }
    arrayStr += "}";
    return arrayStr;
}

// check for no more moves
function checkIfWinnerB(bGame, player) {
    if (player == "x") {
        fillArrays(bGame, bGame.availablePiecesOS, "o");
        if (bGame.availablePiecesAtCell.length == 0) {
            return "You just won!";
        }
        return "No winner yet. Keep playing!";
    } else if (player == "o") {
        fillArrays(bGame, bGame.availablePiecesXS, "x");
        if (bGame.availablePiecesAtCell.length == 0) {
            return "You just lost!";
        }
        return "No winner yet. Keep playing!";
    }
}

// check if the game instance exists. If yes, access it
// If no, create it and initialize members.
function evalInstanceB(idCheck, channelID) {
    for (i = 0; i < bGames.length; i++) {
        if (bGames[i].id == idCheck) {
            return bGames[i];
        }
    }
    let bGame = {
        id: idCheck,
        type: "blokus",
        board: [],
        availableCells: [], // 2d array of empty cells
        availablePiecesAtCell: [], // 3d array analysis of ALL possible pieces that can fit into the cell
        availablePiecesX: arrayClone(pieces1), // pieces marked with N/A
        availablePiecesO: arrayClone(pieces2), // pieces marked with N/A
        availablePiecesXS: arrayClone(pieces1), // pieces that shrink for random search
        availablePiecesOS: arrayClone(pieces2), // pieces that shrink for random search
    };
    initBoardB(bGame, idCheck, channelID);
    bGames.push(bGame);
    return bGame;
}

// initialize members in the game object
function initBoardB(bGame, userID, channelID) {
    for (i = 0; i < bBoardSide; i++) {
        bGame.board[i] = [];
        for (j = 0; j < bBoardSide; j++) {
            bGame.board[i][j] = "";
        }
    }
    bGame.board[9][0] = "x"; // start player move on bottom left
    bGame.board[0][9] = "o"; // start bot move on top right

    // insertCreditBot(userID,channelID,-3);
}

// display the current board of the game
function printBoardB(bGame, userID) {
    let boardString = "0 1 2 3 4 5 6 7 8 9 \n";
    for (i = 0; i < bBoardSide; i++) {
        boardString += i + "|";
        for (j = 0; j < bBoardSide; j++) {
            if (bGame.board[i][j] == "x" || bGame.board[i][j] == "o")
                boardString += bGame.board[i][j] + "|";
            else boardString += " |";
        }
        boardString += i.toString(16) + "\n";
    }
    boardString += "  0 1 2 3 4 5 6 7 8 9 \n";
    boardString += printPieces(bGame.availablePiecesXS, "your");
    boardString += printPieces(bGame.availablePiecesOS, "cpu ");
    return boardString;
}

// displays each pieces individually
function printPieces(availablePiecesS, whose) {
    let piecesString = whose + " availablePieces: ";
    for (i = 0; i < availablePiecesS.length; i++) {
        if (i == availablePiecesS.length - 1) {
            piecesString += availablePiecesS[i][0];
            break;
        }
        piecesString += availablePiecesS[i][0] + ", ";
    }
    return piecesString + "\n";
}

// sample piece set for the player playing blokus
let pieces1 = [
    [0, [0, 0]], // 0
    [1, [0, 0], [0, 1]], // 1
    [2, [0, 0], [0, 1], [1, 1]], // 2
    [3, [0, 0], [0, 1], [0, 2]], // 3
    [4, [0, 0], [0, 1], [-1, 0], [-1, 1]], // 4
    [5, [0, 0], [0, 1], [0, 2], [-1, 1]], // 5
    [6, [0, 0], [0, 1], [0, 2], [0, 3]], // 6
    [7, [0, 0], [0, 1], [0, 2], [-1, 2]], // 7
    [8, [0, 0], [0, 1], [-1, 1], [-1, 2]], // 8
    [9, [0, 0], [0, 1], [0, 2], [-1, 1], [-2, 1]], // 9
    [10, [0, 0], [0, 1], [0, 2], [-1, 0], [-2, 0]], // 10
    [11, [0, 0], [0, 1], [-1, 1], [-1, 2], [-1, 3]], // 11
    [12, [0, 0], [-1, 0], [-1, 1], [-1, 2], [-2, 2]], // 12
    [13, [0, 0], [-1, 0], [-2, 0], [-3, 0], [-4, 0]], // 13
    [14, [0, 0], [0, 1], [-1, 0], [-1, 1], [-2, 0]], // 14
    [15, [0, 0], [-1, 0], [0, 1], [0, 2], [0, 3]], // 15
];

// sample piece set for the cpu playing blokus
let pieces2 = [
    [0, [0, 0]], // 0
    [1, [0, 0], [0, -1]], // 1
    [2, [0, 0], [0, -1], [1, 0]], // 2
    [3, [0, 0], [0, -1], [0, -2]], // 3
    [4, [0, 0], [0, -1], [1, 0], [1, -1]], // 4
    [5, [0, 0], [0, -1], [0, -2], [-1, -1]], // 5
    [6, [0, 0], [0, -1], [0, -2], [0, -3]], // 6
    [7, [0, 0], [1, 0], [1, -1], [1, -2]], // 7
    [8, [0, 0], [0, -1], [1, -1], [1, -2]], // 8
    [9, [0, 0], [1, 0], [2, 0], [2, 1], [2, -1]], // 9
    [10, [0, 0], [0, -1], [0, -2], [-1, -2], [-2, -2]], // 10
    [11, [0, 0], [0, -1], [0, -2], [1, -2], [1, -3]], // 11
    [12, [0, 0], [1, 0], [1, -1], [1, -2], [2, -2]], // 12
    [13, [0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], // 13
    [14, [0, 0], [1, 0], [2, 0], [1, 1], [2, 1]], // 14
    [15, [0, 0], [0, -1], [0, -2], [0, -3], [-1, -3]], // 15
];

/*
const exports = modules.export ={
	removeInstance: removeInstance,
	isInt: isInt,
	arrayClone: arrayClone,
	printCommandTable: printCommandTable,
	playTicTacToe: playTicTacToe,
	checkIfWinnerT: checkIfWinnerT,
	checkNextMoveT: checkNextMoveT,
	checkItemInArrayT: checkItemInArrayT,
	evalInstanceT: evalInstanceT,
	initBoardT: initBoardT,
	printBoardT: printBoardT,
	playConnect4: playConnect4,
	updateAvailableCols: updateAvailableCols,
	checkIfWinnerC: checkIfWinnerC,
	checkNextMoveC: checkNextMoveC,
	checkItemInArrayC: checkItemInArrayC,
	evalInstanceC: evalInstanceC,
	initBoardC: initBoardC,
	printBoardC: printBoardC,
	playBlokus: playBlokus,
	isValidMove: isValidMove,
	hasAtLeastOneDiagonal: hasAtLeastOneDiagonal,
	hasAdjacent: hasAdjacent,
	markPiece: markPiece,
	findPiece: findPiece,
	fillArrays: fillArrays,
	displayArray: displayArray,
	checkIfWinnerB: checkIfWinnerB,
	evalInstanceB: evalInstanceB,
	initBoardB: initBoardB,
	printBoardB: printBoardB,
	printPieces: printPieces,
};
*/

// use require at the end to give access to David to call functions
// callback function gets messageID. function delete the message given the messageID.
// store the messageID somewhere. beware that the line after might get executed before the call

// change log
// - new games: 2048, connect-4
// maybe a bit of implementation
