let players = [];
let matchups = [];
let decks = [];
let deckMatchups = []; 

// Util Functions
function isDeckUsedByPlayer(deckName, player) {
    return player.usedDecks.includes(deckName) || player.ownDeck === deckName;
}

function hasPlayerFaced(player1, player2) {
    return player1.opponents.includes(player2.id);
}

// Populate Select with Options
function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select an option</option>';
    options.forEach(option => {
        const disabledStyle = option.disabled ? 'style="color:red;"' : '';
        select.innerHTML += `<option ${disabledStyle} value="${option.value}">${option.label}</option>`;
    });
}

// Get Player Options
function getPlayerOptions(excludeId, excludeOpponentsOf = null) {
    let baseOptions = players.filter(player => !player.inMatch && player.id !== excludeId);

    // If we have a player whose opponents need to be excluded, filter them out
    if (excludeOpponentsOf) {
        const player = players.find(p => p.id === excludeOpponentsOf);
        baseOptions = baseOptions.filter(optionPlayer => !player.opponents.includes(optionPlayer.id));
    }

    return baseOptions.map(player => ({ value: player.id, label: player.name }));
}

function getDeckOptions(excludeDeck, playerUsedDecks) {
    return decks
        .map(deck => ({
            value: deck.name,
            label: deck.name,
            disabled: playerUsedDecks.includes(deck.name) ||
                      deck.name === excludeDeck ||
                      isDeckInMatch(deck.name) ||
                      hasDecksMatched(excludeDeck, deck.name)
        }));
}

// Check if two decks have already matched
function hasDecksMatched(deck1, deck2) {
    return deckMatchups.some(match => 
        (match.deck1 === deck1 && match.deck2 === deck2) || 
        (match.deck1 === deck2 && match.deck2 === deck1));
}

// Check if a deck is in a match
function isDeckInMatch(deck) {
    return matchups.some(match => match.deck1 === deck || match.deck2 === deck);
}

// Function to count how many times a deck has been matched
function countDeckMatchups(deckName) {
    return deckMatchups.filter(match => match.deck1 === deckName || match.deck2 === deckName).length;
}

// Add a player
function addPlayer() {
    let playerName = document.getElementById('playerName').value;
    let playerDeck = document.getElementById('playerDeck').value;

    if(!decks.some(deck => deck.name === playerDeck)) {
        decks.push({name: playerDeck, score: 0});
    }

    if (playerName && playerDeck && !players.some(p => p.ownDeck === playerDeck)) {
        players.push({
            id: `p${players.length + 1}`,
            name: playerName,
            ownDeck: playerDeck,
            usedDecks: [],
            opponents: [],
            inMatch: false,
            gamesPlayed: 0,
            score: 0,   // Initialize score to 0 for each player
            consecutiveWins: 0  // Initialize consecutive wins to 0 for each player
        });
        document.getElementById('playerName').value = '';
        document.getElementById('playerDeck').value = '';
        displayPlayers();
        populatePlayer1Select();
    } else {
        alert('Player name or deck missing, maximum players added, or deck already in use.');
    }
}

// Display Player Details
function displayPlayers() {
    let playerList = document.getElementById('playerList');
    playerList.innerHTML = '';
    players.forEach(player => {
        playerList.innerHTML += `<li>${player.name} 
        <br> - Games Played: ${player.gamesPlayed}
        <br> - Own Deck: ${player.ownDeck} 
        <br> - Played Decks: ${player.usedDecks.join(", ")} 
        <br> - Faced Opponents: ${player.opponents.map(opponentId => players.find(p => p.id === opponentId).name).join(", ")}
        </li>`;
    });
}

// Populate Player 1 Select Options
function populatePlayer1Select() {
    populateSelect('player1Select', getPlayerOptions());
    updateDeck1Options();
}

// Update Deck 1 Options
function updateDeck1Options() {
    const player1Id = document.getElementById('player1Select').value;
    if (player1Id) {
        const player1 = players.find(p => p.id === player1Id);
        populateSelect('deck1Select', getDeckOptions(player1.ownDeck, player1.usedDecks));
    }
    updatePlayer2Options();
}

// Update Player 2 Options
function updatePlayer2Options() {
    const player1Id = document.getElementById('player1Select').value;
    populateSelect('player2Select', getPlayerOptions(player1Id, player1Id)); // Pass player1Id twice
    updateDeck2Options();
}

// Update Deck 2 Options
function updateDeck2Options() {
    const player1Id = document.getElementById('player1Select').value;
    const player2Id = document.getElementById('player2Select').value;
    const deck1 = document.getElementById('deck1Select').value;
    if (player1Id && player2Id) {
        const player2 = players.find(p => p.id === player2Id);
        populateSelect('deck2Select', getDeckOptions(deck1, [...player2.usedDecks, deck1, player2.ownDeck]));
    }
}

// Display Current Matchups
function displayMatchups() {
    let matchupList = document.getElementById('matchupList');
    matchupList.innerHTML = '';
    matchups.forEach((match, index) => {
        matchupList.innerHTML += `<li><h4>${match.player1} with deck:  ${match.deck1}</h4>   VS  <h4> ${match.player2} with deck:  ${match.deck2}</h4>
        <button onclick="endMatch(${index})">End Match</button></li>`;
    });
}

function createMatchup() {
    // 1. Fetch the selected player and deck values
    const player1Id = document.getElementById('player1Select').value;
    const player2Id = document.getElementById('player2Select').value;
    const deck1 = document.getElementById('deck1Select').value;
    const deck2 = document.getElementById('deck2Select').value;

    // 2. Basic Validations
    if (player1Id && player2Id && deck1 && deck2) {
        const player1 = players.find(p => p.id === player1Id);
        const player2 = players.find(p => p.id === player2Id);

        // 3. Validation for the same player deck
        if(deck1 === player1.ownDeck || deck2 === player2.ownDeck) {
            alert('Players cannot play with their own deck. Please choose different decks.');
            return;
        }
        
        // 4. Validation for player matchups
        if(hasPlayerFaced(player1, player2)) {
            alert('These players have already faced each other. Choose different players.');
            return;
        }

        // 5. Updating the matchups and deckMatchups arrays
        matchups.push({
            player1: player1.name,
            player2: player2.name,
            deck1: deck1,
            deck2: deck2
        });

        deckMatchups.push({ deck1: deck1, deck2: deck2 });

        // 6. Updating the players' details
        player1.usedDecks.push(deck1);
        player2.usedDecks.push(deck2);
        player1.opponents.push(player2.id);
        player2.opponents.push(player1.id);
        player1.inMatch = true;
        player2.inMatch = true;

        // 7. Refresh the views
        displayMatchups();
        populatePlayer1Select();
        displayDeckMatchups();
    }
}


let currentMatchIndex;

// End the Match and Show Modal
function endMatch(index) {
    currentMatchIndex = index;
    const modal = document.getElementById('endMatchModal');
    const match = matchups[index];
    
    document.getElementById('deck1WinBtn').innerText = match.deck1;
    document.getElementById('deck2WinBtn').innerText = match.deck2;
    
    modal.style.display = "block";
}

// Close the Modal
function closeModal() {
    document.getElementById('endMatchModal').style.display = "none";
}

// Display Deck Scores
function displayDeckScores() {
    decks.sort((a, b) => b.score - a.score);
    const deckScoreList = document.getElementById('deckScoreList');
    deckScoreList.innerHTML = '';
    decks.forEach(deck => {
        deckScoreList.innerHTML += `<li>${deck.name} : ${deck.score} points</li>`;
    });
}

// Display Deck Matchups
function displayDeckMatchups() {
    const deckMatchupList = document.getElementById('deckMatchupList');
    deckMatchupList.innerHTML = '';
    deckMatchups.forEach(deckMatchup => {
        deckMatchupList.innerHTML += `<li>${deckMatchup.deck1} vs ${deckMatchup.deck2}</li>`;
    });
}

// Display Player Scores
function displayPlayerScores() {
    players.sort((a, b) => b.score - a.score);
    const playerScoreList = document.getElementById('playerScoreList');
    playerScoreList.innerHTML = '';
    players.forEach(player => {
        playerScoreList.innerHTML += `<li>${player.name} : ${player.score} points</li>`;
    });
}


function resolveMatch(outcome) {
    const match = matchups[currentMatchIndex];
    let deck1 = decks.find(deck => deck.name === match.deck1);
    let deck2 = decks.find(deck => deck.name === match.deck2);

    const maxMatchups = players.length - 1;

    const player1 = players.find(p => p.name === match.player1);
    const player2 = players.find(p => p.name === match.player2);

    switch(outcome) {
        case 'deck1':
            if (countDeckMatchups(deck1.name) <= maxMatchups) {
                deck1.score += 3;
                player1.score += 3;
            }
            player1.consecutiveWins++;  // Increment consecutive wins for player1
            player2.consecutiveWins = 0;  // Reset consecutive wins for player2

            // Check for consecutive wins bonus for player1
            if (player1.consecutiveWins === 2) {
                player1.score += 1;  // Bonus point for two consecutive wins
                player1.consecutiveWins = 0;  // Reset the counter
            }
            break;

        case 'deck2':
            if (countDeckMatchups(deck2.name) <= maxMatchups) {
                deck2.score += 3;
                player2.score += 3;
            }
            player2.consecutiveWins++;  // Increment consecutive wins for player2
            player1.consecutiveWins = 0;  // Reset consecutive wins for player1

            // Check for consecutive wins bonus for player2
            if (player2.consecutiveWins === 2) {
                player2.score += 1;  // Bonus point for two consecutive wins
                player2.consecutiveWins = 0;  // Reset the counter
            }
            break;

        case 'draw':
            if (countDeckMatchups(deck1.name) <= maxMatchups) {
                deck1.score += 1;
                player1.score += 1;
            }
            if (countDeckMatchups(deck2.name) <= maxMatchups) {
                deck2.score += 1;
                player2.score += 1;
            }
            player1.consecutiveWins = 0;  // Reset consecutive wins for player1
            player2.consecutiveWins = 0;  // Reset consecutive wins for player2
            break;
    }

    player1.gamesPlayed++;  // Increment games played for player 1
    player2.gamesPlayed++;  // Increment games played for player 2

    player1.inMatch = false;
    player2.inMatch = false;
    matchups.splice(currentMatchIndex, 1);

    displayMatchups();
    populatePlayer1Select();
    displayPlayers();
    closeModal();
    displayDeckScores();
    displayDeckMatchups();
    displayPlayerScores();
}









