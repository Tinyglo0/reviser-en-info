// \\wsl.localhost\Debian\home\tinytux\flashcards\Debian\home\tinytux\flashcards\script.js
let allData = null;
let themeConfigurations = null;
let flashcardSets = null;
let currentSelectedYear = null; // Pour suivre l'année sélectionnée

let currentTheme = null;
let currentCards = [];
let currentIndex = 0;
let viewedCards = new Set();

const elements = {
    themeSelector: document.getElementById('themeSelector'),
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
    yearNavbar: document.getElementById('yearNavbar'), // Ajouté
    previousCardBtn: document.getElementById('previousCardBtn') // Ajouté pour la nouvelle fonctionnalité
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
        populateYearNavbar(); // <- Appel pour populer la navbar des années
        populateThemeSelector(); // Populer initialement (sera vide ou avec "choisir une année")
        return allData;
    } catch (error) {
        console.error("Could not fetch or parse data:", error);
        elements.mainTitle.textContent = "Erreur";
        elements.mainSubtitle.textContent = "Impossible de charger les données.";
        hideInterface();
        elements.themeSelector.innerHTML = '<option value="">-- Erreur de chargement --</option>';
        elements.yearNavbar.innerHTML = '<p style="color:red;">Erreur chargement années</p>';
        return null;
    }
}

function getYearDisplayName(yearLevel) {
    // if (typeof yearLevel === 'number') {
    //     return `Année ${yearLevel}`;
    // }
    if (yearLevel === 'troncCommun') {
        return 'Tronc Commun';
    }
    return yearLevel; // Au cas où
}

function populateYearNavbar() {
    if (!themeConfigurations) return;

    const yearLevels = new Set();
    for (const themeKey in themeConfigurations) {
        if (themeConfigurations[themeKey].yearLevel) {
            yearLevels.add(themeConfigurations[themeKey].yearLevel);
        }
    }

    elements.yearNavbar.innerHTML = ''; // Clear existing

    // Bouton "Toutes les années" (ou pas, selon préférence)
    // const allYearsBtn = document.createElement('button');
    // allYearsBtn.className = 'year-btn';
    // allYearsBtn.textContent = 'Toutes';
    // allYearsBtn.dataset.year = 'all'; // ou null
    // allYearsBtn.addEventListener('click', handleYearSelection);
    // elements.yearNavbar.appendChild(allYearsBtn);

    // Trier les années (si numériques)
    const sortedYearLevels = Array.from(yearLevels).sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        if (a === 'troncCommun') return -1; // Placer "Tronc Commun" en premier
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

    // Maj style boutons année
    elements.yearNavbar.querySelectorAll('.year-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    elements.themeSelector.disabled = false; // Activer le sélecteur de thème
    populateThemeSelector(currentSelectedYear);

    // Réinitialiser l'interface pour les cartes, mais garder le contexte de l'année
    loadTheme(null); // Appelle hideInterface et ajuste les messages
    elements.mainTitle.textContent = "🎓 Flash Cards pour réviser l'info"; // Garder le titre principal
    // Le message de mainSubtitle et cardFront sera géré par loadTheme(null) -> hideInterface()
    // elements.mainSubtitle.textContent = `Choisissez un thème pour le niveau ${getYearDisplayName(currentSelectedYear)}`;
    // elements.cardFront.innerHTML = `<h2>Prêt ?</h2><p>Choisissez un thème pour le niveau suivant : ${getYearDisplayName(currentSelectedYear)}.</p>`;
    elements.themeSelector.value = "";
}

function populateThemeSelector(selectedYear = null) {
    if (!themeConfigurations) {
         elements.themeSelector.innerHTML = '<option value="">-- Données non chargées --</option>';
        return;
    }

    elements.themeSelector.innerHTML = `<option value="">-- Choisir un thème ${selectedYear ? `(${getYearDisplayName(selectedYear)})` : ''} --</option>`;

    for (const themeKey in themeConfigurations) {
        if (themeConfigurations.hasOwnProperty(themeKey)) {
            const theme = themeConfigurations[themeKey];
            // Affiche le thème s'il n'y a pas d'année sélectionnée OU si l'année correspond ET que le thème n'est pas caché
            if (!selectedYear || (String(theme.yearLevel) === String(selectedYear) && !theme.hidden)) {
                const option = document.createElement('option');
                option.value = themeKey;
                // Utilise le titre du thème depuis themeConfigurations pour le nom de l'option
                option.textContent = `${theme.icon || ''} ${theme.title.replace(/^\p{Extended_Pictographic}*\s*(Flash Cards)?\s*/u, '') || themeKey}`;
                elements.themeSelector.appendChild(option);
            }
        }
    }
     if (elements.themeSelector.options.length <= 1 && selectedYear) {
        elements.themeSelector.innerHTML = `<option value="">-- Aucun thème pour ${getYearDisplayName(selectedYear)} --</option>`;
    } else if (elements.themeSelector.options.length <=1 && !selectedYear) {
         elements.themeSelector.innerHTML = `<option value="">-- D'abord choisir une année --</option>`;
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
        elements.categoryFilter.style.display = 'none'; // Cacher si pas de catégories
        return;
    }
    elements.categoryFilter.style.display = 'flex'; // Afficher si catégories existent


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
    if (!themeName) { // Si on déselectionne un thème ou une année
        hideInterface(); // S'occupe de réinitialiser les messages
        currentTheme = null;
         if(currentSelectedYear){ // Si une année est sélectionnée, adapter le message du sous-titre
            elements.mainSubtitle.textContent = `Choisissez un thème pour le niveau suivant : ${getYearDisplayName(currentSelectedYear)}`;
            elements.cardFront.innerHTML = `<h2>Prêt ?</h2><p>Sélectionnez un thème ci-dessus.</p>`; // Message spécifique si année sélectionnée mais pas de thème
         } else { // Si aucune année n'est sélectionnée (état initial ou après déselection d'année)
            // hideInterface() aura déjà mis les messages par défaut
            // elements.mainSubtitle.textContent = "Sélectionnez une année puis un thème";
            // elements.cardFront.innerHTML = `<h2>Bienvenue !</h2><p>Sélectionnez une année puis un thème pour commencer.</p>`;
         }
        return;
    }

    await fetchAllData(); // S'assurer que les données sont chargées

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
    // La visibilité de categoryFilter est gérée par createCategoryFilters et loadTheme
}

function hideInterface() {
    elements.instructions.style.display = 'block';
    elements.categoryFilter.style.display = 'none';
    elements.progressSection.style.display = 'none';
    elements.controlButtons.style.display = 'none';

    if (!currentSelectedYear && !currentTheme) { // État initial ou tout déselectionné
        elements.mainTitle.textContent = "🎓 Flash Cards pour réviser l'info";
        elements.mainSubtitle.textContent = "Sélectionnez une année puis un thème";
        elements.cardFront.innerHTML = `<h2>Bienvenue !</h2><p>Sélectionnez une année puis un thème pour commencer.</p>`;
    } else if (currentSelectedYear && !currentTheme) { // Année sélectionnée, mais pas de thème
         elements.mainTitle.textContent = "🎓 Flash Cards pour réviser l'info";
         elements.mainSubtitle.textContent = `Choisissez un thème pour le niveau ${getYearDisplayName(currentSelectedYear)}`;
         elements.cardFront.innerHTML = `<h2>Prêt ?</h2><p>Sélectionnez un thème ci-dessus.</p>`;
    }
    // Le contenu de cardBack est constant pour l'état "caché" ou "accueil"
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
        currentIndex = currentCards.length - 1; // Boucle vers la dernière carte
    }
    showCard(currentIndex);
    updateProgress();
    elements.card.classList.remove('flipped');
}


function flipCard() {
    if (!currentTheme || currentCards.length === 0) {
        // Si on est sur l'écran d'accueil, on veut quand même pouvoir flipper la carte de bienvenue
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

elements.themeSelector.addEventListener('change', (e) => {
    loadTheme(e.target.value);
});

if (elements.previousCardBtn) {
    elements.previousCardBtn.addEventListener('click', previousCard);
}
document.getElementById('newCard').addEventListener('click', nextCard);
document.getElementById('flipCard').addEventListener('click', flipCard);
document.getElementById('shuffleCards').addEventListener('click', shuffleCards);

elements.card.addEventListener('click', flipCard);

document.addEventListener('keydown', (e) => {
    // Permettre le flip de la carte d'accueil avec Espace
    if (e.key === ' ' && (!currentTheme || currentCards.length === 0)) {
        if (elements.cardFront.innerHTML.includes("Bienvenue !") || elements.cardFront.innerHTML.includes("Prêt ?")) {
            e.preventDefault();
            flipCard();
            return; // Sortir pour ne pas exécuter d'autres logiques de touches si pas de thème chargé
        }
    }

    if (!currentTheme || currentCards.length === 0) return; // Pour les autres touches, un thème doit être chargé

    switch(e.key) {
        case ' ': // Déjà géré au-dessus si pas de thème, ici pour quand un thème est chargé
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
    await fetchAllData();
    if (!currentSelectedYear) { 
        hideInterface(); // Assure que l'interface de carte est cachée et les messages initiaux sont corrects
        // Les lignes suivantes sont maintenant redondantes ou incorrectes car hideInterface() s'en charge.
        // elements.mainSubtitle.textContent = "Sélectionnez une année pour commencer"; // Redondant/Incorrect
        // elements.cardFront.innerHTML = `<h2>Bienvenue !</h2><p>Sélectionnez une année pour commencer vos révisions.</p>`; // Incorrect
        elements.themeSelector.innerHTML = '<option value="">⬆️ Choisissez d\'abord une année ⬆️</option>';
        elements.themeSelector.disabled = true;
    }
    // S'assurer que la carte d'accueil est retournable
    if (!currentTheme && elements.card) {
        // L'event listener est déjà sur elements.card, flipCard gère la condition
    }
}

initializeApp();
