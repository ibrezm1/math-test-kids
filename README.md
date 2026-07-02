# Match Timer - Mobile-Friendly Math Practice Web App

Match Timer is a premium, beautifully animated math practice application designed for mobile devices and desktop. Built using pure HTML5, CSS3, and modern ES6 JavaScript, this client-only application requires no backend, database, or server dependencies, making it perfect for hosting directly on **GitHub Pages** (`https://username.github.io/repo`).

## ⚡ Features

- **Responsive & Touch-Optimized Layout**: Includes an interactive on-screen numeric keypad designed to avoid standard mobile OS keyboard popup issues, with generous 48px+ touch targets.
- **Visual Timer Ring**: Responsive circular SVG countdown ring that smoothly transitions. When the timer gets critical (<= 3 seconds), the countdown pulse alerts the user visually.
- **Interactive Voice Countdown**: Powered by the native browser **Web Speech API**, the app counts down vocally.
  - If the timer duration is 10s or less, it counts down every second.
  - If the timer duration is set to more than 10s, it says the remaining time every 5 seconds (e.g., 20, 15, 10) and then ticks down every second for the final 10 seconds.
- **Rich Audio Synthesizers**: Leverages the **Web Audio API** to dynamically synthesize pleasant chimes for correct answers, a low buzzer for wrong/timeout answers, and subtle mechanical clicks for countdown ticks.
- **Robust Math Generator**:
  - **Addition (+)**: Random values up to custom limits.
  - **Subtraction (-)**: Checks inputs to ensure values never result in negative math.
  - **Multiplication (×)**: Multiplication table drill up to limits.
  - **Division (÷)**: Automatically generates problems using multiplication factor products to ensure quotients are always nice, clean integers (no remainders).
- **Configuration Control Panel**:
  - Enable/disable operators (+, -, ×, ÷) dynamically.
  - Custom maximum limits for each operator individually.
  - **Focus Mode**: Focus practice on a specific factor (e.g. practicing the 2x times table specifically).
  - Customizable timer limits per question (from 3s to 60s).
  - Sound Effects and Voice Countdown toggle controls.
- **Progress Tracking & Persistence**: Automatically keeps track of current streak, best streak, and correctness ratio, saving them locally using `localStorage`.

## 🚀 Live Hosting on GitHub Pages (github.io)

Since the app is static, you can host it on GitHub Pages for free in 4 simple steps:

1. **Create a GitHub Repository**:
   Create a new public repository on GitHub (e.g., named `match-timer`).

2. **Commit and Push the Files**:
   Push the project files to your repository:
   ```bash
   git init
   git add index.html styles.css app.js README.md
   git commit -m "Initial commit of Match Timer app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/match-timer.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository settings on GitHub.
   - Scroll down to the **Pages** section in the left sidebar.
   - Under **Build and deployment**, select **Deploy from a branch**.
   - Under **Branch**, choose `main` (or the branch you pushed your files to), select the `/ (root)` folder, and click **Save**.

4. **Access Your Live App**:
   Within 1-2 minutes, GitHub will build the site. You can access it live at:
   `https://YOUR_USERNAME.github.io/match-timer/`

## 🛠️ Local Development & Testing

Simply open the `index.html` file in any modern web browser:
- You can double-click `index.html` to open it directly.
- Or serve it using any simple local static server (e.g. `npx serve`, Python `python3 -m http.server 8000`, or Live Server in VS Code).
