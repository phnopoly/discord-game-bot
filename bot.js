const Discord = require('discord.io');
var auth = require('./auth.json');

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    console.log('Logged in as %s - %s\n', bot.username, bot.id);
});

//var loseString = "You just lost!";
//var winString = "You just won!";
//var tieString = "Tie!";

var tGames = [];
var cGames = [];
var bGames = [];

var boardSide = 3; //adjust for testing
var bBoardSide = 16;

// Make an array of objects with username and gamestates

bot.on('message', function (user, userID, channelID, message, evt) {
		// Bot will listen for messages that will start with `$`
		// Phong first arg, Mike second arg, General for later on
		if ((channelID == 408777670030000129 || channelID == 408777712661168129) && (message.substring(0, 1) == '$')){
			var args = message.substring(1).split(' ');
			var cmd = args[0]; 
			args = args.splice(1);
			switch(cmd) {				
				case 'date':
					bot.sendMessage({
						to: channelID,
						message: "`"+current.toString()+"`",
					});
					break;
				case 'help':
					bot.sendMessage({
						to: channelID,
						message: "`"+printCommandTable()+"`",
					});
					break;
				case 'getchID':
					bot.sendMessage({
						to: channelID,
						message: channelID,
					});
					break;
				case 't':
					var row = args[0], col = args[1];
					if (!isInt(row) || !isInt(col)){
						bot.sendMessage({
						to: channelID,
						message: "`Invalid Argument(s). Try again.`",
						});
						break;
					}

					var tGame = evalInstanceT(userID);
					if(row < 0 || row > boardSide-1 || col < 0 || col > boardSide-1 ||(tGame.board[row][col] != "")){
						bot.sendMessage({
						to: channelID,
						message: "`Out of bound or cell not available. Try again.`",
						});
						break;
					}

					// player move
					tGame.board[row][col] = "x";
					var index = checkItemInArrayT(tGame.availableCells,[row,col]);
					tGame.availableCells.splice(index, 1);
					var winnerString = checkIfWinnerT(tGame);
					if(winnerString == "You just won!" || winnerString == "You just lost!" || winnerString == "Tie!"){
						bot.sendMessage({
							to: channelID,
							message: "`"+printBoardT(tGame) + winnerString+"`",
						});
						removeInstance(tGame);
						break;
					}

					// bot move
					var move = checkNextMoveT(tGame);
					if (move[0] == -1 && move[1] == -1){ // random move
						console.log("random move");
						var indexOfCellToBeRemoved = Math.floor(Math.random() * tGame.availableCells.length);
					} 
					else{ // smart move
						console.log("smart move");
						var indexOfCellToBeRemoved = checkItemInArrayT(tGame.availableCells,[move[0],move[1]]);
					}
					move = tGame.availableCells[indexOfCellToBeRemoved];
					tGame.board[move[0]][move[1]] = "o";
					tGame.availableCells.splice(indexOfCellToBeRemoved, 1);

					var winnerString = checkIfWinnerT(tGame);
					bot.sendMessage({
						to: channelID,
						message: "`"+printBoardT(tGame, user) + winnerString+"`",
					});
					if(winnerString == "You just won!" || winnerString == "You just lost!" || winnerString == "Tie!"){
						removeInstance(tGame);
					}
					break;
				case "pt":
					var tGame = evalInstanceT(userID);
					bot.sendMessage({
						to: channelID,
						message: "`"+printBoardT(tGame, user)+"`",
					});
					break;
				case "c":
					var col = args[0];
					if (!isInt(col) || col < 0 || col > 6){
						bot.sendMessage({
						to: channelID,
						message: "`Invalid Argument. Try again.`",
						});
						break;
					}
					var cGame = evalInstanceC(userID);
					if ((cGame.board[0][col] != "")){
						bot.sendMessage({
						to: channelID,
						message: "`Column Full. Try again.`",
						});
						break;
					}

					// player move
					var row;
					for(var i = 5; i >= 0; i--){
						if(cGame.board[i][col] != "x" && cGame.board[i][col] != "o"){
							cGame.board[i][col] = "x";
							row = i;
							break;
						} 
					}
					updateAvailableCols(cGame, col);
					var winnerString = checkIfWinnerC(cGame, [row, col]);
					if(winnerString == "You just won!" || winnerString == "You just lost!" || winnerString == "Tie!"){
						bot.sendMessage({
							to: channelID,
							message: "`"+printBoardC(cGame, user) + winnerString+"`",
						});
						removeInstance(cGame);
						break;
					}

					// bot move
					var move = checkNextMoveC(cGame);
					if (move[0] == -1 && move[1] == -1){ // random move
						console.log("random move");
						var indexOfCellToBeRemoved = Math.floor(Math.random() * cGame.availableCols.length);
					} 
					else{ // smart move
						console.log("smart move");
						var indexOfCellToBeRemoved = checkItemInArrayC(cGame.availableCols, move[1]);
					}
					col = cGame.availableCols[indexOfCellToBeRemoved];
					for(i = 5; i >= 0; i--){
						if(cGame.board[i][col] != "x" && cGame.board[i][col] != "o"){
							row = i;
							break;
						} 
					}
					cGame.board[row][col] = "o";
					if(cGame.board[0][col] == "x" || cGame.board[0][col] == "o"){
						cGame.availableCols.splice(indexOfCellToBeRemoved, 1);
					}

					var winnerString = checkIfWinnerC(cGame, [row, col]);
					bot.sendMessage({
						to: channelID,
						message: "`"+printBoardC(cGame, user) + winnerString+"`",
					});
					if(winnerString == "You just won!" || winnerString == "You just lost!" || winnerString == "Tie!"){
						removeInstance(cGame);
					}
					break;
				case "pc":
					var cGame = evalInstanceC(userID);
					bot.sendMessage({
						to: channelID,
						message: "`"+printBoardC(cGame, user)+"`",
					});
					break;
				case "b":
					var piece = parseInt(args[0]), row = parseInt(args[1]), col = parseInt(args[2]);
					if (!isInt(piece) || piece < 0 || piece > 15 || !isInt(row) || row < 0 || row > 15 || !isInt(col) || col < 0 || col > 15){
						bot.sendMessage({
						to: channelID,
						message: "`Invalid Argument(s). Try again.`",
						});
						break;
					}

					var bGame = evalInstanceB(userID);
					//console.log(bGame.board[row][col] != "");
					//console.log(!hasAtLeastOneDiagonal(bGame, [row,col]));
					//console.log(!isValidMove(piece, row, col));
					//console.log(pieces[piece] + ", "+[row,col])
					if (bGame.board[row][col] != "" || !hasAtLeastOneDiagonal(bGame, [row,col]) || !isValidMove(pieces[piece], row, col)){
						bot.sendMessage({
						to: channelID,
						message: "Either the pieces' components are overlapping, the pieces are out of bounds, or the components are adjacent to other blocks. Try Again.",
						});
						break;
					}

					//tGame.board[row][col] = "x";
					markPiece(bGame, pieces[piece], row, col, "x");

					//var index = checkItemInArrayT(tGame.availableCells,[row,col]);
					//tGame.availableCells.splice(index, 1);
					//var winnerString = checkIfWinnerT(tGame);
					//if(winnerString == "You just won!" || winnerString == "You just lost!" || winnerString == "Tie!"){
						bot.sendMessage({
							to: channelID,
							message: "`"+printBoardB(bGame) +"`",
						});
						//removeInstance(tGame);
						break;
					//}


					break;
				case "pb":
					var bGame = evalInstanceB(userID);
					bot.sendMessage({
						to: channelID,
						message: "`"+printBoardB(bGame, user)+"`",
					});
					break;
				default:
					bot.sendMessage({
						to: channelID,
						message: "<@!" + userID + ">" + ' No commands matching! Type !help for list of commands',
					});
			}
		}	
});
//-------------------------------------------------------------------------------------------------------------
function removeInstance(game){
	if(game.type == "tictactoe"){
		for(i = 0; i < tGames.length; i++){
			if(tGames[i].id == game.id){
				tGames.splice(i, 1);
				return;
			}
		}
	}
	else if(game.type == "connect4"){
		for(i = 0; i < cGames.length; i++){
			if(cGames[i].id == game.id){
				cGames.splice(i, 1);
				return;
			}
		}
	}
	else if(game instanceof bGame){
		for(i = 0; i < cGames.length; i++){
			if(bGames[i].id == game.id){
				bGames.splice(i, 1);
				return;
			}
		}
	}
	else{
		console.log("Error should not be printing. Not an instance of any games");
	}
}

// https://www.sitepoint.com/delay-sleep-pause-wait/
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

// https://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
function isInt(value) {
  return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
}

function printCommandTable(){
	var command = "List of commands:\n" +
				  "$date	    --get the current time\n" +
				  "$help		--print out the table of bot commands\n" +
				  "$t row col   --enter an x on specified row/column on the tictactoe board\n" +
				  "$pt          --print the tictactoe board";
	return command;
}
//-------------------------------------------------------------------------------------------------------------
// check for horizontals, verticals, and diagonals
function checkIfWinnerT(tGame){
	if(tGame.availableCells.length == 0){
		return "Tie!"
	}
	var numWins = 0;
	//horizontals
	for(i = 0; i < boardSide; i++){
		for(j = 0; j < boardSide; j++){
			if(tGame.board[i][j] == "x")
				numWins++;
			else if(tGame.board[i][j] == "o")
				numWins--;
		}
		if(numWins == boardSide)
			return "You just won!"
		else if(numWins == -boardSide)
			return "You just lost!"
		else
			numWins = 0;
	}
	//verticals
	for(j = 0; j < boardSide; j++){
		for(i = 0; i < boardSide; i++){
			if(tGame.board[i][j] == "x")
				numWins++;
			else if(tGame.board[i][j] == "o")
				numWins--;
		}
		if(numWins == boardSide)
			return "You just won!"
		else if(numWins == -boardSide)
			return "You just lost!"
		else
			numWins = 0;
	}
	//diagonals
	for(i = 0; i < boardSide; i++){
		if(tGame.board[i][i] == "x")
			numWins++;
		else if(tGame.board[i][i] == "o")
			numWins--;
	}
	if(numWins == boardSide)
		return "You just won!"
	else if(numWins == -boardSide)
		return "You just lost!"
	else
		numWins = 0;

	for(i = 0; i < boardSide; i++){
		if(tGame.board[i][boardSide-1 - i] == "x")
			numWins++;
		else if(tGame.board[i][boardSide-1 - i] == "o")
			numWins--;
	}
	if(numWins == boardSide)
		return "You just won!"
	else if(numWins == -boardSide)
		return "You just lost!"
	else
		numWins = 0;
	
	return "No winner yet. Keep playing!";
}

// check one move ahead of the game to win against 
// the player or to block user's winning move
function checkNextMoveT(tGame){
	for(a = 0; a < boardSide; a++){
		for(b = 0; b < boardSide; b++){
			if(tGame.board[a][b] == ""){
				tGame.board[a][b] = "o";
				if(checkIfWinnerT(tGame) == "You just lost!"){
					tGame.board[a][b] = "";
					return [a,b];
				} 
				tGame.board[a][b] = "";
			}
		}
	}
	for(a = 0; a < boardSide; a++){
		for(b = 0; b < boardSide; b++){
			if(tGame.board[a][b] == ""){
				tGame.board[a][b] = "x";
				if(checkIfWinnerT(tGame) == "You just won!"){
					tGame.board[a][b] = "";
					return [a,b];
				}
				tGame.board[a][b] = "";
			}
		}
	}
	return [-1,-1];
}

//https://stackoverflow.com/questions/24943200/javascript-2d-array-indexof
function checkItemInArrayT(array, item) {
    for (var i = 0; i < array.length; i++) {
        // This if statement depends on the format of your array
        if (array[i][0] == item[0] && array[i][1] == item[1]) {
            return i;   // Found it
        }
    }
    return -1;   // Not found
}

function evalInstanceT(idCheck){
	for(var i = 0; i < tGames.length; i++){
		if(tGames[i].id == idCheck){
			return tGames[i];
		}
	}
	var tGame = {
		id: idCheck,
		type: "tictactoe",
		board: [],
		availableCells: []
	}
	initBoardT(tGame);
	tGames.push(tGame);
	return tGame;
}

// reset both the board and the array of indexes
function initBoardT(tGame){
	for(i = 0; i < boardSide; i++){
		tGame.board[i] = [];
		for(j = 0; j < boardSide; j++){
			tGame.board[i][j] = "";
			tGame.availableCells[i*boardSide+j] = [i,j];
		}
	}
}

// display the board as a string
function printBoardT(tGame, user){
	var boardString = user + "'s TicTacToe Board:\n  0 1 2 \n";
	for (i = 0; i < boardSide; i++) { 
		boardString += i+"|";
    	for (j = 0; j < boardSide; j++) { 
    		if(tGame.board[i][j] == "x" || tGame.board[i][j] == "o")
    			boardString += tGame.board[i][j] + "|";
    		else
    			boardString += " |";
    	}
    	boardString += "\n";
    }
	return boardString;
}
//-------------------------------------------------------------------------------------------------------------
function updateAvailableCols(cGame, col){
	if(cGame.board[0][col] == "x" || cGame.board[0][col] == "o"){
		for(i = 0; i < cGame.availableCols.length; i++){
			if(cGame.availableCols[i] == col){
				cGame.availableCols.splice(i, 1);
				break;
			}
		}
	}
}

function checkIfWinnerC(cGame, move){
	if(cGame.availableCols.length == 0)
		return "Tie!"
	var numWins = 0;
	var returnString;
	var val = cGame.board[move[0]][move[1]];
	if(val == "x") returnString = "You just won!";
	else if(val == "o") returnString = "You just lost!";

	//down
	for(i = move[0]; i < 6; i++){
		if(cGame.board[i][move[1]] == val)
			numWins++;
		else
			break;
	}
	if(numWins == 4) return returnString;
	else numWins = 0;

	//right and left
	for(j = move[1]; j < 7; j++){
		if(cGame.board[move[0]][j] == val)
			numWins++;
		else
			break;
	}
	//console.log("numWins after right move: "+numWins);
	for(j = move[1]; j >= 0; j--){
		if(cGame.board[move[0]][j] == val)
			numWins++;
		else
			break;
	}
	numWins--;
	//console.log("numWins after left move: "+numWins);
	if (numWins == 4) return returnString;
	else numWins = 0;

	//diagonals
	var i = move[0]; var j = move[1];
	while(i >= 0 && j < 7){ //top right
		if(cGame.board[i][j] == val)
			numWins++;
		else
			break;
		i--; j++;
	}
	i = move[0]; j = move[1];
	while(i < 6 && j >= 0){ //bottom left
		if(cGame.board[i][j] == val)
			numWins++;
		else{
			i = move[0]; j = move[1];
			break;}
		i++; j--;
	}
	numWins--;
	if(numWins == 4) return returnString;
	else numWins = 0;

	var i = move[0]; var j = move[1];
	while(i >= 0 && j >= 0){ //top left
		if(cGame.board[i][j] == val)
			numWins++;
		else{
			i = move[0]; j = move[1];
			break;}
		i--; j--;
	}
	i = move[0]; j = move[1];
	while(i < 6 && j < 7){ //bottom right
		if(cGame.board[i][j] == val)
			numWins++;
		else{
			i = move[0]; j = move[1];
			break;}
		i++; j++;
	}
	numWins--;
	if(numWins == 4) return returnString;
	else numWins = 0;

	return "No winner yet. Keep playing!";
}

function checkNextMoveC(cGame){
	for(a = 0; a < 6; a++){
		for(b = 0; b < 7; b++){
			if(cGame.board[a][b] == ""){
				cGame.board[a][b] = "o";
				if(checkIfWinnerC(cGame, [a,b]) == "You just lost!"){
					cGame.board[a][b] = "";
					return [a,b];
				} 
				cGame.board[a][b] = "";
			}
		}
	}
	for(a = 0; a < 6; a++){
		for(b = 0; b < 7; b++){
			if(cGame.board[a][b] == ""){
				cGame.board[a][b] = "x";
				if(checkIfWinnerC(cGame, [a,b]) == "You just won!"){
					cGame.board[a][b] = "";
					return [a,b];
				}
				cGame.board[a][b] = "";
			}
		}
	}
	return [-1,-1];
}

function checkItemInArrayC(array, item) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == item) {
            return i;   // Found it
        }
    }
    return -1;   // Not found
}

function evalInstanceC(idCheck){
	for(var i = 0; i < cGames.length; i++){
		if(cGames[i].id == idCheck){
			return cGames[i];
		}
	}
	var cGame = {
		id: idCheck,
		type: "connect4",
		board: [],
		availableCols: []
	}
	initBoardC(cGame);
	cGames.push(cGame);
	return cGame;
}

function initBoardC(cGame){
	for(i = 0; i < 6; i++){
		cGame.board[i] = [];
		for(j = 0; j < 7; j++){
			cGame.board[i][j] = "";
		}
	}
	for(i = 0; i < 7; i++){
		cGame.availableCols[i] = i;
	}
}

// display the board as a string
function printBoardC(cGame, user){
	var boardString = user + "'s Connect-4 Board:\n 0 1 2 3 4 5 6 \n";
	for (i = 0; i < 6; i++) { 
		boardString += "|";
    	for (j = 0; j < 7; j++) { 
    		if(cGame.board[i][j] == "x" || cGame.board[i][j] == "o")
    			boardString += cGame.board[i][j] + "|";
    		else
    			boardString += " |";
    	}
    	boardString += "\n"
    }
    boardString += " 0 1 2 3 4 5 6 \n"
	return boardString;
}
//-------------------------------------------------------------------------------------------------------------
function isValidMove(bGame, piece, row, col){
/*
		for each component in the piece
			check if its empty
			check for no adjacents
*/
	for(i = 0; i < piece.length; i++){
		try{
			if(bGame.board[row+piece[i][0]][col+piece[i][1]] != "" || hasAdjacent(bGame, piece[i]))
				return false;
		}
		catch(err){
			return false;
		}
	}
	return true;
}

/*
for each cell on the board
	check if its empty
	check for at least 1 diagonal
	check for no adjacents
	for each piece that can fit in the cell
		for each component in the piece
			check if its empty
			check for no adjacents

	*components and cells can be thought of as the same
*/

function hasAtLeastOneDiagonal(bGame, component){
	try {
		if(bGame.board[component[0]-1][component[1]-1] != "")return true; //top left
	}
	catch(err) {/*Ignore out of bounds*/}
	try {
		if(bGame.board[component[0]-1][component[1]+1] != "")return true; //top right
	}
	catch(err) {/*Ignore out of bounds*/}
	try {
		if(bGame.board[component[0]+1][component[1]-1] != "")return true; //bottom left
	}
	catch(err) {/*Ignore out of bounds*/}
	try {
		if(bGame.board[component[0]+1][component[1]+1] != "")return true; //bottom right
	}
	catch(err) {/*Ignore out of bounds*/}
	return false;
}

function hasAdjacent(bGame, component){
	try {
		if(bGame.board[component[0]][component[1]-1] != "")return true; //left
	}
	catch(err) {/*Ignore out of bounds*/}
	try {
		if(bGame.board[component[0]][component[1]+1] != "")return true; //right
	}
	catch(err) {/*Ignore out of bounds*/}
	try {
		if(bGame.board[component[0]-1][component[1]] != "")return true; //up
	}
	catch(err) {/*Ignore out of bounds*/}
	try {
		if(bGame.board[component[0]+1][component[1]] != "")return true; //down
	}
	catch(err) {/*Ignore out of bounds*/}
	return false;
}

function markPiece(bGame, piece, row, col, marker){
	for(i = 0; i < piece.length; i++){
		bGame.board[row+piece[i][0]][col+piece[i][1]] = marker;
		//console.log((row+piece[i][0])+", "+(col+piece[i][1]));
	}
}

function evalInstanceB(idCheck){
	for(var i = 0; i < bGames.length; i++){
		if(bGames[i].id == idCheck){
			return bGames[i];
		}
	}
	var bGame = {
		id: idCheck,
		type: "blokus",
		board: [],
		availableCells: [],
		availablePiecesAtCell: [],
		availablePieces: pieces,
		availablePiecesO: pieces
	}
	initBoardB(bGame);
	bGames.push(bGame);
	return bGame;
}

function initBoardB(bGame){
	for(i = 0; i < 16; i++){
		bGame.board[i] = [];
		for(j = 0; j < 16; j++){
			bGame.board[i][j] = "";
		}
	}
	bGame.board[15][0] = "x";
	bGame.board[0][15] = "o";
}

function printBoardB(bGame, user){
	var boardString = user + "'s Blokus Board:\n  0 1 2 3 4 5 6 7 8 9 a b c d e f  \n";
	for (i = 0; i < bBoardSide; i++) { 
		boardString += i.toString(16)+"|";
    	for (j = 0; j < bBoardSide; j++) { 
    		if(bGame.board[i][j] == "x" || bGame.board[i][j] == "o")
    			boardString += bGame.board[i][j] + "|";
    		else
    			boardString += " |";
    	}
    	boardString += i.toString(16)+"\n"
    }
    boardString += "  0 1 2 3 4 5 6 7 8 9 a b c d e f  \n";
	return boardString;
}


var pieces = [
	[[0,0]],								// 0
	[[0,0],[0,1]],							// 1
	[[0,0],[0,1],[1,1]],					// 2
	[[0,0],[0,1],[0,2]],					// 3
	[[0,0],[0,1],[1,0],[1,1]],				// 4
	[[0,0],[0,1],[0,2],[-1,1]],				// 5
	[[0,0],[0,1],[0,2],[0,3]],				// 6
	[[0,0],[0,1],[0,2],[-1,2]],				// 7
	[[0,0],[0,1],[-1,1],[-1,2]],			// 8
	[[0,0],[-1,0],[0,1],[0,2],[0,3]],		// 9
	[[0,0],[0,1],[0,2],[-1,1],[-2,1]],		// 10
	[[0,0],[0,1],[0,2],[-1,0],[-2,0]],		// 11
	[[0,0],[0,1],[-1,1],[-1,2],[-1,3]],		// 12
	[[0,0],[-1,0],[-1,1],[-1,2],[-2,2]],	// 13
	[[0,0],[-1,0],[-2,0],[-3,0],[-4,0]],	// 14
	[[0,0],[0,1],[-1,0],[-1,1],[-2,0]]		// 15
];



/*
for each cell on the board
	check if its empty
	check for at least 1 diagonal
	check for no adjacents
	for each piece that can fit in the cell
		for each component in the piece
			check if its empty
			check for no adjacents

*/


// Tagging: "<@!" + user + ">"