import { parseCSV, addPlayer, updateScore, getGameState, mergeCategories } from '../src/scripts/game-logic';

describe('Game Logic', () => {
    let gameState;

    beforeEach(() => {
        gameState = getGameState();
        // Reset game state before each test
        gameState.categories = [];
        gameState.players = {};
        gameState.currentQuestion = null;
    });

    test('should parse CSV data correctly', () => {
        const csvData = `Category,Question,Answer,Value,Image\nScience,What is H2O?,Water,100,water.jpg`;
        parseCSV(csvData);
        expect(gameState.categories).toHaveLength(1);
        expect(gameState.categories[0].name).toBe('Science');
        expect(gameState.categories[0].questions).toHaveLength(1);
        expect(gameState.categories[0].questions[0].value).toBe(100);
    });

    test('should add a new player', () => {
        addPlayer('player1');
        expect(gameState.players['player1']).toBeDefined();
        expect(gameState.players['player1'].score).toBe(0);
    });

    test('should update a player\'s score', () => {
        addPlayer('player1');
        updateScore('player1', 100);
        expect(gameState.players['player1'].score).toBe(100);
    });

    test('should merge new categories', () => {
        const initialCategories = [{ name: 'Category 1', questions: [] }];
        gameState.categories = initialCategories;
        const newCategories = [{ name: 'Category 2', questions: [] }];
        mergeCategories(newCategories);
        expect(gameState.categories).toHaveLength(2);
        expect(gameState.categories[1].name).toBe('Category 2');
    });
});
