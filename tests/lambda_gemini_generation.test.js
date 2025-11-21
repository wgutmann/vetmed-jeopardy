import { handler } from '../terraform/modules/lambda_gemini_generation/src/index';

jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn(() => ({
        // Mock the generative AI model and its methods
    })),
}));

describe('Gemini Generation Lambda', () => {
    test('should handle full game generation', async () => {
        const event = {
            body: JSON.stringify({
                data: { type: 'full' }
            })
        };
        const result = await handler(event);
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.categories).toBeDefined();
    });

    test('should handle partial game generation', async () => {
        const event = {
            body: JSON.stringify({
                data: {
                    type: 'partial',
                    existingCategories: [{ name: 'Category 1' }]
                }
            })
        };
        const result = await handler(event);
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.categories).toBeDefined();
    });
});
