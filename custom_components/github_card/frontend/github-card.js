/*
 * GitHub Card for Home Assistant
 * https://github.com/juju35/ha-github
 *
 * Lovelace cards for the core GitHub integration (https://www.home-assistant.io/integrations/github/):
 * stars, forks, watchers, open issues and pull requests, and the latest release, tag, commit, issue,
 * pull request and discussion of each repository. Entities are discovered automatically through the
 * entity registry (platform "github", translation key, device), whatever the language.
 */

const VERSION = "2.5.0";

// Material Design Icons paths.
const ICONS = {
  github:
    "M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z",
  star: "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z",
  fork: "M6,2A3,3 0 0,1 9,5C9,6.28 8.19,7.38 7.06,7.81C7.15,8.27 7.39,8.83 8,9.63C9,10.92 11,12.83 12,14.17C13,12.83 15,10.92 16,9.63C16.61,8.83 16.85,8.27 16.94,7.81C15.81,7.38 15,6.28 15,5A3,3 0 0,1 18,2A3,3 0 0,1 21,5C21,6.32 20.14,7.45 18.95,7.85C18.87,8.37 18.64,9 18,9.83C17,11.17 15,13.08 14,14.38C13.39,15.17 13.15,15.73 13.06,16.19C14.19,16.62 15,17.72 15,19A3,3 0 0,1 12,22A3,3 0 0,1 9,19C9,17.72 9.81,16.62 10.94,16.19C10.85,15.73 10.61,15.17 10,14.38C9,13.08 7,11.17 6,9.83C5.36,9 5.13,8.37 5.05,7.85C3.86,7.45 3,6.32 3,5A3,3 0 0,1 6,2M6,4A1,1 0 0,0 5,5A1,1 0 0,0 6,6A1,1 0 0,0 7,5A1,1 0 0,0 6,4M18,4A1,1 0 0,0 17,5A1,1 0 0,0 18,6A1,1 0 0,0 19,5A1,1 0 0,0 18,4M12,18A1,1 0 0,0 11,19A1,1 0 0,0 12,20A1,1 0 0,0 13,19A1,1 0 0,0 12,18Z",
  eye: "M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z",
  issue: "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,9.5A2.5,2.5 0 0,0 9.5,12A2.5,2.5 0 0,0 12,14.5A2.5,2.5 0 0,0 14.5,12A2.5,2.5 0 0,0 12,9.5Z",
  pr: "M6,3A3,3 0 0,1 9,6C9,7.31 8.17,8.42 7,8.83V15.17C8.17,15.58 9,16.69 9,18A3,3 0 0,1 6,21A3,3 0 0,1 3,18C3,16.69 3.83,15.58 5,15.17V8.83C3.83,8.42 3,7.31 3,6A3,3 0 0,1 6,3M6,5A1,1 0 0,0 5,6A1,1 0 0,0 6,7A1,1 0 0,0 7,6A1,1 0 0,0 6,5M6,17A1,1 0 0,0 5,18A1,1 0 0,0 6,19A1,1 0 0,0 7,18A1,1 0 0,0 6,17M21,18A3,3 0 0,1 18,21A3,3 0 0,1 15,18C15,16.69 15.83,15.58 17,15.17V7H15V10.25L10.75,6L15,1.75V5H17A2,2 0 0,1 19,7V15.17C20.17,15.58 21,16.69 21,18M18,17A1,1 0 0,0 17,18A1,1 0 0,0 18,19A1,1 0 0,0 19,18A1,1 0 0,0 18,17Z",
  merge: "M7,3A3,3 0 0,1 10,6C10,7.29 9.19,8.39 8.04,8.81C8.58,13.81 13.08,14.77 15.19,14.96C15.61,13.81 16.71,13 18,13A3,3 0 0,1 21,16A3,3 0 0,1 18,19C16.69,19 15.57,18.16 15.16,17C10.91,16.8 9.44,15.19 8,13.39V15.17C9.17,15.58 10,16.69 10,18A3,3 0 0,1 7,21A3,3 0 0,1 4,18C4,16.69 4.83,15.58 6,15.17V8.83C4.83,8.42 4,7.31 4,6A3,3 0 0,1 7,3M7,5A1,1 0 0,0 6,6A1,1 0 0,0 7,7A1,1 0 0,0 8,6A1,1 0 0,0 7,5M7,17A1,1 0 0,0 6,18A1,1 0 0,0 7,19A1,1 0 0,0 8,18A1,1 0 0,0 7,17M18,15A1,1 0 0,0 17,16A1,1 0 0,0 18,17A1,1 0 0,0 19,16A1,1 0 0,0 18,15Z",
  forum: "M17,12V3A1,1 0 0,0 16,2H3A1,1 0 0,0 2,3V17L6,13H16A1,1 0 0,0 17,12M21,6H19V15H6V17A1,1 0 0,0 7,18H18L22,22V7A1,1 0 0,0 21,6Z",
  download: "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z",
  tag: "M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.44 21.77,11.94 21.41,11.58Z",
  release: "M12,2L3,7V17L12,22L21,17V7L12,2M12,4.31L18.47,7.9L12,11.5L5.53,7.9L12,4.31M5,9.6L11,12.94V19.6L5,16.27V9.6M13,19.6V12.94L19,9.6V16.27L13,19.6Z",
  commit: "M17,12C17,14.42 15.28,16.44 13,16.9V21H11V16.9C8.72,16.44 7,14.42 7,12C7,9.58 8.72,7.56 11,7.1V3H13V7.1C15.28,7.56 17,9.58 17,12M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z",
  group: "M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z",
  account: "M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z",
  code: "M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z",
  open: "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z",
  chevron: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  // mdi:arrow-expand and mdi:arrow-collapse, for the zoom button of the mini card.
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
};

// ---------------------------------------------------------------------------
// Translations: one list per language, in the order of KEYS (the tests check the parity).
// Counts use the "label: {n}" form, which reads right in every language whatever its plural rules.
// ---------------------------------------------------------------------------

const KEYS = [
  "stars", "forks", "watchers", "issues", "pulls", "merged_pulls", "discussions", "downloads",
  "latest_release", "latest_tag", "latest_commit", "latest_issue", "latest_pull_request", "latest_discussion",
  "account", "followers", "following", "public_repos", "public_gists",
  "repos_n", "open_none", "open_n", "unknown", "open_github", "no_github", "zoom_in", "zoom_out",
  // Editor
  "title", "repositories", "show_latest", "show_account", "show_title", "show_subtitle", "sort", "sort_name", "sort_stars", "sort_open",
  "max_repos", "zoom", "zoom_helper", "language", "lang_auto",
  // Empty state
  "no_repos", "no_repos_hint", "no_match", "open_integration",
];

const TRANSLATIONS = {
  en: [
    "Stars", "Forks", "Watchers", "Issues", "Pull requests", "Merged PRs", "Discussions", "Downloads",
    "Latest release", "Latest tag", "Latest commit", "Latest issue", "Latest pull request", "Latest discussion",
    "Account", "Followers", "Following", "Public repositories", "Public gists",
    "Repositories: {n}", "Nothing open", "Open: {n}", "Unknown", "Open on GitHub",
    "No GitHub entities found. Is the GitHub integration set up with at least one repository?",
    "Show the full card", "Back to the compact view",
    "Title (optional, defaults to GitHub)", "Repositories (optional, all by default)", "Show latest activity", "Show account",
    "Sort repositories", "By name", "By stars", "By open issues and pull requests", "Show title", "Show subtitle",
    "Repositories in the compact view", "Zoom button", "Switches the card to the full card and back", "Language", "Automatic",
    "No repository followed", "Add your repositories to the GitHub integration to see them here.", "None of the repositories of the card is followed by the GitHub integration.", "Open the GitHub integration",
  ],
  fr: [
    "Étoiles", "Forks", "Observateurs", "Issues", "Pull requests", "PR fusionnées", "Discussions", "Téléchargements",
    "Dernière version", "Dernier tag", "Dernier commit", "Dernière issue", "Dernière pull request", "Dernière discussion",
    "Compte", "Abonnés", "Abonnements", "Dépôts publics", "Gists publics",
    "Dépôts : {n}", "Rien en attente", "Ouverts : {n}", "Inconnu", "Ouvrir sur GitHub",
    "Aucune entité GitHub trouvée. L’intégration GitHub est-elle configurée avec au moins un dépôt ?",
    "Afficher la carte complète", "Revenir à la vue compacte",
    "Titre (facultatif, GitHub par défaut)", "Dépôts (facultatif, tous par défaut)", "Afficher l’activité récente", "Afficher le compte",
    "Tri des dépôts", "Par nom", "Par étoiles", "Par issues et pull requests ouvertes", "Afficher le titre", "Afficher le sous-titre",
    "Dépôts dans la vue compacte", "Bouton zoom", "Bascule la carte en carte complète, et inversement", "Langue", "Automatique",
    "Aucun dépôt suivi", "Ajoutez vos dépôts à l’intégration GitHub pour les afficher ici.", "Aucun des dépôts de la carte n’est suivi par l’intégration GitHub.", "Ouvrir l’intégration GitHub",
  ],
  de: [
    "Sterne", "Forks", "Beobachter", "Issues", "Pull Requests", "Gemergte PRs", "Diskussionen", "Downloads",
    "Neuestes Release", "Neuester Tag", "Letzter Commit", "Neuestes Issue", "Neuester Pull Request", "Neueste Diskussion",
    "Konto", "Follower", "Folgt", "Öffentliche Repositorys", "Öffentliche Gists",
    "Repositorys: {n}", "Nichts offen", "Offen: {n}", "Unbekannt", "Auf GitHub öffnen",
    "Keine GitHub-Entitäten gefunden. Ist die GitHub-Integration mit mindestens einem Repository eingerichtet?",
    "Vollständige Karte anzeigen", "Zurück zur kompakten Ansicht",
    "Titel (optional, standardmäßig GitHub)", "Repositorys (optional, standardmäßig alle)", "Letzte Aktivität anzeigen", "Konto anzeigen",
    "Sortierung der Repositorys", "Nach Name", "Nach Sternen", "Nach offenen Issues und Pull Requests", "Titel anzeigen", "Untertitel anzeigen",
    "Repositorys in der kompakten Ansicht", "Zoom-Schaltfläche", "Schaltet zwischen kompakter und vollständiger Karte um", "Sprache", "Automatisch",
    "Kein Repository verfolgt", "Füge deine Repositorys in der GitHub-Integration hinzu, um sie hier zu sehen.", "Keines der Repositorys der Karte wird von der GitHub-Integration verfolgt.", "GitHub-Integration öffnen",
  ],
  es: [
    "Estrellas", "Forks", "Observadores", "Issues", "Pull requests", "PR fusionadas", "Discusiones", "Descargas",
    "Última versión", "Última etiqueta", "Último commit", "Última issue", "Última pull request", "Última discusión",
    "Cuenta", "Seguidores", "Siguiendo", "Repositorios públicos", "Gists públicos",
    "Repositorios: {n}", "Nada abierto", "Abiertos: {n}", "Desconocido", "Abrir en GitHub",
    "No se encontraron entidades de GitHub. ¿Está configurada la integración GitHub con al menos un repositorio?",
    "Mostrar la tarjeta completa", "Volver a la vista compacta",
    "Título (opcional, GitHub por defecto)", "Repositorios (opcional, todos por defecto)", "Mostrar la actividad reciente", "Mostrar la cuenta",
    "Orden de los repositorios", "Por nombre", "Por estrellas", "Por issues y pull requests abiertas", "Mostrar el título", "Mostrar el subtítulo",
    "Repositorios en la vista compacta", "Botón de zoom", "Alterna entre la tarjeta completa y la vista compacta", "Idioma", "Automático",
    "Ningún repositorio seguido", "Añade tus repositorios a la integración GitHub para verlos aquí.", "La integración GitHub no sigue ninguno de los repositorios de la tarjeta.", "Abrir la integración GitHub",
  ],
  sr: [
    "Звездице", "Форкови", "Посматрачи", "Проблеми", "Pull захтеви", "Спојени PR", "Дискусије", "Преузимања",
    "Најновије издање", "Најновија ознака", "Последњи комит", "Последњи проблем", "Последњи pull захтев", "Последња дискусија",
    "Налог", "Пратиоци", "Прати", "Јавни репозиторијуми", "Јавни гистови",
    "Репозиторијуми: {n}", "Ништа отворено", "Отворено: {n}", "Непознато", "Отвори на GitHub-у",
    "Није пронађен ниједан GitHub ентитет. Да ли је интеграција GitHub подешена са бар једним репозиторијумом?",
    "Прикажи целу картицу", "Назад на компактни приказ",
    "Наслов (опционо, подразумевано GitHub)", "Репозиторијуми (опционо, подразумевано сви)", "Прикажи недавну активност", "Прикажи налог",
    "Редослед репозиторијума", "По имену", "По звездицама", "По отвореним проблемима и pull захтевима", "Прикажи наслов", "Прикажи поднаслов",
    "Репозиторијуми у компактном приказу", "Дугме за зумирање", "Пребацује између целе картице и компактног приказа", "Језик", "Аутоматски",
    "Ниједан репозиторијум се не прати", "Додајте своје репозиторијуме у интеграцију GitHub да бисте их видели овде.", "Интеграција GitHub не прати ниједан репозиторијум картице.", "Отвори интеграцију GitHub",
  ],
  "sr-Latn": [
    "Zvezdice", "Forkovi", "Posmatrači", "Problemi", "Pull zahtevi", "Spojeni PR", "Diskusije", "Preuzimanja",
    "Najnovije izdanje", "Najnovija oznaka", "Poslednji komit", "Poslednji problem", "Poslednji pull zahtev", "Poslednja diskusija",
    "Nalog", "Pratioci", "Prati", "Javni repozitorijumi", "Javni gistovi",
    "Repozitorijumi: {n}", "Ništa otvoreno", "Otvoreno: {n}", "Nepoznato", "Otvori na GitHub-u",
    "Nije pronađen nijedan GitHub entitet. Da li je integracija GitHub podešena sa bar jednim repozitorijumom?",
    "Prikaži celu karticu", "Nazad na kompaktni prikaz",
    "Naslov (opciono, podrazumevano GitHub)", "Repozitorijumi (opciono, podrazumevano svi)", "Prikaži nedavnu aktivnost", "Prikaži nalog",
    "Redosled repozitorijuma", "Po imenu", "Po zvezdicama", "Po otvorenim problemima i pull zahtevima", "Prikaži naslov", "Prikaži podnaslov",
    "Repozitorijumi u kompaktnom prikazu", "Dugme za zumiranje", "Prebacuje između cele kartice i kompaktnog prikaza", "Jezik", "Automatski",
    "Nijedan repozitorijum se ne prati", "Dodajte svoje repozitorijume u integraciju GitHub da biste ih videli ovde.", "Integracija GitHub ne prati nijedan repozitorijum kartice.", "Otvori integraciju GitHub",
  ],
  it: [
    "Stelle", "Fork", "Osservatori", "Issue", "Pull request", "PR unite", "Discussioni", "Download",
    "Ultima release", "Ultimo tag", "Ultimo commit", "Ultima issue", "Ultima pull request", "Ultima discussione",
    "Account", "Follower", "Seguiti", "Repository pubblici", "Gist pubblici",
    "Repository: {n}", "Niente di aperto", "Aperti: {n}", "Sconosciuto", "Apri su GitHub",
    "Nessuna entità GitHub trovata. L’integrazione GitHub è configurata con almeno un repository?",
    "Mostra la scheda completa", "Torna alla vista compatta",
    "Titolo (facoltativo, GitHub per impostazione predefinita)", "Repository (facoltativo, tutti per impostazione predefinita)", "Mostra l’attività recente", "Mostra l’account",
    "Ordinamento dei repository", "Per nome", "Per stelle", "Per issue e pull request aperte", "Mostra il titolo", "Mostra il sottotitolo",
    "Repository nella vista compatta", "Pulsante zoom", "Alterna tra la scheda completa e la vista compatta", "Lingua", "Automatica",
    "Nessun repository seguito", "Aggiungi i tuoi repository all’integrazione GitHub per vederli qui.", "L’integrazione GitHub non segue nessuno dei repository della scheda.", "Apri l’integrazione GitHub",
  ],
  nl: [
    "Sterren", "Forks", "Kijkers", "Issues", "Pull requests", "Samengevoegde PR’s", "Discussies", "Downloads",
    "Nieuwste release", "Nieuwste tag", "Laatste commit", "Nieuwste issue", "Nieuwste pull request", "Nieuwste discussie",
    "Account", "Volgers", "Volgend", "Openbare repositories", "Openbare gists",
    "Repositories: {n}", "Niets open", "Open: {n}", "Onbekend", "Openen op GitHub",
    "Geen GitHub-entiteiten gevonden. Is de GitHub-integratie ingesteld met ten minste één repository?",
    "Volledige kaart tonen", "Terug naar de compacte weergave",
    "Titel (optioneel, standaard GitHub)", "Repositories (optioneel, standaard alle)", "Recente activiteit tonen", "Account tonen",
    "Sortering van repositories", "Op naam", "Op sterren", "Op open issues en pull requests", "Titel tonen", "Ondertitel tonen",
    "Repositories in de compacte weergave", "Zoomknop", "Schakelt tussen de volledige kaart en de compacte weergave", "Taal", "Automatisch",
    "Geen repository gevolgd", "Voeg je repositories toe aan de GitHub-integratie om ze hier te zien.", "De GitHub-integratie volgt geen enkele repository van de kaart.", "GitHub-integratie openen",
  ],
  pt: [
    "Estrelas", "Forks", "Observadores", "Issues", "Pull requests", "PR integrados", "Discussões", "Transferências",
    "Versão mais recente", "Etiqueta mais recente", "Último commit", "Issue mais recente", "Pull request mais recente", "Discussão mais recente",
    "Conta", "Seguidores", "A seguir", "Repositórios públicos", "Gists públicos",
    "Repositórios: {n}", "Nada em aberto", "Em aberto: {n}", "Desconhecido", "Abrir no GitHub",
    "Nenhuma entidade GitHub encontrada. A integração GitHub está configurada com pelo menos um repositório?",
    "Mostrar o cartão completo", "Voltar à vista compacta",
    "Título (opcional, GitHub por predefinição)", "Repositórios (opcional, todos por predefinição)", "Mostrar a atividade recente", "Mostrar a conta",
    "Ordenação dos repositórios", "Por nome", "Por estrelas", "Por issues e pull requests em aberto", "Mostrar o título", "Mostrar o subtítulo",
    "Repositórios na vista compacta", "Botão de zoom", "Alterna entre o cartão completo e a vista compacta", "Idioma", "Automático",
    "Nenhum repositório seguido", "Adicione os seus repositórios à integração GitHub para os ver aqui.", "A integração GitHub não segue nenhum dos repositórios do cartão.", "Abrir a integração GitHub",
  ],
  pl: [
    "Gwiazdki", "Forki", "Obserwatorzy", "Zgłoszenia", "Pull requesty", "Scalone PR", "Dyskusje", "Pobrania",
    "Najnowsze wydanie", "Najnowszy tag", "Ostatni commit", "Najnowsze zgłoszenie", "Najnowszy pull request", "Najnowsza dyskusja",
    "Konto", "Obserwujący", "Obserwowani", "Publiczne repozytoria", "Publiczne gisty",
    "Repozytoria: {n}", "Nic otwartego", "Otwarte: {n}", "Nieznany", "Otwórz w GitHub",
    "Nie znaleziono encji GitHub. Czy integracja GitHub jest skonfigurowana z co najmniej jednym repozytorium?",
    "Pokaż pełną kartę", "Wróć do widoku kompaktowego",
    "Tytuł (opcjonalny, domyślnie GitHub)", "Repozytoria (opcjonalne, domyślnie wszystkie)", "Pokaż ostatnią aktywność", "Pokaż konto",
    "Sortowanie repozytoriów", "Według nazwy", "Według gwiazdek", "Według otwartych zgłoszeń i pull requestów", "Pokaż tytuł", "Pokaż podtytuł",
    "Repozytoria w widoku kompaktowym", "Przycisk powiększenia", "Przełącza między pełną kartą a widokiem kompaktowym", "Język", "Automatyczny",
    "Brak śledzonych repozytoriów", "Dodaj swoje repozytoria do integracji GitHub, aby zobaczyć je tutaj.", "Integracja GitHub nie śledzi żadnego z repozytoriów karty.", "Otwórz integrację GitHub",
  ],
  ro: [
    "Stele", "Fork-uri", "Observatori", "Issue-uri", "Pull request-uri", "PR-uri îmbinate", "Discuții", "Descărcări",
    "Cea mai recentă versiune", "Cea mai recentă etichetă", "Ultimul commit", "Cel mai recent issue", "Cel mai recent pull request", "Cea mai recentă discuție",
    "Cont", "Urmăritori", "Urmăriți", "Depozite publice", "Gist-uri publice",
    "Depozite: {n}", "Nimic deschis", "Deschise: {n}", "Necunoscut", "Deschide pe GitHub",
    "Nu s-au găsit entități GitHub. Este integrarea GitHub configurată cu cel puțin un depozit?",
    "Afișează cardul complet", "Înapoi la vizualizarea compactă",
    "Titlu (opțional, implicit GitHub)", "Depozite (opțional, implicit toate)", "Afișează activitatea recentă", "Afișează contul",
    "Sortarea depozitelor", "După nume", "După stele", "După issue-uri și pull request-uri deschise", "Afișează titlul", "Afișează subtitlul",
    "Depozite în vizualizarea compactă", "Buton de zoom", "Comută între cardul complet și vizualizarea compactă", "Limbă", "Automat",
    "Niciun depozit urmărit", "Adaugă depozitele tale în integrarea GitHub pentru a le vedea aici.", "Integrarea GitHub nu urmărește niciunul dintre depozitele cardului.", "Deschide integrarea GitHub",
  ],
  da: [
    "Stjerner", "Forks", "Overvågere", "Issues", "Pull requests", "Flettede PR’er", "Diskussioner", "Downloads",
    "Seneste udgivelse", "Seneste tag", "Seneste commit", "Seneste issue", "Seneste pull request", "Seneste diskussion",
    "Konto", "Følgere", "Følger", "Offentlige repositories", "Offentlige gists",
    "Repositories: {n}", "Intet åbent", "Åbne: {n}", "Ukendt", "Åbn på GitHub",
    "Ingen GitHub-enheder fundet. Er GitHub-integrationen sat op med mindst ét repository?",
    "Vis hele kortet", "Tilbage til kompakt visning",
    "Titel (valgfri, GitHub som standard)", "Repositories (valgfri, alle som standard)", "Vis seneste aktivitet", "Vis konto",
    "Sortering af repositories", "Efter navn", "Efter stjerner", "Efter åbne issues og pull requests", "Vis titel", "Vis undertitel",
    "Repositories i kompakt visning", "Zoomknap", "Skifter mellem hele kortet og kompakt visning", "Sprog", "Automatisk",
    "Ingen repositories fulgt", "Tilføj dine repositories i GitHub-integrationen for at se dem her.", "GitHub-integrationen følger ingen af kortets repositories.", "Åbn GitHub-integrationen",
  ],
  sv: [
    "Stjärnor", "Forks", "Bevakare", "Ärenden", "Pull requests", "Sammanfogade PR", "Diskussioner", "Nedladdningar",
    "Senaste release", "Senaste tagg", "Senaste commit", "Senaste ärende", "Senaste pull request", "Senaste diskussion",
    "Konto", "Följare", "Följer", "Publika repon", "Publika gists",
    "Repon: {n}", "Inget öppet", "Öppna: {n}", "Okänd", "Öppna på GitHub",
    "Inga GitHub-entiteter hittades. Är GitHub-integrationen konfigurerad med minst ett repo?",
    "Visa hela kortet", "Tillbaka till kompakt vy",
    "Titel (valfri, GitHub som standard)", "Repon (valfritt, alla som standard)", "Visa senaste aktivitet", "Visa konto",
    "Sortering av repon", "Efter namn", "Efter stjärnor", "Efter öppna ärenden och pull requests", "Visa rubrik", "Visa underrubrik",
    "Repon i kompakt vy", "Zoomknapp", "Växlar mellan hela kortet och kompakt vy", "Språk", "Automatiskt",
    "Inga repon följs", "Lägg till dina repon i GitHub-integrationen för att se dem här.", "GitHub-integrationen följer inget av kortets repon.", "Öppna GitHub-integrationen",
  ],
  bg: [
    "Звезди", "Форкове", "Наблюдаващи", "Проблеми", "Pull заявки", "Слети PR", "Дискусии", "Изтегляния",
    "Последна версия", "Последен таг", "Последен commit", "Последен проблем", "Последна pull заявка", "Последна дискусия",
    "Акаунт", "Последователи", "Следвани", "Публични хранилища", "Публични gist-ове",
    "Хранилища: {n}", "Нищо отворено", "Отворени: {n}", "Неизвестно", "Отвори в GitHub",
    "Не са намерени GitHub обекти. Настроена ли е интеграцията GitHub с поне едно хранилище?",
    "Покажи цялата карта", "Обратно към компактния изглед",
    "Заглавие (по избор, по подразбиране GitHub)", "Хранилища (по избор, по подразбиране всички)", "Покажи последната активност", "Покажи акаунта",
    "Подреждане на хранилищата", "По име", "По звезди", "По отворени проблеми и pull заявки", "Показване на заглавието", "Показване на подзаглавието",
    "Хранилища в компактния изглед", "Бутон за мащабиране", "Превключва между цялата карта и компактния изглед", "Език", "Автоматично",
    "Няма следени хранилища", "Добавете хранилищата си в интеграцията GitHub, за да ги видите тук.", "Интеграцията GitHub не следи нито едно от хранилищата на картата.", "Отвори интеграцията GitHub",
  ],
  ru: [
    "Звёзды", "Форки", "Наблюдатели", "Задачи", "Pull-запросы", "Слитые PR", "Обсуждения", "Загрузки",
    "Последний релиз", "Последний тег", "Последний коммит", "Последняя задача", "Последний pull-запрос", "Последнее обсуждение",
    "Аккаунт", "Подписчики", "Подписки", "Публичные репозитории", "Публичные gist",
    "Репозитории: {n}", "Ничего не открыто", "Открыто: {n}", "Неизвестно", "Открыть на GitHub",
    "Сущности GitHub не найдены. Настроена ли интеграция GitHub хотя бы с одним репозиторием?",
    "Показать полную карточку", "Вернуться к компактному виду",
    "Заголовок (необязательно, по умолчанию GitHub)", "Репозитории (необязательно, по умолчанию все)", "Показывать последнюю активность", "Показывать аккаунт",
    "Сортировка репозиториев", "По имени", "По звёздам", "По открытым задачам и pull-запросам", "Показывать заголовок", "Показывать подзаголовок",
    "Репозитории в компактном виде", "Кнопка масштабирования", "Переключает между полной карточкой и компактным видом", "Язык", "Автоматически",
    "Нет отслеживаемых репозиториев", "Добавьте свои репозитории в интеграцию GitHub, чтобы увидеть их здесь.", "Интеграция GitHub не отслеживает ни один из репозиториев карточки.", "Открыть интеграцию GitHub",
  ],
  uk: [
    "Зірки", "Форки", "Спостерігачі", "Задачі", "Pull-запити", "Злиті PR", "Обговорення", "Завантаження",
    "Останній реліз", "Останній тег", "Останній коміт", "Остання задача", "Останній pull-запит", "Останнє обговорення",
    "Обліковий запис", "Підписники", "Стежить", "Публічні репозиторії", "Публічні gist",
    "Репозиторії: {n}", "Нічого не відкрито", "Відкрито: {n}", "Невідомо", "Відкрити на GitHub",
    "Сутності GitHub не знайдено. Чи налаштовано інтеграцію GitHub хоча б з одним репозиторієм?",
    "Показати повну картку", "Повернутися до компактного вигляду",
    "Заголовок (необов’язково, за замовчуванням GitHub)", "Репозиторії (необов’язково, за замовчуванням усі)", "Показувати останню активність", "Показувати обліковий запис",
    "Сортування репозиторіїв", "За назвою", "За зірками", "За відкритими задачами та pull-запитами", "Показувати заголовок", "Показувати підзаголовок",
    "Репозиторії в компактному вигляді", "Кнопка масштабування", "Перемикає між повною карткою та компактним виглядом", "Мова", "Автоматично",
    "Немає відстежуваних репозиторіїв", "Додайте свої репозиторії до інтеграції GitHub, щоб побачити їх тут.", "Інтеграція GitHub не відстежує жодного з репозиторіїв картки.", "Відкрити інтеграцію GitHub",
  ],
  hu: [
    "Csillagok", "Forkok", "Figyelők", "Hibajegyek", "Pull requestek", "Egyesített PR-ek", "Beszélgetések", "Letöltések",
    "Legújabb kiadás", "Legújabb címke", "Legutóbbi commit", "Legújabb hibajegy", "Legújabb pull request", "Legújabb beszélgetés",
    "Fiók", "Követők", "Követettek", "Nyilvános tárolók", "Nyilvános gistek",
    "Tárolók: {n}", "Nincs nyitott elem", "Nyitott: {n}", "Ismeretlen", "Megnyitás a GitHubon",
    "Nem található GitHub entitás. Be van állítva a GitHub integráció legalább egy tárolóval?",
    "Teljes kártya megjelenítése", "Vissza a kompakt nézethez",
    "Cím (nem kötelező, alapértelmezés: GitHub)", "Tárolók (nem kötelező, alapértelmezés: mind)", "Legutóbbi tevékenység megjelenítése", "Fiók megjelenítése",
    "Tárolók rendezése", "Név szerint", "Csillagok szerint", "Nyitott hibajegyek és pull requestek szerint", "Cím megjelenítése", "Alcím megjelenítése",
    "Tárolók a kompakt nézetben", "Nagyítás gomb", "Vált a teljes kártya és a kompakt nézet között", "Nyelv", "Automatikus",
    "Nincs követett tároló", "Add hozzá a tárolóidat a GitHub integrációhoz, hogy itt lásd őket.", "A GitHub integráció a kártya egyik tárolóját sem követi.", "GitHub integráció megnyitása",
  ],
  sk: [
    "Hviezdičky", "Forky", "Pozorovatelia", "Problémy", "Pull requesty", "Zlúčené PR", "Diskusie", "Stiahnutia",
    "Najnovšie vydanie", "Najnovší tag", "Posledný commit", "Najnovší problém", "Najnovší pull request", "Najnovšia diskusia",
    "Účet", "Sledovatelia", "Sleduje", "Verejné repozitáre", "Verejné gisty",
    "Repozitáre: {n}", "Nič otvorené", "Otvorené: {n}", "Neznámy", "Otvoriť na GitHube",
    "Nenašli sa žiadne entity GitHub. Je integrácia GitHub nastavená aspoň s jedným repozitárom?",
    "Zobraziť celú kartu", "Späť na kompaktné zobrazenie",
    "Názov (voliteľný, predvolene GitHub)", "Repozitáre (voliteľné, predvolene všetky)", "Zobraziť nedávnu aktivitu", "Zobraziť účet",
    "Zoradenie repozitárov", "Podľa názvu", "Podľa hviezdičiek", "Podľa otvorených problémov a pull requestov", "Zobraziť názov", "Zobraziť podnázov",
    "Repozitáre v kompaktnom zobrazení", "Tlačidlo priblíženia", "Prepína medzi celou kartou a kompaktným zobrazením", "Jazyk", "Automaticky",
    "Žiadny sledovaný repozitár", "Pridajte svoje repozitáre do integrácie GitHub, aby ste ich videli tu.", "Integrácia GitHub nesleduje žiadny z repozitárov karty.", "Otvoriť integráciu GitHub",
  ],
  cs: [
    "Hvězdičky", "Forky", "Pozorovatelé", "Problémy", "Pull requesty", "Sloučené PR", "Diskuze", "Stažení",
    "Nejnovější vydání", "Nejnovější tag", "Poslední commit", "Nejnovější problém", "Nejnovější pull request", "Nejnovější diskuze",
    "Účet", "Sledující", "Sleduje", "Veřejné repozitáře", "Veřejné gisty",
    "Repozitáře: {n}", "Nic otevřeného", "Otevřeno: {n}", "Neznámý", "Otevřít na GitHubu",
    "Nebyly nalezeny žádné entity GitHub. Je integrace GitHub nastavena alespoň s jedním repozitářem?",
    "Zobrazit celou kartu", "Zpět na kompaktní zobrazení",
    "Název (volitelný, výchozí GitHub)", "Repozitáře (volitelné, výchozí všechny)", "Zobrazit nedávnou aktivitu", "Zobrazit účet",
    "Řazení repozitářů", "Podle názvu", "Podle hvězdiček", "Podle otevřených problémů a pull requestů", "Zobrazit název", "Zobrazit podnázev",
    "Repozitáře v kompaktním zobrazení", "Tlačítko přiblížení", "Přepíná mezi celou kartou a kompaktním zobrazením", "Jazyk", "Automaticky",
    "Žádný sledovaný repozitář", "Přidejte své repozitáře do integrace GitHub, abyste je zde viděli.", "Integrace GitHub nesleduje žádný z repozitářů karty.", "Otevřít integraci GitHub",
  ],
  sl: [
    "Zvezdice", "Forki", "Opazovalci", "Težave", "Pull requesti", "Združeni PR", "Razprave", "Prenosi",
    "Najnovejša izdaja", "Najnovejša oznaka", "Zadnji commit", "Najnovejša težava", "Najnovejši pull request", "Najnovejša razprava",
    "Račun", "Sledilci", "Sledi", "Javni repozitoriji", "Javni gisti",
    "Repozitoriji: {n}", "Nič odprtega", "Odprto: {n}", "Neznano", "Odpri na GitHubu",
    "Ni najdenih entitet GitHub. Ali je integracija GitHub nastavljena z vsaj enim repozitorijem?",
    "Prikaži celotno kartico", "Nazaj na strnjen pogled",
    "Naslov (neobvezno, privzeto GitHub)", "Repozitoriji (neobvezno, privzeto vsi)", "Prikaži nedavno dejavnost", "Prikaži račun",
    "Razvrščanje repozitorijev", "Po imenu", "Po zvezdicah", "Po odprtih težavah in pull requestih", "Prikaži naslov", "Prikaži podnaslov",
    "Repozitoriji v strnjenem pogledu", "Gumb za povečavo", "Preklaplja med celotno kartico in strnjenim pogledom", "Jezik", "Samodejno",
    "Noben repozitorij ni spremljan", "Dodajte svoje repozitorije v integracijo GitHub, da jih vidite tukaj.", "Integracija GitHub ne spremlja nobenega repozitorija kartice.", "Odpri integracijo GitHub",
  ],
  lv: [
    "Zvaigznes", "Forki", "Vērotāji", "Problēmas", "Pull pieprasījumi", "Apvienotie PR", "Diskusijas", "Lejupielādes",
    "Jaunākais laidiens", "Jaunākā birka", "Pēdējais commit", "Jaunākā problēma", "Jaunākais pull pieprasījums", "Jaunākā diskusija",
    "Konts", "Sekotāji", "Seko", "Publiskās krātuves", "Publiskie gist",
    "Krātuves: {n}", "Nekas nav atvērts", "Atvērti: {n}", "Nezināms", "Atvērt GitHub",
    "Nav atrasta neviena GitHub entītija. Vai GitHub integrācija ir iestatīta ar vismaz vienu krātuvi?",
    "Rādīt pilno karti", "Atpakaļ uz kompakto skatu",
    "Virsraksts (neobligāts, pēc noklusējuma GitHub)", "Krātuves (neobligāti, pēc noklusējuma visas)", "Rādīt nesenās aktivitātes", "Rādīt kontu",
    "Krātuvju kārtošana", "Pēc nosaukuma", "Pēc zvaigznēm", "Pēc atvērtajām problēmām un pull pieprasījumiem", "Rādīt virsrakstu", "Rādīt apakšvirsrakstu",
    "Krātuves kompaktajā skatā", "Tālummaiņas poga", "Pārslēdz starp pilno karti un kompakto skatu", "Valoda", "Automātiski",
    "Netiek sekots nevienai krātuvei", "Pievienojiet savas krātuves GitHub integrācijai, lai tās redzētu šeit.", "GitHub integrācija neseko nevienai kartes krātuvei.", "Atvērt GitHub integrāciju",
  ],
  el: [
    "Αστέρια", "Forks", "Παρατηρητές", "Ζητήματα", "Pull requests", "Συγχωνευμένα PR", "Συζητήσεις", "Λήψεις",
    "Τελευταία έκδοση", "Τελευταία ετικέτα", "Τελευταίο commit", "Τελευταίο ζήτημα", "Τελευταίο pull request", "Τελευταία συζήτηση",
    "Λογαριασμός", "Ακόλουθοι", "Ακολουθεί", "Δημόσια αποθετήρια", "Δημόσια gists",
    "Αποθετήρια: {n}", "Τίποτα ανοιχτό", "Ανοιχτά: {n}", "Άγνωστο", "Άνοιγμα στο GitHub",
    "Δεν βρέθηκαν οντότητες GitHub. Έχει ρυθμιστεί η ενσωμάτωση GitHub με τουλάχιστον ένα αποθετήριο;",
    "Εμφάνιση πλήρους κάρτας", "Επιστροφή στη συμπαγή προβολή",
    "Τίτλος (προαιρετικός, προεπιλογή GitHub)", "Αποθετήρια (προαιρετικά, προεπιλογή όλα)", "Εμφάνιση πρόσφατης δραστηριότητας", "Εμφάνιση λογαριασμού",
    "Ταξινόμηση αποθετηρίων", "Κατά όνομα", "Κατά αστέρια", "Κατά ανοιχτά ζητήματα και pull requests", "Εμφάνιση τίτλου", "Εμφάνιση υπότιτλου",
    "Αποθετήρια στη συμπαγή προβολή", "Κουμπί μεγέθυνσης", "Εναλλάσσει μεταξύ πλήρους κάρτας και συμπαγούς προβολής", "Γλώσσα", "Αυτόματα",
    "Δεν παρακολουθείται κανένα αποθετήριο", "Προσθέστε τα αποθετήριά σας στην ενσωμάτωση GitHub για να τα δείτε εδώ.", "Η ενσωμάτωση GitHub δεν παρακολουθεί κανένα από τα αποθετήρια της κάρτας.", "Άνοιγμα της ενσωμάτωσης GitHub",
  ],
};

const STRINGS = Object.fromEntries(
  Object.entries(TRANSLATIONS).map(([l, list]) => [l, Object.fromEntries(KEYS.map((k, i) => [k, list[i]]))])
);

const LANGUAGES = [
  ["en", "English"], ["fr", "Français"], ["de", "Deutsch"], ["es", "Español"], ["sr", "Српски"], ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"], ["nl", "Nederlands"], ["pt", "Português (Portugal)"], ["pl", "Polski"], ["ro", "Română"], ["da", "Dansk"],
  ["sv", "Svenska"], ["bg", "Български"], ["ru", "Русский"], ["uk", "Українська"], ["hu", "Magyar"], ["sk", "Slovenčina"],
  ["cs", "Čeština"], ["sl", "Slovenščina"], ["lv", "Latviešu"], ["el", "Ελληνικά"],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

// Locale for Intl: Home Assistant's full locale when its base matches the card's language (keeps the region), else
// the resolved language; Home Assistant's "pt" is European Portuguese, which Intl would format as Brazilian.
const fmtLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  const loc = ha && ha.split("-")[0] === l ? ha : l;
  return loc === "pt" ? "pt-PT" : loc;
};

const t = (hass, config, key) => STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key;

/** A count in the compact notation of the locale (1.2k, 1,2 k, 78K…), the exact number in `fmtFull`. */
const fmtCount = (v, loc = "en") => {
  if (v === null || v === undefined) return "—";
  try {
    return new Intl.NumberFormat(loc, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  } catch {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v);
  }
};
const fmtFull = (v, loc = "en") => {
  if (v === null || v === undefined) return "—";
  try {
    return new Intl.NumberFormat(loc).format(v);
  } catch {
    return String(v);
  }
};

const isUnknown = (s) => !s || s.state === "unavailable" || s.state === "unknown";

/** Only web links: a state attribute never becomes a javascript: URL. */
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "")) ? String(u) : "");

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;

const fireMoreInfo = (node, entityId) => {
  if (!entityId) return;
  node.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
};

/** A click inside a dialog (more-info opened from the card) is not a click outside the card. */
const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

// Counters of a repository: translation key, label key, icon, colour class.
const REPO_STATS = [
  ["stargazers_count", "stars", ICONS.star, "star"],
  ["forks_count", "forks", ICONS.fork, "fork"],
  ["subscribers_count", "watchers", ICONS.eye, "watch"],
  ["issues_count", "issues", ICONS.issue, "issue"],
  ["pulls_count", "pulls", ICONS.pr, "pr"],
  ["merged_pulls_count", "merged_pulls", ICONS.merge, "merged"],
  ["discussions_count", "discussions", ICONS.forum, "disc"],
  ["latest_release_downloads", "downloads", ICONS.download, "dl"],
];

// Latest activity of a repository: translation key and icon (the label key is the translation key).
const REPO_LATEST = [
  ["latest_release", ICONS.release],
  ["latest_tag", ICONS.tag],
  ["latest_commit", ICONS.commit],
  ["latest_pull_request", ICONS.pr],
  ["latest_issue", ICONS.issue],
  ["latest_discussion", ICONS.forum],
];

// Counters of the account (disabled by default in the integration).
const USER_STATS = [
  ["followers", "followers", ICONS.group, "user"],
  ["following", "following", ICONS.account, "user"],
  ["public_repos", "public_repos", ICONS.code, "user"],
  ["public_gists", "public_gists", ICONS.code, "user"],
];

const REPO_KEYS = new Set([...REPO_STATS.map(([k]) => k), ...REPO_LATEST.map(([k]) => k)]);
const USER_KEYS = new Set(USER_STATS.map(([k]) => k));

// Without a translation key in the registry: the end of the English entity id, made from the English names.
const ID_SUFFIXES = Object.entries({
  stargazers_count: "stars",
  forks_count: "forks",
  subscribers_count: "watchers",
  issues_count: "issues",
  pulls_count: "pull_requests",
  merged_pulls_count: "merged_pull_requests",
  discussions_count: "discussions",
  latest_release_downloads: "latest_release_downloads",
  latest_release: "latest_release",
  latest_tag: "latest_tag",
  latest_commit: "latest_commit",
  latest_issue: "latest_issue",
  latest_pull_request: "latest_pull_request",
  latest_discussion: "latest_discussion",
  followers: "followers",
  following: "following",
  public_repos: "public_repositories",
  public_gists: "public_gists",
}).sort((a, b) => b[1].length - a[1].length);

const keyOf = (e) => {
  if (e.translation_key) return REPO_KEYS.has(e.translation_key) || USER_KEYS.has(e.translation_key) ? e.translation_key : null;
  return ID_SUFFIXES.find(([, sfx]) => e.entity_id.endsWith(`_${sfx}`))?.[0] || null;
};

let discoveryCache = null;

/**
 * The repositories and accounts of the GitHub integration, from the entity registry: one group per device (a
 * repository's device is named after its full name, owner/repo; an account's after its login), each with its
 * sensors by translation key. Cached until the entity or device registry changes.
 */
const discover = (hass) => {
  if (discoveryCache && discoveryCache.entities === hass.entities && discoveryCache.devices === hass.devices) return discoveryCache.result;
  const groups = { repos: new Map(), users: new Map() };
  for (const e of Object.values(hass.entities || {})) {
    if (e.platform !== "github" || !String(e.entity_id).startsWith("sensor.") || e.hidden) continue;
    const key = keyOf(e);
    if (!key) continue;
    const map = USER_KEYS.has(key) ? groups.users : groups.repos;
    const id = e.device_id || "github";
    if (!map.has(id)) {
      const dev = hass.devices?.[e.device_id];
      const name = dev?.name || "";
      map.set(id, {
        id,
        name,
        label: dev?.name_by_user || name || "GitHub",
        url: safeUrl(dev?.configuration_url) || (name ? `https://github.com/${name}` : ""),
        s: {},
      });
    }
    map.get(id).s[key] = e.entity_id;
  }
  const result = { repos: [...groups.repos.values()], users: [...groups.users.values()] };
  discoveryCache = { entities: hass.entities, devices: hass.devices, result };
  return result;
};

const trackedIds = (gh) => [...gh.repos, ...gh.users].flatMap((g) => Object.values(g.s));

/** What a render depends on: the registries, the language, and the states of the GitHub sensors. */
const renderSignature = (hass) => {
  const gh = discover(hass);
  return [hass.entities, hass.devices, hass.language, hass.locale, ...trackedIds(gh).map((id) => hass.states[id])];
};

const sameSignature = (a, b) => !!a && a.length === b.length && a.every((v, i) => v === b[i]);

/** Selector finding the same focused element after a re-render, from its data-* attributes. */
const focusSelector = (el) => {
  const d = el?.dataset;
  if (!d?.action && !d?.entity) return null;
  return ["action", "target", "entity"]
    .filter((k) => d[k] !== undefined)
    .map((k) => `[data-${k}="${String(d[k]).replace(/["\\]/g, "\\$&")}"]`)
    .join("");
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { display: block; }
  :host { --gh-accent: #8957e5; --gh-blue: #18bcf2; --gh-ok: var(--success-color, #43a047); --gh-warn: var(--warning-color, #ffa600);
          --gh-crit: var(--error-color, #db4437); --gh-focus: var(--primary-color, #03a9f4);
          --gh-star: #e3a008; --gh-green: #2da44e; --gh-purple: #8957e5; }
  ha-card { overflow: hidden; position: relative; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); --c: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible, a:focus-visible { outline: 2px solid var(--gh-focus); outline-offset: -2px; }
  .good { --c: var(--gh-ok); } .open { --c: var(--gh-blue); }
  .star { --c: var(--gh-star); } .fork, .watch, .disc, .dl, .user { --c: var(--gh-blue); }
  .issue, .pr { --c: var(--gh-green); } .merged { --c: var(--gh-purple); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--gh-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--gh-ok)) 15%, transparent); color: color-mix(in srgb, var(--c, var(--gh-ok)) 45%, var(--primary-text-color)); }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; container: gh-header / inline-size; }
  .titles { flex: 1 1 0; min-width: 6.5ch; font-size: 16px; }
  :host([hide-title]) .titles .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; row-gap: 2px; }
  .title-row > .name { flex: 1 1 0; min-width: min(6.5ch, 100%); }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* Round tinted icon, 40 px, in the project's accent. */
  .logo { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; align-self: flex-start;
          background: color-mix(in srgb, var(--gh-accent) 16%, transparent); color: var(--gh-accent); }
  .logo .icon { width: 24px; height: 24px; }
  .title-row > .chip { flex: 0 1 auto; min-width: 0; white-space: nowrap; }
  .title-row > .chip > .chip-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  @container gh-header (max-width: 180px) {
    .title-row > .chip { padding: 4px; }
    .title-row > .chip > .chip-text { display: none; }
  }
  @container gh-header (max-width: 131px) { .header .logo { display: none; } }
  .warning { padding: 16px; color: color-mix(in srgb, var(--gh-warn) 45%, var(--primary-text-color)); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); align-self: flex-start; margin-top: 0; }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--gh-focus); outline-offset: 1px; }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; container: gh-content / inline-size; }
  /* Counter tiles: icon in its colour, label, value. */
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 6px; }
  .tile { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .icon { color: var(--c, var(--gh-blue)); width: 16px; height: 16px; }
  .tile > div { min-width: 0; }
  .tile .k { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile .v { font-size: 14px; font-weight: 500; }
  /* Links to GitHub: an icon button, never a filled one. */
  .link { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; color: var(--secondary-text-color); }
  .link .icon { width: 14px; height: 14px; }
  .link:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  /* No repository shown: what to do, and an outlined button to the GitHub integration (never a filled one). */
  .empty { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 10px;
           background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .empty > .icon { color: var(--gh-accent); margin-top: 1px; }
  .empty .t { font-size: 14px; font-weight: 500; }
  .empty .h { font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
  .empty .action { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 4px 12px;
                   border-radius: 16px; font-size: 12px; font-weight: 500; color: var(--gh-accent);
                   border: 1px solid color-mix(in srgb, var(--gh-accent) 50%, transparent); }
  .empty .action .icon { width: 14px; height: 14px; }
  .empty .action:hover { background: color-mix(in srgb, var(--gh-accent) 12%, transparent); }
  .empty .action:focus-visible { outline: 2px solid var(--gh-focus); outline-offset: 1px; }
`;

/** Opens a page of the Home Assistant frontend, as its own links do. */
const navigate = (path) => {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

const INTEGRATION_PATH = "/config/integrations/integration/github";

const FULL_STYLE = `
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin: 4px 0 2px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title .label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-transform: none; letter-spacing: 0; }
  .content.embed { padding: 0; }
  .repo { border-radius: 12px; border: 1px solid var(--divider-color, rgba(127,127,127,.2)); overflow: hidden; }
  .repo-head { display: flex; align-items: center; gap: 8px; padding: 8px 6px 8px 10px; min-height: 24px; }
  .repo-head.toggle { cursor: pointer; user-select: none; }
  .repo-head .icon { color: var(--secondary-text-color); }
  .repo-head .repo-name { flex: 1 1 0; min-width: 0; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .repo-head .counts { display: inline-flex; gap: 10px; font-size: 12px; color: var(--secondary-text-color); flex: none; }
  .repo-head .counts > span { display: inline-flex; align-items: center; gap: 3px; }
  .repo-head .counts .icon { width: 14px; height: 14px; color: var(--c); }
  /* Folded: chevron to the right; unfolded: down (as in ha-carburants-france). */
  .repo-head .chevron { transition: transform .15s; }
  .repo-head.closed .chevron { transform: rotate(-90deg); }
  .repo-body { padding: 0 10px 10px; display: flex; flex-direction: column; gap: 8px; }
  .latest { display: flex; flex-direction: column; gap: 2px; }
  .row { display: grid; grid-template-columns: 18px minmax(0, max-content) minmax(0, 1fr) auto; align-items: center; gap: 8px; font-size: 13px; min-height: 26px; }
  .row .icon { color: var(--secondary-text-color); }
  .row .k { color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .v { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .v small { color: var(--secondary-text-color); font-size: 11px; margin-left: 4px; }
  /* Narrow card: the label goes under the icon line, the value keeps its width. */
  @container gh-content (max-width: 300px) {
    .row { grid-template-columns: 18px minmax(0, 1fr) auto; }
    .row .k { display: none; }
    .repo-head .counts .c-pr, .repo-head .counts .c-issue { display: none; }
  }
`;

const MINI_STYLE = `
  .title-row > .chip { display: none; }
  .tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .tiles .tile { justify-content: center; padding: 6px 4px; gap: 4px; }
  .tiles .tile .k { display: none; }
  @container gh-content (max-width: 220px) { .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .list { display: grid; grid-template-columns: minmax(0, 1fr) repeat(3, max-content); column-gap: 10px; row-gap: 2px; }
  .item { display: grid; grid-template-columns: subgrid; grid-column: 1 / -1; align-items: center; font-size: 13px; padding: 3px 0; }
  .item .n { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item > span:not(.n) { display: inline-flex; align-items: center; gap: 3px; justify-content: flex-end; font-size: 12px; color: var(--secondary-text-color); }
  .item .icon { width: 14px; height: 14px; color: var(--c); }
  .item.more { color: var(--secondary-text-color); font-size: 12px; }
  .foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 8px; font-size: 12px; color: var(--secondary-text-color); }
  .foot span { display: inline-flex; align-items: center; gap: 4px; }
  .foot .icon { width: 14px; height: 14px; }
`;

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

class GitHubBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._openRepo = null;
    this.shadowRoot.addEventListener("click", (ev) => {
      const path = ev.composedPath();
      // A link to GitHub opens in a new tab: no other action.
      if (path.some((n) => n.localName === "a")) return;
      const action = path.find((n) => n.dataset?.action);
      if (action) return this._action(action.dataset.action, action.dataset.target, ev);
      const el = path.find((n) => n.dataset?.entity);
      if (el) fireMoreInfo(this, el.dataset.entity);
    });
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target?.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
    // A click elsewhere folds the unfolded repository (as in ha-carburants-france).
    this._onOutside = (ev) => {
      if (this._openRepo === null || ev.composedPath().includes(this) || inDialog(ev)) return;
      this._openRepo = null;
      this._update();
    };
  }

  connectedCallback() {
    document.addEventListener("click", this._onOutside, true);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onOutside, true);
  }

  set hass(hass) {
    this._hass = hass;
    const sig = renderSignature(hass);
    if (sameSignature(this._sig, sig)) return;
    this._sig = sig;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (config.repositories !== undefined && !Array.isArray(config.repositories))
      throw new Error("repositories must be a list of owner/repo names");
    this._config = { ...config };
    // show_title / show_subtitle: the header's title / subtitle, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._update();
  }

  _action(action, target) {
    if (action === "integration") return navigate(INTEGRATION_PATH);
    if (action === "repo") {
      this._openRepo = this._openRepo === target ? null : target;
      this._update();
    }
  }

  _t(key) {
    return t(this._hass, this._config, key);
  }

  _loc() {
    return fmtLang(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  /** A counter sensor as a number, or null when missing, unavailable or not a number. */
  _num(id) {
    const s = this._s(id);
    if (isUnknown(s)) return null;
    const v = Number.parseFloat(s.state);
    return Number.isFinite(v) ? v : null;
  }

  _update() {
    if (!this._hass || !this._config) return;
    const html = this._render();
    if (html !== this._html) {
      const focused = focusSelector(this.shadowRoot.activeElement);
      this._html = html;
      this.shadowRoot.innerHTML = html;
      if (focused) this.shadowRoot.querySelector(focused)?.focus({ preventScroll: true });
    }
  }

  /** Open issues and pull requests of a repository (null when neither is known). */
  _openCount(r) {
    const a = this._num(r.s.issues_count);
    const b = this._num(r.s.pulls_count);
    return a === null && b === null ? null : (a || 0) + (b || 0);
  }

  /**
   * The repositories shown: those with a state, restricted to `repositories` (owner/repo, any case) when set, in its
   * order, else sorted by name; `sort: stars` or `sort: open` puts the most starred or the busiest first.
   */
  _repos() {
    const gh = discover(this._hass);
    const c = this._config;
    let list = gh.repos.filter((r) => Object.values(r.s).some((id) => this._hass.states[id]));
    const want = (c.repositories || []).map((x) => String(x).trim().toLowerCase()).filter(Boolean);
    const rank = (r) => {
      const i = want.findIndex((w) => w === r.name.toLowerCase() || w === r.label.toLowerCase());
      return i < 0 ? Infinity : i;
    };
    if (want.length) list = list.filter((r) => rank(r) !== Infinity);
    const byName = (a, b) => a.label.localeCompare(b.label);
    const sort = c.sort || (want.length ? "config" : "name");
    const value = (r) => (sort === "stars" ? this._num(r.s.stargazers_count) : this._openCount(r)) ?? -1;
    if (sort === "config") list.sort((a, b) => rank(a) - rank(b));
    else if (sort === "stars" || sort === "open") list.sort((a, b) => value(b) - value(a) || byName(a, b));
    else list.sort(byName);
    return list;
  }

  _users() {
    if (this._config.show_account === false) return [];
    return discover(this._hass).users.filter((u) => Object.values(u.s).some((id) => this._hass.states[id]));
  }

  _sum(repos, key) {
    const values = repos.map((r) => this._num(r.s[key])).filter((v) => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  }

  /** Overall status: the open issues and pull requests of the repositories shown. */
  _status(repos) {
    if (!repos.length) return { cls: "muted", text: this._t("no_repos") };
    const counts = repos.map((r) => this._openCount(r)).filter((v) => v !== null);
    if (!counts.length) return { cls: "muted", text: this._t("unknown") };
    const n = counts.reduce((a, b) => a + b, 0);
    return n ? { cls: "open", text: this._t("open_n").replace("{n}", fmtFull(n, this._loc())) } : { cls: "good", text: this._t("open_none") };
  }

  _header(repos, aside = "") {
    const st = this._status(repos);
    // Without a repository, the message under the header says so: no pill.
    const chip = repos.length
      ? `<span class="chip ${st.cls}" title="${esc(st.text)}" aria-label="${esc(st.text)}"><span class="dot"></span><span class="chip-text">${esc(st.text)}</span></span>`
      : "";
    const stars = this._sum(repos, "stargazers_count");
    const sub = [repos.length ? this._t("repos_n").replace("{n}", repos.length) : "", stars !== null ? `★ ${fmtCount(stars, this._loc())}` : ""].filter(Boolean).join(" · ");
    return `
      <div class="header">
        <span class="logo" aria-hidden="true">${svgIcon(ICONS.github)}</span>
        <div class="titles">
          <div class="title-row"><div class="name">${esc(this._config.title || "GitHub")}</div>${chip}</div>
          <div class="sub">${esc(sub)}</div>
        </div>
        ${aside}
      </div>`;
  }

  _tile(id, label, icon, cls) {
    const v = this._num(id);
    const title = `${label}: ${fmtFull(v, this._loc())}`;
    return `<div class="tile clickable ${cls}" data-entity="${esc(id)}" role="button" tabindex="0" title="${esc(title)}" aria-label="${esc(title)}">${svgIcon(icon)}<div>
        <div class="k">${esc(label)}</div><div class="v">${fmtCount(v, this._loc())}</div></div></div>`;
  }

  _tiles(stats, group) {
    const tiles = stats.filter(([k]) => group.s[k]).map(([k, label, icon, cls]) => this._tile(group.s[k], this._t(label), icon, cls));
    return tiles.length ? `<div class="tiles">${tiles.join("")}</div>` : "";
  }

  _link(url) {
    const u = safeUrl(url);
    const title = esc(this._t("open_github"));
    return u ? `<a class="link" href="${esc(u)}" target="_blank" rel="noopener noreferrer" title="${title}" aria-label="${title}">${svgIcon(ICONS.open)}</a>` : "";
  }

  /**
   * No repository to show: the GitHub integration follows none (only the account), or none of those of the
   * `repositories` option. Says which, with a button that opens the integration's page to add some.
   */
  _empty() {
    const filtered = discover(this._hass).repos.length > 0;
    return `<div class="empty">${svgIcon(ICONS.github)}<div>
        <div class="t">${esc(this._t("no_repos"))}</div>
        <div class="h">${esc(this._t(filtered ? "no_match" : "no_repos_hint"))}</div>
        <button class="action" data-action="integration">${svgIcon(ICONS.open)}${esc(this._t("open_integration"))}</button>
      </div></div>`;
  }

  _noGh() {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(this._t("no_github"))}</div></ha-card>`;
  }
}

/** Full card: every repository as a foldable section (counters and latest activity), then the account. */
class GitHubCard extends GitHubBase {
  static getConfigElement() {
    return document.createElement("github-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 2 + this._repoCount() * 1;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _repoCount() {
    return this._hass && this._config ? this._repos().length : 3;
  }

  _render() {
    const repos = this._repos();
    // `embed` (the GitHub panel's Repositories tab): only the counters and the latest activity of the repositories,
    // and the account section, without the card's frame, header or foldable sections.
    if (this._config.embed) {
      // The repositories listed in `repositories` (none without it), then the account unless `show_account: false`.
      const shown = (this._config.repositories || []).length ? repos : [];
      const body = shown.map((r) => `${this._tiles(REPO_STATS, r)}${this._config.show_latest === false ? "" : this._latest(r)}`);
      body.push(...this._users().map((u) => this._accountSection(u)));
      return body.some(Boolean) ? `<style>${BASE_STYLE}${FULL_STYLE}</style><div class="content embed">${body.join("")}</div>` : "";
    }
    const users = this._users();
    if (!repos.length && !users.length) return this._noGh();
    // A single repository is always unfolded; otherwise one at a time, folded on a click elsewhere.
    const single = repos.length === 1;
    const sections = repos.length ? repos.map((r) => this._repoSection(r, single)) : [this._empty()];
    for (const u of users) sections.push(this._accountSection(u));
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card>
        ${this._header(repos, this._aside?.() || "")}
        <div class="content">${sections.join("")}</div>
      </ha-card>`;
  }

  _repoSection(r, single) {
    const open = single || this._openRepo === r.id;
    const count = (key, icon, cls) => {
      if (!r.s[key]) return "";
      const v = this._num(r.s[key]);
      return `<span class="c-${cls} ${cls}" title="${esc(`${this._t(REPO_STATS.find(([k]) => k === key)[1])}: ${fmtFull(v, this._loc())}`)}">${svgIcon(icon)}${fmtCount(v, this._loc())}</span>`;
    };
    const toggle = single ? "" : ` toggle${open ? "" : " closed"}" data-action="repo" data-target="${esc(r.id)}" role="button" tabindex="0" aria-expanded="${open}`;
    const head = `<div class="repo-head${toggle}">
        ${svgIcon(ICONS.code)}<span class="repo-name" title="${esc(r.label)}">${esc(r.label)}</span>
        <span class="counts">${count("stargazers_count", ICONS.star, "star")}${count("issues_count", ICONS.issue, "issue")}${count("pulls_count", ICONS.pr, "pr")}</span>
        ${this._link(r.url)}${single ? "" : svgIcon(ICONS.chevron, "chevron")}
      </div>`;
    if (!open) return `<div class="repo">${head}</div>`;
    const latest = this._config.show_latest === false ? "" : this._latest(r);
    return `<div class="repo">${head}<div class="repo-body">${this._tiles(REPO_STATS, r)}${latest}</div></div>`;
  }

  /** Latest release, tag, commit, pull request, issue and discussion, each opening its page on GitHub. */
  _latest(r) {
    const rows = REPO_LATEST.filter(([k]) => r.s[k]).map(([k, icon]) => {
      const s = this._s(r.s[k]);
      const a = s?.attributes || {};
      const unknown = isUnknown(s);
      let value = unknown ? "—" : esc(String(s.state).split("\n")[0]);
      if (!unknown && k === "latest_commit" && a.sha) value += `<small>${esc(String(a.sha).slice(0, 7))}</small>`;
      if (!unknown && a.number !== undefined) value += `<small>#${esc(a.number)}</small>`;
      if (!unknown && k === "latest_release" && a.tag && a.tag !== s.state) value += `<small>${esc(a.tag)}</small>`;
      const label = esc(this._t(k));
      return `<div class="row clickable" data-entity="${esc(r.s[k])}" role="button" tabindex="0" title="${label}">
          ${svgIcon(icon)}<span class="k">${label}</span><span class="v">${value}</span>${unknown ? "" : this._link(a.url)}
        </div>`;
    });
    return rows.length ? `<div class="latest">${rows.join("")}</div>` : "";
  }

  _accountSection(u) {
    const tiles = this._tiles(USER_STATS, u);
    if (!tiles) return "";
    return `<div>
        <div class="section-title">${svgIcon(ICONS.account)}<span class="label" title="${esc(u.label)}">${esc(this._t("account"))} · ${esc(u.label)}</span>${this._link(u.url)}</div>
        ${tiles}
      </div>`;
  }
}

/**
 * Compact card: total stars, forks, issues and pull requests, then one line per repository. Its zoom button (top
 * right, `zoom: false` removes it) switches it to the full card and back; a click outside the card brings the compact
 * view back. A click on a repository shows the full card with that repository unfolded.
 */
class GitHubMiniCard extends GitHubCard {
  static getConfigElement() {
    return document.createElement("github-mini-card-editor");
  }

  constructor() {
    super();
    this._onUnzoom = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !inDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._onUnzoom, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._onUnzoom, true);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _setZoom(zoomed, repo = null) {
    this._zoomed = zoomed;
    this._openRepo = zoomed ? repo : null;
    this._update();
  }

  _action(action, target, ev) {
    if (action === "zoom") {
      ev.stopPropagation();
      this._setZoom(!this._zoomed);
      // Keyboard use (no click count) keeps the focus on the button that replaced this one.
      if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
      return;
    }
    if (action === "show") return this._setZoom(true, target || null);
    super._action(action, target, ev);
  }

  _aside() {
    if (this._config.zoom === false) return "";
    const title = esc(this._t(this._zoomed ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" data-action="zoom" title="${title}" aria-label="${title}">${svgIcon(this._zoomed ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _render() {
    return this._zoomed ? super._render() : this._compactRender();
  }

  _compactRender() {
    const repos = this._repos();
    const users = this._users();
    if (!repos.length && !users.length) return this._noGh();
    const c = this._config;
    const loc = this._loc();
    const total = (key, label, icon, cls) => {
      const v = this._sum(repos, key);
      if (v === null) return "";
      const title = `${this._t(label)}: ${fmtFull(v, loc)}`;
      return `<div class="tile ${cls}" title="${esc(title)}" aria-label="${esc(title)}">${svgIcon(icon)}<div><div class="k">${esc(this._t(label))}</div><div class="v">${fmtCount(v, loc)}</div></div></div>`;
    };
    const totals = [
      total("stargazers_count", "stars", ICONS.star, "star"),
      total("forks_count", "forks", ICONS.fork, "fork"),
      total("issues_count", "issues", ICONS.issue, "issue"),
      total("pulls_count", "pulls", ICONS.pr, "pr"),
    ].join("");
    const max = Math.max(1, Number.parseInt(c.max_repos, 10) || 5);
    const zoom = c.zoom !== false;
    const cell = (r, key, icon, cls) => `<span class="${cls}">${r.s[key] ? `${svgIcon(icon)}${fmtCount(this._num(r.s[key]), loc)}` : ""}</span>`;
    const items = repos.slice(0, max).map((r) => {
      // With the zoom button, a repository opens the full card on it; without, the more-info of its stars.
      const target = zoom ? `data-action="show" data-target="${esc(r.id)}"` : `data-entity="${esc(r.s.stargazers_count || Object.values(r.s)[0])}"`;
      return `<div class="item clickable" ${target} role="button" tabindex="0" title="${esc(r.label)}">
          <span class="n">${esc(r.label)}</span>${cell(r, "stargazers_count", ICONS.star, "star")}${cell(r, "issues_count", ICONS.issue, "issue")}${cell(r, "pulls_count", ICONS.pr, "pr")}
        </div>`;
    });
    if (repos.length > max)
      items.push(`<div class="item more${zoom ? ' clickable" data-action="show" role="button" tabindex="0' : ""}"><span class="n">+${repos.length - max}</span></div>`);
    const st = this._status(repos);
    // Without a repository, the message above already says so: no status in the footer.
    const foot = repos.length ? [`<span class="${st.cls}"><span class="dot"></span>${esc(st.text)}</span>`] : [];
    for (const u of users) {
      const v = this._num(u.s.followers);
      if (u.s.followers)
        foot.push(`<span class="clickable" data-entity="${esc(u.s.followers)}" role="button" tabindex="0" title="${esc(`${u.label} · ${this._t("followers")}: ${fmtFull(v, loc)}`)}">${svgIcon(ICONS.group)}${fmtCount(v, loc)}</span>`);
    }
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card>
        ${this._header(repos, this._aside())}
        <div class="content">
          ${repos.length ? "" : this._empty()}
          ${totals ? `<div class="tiles">${totals}</div>` : ""}
          ${items.length ? `<div class="list">${items.join("")}</div>` : ""}
          <div class="foot">${foot.join("")}</div>
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

class GitHubEditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  static get defaults() {
    return { sort: "name" };
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const tr = (k) => t(this._hass, this._config, k);
    const repos = this._hass ? discover(this._hass).repos.map((r) => r.name).filter(Boolean) : [];
    const extra = this._extraSchema?.() || [];
    return [
      { name: "title", selector: { text: {} } },
      { name: "repositories", selector: { select: { multiple: true, custom_value: true, mode: "dropdown", options: [...new Set(repos)].sort().map((r) => ({ value: r, label: r })) } } },
      {
        name: "sort",
        selector: { select: { mode: "dropdown", options: ["name", "stars", "open"].map((v) => ({ value: v, label: tr(`sort_${v}`) })) } },
      },
      { type: "grid", name: "", schema: this.constructor.toggles.map((name) => ({ name, selector: { boolean: {} } })) },
      ...extra,
      {
        name: "language",
        selector: { select: { mode: "dropdown", options: [{ value: "", label: tr("lang_auto") }, ...LANGUAGES.map(([value, label]) => ({ value, label }))] } },
      },
    ];
  }

  /** Keeps the YAML minimal: no empty values, no toggles left on, no option at its default. */
  _clean(config) {
    const out = { ...config };
    const defaults = this.constructor.defaults;
    for (const [k, v] of Object.entries(out)) {
      const empty = v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length);
      if (empty || (this.constructor.toggles.includes(k) && v === true) || defaults[k] === v) delete out[k];
    }
    return out;
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => {
        const key = `${s.name}_helper`;
        const text = t(this._hass, this._config, key);
        return text === key ? undefined : text;
      };
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = this._clean(ev.detail.value);
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    // ha-form renders again on a new data or schema object: rebuild them only when they change.
    if (this._formConfig !== this._config) {
      this._formConfig = this._config;
      const data = { ...this.constructor.defaults, ...this._config };
      for (const name of this.constructor.toggles) if (data[name] === undefined) data[name] = true;
      this._form.data = data;
    }
    const schema = this._schema();
    const key = JSON.stringify(schema);
    if (key !== this._schemaKey) {
      this._schemaKey = key;
      this._form.schema = schema;
    }
  }
}

class GitHubCardEditor extends GitHubEditorBase {
  static get toggles() {
    return ["show_title", "show_subtitle", "show_latest", "show_account"];
  }
}

class GitHubMiniCardEditor extends GitHubEditorBase {
  static get toggles() {
    return ["show_title", "show_subtitle", "show_latest", "show_account", "zoom"];
  }

  static get defaults() {
    return { sort: "name", max_repos: 5 };
  }

  _extraSchema() {
    return [{ name: "max_repos", selector: { number: { min: 1, max: 20, step: 1, mode: "box" } } }];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("github-card", GitHubCard);
define("github-mini-card", GitHubMiniCard);
define("github-card-editor", GitHubCardEditor);
define("github-mini-card-editor", GitHubMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  { type: "github-card", name: "GitHub Card", description: "Your GitHub repositories: stars, forks, open issues and pull requests, latest release, commit and activity." },
  { type: "github-mini-card", name: "GitHub Mini Card", description: "Compact overview of your GitHub repositories: totals and one line per repository." },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-github" });
}

console.info(`%c GITHUB-CARD %c v${VERSION} `, "color: white; background: #8957e5; font-weight: 700;", "color: #8957e5; background: white; font-weight: 700;");
