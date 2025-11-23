window.addEventListener('load', () => {
    // --- Global State and Constants ---
    let allQuestions = [];
    let rememberedSet = new Set();
    const REMEMBERED_KEY = 'remembered';
    // const questionBankData = `...`; // This is now commented out for production.

    // --- UI Elements ---
    const mainPage = document.getElementById('main-page');
    const reviewPage = document.getElementById('review-page');
    const reviewHeaderTitle = document.getElementById('review-header-title');
    const questionBox = document.getElementById('question-box');
    const answerBox = document.getElementById('answer-box');
    const backButton = document.getElementById('back-button');
    const rememberToggleButton = document.getElementById('remember-toggle-button');

    // --- Question Class (ES6) ---
    class Question {
        constructor(id, q, a) {
            this.id = id;
            this.q = q;
            this.a = a;
        }
    }

    // --- Data Loading ---
    async function loadData() {
        // 1. Fetch and parse question bank from the external file.
        const response = await fetch('question_bank.txt');
        const text = await response.text();
        
        allQuestions = text.trim().split('\n').map(line => {
            const parts = line.split(',');
            return new Question(parts[0], parts[1], parts[2]);
        });

        // 2. Load remembered set from localStorage
        const rememberedString = localStorage.getItem(REMEMBERED_KEY);
        if (rememberedString) {
            rememberedSet = new Set(rememberedString.split(','));
        } else {
            rememberedSet = new Set();
        }
    }

    function saveRememberedSet() {
        localStorage.setItem(REMEMBERED_KEY, Array.from(rememberedSet).join(','));
    }

    // --- Review Session Logic ---
    let reviewSession = {
        questions: [],
        totalCount: 0,
        currentIndex: -1,
        currentQuestion: null,
        isTapped: false,
        isCurrentRemembered: false,
        counter: 0,
    };

    function startReview(num, isTrainAll) {
        const unrememberedQuestions = allQuestions.filter(q => !rememberedSet.has(q.id));

        if (!isTrainAll && unrememberedQuestions.length === 0) {
            alert('恭喜！所有題目都已經記住了。');
            return;
        }

        let sourceQuestions = isTrainAll ? [...allQuestions] : unrememberedQuestions;
        
        // Shuffle the questions (Fisher-Yates shuffle)
        for (let i = sourceQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sourceQuestions[i], sourceQuestions[j]] = [sourceQuestions[j], sourceQuestions[i]];
        }

        reviewSession.questions = sourceQuestions;
        reviewSession.totalCount = Math.min(num, sourceQuestions.length);
        reviewSession.currentIndex = -1;
        reviewSession.counter = 0;

        mainPage.style.display = 'none';
        reviewPage.classList.add('grid-layout'); // Activate Grid layout
        reviewPage.style.display = 'grid'; // Use grid instead of block

        nextQuestion();
    }

    function nextQuestion() {
        reviewSession.currentIndex++;
        reviewSession.counter++;

        if (reviewSession.counter > reviewSession.totalCount || reviewSession.currentIndex >= reviewSession.questions.length) {
            endReview();
            return;
        }

        reviewSession.currentQuestion = reviewSession.questions[reviewSession.currentIndex];
        reviewSession.isTapped = false;
        reviewSession.isCurrentRemembered = rememberedSet.has(reviewSession.currentQuestion.id);

        updateReviewUI();
    }

    function endReview() {
        reviewPage.style.display = 'none';
        reviewPage.classList.remove('grid-layout'); // Deactivate Grid layout
        mainPage.style.display = 'flex'; // Revert to flex display
    }

    function updateReviewUI() {
        const q = reviewSession.currentQuestion;
        if (!q) return;

        const unrememberedTotal = allQuestions.length - rememberedSet.size;
        reviewHeaderTitle.textContent = `問題：${reviewSession.counter} / ${reviewSession.totalCount}   尚未記得：${unrememberedTotal} 個`;

        questionBox.textContent = q.q;
        
        // CRITICAL FIX: Always set the text content, but control visibility.
        // This ensures the element always occupies its space, preventing layout shifts.
        answerBox.textContent = q.a;
        answerBox.style.visibility = reviewSession.isTapped ? 'visible' : 'hidden';

        if (reviewSession.isCurrentRemembered) {
            rememberToggleButton.textContent = '記得了';
            rememberToggleButton.className = 'remember-toggle btn-remembered';
        } else {
            rememberToggleButton.textContent = '尚未記得';
            rememberToggleButton.className = 'remember-toggle btn-not-remembered';
        }
    }

    // --- Event Listeners ---

    // Main page buttons
    mainPage.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            if (e.target.id === 'reset-button') {
                if (confirm('確認要刪除所有記憶？')) {
                    rememberedSet.clear();
                    saveRememberedSet();
                    alert('所有記憶已清除。');
                }
            } else {
                const num = parseInt(e.target.dataset.num, 10);
                const isTrainAll = e.target.dataset.all === 'true';
                startReview(num, isTrainAll);
            }
        }
    });

    // Review page tap to show answer
    reviewPage.addEventListener('click', (e) => {
        // If the click is on the toggle button or its container, do nothing.
        // This prevents the page from advancing when the button is clicked.
        if (rememberToggleButton.contains(e.target)) {
            return;
        }

        // The rest of the page acts as a gesture detector
        if (reviewSession.currentQuestion) { // Ensure session is active
            // LOGIC FIX: If the question is already remembered, tapping anywhere should go to the next question.
            if (reviewSession.isCurrentRemembered) {
                nextQuestion();
                return;
            }
            if (!reviewSession.isTapped) { // If not remembered, the first tap shows the answer.
                reviewSession.isTapped = true;
                updateReviewUI();
            } else {
                nextQuestion();
            }
        }
    });

    // Remember/Unremember toggle button
    rememberToggleButton.addEventListener('click', (e) => {
        const currentId = reviewSession.currentQuestion.id;
        if (reviewSession.isCurrentRemembered) {
            rememberedSet.delete(currentId);
        } else {
            rememberedSet.add(currentId);
        }
        saveRememberedSet();
        reviewSession.isCurrentRemembered = !reviewSession.isCurrentRemembered;
        updateReviewUI();
    });

    // Back button on review page
    backButton.addEventListener('click', () => {
        endReview();
    });

    // --- Layout Management ---
    function updateContainerHeight() {
        const container = document.querySelector('.container');
        container.style.height = `${window.innerHeight}px`;
    }

    // --- Initialization ---
    async function initializeApp() {
        await loadData();
        updateContainerHeight();
        window.addEventListener('resize', updateContainerHeight);
    }

    initializeApp();
});