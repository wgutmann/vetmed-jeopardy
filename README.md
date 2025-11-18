# VetMed Jeopardy

A modern, real-time multiplayer Jeopardy-style trivia game designed for Veterinary Medicine education. It utilizes Google's Gemini AI to generate medically accurate questions, answers, and even realistic medical imagery (X-rays, cytology, etc.) on the fly.

## 🚀 Features

*   **AI-Powered Content**: Generates 6 unique categories with 5 difficulty levels automatically using **Gemini 2.5 Flash**.
*   **Visual Diagnosis**: Can generate a dedicated "Visual Diagnosis" category where clues include realistic medical images created by **Imagen**.
*   **Multiplayer**:
    *   **Host Mode**: The main screen acts as the game board and server. It displays a 4-letter room code.
    *   **Player Mode**: Users join via mobile devices using the Room Code.
*   **Real-Time Buzzer System**: Low-latency buzzer interactions using WebRTC (**PeerJS**). The host sees exactly who buzzed in first.
*   **Hybrid Game Generation**: Upload your own questions via CSV. If you provide a partial board, the AI will intelligently fill in the missing categories or clues to complete the board.
*   **Score Tracking**: Persistent scoreboard for multiple players handled by the Host.

## 🛠 Tech Stack

*   **Framework**: React 18
*   **Styling**: Tailwind CSS
*   **AI**: Google GenAI SDK (@google/genai)
*   **Networking**: PeerJS (WebRTC for peer-to-peer connections)
*   **Local Development**: Vite
*   **Deployment**: Optimized for static hosting platforms like Cloudflare Pages.

## 📦 Local Development

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/vet-med-jeopardy.git
    cd vet-med-jeopardy
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root directory to store your API key locally:
    ```env
    VITE_API_KEY=your_google_gemini_api_key
    ```
    *Get an API key from [Google AI Studio](https://aistudio.google.com/).* 
    *Note: Vite requires environment variables exposed to the client to be prefixed with `VITE_`.*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open the local URL provided by Vite in your browser.

## ☁️ Deployment (Cloudflare Pages)

This project can be deployed seamlessly as a static site to Cloudflare Pages.

1.  Push your code to a GitHub repository.
2.  Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages**.
3.  Click **Create Application** > **Pages** > **Connect to Git**.
4.  Select your repository.
5.  **Build Configuration**:
    *   **Framework Preset**: `Vite`
    *   **Build Command**: `npm run build`
    *   **Build Output Directory**: `dist`
6.  **Environment Variables**:
    *   Go to **Settings** > **Environment variables**.
    *   Add `VITE_API_KEY` with your Gemini API Key.
7.  Click **Save and Deploy**.

## 📝 CSV Upload Format

You can provide your own questions using the CSV Upload feature in the Host menu.
**Format:** `Category, Value, Question, Answer, [Optional Image URL]`

**Example:**
```csv
Pharmacology, 200, This drug class inhibits cyclooxygenase., NSAIDs
Anatomy, 400, Name the bone highlighted in the image., Femur, https://example.com/femur.jpg
Visual Diagnosis, 1000, Identify this cell type., Mast Cell
```

**Hybrid Mode**: If you provide fewer than 6 categories, the AI will automatically generate the remaining categories to ensure a full game board.