document.addEventListener('DOMContentLoaded', () => {
    // --- Global State and Constants ---
    let allQuestions = [];
    let rememberedSet = new Set();
    const REMEMBERED_KEY = 'remembered';
    const questionBankData = `0424,唐宋八大家，誰？字？號？,韓愈（退之、昌黎先生）、柳宗元（子厚、柳河東）、歐陽修（永叔、醉翁&六一居士）、曾鞏（子固、南豐先生）、王安石（介甫、半山）、蘇洵（明允、老泉）、蘇軾（子瞻&和仲、東坡居士）、蘇轍（子由&同叔、欒城&穎濱遺老）
0283,《漢書。藝文志。諸子略序》諸子為哪幾家？各出於何官？,共10家。儒家司徒，管教育。道家史官，管記史。陰陽家羲和，管天文。法家理官，即法官。名家禮官，管禮儀。墨家清廟，守天子太廟。縱橫家行人之官，管外交。雜家議官，議政之官。農家農稷，稼穡之官。小說家稗官，小官。
0118,《詩經，蓼莪》民莫不穀，我獨「何」害，民莫不穀，我獨不「卒」。讀音與全部意思？,何者[賀]負荷，卒者[足]終也。人家都能團員吃飯，只有我蒙受此害，人家都能團員吃飯，只有我不能終養父母。
0110,《詩經，碩鼠》「三」歲「貫」「女」。「逝」將「去」女。意思？,三者多也非數字，貫者宦也表侍奉，女者汝也指碩鼠貪官污吏，逝者發誓，去者離開。
0111,《詩經，碩鼠》「爰」得我「直」。莫我肯「勞」。誰之永「號」。讀音與意思？,爰者[原]才是、乃是，直者值得，才是獲得我值得安居之處。勞者[烙]慰勞，不肯慰勞我。號者[豪]哭嚎長嘆，誰還會嘆氣哭嚎？
0087,《禮記》入其國，其教可知也。請問詩、書、樂、易、禮、春秋個別教啥？,詩溫柔敦厚、書疏通知遠、樂廣博易良、易絜淨精微、禮恭儉莊敬、春秋屬辭比事。`;



    // --- UI Elements ---
    const mainPage = document.getElementById('main-page');
    const reviewPage = document.getElementById('review-page');
    const reviewHeader = document.getElementById('review-header');
    const questionBox = document.getElementById('question-box');
    const answerBox = document.getElementById('answer-box');
    const reviewContent = document.getElementById('review-content');
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
        // 1. Parse question bank from the hardcoded variable
        // Note: The original fetch logic is commented out for testing purposes.
        /*
        const response = await fetch('question_bank.txt');
        const text = await response.text();
        */
        allQuestions = questionBankData.trim().split('\n').map(line => {
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
        reviewPage.style.display = 'block';

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
        mainPage.style.display = 'block';
    }

    function updateReviewUI() {
        const q = reviewSession.currentQuestion;
        if (!q) return;

        const unrememberedTotal = allQuestions.length - rememberedSet.size;
        reviewHeader.textContent = `問題：${reviewSession.counter} / ${reviewSession.totalCount}   尚未記得：${unrememberedTotal} 個`;

        questionBox.textContent = q.q;
        answerBox.textContent = reviewSession.isTapped ? q.a : '';

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
    reviewContent.addEventListener('click', () => {
        if (!reviewSession.isTapped) {
            reviewSession.isTapped = true;
            updateReviewUI();
        } else {
            nextQuestion();
        }
    });

    // Remember/Unremember toggle button
    rememberToggleButton.addEventListener('click', () => {
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

    // --- Initialization ---
    async function initializeApp() {
        await loadData();
        // After data is loaded, the app is ready for user interaction.
        // No further action needed here as event listeners are already set up.
    }

    initializeApp();
});