# Réviser en Info

**réviser-en-info.ch** est une application web simple pour réviser l'informatique au gymnase à l'aide de flashcards interactives. Ce projet vise à faciliter l'apprentissage et la mémorisation de concepts informatiques grâce à une interface intuitive et accessible.

## 🚀 Fonctionnalités

- 📚 Révision avec des flashcards
- 🔄 Navigation facile entre les questions et réponses
- 🎨 Interface utilisateur simple et responsive


## 🗂️ Structure du projet

```
reviser-en-info/
├── flashcards_data.json   # Données des flashcards (questions/réponses + thèmes)
├── index.html             # Page principale de l'application
├── script.js              # Logique JavaScript pour l'interactivité
└── style.css              # Styles CSS pour l'apparence
```


## 💻 Installation \& Utilisation

1. **Cloner le dépôt :**

```bash
git clone https://github.com/Tinyglo0/reviser-en-info.git
cd reviser-en-info
```
2. Lancer un serveur http (en local seulement)

    - Le serveur HTTP va permettre de charger le contenu des questions présentes dans le fichier `flashcards_data.json`.

Le serveur http peut être lancé en local avec la commande suivante (le port utilisé ici est 8000 mais vous pouvez mettre celui que vous voulez):

```bash
python -m http.server 8000	
```

3. **Ouvrir l'application :**
    - En local : http://localhost:8000
    
> Aucun serveur ou installation supplémentaire n’est nécessaire.

## 📦 Dépendances

Ce projet n’utilise aucune dépendance externe. Tout est en **HTML**, **CSS** et **JavaScript** natif.

## ✨ Contribution

Les contributions sont les bienvenues ! N’hésite pas à ouvrir une issue ou une pull request pour suggérer des améliorations, corriger des bugs ou ajouter de nouvelles fonctionnalités.
