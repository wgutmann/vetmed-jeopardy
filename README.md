# VetMed Jeopardy

A modern, real-time multiplayer Jeopardy-style trivia game designed for Veterinary Medicine education. It utilizes Google's Gemini AI to generate medically accurate questions, answers, and even realistic medical imagery (X-rays, cytology, etc.) on the fly.

## 🚀 Features

*   **AI-Powered Content**: Generates 6 unique categories with 5 difficulty levels automatically using **Gemini 2.5 Flash**.
*   **Visual Diagnosis**: Can generate a dedicated "Visual Diagnosis" category where clues include realistic medical images created by **Imagen**.
*   **Multiplayer**:
    *   **Host Mode**: The main screen acts as the game board and server. It displays a 4-letter room code.
    *   **Player Mode**: Users join via mobile devices using the Room Code.
*   **Managed Realtime Transport**: Low-latency buzzer interactions flow through a Fastify-based orchestrator running on AWS App Runner (no PeerJS dependency required for production).
*   **Real-Time Buzzer System**: Deterministic fan-out ensures the host sees exactly who buzzed in first.
*   **Hybrid Game Generation**: Upload your own questions via CSV. If you provide a partial board, the AI will intelligently fill in the missing categories or clues to complete the board.
*   **Score Tracking**: Persistent scoreboard for multiple players handled by the Host.

## 🛠 Tech Stack

*   **Framework**: React 18
*   **Styling**: Tailwind CSS
*   **AI**: Google GenAI (REST)
*   **Networking**: Fastify + WebSockets via AWS App Runner orchestrator
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
    Create `.env.local` at the repo root with the following values:
    ```env
    GEMINI_API_KEY=your-google-gemini-api-key
    GEMINI_MODEL=gemini-1.5-flash
    PUBLIC_SIGNALING_URL=http://localhost:8788
    ```
    `PUBLIC_SIGNALING_URL` should point at the orchestrator service when running remotely.

4.  **Install orchestrator dependencies**
    ```bash
    cd orchestrator
    npm install
    cd ..
    ```

5.  **Run Development Servers**
    Start the orchestrator service (Fastify + WebSockets) and the Astro UI in separate terminals:
    ```bash
    npm run orchestrator:dev
    npm run dev -- --host
    ```
    The UI expects the orchestrator on `PUBLIC_SIGNALING_URL`.

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

## 🛰 Realtime Orchestrator Deployment (Terraform + AWS App Runner)

The realtime relay is packaged as a Node/TypeScript service under `orchestrator/` and deployed via AWS App Runner. Use the authenticated AWS CLI and Terraform configuration in `infra/` to provision infrastructure:

1.  **Build and Tag the Image**
    ```bash
    cd orchestrator
    npm run build
    docker build -t vetmed-orchestrator:latest .
    ```
2.  **Push to ECR** (replace `${ACCOUNT_ID}`/`${REGION}` with real values)
    ```bash
    aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
    docker tag vetmed-orchestrator:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/vetmed-orchestrator:latest
    docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/vetmed-orchestrator:latest
    ```
3.  **Configure Terraform**
    ```bash
    cd ../infra
    cp terraform.tfvars.example terraform.tfvars
    # edit aws_region, container_image, signal_jwt_secret
    terraform init
    terraform apply
    ```
4.  **Wire Up the Front-End**
    * Copy the `app_runner_service_url` output.
    * Set `PUBLIC_SIGNALING_URL` (Cloudflare Pages project settings) to the App Runner HTTPS endpoint.

Terraform creates an ECR repository, Secrets Manager entry for `SIGNALING_JWT_SECRET`, the App Runner IAM role, and the App Runner service itself. Subsequent deployments only need a new Docker push followed by `terraform apply -refresh-only` if no infra drift is expected.