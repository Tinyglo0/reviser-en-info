let allData = null;
let themeConfigurations = null;
let flashcardSets = null;
let currentSelectedYear = null; // Pour suivre l'année sélectionnée

let currentTheme = null;
let currentCards = [];
let currentIndex = 0;
let viewedCards = new Set();

const elements = {
    // themeSelector: document.getElementById('themeSelector'),
    themeButtonsContainer: document.getElementById('themeButtonsContainer'), 
    mainTitle: document.getElementById('mainTitle'),
    mainSubtitle: document.getElementById('mainSubtitle'),
    instructions: document.getElementById('instructions'),
    categoryFilter: document.getElementById('categoryFilter'),
    progressSection: document.getElementById('progressSection'),
    controlButtons: document.getElementById('controlButtons'),
    card: document.getElementById('flashCard'),
    cardFront: document.getElementById('cardFront'),
    cardBack: document.getElementById('cardBack'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    yearNavbar: document.getElementById('yearNavbar'),
    previousCardBtn: document.getElementById('previousCardBtn')
};

async function fetchAllData() {
    if (allData) {
        return allData;
    }
    try {
        const response = await fetch('flashcards_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allData = await response.json();
        themeConfigurations = allData.themeConfigurations;
        flashcardSets = allData.flashcardSets;

        if (!themeConfigurations || !flashcardSets) {
            throw new Error("JSON structure is missing 'themeConfigurations' or 'flashcardSets'");
        }
        populateYearNavbar();
        populateThemeButtons(); // Appel initial, affichera "choisir une année" ou sera vide
        return allData;
    } catch (error) {
        console.error("Could not fetch or parse data:", error);
        elements.mainTitle.textContent = "Erreur";
        elements.mainSubtitle.textContent = "Impossible de charger les données.";
        hideInterface();
        if (elements.themeButtonsContainer) {
            elements.themeButtonsContainer.innerHTML = '<p class="info-message" style="color:red;">Erreur de chargement des thèmes.</p>';
        }
        elements.yearNavbar.innerHTML = '<p style="color:red;">Erreur chargement années</p>';
        return null;
    }
}

function getYearDisplayName(yearLevel) {
    if (yearLevel === 'troncCommun') {
        return 'Tronc Commun';
    }
    return yearLevel;
}

function populateYearNavbar() {
    if (!themeConfigurations) return;

    const yearLevels = new Set();
    for (const themeKey in themeConfigurations) {
        if (themeConfigurations[themeKey].yearLevel) {
            yearLevels.add(themeConfigurations[themeKey].yearLevel);
        }
    }

    elements.yearNavbar.innerHTML = '';

    const sortedYearLevels = Array.from(yearLevels).sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        if (a === 'troncCommun') return -1;
        if (b === 'troncCommun') return 1;
        return String(a).localeCompare(String(b));
    });

    sortedYearLevels.forEach(year => {
        const yearBtn = document.createElement('button');
        yearBtn.className = 'year-btn';
        yearBtn.textContent = getYearDisplayName(year);
        yearBtn.dataset.year = year;
        yearBtn.addEventListener('click', handleYearSelection);
        elements.yearNavbar.appendChild(yearBtn);
    });
}

function handleYearSelection(event) {
    const selectedYear = event.target.dataset.year;
    currentSelectedYear = selectedYear;

    elements.yearNavbar.querySelectorAll('.year-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    populateThemeButtons(currentSelectedYear); // Changé de populateThemeSelector

    loadTheme(null); // Réinitialise le thème et l'interface des cartes
    elements.mainTitle.textContent = "🎓 Flash Cards pour réviser l'info";
    // Le sous-titre et cardFront sont gérés par loadTheme(null) -> hideInterface()
}

function populateThemeButtons(selectedYear = null) {
    if (!elements.themeButtonsContainer) {
        console.error("Theme buttons container not found!");
        return;
    }

    elements.themeButtonsContainer.innerHTML = ''; // Vider les boutons précédents ou messages

    // 1. On vérifie d'abord si une année a été sélectionnée.
    if (!selectedYear) {
        elements.themeButtonsContainer.innerHTML = `<div class="placeholder-button">⬆️ Choisissez d'abord une année ⬆️</div>`;
        return;
    }

    if (!themeConfigurations) {
        elements.themeButtonsContainer.innerHTML = '<p class="info-message">-- Données non chargées --</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const themeKey in themeConfigurations) {
        if (themeConfigurations.hasOwnProperty(themeKey)) {
            const theme = themeConfigurations[themeKey];
            
            // 2. La condition vérifie seulement si le thème correspond à l'année sélectionnée.
            if (String(theme.yearLevel) === String(selectedYear) && !theme.hidden) {
                const button = document.createElement('button');
                button.className = 'theme-btn';
                button.dataset.themeKey = themeKey;
                button.textContent = `${theme.icon || ''} ${theme.title.replace(/^\p{Extended_Pictographic}*\s*(Flash Cards)?\s*/u, '') || themeKey}`;
                
                button.addEventListener('click', function() {
                    elements.themeButtonsContainer.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    loadTheme(themeKey);
                });
                fragment.appendChild(button);
            }
        }
    }

    // On affiche les boutons ou un message s'il n'y a aucun thème pour l'année sélectionnée.
    if (fragment.childNodes.length > 0) {
        elements.themeButtonsContainer.appendChild(fragment);
    } else {
        // Ce message ne s'affichera que si une année est choisie mais qu'elle est vide.
        elements.themeButtonsContainer.innerHTML = `<p class="info-message">-- Aucun thème pour ${getYearDisplayName(selectedYear)} --</p>`;
    }
}


function applyTheme(themeName) {
    if (!themeConfigurations || !themeConfigurations[themeName]) {
        console.warn(`Theme configuration for "${themeName}" not found.`);
        return;
    }
    const theme = themeConfigurations[themeName];

    document.documentElement.style.setProperty('--bg-gradient', theme.colors.bg);
    document.documentElement.style.setProperty('--card-front', theme.colors.cardFront);
    document.documentElement.style.setProperty('--card-back', theme.colors.cardBack);

    elements.mainTitle.textContent = theme.title;
    elements.mainSubtitle.textContent = theme.subtitle;
}

function createCategoryFilters(themeData) {
    elements.categoryFilter.innerHTML = '';
    if (!themeData || !themeData.categories || themeData.categories.length === 0) {
        elements.categoryFilter.style.display = 'none';
        return;
    }
    elements.categoryFilter.style.display = 'flex';

    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'Toutes';
    allBtn.dataset.category = 'all';
    elements.categoryFilter.appendChild(allBtn);

    if (themeData.categories && themeData.categoryNames) {
        themeData.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.textContent = themeData.categoryNames[category] || category;
            btn.dataset.category = category;
            elements.categoryFilter.appendChild(btn);
        });
    }

    elements.categoryFilter.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.categoryFilter.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterCards(btn.dataset.category);
        });
    });
}

async function loadTheme(themeName) {
    if (!themeName) { 
        hideInterface(); 
        currentTheme = null;
        // Désélectionner visuellement le bouton de thème actif s'il y en a un
        if (elements.themeButtonsContainer) {
            elements.themeButtonsContainer.querySelectorAll('.theme-btn.active').forEach(btn => btn.classList.remove('active'));
        }

        if(currentSelectedYear){ 
            elements.mainSubtitle.textContent = `Choisissez un thème pour le niveau : ${getYearDisplayName(currentSelectedYear)}`;
            elements.cardFront.innerHTML = `<h2>Prêt ?</h2><p>Sélectionnez un thème ci-dessus.</p>`;
        } else { 
            // Les messages sont déjà gérés par hideInterface()
        }
        return;
    }

    await fetchAllData(); 

    if (!flashcardSets || !flashcardSets[themeName] || !themeConfigurations || !themeConfigurations[themeName]) {
        console.error(`Data or configuration for theme "${themeName}" not found.`);
        hideInterface();
        elements.cardFront.innerHTML = `<h2>Thème non trouvé</h2><p>Les données pour "${themeName}" n'ont pas pu être chargées.</p>`;
        elements.cardBack.innerHTML = `<h2>Erreur</h2>`;
        currentTheme = null;
        return;
    }

    currentTheme = themeName;
    const themeCardsData = flashcardSets[themeName];

    applyTheme(themeName);
    createCategoryFilters(themeCardsData);

    currentCards = themeCardsData.cards ? [...themeCardsData.cards] : [];
    currentIndex = 0;
    viewedCards.clear();

    showInterface();
    if (currentCards.length > 0) {
        showCard(currentIndex);
    } else {
        elements.cardFront.innerHTML = '<h2>Aucune carte</h2><p>Ce thème ne contient aucune carte pour le moment.</p>';
        elements.cardBack.innerHTML = '<h2>Vide</h2>';
        if (elements.categoryFilter) elements.categoryFilter.style.display = 'none';
    }
    updateProgress();
}

function showInterface() {
    elements.instructions.style.display = 'none';
    elements.progressSection.style.display = 'flex';
    elements.controlButtons.style.display = 'flex';
}

function hideInterface() {
    elements.instructions.style.display = 'block';
    elements.categoryFilter.style.display = 'none';
    elements.progressSection.style.display = 'none';
    elements.controlButtons.style.display = 'none';

    if (!currentSelectedYear && !currentTheme) { 
        elements.mainTitle.textContent = "🎓 Flash Cards pour réviser l'info";
        elements.mainSubtitle.textContent = "Sélectionnez une année puis un thème";
        elements.cardFront.innerHTML = `<h2>Bienvenue !</h2><p>Sélectionnez une année puis un thème pour commencer.</p>`;
    } else if (currentSelectedYear && !currentTheme) { 
        elements.mainTitle.textContent = "🎓 Flash Cards pour réviser l'info";
        elements.mainSubtitle.textContent = `Choisissez un thème pour le niveau ${getYearDisplayName(currentSelectedYear)}`;
        elements.cardFront.innerHTML = `<h2>Prêt ?</h2><p>Sélectionnez un thème ci-dessus.</p>`;
    }
    elements.cardBack.innerHTML = `<h2>C'est parti !</h2><p>Bonne révisions ! 📚</p>`;
    elements.card.classList.remove('flipped');
}


function updateProgress() {
    if (currentCards.length === 0) {
        elements.progressFill.style.width = '0%';
        elements.progressText.textContent = `0 / 0`;
        return;
    }
    const currentPosition = currentIndex + 1;
    const totalCards = currentCards.length;
    const progressPercentage = (currentPosition / totalCards) * 100;

    elements.progressFill.style.width = progressPercentage + '%';
    elements.progressText.textContent = `${currentPosition} / ${totalCards}`;
}

function showCard(index) {
    if (currentCards.length === 0 || index < 0 || index >= currentCards.length) {
        elements.cardFront.innerHTML = '<h2>Aucune carte disponible</h2><p>Soit le thème est vide, soit la catégorie sélectionnée est vide.</p>';
        elements.cardBack.innerHTML = '<h2>Vide</h2>';
        elements.card.classList.remove('flipped');
        return;
    }

    const flashcard = currentCards[index];
    elements.cardFront.innerHTML = `
        <h2>${flashcard.front}</h2>
        <p>${flashcard.question || ''}</p>
    `;
    elements.cardBack.innerHTML = `
        <h2>Réponse</h2>
        <p>${flashcard.back}</p>
    `;
    elements.card.classList.remove('flipped');
}

function nextCard() {
    if (currentCards.length === 0) return;
    viewedCards.add(currentIndex);
    currentIndex = (currentIndex + 1) % currentCards.length;
    showCard(currentIndex);
    updateProgress();
    elements.card.classList.remove('flipped');
}

function previousCard() {
    if (currentCards.length === 0) return;
    currentIndex--;
    if (currentIndex < 0) {
        currentIndex = currentCards.length - 1;
    }
    showCard(currentIndex);
    updateProgress();
    elements.card.classList.remove('flipped');
}


function flipCard() {
    if (!currentTheme || currentCards.length === 0) {
        if (elements.cardFront.innerHTML.includes("Bienvenue !") || elements.cardFront.innerHTML.includes("Prêt ?")) {
            elements.card.classList.toggle('flipped');
        }
        return;
    }
    elements.card.classList.toggle('flipped');
}

function shuffleCards() {
    if (currentCards.length === 0) return;
    for (let i = currentCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentCards[i], currentCards[j]] = [currentCards[j], currentCards[i]];
    }
    currentIndex = 0;
    viewedCards.clear();
    showCard(currentIndex);
    updateProgress();
    elements.card.classList.remove('flipped');
}

async function filterCards(category) {
    if (!currentTheme || !flashcardSets) {
        console.warn("Cannot filter: current theme or flashcard sets not loaded.");
        return;
    }
    const themeCardsData = flashcardSets[currentTheme];
    if (!themeCardsData || !themeCardsData.cards) {
        console.warn(`Card data for theme "${currentTheme}" not found.`);
        currentCards = [];
    } else {
        if (category === 'all') {
            currentCards = [...themeCardsData.cards];
        } else {
            currentCards = themeCardsData.cards.filter(card => card.category === category);
        }
    }
    currentIndex = 0;
    viewedCards.clear();
    if (currentCards.length > 0) {
        showCard(currentIndex);
    } else {
        elements.cardFront.innerHTML = '<h2>Aucune carte</h2><p>Aucune carte trouvée pour cette catégorie.</p>';
        elements.cardBack.innerHTML = '<p>Sélectionnez une autre catégorie ou "Toutes".</p>';
    }
    updateProgress();
    elements.card.classList.remove('flipped');
}

// Supprimer l'ancien event listener pour le select
// elements.themeSelector.addEventListener('change', (e) => {
//  loadTheme(e.target.value);
// });
// Les clics sur les boutons de thème sont gérés directement dans populateThemeButtons

if (elements.previousCardBtn) {
    elements.previousCardBtn.addEventListener('click', previousCard);
}
document.getElementById('newCard').addEventListener('click', nextCard);
document.getElementById('flipCard').addEventListener('click', flipCard);
document.getElementById('shuffleCards').addEventListener('click', shuffleCards);

elements.card.addEventListener('click', flipCard);

document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && (!currentTheme || currentCards.length === 0)) {
        if (elements.cardFront.innerHTML.includes("Bienvenue !") || elements.cardFront.innerHTML.includes("Prêt ?")) {
            e.preventDefault();
            flipCard();
            return; 
        }
    }

    if (!currentTheme || currentCards.length === 0) return; 

    switch(e.key) {
        case ' ': 
            e.preventDefault();
            flipCard();
            break;
        case 'ArrowRight':
        case 'n':
            e.preventDefault();
            nextCard();
            break;
        case 'ArrowLeft':
        case 'p':
            e.preventDefault();
            previousCard();
            break;
        case 's':
            e.preventDefault();
            shuffleCards();
            break;
    }
});

async function initializeApp() {
    await fetchAllData(); // fetchAllData appelle maintenant populateThemeButtons
    if (!currentSelectedYear) { 
        hideInterface();
        // Le message initial dans themeButtonsContainer est géré par populateThemeButtons
        // elements.themeButtonsContainer.innerHTML = '<p class="info-message">⬆️ Choisissez d\'abord une année ⬆️</p>'; // Déjà géré
    }
}

initializeApp();