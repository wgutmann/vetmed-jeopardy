const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
    const { type, prompt, existingCategories } = JSON.parse(event.body).data;

    let generatedContent;

    if (type === 'full') {
        const fullGamePrompt = prompt
            ? `Generate a full Jeopardy game with 5 categories and 5 questions per category. The topic should be: ${prompt}`
            : `Generate a full Jeopardy game with 5 categories and 5 questions per category on the topic of veterinary medicine.`;
        generatedContent = await generateGame(fullGamePrompt);
    } else if (type === 'partial') {
        const partialGamePrompt = `Complete the following Jeopardy game by generating ${5 - existingCategories.length} new categories with 5 questions each. Do not repeat these categories: ${existingCategories.map(c => c.name).join(', ')}`;
        generatedContent = await generateGame(partialGamePrompt);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(generatedContent),
        headers: { "Content-Type": "application/json" },
    };
};

async function generateGame(prompt) {
    // In a real application, you would make a call to the Gemini API here.
    // For now, returning a hardcoded response.
    return {
        categories: [
            {
                name: "Famous Vets",
                questions: [
                    { question: "This TV vet is known for his show 'The Incredible Dr. Pol'.", answer: "Dr. Jan Pol", value: 100 },
                    { question: "Author of 'All Creatures Great and Small'.", answer: "James Herriot", value: 200 },
                ]
            }
        ]
    };
}
