let gameState = {
    categories: [],
    players: {},
    currentQuestion: null,
};

export function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const categories = {};

    for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',');
        const categoryName = data[0];
        if (!categories[categoryName]) {
            categories[categoryName] = [];
        }
        categories[categoryName].push({
            question: data[1],
            answer: data[2],
            value: parseInt(data[3]),
            image: data[4]
        });
    }
    gameState.categories = Object.entries(categories).map(([name, questions]) => ({ name, questions }));
}

export function addPlayer(playerId) {
    if (!gameState.players[playerId]) {
        gameState.players[playerId] = { score: 0 };
    }
}

export function updateScore(playerId, value) {
    if (gameState.players[playerId]) {
        gameState.players[playerId].score += value;
    }
}

export function getGameState() {
    return gameState;
}

export function mergeCategories(newCategories) {
    gameState.categories = [...gameState.categories, ...newCategories];
}
