// ÉTAT GLOBAL DE L'APPLICATION
const etat = {
  format12h: false,              // true = format 12h (AM/PM), false = format 24h
  afficherDate: true,            // true = la date est visible, false = masquée
  fuseauHoraire: 'Africa/Douala', // Fuseau horaire actif (identifiant IANA)
  heureAlarme: null,             // Heure de l'alarme réglée (format "HH:MM") ou null
  alarmeSonnerie: false,         // true = l'alarme sonne actuellement
};

// Données récupérées une seule fois au démarrage 
const elements = {
  chiffreHeures:      document.getElementById('chiffre-heures'),
  chiffreMinutes:     document.getElementById('chiffre-minutes'),
  chiffreSecondes:    document.getElementById('chiffre-secondes'),
  indicateurAmpm:     document.getElementById('indicateur-ampm'),
  affichageDate:      document.getElementById('affichage-date'),
  remplissageSecondes:document.getElementById('remplissage-secondes'),
  selecteurFuseau:    document.getElementById('selecteur-fuseau'),
  libellFormat:       document.getElementById('libelle-format'),
  sectionAlarme:      document.getElementById('section-alarme'),
  saisieAlarme:       document.getElementById('saisie-alarme'),
  statutAlarme:       document.getElementById('statut-alarme'),
  popupAlarme:        document.getElementById('popup-alarme'),
};

// Ajoute un zéro devant un nombre si nécessaire
const ajouterZero = (n) => String(n).padStart(2, '0');

// Retourne la date correspondante à l'heure actuelle dans le fuseau horaire sélectionné 
function obtenirHeureFuseau() {
  const fuseau = etat.fuseauHoraire;

  // Si fuseau local (Douala), retourner directement la date système
  if (fuseau === 'Africa/Douala') {
    return new Date();
  }

  // Sinon, convertir via toLocaleString dans le bon fuseau
  const chaineLocale = new Date().toLocaleString('en-US', { timeZone: fuseau });
  return new Date(chaineLocale);
}

// Met à jour l'affichage : heure, date, barre de secondes, alarme
function mettreAJour() {
  const maintenant = obtenirHeureFuseau();

  // Extraire les composantes de l'heure
  let heures = maintenant.getHours();
  const minutes = maintenant.getMinutes();
  const secondes = maintenant.getSeconds();
  let texteAmpm = ''; // Vide en mode 24h

  // Conversion en format 12h si activé 
  if (etat.format12h) {
    texteAmpm = heures >= 12 ? 'PM' : 'AM'; // Déterminer AM ou PM
    heures = heures % 12 || 12;              // Convertir 0 → 12, 13 → 1, etc.
  }

  // MAJ les chiffres avec animation si la valeur change 
  mettreAJourChiffre(elements.chiffreHeures,   ajouterZero(heures));
  mettreAJourChiffre(elements.chiffreMinutes,  ajouterZero(minutes));
  mettreAJourChiffre(elements.chiffreSecondes, ajouterZero(secondes));

  // MAJ l'indicateur AM/PM 
  elements.indicateurAmpm.textContent = texteAmpm;

  // MAJ la barre de progression des secondes
  // Les secondes vont de 0 à 59 → on calcule un pourcentage
  elements.remplissageSecondes.style.width = ((secondes / 59) * 100) + '%';

  // MAJ la date 
  if (etat.afficherDate) {
    // Formater la date en français (ex: "mardi 7 janvier 2025")
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.affichageDate.textContent = maintenant.toLocaleDateString('fr-FR', optionsDate);
    elements.affichageDate.style.opacity = '1'; // Afficher
  } else {
    elements.affichageDate.style.opacity = '0'; // Masquer (sans supprimer l'espace)
  }

  // Vérifier si l'alarme doit sonner 
  verifierAlarme(ajouterZero(maintenant.getHours()), ajouterZero(minutes));
}

// Met à jour le texte d'un chiffre et déclenche une animation uniquement si la valeur a changé.
function mettreAJourChiffre(elementChiffre, nouvelleValeur) {
  // Ne rien faire si la valeur est identique (évite des animations inutiles)
  if (elementChiffre.textContent !== nouvelleValeur) {
    elementChiffre.textContent = nouvelleValeur;

    // Relancer l'animation CSS en forçant un reflow
    elementChiffre.classList.remove('animation-changement');
    void elementChiffre.offsetWidth; // Force le navigateur à recalculer le style
    elementChiffre.classList.add('animation-changement');
  }
}

// Vérifie si l'heure actuelle correspond à l'heure de l'alarme. Si oui, déclenche la sonnerie.
function verifierAlarme(hh, mm) {
  // Ne rien faire si aucune alarme n'est réglée ou si elle sonne déjà
  if (!etat.heureAlarme || etat.alarmeSonnerie) return;

  // Comparer l'heure actuelle à l'heure de l'alarme
  const heureActuelle = `${hh}:${mm}`;
  if (heureActuelle === etat.heureAlarme) {
    declencherAlarme();
  }
}

// Déclenche la sonnerie de l'alarme : affiche la popup, vibre si l'appareil le supporte
function declencherAlarme() {
  etat.alarmeSonnerie = true;               // Marquer comme en cours de sonnerie
  elements.popupAlarme.classList.add('actif'); // Afficher la popup

  // Vibration sur mobile (si prise en charge par le navigateur)
  if (navigator.vibrate) {
    navigator.vibrate([300, 100, 300, 100, 300]);
  }
}

// Arrête et réinitialise l'alarme (appelé par le bouton OK dans la popup)
function dismissAlarm() {
  elements.popupAlarme.classList.remove('actif'); // Masquer la popup
  etat.alarmeSonnerie = false;                    // Réinitialiser l'état de sonnerie
  etat.heureAlarme = null;                        // Effacer l'alarme
  elements.saisieAlarme.value = '';               // Vider le champ de saisie
  elements.statutAlarme.textContent = 'Alarme désactivée.';

  // Effacer le message de statut après 2 secondes
  setTimeout(() => elements.statutAlarme.textContent = '', 2000);
}

// Rendre dismissAlarm accessible depuis le HTML (onclick="dismissAlarm()")
window.dismissAlarm = dismissAlarm;

// Bouton "Format 12h / 24h"
// Bascule entre le format 12 heures (AM/PM) et 24 heures
document.getElementById('bouton-format').addEventListener('click', () => {
  etat.format12h = !etat.format12h; // Inverser le mode

  // MAJ le texte du bouton selon le mode actif
  elements.libellFormat.textContent = etat.format12h ? '12H → 24H' : '24H → 12H';

  // Rafraîchir immédiatement l'affichage
  mettreAJour();
});

// Affiche ou masque la ligne de date sous l'horloge
document.getElementById('bouton-date').addEventListener('click', () => {
  etat.afficherDate = !etat.afficherDate; // Inverser la visibilité
  mettreAJour(); // Rafraîchir l'affichage
});

// Sélecteur de fuseau horaire 
elements.selecteurFuseau.addEventListener('change', () => {
  etat.fuseauHoraire = elements.selecteurFuseau.value; // Mettre à jour le fuseau
  mettreAJour(); // Rafraîchir immédiatement avec le nouveau fuseau
});

// Affiche ou masque le panneau de réglage de l'alarme
document.getElementById('bouton-alarme').addEventListener('click', () => {
  const panneau = elements.sectionAlarme;

  // Vérifier si le panneau est actuellement caché
  if (panneau.style.display === 'none' || panneau.style.display === '') {
    panneau.style.display = 'flex'; // Afficher
  } else {
    panneau.style.display = 'none'; // Masquer
  }
});

// Enregistre l'heure saisie comme heure d'alarme
document.getElementById('bouton-definir-alarme').addEventListener('click', () => {
  const valeurSaisie = elements.saisieAlarme.value;

  // Vérifier qu'une heure a bien été saisie
  if (!valeurSaisie) {
    elements.statutAlarme.textContent = 'Veuillez choisir une heure.';
    return;
  }

  // Prendre uniquement "HH:MM" (ignorer les secondes si présentes)
  etat.heureAlarme = valeurSaisie.substring(0, 5);
  etat.alarmeSonnerie = false; // S'assurer que la sonnerie est réinitialisée

  // Confirmer à l'utilisateur
  elements.statutAlarme.textContent = `Alarme réglée pour ${etat.heureAlarme}`;
});

// Annule l'alarme réglée sans la déclencher
document.getElementById('bouton-effacer-alarme').addEventListener('click', () => {
  etat.heureAlarme = null;           // Supprimer l'alarme
  etat.alarmeSonnerie = false;       // Réinitialiser la sonnerie
  elements.saisieAlarme.value = '';  // Vider le champ

  elements.statutAlarme.textContent = 'Alarme effacée.';

  // Effacer le message de statut après 2 secondes
  setTimeout(() => elements.statutAlarme.textContent = '', 2000);
});

// Premier affichage immédiat (sans attendre 1 seconde)
mettreAJour();

// Mise à jour automatique toutes les secondes (1000 ms)
setInterval(mettreAJour, 1000);