// Match-Timer Web App Logic

// --- Audio Synthesizer (Web Audio API) ---
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(freq, type, duration, delay = 0) {
        if (this.muted) return;
        this.init();
        
        // Resume context if suspended (browser security policies)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + delay);
        // Smooth exponential decay
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + delay + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    }

    playCorrect() {
        // High-pitched pleasant arpeggio chime
        this.playTone(523.25, 'sine', 0.15); // C5
        this.playTone(659.25, 'sine', 0.15, 0.08); // E5
        this.playTone(783.99, 'sine', 0.25, 0.16); // G5
    }

    playIncorrect() {
        // Low buzzy sound
        this.playTone(180, 'sawtooth', 0.3);
        this.playTone(120, 'sawtooth', 0.3, 0.05);
    }

    playTick() {
        // Short subtle click
        this.playTone(800, 'sine', 0.03);
    }

    playLowTimerTick() {
        // Slightly higher and longer tick for warning
        this.playTone(1200, 'triangle', 0.08);
    }
}

const sounds = new SoundManager();

// --- Speech Synthesizer (Web Speech API) ---
class VoiceManager {
    constructor() {
        this.enabled = true;
    }

    cancel() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    speak(text) {
        if (!this.enabled || !('speechSynthesis' in window)) return;
        
        this.cancel(); // Abort previous countdown digit immediately
        const utterance = new SpeechSynthesisUtterance(text.toString());
        utterance.rate = 1.35; // Speak rapidly for tight timing
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Find an English voice if available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.localService) || 
                                  voices.find(v => v.lang.startsWith('en'));
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
        }
        
        window.speechSynthesis.speak(utterance);
    }
}

const voice = new VoiceManager();

// --- Confetti Particle System ---
class ConfettiParticle {
    constructor(x, y, color, angle, spread, velocity) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 6 + 6; // 6px to 12px
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 8 - 4;
        
        const radAngle = (angle + (Math.random() - 0.5) * spread) * (Math.PI / 180);
        const speed = velocity * (0.6 + Math.random() * 0.8);
        
        this.vx = Math.cos(radAngle) * speed;
        this.vy = Math.sin(radAngle) * speed;
        
        this.gravity = 0.35;
        this.friction = 0.98;
        this.opacity = 1;
        this.fadeOutSpeed = Math.random() * 0.01 + 0.005;
        
        this.shape = Math.floor(Math.random() * 3); // 0: Rect, 1: Circle, 2: Triangle
    }

    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.opacity -= this.fadeOutSpeed;
        return this.opacity > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * (Math.PI / 180));
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        if (this.shape === 0) {
            ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        } else if (this.shape === 1) {
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.moveTo(0, -this.size / 2);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(-this.size / 2, this.size / 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}

class ConfettiManager {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.isLooping = false;
    }

    init() {
        if (!this.canvas) {
            this.canvas = document.getElementById(this.canvasId);
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                window.addEventListener('resize', () => this.resizeCanvas());
                this.resizeCanvas();
            }
        }
    }

    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    fire(x, y, angle, spread, velocity, count) {
        this.init();
        if (!this.canvas || !this.ctx) return;

        const colors = [
            '#6366f1', // Indigo
            '#10b981', // Emerald
            '#3b82f6', // Blue
            '#f59e0b', // Amber
            '#ec4899', // Pink
            '#a855f7', // Purple
            '#06b6d4'  // Cyan
        ];
        
        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new ConfettiParticle(x, y, color, angle, spread, velocity));
        }
        
        if (!this.isLooping) {
            this.isLooping = true;
            this.loop();
        }
    }

    loop() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(p => {
            const active = p.update();
            if (active) {
                p.draw(this.ctx);
            }
            return active;
        });
        
        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.loop());
        } else {
            this.isLooping = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

const confetti = new ConfettiManager('confetti-canvas');

function triggerConfetti() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Left cannon (fire diagonal up-right)
    confetti.fire(0, height, -45, 35, 22, 50);
    // Right cannon (fire diagonal up-left)
    confetti.fire(width, height, -135, 35, 22, 50);
}

// --- Game Logic State ---
const state = {
    // Configurations (loaded from storage or defaults)
    settings: {
        ops: { add: true, sub: true, mul: true, div: true },
        limits: { add: 20, sub: 20, mul: 12, div: 12 },
        focusMode: false,
        focusFactor: 2,
        duration: 10,
        voiceEnabled: true,
        sfxEnabled: true,
        paperLength: 10,
        mcqEnabled: false
    },
    
    // Paper tracking state
    paper: {
        active: false,
        currentQuestion: 0,
        correctCount: 0,
        startTime: 0
    },
    
    // Game stats
    stats: {
        streak: 0,
        bestStreak: 0,
        correct: 0,
        total: 0
    },

    // Current question
    current: {
        num1: 0,
        num2: 0,
        op: '+',
        answer: 0,
        userInput: '',
        timer: null,
        timeRemaining: 0,
        isTransitioning: false, // prevents double submissions during animations
        mcqOptions: [] // holds shuffled options
    }
};

// --- DOM Elements Cache ---
const DOM = {
    currentStreak: document.getElementById('current-streak'),
    bestStreak: document.getElementById('best-streak'),
    scoreFraction: document.getElementById('score-fraction'),
    
    hamburgerMenuBtn: document.getElementById('hamburger-menu-btn'),
    pauseGameBtn: document.getElementById('pause-game-btn'),
    pauseOverlay: document.getElementById('pause-overlay'),
    resumeGameBtn: document.getElementById('resume-game-btn'),
    closeSettingsBtn: document.getElementById('close-settings-btn'),
    settingsOverlay: document.getElementById('settings-overlay'),
    
    questionCard: document.getElementById('question-card'),
    timerRingBar: document.getElementById('timer-ring-bar'),
    timerText: document.getElementById('timer-text'),
    
    eqNum1: document.getElementById('equation-num1'),
    eqOp: document.getElementById('equation-operator'),
    eqNum2: document.getElementById('equation-num2'),
    answerPreview: document.getElementById('answer-preview'),
    
    welcomeOverlay: document.getElementById('welcome-overlay'),
    startGameBtn: document.getElementById('start-game-btn'),
    
    // Setting Form Elements
    opAdd: document.getElementById('op-add'),
    opSub: document.getElementById('op-sub'),
    opMul: document.getElementById('op-mul'),
    opDiv: document.getElementById('op-div'),
    
    limitAdd: document.getElementById('limit-add'),
    limitSub: document.getElementById('limit-sub'),
    limitMul: document.getElementById('limit-mul'),
    limitDiv: document.getElementById('limit-div'),
    
    toggleFocus: document.getElementById('toggle-focus'),
    focusFactorWrapper: document.getElementById('focus-factor-wrapper'),
    focusFactor: document.getElementById('focus-factor'),
    
    timerDuration: document.getElementById('setting-timer-duration'),
    voiceEnabledCheckbox: document.getElementById('setting-voice-enabled'),
    sfxEnabledCheckbox: document.getElementById('setting-sfx-enabled'),
    
    resetStatsBtn: document.getElementById('reset-stats-btn'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    keySubmit: document.getElementById('key-submit'),
    
    // Paper mode elements
    paperLength: document.getElementById('setting-paper-length'),
    paperCompleteOverlay: document.getElementById('paper-complete-overlay'),
    nextPaperBtn: document.getElementById('next-paper-btn'),
    paperTotalQuestions: document.getElementById('paper-total-questions'),
    paperCorrectAnswers: document.getElementById('paper-correct-answers'),
    paperTimeTaken: document.getElementById('paper-time-taken'),
    finalPercentageGrade: document.getElementById('final-percentage-grade'),
    finalGradeFeedback: document.getElementById('final-grade-feedback'),
    gradeKidsFormatDesc: document.getElementById('grade-kids-format-desc'),
    paperQuestionProgress: document.getElementById('paper-question-progress'),
    paperQuestionCount: document.getElementById('paper-question-count'),
    paperMarksProgress: document.getElementById('paper-marks-progress'),
    paperMarksValue: document.getElementById('paper-marks-value'),
    
    // MCQ mode elements
    mcqContainer: document.getElementById('mcq-container'),
    keypadContainer: document.getElementById('keypad-container'),
    mcqEnabledCheckbox: document.getElementById('setting-mcq-enabled'),
    mcqBtns: [
        document.getElementById('mcq-btn-0'),
        document.getElementById('mcq-btn-1'),
        document.getElementById('mcq-btn-2'),
        document.getElementById('mcq-btn-3')
    ]
};

// SVG Circle circumference details
const CIRCUMFERENCE = 2 * Math.PI * 34; // r=34 -> ~213.6

// --- Settings Storage & Sync ---
function loadSettings() {
    const savedSettings = localStorage.getItem('match_timer_settings');
    if (savedSettings) {
        try {
            state.settings = JSON.parse(savedSettings);
            if (state.settings.paperLength === undefined) {
                state.settings.paperLength = 10;
            }
            if (state.settings.sfxEnabled === undefined) {
                state.settings.sfxEnabled = true;
            }
            if (state.settings.mcqEnabled === undefined) {
                state.settings.mcqEnabled = false;
            }
        } catch (e) {
            console.error("Error parsing saved settings", e);
        }
    }
    
    const savedStats = localStorage.getItem('match_timer_stats');
    if (savedStats) {
        try {
            state.stats = JSON.parse(savedStats);
        } catch (e) {
            console.error("Error parsing saved stats", e);
        }
    }
    
    // Set audio managers initial muted states
    sounds.muted = !state.settings.sfxEnabled;
    voice.enabled = state.settings.voiceEnabled;
    
    updateStatsDisplay();
    populateSettingsForm();
    toggleMCQVisibility();
}

function saveSettings() {
    localStorage.setItem('match_timer_settings', JSON.stringify(state.settings));
}

function saveStats() {
    localStorage.setItem('match_timer_stats', JSON.stringify(state.stats));
}

function updateStatsDisplay() {
    DOM.currentStreak.innerText = state.stats.streak;
    DOM.bestStreak.innerText = state.stats.bestStreak;
    DOM.scoreFraction.innerText = `${state.stats.correct}/${state.stats.total}`;
}

function populateSettingsForm() {
    DOM.opAdd.checked = state.settings.ops.add;
    DOM.opSub.checked = state.settings.ops.sub;
    DOM.opMul.checked = state.settings.ops.mul;
    DOM.opDiv.checked = state.settings.ops.div;
    
    DOM.limitAdd.value = state.settings.limits.add;
    DOM.limitSub.value = state.settings.limits.sub;
    DOM.limitMul.value = state.settings.limits.mul;
    DOM.limitDiv.value = state.settings.limits.div;
    
    DOM.toggleFocus.checked = state.settings.focusMode;
    DOM.focusFactor.value = state.settings.focusFactor;
    if (state.settings.focusMode) {
        DOM.focusFactorWrapper.classList.remove('disabled');
        DOM.focusFactor.disabled = false;
    } else {
        DOM.focusFactorWrapper.classList.add('disabled');
        DOM.focusFactor.disabled = true;
    }
    
    DOM.timerDuration.value = state.settings.duration;
    DOM.voiceEnabledCheckbox.checked = state.settings.voiceEnabled;
    DOM.sfxEnabledCheckbox.checked = state.settings.sfxEnabled;
    DOM.paperLength.value = state.settings.paperLength;
    DOM.mcqEnabledCheckbox.checked = state.settings.mcqEnabled;
}

// --- Question Generator ---
function generateQuestion() {
    // Determine active operations
    const activeOps = [];
    if (state.settings.ops.add) activeOps.push('+');
    if (state.settings.ops.sub) activeOps.push('-');
    if (state.settings.ops.mul) activeOps.push('x');
    if (state.settings.ops.div) activeOps.push('/');
    
    // Fallback if none are selected
    if (activeOps.length === 0) {
        activeOps.push('+');
        DOM.opAdd.checked = true;
        state.settings.ops.add = true;
        saveSettings();
    }
    
    // Choose random operator from list
    const operator = activeOps[Math.floor(Math.random() * activeOps.length)];
    let num1 = 0, num2 = 0, answer = 0;
    
    const focusMode = state.settings.focusMode;
    const focusVal = parseInt(state.settings.focusFactor) || 2;
    
    switch (operator) {
        case '+':
            if (focusMode) {
                // Focus factor is one of the addends
                const limit = parseInt(state.settings.limits.add) || 20;
                num1 = focusVal;
                num2 = Math.floor(Math.random() * limit) + 1;
                // Randomly swap so it's not always e.g. "2 + B"
                if (Math.random() > 0.5) {
                    const temp = num1;
                    num1 = num2;
                    num2 = temp;
                }
            } else {
                const limit = parseInt(state.settings.limits.add) || 20;
                num1 = Math.floor(Math.random() * limit) + 1;
                num2 = Math.floor(Math.random() * limit) + 1;
            }
            answer = num1 + num2;
            break;
            
        case '-':
            {
                const limit = parseInt(state.settings.limits.sub) || 20;
                if (focusMode) {
                    // Focus factor is subtracted or subtracting
                    // To prevent negative values, we need num1 >= num2.
                    // Case A: focusVal - random, where random <= focusVal
                    // Case B: random - focusVal, where random >= focusVal
                    if (Math.random() > 0.5 && focusVal > 1) {
                        num1 = focusVal;
                        num2 = Math.floor(Math.random() * focusVal); // 0 to focusVal - 1
                    } else {
                        // random between focusVal and limit
                        const range = Math.max(1, limit - focusVal);
                        num1 = focusVal + Math.floor(Math.random() * range);
                        num2 = focusVal;
                    }
                } else {
                    const a = Math.floor(Math.random() * limit) + 1;
                    const b = Math.floor(Math.random() * limit) + 1;
                    num1 = Math.max(a, b);
                    num2 = Math.min(a, b);
                }
                answer = num1 - num2;
            }
            break;
            
        case 'x':
            if (focusMode) {
                // Focus factor is one multiplication multiplier
                const limit = parseInt(state.settings.limits.mul) || 12;
                num1 = focusVal;
                num2 = Math.floor(Math.random() * limit) + 1;
                if (Math.random() > 0.5) {
                    const temp = num1;
                    num1 = num2;
                    num2 = temp;
                }
            } else {
                const limit = parseInt(state.settings.limits.mul) || 12;
                num1 = Math.floor(Math.random() * limit) + 1;
                num2 = Math.floor(Math.random() * limit) + 1;
            }
            answer = num1 * num2;
            break;
            
        case '/':
            {
                // Generate clean quotients by choosing A & B factors, multiplying to product C.
                // Present C / A = B
                const limit = parseInt(state.settings.limits.div) || 12;
                let factorA = 0;
                let factorB = 0;
                
                if (focusMode) {
                    factorA = focusVal;
                    factorB = Math.floor(Math.random() * limit) + 1;
                } else {
                    factorA = Math.floor(Math.random() * limit) + 1;
                    factorB = Math.floor(Math.random() * limit) + 1;
                }
                
                const product = factorA * factorB;
                
                // Randomly present as either (product / factorA = factorB) or (product / factorB = factorA)
                // If focusMode is on, let's keep the focus factor as the divisor mostly, or mix it up
                if (focusMode) {
                    num1 = product;
                    num2 = factorA; // divisor is focusVal
                    answer = factorB;
                } else {
                    if (Math.random() > 0.5) {
                        num1 = product;
                        num2 = factorA;
                        answer = factorB;
                    } else {
                        num1 = product;
                        num2 = factorB;
                        answer = factorA;
                    }
                }
            }
            break;
    }
    
    state.current.num1 = num1;
    state.current.num2 = num2;
    state.current.op = operator;
    state.current.answer = answer;
    state.current.userInput = '';
    
    // Update display
    DOM.eqNum1.innerText = num1;
    DOM.eqNum2.innerText = num2;
    DOM.eqOp.innerText = operator === '/' ? '÷' : (operator === 'x' ? '×' : operator);
    
    if (state.settings.mcqEnabled) {
        const mcqOptions = generateMCQOptions(answer);
        state.current.mcqOptions = mcqOptions;
        for (let i = 0; i < 4; i++) {
            DOM.mcqBtns[i].innerText = mcqOptions[i];
        }
    }
    
    updateAnswerPreview();
}

function generateMCQOptions(correctAnswer) {
    const options = new Set();
    options.add(correctAnswer);
    
    let attempts = 0;
    while (options.size < 4 && attempts < 100) {
        attempts++;
        const offset = Math.floor(Math.random() * 9) - 4; // -4 to 4
        if (offset === 0) continue;
        const option = correctAnswer + offset;
        if (option >= 0) {
            options.add(option);
        }
    }
    
    if (options.size < 4) {
        let backup = correctAnswer + 1;
        while (options.size < 4) {
            options.add(backup);
            backup++;
        }
    }
    
    const arr = Array.from(options);
    return arr.sort(() => Math.random() - 0.5);
}

function updateAnswerPreview() {
    if (state.settings.mcqEnabled) {
        DOM.answerPreview.innerText = "Select Option";
        DOM.answerPreview.classList.add('placeholder');
    } else {
        if (state.current.userInput === '') {
            DOM.answerPreview.innerText = "Type Answer";
            DOM.answerPreview.classList.add('placeholder');
        } else {
            DOM.answerPreview.innerText = state.current.userInput;
            DOM.answerPreview.classList.remove('placeholder');
        }
    }
}

// --- Gameplay Flow ---
function pauseGame() {
    if (state.current.isTransitioning) return;
    clearInterval(state.current.timer);
    voice.cancel();
    DOM.pauseOverlay.classList.add('active');
    DOM.pauseGameBtn.classList.add('hidden');
}

function resumeGame() {
    DOM.pauseOverlay.classList.remove('active');
    DOM.pauseGameBtn.classList.remove('hidden');
    startTimer(true);
}

function toggleMCQVisibility() {
    const isMcq = state.settings.mcqEnabled;
    if (isMcq) {
        DOM.mcqContainer.classList.remove('hidden');
        DOM.keypadContainer.classList.add('hidden');
    } else {
        DOM.mcqContainer.classList.add('hidden');
        DOM.keypadContainer.classList.remove('hidden');
    }
}

function submitMCQAnswer(userVal) {
    if (state.current.isTransitioning) return;
    
    state.current.isTransitioning = true;
    clearInterval(state.current.timer);
    voice.cancel();
    
    const isCorrect = userVal === state.current.answer;
    
    if (isCorrect) {
        sounds.playCorrect();
        triggerConfetti();
        DOM.questionCard.classList.add('correct');
        
        DOM.answerPreview.innerText = userVal;
        DOM.answerPreview.classList.remove('placeholder');
        
        state.stats.streak += 1;
        if (state.stats.streak > state.stats.bestStreak) {
            state.stats.bestStreak = state.stats.streak;
        }
        state.stats.correct += 1;
        state.stats.total += 1;
        
        state.paper.correctCount += 1;
        saveStats();
        updateStatsDisplay();
        updateLiveMarks();
        
        setTimeout(() => {
            advancePaperQuestion();
        }, 800);
    } else {
        sounds.playIncorrect();
        DOM.questionCard.classList.add('incorrect');
        
        DOM.answerPreview.innerText = `${userVal} ➔ ${state.current.answer}`;
        DOM.answerPreview.classList.remove('placeholder');
        
        state.stats.streak = 0;
        state.stats.total += 1;
        
        saveStats();
        updateStatsDisplay();
        updateLiveMarks();
        
        setTimeout(() => {
            advancePaperQuestion();
        }, 1800);
    }
}

function initPaperSession() {
    DOM.pauseGameBtn.classList.remove('hidden');
    toggleMCQVisibility();
    const len = state.settings.paperLength;
    if (len > 0) {
        state.paper.active = true;
        state.paper.currentQuestion = 1;
        state.paper.correctCount = 0;
        state.paper.startTime = Date.now();
        
        DOM.paperQuestionProgress.classList.remove('hidden');
        DOM.paperMarksProgress.classList.remove('hidden');
        
        DOM.paperQuestionCount.innerText = `1/${len}`;
        DOM.paperMarksValue.innerText = `0/0`;
    } else {
        state.paper.active = false;
        DOM.paperQuestionProgress.classList.add('hidden');
        DOM.paperMarksProgress.classList.add('hidden');
    }
}

function updateLiveMarks() {
    if (!state.paper.active) return;
    DOM.paperMarksValue.innerText = `${state.paper.correctCount}/${state.paper.currentQuestion}`;
}

function advancePaperQuestion() {
    if (!state.paper.active) {
        startNextQuestion();
        return;
    }
    
    const totalQuestions = state.settings.paperLength;
    if (state.paper.currentQuestion >= totalQuestions) {
        showPaperResults();
    } else {
        state.paper.currentQuestion += 1;
        DOM.paperQuestionCount.innerText = `${state.paper.currentQuestion}/${totalQuestions}`;
        startNextQuestion();
    }
}

function showPaperResults() {
    clearInterval(state.current.timer);
    voice.cancel();
    DOM.pauseGameBtn.classList.add('hidden');
    
    const correct = state.paper.correctCount;
    const total = state.settings.paperLength;
    const percentage = Math.round((correct / total) * 100);
    const timeSpentMs = Date.now() - state.paper.startTime;
    const timeSpentSec = Math.round(timeSpentMs / 1000);
    
    DOM.paperTotalQuestions.innerText = total;
    DOM.paperCorrectAnswers.innerText = correct;
    DOM.paperTimeTaken.innerText = `${timeSpentSec}s`;
    
    DOM.finalPercentageGrade.innerText = `${percentage}/100`;
    DOM.gradeKidsFormatDesc.innerText = `You got ${percentage} by 100 correct!`;
    
    let feedback = "";
    if (percentage === 100) {
        feedback = "PERFECT!";
        sounds.playCorrect();
        setTimeout(() => triggerConfetti(), 100);
        setTimeout(() => triggerConfetti(), 400);
    } else if (percentage >= 80) {
        feedback = "EXCELLENT!";
        sounds.playCorrect();
        setTimeout(() => triggerConfetti(), 100);
    } else if (percentage >= 50) {
        feedback = "GOOD JOB!";
    } else {
        feedback = "KEEP TRYING!";
    }
    DOM.finalGradeFeedback.innerText = feedback;
    
    DOM.paperCompleteOverlay.classList.add('active');
}

function startNextQuestion() {
    state.current.isTransitioning = false;
    DOM.questionCard.className = 'question-card'; // clear overlays/glows
    
    generateQuestion();
    startTimer();
}

// --- Timer System ---
function startTimer(resume = false) {
    clearInterval(state.current.timer);
    
    const duration = state.settings.duration;
    if (!resume) {
        state.current.timeRemaining = duration;
    }
    
    updateTimerUI();
    
    if (!resume) {
        playCountdownVoice(duration, duration);
    } else {
        playCountdownVoice(state.current.timeRemaining, duration);
    }

    if (state.current.timeRemaining <= 3) {
        DOM.questionCard.querySelector('.timer-wrapper').classList.add('warning');
    } else {
        DOM.questionCard.querySelector('.timer-wrapper').classList.remove('warning');
    }

    state.current.timer = setInterval(() => {
        state.current.timeRemaining -= 1;
        
        if (state.current.timeRemaining < 0) {
            clearInterval(state.current.timer);
            handleTimeout();
            return;
        }
        
        updateTimerUI();
        
        // Low time warning visual indicators
        if (state.current.timeRemaining <= 3) {
            DOM.questionCard.querySelector('.timer-wrapper').classList.add('warning');
            sounds.playLowTimerTick();
        } else {
            DOM.questionCard.querySelector('.timer-wrapper').classList.remove('warning');
            sounds.playTick();
        }

        // Handle Speech countdown
        playCountdownVoice(state.current.timeRemaining, duration);

    }, 1000);
}

function playCountdownVoice(timeLeft, totalDuration) {
    if (!state.settings.voiceEnabled) return;

    if (totalDuration <= 10) {
        // If duration is 10s or less, count down every single second
        if (timeLeft >= 0) {
            voice.speak(timeLeft);
        }
    } else {
        // If duration is > 10s:
        // Say it at multiples of 5 (e.g., 20, 15, 10)
        // And count down every second once <= 10
        if (timeLeft <= 10) {
            if (timeLeft >= 0) {
                voice.speak(timeLeft);
            }
        } else if (timeLeft % 5 === 0) {
            voice.speak(timeLeft);
        }
    }
}

function updateTimerUI() {
    const r = parseFloat(DOM.timerRingBar.getAttribute('r'));
    const circum = 2 * Math.PI * r;
    
    // Circle progress percentage
    const ratio = Math.max(0, state.current.timeRemaining / state.settings.duration);
    const offset = circum * (1 - ratio);
    
    DOM.timerRingBar.style.strokeDasharray = circum;
    DOM.timerRingBar.style.strokeDashoffset = offset;
    DOM.timerText.innerText = state.current.timeRemaining;
}

function handleTimeout() {
    if (state.current.isTransitioning) return;
    state.current.isTransitioning = true;
    
    voice.cancel();
    sounds.playIncorrect();
    
    // Show correct answer in red style
    DOM.questionCard.classList.add('incorrect');
    DOM.answerPreview.innerText = state.current.answer;
    DOM.answerPreview.classList.remove('placeholder');
    
    // Update stats
    state.stats.streak = 0;
    state.stats.total += 1;
    saveStats();
    updateStatsDisplay();
    updateLiveMarks();
    
    // Delay before next question to show correct result
    setTimeout(() => {
        advancePaperQuestion();
    }, 1800);
}

function submitAnswer() {
    if (state.current.isTransitioning) return;
    
    const userVal = parseInt(state.current.userInput);
    
    // Require an input to submit
    if (isNaN(userVal)) {
        return;
    }
    
    state.current.isTransitioning = true;
    clearInterval(state.current.timer);
    voice.cancel();
    
    const isCorrect = userVal === state.current.answer;
    
    if (isCorrect) {
        sounds.playCorrect();
        triggerConfetti();
        DOM.questionCard.classList.add('correct');
        
        state.stats.streak += 1;
        if (state.stats.streak > state.stats.bestStreak) {
            state.stats.bestStreak = state.stats.streak;
        }
        state.stats.correct += 1;
        state.stats.total += 1;
        
        state.paper.correctCount += 1;
        saveStats();
        updateStatsDisplay();
        updateLiveMarks();
        
        // Short delay for success styling
        setTimeout(() => {
            advancePaperQuestion();
        }, 800);
    } else {
        sounds.playIncorrect();
        DOM.questionCard.classList.add('incorrect');
        
        // Show correct answer
        DOM.answerPreview.innerText = `${state.current.userInput} ➔ ${state.current.answer}`;
        
        state.stats.streak = 0;
        state.stats.total += 1;
        
        saveStats();
        updateStatsDisplay();
        updateLiveMarks();
        
        // Longer delay to learn the correct answer
        setTimeout(() => {
            advancePaperQuestion();
        }, 1800);
    }
}

// --- Keypad and Keyboard Input handling ---
function handleInputDigit(digit) {
    if (state.current.isTransitioning) return;
    
    // Max answer limit length (e.g. 4 digits is plenty for 1000 limit)
    if (state.current.userInput.length >= 4) return;
    
    state.current.userInput += digit;
    updateAnswerPreview();
}

function handleInputBackspace() {
    if (state.current.isTransitioning) return;
    if (state.current.userInput.length > 0) {
        state.current.userInput = state.current.userInput.slice(0, -1);
        updateAnswerPreview();
    }
}

function handleInputClear() {
    if (state.current.isTransitioning) return;
    state.current.userInput = '';
    updateAnswerPreview();
}

// --- Keyboard Events Link ---
function initKeyboardInput() {
    document.addEventListener('keydown', (e) => {
        // Prevent typing intercept when settings or pause is open
        if (DOM.settingsOverlay.classList.contains('active') || DOM.pauseOverlay.classList.contains('active')) return;
        
        if (e.key >= '0' && e.key <= '9') {
            handleInputDigit(e.key);
        } else if (e.key === 'Backspace') {
            handleInputBackspace();
        } else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
            handleInputClear();
        } else if (e.key === 'Enter') {
            submitAnswer();
        }
    });
}

// --- Event Listeners Setup ---
function initEventListeners() {
    // Welcome Screen
    DOM.startGameBtn.addEventListener('click', () => {
        // Initialize browser audio context inside click event to satisfy browser policies
        sounds.init();
        DOM.welcomeOverlay.classList.remove('active');
        initPaperSession();
        startNextQuestion();
    });
    
    DOM.pauseGameBtn.addEventListener('click', () => {
        sounds.init();
        pauseGame();
    });
    
    DOM.resumeGameBtn.addEventListener('click', () => {
        sounds.init();
        resumeGame();
    });
    
    // Multiple Choice button click events (uses delegation)
    DOM.mcqContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.mcq-btn');
        if (!btn || state.current.isTransitioning) return;
        
        sounds.init();
        const idx = parseInt(btn.getAttribute('data-idx'));
        const selectedValue = state.current.mcqOptions[idx];
        submitMCQAnswer(selectedValue);
    });
    
    // On-screen Keypad click events (uses delegation)
    document.querySelector('.keypad-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('.key-btn');
        if (!btn) return;
        
        // Interactive click sounds
        sounds.init();
        
        const val = btn.getAttribute('data-val');
        if (val !== null) {
            handleInputDigit(val);
        } else if (btn.id === 'key-clear') {
            handleInputClear();
        } else if (btn.id === 'key-backspace') {
            handleInputBackspace();
        }
    });
    
    DOM.keySubmit.addEventListener('click', () => {
        sounds.init();
        submitAnswer();
    });

    // Settings overlay (Hamburger Menu Drawer) toggle
    DOM.hamburgerMenuBtn.addEventListener('click', () => {
        clearInterval(state.current.timer);
        voice.cancel();
        populateSettingsForm();
        DOM.settingsOverlay.classList.add('active');
    });

    DOM.closeSettingsBtn.addEventListener('click', () => {
        DOM.settingsOverlay.classList.remove('active');
        // Resume game timer
        if (!DOM.welcomeOverlay.classList.contains('active')) {
            startTimer();
        }
    });

    DOM.toggleFocus.addEventListener('change', (e) => {
        const active = e.target.checked;
        if (active) {
            DOM.focusFactorWrapper.classList.remove('disabled');
            DOM.focusFactor.disabled = false;
        } else {
            DOM.focusFactorWrapper.classList.add('disabled');
            DOM.focusFactor.disabled = true;
        }
    });

    // Save Settings
    DOM.saveSettingsBtn.addEventListener('click', () => {
        // Collect form data
        state.settings.ops.add = DOM.opAdd.checked;
        state.settings.ops.sub = DOM.opSub.checked;
        state.settings.ops.mul = DOM.opMul.checked;
        state.settings.ops.div = DOM.opDiv.checked;
        
        state.settings.limits.add = Math.max(5, parseInt(DOM.limitAdd.value) || 20);
        state.settings.limits.sub = Math.max(5, parseInt(DOM.limitSub.value) || 20);
        state.settings.limits.mul = Math.max(2, parseInt(DOM.limitMul.value) || 12);
        state.settings.limits.div = Math.max(2, parseInt(DOM.limitDiv.value) || 12);
        
        state.settings.focusMode = DOM.toggleFocus.checked;
        state.settings.focusFactor = Math.max(1, parseInt(DOM.focusFactor.value) || 2);
        
        state.settings.duration = Math.max(3, parseInt(DOM.timerDuration.value) || 10);
        state.settings.voiceEnabled = DOM.voiceEnabledCheckbox.checked;
        state.settings.sfxEnabled = DOM.sfxEnabledCheckbox.checked;
        state.settings.paperLength = parseInt(DOM.paperLength.value) || 0;
        state.settings.mcqEnabled = DOM.mcqEnabledCheckbox.checked;
        
        // Sync instances
        voice.enabled = state.settings.voiceEnabled;
        sounds.muted = !state.settings.sfxEnabled;
        
        saveSettings();
        toggleMCQVisibility();
        
        DOM.settingsOverlay.classList.remove('active');
        
        // Start fresh question with new settings
        if (!DOM.welcomeOverlay.classList.contains('active')) {
            initPaperSession();
            startNextQuestion();
        }
    });

    // Reset scores button
    DOM.resetStatsBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset all streak records and total scores?")) {
            state.stats.streak = 0;
            state.stats.bestStreak = 0;
            state.stats.correct = 0;
            state.stats.total = 0;
            saveStats();
            updateStatsDisplay();
            alert("Statistics reset successfully!");
        }
    });

    // Start next paper click event
    DOM.nextPaperBtn.addEventListener('click', () => {
        DOM.paperCompleteOverlay.classList.remove('active');
        initPaperSession();
        startNextQuestion();
    });
}

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initEventListeners();
    initKeyboardInput();
});
