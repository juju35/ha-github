/*
 * GitHub panel for Home Assistant (administrators only)
 * https://github.com/juju35/ha-github
 *
 * Five tabs under the toolbar, as in Smart Comfort and IPTV (text tabs, the active one underlined, the tab in the
 * address, Settings last):
 * - Repositories: the repositories of your GitHub account (and your starred ones, if chosen), followed or not by the
 *   core GitHub integration; follow or stop following one, the ticked ones or all of them at once (one reload of the GitHub
 *   integration for the whole change), through the github_card/* WebSocket commands. Each followed repository shows
 *   its live counters and unfolds the GitHub Card's details; the head gives the totals (stars, open issues and pull
 *   requests), the GitHub account (followers…) closes the list;
 * - Issues and Pull requests: the open ones of the followed repositories, most recently updated first, from the
 *   GitHub API (github_card/items, cached 5 minutes by the integration; Refresh asks GitHub again);
 * - My pull requests: the open pull requests you authored, in any repository (not only the followed ones), from a
 *   GitHub search (github_card/mine, cached 5 minutes; loaded when the tab opens, Refresh asks GitHub again);
 * - Settings: which repositories are offered (name patterns, starred ones, archived ones ignored), the new issue / pull request
 *   notifications, and the title bar hidden (the tabs and the menu button stay).
 */

const GITHUB_PANEL_VERSION = "2.18.1";
// No Activity tab since 2.3.0: the Repositories tab shows the same; /github-config/activity opens Repositories.
const GITHUB_PANEL_TABS = ["repos", "issues", "pulls", "mine", "settings"];
// Bounds of the items refresh interval, in minutes (kept in step with const.py)
const GITHUB_PANEL_MIN_REFRESH = 1;
const GITHUB_PANEL_MAX_REFRESH = 1440;
// Orders of the Repositories tab (see GitHubPanel._rows)
const GITHUB_PANEL_SORTS = ["followed", "name", "stars", "issues", "pulls"];

// Translations: one list per language, in the order of KEYS (the tests check the parity).
const GITHUB_PANEL_KEYS = [
  "title", "repos", "activity", "settings", "open_integration", "loading",
  "no_github", "add_github", "not_loaded", "offered_error",
  "summary", "search", "follow_all", "follow", "unfollow", "followed", "confirm_unfollow", "cancel",
  "working", "done", "skipped", "error", "empty", "open_github",
  "s_filter", "s_filter_hint", "s_starred", "s_starred_hint", "s_archived", "s_archived_hint", "s_notify_issues", "s_notify_pulls", "s_notify_releases", "s_notify_hint",
  "save", "saved",
  // Issues and Pull requests tabs
  "issues", "pulls", "refresh", "no_issues", "no_pulls", "no_followed", "items_error",
  "draft", "approved", "changes_requested", "review_required", "by", "updated", "comments", "all_repos", "open_n",
  // Rows of the followed repositories
  "stars", "release", "details",
  // Order of the Repositories tab
  "sort_label", "sort_followed", "sort_name", "sort_stars", "sort_issues", "sort_pulls",
  // A failed load, tried again at once
  "retry",
  // Several repositories followed at once
  "follow_selected", "select_repo",
  // Refresh interval of the Issues and Pull requests
  "s_refresh", "s_refresh_hint",
  // My pull requests tab (open pull requests I authored, in any repository) and the checks state of a pull request
  "mine", "no_mine", "checks_passing", "checks_failing", "checks_pending",
  // Downloads of the followed repositories: a row counter and the page total
  "downloads", "total_downloads",
  // The panel's title bar hidden (the tabs stay)
  "s_hide_toolbar", "s_hide_toolbar_hint",
  // The cards' charter: list titles, the Settings header's pill, the Settings groups, the other refresh interval
  "followed_head", "to_follow", "unsaved", "up_to_date", "s_group_notify", "s_group_refresh", "s_group_panel", "s_patterns", "other",
  // The ENT ONE layout: the Repositories "To handle" card and the repository filter's overflow
  "to_handle", "nothing_to_handle", "more_repos",
  // The top bar hidden for nobody, everyone or the users who are not administrators
  "hide_off", "hide_all", "hide_non_admin",
  // The unfolded repository and the account, drawn by the panel: counters, latest activity, account (the card's words)
  "d_stars", "d_forks", "d_watchers", "d_issues", "d_pulls", "d_merged_pulls", "d_discussions", "d_downloads", "d_latest_release", "d_latest_tag", "d_latest_commit", "d_latest_issue", "d_latest_pull_request", "d_latest_discussion", "d_account", "d_followers", "d_following", "d_public_repos", "d_public_gists",
  // Issues and Pull requests: the links of the listed items copied to the clipboard
  "copy_links", "links_copied",
];

const GITHUB_PANEL_TRANSLATIONS = {
  en: [
    "GitHub", "Repositories", "Activity", "Settings", "GitHub integration", "Loading…",
    "The GitHub integration is not set up yet. Add it with your GitHub account: this panel follows your repositories through it.",
    "Add the GitHub integration",
    "The GitHub integration is not loaded ({state}): the followed repositories are listed, following new ones needs it loaded.",
    "The GitHub integration could not list your repositories (connection or GitHub API limit). Try again later.",
    "Followed: {followed} · Not followed: {offered}", "Search a repository", "Follow all ({n})", "Follow", "Stop following", "Followed",
    "Stop following {repo}? Its sensors and their history are removed from Home Assistant.", "Cancel",
    "Updating the GitHub integration…", "Followed: {added} · No longer followed: {removed}",
    "Not offered by the GitHub integration: {names}", "Error: {error}", "No repository matches.", "Open on GitHub",
    "Repositories offered", "Name patterns separated by commas, e.g. juju35/ha-*. Empty: all of them.",
    "Include starred repositories", "Besides the repositories of your account.",
    "Ignore archived repositories", "Archived repositories are not offered. Followed ones stay listed.",
    "Notify new issues", "Notify new pull requests", "Notify new releases",
    "A Home Assistant notification for each new issue or pull request of the followed repositories.",
    "Save", "Saved.",
    "Issues", "Pull requests", "Refresh", "No open issue in the followed repositories.", "No open pull request in the followed repositories.", "Follow repositories in the Repositories tab to see their issues and pull requests here.", "GitHub could not be queried ({error}). Try again later.", "Draft", "Approved", "Changes requested", "Review required", "by {author}", "updated {when}", "Comments: {n}", "All repositories", "Open: {n}",
    "Stars", "Latest release", "Show or hide the details",
    "Sort", "Followed first", "Name", "Stars", "Open issues", "Open pull requests",
    "Retry",
    "Follow selected ({n})", "Select {repo}",
    "Refresh interval (minutes)", "How often the open issues and pull requests are fetched from GitHub.",
    // My pull requests
    "My pull requests", "You have no open pull request.", "Checks passing", "Checks failing", "Checks running",
    // Downloads: row counter + page total
    "Downloads", "Total downloads: {n}",
    "Hide the top bar", "The title bar goes, the tabs stay; the menu button stays wherever Home Assistant shows it.",
    "Followed", "To follow", "Unsaved changes", "Up to date", "Notifications", "Refresh", "Panel", "Name patterns", "Other",
    "To handle", "Nothing to handle on your followed repositories", "+ {n} more",
    "No", "For everyone", "For non-admins",
    "Stars", "Forks", "Watchers", "Issues", "Pull requests", "Merged PRs", "Discussions", "Downloads", "Latest release", "Latest tag", "Latest commit", "Latest issue", "Latest pull request", "Latest discussion", "Account", "Followers", "Following", "Public repositories", "Public gists",
    "Copy the links", "Links copied",
  ],
  fr: [
    "GitHub", "Dépôts", "Activité", "Réglages", "Intégration GitHub", "Chargement…",
    "L’intégration GitHub n’est pas encore configurée. Ajoutez-la avec votre compte GitHub : ce panneau suit vos dépôts à travers elle.",
    "Ajouter l’intégration GitHub",
    "L’intégration GitHub n’est pas chargée ({state}) : les dépôts suivis sont listés, en suivre de nouveaux demande qu’elle soit chargée.",
    "L’intégration GitHub n’a pas pu lister vos dépôts (connexion ou limite de l’API GitHub). Réessayez plus tard.",
    "Suivis : {followed} · Non suivis : {offered}", "Rechercher un dépôt", "Tout suivre ({n})", "Suivre", "Ne plus suivre", "Suivi",
    "Ne plus suivre {repo} ? Ses capteurs et leur historique sont retirés de Home Assistant.", "Annuler",
    "Mise à jour de l’intégration GitHub…", "Suivis : {added} · Plus suivis : {removed}",
    "Non proposés par l’intégration GitHub : {names}", "Erreur : {error}", "Aucun dépôt ne correspond.", "Ouvrir sur GitHub",
    "Dépôts proposés", "Modèles de noms séparés par des virgules, par ex. juju35/ha-*. Vide : tous.",
    "Inclure les dépôts favoris", "En plus des dépôts de votre compte.",
    "Ignorer les dépôts archivés", "Les dépôts archivés ne sont pas proposés. Ceux déjà suivis restent listés.",
    "Notifier les nouvelles issues", "Notifier les nouvelles pull requests", "Notifier les nouvelles versions",
    "Une notification Home Assistant pour chaque nouvelle issue ou pull request des dépôts suivis.",
    "Enregistrer", "Enregistré.",
    "Issues", "Pull requests", "Actualiser", "Aucune issue ouverte dans les dépôts suivis.", "Aucune pull request ouverte dans les dépôts suivis.", "Suivez des dépôts dans l’onglet Dépôts pour voir ici leurs issues et pull requests.", "GitHub n’a pas pu être interrogé ({error}). Réessayez plus tard.", "Brouillon", "Approuvée", "Modifications demandées", "Revue requise", "par {author}", "mise à jour {when}", "Commentaires : {n}", "Tous les dépôts", "Ouvertes : {n}",
    "Étoiles", "Dernière version", "Afficher ou masquer le détail",
    "Tri", "Suivis d’abord", "Nom", "Étoiles", "Issues ouvertes", "Pull requests ouvertes",
    "Réessayer",
    "Suivre la sélection ({n})", "Sélectionner {repo}",
    "Intervalle d’actualisation (minutes)", "Fréquence de récupération des issues et pull requests ouvertes depuis GitHub.",
    // My pull requests
    "Mes pull requests", "Vous n’avez aucune pull request ouverte.", "Tests réussis", "Tests en échec", "Tests en cours",
    // Downloads: row counter + page total
    "Téléchargements", "Total des téléchargements : {n}",
    "Masquer la barre du haut", "La barre de titre disparaît, les onglets restent ; le bouton menu reste là où Home Assistant l’affiche.",
    "Suivis", "À suivre", "Modifications non enregistrées", "À jour", "Notifications", "Actualisation", "Panneau", "Modèles de noms", "Autre",
    "À traiter", "Rien à traiter sur les dépôts suivis", "+ {n} autres",
    "Non", "Pour tout le monde", "Pour les non-admins",
    "Étoiles", "Forks", "Observateurs", "Issues", "Pull requests", "PR fusionnées", "Discussions", "Téléchargements", "Dernière version", "Dernier tag", "Dernier commit", "Dernière issue", "Dernière pull request", "Dernière discussion", "Compte", "Abonnés", "Abonnements", "Dépôts publics", "Gists publics",
    "Copier les liens", "Liens copiés",
  ],
  de: [
    "GitHub", "Repositorys", "Aktivität", "Einstellungen", "GitHub-Integration", "Wird geladen…",
    "Die GitHub-Integration ist noch nicht eingerichtet. Füge sie mit deinem GitHub-Konto hinzu: Dieses Panel verfolgt deine Repositorys über sie.",
    "GitHub-Integration hinzufügen",
    "Die GitHub-Integration ist nicht geladen ({state}): Die verfolgten Repositorys werden angezeigt, zum Verfolgen neuer muss sie geladen sein.",
    "Die GitHub-Integration konnte deine Repositorys nicht auflisten (Verbindung oder GitHub-API-Limit). Versuche es später erneut.",
    "Verfolgt: {followed} · Nicht verfolgt: {offered}", "Repository suchen", "Alle verfolgen ({n})", "Verfolgen", "Nicht mehr verfolgen", "Verfolgt",
    "{repo} nicht mehr verfolgen? Seine Sensoren und deren Verlauf werden aus Home Assistant entfernt.", "Abbrechen",
    "GitHub-Integration wird aktualisiert…", "Verfolgt: {added} · Nicht mehr verfolgt: {removed}",
    "Von der GitHub-Integration nicht angeboten: {names}", "Fehler: {error}", "Kein Repository passt.", "Auf GitHub öffnen",
    "Angebotene Repositorys", "Namensmuster, durch Kommas getrennt, z. B. juju35/ha-*. Leer: alle.",
    "Markierte Repositorys einbeziehen", "Zusätzlich zu den Repositorys deines Kontos.",
    "Archivierte Repositorys ignorieren", "Archivierte Repositorys werden nicht angeboten. Verfolgte bleiben aufgelistet.",
    "Neue Issues melden", "Neue Pull Requests melden", "Neue Releases melden",
    "Eine Home-Assistant-Benachrichtigung für jedes neue Issue oder jeden neuen Pull Request der verfolgten Repositorys.",
    "Speichern", "Gespeichert.",
    "Issues", "Pull Requests", "Aktualisieren", "Kein offenes Issue in den verfolgten Repositorys.", "Kein offener Pull Request in den verfolgten Repositorys.", "Verfolge Repositorys im Tab Repositorys, um hier ihre Issues und Pull Requests zu sehen.", "GitHub konnte nicht abgefragt werden ({error}). Versuche es später erneut.", "Entwurf", "Genehmigt", "Änderungen angefordert", "Review erforderlich", "von {author}", "aktualisiert {when}", "Kommentare: {n}", "Alle Repositorys", "Offen: {n}",
    "Sterne", "Neuestes Release", "Details ein- oder ausblenden",
    "Sortierung", "Verfolgte zuerst", "Name", "Sterne", "Offene Issues", "Offene Pull Requests",
    "Erneut versuchen",
    "Auswahl verfolgen ({n})", "{repo} auswählen",
    "Aktualisierungsintervall (Minuten)", "Wie oft die offenen Issues und Pull Requests von GitHub abgerufen werden.",
    // My pull requests
    "Meine Pull Requests", "Du hast keinen offenen Pull Request.", "Prüfungen bestanden", "Prüfungen fehlgeschlagen", "Prüfungen laufen",
    // Downloads: row counter + page total
    "Downloads", "Downloads insgesamt: {n}",
    "Obere Leiste ausblenden", "Die Titelleiste verschwindet, die Tabs bleiben; der Menüknopf bleibt, wo Home Assistant ihn zeigt.",
    "Verfolgt", "Zu verfolgen", "Nicht gespeicherte Änderungen", "Aktuell", "Benachrichtigungen", "Aktualisierung", "Panel", "Namensmuster", "Andere",
    "Zu erledigen", "Nichts zu erledigen in den verfolgten Repositorys", "+ {n} weitere",
    "Nein", "Für alle", "Für Nicht-Admins",
    "Sterne", "Forks", "Beobachter", "Issues", "Pull Requests", "Gemergte PRs", "Diskussionen", "Downloads", "Neuestes Release", "Neuester Tag", "Letzter Commit", "Neuestes Issue", "Neuester Pull Request", "Neueste Diskussion", "Konto", "Follower", "Folgt", "Öffentliche Repositorys", "Öffentliche Gists",
    "Links kopieren", "Links kopiert",
  ],
  es: [
    "GitHub", "Repositorios", "Actividad", "Ajustes", "Integración GitHub", "Cargando…",
    "La integración GitHub aún no está configurada. Añádela con tu cuenta de GitHub: este panel sigue tus repositorios a través de ella.",
    "Añadir la integración GitHub",
    "La integración GitHub no está cargada ({state}): se listan los repositorios seguidos, seguir otros nuevos requiere que esté cargada.",
    "La integración GitHub no pudo listar tus repositorios (conexión o límite de la API de GitHub). Inténtalo más tarde.",
    "Seguidos: {followed} · No seguidos: {offered}", "Buscar un repositorio", "Seguir todos ({n})", "Seguir", "Dejar de seguir", "Seguido",
    "¿Dejar de seguir {repo}? Sus sensores y su historial se eliminan de Home Assistant.", "Cancelar",
    "Actualizando la integración GitHub…", "Seguidos: {added} · Ya no seguidos: {removed}",
    "No ofrecidos por la integración GitHub: {names}", "Error: {error}", "Ningún repositorio coincide.", "Abrir en GitHub",
    "Repositorios ofrecidos", "Patrones de nombre separados por comas, p. ej. juju35/ha-*. Vacío: todos.",
    "Incluir los repositorios destacados", "Además de los repositorios de tu cuenta.",
    "Ignorar los repositorios archivados", "Los repositorios archivados no se ofrecen. Los seguidos siguen en la lista.",
    "Notificar nuevas issues", "Notificar nuevas pull requests", "Notificar nuevas versiones",
    "Una notificación de Home Assistant por cada nueva issue o pull request de los repositorios seguidos.",
    "Guardar", "Guardado.",
    "Issues", "Pull requests", "Actualizar", "Ninguna issue abierta en los repositorios seguidos.", "Ninguna pull request abierta en los repositorios seguidos.", "Sigue repositorios en la pestaña Repositorios para ver aquí sus issues y pull requests.", "No se pudo consultar GitHub ({error}). Inténtalo más tarde.", "Borrador", "Aprobada", "Cambios solicitados", "Revisión requerida", "por {author}", "actualizada {when}", "Comentarios: {n}", "Todos los repositorios", "Abiertas: {n}",
    "Estrellas", "Última versión", "Mostrar u ocultar el detalle",
    "Orden", "Seguidos primero", "Nombre", "Estrellas", "Issues abiertas", "Pull requests abiertas",
    "Reintentar",
    "Seguir la selección ({n})", "Seleccionar {repo}",
    "Intervalo de actualización (minutos)", "Con qué frecuencia se obtienen de GitHub las issues y pull requests abiertas.",
    // My pull requests
    "Mis pull requests", "No tienes ninguna pull request abierta.", "Comprobaciones correctas", "Comprobaciones fallidas", "Comprobaciones en curso",
    // Downloads: row counter + page total
    "Descargas", "Descargas totales: {n}",
    "Ocultar la barra superior", "La barra de título desaparece, las pestañas se quedan; el botón de menú sigue donde Home Assistant lo muestra.",
    "Seguidos", "Por seguir", "Cambios sin guardar", "Al día", "Notificaciones", "Actualización", "Panel", "Patrones de nombre", "Otro",
    "Por atender", "Nada por atender en los repositorios seguidos", "+ {n} más",
    "No", "Para todos", "Para no administradores",
    "Estrellas", "Forks", "Observadores", "Issues", "Pull requests", "PR fusionadas", "Discusiones", "Descargas", "Última versión", "Última etiqueta", "Último commit", "Última issue", "Última pull request", "Última discusión", "Cuenta", "Seguidores", "Siguiendo", "Repositorios públicos", "Gists públicos",
    "Copiar los enlaces", "Enlaces copiados",
  ],
  sr: [
    "GitHub", "Репозиторијуми", "Активност", "Подешавања", "Интеграција GitHub", "Учитавање…",
    "Интеграција GitHub још није подешена. Додајте је са својим GitHub налогом: овај панел прати ваше репозиторијуме преко ње.",
    "Додај интеграцију GitHub",
    "Интеграција GitHub није учитана ({state}): праћени репозиторијуми су наведени, за праћење нових мора бити учитана.",
    "Интеграција GitHub није могла да наведе ваше репозиторијуме (веза или ограничење GitHub API-ја). Покушајте касније.",
    "Праћени: {followed} · Непраћени: {offered}", "Претражи репозиторијум", "Прати све ({n})", "Прати", "Престани да пратиш", "Праћен",
    "Престати да пратите {repo}? Његови сензори и њихова историја се уклањају из Home Assistant-а.", "Откажи",
    "Ажурирање интеграције GitHub…", "Праћени: {added} · Више се не прате: {removed}",
    "Интеграција GitHub их не нуди: {names}", "Грешка: {error}", "Ниједан репозиторијум не одговара.", "Отвори на GitHub-у",
    "Понуђени репозиторијуми", "Обрасци имена одвојени зарезима, нпр. juju35/ha-*. Празно: сви.",
    "Укључи репозиторијуме са звездицом", "Поред репозиторијума вашег налога.",
    "Занемари архивиране репозиторијуме", "Архивирани репозиторијуми се не нуде. Праћени остају на листи.",
    "Обавести о новим проблемима", "Обавести о новим pull захтевима", "Обавести о новим издањима",
    "Обавештење у Home Assistant-у за сваки нови проблем или pull захтев праћених репозиторијума.",
    "Сачувај", "Сачувано.",
    "Проблеми", "Pull захтеви", "Освежи", "Нема отворених проблема у праћеним репозиторијумима.", "Нема отворених pull захтева у праћеним репозиторијумима.", "Пратите репозиторијуме на картици Репозиторијуми да бисте овде видели њихове проблеме и pull захтеве.", "GitHub није могао да се упита ({error}). Покушајте касније.", "Нацрт", "Одобрен", "Тражене измене", "Потребан преглед", "аутор {author}", "ажурирано {when}", "Коментари: {n}", "Сви репозиторијуми", "Отворено: {n}",
    "Звездице", "Најновије издање", "Прикажи или сакриј детаље",
    "Редослед", "Прво праћени", "Име", "Звездице", "Отворени проблеми", "Отворени pull захтеви",
    "Покушај поново",
    "Прати изабране ({n})", "Изабери {repo}",
    "Интервал освежавања (минути)", "Колико често се отворени проблеми и pull захтеви преузимају са GitHub-а.",
    // My pull requests
    "Моји pull захтеви", "Немате отворених pull захтева.", "Провере успешне", "Провере неуспешне", "Провере у току",
    // Downloads: row counter + page total
    "Преузимања", "Укупно преузимања: {n}",
    "Сакриј горњу траку", "Трака наслова нестаје, картице остају; дугме менија остаје где га Home Assistant приказује.",
    "Праћени", "За праћење", "Несачуване измене", "Ажурно", "Обавештења", "Освежавање", "Панел", "Обрасци имена", "Друго",
    "За обраду", "Ништа за обраду у праћеним репозиторијумима", "+ још {n}",
    "Не", "За све", "За кориснике који нису администратори",
    "Звездице", "Форкови", "Посматрачи", "Проблеми", "Pull захтеви", "Спојени PR", "Дискусије", "Преузимања", "Најновије издање", "Најновија ознака", "Последњи комит", "Последњи проблем", "Последњи pull захтев", "Последња дискусија", "Налог", "Пратиоци", "Прати", "Јавни репозиторијуми", "Јавни гистови",
    "Копирај везе", "Везе су копиране",
  ],
  "sr-Latn": [
    "GitHub", "Repozitorijumi", "Aktivnost", "Podešavanja", "Integracija GitHub", "Učitavanje…",
    "Integracija GitHub još nije podešena. Dodajte je sa svojim GitHub nalogom: ovaj panel prati vaše repozitorijume preko nje.",
    "Dodaj integraciju GitHub",
    "Integracija GitHub nije učitana ({state}): praćeni repozitorijumi su navedeni, za praćenje novih mora biti učitana.",
    "Integracija GitHub nije mogla da navede vaše repozitorijume (veza ili ograničenje GitHub API-ja). Pokušajte kasnije.",
    "Praćeni: {followed} · Nepraćeni: {offered}", "Pretraži repozitorijum", "Prati sve ({n})", "Prati", "Prestani da pratiš", "Praćen",
    "Prestati da pratite {repo}? Njegovi senzori i njihova istorija se uklanjaju iz Home Assistant-a.", "Otkaži",
    "Ažuriranje integracije GitHub…", "Praćeni: {added} · Više se ne prate: {removed}",
    "Integracija GitHub ih ne nudi: {names}", "Greška: {error}", "Nijedan repozitorijum ne odgovara.", "Otvori na GitHub-u",
    "Ponuđeni repozitorijumi", "Obrasci imena odvojeni zarezima, npr. juju35/ha-*. Prazno: svi.",
    "Uključi repozitorijume sa zvezdicom", "Pored repozitorijuma vašeg naloga.",
    "Zanemari arhivirane repozitorijume", "Arhivirani repozitorijumi se ne nude. Praćeni ostaju na listi.",
    "Obavesti o novim problemima", "Obavesti o novim pull zahtevima", "Obavesti o novim izdanjima",
    "Obaveštenje u Home Assistant-u za svaki novi problem ili pull zahtev praćenih repozitorijuma.",
    "Sačuvaj", "Sačuvano.",
    "Problemi", "Pull zahtevi", "Osveži", "Nema otvorenih problema u praćenim repozitorijumima.", "Nema otvorenih pull zahteva u praćenim repozitorijumima.", "Pratite repozitorijume na kartici Repozitorijumi da biste ovde videli njihove probleme i pull zahteve.", "GitHub nije mogao da se upita ({error}). Pokušajte kasnije.", "Nacrt", "Odobren", "Tražene izmene", "Potreban pregled", "autor {author}", "ažurirano {when}", "Komentari: {n}", "Svi repozitorijumi", "Otvoreno: {n}",
    "Zvezdice", "Najnovije izdanje", "Prikaži ili sakrij detalje",
    "Redosled", "Prvo praćeni", "Ime", "Zvezdice", "Otvoreni problemi", "Otvoreni pull zahtevi",
    "Pokušaj ponovo",
    "Prati izabrane ({n})", "Izaberi {repo}",
    "Interval osvežavanja (minuti)", "Koliko često se otvoreni problemi i pull zahtevi preuzimaju sa GitHub-a.",
    // My pull requests
    "Moji pull zahtevi", "Nemate otvorenih pull zahteva.", "Provere uspešne", "Provere neuspešne", "Provere u toku",
    // Downloads: row counter + page total
    "Preuzimanja", "Ukupno preuzimanja: {n}",
    "Sakrij gornju traku", "Traka naslova nestaje, kartice ostaju; dugme menija ostaje gde ga Home Assistant prikazuje.",
    "Praćeni", "Za praćenje", "Nesačuvane izmene", "Ažurno", "Obaveštenja", "Osvežavanje", "Panel", "Obrasci imena", "Drugo",
    "Za obradu", "Ništa za obradu u praćenim repozitorijumima", "+ još {n}",
    "Ne", "Za sve", "Za korisnike koji nisu administratori",
    "Zvezdice", "Forkovi", "Posmatrači", "Problemi", "Pull zahtevi", "Spojeni PR", "Diskusije", "Preuzimanja", "Najnovije izdanje", "Najnovija oznaka", "Poslednji komit", "Poslednji problem", "Poslednji pull zahtev", "Poslednja diskusija", "Nalog", "Pratioci", "Prati", "Javni repozitorijumi", "Javni gistovi",
    "Kopiraj veze", "Veze su kopirane",
  ],
  it: [
    "GitHub", "Repository", "Attività", "Impostazioni", "Integrazione GitHub", "Caricamento…",
    "L’integrazione GitHub non è ancora configurata. Aggiungila con il tuo account GitHub: questo pannello segue i tuoi repository tramite essa.",
    "Aggiungi l’integrazione GitHub",
    "L’integrazione GitHub non è caricata ({state}): i repository seguiti sono elencati, seguirne di nuovi richiede che sia caricata.",
    "L’integrazione GitHub non ha potuto elencare i tuoi repository (connessione o limite dell’API GitHub). Riprova più tardi.",
    "Seguiti: {followed} · Non seguiti: {offered}", "Cerca un repository", "Segui tutti ({n})", "Segui", "Smetti di seguire", "Seguito",
    "Smettere di seguire {repo}? I suoi sensori e la loro cronologia vengono rimossi da Home Assistant.", "Annulla",
    "Aggiornamento dell’integrazione GitHub…", "Seguiti: {added} · Non più seguiti: {removed}",
    "Non offerti dall’integrazione GitHub: {names}", "Errore: {error}", "Nessun repository corrisponde.", "Apri su GitHub",
    "Repository proposti", "Modelli di nome separati da virgole, ad es. juju35/ha-*. Vuoto: tutti.",
    "Includi i repository con stella", "Oltre ai repository del tuo account.",
    "Ignora i repository archiviati", "I repository archiviati non vengono proposti. Quelli seguiti restano in elenco.",
    "Notifica nuove issue", "Notifica nuove pull request", "Notifica nuove release",
    "Una notifica di Home Assistant per ogni nuova issue o pull request dei repository seguiti.",
    "Salva", "Salvato.",
    "Issue", "Pull request", "Aggiorna", "Nessuna issue aperta nei repository seguiti.", "Nessuna pull request aperta nei repository seguiti.", "Segui dei repository nella scheda Repository per vedere qui le loro issue e pull request.", "Impossibile interrogare GitHub ({error}). Riprova più tardi.", "Bozza", "Approvata", "Modifiche richieste", "Revisione richiesta", "di {author}", "aggiornata {when}", "Commenti: {n}", "Tutti i repository", "Aperte: {n}",
    "Stelle", "Ultima release", "Mostra o nascondi i dettagli",
    "Ordinamento", "Prima i seguiti", "Nome", "Stelle", "Issue aperte", "Pull request aperte",
    "Riprova",
    "Segui la selezione ({n})", "Seleziona {repo}",
    "Intervallo di aggiornamento (minuti)", "Con quale frequenza le issue e le pull request aperte vengono recuperate da GitHub.",
    // My pull requests
    "Le mie pull request", "Non hai nessuna pull request aperta.", "Controlli superati", "Controlli falliti", "Controlli in corso",
    // Downloads: row counter + page total
    "Download", "Download totali: {n}",
    "Nascondi la barra superiore", "La barra del titolo sparisce, le schede restano; il pulsante del menu resta dove Home Assistant lo mostra.",
    "Seguiti", "Da seguire", "Modifiche non salvate", "Aggiornato", "Notifiche", "Aggiornamento", "Pannello", "Modelli di nome", "Altro",
    "Da gestire", "Niente da gestire nei repository seguiti", "+ altri {n}",
    "No", "Per tutti", "Per i non amministratori",
    "Stelle", "Fork", "Osservatori", "Issue", "Pull request", "PR unite", "Discussioni", "Download", "Ultima release", "Ultimo tag", "Ultimo commit", "Ultima issue", "Ultima pull request", "Ultima discussione", "Account", "Follower", "Seguiti", "Repository pubblici", "Gist pubblici",
    "Copia i link", "Link copiati",
  ],
  nl: [
    "GitHub", "Repositories", "Activiteit", "Instellingen", "GitHub-integratie", "Laden…",
    "De GitHub-integratie is nog niet ingesteld. Voeg haar toe met je GitHub-account: dit paneel volgt je repositories via haar.",
    "GitHub-integratie toevoegen",
    "De GitHub-integratie is niet geladen ({state}): de gevolgde repositories worden getoond, nieuwe volgen kan pas als ze geladen is.",
    "De GitHub-integratie kon je repositories niet ophalen (verbinding of GitHub-API-limiet). Probeer het later opnieuw.",
    "Gevolgd: {followed} · Niet gevolgd: {offered}", "Repository zoeken", "Alles volgen ({n})", "Volgen", "Niet meer volgen", "Gevolgd",
    "{repo} niet meer volgen? De sensoren en hun geschiedenis worden uit Home Assistant verwijderd.", "Annuleren",
    "GitHub-integratie bijwerken…", "Gevolgd: {added} · Niet meer gevolgd: {removed}",
    "Niet aangeboden door de GitHub-integratie: {names}", "Fout: {error}", "Geen repository komt overeen.", "Openen op GitHub",
    "Aangeboden repositories", "Naampatronen gescheiden door komma’s, bijv. juju35/ha-*. Leeg: allemaal.",
    "Repositories met ster meenemen", "Naast de repositories van je account.",
    "Gearchiveerde repositories negeren", "Gearchiveerde repositories worden niet aangeboden. Gevolgde blijven in de lijst.",
    "Nieuwe issues melden", "Nieuwe pull requests melden", "Nieuwe releases melden",
    "Een Home Assistant-melding voor elke nieuwe issue of pull request van de gevolgde repositories.",
    "Opslaan", "Opgeslagen.",
    "Issues", "Pull requests", "Vernieuwen", "Geen open issue in de gevolgde repositories.", "Geen open pull request in de gevolgde repositories.", "Volg repositories in het tabblad Repositories om hier hun issues en pull requests te zien.", "GitHub kon niet worden bevraagd ({error}). Probeer het later opnieuw.", "Concept", "Goedgekeurd", "Wijzigingen gevraagd", "Review vereist", "door {author}", "bijgewerkt {when}", "Reacties: {n}", "Alle repositories", "Open: {n}",
    "Sterren", "Nieuwste release", "Details tonen of verbergen",
    "Sortering", "Gevolgde eerst", "Naam", "Sterren", "Open issues", "Open pull requests",
    "Opnieuw proberen",
    "Selectie volgen ({n})", "{repo} selecteren",
    "Vernieuwingsinterval (minuten)", "Hoe vaak de open issues en pull requests van GitHub worden opgehaald.",
    // My pull requests
    "Mijn pull requests", "Je hebt geen open pull request.", "Controles geslaagd", "Controles mislukt", "Controles bezig",
    // Downloads: row counter + page total
    "Downloads", "Totaal aantal downloads: {n}",
    "Bovenste balk verbergen", "De titelbalk verdwijnt, de tabbladen blijven; de menuknop blijft waar Home Assistant hem toont.",
    "Gevolgd", "Te volgen", "Niet-opgeslagen wijzigingen", "Bijgewerkt", "Meldingen", "Vernieuwen", "Paneel", "Naampatronen", "Anders",
    "Af te handelen", "Niets af te handelen in de gevolgde repositories", "+ {n} meer",
    "Nee", "Voor iedereen", "Voor niet-beheerders",
    "Sterren", "Forks", "Kijkers", "Issues", "Pull requests", "Samengevoegde PR’s", "Discussies", "Downloads", "Nieuwste release", "Nieuwste tag", "Laatste commit", "Nieuwste issue", "Nieuwste pull request", "Nieuwste discussie", "Account", "Volgers", "Volgend", "Openbare repositories", "Openbare gists",
    "Links kopiëren", "Links gekopieerd",
  ],
  pt: [
    "GitHub", "Repositórios", "Atividade", "Definições", "Integração GitHub", "A carregar…",
    "A integração GitHub ainda não está configurada. Adicione-a com a sua conta GitHub: este painel segue os seus repositórios através dela.",
    "Adicionar a integração GitHub",
    "A integração GitHub não está carregada ({state}): os repositórios seguidos são listados, seguir novos exige que esteja carregada.",
    "A integração GitHub não conseguiu listar os seus repositórios (ligação ou limite da API do GitHub). Tente mais tarde.",
    "Seguidos: {followed} · Não seguidos: {offered}", "Procurar um repositório", "Seguir todos ({n})", "Seguir", "Deixar de seguir", "Seguido",
    "Deixar de seguir {repo}? Os seus sensores e o respetivo histórico são removidos do Home Assistant.", "Cancelar",
    "A atualizar a integração GitHub…", "Seguidos: {added} · Já não seguidos: {removed}",
    "Não propostos pela integração GitHub: {names}", "Erro: {error}", "Nenhum repositório corresponde.", "Abrir no GitHub",
    "Repositórios propostos", "Padrões de nome separados por vírgulas, p. ex. juju35/ha-*. Vazio: todos.",
    "Incluir os repositórios com estrela", "Além dos repositórios da sua conta.",
    "Ignorar os repositórios arquivados", "Os repositórios arquivados não são propostos. Os seguidos continuam na lista.",
    "Notificar novas issues", "Notificar novos pull requests", "Notificar novas versões",
    "Uma notificação do Home Assistant para cada nova issue ou pull request dos repositórios seguidos.",
    "Guardar", "Guardado.",
    "Issues", "Pull requests", "Atualizar", "Nenhuma issue em aberto nos repositórios seguidos.", "Nenhum pull request em aberto nos repositórios seguidos.", "Siga repositórios no separador Repositórios para ver aqui as suas issues e pull requests.", "Não foi possível consultar o GitHub ({error}). Tente mais tarde.", "Rascunho", "Aprovado", "Alterações pedidas", "Revisão necessária", "por {author}", "atualizado {when}", "Comentários: {n}", "Todos os repositórios", "Em aberto: {n}",
    "Estrelas", "Versão mais recente", "Mostrar ou ocultar o detalhe",
    "Ordenação", "Seguidos primeiro", "Nome", "Estrelas", "Issues em aberto", "Pull requests em aberto",
    "Tentar novamente",
    "Seguir a seleção ({n})", "Selecionar {repo}",
    "Intervalo de atualização (minutos)", "Com que frequência as issues e pull requests em aberto são obtidas do GitHub.",
    // My pull requests
    "Os meus pull requests", "Não tem nenhum pull request em aberto.", "Verificações aprovadas", "Verificações falhadas", "Verificações em curso",
    // Downloads: row counter + page total
    "Transferências", "Total de transferências: {n}",
    "Ocultar a barra superior", "A barra de título desaparece, os separadores ficam; o botão de menu fica onde o Home Assistant o mostra.",
    "Seguidos", "Por seguir", "Alterações não guardadas", "Atualizado", "Notificações", "Atualização", "Painel", "Padrões de nome", "Outro",
    "Por tratar", "Nada por tratar nos repositórios seguidos", "+ {n} mais",
    "Não", "Para todos", "Para não administradores",
    "Estrelas", "Forks", "Observadores", "Issues", "Pull requests", "PR integrados", "Discussões", "Transferências", "Versão mais recente", "Etiqueta mais recente", "Último commit", "Issue mais recente", "Pull request mais recente", "Discussão mais recente", "Conta", "Seguidores", "A seguir", "Repositórios públicos", "Gists públicos",
    "Copiar as ligações", "Ligações copiadas",
  ],
  pl: [
    "GitHub", "Repozytoria", "Aktywność", "Ustawienia", "Integracja GitHub", "Ładowanie…",
    "Integracja GitHub nie jest jeszcze skonfigurowana. Dodaj ją z kontem GitHub: ten panel śledzi repozytoria za jej pośrednictwem.",
    "Dodaj integrację GitHub",
    "Integracja GitHub nie jest załadowana ({state}): śledzone repozytoria są wyświetlane, śledzenie nowych wymaga jej załadowania.",
    "Integracja GitHub nie mogła pobrać listy repozytoriów (połączenie lub limit API GitHub). Spróbuj później.",
    "Śledzone: {followed} · Nieśledzone: {offered}", "Szukaj repozytorium", "Śledź wszystkie ({n})", "Śledź", "Przestań śledzić", "Śledzone",
    "Przestać śledzić {repo}? Jego czujniki i ich historia zostaną usunięte z Home Assistant.", "Anuluj",
    "Aktualizowanie integracji GitHub…", "Śledzone: {added} · Już nieśledzone: {removed}",
    "Nieoferowane przez integrację GitHub: {names}", "Błąd: {error}", "Brak pasujących repozytoriów.", "Otwórz w GitHub",
    "Oferowane repozytoria", "Wzorce nazw oddzielone przecinkami, np. juju35/ha-*. Puste: wszystkie.",
    "Uwzględnij repozytoria z gwiazdką", "Oprócz repozytoriów Twojego konta.",
    "Pomijaj zarchiwizowane repozytoria", "Zarchiwizowane repozytoria nie są proponowane. Obserwowane pozostają na liście.",
    "Powiadamiaj o nowych zgłoszeniach", "Powiadamiaj o nowych pull requestach", "Powiadamiaj o nowych wydaniach",
    "Powiadomienie Home Assistant o każdym nowym zgłoszeniu lub pull requeście śledzonych repozytoriów.",
    "Zapisz", "Zapisano.",
    "Zgłoszenia", "Pull requesty", "Odśwież", "Brak otwartych zgłoszeń w śledzonych repozytoriach.", "Brak otwartych pull requestów w śledzonych repozytoriach.", "Śledź repozytoria w zakładce Repozytoria, aby zobaczyć tu ich zgłoszenia i pull requesty.", "Nie udało się odpytać GitHub ({error}). Spróbuj później.", "Szkic", "Zatwierdzony", "Wymagane zmiany", "Wymagana recenzja", "autor: {author}", "zaktualizowano {when}", "Komentarze: {n}", "Wszystkie repozytoria", "Otwarte: {n}",
    "Gwiazdki", "Najnowsze wydanie", "Pokaż lub ukryj szczegóły",
    "Sortowanie", "Najpierw śledzone", "Nazwa", "Gwiazdki", "Otwarte zgłoszenia", "Otwarte pull requesty",
    "Spróbuj ponownie",
    "Obserwuj zaznaczone ({n})", "Zaznacz {repo}",
    "Interwał odświeżania (minuty)", "Jak często otwarte zgłoszenia i pull requesty są pobierane z GitHub.",
    // My pull requests
    "Moje pull requesty", "Nie masz żadnego otwartego pull requesta.", "Testy zaliczone", "Testy nieudane", "Testy w toku",
    // Downloads: row counter + page total
    "Pobrania", "Łączna liczba pobrań: {n}",
    "Ukryj górny pasek", "Pasek tytułu znika, karty zostają; przycisk menu zostaje tam, gdzie pokazuje go Home Assistant.",
    "Obserwowane", "Do obserwowania", "Niezapisane zmiany", "Aktualne", "Powiadomienia", "Odświeżanie", "Panel", "Wzorce nazw", "Inne",
    "Do obsłużenia", "Nic do obsłużenia w obserwowanych repozytoriach", "+ {n} więcej",
    "Nie", "Dla wszystkich", "Dla nie-administratorów",
    "Gwiazdki", "Forki", "Obserwatorzy", "Zgłoszenia", "Pull requesty", "Scalone PR", "Dyskusje", "Pobrania", "Najnowsze wydanie", "Najnowszy tag", "Ostatni commit", "Najnowsze zgłoszenie", "Najnowszy pull request", "Najnowsza dyskusja", "Konto", "Obserwujący", "Obserwowani", "Publiczne repozytoria", "Publiczne gisty",
    "Kopiuj linki", "Skopiowano linki",
  ],
  ro: [
    "GitHub", "Depozite", "Activitate", "Setări", "Integrarea GitHub", "Se încarcă…",
    "Integrarea GitHub nu este încă configurată. Adaug-o cu contul tău GitHub: acest panou urmărește depozitele tale prin ea.",
    "Adaugă integrarea GitHub",
    "Integrarea GitHub nu este încărcată ({state}): depozitele urmărite sunt listate, urmărirea altora noi necesită să fie încărcată.",
    "Integrarea GitHub nu a putut lista depozitele tale (conexiune sau limita API GitHub). Încearcă mai târziu.",
    "Urmărite: {followed} · Neurmărite: {offered}", "Caută un depozit", "Urmărește tot ({n})", "Urmărește", "Nu mai urmări", "Urmărit",
    "Nu mai urmărești {repo}? Senzorii lui și istoricul lor sunt eliminați din Home Assistant.", "Anulează",
    "Se actualizează integrarea GitHub…", "Urmărite: {added} · Nu mai sunt urmărite: {removed}",
    "Neoferite de integrarea GitHub: {names}", "Eroare: {error}", "Niciun depozit nu corespunde.", "Deschide pe GitHub",
    "Depozite oferite", "Modele de nume separate prin virgule, ex. juju35/ha-*. Gol: toate.",
    "Include depozitele cu stea", "Pe lângă depozitele contului tău.",
    "Ignoră depozitele arhivate", "Depozitele arhivate nu sunt propuse. Cele urmărite rămân în listă.",
    "Notifică issue-urile noi", "Notifică pull request-urile noi", "Notifică versiunile noi",
    "O notificare Home Assistant pentru fiecare issue sau pull request nou al depozitelor urmărite.",
    "Salvează", "Salvat.",
    "Issue-uri", "Pull request-uri", "Reîmprospătează", "Niciun issue deschis în depozitele urmărite.", "Niciun pull request deschis în depozitele urmărite.", "Urmărește depozite în fila Depozite pentru a vedea aici issue-urile și pull request-urile lor.", "GitHub nu a putut fi interogat ({error}). Încearcă mai târziu.", "Ciornă", "Aprobat", "Modificări solicitate", "Revizuire necesară", "de {author}", "actualizat {when}", "Comentarii: {n}", "Toate depozitele", "Deschise: {n}",
    "Stele", "Cea mai recentă versiune", "Afișează sau ascunde detaliile",
    "Sortare", "Mai întâi cele urmărite", "Nume", "Stele", "Issue-uri deschise", "Pull request-uri deschise",
    "Reîncearcă",
    "Urmărește selecția ({n})", "Selectează {repo}",
    "Interval de actualizare (minute)", "Cât de des sunt preluate de la GitHub issue-urile și pull request-urile deschise.",
    // My pull requests
    "Pull request-urile mele", "Nu ai niciun pull request deschis.", "Verificări reușite", "Verificări eșuate", "Verificări în curs",
    // Downloads: row counter + page total
    "Descărcări", "Total descărcări: {n}",
    "Ascunde bara de sus", "Bara de titlu dispare, filele rămân; butonul de meniu rămâne acolo unde îl afișează Home Assistant.",
    "Urmărite", "De urmărit", "Modificări nesalvate", "La zi", "Notificări", "Reîmprospătare", "Panou", "Modele de nume", "Altul",
    "De rezolvat", "Nimic de rezolvat în depozitele urmărite", "+ încă {n}",
    "Nu", "Pentru toți", "Pentru non-administratori",
    "Stele", "Fork-uri", "Observatori", "Issue-uri", "Pull request-uri", "PR-uri îmbinate", "Discuții", "Descărcări", "Cea mai recentă versiune", "Cea mai recentă etichetă", "Ultimul commit", "Cel mai recent issue", "Cel mai recent pull request", "Cea mai recentă discuție", "Cont", "Urmăritori", "Urmăriți", "Depozite publice", "Gist-uri publice",
    "Copiază linkurile", "Linkuri copiate",
  ],
  da: [
    "GitHub", "Repositories", "Aktivitet", "Indstillinger", "GitHub-integration", "Indlæser…",
    "GitHub-integrationen er endnu ikke sat op. Tilføj den med din GitHub-konto: dette panel følger dine repositories gennem den.",
    "Tilføj GitHub-integrationen",
    "GitHub-integrationen er ikke indlæst ({state}): de fulgte repositories vises, at følge nye kræver at den er indlæst.",
    "GitHub-integrationen kunne ikke vise dine repositories (forbindelse eller GitHub API-grænse). Prøv igen senere.",
    "Fulgt: {followed} · Ikke fulgt: {offered}", "Søg efter et repository", "Følg alle ({n})", "Følg", "Stop med at følge", "Fulgt",
    "Stop med at følge {repo}? Dets sensorer og deres historik fjernes fra Home Assistant.", "Annuller",
    "Opdaterer GitHub-integrationen…", "Fulgt: {added} · Ikke længere fulgt: {removed}",
    "Ikke tilbudt af GitHub-integrationen: {names}", "Fejl: {error}", "Intet repository matcher.", "Åbn på GitHub",
    "Tilbudte repositories", "Navnemønstre adskilt af kommaer, fx juju35/ha-*. Tom: alle.",
    "Medtag stjernemarkerede repositories", "Ud over repositories på din konto.",
    "Ignorer arkiverede repositories", "Arkiverede repositories tilbydes ikke. Fulgte bliver på listen.",
    "Giv besked om nye issues", "Giv besked om nye pull requests", "Giv besked om nye udgivelser",
    "En Home Assistant-meddelelse for hver ny issue eller pull request i de fulgte repositories.",
    "Gem", "Gemt.",
    "Issues", "Pull requests", "Opdater", "Ingen åbne issues i de fulgte repositories.", "Ingen åbne pull requests i de fulgte repositories.", "Følg repositories under fanen Repositories for at se deres issues og pull requests her.", "GitHub kunne ikke forespørges ({error}). Prøv igen senere.", "Kladde", "Godkendt", "Ændringer ønsket", "Gennemgang påkrævet", "af {author}", "opdateret {when}", "Kommentarer: {n}", "Alle repositories", "Åbne: {n}",
    "Stjerner", "Seneste udgivelse", "Vis eller skjul detaljer",
    "Sortering", "Fulgte først", "Navn", "Stjerner", "Åbne issues", "Åbne pull requests",
    "Prøv igen",
    "Følg valgte ({n})", "Vælg {repo}",
    "Opdateringsinterval (minutter)", "Hvor ofte de åbne issues og pull requests hentes fra GitHub.",
    // My pull requests
    "Mine pull requests", "Du har ingen åbne pull requests.", "Tjek bestået", "Tjek mislykkedes", "Tjek i gang",
    // Downloads: row counter + page total
    "Downloads", "Downloads i alt: {n}",
    "Skjul den øverste bjælke", "Titellinjen forsvinder, fanerne bliver; menuknappen bliver, hvor Home Assistant viser den.",
    "Fulgt", "At følge", "Ikke-gemte ændringer", "Opdateret", "Notifikationer", "Opdatering", "Panel", "Navnemønstre", "Andet",
    "Skal håndteres", "Intet at håndtere i de fulgte repositories", "+ {n} mere",
    "Nej", "For alle", "For ikke-administratorer",
    "Stjerner", "Forks", "Overvågere", "Issues", "Pull requests", "Flettede PR’er", "Diskussioner", "Downloads", "Seneste udgivelse", "Seneste tag", "Seneste commit", "Seneste issue", "Seneste pull request", "Seneste diskussion", "Konto", "Følgere", "Følger", "Offentlige repositories", "Offentlige gists",
    "Kopiér links", "Links kopieret",
  ],
  sv: [
    "GitHub", "Repon", "Aktivitet", "Inställningar", "GitHub-integration", "Laddar…",
    "GitHub-integrationen är inte konfigurerad än. Lägg till den med ditt GitHub-konto: den här panelen följer dina repon genom den.",
    "Lägg till GitHub-integrationen",
    "GitHub-integrationen är inte laddad ({state}): följda repon visas, att följa nya kräver att den är laddad.",
    "GitHub-integrationen kunde inte lista dina repon (anslutning eller GitHub API-gräns). Försök igen senare.",
    "Följda: {followed} · Inte följda: {offered}", "Sök ett repo", "Följ alla ({n})", "Följ", "Sluta följa", "Följs",
    "Sluta följa {repo}? Dess sensorer och deras historik tas bort från Home Assistant.", "Avbryt",
    "Uppdaterar GitHub-integrationen…", "Följda: {added} · Följs inte längre: {removed}",
    "Erbjuds inte av GitHub-integrationen: {names}", "Fel: {error}", "Inget repo matchar.", "Öppna på GitHub",
    "Erbjudna repon", "Namnmönster åtskilda med kommatecken, t.ex. juju35/ha-*. Tomt: alla.",
    "Ta med stjärnmärkta repon", "Utöver repona i ditt konto.",
    "Ignorera arkiverade repon", "Arkiverade repon erbjuds inte. Följda repon ligger kvar i listan.",
    "Meddela nya ärenden", "Meddela nya pull requests", "Meddela nya versioner",
    "En Home Assistant-avisering för varje nytt ärende eller ny pull request i de följda repona.",
    "Spara", "Sparat.",
    "Ärenden", "Pull requests", "Uppdatera", "Inga öppna ärenden i de följda repona.", "Inga öppna pull requests i de följda repona.", "Följ repon under fliken Repon för att se deras ärenden och pull requests här.", "GitHub kunde inte frågas ({error}). Försök igen senare.", "Utkast", "Godkänd", "Ändringar begärda", "Granskning krävs", "av {author}", "uppdaterad {when}", "Kommentarer: {n}", "Alla repon", "Öppna: {n}",
    "Stjärnor", "Senaste release", "Visa eller dölj detaljer",
    "Sortering", "Följda först", "Namn", "Stjärnor", "Öppna ärenden", "Öppna pull requests",
    "Försök igen",
    "Följ valda ({n})", "Välj {repo}",
    "Uppdateringsintervall (minuter)", "Hur ofta öppna ärenden och pull requests hämtas från GitHub.",
    // My pull requests
    "Mina pull requests", "Du har inga öppna pull requests.", "Kontroller godkända", "Kontroller misslyckades", "Kontroller pågår",
    // Downloads: row counter + page total
    "Nedladdningar", "Totalt antal nedladdningar: {n}",
    "Dölj det övre fältet", "Namnlisten försvinner, flikarna stannar; menyknappen stannar där Home Assistant visar den.",
    "Följda", "Att följa", "Osparade ändringar", "Uppdaterad", "Aviseringar", "Uppdatering", "Panel", "Namnmönster", "Annat",
    "Att hantera", "Inget att hantera i de följda förråden", "+ {n} till",
    "Nej", "För alla", "För icke-administratörer",
    "Stjärnor", "Forks", "Bevakare", "Ärenden", "Pull requests", "Sammanfogade PR", "Diskussioner", "Nedladdningar", "Senaste release", "Senaste tagg", "Senaste commit", "Senaste ärende", "Senaste pull request", "Senaste diskussion", "Konto", "Följare", "Följer", "Publika repon", "Publika gists",
    "Kopiera länkarna", "Länkarna kopierade",
  ],
  bg: [
    "GitHub", "Хранилища", "Активност", "Настройки", "Интеграция GitHub", "Зареждане…",
    "Интеграцията GitHub все още не е настроена. Добавете я с акаунта си в GitHub: този панел следи хранилищата ви чрез нея.",
    "Добави интеграцията GitHub",
    "Интеграцията GitHub не е заредена ({state}): следените хранилища са показани, следенето на нови изисква тя да е заредена.",
    "Интеграцията GitHub не успя да покаже хранилищата ви (връзка или ограничение на GitHub API). Опитайте по-късно.",
    "Следени: {followed} · Неследени: {offered}", "Търсене на хранилище", "Следи всички ({n})", "Следи", "Спри да следиш", "Следено",
    "Да спрете ли да следите {repo}? Сензорите му и историята им се премахват от Home Assistant.", "Отказ",
    "Обновяване на интеграцията GitHub…", "Следени: {added} · Вече не се следят: {removed}",
    "Не се предлагат от интеграцията GitHub: {names}", "Грешка: {error}", "Няма съвпадащо хранилище.", "Отвори в GitHub",
    "Предлагани хранилища", "Шаблони на имена, разделени със запетаи, напр. juju35/ha-*. Празно: всички.",
    "Включи хранилищата със звезда", "Освен хранилищата на акаунта ви.",
    "Пропускай архивираните хранилища", "Архивираните хранилища не се предлагат. Следените остават в списъка.",
    "Известявай за нови проблеми", "Известявай за нови pull заявки", "Известявай за нови версии",
    "Известие в Home Assistant за всеки нов проблем или pull заявка на следените хранилища.",
    "Запази", "Запазено.",
    "Проблеми", "Pull заявки", "Опресни", "Няма отворени проблеми в следените хранилища.", "Няма отворени pull заявки в следените хранилища.", "Следете хранилища в раздела Хранилища, за да виждате тук проблемите и pull заявките им.", "GitHub не можа да бъде запитан ({error}). Опитайте по-късно.", "Чернова", "Одобрена", "Поискани промени", "Нужен преглед", "от {author}", "обновено {when}", "Коментари: {n}", "Всички хранилища", "Отворени: {n}",
    "Звезди", "Последна версия", "Покажи или скрий подробностите",
    "Подреждане", "Първо следените", "Име", "Звезди", "Отворени проблеми", "Отворени pull заявки",
    "Опитай отново",
    "Следи избраните ({n})", "Избери {repo}",
    "Интервал на опресняване (минути)", "Колко често отворените проблеми и pull заявки се извличат от GitHub.",
    // My pull requests
    "Моите pull заявки", "Нямате отворени pull заявки.", "Проверките успешни", "Проверките неуспешни", "Проверките текат",
    // Downloads: row counter + page total
    "Изтегляния", "Общо изтегляния: {n}",
    "Скриване на горната лента", "Лентата със заглавие изчезва, разделите остават; бутонът на менюто остава там, където Home Assistant го показва.",
    "Следвани", "За следване", "Незапазени промени", "Актуално", "Известия", "Опресняване", "Панел", "Шаблони за имена", "Друго",
    "За обработка", "Нищо за обработка в следваните хранилища", "+ още {n}",
    "Не", "За всички", "За неадминистратори",
    "Звезди", "Форкове", "Наблюдаващи", "Проблеми", "Pull заявки", "Слети PR", "Дискусии", "Изтегляния", "Последна версия", "Последен таг", "Последен commit", "Последен проблем", "Последна pull заявка", "Последна дискусия", "Акаунт", "Последователи", "Следвани", "Публични хранилища", "Публични gist-ове",
    "Копиране на връзките", "Връзките са копирани",
  ],
  ru: [
    "GitHub", "Репозитории", "Активность", "Настройки", "Интеграция GitHub", "Загрузка…",
    "Интеграция GitHub ещё не настроена. Добавьте её с вашим аккаунтом GitHub: эта панель отслеживает ваши репозитории через неё.",
    "Добавить интеграцию GitHub",
    "Интеграция GitHub не загружена ({state}): отслеживаемые репозитории показаны, для отслеживания новых она должна быть загружена.",
    "Интеграция GitHub не смогла получить список ваших репозиториев (соединение или лимит API GitHub). Повторите позже.",
    "Отслеживаются: {followed} · Не отслеживаются: {offered}", "Поиск репозитория", "Отслеживать все ({n})", "Отслеживать", "Не отслеживать", "Отслеживается",
    "Перестать отслеживать {repo}? Его датчики и их история будут удалены из Home Assistant.", "Отмена",
    "Обновление интеграции GitHub…", "Отслеживаются: {added} · Больше не отслеживаются: {removed}",
    "Не предлагаются интеграцией GitHub: {names}", "Ошибка: {error}", "Нет подходящих репозиториев.", "Открыть на GitHub",
    "Предлагаемые репозитории", "Шаблоны имён через запятую, например juju35/ha-*. Пусто: все.",
    "Включить отмеченные звездой", "Помимо репозиториев вашего аккаунта.",
    "Игнорировать архивные репозитории", "Архивные репозитории не предлагаются. Отслеживаемые остаются в списке.",
    "Уведомлять о новых задачах", "Уведомлять о новых pull-запросах", "Уведомлять о новых релизах",
    "Уведомление Home Assistant о каждой новой задаче или pull-запросе отслеживаемых репозиториев.",
    "Сохранить", "Сохранено.",
    "Задачи", "Pull-запросы", "Обновить", "Нет открытых задач в отслеживаемых репозиториях.", "Нет открытых pull-запросов в отслеживаемых репозиториях.", "Отслеживайте репозитории на вкладке «Репозитории», чтобы видеть здесь их задачи и pull-запросы.", "Не удалось запросить GitHub ({error}). Повторите позже.", "Черновик", "Одобрен", "Запрошены изменения", "Требуется ревью", "автор {author}", "обновлено {when}", "Комментарии: {n}", "Все репозитории", "Открыто: {n}",
    "Звёзды", "Последний релиз", "Показать или скрыть подробности",
    "Сортировка", "Сначала отслеживаемые", "Имя", "Звёзды", "Открытые задачи", "Открытые pull-запросы",
    "Повторить",
    "Отслеживать выбранные ({n})", "Выбрать {repo}",
    "Интервал обновления (минуты)", "Как часто открытые задачи и pull-запросы запрашиваются с GitHub.",
    // My pull requests
    "Мои pull-запросы", "У вас нет открытых pull-запросов.", "Проверки пройдены", "Проверки не пройдены", "Проверки выполняются",
    // Downloads: row counter + page total
    "Загрузки", "Всего загрузок: {n}",
    "Скрыть верхнюю панель", "Строка заголовка исчезает, вкладки остаются; кнопка меню остаётся там, где её показывает Home Assistant.",
    "Отслеживаемые", "Для отслеживания", "Несохранённые изменения", "Актуально", "Уведомления", "Обновление", "Панель", "Шаблоны имён", "Другое",
    "К обработке", "Нечего обрабатывать в отслеживаемых репозиториях", "+ ещё {n}",
    "Нет", "Для всех", "Для не-администраторов",
    "Звёзды", "Форки", "Наблюдатели", "Задачи", "Pull-запросы", "Слитые PR", "Обсуждения", "Загрузки", "Последний релиз", "Последний тег", "Последний коммит", "Последняя задача", "Последний pull-запрос", "Последнее обсуждение", "Аккаунт", "Подписчики", "Подписки", "Публичные репозитории", "Публичные gist",
    "Копировать ссылки", "Ссылки скопированы",
  ],
  uk: [
    "GitHub", "Репозиторії", "Активність", "Налаштування", "Інтеграція GitHub", "Завантаження…",
    "Інтеграцію GitHub ще не налаштовано. Додайте її з вашим обліковим записом GitHub: ця панель відстежує ваші репозиторії через неї.",
    "Додати інтеграцію GitHub",
    "Інтеграцію GitHub не завантажено ({state}): відстежувані репозиторії показано, для відстеження нових вона має бути завантажена.",
    "Інтеграція GitHub не змогла отримати список ваших репозиторіїв (з’єднання або ліміт API GitHub). Спробуйте пізніше.",
    "Відстежуються: {followed} · Не відстежуються: {offered}", "Пошук репозиторію", "Відстежувати всі ({n})", "Відстежувати", "Не відстежувати", "Відстежується",
    "Припинити відстеження {repo}? Його датчики та їхню історію буде видалено з Home Assistant.", "Скасувати",
    "Оновлення інтеграції GitHub…", "Відстежуються: {added} · Більше не відстежуються: {removed}",
    "Не пропонуються інтеграцією GitHub: {names}", "Помилка: {error}", "Немає відповідних репозиторіїв.", "Відкрити на GitHub",
    "Запропоновані репозиторії", "Шаблони назв через кому, напр. juju35/ha-*. Порожньо: усі.",
    "Включити позначені зіркою", "Окрім репозиторіїв вашого облікового запису.",
    "Ігнорувати архівні репозиторії", "Архівні репозиторії не пропонуються. Відстежувані залишаються в списку.",
    "Сповіщати про нові задачі", "Сповіщати про нові pull-запити", "Сповіщати про нові релізи",
    "Сповіщення Home Assistant про кожну нову задачу або pull-запит відстежуваних репозиторіїв.",
    "Зберегти", "Збережено.",
    "Задачі", "Pull-запити", "Оновити", "Немає відкритих задач у відстежуваних репозиторіях.", "Немає відкритих pull-запитів у відстежуваних репозиторіях.", "Відстежуйте репозиторії на вкладці «Репозиторії», щоб бачити тут їхні задачі та pull-запити.", "Не вдалося запитати GitHub ({error}). Спробуйте пізніше.", "Чернетка", "Схвалено", "Запитано зміни", "Потрібне рев’ю", "автор {author}", "оновлено {when}", "Коментарі: {n}", "Усі репозиторії", "Відкрито: {n}",
    "Зірки", "Останній реліз", "Показати або приховати подробиці",
    "Сортування", "Спершу відстежувані", "Назва", "Зірки", "Відкриті задачі", "Відкриті pull-запити",
    "Повторити",
    "Відстежувати вибрані ({n})", "Вибрати {repo}",
    "Інтервал оновлення (хвилини)", "Як часто відкриті задачі та pull-запити отримуються з GitHub.",
    // My pull requests
    "Мої pull-запити", "У вас немає відкритих pull-запитів.", "Перевірки пройдено", "Перевірки не пройдено", "Перевірки виконуються",
    // Downloads: row counter + page total
    "Завантаження", "Усього завантажень: {n}",
    "Приховати верхню панель", "Рядок заголовка зникає, вкладки лишаються; кнопка меню лишається там, де її показує Home Assistant.",
    "Відстежувані", "Для відстеження", "Незбережені зміни", "Актуально", "Сповіщення", "Оновлення", "Панель", "Шаблони імен", "Інше",
    "До опрацювання", "Нічого опрацьовувати у відстежуваних репозиторіях", "+ ще {n}",
    "Ні", "Для всіх", "Для не-адміністраторів",
    "Зірки", "Форки", "Спостерігачі", "Задачі", "Pull-запити", "Злиті PR", "Обговорення", "Завантаження", "Останній реліз", "Останній тег", "Останній коміт", "Остання задача", "Останній pull-запит", "Останнє обговорення", "Обліковий запис", "Підписники", "Стежить", "Публічні репозиторії", "Публічні gist",
    "Копіювати посилання", "Посилання скопійовано",
  ],
  hu: [
    "GitHub", "Tárolók", "Tevékenység", "Beállítások", "GitHub integráció", "Betöltés…",
    "A GitHub integráció még nincs beállítva. Add hozzá a GitHub-fiókoddal: ez a panel rajta keresztül követi a tárolóidat.",
    "GitHub integráció hozzáadása",
    "A GitHub integráció nincs betöltve ({state}): a követett tárolók listázva vannak, újak követéséhez be kell töltődnie.",
    "A GitHub integráció nem tudta listázni a tárolóidat (kapcsolat vagy GitHub API-korlát). Próbáld újra később.",
    "Követett: {followed} · Nem követett: {offered}", "Tároló keresése", "Összes követése ({n})", "Követés", "Követés leállítása", "Követve",
    "Leállítod a(z) {repo} követését? Az érzékelői és azok előzményei törlődnek a Home Assistantből.", "Mégse",
    "A GitHub integráció frissítése…", "Követett: {added} · Már nem követett: {removed}",
    "A GitHub integráció nem kínálja: {names}", "Hiba: {error}", "Nincs egyező tároló.", "Megnyitás a GitHubon",
    "Felkínált tárolók", "Névminták vesszővel elválasztva, pl. juju35/ha-*. Üres: mind.",
    "Csillagozott tárolók is", "A fiókod tárolói mellett.",
    "Archivált tárolók kihagyása", "Az archivált tárolók nem jelennek meg az ajánlatban. A követettek a listán maradnak.",
    "Új hibajegyek értesítése", "Új pull requestek értesítése", "Új kiadások értesítése",
    "Home Assistant értesítés a követett tárolók minden új hibajegyéről vagy pull requestjéről.",
    "Mentés", "Mentve.",
    "Hibajegyek", "Pull requestek", "Frissítés", "Nincs nyitott hibajegy a követett tárolókban.", "Nincs nyitott pull request a követett tárolókban.", "Kövess tárolókat a Tárolók lapon, hogy itt lásd a hibajegyeiket és pull requestjeiket.", "A GitHub nem volt lekérdezhető ({error}). Próbáld újra később.", "Piszkozat", "Jóváhagyva", "Módosítás kérve", "Felülvizsgálat szükséges", "szerző: {author}", "frissítve {when}", "Hozzászólások: {n}", "Minden tároló", "Nyitott: {n}",
    "Csillagok", "Legújabb kiadás", "Részletek megjelenítése vagy elrejtése",
    "Rendezés", "Követettek elöl", "Név", "Csillagok", "Nyitott hibajegyek", "Nyitott pull requestek",
    "Újra",
    "Kijelöltek követése ({n})", "{repo} kijelölése",
    "Frissítési időköz (perc)", "Milyen gyakran töltődnek le a nyitott hibajegyek és pull requestek a GitHubról.",
    // My pull requests
    "Saját pull requestjeim", "Nincs nyitott pull requested.", "Ellenőrzések rendben", "Ellenőrzések sikertelenek", "Ellenőrzések folyamatban",
    // Downloads: row counter + page total
    "Letöltések", "Letöltések összesen: {n}",
    "Felső sáv elrejtése", "A címsor eltűnik, a lapok maradnak; a menügomb ott marad, ahol a Home Assistant mutatja.",
    "Követett", "Követendő", "Nem mentett módosítások", "Naprakész", "Értesítések", "Frissítés", "Panel", "Névminták", "Egyéb",
    "Teendő", "Nincs teendő a követett tárolókban", "+ még {n}",
    "Nem", "Mindenkinek", "Nem rendszergazdáknak",
    "Csillagok", "Forkok", "Figyelők", "Hibajegyek", "Pull requestek", "Egyesített PR-ek", "Beszélgetések", "Letöltések", "Legújabb kiadás", "Legújabb címke", "Legutóbbi commit", "Legújabb hibajegy", "Legújabb pull request", "Legújabb beszélgetés", "Fiók", "Követők", "Követettek", "Nyilvános tárolók", "Nyilvános gistek",
    "Hivatkozások másolása", "Hivatkozások másolva",
  ],
  sk: [
    "GitHub", "Repozitáre", "Aktivita", "Nastavenia", "Integrácia GitHub", "Načítava sa…",
    "Integrácia GitHub ešte nie je nastavená. Pridajte ju so svojím účtom GitHub: tento panel cez ňu sleduje vaše repozitáre.",
    "Pridať integráciu GitHub",
    "Integrácia GitHub nie je načítaná ({state}): sledované repozitáre sú uvedené, sledovanie nových vyžaduje, aby bola načítaná.",
    "Integrácia GitHub nemohla zobraziť vaše repozitáre (pripojenie alebo limit API GitHub). Skúste to neskôr.",
    "Sledované: {followed} · Nesledované: {offered}", "Hľadať repozitár", "Sledovať všetky ({n})", "Sledovať", "Prestať sledovať", "Sledované",
    "Prestať sledovať {repo}? Jeho senzory a ich história sa odstránia z Home Assistant.", "Zrušiť",
    "Aktualizuje sa integrácia GitHub…", "Sledované: {added} · Už nesledované: {removed}",
    "Integrácia GitHub ich neponúka: {names}", "Chyba: {error}", "Žiadny repozitár nevyhovuje.", "Otvoriť na GitHube",
    "Ponúkané repozitáre", "Vzory názvov oddelené čiarkami, napr. juju35/ha-*. Prázdne: všetky.",
    "Zahrnúť repozitáre s hviezdičkou", "Okrem repozitárov vášho účtu.",
    "Ignorovať archivované repozitáre", "Archivované repozitáre sa neponúkajú. Sledované zostávajú v zozname.",
    "Upozorniť na nové problémy", "Upozorniť na nové pull requesty", "Upozorniť na nové vydania",
    "Upozornenie Home Assistant na každý nový problém alebo pull request sledovaných repozitárov.",
    "Uložiť", "Uložené.",
    "Problémy", "Pull requesty", "Obnoviť", "Žiadny otvorený problém v sledovaných repozitároch.", "Žiadny otvorený pull request v sledovaných repozitároch.", "Sledujte repozitáre na karte Repozitáre, aby ste tu videli ich problémy a pull requesty.", "GitHub sa nepodarilo opýtať ({error}). Skúste to neskôr.", "Koncept", "Schválené", "Požadované zmeny", "Vyžaduje sa kontrola", "autor {author}", "aktualizované {when}", "Komentáre: {n}", "Všetky repozitáre", "Otvorené: {n}",
    "Hviezdičky", "Najnovšie vydanie", "Zobraziť alebo skryť podrobnosti",
    "Zoradenie", "Najprv sledované", "Názov", "Hviezdičky", "Otvorené problémy", "Otvorené pull requesty",
    "Skúsiť znova",
    "Sledovať vybrané ({n})", "Vybrať {repo}",
    "Interval obnovenia (minúty)", "Ako často sa otvorené problémy a pull requesty načítavajú z GitHubu.",
    // My pull requests
    "Moje pull requesty", "Nemáte žiadny otvorený pull request.", "Kontroly prešli", "Kontroly zlyhali", "Kontroly prebiehajú",
    // Downloads: row counter + page total
    "Stiahnutia", "Stiahnutí spolu: {n}",
    "Skryť horný panel", "Lišta s názvom zmizne, karty zostanú; tlačidlo ponuky zostane tam, kde ho Home Assistant zobrazuje.",
    "Sledované", "Na sledovanie", "Neuložené zmeny", "Aktuálne", "Upozornenia", "Obnovovanie", "Panel", "Vzory názvov", "Iné",
    "Na vybavenie", "Nič na vybavenie v sledovaných repozitároch", "+ ďalších {n}",
    "Nie", "Pre všetkých", "Pre neadministrátorov",
    "Hviezdičky", "Forky", "Pozorovatelia", "Problémy", "Pull requesty", "Zlúčené PR", "Diskusie", "Stiahnutia", "Najnovšie vydanie", "Najnovší tag", "Posledný commit", "Najnovší problém", "Najnovší pull request", "Najnovšia diskusia", "Účet", "Sledovatelia", "Sleduje", "Verejné repozitáre", "Verejné gisty",
    "Kopírovať odkazy", "Odkazy skopírované",
  ],
  cs: [
    "GitHub", "Repozitáře", "Aktivita", "Nastavení", "Integrace GitHub", "Načítání…",
    "Integrace GitHub zatím není nastavena. Přidejte ji se svým účtem GitHub: tento panel přes ni sleduje vaše repozitáře.",
    "Přidat integraci GitHub",
    "Integrace GitHub není načtena ({state}): sledované repozitáře jsou uvedeny, sledování nových vyžaduje, aby byla načtena.",
    "Integrace GitHub nemohla vypsat vaše repozitáře (připojení nebo limit API GitHub). Zkuste to později.",
    "Sledované: {followed} · Nesledované: {offered}", "Hledat repozitář", "Sledovat vše ({n})", "Sledovat", "Přestat sledovat", "Sledováno",
    "Přestat sledovat {repo}? Jeho senzory a jejich historie budou odebrány z Home Assistant.", "Zrušit",
    "Aktualizace integrace GitHub…", "Sledované: {added} · Již nesledované: {removed}",
    "Integrace GitHub je nenabízí: {names}", "Chyba: {error}", "Žádný repozitář neodpovídá.", "Otevřít na GitHubu",
    "Nabízené repozitáře", "Vzory názvů oddělené čárkami, např. juju35/ha-*. Prázdné: všechny.",
    "Zahrnout repozitáře s hvězdičkou", "Kromě repozitářů vašeho účtu.",
    "Ignorovat archivované repozitáře", "Archivované repozitáře se nenabízejí. Sledované zůstávají v seznamu.",
    "Upozornit na nové problémy", "Upozornit na nové pull requesty", "Upozornit na nová vydání",
    "Oznámení Home Assistant pro každý nový problém nebo pull request sledovaných repozitářů.",
    "Uložit", "Uloženo.",
    "Problémy", "Pull requesty", "Obnovit", "Žádný otevřený problém ve sledovaných repozitářích.", "Žádný otevřený pull request ve sledovaných repozitářích.", "Sledujte repozitáře na kartě Repozitáře, abyste zde viděli jejich problémy a pull requesty.", "GitHub se nepodařilo dotázat ({error}). Zkuste to později.", "Koncept", "Schváleno", "Požadovány změny", "Vyžadována kontrola", "autor {author}", "aktualizováno {when}", "Komentáře: {n}", "Všechny repozitáře", "Otevřeno: {n}",
    "Hvězdičky", "Nejnovější vydání", "Zobrazit nebo skrýt podrobnosti",
    "Řazení", "Nejdřív sledované", "Název", "Hvězdičky", "Otevřené problémy", "Otevřené pull requesty",
    "Zkusit znovu",
    "Sledovat vybrané ({n})", "Vybrat {repo}",
    "Interval obnovení (minuty)", "Jak často se otevřené problémy a pull requesty načítají z GitHubu.",
    // My pull requests
    "Moje pull requesty", "Nemáte žádný otevřený pull request.", "Kontroly prošly", "Kontroly selhaly", "Kontroly probíhají",
    // Downloads: row counter + page total
    "Stažení", "Stažení celkem: {n}",
    "Skrýt horní lištu", "Lišta s názvem zmizí, karty zůstanou; tlačítko nabídky zůstane tam, kde ho Home Assistant zobrazuje.",
    "Sledované", "Ke sledování", "Neuložené změny", "Aktuální", "Oznámení", "Obnovování", "Panel", "Vzory názvů", "Jiné",
    "K vyřízení", "Nic k vyřízení ve sledovaných repozitářích", "+ dalších {n}",
    "Ne", "Pro všechny", "Pro neadministrátory",
    "Hvězdičky", "Forky", "Pozorovatelé", "Problémy", "Pull requesty", "Sloučené PR", "Diskuze", "Stažení", "Nejnovější vydání", "Nejnovější tag", "Poslední commit", "Nejnovější problém", "Nejnovější pull request", "Nejnovější diskuze", "Účet", "Sledující", "Sleduje", "Veřejné repozitáře", "Veřejné gisty",
    "Kopírovat odkazy", "Odkazy zkopírovány",
  ],
  sl: [
    "GitHub", "Repozitoriji", "Dejavnost", "Nastavitve", "Integracija GitHub", "Nalaganje…",
    "Integracija GitHub še ni nastavljena. Dodajte jo s svojim računom GitHub: ta plošča prek nje spremlja vaše repozitorije.",
    "Dodaj integracijo GitHub",
    "Integracija GitHub ni naložena ({state}): spremljani repozitoriji so navedeni, za spremljanje novih mora biti naložena.",
    "Integracija GitHub ni mogla izpisati vaših repozitorijev (povezava ali omejitev API-ja GitHub). Poskusite pozneje.",
    "Spremljani: {followed} · Nespremljani: {offered}", "Iskanje repozitorija", "Spremljaj vse ({n})", "Spremljaj", "Ne spremljaj več", "Spremljan",
    "Ne spremljati več {repo}? Njegovi senzorji in njihova zgodovina bodo odstranjeni iz Home Assistanta.", "Prekliči",
    "Posodabljanje integracije GitHub…", "Spremljani: {added} · Ne spremljajo se več: {removed}",
    "Integracija GitHub jih ne ponuja: {names}", "Napaka: {error}", "Noben repozitorij se ne ujema.", "Odpri na GitHubu",
    "Ponujeni repozitoriji", "Vzorci imen, ločeni z vejicami, npr. juju35/ha-*. Prazno: vsi.",
    "Vključi repozitorije z zvezdico", "Poleg repozitorijev vašega računa.",
    "Prezri arhivirane repozitorije", "Arhivirani repozitoriji niso ponujeni. Spremljani ostanejo na seznamu.",
    "Obvesti o novih težavah", "Obvesti o novih pull requestih", "Obvesti o novih izdajah",
    "Obvestilo Home Assistant za vsako novo težavo ali pull request spremljanih repozitorijev.",
    "Shrani", "Shranjeno.",
    "Težave", "Pull requesti", "Osveži", "V spremljanih repozitorijih ni odprtih težav.", "V spremljanih repozitorijih ni odprtih pull requestov.", "Spremljajte repozitorije na zavihku Repozitoriji, da tukaj vidite njihove težave in pull requeste.", "GitHuba ni bilo mogoče poizvedeti ({error}). Poskusite pozneje.", "Osnutek", "Odobreno", "Zahtevane spremembe", "Potreben pregled", "avtor {author}", "posodobljeno {when}", "Komentarji: {n}", "Vsi repozitoriji", "Odprto: {n}",
    "Zvezdice", "Najnovejša izdaja", "Prikaži ali skrij podrobnosti",
    "Razvrščanje", "Najprej spremljani", "Ime", "Zvezdice", "Odprte težave", "Odprti pull requesti",
    "Poskusi znova",
    "Spremljaj izbrane ({n})", "Izberi {repo}",
    "Interval osveževanja (minute)", "Kako pogosto se odprte težave in pull requesti pridobijo z GitHuba.",
    // My pull requests
    "Moji pull requesti", "Nimate odprtega pull requesta.", "Preverjanja uspešna", "Preverjanja neuspešna", "Preverjanja potekajo",
    // Downloads: row counter + page total
    "Prenosi", "Skupaj prenosov: {n}",
    "Skrij zgornjo vrstico", "Naslovna vrstica izgine, zavihki ostanejo; gumb menija ostane tam, kjer ga prikaže Home Assistant.",
    "Spremljani", "Za spremljanje", "Neshranjene spremembe", "Posodobljeno", "Obvestila", "Osveževanje", "Plošča", "Vzorci imen", "Drugo",
    "Za obravnavo", "Nič za obravnavo v spremljanih repozitorijih", "+ še {n}",
    "Ne", "Za vse", "Za neskrbnike",
    "Zvezdice", "Forki", "Opazovalci", "Težave", "Pull requesti", "Združeni PR", "Razprave", "Prenosi", "Najnovejša izdaja", "Najnovejša oznaka", "Zadnji commit", "Najnovejša težava", "Najnovejši pull request", "Najnovejša razprava", "Račun", "Sledilci", "Sledi", "Javni repozitoriji", "Javni gisti",
    "Kopiraj povezave", "Povezave kopirane",
  ],
  lv: [
    "GitHub", "Krātuves", "Aktivitāte", "Iestatījumi", "GitHub integrācija", "Ielādē…",
    "GitHub integrācija vēl nav iestatīta. Pievienojiet to ar savu GitHub kontu: šis panelis caur to seko jūsu krātuvēm.",
    "Pievienot GitHub integrāciju",
    "GitHub integrācija nav ielādēta ({state}): sekotās krātuves ir uzskaitītas, lai sekotu jaunām, tai jābūt ielādētai.",
    "GitHub integrācija nevarēja uzskaitīt jūsu krātuves (savienojums vai GitHub API ierobežojums). Mēģiniet vēlāk.",
    "Sekotas: {followed} · Nesekotas: {offered}", "Meklēt krātuvi", "Sekot visām ({n})", "Sekot", "Pārtraukt sekot", "Sekota",
    "Pārtraukt sekot {repo}? Tās sensori un to vēsture tiek noņemti no Home Assistant.", "Atcelt",
    "Atjaunina GitHub integrāciju…", "Sekotas: {added} · Vairs netiek sekotas: {removed}",
    "GitHub integrācija tās nepiedāvā: {names}", "Kļūda: {error}", "Neviena krātuve neatbilst.", "Atvērt GitHub",
    "Piedāvātās krātuves", "Nosaukumu šabloni, atdalīti ar komatiem, piem. juju35/ha-*. Tukšs: visas.",
    "Iekļaut ar zvaigzni atzīmētās krātuves", "Papildus jūsu konta krātuvēm.",
    "Ignorēt arhivētās krātuves", "Arhivētās krātuves netiek piedāvātas. Sekotās paliek sarakstā.",
    "Paziņot par jaunām problēmām", "Paziņot par jauniem pull pieprasījumiem", "Paziņot par jauniem laidieniem",
    "Home Assistant paziņojums par katru jaunu sekoto krātuvju problēmu vai pull pieprasījumu.",
    "Saglabāt", "Saglabāts.",
    "Problēmas", "Pull pieprasījumi", "Atsvaidzināt", "Sekotajās krātuvēs nav atvērtu problēmu.", "Sekotajās krātuvēs nav atvērtu pull pieprasījumu.", "Sekojiet krātuvēm cilnē Krātuves, lai šeit redzētu to problēmas un pull pieprasījumus.", "GitHub nevarēja vaicāt ({error}). Mēģiniet vēlāk.", "Melnraksts", "Apstiprināts", "Pieprasītas izmaiņas", "Nepieciešama pārskatīšana", "autors {author}", "atjaunināts {when}", "Komentāri: {n}", "Visas krātuves", "Atvērti: {n}",
    "Zvaigznes", "Jaunākais laidiens", "Rādīt vai paslēpt informāciju",
    "Kārtošana", "Vispirms sekotās", "Nosaukums", "Zvaigznes", "Atvērtās problēmas", "Atvērtie pull pieprasījumi",
    "Mēģināt vēlreiz",
    "Sekot atlasītajām ({n})", "Atlasīt {repo}",
    "Atsvaidzināšanas intervāls (minūtes)", "Cik bieži atvērtās problēmas un pull pieprasījumi tiek iegūti no GitHub.",
    // My pull requests
    "Mani pull pieprasījumi", "Jums nav neviena atvērta pull pieprasījuma.", "Pārbaudes nokārtotas", "Pārbaudes neizdevās", "Pārbaudes norisinās",
    // Downloads: row counter + page total
    "Lejupielādes", "Lejupielādes kopā: {n}",
    "Paslēpt augšējo joslu", "Virsraksta josla pazūd, cilnes paliek; izvēlnes poga paliek tur, kur to rāda Home Assistant.",
    "Sekotie", "Sekot", "Nesaglabātas izmaiņas", "Aktuāls", "Paziņojumi", "Atsvaidzināšana", "Panelis", "Nosaukumu paraugi", "Cits",
    "Jāapstrādā", "Sekotajos repozitorijos nav nekā, ko apstrādāt", "+ vēl {n}",
    "Nē", "Visiem", "Ne-administratoriem",
    "Zvaigznes", "Forki", "Vērotāji", "Problēmas", "Pull pieprasījumi", "Apvienotie PR", "Diskusijas", "Lejupielādes", "Jaunākais laidiens", "Jaunākā birka", "Pēdējais commit", "Jaunākā problēma", "Jaunākais pull pieprasījums", "Jaunākā diskusija", "Konts", "Sekotāji", "Seko", "Publiskās krātuves", "Publiskie gist",
    "Kopēt saites", "Saites nokopētas",
  ],
  el: [
    "GitHub", "Αποθετήρια", "Δραστηριότητα", "Ρυθμίσεις", "Ενσωμάτωση GitHub", "Φόρτωση…",
    "Η ενσωμάτωση GitHub δεν έχει ρυθμιστεί ακόμη. Προσθέστε τη με τον λογαριασμό σας GitHub: αυτός ο πίνακας παρακολουθεί τα αποθετήριά σας μέσω αυτής.",
    "Προσθήκη της ενσωμάτωσης GitHub",
    "Η ενσωμάτωση GitHub δεν έχει φορτωθεί ({state}): τα παρακολουθούμενα αποθετήρια εμφανίζονται, για νέα πρέπει να είναι φορτωμένη.",
    "Η ενσωμάτωση GitHub δεν μπόρεσε να εμφανίσει τα αποθετήριά σας (σύνδεση ή όριο του API του GitHub). Δοκιμάστε αργότερα.",
    "Παρακολουθούνται: {followed} · Δεν παρακολουθούνται: {offered}", "Αναζήτηση αποθετηρίου", "Παρακολούθηση όλων ({n})", "Παρακολούθηση", "Διακοπή παρακολούθησης", "Παρακολουθείται",
    "Διακοπή παρακολούθησης του {repo}; Οι αισθητήρες του και το ιστορικό τους αφαιρούνται από το Home Assistant.", "Ακύρωση",
    "Ενημέρωση της ενσωμάτωσης GitHub…", "Παρακολουθούνται: {added} · Δεν παρακολουθούνται πλέον: {removed}",
    "Δεν προτείνονται από την ενσωμάτωση GitHub: {names}", "Σφάλμα: {error}", "Κανένα αποθετήριο δεν ταιριάζει.", "Άνοιγμα στο GitHub",
    "Προτεινόμενα αποθετήρια", "Μοτίβα ονομάτων χωρισμένα με κόμματα, π.χ. juju35/ha-*. Κενό: όλα.",
    "Συμπερίληψη αποθετηρίων με αστέρι", "Εκτός από τα αποθετήρια του λογαριασμού σας.",
    "Παράβλεψη αρχειοθετημένων αποθετηρίων", "Τα αρχειοθετημένα αποθετήρια δεν προτείνονται. Όσα ακολουθείτε παραμένουν στη λίστα.",
    "Ειδοποίηση για νέα ζητήματα", "Ειδοποίηση για νέα pull requests", "Ειδοποίηση για νέες εκδόσεις",
    "Μια ειδοποίηση Home Assistant για κάθε νέο ζήτημα ή pull request των παρακολουθούμενων αποθετηρίων.",
    "Αποθήκευση", "Αποθηκεύτηκε.",
    "Ζητήματα", "Pull requests", "Ανανέωση", "Κανένα ανοιχτό ζήτημα στα παρακολουθούμενα αποθετήρια.", "Κανένα ανοιχτό pull request στα παρακολουθούμενα αποθετήρια.", "Παρακολουθήστε αποθετήρια στην καρτέλα Αποθετήρια για να βλέπετε εδώ τα ζητήματα και τα pull requests τους.", "Δεν ήταν δυνατή η επικοινωνία με το GitHub ({error}). Δοκιμάστε αργότερα.", "Πρόχειρο", "Εγκρίθηκε", "Ζητήθηκαν αλλαγές", "Απαιτείται έλεγχος", "από {author}", "ενημερώθηκε {when}", "Σχόλια: {n}", "Όλα τα αποθετήρια", "Ανοιχτά: {n}",
    "Αστέρια", "Τελευταία έκδοση", "Εμφάνιση ή απόκρυψη λεπτομερειών",
    "Ταξινόμηση", "Πρώτα τα παρακολουθούμενα", "Όνομα", "Αστέρια", "Ανοιχτά ζητήματα", "Ανοιχτά pull requests",
    "Δοκιμή ξανά",
    "Παρακολούθηση επιλεγμένων ({n})", "Επιλογή {repo}",
    "Διάστημα ανανέωσης (λεπτά)", "Πόσο συχνά ανακτώνται από το GitHub τα ανοιχτά ζητήματα και pull requests.",
    // My pull requests
    "Τα pull requests μου", "Δεν έχετε κανένα ανοιχτό pull request.", "Έλεγχοι επιτυχείς", "Έλεγχοι απέτυχαν", "Έλεγχοι σε εξέλιξη",
    // Downloads: row counter + page total
    "Λήψεις", "Σύνολο λήψεων: {n}",
    "Απόκρυψη της επάνω γραμμής", "Η γραμμή τίτλου φεύγει, οι καρτέλες μένουν· το κουμπί μενού μένει όπου το δείχνει το Home Assistant.",
    "Παρακολουθούμενα", "Προς παρακολούθηση", "Μη αποθηκευμένες αλλαγές", "Ενημερωμένο", "Ειδοποιήσεις", "Ανανέωση", "Πίνακας", "Μοτίβα ονομάτων", "Άλλο",
    "Προς χειρισμό", "Τίποτα προς χειρισμό στα αποθετήρια που ακολουθείτε", "+ {n} ακόμη",
    "Όχι", "Για όλους", "Για μη διαχειριστές",
    "Αστέρια", "Forks", "Παρατηρητές", "Ζητήματα", "Pull requests", "Συγχωνευμένα PR", "Συζητήσεις", "Λήψεις", "Τελευταία έκδοση", "Τελευταία ετικέτα", "Τελευταίο commit", "Τελευταίο ζήτημα", "Τελευταίο pull request", "Τελευταία συζήτηση", "Λογαριασμός", "Ακόλουθοι", "Ακολουθεί", "Δημόσια αποθετήρια", "Δημόσια gists",
    "Αντιγραφή συνδέσμων", "Οι σύνδεσμοι αντιγράφηκαν",
  ],
};

const GITHUB_PANEL_STRINGS = Object.fromEntries(
  Object.entries(GITHUB_PANEL_TRANSLATIONS).map(([l, list]) => [l, Object.fromEntries(GITHUB_PANEL_KEYS.map((k, i) => [k, list[i]]))]),
);

// The top bar choice: off, all (hidden for everyone) or non_admin; a switch saved by an older version: on, for everyone
const githubPanelHideMode = (value) =>
  value === true ? "all" : value === "all" || value === "non_admin" ? value : "off";

const githubPanelEsc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A selector finding again, after a redraw, the control that had the focus (its tag, first class and data-*), or null.
const githubPanelFocusKey = (el) => {
  const q = (v) => String(v).replace(/["\\]/g, "\\$&");
  const attrs = [...(el.attributes || [])].filter((a) => a.name.startsWith("data-")).map((a) => `[${a.name}="${q(a.value)}"]`);
  const cls = el.classList?.[0] ? `[class~="${q(el.classList[0])}"]` : "";
  return attrs.length || cls ? `${el.localName}${cls}${attrs.join("")}` : null;
};

// Redraws `host` with `draw` keeping the page where it was scrolled and the focus on the same control: Safari (no
// scroll anchoring) sent the page back to the top when a tab was rebuilt under the pointer. Every scrolled ancestor,
// across the shadow roots up to the document, gets its position back.
const githubPanelKeepView = (host, draw) => {
  const scrolled = [];
  for (let n = host; n; n = n.parentNode || n.host) if (n.nodeType === 1 && n.scrollTop > 0) scrolled.push([n, n.scrollTop]);
  const root = host.getRootNode?.();
  const active = root?.activeElement;
  const key = active && host.contains?.(active) && active.type !== "search" ? githubPanelFocusKey(active) : null;
  draw();
  if (key) host.querySelector?.(key)?.focus?.({ preventScroll: true });
  if (!scrolled.length) return;
  for (const [n, top] of scrolled) if (n.scrollTop !== top) n.scrollTop = top;
  // A jump back to the top after the redraw (the browser settling the layout) is undone too; a scroll by the user is not
  if (typeof requestAnimationFrame === "function")
    requestAnimationFrame(() => {
      for (const [n, top] of scrolled) if (n.scrollTop === 0) n.scrollTop = top;
    });
};

// mdi paths used by the panel (ha-icon is avoided so that the screenshots and tests need no frontend)
const GITHUB_PANEL_ICONS = {
  code: "M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z",
  open: "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z",
  cog: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  copy: "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",
  issue: "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,9.5A2.5,2.5 0 0,0 9.5,12A2.5,2.5 0 0,0 12,14.5A2.5,2.5 0 0,0 14.5,12A2.5,2.5 0 0,0 12,9.5Z",
  pr: "M6,3A3,3 0 0,1 9,6C9,7.31 8.17,8.42 7,8.83V15.17C8.17,15.58 9,16.69 9,18A3,3 0 0,1 6,21A3,3 0 0,1 3,18C3,16.69 3.83,15.58 5,15.17V8.83C3.83,8.42 3,7.31 3,6A3,3 0 0,1 6,3M6,5A1,1 0 0,0 5,6A1,1 0 0,0 6,7A1,1 0 0,0 7,6A1,1 0 0,0 6,5M6,17A1,1 0 0,0 5,18A1,1 0 0,0 6,19A1,1 0 0,0 7,18A1,1 0 0,0 6,17M21,18A3,3 0 0,1 18,21A3,3 0 0,1 15,18C15,16.69 15.83,15.58 17,15.17V7H15V10.25L10.75,6L15,1.75V5H17A2,2 0 0,1 19,7V15.17C20.17,15.58 21,16.69 21,18M18,17A1,1 0 0,0 17,18A1,1 0 0,0 18,19A1,1 0 0,0 19,18A1,1 0 0,0 18,17Z",
  chevron: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
  star: "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z",
  tag: "M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.44 21.77,11.94 21.41,11.58Z",
  comment: "M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z",
  refresh: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
  download: "M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z",
  search: "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  // The unfolded repository's counters and latest activity, and the account
  fork: "M6,2A3,3 0 0,1 9,5C9,6.28 8.19,7.38 7.06,7.81C7.15,8.27 7.39,8.83 8,9.63C9,10.92 11,12.83 12,14.17C13,12.83 15,10.92 16,9.63C16.61,8.83 16.85,8.27 16.94,7.81C15.81,7.38 15,6.28 15,5A3,3 0 0,1 18,2A3,3 0 0,1 21,5C21,6.32 20.14,7.45 18.95,7.85C18.87,8.37 18.64,9 18,9.83C17,11.17 15,13.08 14,14.38C13.39,15.17 13.15,15.73 13.06,16.19C14.19,16.62 15,17.72 15,19A3,3 0 0,1 12,22A3,3 0 0,1 9,19C9,17.72 9.81,16.62 10.94,16.19C10.85,15.73 10.61,15.17 10,14.38C9,13.08 7,11.17 6,9.83C5.36,9 5.13,8.37 5.05,7.85C3.86,7.45 3,6.32 3,5A3,3 0 0,1 6,2M6,4A1,1 0 0,0 5,5A1,1 0 0,0 6,6A1,1 0 0,0 7,5A1,1 0 0,0 6,4M18,4A1,1 0 0,0 17,5A1,1 0 0,0 18,6A1,1 0 0,0 19,5A1,1 0 0,0 18,4M12,18A1,1 0 0,0 11,19A1,1 0 0,0 12,20A1,1 0 0,0 13,19A1,1 0 0,0 12,18Z",
  eye: "M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z",
  merge: "M7,3A3,3 0 0,1 10,6C10,7.29 9.19,8.39 8.04,8.81C8.58,13.81 13.08,14.77 15.19,14.96C15.61,13.81 16.71,13 18,13A3,3 0 0,1 21,16A3,3 0 0,1 18,19C16.69,19 15.57,18.16 15.16,17C10.91,16.8 9.44,15.19 8,13.39V15.17C9.17,15.58 10,16.69 10,18A3,3 0 0,1 7,21A3,3 0 0,1 4,18C4,16.69 4.83,15.58 6,15.17V8.83C4.83,8.42 4,7.31 4,6A3,3 0 0,1 7,3M7,5A1,1 0 0,0 6,6A1,1 0 0,0 7,7A1,1 0 0,0 8,6A1,1 0 0,0 7,5M7,17A1,1 0 0,0 6,18A1,1 0 0,0 7,19A1,1 0 0,0 8,18A1,1 0 0,0 7,17M18,15A1,1 0 0,0 17,16A1,1 0 0,0 18,17A1,1 0 0,0 19,16A1,1 0 0,0 18,15Z",
  forum: "M17,12V3A1,1 0 0,0 16,2H3A1,1 0 0,0 2,3V17L6,13H16A1,1 0 0,0 17,12M21,6H19V15H6V17A1,1 0 0,0 7,18H18L22,22V7A1,1 0 0,0 21,6Z",
  release: "M12,2L3,7V17L12,22L21,17V7L12,2M12,4.31L18.47,7.9L12,11.5L5.53,7.9L12,4.31M5,9.6L11,12.94V19.6L5,16.27V9.6M13,19.6V12.94L19,9.6V16.27L13,19.6Z",
  commit: "M17,12C17,14.42 15.28,16.44 13,16.9V21H11V16.9C8.72,16.44 7,14.42 7,12C7,9.58 8.72,7.56 11,7.1V3H13V7.1C15.28,7.56 17,9.58 17,12M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z",
  group: "M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z",
  account: "M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z",
};
// The tabs' illustrated banner (90 px, as the headers of the ha-* cards): a desk with a screen showing a branch
// graph (the latest commit breathing), a mug and a plant on a parquet strip; night colours with a dark theme.
const GITHUB_PANEL_SCENE = `<svg class="scene" viewBox="0 0 360 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
<rect class="s-desk" x="90" y="56" width="200" height="5" rx="1"/><rect class="s-deskd" x="98" y="61" width="5" height="19"/><rect class="s-deskd" x="277" y="61" width="5" height="19"/>
<rect class="s-mon" x="140" y="8" width="96" height="44" rx="4"/><rect class="s-scr" x="144" y="12" width="88" height="34" rx="2"/><rect class="s-mon" x="183" y="52" width="10" height="4"/>
<path d="M152 29H222" stroke="#8957e5" stroke-width="2.2" fill="none"/><path d="M168 29C174 29 174 20 180 20H200C206 20 206 29 212 29" stroke="#43a047" stroke-width="2.2" fill="none"/>
<circle cx="152" cy="29" r="3.2" fill="#8957e5"/><circle cx="168" cy="29" r="3.2" fill="#8957e5"/><circle cx="186" cy="20" r="3.2" fill="#43a047"/><circle cx="198" cy="20" r="3.2" fill="#43a047"/><circle cx="212" cy="29" r="3.2" fill="#8957e5"/>
<circle class="s-pulse" cx="222" cy="29" r="3.6" fill="none" stroke="#8957e5" stroke-width="2"/>
<rect class="s-mug" x="250" y="44" width="12" height="12" rx="2" stroke-width="1.4"/><path class="s-handle" d="M262 47h3a3 3 0 0 1 0 6h-3" fill="none" stroke-width="1.4"/>
<rect class="s-pot" x="310" y="60" width="16" height="20" rx="2"/><path class="s-leaf" d="M318 60C310 48 307 39 310 30C316 39 318 48 318 60ZM318 60C323 47 329 42 335 40C331 49 326 56 318 60Z"/>
</svg><div class="ground" aria-hidden="true"></div>`;

// The unfolded repository's counters (sensor key, label key, icon, colour) and latest activity (sensor key, icon),
// and the account's counters, as the GitHub Card shows them.
const GITHUB_PANEL_REPO_STATS = [
  ["stargazers_count", "d_stars", "star", "star"],
  ["forks_count", "d_forks", "fork", "blue"],
  ["subscribers_count", "d_watchers", "eye", "blue"],
  ["issues_count", "d_issues", "issue", "green"],
  ["pulls_count", "d_pulls", "pr", "green"],
  ["merged_pulls_count", "d_merged_pulls", "merge", "purple"],
  ["discussions_count", "d_discussions", "forum", "blue"],
  ["latest_release_downloads", "d_downloads", "download", "blue"],
];
const GITHUB_PANEL_LATEST = [
  ["latest_release", "release"],
  ["latest_tag", "tag"],
  ["latest_commit", "commit"],
  ["latest_pull_request", "pr"],
  ["latest_issue", "issue"],
  ["latest_discussion", "forum"],
];
const GITHUB_PANEL_USER_STATS = [
  ["followers", "d_followers", "group", "blue"],
  ["following", "d_following", "account", "blue"],
  ["public_repos", "d_public_repos", "code", "blue"],
  ["public_gists", "d_public_gists", "code", "blue"],
];

const githubPanelIcon = (name) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${GITHUB_PANEL_ICONS[name]}"/></svg>`;

// ── Folded top bar ──
// As on the dashboards' illustrated headers (ha-dashboard-header): past 24 px of scroll the 90 px top bar and the
// text tabs fold into one 64 px bar — the panel's icon, title and line, the tabs as round icon pills, the status pill
// and the round buttons — sticky at the top; back under 8 px they unfold. The content does not move: the folded bar
// keeps the room of the top bar and tabs under it. On a narrow panel the pills get a row of their own under the bar,
// the status pill turns to a dot and only the first round button is kept. The folded bar mirrors the top bar and the
// tabs (their text, counts, active tab and buttons): a click on a pill or a button clicks the original.
const githubPanel_FOLD_CSS = `
  .pf-sense { position:relative; height:0; }
  .pf-sense, .pf-fold, .pf-top, .pf-tabs { overflow-anchor:none; }
  .pf-sense > i { position:absolute; left:0; width:1px; height:1px; pointer-events:none; visibility:hidden; }
  .pf-sense > .pf-s1 { top:24px; } .pf-sense > .pf-s2 { top:8px; }
  .pf-fold { display:none; position:sticky; top:0; z-index:6; container-type:inline-size; color:var(--primary-text-color);
             background:var(--card-background-color, #fff); border-bottom:1px solid var(--divider-color, rgba(0,0,0,.12));
             box-shadow:0 2px 8px rgba(0,0,0,.08); }
  :host([pf-folded]) .pf-fold { display:block; }
  .pf-fold.pf-measure { display:block; position:absolute; visibility:hidden; }
  :host([pf-folded]) .pf-top, :host([pf-folded]) .pf-tabs { display:none !important; }
  .pf-bar { display:flex; flex-wrap:wrap; align-items:center; column-gap:12px; min-height:64px; padding:0 16px; box-sizing:border-box; }
  .pf-menu { flex:none; display:flex; margin-inline:-8px -4px; color:var(--primary-text-color); }
  .pf-menu[hidden] { display:none; }
  .pf-ic { flex:none; width:40px; height:40px; border-radius:50%; display:grid; place-items:center; color:var(--pf-accent);
           background:color-mix(in srgb, currentColor 14%, transparent); }
  .pf-ic svg, .pf-ic img { width:22px; height:22px; fill:currentColor; }
  .pf-ic ha-icon, .pf-ic ha-svg-icon { --mdc-icon-size:22px; }
  .pf-names { display:flex; flex-direction:column; flex:0 1 auto; min-width:0; max-width:260px; }
  .pf-t { font-size:17px; font-weight:700; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pf-s { font-size:12.5px; line-height:1.3; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pf-s:empty { display:none; }
  .pf-pills { display:flex; gap:6px; flex:1 1 0; min-width:0; overflow-x:auto; scrollbar-width:none; padding:8px 6px 6px 2px; }
  .pf-pills::-webkit-scrollbar { display:none; }
  .pf-pill { all:unset; position:relative; flex:none; width:48px; height:40px; box-sizing:border-box; border-radius:999px; cursor:pointer;
             display:grid; place-items:center; color:var(--primary-text-color); border:1px solid var(--divider-color, rgba(0,0,0,.12)); }
  .pf-pill:hover { background:color-mix(in srgb, currentColor 6%, transparent); }
  .pf-pill[aria-selected="true"] { color:var(--pf-accent); border:1.5px solid var(--pf-accent); background:color-mix(in srgb, var(--pf-accent) 14%, transparent); }
  .pf-pill:focus-visible { outline:2px solid var(--pf-accent); outline-offset:2px; }
  .pf-pill svg { width:20px; height:20px; fill:currentColor; flex:none; }
  .pf-pill ha-icon { --mdc-icon-size:20px; display:flex; }
  .pf-pill .pf-l { font-size:14px; font-weight:700; }
  .pf-pill b { position:absolute; top:-5px; right:-5px; min-width:18px; height:18px; padding:0 4px; box-sizing:border-box; border-radius:999px;
               font-size:11px; font-weight:700; line-height:14px; text-align:center; color:#fff; background:var(--pf-accent);
               border:2px solid var(--card-background-color, #fff); }
  .pf-end { display:flex; align-items:center; gap:8px; flex:0 1 auto; min-width:0; margin-inline-start:auto; }
  .pf-end > :not(.pf-stat):not(.pf-acts) { min-width:0; max-width:220px; }
  .pf-stat { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; font-size:12px; font-weight:600;
             white-space:nowrap; color:var(--pf-c); background:color-mix(in srgb, var(--pf-c) 14%, transparent); }
  .pf-stat > i { width:8px; height:8px; border-radius:50%; background:currentColor; flex:none; }
  .pf-stat:empty, .pf-stat[hidden] { display:none; }
  .pf-acts { display:flex; gap:8px; }
  .pf-acts > * { all:unset; box-sizing:border-box; cursor:pointer; width:40px; height:40px; border-radius:50%; display:grid; place-items:center;
                 color:var(--primary-text-color); border:1px solid var(--divider-color, rgba(0,0,0,.12)); }
  .pf-acts > *:hover { background:color-mix(in srgb, currentColor 6%, transparent); }
  .pf-acts > *:focus-visible { outline:2px solid var(--pf-accent); outline-offset:2px; }
  .pf-acts > *[disabled] { opacity:.6; cursor:default; }
  .pf-acts svg { width:20px; height:20px; fill:currentColor; }
  .pf-acts > .on { color:var(--pf-on, var(--pf-accent)); border:1.5px solid currentColor; background:color-mix(in srgb, currentColor 14%, transparent); }
  .pf-acts ha-icon { --mdc-icon-size:20px; display:flex; }
  .pf-acts .spin svg, .pf-acts .spinning svg { animation:pf-spin 1s linear infinite; }
  @keyframes pf-spin { to { transform:rotate(360deg); } }
  .pf-extra:empty { display:none; }
  .pf-subs { position:absolute; left:0; right:0; top:100%; display:flex; gap:4px; padding:0 12px; overflow-x:auto; scrollbar-width:none;
             background:var(--card-background-color, #fff); border-bottom:1px solid var(--divider-color, rgba(0,0,0,.12));
             box-shadow:0 2px 8px rgba(0,0,0,.08); }
  .pf-subs[hidden] { display:none; }
  .pf-subs::-webkit-scrollbar { display:none; }
  .pf-sub { all:unset; flex:none; display:inline-flex; align-items:center; gap:6px; padding:9px 10px 7px; cursor:pointer; font-size:13px;
            font-weight:500; color:var(--secondary-text-color); border-bottom:2px solid transparent; white-space:nowrap; --mdc-icon-size:18px; }
  .pf-sub:hover { color:var(--primary-text-color); }
  .pf-sub[aria-selected="true"] { color:var(--primary-text-color); border-bottom-color:var(--pf-accent); }
  .pf-sub[aria-selected="true"] ha-icon { color:var(--pf-accent); }
  .pf-sub:focus-visible { outline:2px solid var(--pf-accent); outline-offset:-2px; }
  @container (max-width: 600px) {
    .pf-bar { min-height:0; padding:12px 12px 0 16px; column-gap:10px; row-gap:2px; }
    .pf-names { flex:1 1 0; max-width:none; }
    .pf-t { font-size:17px; }
    .pf-pills { order:9; flex:1 0 100%; margin:0 -12px 0 -16px; padding:6px 12px 10px; }
    .pf-stat { width:26px; height:26px; padding:0; justify-content:center; }
    .pf-stat > span { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
    .pf-acts > *:not(:first-child) { display:none; }
    .pf-end > :not(.pf-stat):not(.pf-acts) { max-width:120px; }
    .pf-amenu .pf-acts > *, .pf-amenu .pf-acts > *:not(:first-child) { display:none; }
    .pf-amenu .pf-acts > .on { display:grid; position:relative; }
    .pf-amenu .pf-acts > .on::after { content:""; position:absolute; right:-3px; bottom:-3px; width:14px; height:14px; border-radius:50%;
      background:var(--card-background-color, #fff) no-repeat center / 12px
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23888' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      box-shadow:0 0 0 1px var(--divider-color, rgba(0,0,0,.12)); }
    .pf-amenu.pf-open .pf-acts { position:absolute; z-index:3; right:8px; top:8px; flex-direction:column; padding:6px; border-radius:26px;
      background:var(--card-background-color, #fff); box-shadow:0 6px 18px rgba(0,0,0,.18); }
    .pf-amenu.pf-open .pf-acts > * { display:grid; }
    .pf-amenu.pf-open .pf-acts > .on::after { display:none; }
  }
`;

/**
 * Folds the panel's top bar on scroll. `o`: `top` and `tabs` (the top bar and the tab row), `tab` (a tab, in the
 * row), `key` (a tab's id, from the button), `icons` (id → SVG path), `badge` (a tab's count, in it), `name`, `sub`,
 * `icon`, `status` (in the top bar), `acts` (its round buttons), `accent` (CSS colour), `extra` (an element shown
 * under the bar when folded, such as a sub-tab row: moved there while folded), `side` (an element moved before the
 * status pill while folded, such as an account picker), `subtab` (the sub-tabs of the tab shown, in the page:
 * mirrored in a row under the folded bar), `mount` (the node the folded bar goes before, when not the top bar), `menu` (() => ({ hass, narrow,
 * show })) for Home Assistant's menu button, `css` (the panel's own rules while folded; the folded bar's height is
 * `--pf-h` on the panel), `actsMenu` (narrow: only the active button `.on`, which opens the others, such as alarm
 * modes), `folded` (start folded: the page was drawn again while folded), `badgeColors` (the counts take the colours of the tabs' own badges), `skip` (() => true while the top bar must not fold). Returns { sync, detach }, or null when the panel has no top bar.
 */
function githubPanelFold(host, o) {
  const root = host.shadowRoot;
  const q = (sel) => (sel ? root?.querySelector?.(sel) : null);
  const top = q(o.top);
  const tabs = q(o.tabs);
  host.removeAttribute?.("pf-folded");
  if (!root || !top || !tabs || typeof root.querySelector !== "function") return null;
  if (!root.getElementById?.("pf-style")) {
    const style = document.createElement("style");
    style.id = "pf-style";
    style.textContent = githubPanel_FOLD_CSS + (o.css || "");
    root.appendChild(style);
  }
  top.classList.add("pf-top");
  tabs.classList.add("pf-tabs");
  const sense = document.createElement("div");
  sense.className = "pf-sense";
  sense.setAttribute("aria-hidden", "true");
  sense.innerHTML = '<i class="pf-s1"></i><i class="pf-s2"></i>';
  const fold = document.createElement("div");
  fold.className = "pf-fold";
  fold.style.setProperty("--pf-accent", o.accent);
  if (o.actsMenu) fold.classList.add("pf-amenu");
  fold.innerHTML = `<div class="pf-bar"><span class="pf-menu" hidden></span><span class="pf-ic" aria-hidden="true"></span>
    <div class="pf-names"><span class="pf-t"></span><span class="pf-s"></span></div>
    <div class="pf-pills" role="tablist"></div>
    <div class="pf-end"><span class="pf-stat" role="status"></span><div class="pf-acts"></div></div></div><div class="pf-extra"></div><div class="pf-subs" role="tablist" hidden></div>`;
  const at = o.mount || top;
  at.parentNode.insertBefore(sense, at);
  at.parentNode.insertBefore(fold, at);
  const el = (c) => fold.querySelector(c);
  // Home Assistant's menu button, in a shadow root of its own: the panel's own look-ups of its menu button never
  // find this one
  const menuBtn = document.createElement("ha-menu-button");
  el(".pf-menu").attachShadow?.({ mode: "open" })?.append(menuBtn);
  // A copy keeps the icons of its ha-icon elements, which panels often set as a property (not copied by cloneNode)
  const copyIcons = (from, to) => {
    const a = from.matches?.("ha-icon") ? [from] : [...from.querySelectorAll("ha-icon")];
    const b = to.matches?.("ha-icon") ? [to] : [...to.querySelectorAll("ha-icon")];
    a.forEach((n, i) => {
      const icon = n.icon || n.getAttribute("icon");
      if (b[i] && icon) b[i].setAttribute("icon", icon);
    });
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  let folded = false;
  let queued = false;
  let extraHome = null;
  let sideHome = null;

  const tabButtons = () => [...tabs.querySelectorAll(o.tab)];
  const tabLabel = (b) => {
    const clone = b.cloneNode(true);
    for (const n of clone.querySelectorAll?.(`${o.badge || ".badge"}, ha-menu-button, svg`) || []) n.remove();
    return (b.getAttribute("aria-label") || clone.textContent || "").trim();
  };
  const isActive = (b) => b.classList.contains("active") || b.getAttribute("aria-selected") === "true";

  const sync = () => {
    queued = false;
    if (!folded) return;
    const iconBox = q(o.icon);
    const icon = iconBox?.querySelector("svg, ha-icon, ha-svg-icon, img");
    const iconCopy = icon?.cloneNode(true);
    if (iconCopy) copyIcons(icon, iconCopy);
    el(".pf-ic").replaceChildren(...(iconCopy ? [iconCopy] : []));
    // The icon keeps the colour of its state, as in the top bar
    el(".pf-ic").style.color = iconBox && !o.iconAccent ? getComputedStyle(iconBox).color : "";
    el(".pf-t").textContent = (q(o.name)?.textContent || "").trim();
    el(".pf-s").textContent = (q(o.sub)?.textContent || "").trim();
    const st = q(o.status);
    const stat = el(".pf-stat");
    const text = (st?.textContent || "").trim();
    stat.hidden = !text;
    if (text) {
      stat.style.setProperty("--pf-c", getComputedStyle(st).color || "var(--pf-accent)");
      stat.setAttribute("aria-label", text);
      stat.innerHTML = `<i></i><span>${esc(text)}</span>`;
    }
    const focused = root.activeElement?.closest?.(".pf-pill")?.dataset.i;
    const shown = tabs.hidden ? [] : tabButtons();
    el(".pf-pills").innerHTML = (shown.length > 1 ? shown : [])
      .map((b, i) => {
        const id = o.key(b);
        const label = tabLabel(b);
        const badgeEl = b.querySelector(o.badge || ".badge");
        const count = (badgeEl?.textContent || "").trim();
        // The count in the colour of its tab's own badge (its tone), where the panel colours them
        let tone = "";
        if (count && o.badgeColors) {
          const cs = getComputedStyle(badgeEl);
          tone = ` style="background:${cs.backgroundColor};color:${cs.color}"`;
        }
        const path = o.icons[id];
        const own = path ? null : b.querySelector("svg, ha-icon");
        const ownIcon = own?.localName === "ha-icon" ? own.icon || own.getAttribute("icon") : null;
        const glyph = !path
          ? own
            ? ownIcon
              ? `<ha-icon icon="${esc(ownIcon)}" aria-hidden="true"></ha-icon>`
              : own.outerHTML
            : `<span class="pf-l" aria-hidden="true">${esc(label.slice(0, 1))}</span>`
          : path.startsWith("mdi:")
            ? `<ha-icon icon="${esc(path)}" aria-hidden="true"></ha-icon>`
            : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
        const on = isActive(b);
        return `<button class="pf-pill" role="tab" data-i="${i}" aria-selected="${on}" tabindex="${on ? 0 : -1}" title="${esc(label)}" aria-label="${esc(count ? `${label} (${count})` : label)}">${glyph}${count ? `<b aria-hidden="true"${tone}>${esc(count)}</b>` : ""}</button>`;
      })
      .join("");
    if (focused !== undefined) el(`.pf-pill[data-i="${focused}"]`)?.focus({ preventScroll: true });
    // The active pill in sight in a scrolling row, without scrolling the page
    const row = el(".pf-pills");
    const act = el(".pf-pill[aria-selected=true]");
    if (act && (act.offsetLeft < row.scrollLeft || act.offsetLeft + act.offsetWidth > row.scrollLeft + row.clientWidth)) {
      row.scrollLeft = Math.max(0, act.offsetLeft - 16);
    }
    // The sub-tabs of the tab shown (in the page, under the top bar), mirrored in a row under the folded bar
    const subs = o.subtab ? [...root.querySelectorAll(o.subtab)].filter((b) => !fold.contains(b)) : [];
    const subRow = el(".pf-subs");
    subRow.hidden = subs.length < 2;
    subRow.innerHTML = subs.length < 2 ? "" : subs
      .map((b, i) => {
        const on = isActive(b);
        const hi = b.querySelector("ha-icon");
        const ic = hi && (hi.icon || hi.getAttribute("icon"));
        return `<button class="pf-sub" role="tab" data-s="${i}" aria-selected="${on}" tabindex="${on ? 0 : -1}">${ic ? `<ha-icon icon="${esc(ic)}" aria-hidden="true"></ha-icon>` : ""}${esc(tabLabel(b))}</button>`;
      })
      .join("");
    subRow.onclick = (ev) => {
      const sb = ev.target.closest?.(".pf-sub");
      if (sb) subs[Number(sb.dataset.s)]?.click();
    };
    const acts = el(".pf-acts");
    acts.textContent = "";
    for (const a of o.acts ? root.querySelectorAll(o.acts) : []) {
      if (a.offsetParent === null && !top.contains(a)) continue;
      const c = a.cloneNode(true);
      copyIcons(a, c);
      c.removeAttribute("id");
      // An active button (`.on`) keeps the colour of its state
      if (c.classList.contains("on")) c.style.setProperty("--pf-on", getComputedStyle(a).color);
      if (c.tagName !== "A") {
        // The panel's own click handlers see the original only (its data-* stay off the copy)
        for (const n of [c, ...c.querySelectorAll("*")]) for (const at of [...n.attributes]) if (at.name.startsWith("data-")) n.removeAttribute(at.name);
        c.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          // Narrow, with `actsMenu`: the active button opens the list of the others first
          if (o.actsMenu && fold.clientWidth <= 600 && (!fold.classList.contains("pf-open") || c.classList.contains("on"))) {
            fold.classList.toggle("pf-open");
            return;
          }
          fold.classList.remove("pf-open");
          a.click();
        });
      }
      acts.appendChild(c);
    }
    const m = o.menu?.();
    el(".pf-menu").hidden = !m?.show;
    if (m) {
      menuBtn.hass = m.hass;
      menuBtn.narrow = m.narrow;
    }
  };
  const queue = () => {
    if (queued || !folded) return;
    queued = true;
    requestAnimationFrame(sync);
  };

  const setFolded = (v) => {
    if (v === folded) return;
    if (v) {
      const t = top.getBoundingClientRect();
      const b = tabs.getBoundingClientRect();
      if (!t.height || o.skip?.()) return; // top bar hidden (Settings): the tabs alone stay sticky
      const extra = q(o.extra);
      // The room of the top bar and the tabs (and an extra row), by their heights: the tabs may be stuck at the top
      // already (a jump down the page), where their position says nothing of the room they take in the page
      const room = t.height + b.height + (extra ? extra.getBoundingClientRect().height : 0);
      folded = true;
      sync();
      if (extra) {
        extraHome = [extra.parentNode, extra.nextSibling];
        el(".pf-extra").appendChild(extra);
      }
      const side = q(o.side);
      if (side) {
        sideHome = [side.parentNode, side.nextSibling];
        el(".pf-end").prepend(side);
      }
      // Measured out of the flow first, so that the content never moves (nor the browser's scroll anchoring with it)
      fold.style.width = `${t.width}px`;
      fold.classList.add("pf-measure");
      const h = fold.offsetHeight;
      fold.classList.remove("pf-measure");
      fold.style.width = "";
      fold.style.marginBottom = `${Math.round(room - h)}px`;
      host.style.setProperty("--pf-h", `${h}px`);
      host.setAttribute("pf-folded", "");
    } else {
      folded = false;
      const extra = el(".pf-extra").firstElementChild;
      if (extra && extraHome) extraHome[0].insertBefore(extra, extraHome[1] && extraHome[1].parentNode === extraHome[0] ? extraHome[1] : null);
      extraHome = null;
      const side = sideHome && el(".pf-end").firstElementChild;
      if (side && !side.matches(".pf-stat")) sideHome[0].insertBefore(side, sideHome[1] && sideHome[1].parentNode === sideHome[0] ? sideHome[1] : null);
      sideHome = null;
      host.removeAttribute("pf-folded");
      fold.style.marginBottom = "";
    }
  };

  el(".pf-pills").addEventListener("click", (ev) => {
    const p = ev.target.closest?.(".pf-pill");
    if (p) tabButtons()[Number(p.dataset.i)]?.click();
  });
  el(".pf-pills").addEventListener("keydown", (ev) => {
    const step = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
    const p = ev.target.closest?.(".pf-pill");
    if (!step || !p) return;
    ev.preventDefault();
    const all = [...el(".pf-pills").children];
    all[(Number(p.dataset.i) + step + all.length) % all.length]?.focus();
  });

  // The list of buttons opened (narrow, `actsMenu`) closes at a click elsewhere
  const closeMenu = (ev) => {
    if (fold.classList.contains("pf-open") && !ev.composedPath().includes(el(".pf-acts"))) fold.classList.remove("pf-open");
  };
  if (o.actsMenu) root.addEventListener("click", closeMenu, true);
  let io = null;
  if (typeof IntersectionObserver === "function") {
    const [s1, s2] = sense.children;
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const above = !e.isIntersecting && e.boundingClientRect.top < (e.rootBounds?.top ?? 0);
        if (e.target === s1 && above) setFolded(true);
        if (e.target === s2 && e.isIntersecting) setFolded(false);
      }
    });
    io.observe(s1);
    io.observe(s2);
  }
  const mo = typeof MutationObserver === "function" ? new MutationObserver(queue) : null;
  mo?.observe(top, { subtree: true, childList: true, characterData: true, attributes: true });
  mo?.observe(tabs, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "aria-selected", "hidden"] });
  // Drawn again while folded (a panel that rewrites its page): folded straight away, without a frame unfolded
  if (o.folded) setFolded(true);
  return {
    sync: queue,
    detach() {
      root.removeEventListener?.("click", closeMenu, true);
      io?.disconnect();
      mo?.disconnect();
      setFolded(false);
      sense.remove();
      fold.remove();
      host.removeAttribute("pf-folded");
    },
  };
}
// ── End of the folded top bar ──

class GitHubPanel extends HTMLElement {
  static STYLE = `
    :host { display:block; min-height:100%; background:var(--primary-background-color); color:var(--primary-text-color);
            --gh-accent:#8957e5; --tone-good:var(--success-color, #43a047); --tone-warn:var(--warning-color, #ffa600); --tone-bad:var(--error-color, #db4437); }
    .i { width:18px; height:18px; fill:currentColor; flex:none; }
    /* The top bar: the desk banner across the page (title, status, Refresh / GitHub / settings in its corner), as
       on the ENT ONE panel; the tabs under it, on the page background, sticky */
    .topbar .banner { height:90px; }
    .topbar .bhead { padding:0 8px; right:calc(min(360px, 44%) + 150px); }
    .topbar .bname { font-size:20px; }
    .topbar .hmenu { flex:none; color:inherit; }
    .topbar .scene { right:150px; }
    .hacts { position:absolute; z-index:2; top:calc((100% - 10px) / 2 - 17px); right:12px; display:flex; gap:6px; }
    .hacts > * { all:unset; cursor:pointer; box-sizing:border-box; width:34px; height:34px; border-radius:50%; display:grid; place-items:center;
                 color:#33506b; background:rgba(255,255,255,.55); box-shadow:inset 0 0 0 1px rgba(255,255,255,.7); }
    .hacts > *:hover { background:rgba(255,255,255,.82); }
    .hacts > *:focus-visible { outline:2px solid var(--gh-accent); outline-offset:1px; }
    .hacts > *[disabled] { opacity:.6; cursor:default; }
    .night .hacts > * { color:#fff; background:rgba(255,255,255,.12); box-shadow:inset 0 0 0 1px rgba(255,255,255,.2); }
    .hacts .i { width:20px; height:20px; }
    .hacts .spin .i { animation:gh-spin 1s linear infinite; }
    @keyframes gh-spin { to { transform:rotate(360deg); } }
    @media (max-width: 600px) { .topbar .scene { display:none; } .topbar .bhead { right:150px; } }
    .tabs { display:flex; align-items:center; gap:4px; padding:0 12px; overflow-x:auto; background:var(--primary-background-color);
            border-bottom:1px solid var(--divider-color, rgba(0,0,0,.12)); position:sticky; top:0; z-index:2; }
    .tab { background:none; border:none; border-bottom:2px solid transparent; color:var(--secondary-text-color); padding:12px 12px 10px; font:inherit;
           font-size:14px; font-weight:500; cursor:pointer; white-space:nowrap; }
    .tab:hover { color:var(--primary-text-color); }
    .tab:focus-visible { outline:2px solid var(--primary-color); outline-offset:-2px; }
    .tab.active { color:var(--primary-text-color); border-bottom-color:var(--gh-accent); }
    /* Top bar hidden (Settings): the tabs alone at the top; the menu button stays where Home Assistant shows it
       (narrow screen or sidebar hidden), at the start of the tabs */
    :host([bare]) .topbar { display:none; }
    .tabmenu { display:none; color:var(--primary-text-color); align-self:center; margin-inline-end:4px; }
    :host([bare][menu]) .tabmenu { display:flex; }
    /* Count badge on the Issues and Pull requests tabs */
    .tab .badge { display:inline-block; margin-inline-start:6px; min-width:18px; padding:0 5px; border-radius:9px; font-size:11px; box-sizing:border-box;
                  line-height:18px; text-align:center; font-weight:500; vertical-align:middle;
                  color:color-mix(in srgb, var(--gh-accent) 60%, var(--primary-text-color)); background:color-mix(in srgb, var(--gh-accent) 16%, transparent); }
    /* A tab's header in its first card (the illustration is in the top bar now) */
    .thead { display:flex; align-items:center; gap:12px; padding:12px 16px 0; min-width:0; }
    .thead .badge-ic { background:color-mix(in srgb, var(--tone, var(--gh-accent)) 14%, transparent); box-shadow:none; }
    .thead .bsub { color:var(--secondary-text-color); }
    /* Settings: the tab's header inside the first card, over its first group */
    .sethead { padding-bottom:10px; margin-bottom:2px; border-bottom:1px solid var(--divider-color, rgba(127,127,127,.2)); }
    .sethead .thead { padding:0; }
    .thead .stpill { background:color-mix(in srgb, var(--c) 15%, transparent); color:color-mix(in srgb, var(--c) 55%, var(--primary-text-color)); }
    /* Repository filter: the repositories with open items only, the busiest first; the rest behind "+ N more" */
    .more { position:relative; }
    .more > summary { list-style:none; } .more > summary::-webkit-details-marker { display:none; }
    .more > summary.chip { border-style:dashed; border-color:var(--divider-color, rgba(127,127,127,.4)); }
    .more .pop { position:absolute; z-index:3; top:calc(100% + 6px); left:0; width:300px; max-height:320px; overflow:auto; padding:8px; box-sizing:border-box;
                 background:var(--card-background-color, #fff); border:1px solid var(--divider-color, rgba(127,127,127,.3)); border-radius:12px;
                 box-shadow:0 8px 24px rgba(0,0,0,.14); display:flex; flex-direction:column; gap:2px; }
    .more .pop .search { margin-bottom:4px; }
    .more .pop .chip { justify-content:space-between; border-radius:8px; min-height:32px; }
    .more .pop .chip[hidden] { display:none; }
    main { max-width:1040px; margin:0 auto; padding:16px; box-sizing:border-box; }
    section[hidden] { display:none; }
    .box { background:var(--card-background-color, #fff); border-radius:var(--ha-card-border-radius, 12px);
           border:1px solid var(--divider-color, rgba(127,127,127,.2)); padding:14px 16px; display:flex; flex-direction:column; gap:12px; }
    .note { font-size:14px; color:var(--secondary-text-color); }
    .note.warn { color:color-mix(in srgb, var(--tone-warn) 50%, var(--primary-text-color)); }
    .note.bad { color:color-mix(in srgb, var(--tone-bad) 50%, var(--primary-text-color)); }
    .note.good { color:color-mix(in srgb, var(--tone-good) 50%, var(--primary-text-color)); }
    .head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .head .sum { flex:1 1 160px; font-size:14px; color:var(--secondary-text-color); }
    .search { flex:1 1 160px; display:flex; align-items:center; border-radius:8px; border:1px solid var(--divider-color, rgba(127,127,127,.3));
              background:var(--secondary-background-color, rgba(127,127,127,.08)); }
    .search:focus-within, .field:focus-within { border-color:var(--gh-accent); }
    .search input, .field input { flex:1; min-width:0; border:0; outline:0; background:none; color:inherit; font:inherit; font-size:14px; padding:8px 10px; }
    /* Buttons: outlined or tinted, never filled */
    .act { display:inline-flex; align-items:center; gap:6px; cursor:pointer; font:inherit; font-size:13px; font-weight:500; padding:6px 12px;
           border-radius:16px; color:var(--gh-accent); background:none; border:1px solid color-mix(in srgb, var(--gh-accent) 50%, transparent); white-space:nowrap; }
    .act .i { width:16px; height:16px; }
    .act:hover:not([disabled]) { background:color-mix(in srgb, var(--gh-accent) 12%, transparent); }
    .act.quiet { color:var(--secondary-text-color); border-color:var(--divider-color, rgba(127,127,127,.3)); }
    .act.bad { color:color-mix(in srgb, var(--tone-bad) 50%, var(--primary-text-color)); border-color:color-mix(in srgb, var(--tone-bad) 45%, transparent); }
    .act[disabled] { opacity:.5; cursor:default; }
    .act:focus-visible, .tab:focus-visible, a:focus-visible, input:focus-visible { outline:2px solid var(--gh-accent); outline-offset:1px; }
    .list { display:flex; flex-direction:column; }
    .row { display:flex; align-items:center; gap:10px; padding:8px 0; border-top:1px solid var(--divider-color, rgba(127,127,127,.15)); min-height:36px; }
    .row:first-child { border-top:0; }
    .row > .i { color:var(--secondary-text-color); }
    .row .n { flex:1; min-width:0; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .row .chip { font-size:11px; font-weight:500; padding:2px 8px; border-radius:12px; flex:none;
                 color:color-mix(in srgb, var(--tone-good) 50%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-good) 15%, transparent); }
    .row .chip { display:inline-flex; align-items:center; gap:3px; }
    /* Same width for Follow and Stop following, so the links line up */
    .row > .act { min-width:9.5em; justify-content:center; }
    .row .chip .i { width:12px; height:12px; }
    .row .pick-repo { appearance:none; width:18px; height:18px; margin:0; flex:none; cursor:pointer; border-radius:4px; display:grid; place-items:center;
           border:2px solid var(--secondary-text-color); background:none; }
    .row .pick-repo:checked { border-color:var(--gh-accent); background:var(--gh-accent); }
    .row .pick-repo:checked::after { content:""; width:5px; height:9px; margin-top:-2px; border:solid var(--card-background-color, #fff); border-width:0 2px 2px 0; transform:rotate(45deg); }
    .row .pick-repo[disabled] { opacity:.5; cursor:default; }
    .row .link { display:grid; place-items:center; width:28px; height:28px; border-radius:50%; color:var(--secondary-text-color); flex:none; }
    .row .link:hover { background:color-mix(in srgb, var(--secondary-text-color) 15%, transparent); }
    .row .link .i { width:16px; height:16px; }
    /* A followed repository: its name folds and unfolds the card's details (chevron right folded, down unfolded) */
    .fold { all:unset; flex:1; min-width:0; display:flex; align-items:center; gap:8px; cursor:pointer; border-radius:6px; }
    .fold:focus-visible { outline:2px solid var(--gh-accent); outline-offset:2px; }
    .fold > .i { color:var(--secondary-text-color); transition:transform .15s; }
    .row.open .fold > .i { transform:rotate(90deg); }
    .totals { display:flex; align-items:center; gap:12px; margin-top:2px; }
    .totals:empty { display:none; }
    .totals > span { display:inline-flex; align-items:center; gap:3px; }
    .totals .i { width:14px; height:14px; color:#e3a008; }
    .account-slot.on { border-top:1px solid var(--divider-color, rgba(127,127,127,.15)); padding-top:8px; }
    .info { display:inline-flex; align-items:center; gap:10px; font-size:12px; color:var(--secondary-text-color); flex:none; }
    .info > span { display:inline-flex; align-items:center; gap:3px; }
    .info .i { width:14px; height:14px; }
    .info .star .i { color:#e3a008; } .info .ok .i { color:var(--tone-good); } .info .tag .i { color:var(--gh-accent); } .info .dl .i { color:#3b82f6; }
    /* Total downloads of the followed repositories, at the foot of the Repositories tab */
    .dl-total { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--secondary-text-color); }
    .dl-total:empty { display:none; }
    .dl-total:not(:empty) { border-top:1px solid var(--divider-color, rgba(127,127,127,.15)); padding-top:10px; margin-top:2px; }
    .dl-total .i { width:16px; height:16px; color:#3b82f6; }
    .detail { padding:4px 0 12px 26px; }
    /* The unfolded repository and the account, drawn by the panel as the GitHub Card draws them: counter tiles,
       latest activity rows (each opens its more-info), links to GitHub as round icon buttons (never filled) */
    .dt { display:flex; flex-direction:column; gap:8px; container:gh-dt / inline-size;
          --dt-blue:#18bcf2; --dt-star:#e3a008; --dt-green:#2da44e; --dt-purple:#8957e5; }
    .dt .c-star { --c:var(--dt-star); } .dt .c-blue { --c:var(--dt-blue); } .dt .c-green { --c:var(--dt-green); } .dt .c-purple { --c:var(--dt-purple); }
    .dt [role="button"] { cursor:pointer; }
    .dt [role="button"]:focus-visible { outline:2px solid var(--primary-color, #03a9f4); outline-offset:-2px; }
    .dt-tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(124px, 1fr)); gap:6px; }
    .dt-tile { display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:10px; min-width:0;
               background:var(--secondary-background-color, rgba(127,127,127,.08)); }
    .dt-tile > .i { color:var(--c, var(--dt-blue)); width:16px; height:16px; }
    .dt-tile > div { min-width:0; }
    .dt-tile .k { font-size:11px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dt-tile .v { font-size:14px; font-weight:500; }
    .dt-link { flex:none; display:grid; place-items:center; width:24px; height:24px; border-radius:50%; color:var(--secondary-text-color); }
    .dt-link .i { width:14px; height:14px; }
    .dt-link:hover { background:color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color:var(--primary-text-color); }
    .dt-latest { display:flex; flex-direction:column; gap:2px; }
    .dt-row { display:grid; grid-template-columns:18px minmax(0, max-content) minmax(0, 1fr) auto; align-items:center; gap:8px; font-size:13px; min-height:26px; }
    .dt-row > .i { color:var(--secondary-text-color); }
    .dt-row .k { color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dt-row .v { min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dt-row .v small { color:var(--secondary-text-color); font-size:11px; margin-left:4px; }
    .dt-sec { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; color:var(--secondary-text-color); margin:4px 0 2px; }
    .dt-sec > .i { width:16px; height:16px; }
    .dt-sec .label { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    @container gh-dt (max-width: 300px) { .dt-row { grid-template-columns:18px minmax(0, 1fr) auto; } .dt-row .k { display:none; } }
    @media (max-width: 600px) { .info .tag, .info .ok:nth-child(3) { display:none; } .detail { padding-left:0; } }
    /* Confirmation in place of the row, like the card popups (at the top of what they act on) */
    .confirm { flex-direction:column; align-items:stretch; gap:8px; padding:10px 12px; margin:4px 0; border-radius:10px;
               border:1px solid color-mix(in srgb, var(--tone-bad) 45%, transparent); background:color-mix(in srgb, var(--tone-bad) 8%, transparent); }
    .confirm .b { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
    /* Narrow (phone): the name keeps the line, the chip goes */
    @media (max-width: 420px) { .row .chip { display:none; } }
    /* Narrow list (phone): the name takes the whole first line; counters, link and button wrap to a second line */
    .list { container-type:inline-size; }
    @container (max-width: 560px) {
      .row:not(.confirm) { flex-wrap:wrap; row-gap:6px; }
      .row .fold { flex:1 1 calc(100% - 38px); }
      .row > .n { flex:1 1 calc(100% - 94px); }
      .row .link { order:1; }
      .row .info { order:2; flex:1 1 0; min-width:0; overflow:hidden; padding-left:26px; }
      .row .info .tag { display:none; }
      .row > .act { order:3; min-width:0; padding:5px 12px; margin-left:auto; }
    }
    .form { display:flex; flex-direction:column; gap:14px; }
    .ctl { display:flex; flex-direction:column; gap:4px; }
    .ctl > span { font-size:12px; color:var(--secondary-text-color); }
    .ctl small, .toggle small { font-size:11px; color:var(--secondary-text-color); }
    .field { display:flex; border-radius:8px; border:1px solid var(--divider-color, rgba(127,127,127,.3)); background:var(--secondary-background-color, rgba(127,127,127,.08)); }
    .toggle { display:flex; align-items:center; gap:12px; cursor:pointer; }
    .toggle > div { flex:1; display:flex; flex-direction:column; gap:2px; font-size:14px; }
    .toggle input { width:18px; height:18px; accent-color:var(--gh-accent); }
    .bar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    /* Issues and pull requests: one line per item, its repository, number, author and age under the title */
    .head .pick[data-sort] { flex:0 0 auto; }
    .pick { flex:0 1 240px; min-width:0; border-radius:8px; border:1px solid var(--divider-color, rgba(127,127,127,.3)); padding:7px 8px;
            background:var(--secondary-background-color, rgba(127,127,127,.08)); color:inherit; font:inherit; font-size:14px; }
    .item { display:flex; gap:10px; align-items:flex-start; padding:10px 0; border-top:1px solid var(--divider-color, rgba(127,127,127,.15));
            color:inherit; text-decoration:none; }
    .item:first-child { border-top:0; }
    .item:hover .t { color:var(--gh-accent); }
    .item > .i { margin-top:2px; color:var(--tone-good); }
    .item.draft > .i { color:var(--secondary-text-color); }
    .item .body { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
    .item .t { font-size:14px; font-weight:500; overflow-wrap:anywhere; }
    .item .m { font-size:12px; color:var(--secondary-text-color); display:flex; flex-wrap:wrap; gap:4px 10px; align-items:center; }
    .item .m .i { width:14px; height:14px; }
    .item .m span { display:inline-flex; align-items:center; gap:3px; }
    .lbl { font-size:11px; font-weight:500; padding:1px 8px; border-radius:10px; border:1px solid color-mix(in srgb, var(--c) 60%, transparent);
           color:color-mix(in srgb, var(--c) 55%, var(--primary-text-color)); background:color-mix(in srgb, var(--c) 14%, transparent); }
    .rev { font-size:11px; font-weight:500; padding:1px 8px; border-radius:10px; }
    .rev.good { color:color-mix(in srgb, var(--tone-good) 50%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-good) 15%, transparent); }
    .rev.warn { color:color-mix(in srgb, var(--tone-warn) 50%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-warn) 15%, transparent); }
    .rev.bad { color:color-mix(in srgb, var(--tone-bad) 50%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-bad) 15%, transparent); }
    .rev.muted { color:var(--secondary-text-color); background:var(--secondary-background-color, rgba(127,127,127,.12)); }
    /* ── The cards' charter (as the ha-* cards and the System Hub / Cameras panels): a header card per tab with its
       illustrated banner, then lists under an uppercase title, their rows filled and rounded with a round tinted icon,
       counters as small pills, pill buttons, the project's purple as accent ── */
    :host { --gh-sec:color-mix(in srgb, var(--primary-text-color) 6%, var(--card-background-color, #fff)); --gh-ink:color-mix(in srgb, var(--gh-accent) 70%, var(--primary-text-color)); }
    main { max-width:1180px; }
    section > div { display:flex; flex-direction:column; gap:12px; }
    .card { background:var(--ha-card-background, var(--card-background-color, #fff)); border-radius:var(--ha-card-border-radius, 12px); overflow:hidden;
            border:var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, rgba(127,127,127,.2))); box-shadow:var(--ha-card-box-shadow, none); }
    .card[hidden] { display:none; }
    .card.list { padding:12px 16px 14px; display:flex; flex-direction:column; gap:8px; }
    .cbody { padding:12px 16px 16px; display:flex; flex-direction:column; gap:10px; }
    .cbody:empty { display:none; }
    .lhead { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-height:36px; }
    .pick-acts { display:contents; }
    .lname { flex:1 1 140px; margin:0; font-size:12px; font-weight:500; letter-spacing:.05em; text-transform:uppercase; color:var(--secondary-text-color); }
    .rows { display:flex; flex-direction:column; gap:6px; container-type:inline-size; }
    .grow { flex:1; }
    /* Banner */
    .banner { position:relative; height:90px; overflow:hidden; background:#f2efe9; color:#1f2328; --gh-muted:#5d6670; container-type:inline-size; }
    .banner.night { background:#2a2b33; color:#fff; --gh-muted:rgba(255,255,255,.78); }
    .scene { position:absolute; right:20px; bottom:10px; width:min(360px, 44%); height:80px; }
    .ground { position:absolute; left:0; right:0; bottom:0; height:10px; background:repeating-linear-gradient(90deg, #c99a6b 0 38px, #b98a5c 38px 40px); box-shadow:inset 0 2px 0 #a97c50; }
    .night .ground { background:repeating-linear-gradient(90deg, #4a3a2c 0 38px, #3e3024 38px 40px); box-shadow:inset 0 2px 0 #5a4634; }
    .s-mon { fill:#2d3440; } .night .s-mon { fill:#0f141b; }
    .s-scr { fill:#f8f9fb; } .night .s-scr { fill:#1e2733; }
    .s-desk { fill:#a97c50; } .night .s-desk { fill:#5a4634; }
    .s-deskd { fill:#8f6743; } .night .s-deskd { fill:#46362a; }
    .s-mug { fill:#fff; stroke:#c9ced4; } .night .s-mug { fill:#d8dce2; stroke:#aab1bb; }
    .s-handle { stroke:#c9ced4; } .night .s-handle { stroke:#aab1bb; }
    .s-pot { fill:#d08a5a; } .night .s-pot { fill:#7a4f34; }
    .s-leaf { fill:#6aa56a; transform-box:fill-box; transform-origin:50% 100%; animation:gh-sway 4s ease-in-out infinite; } .night .s-leaf { fill:#3f6e46; }
    .s-pulse { animation:gh-pulse 1.6s ease-in-out infinite; }
    @keyframes gh-sway { 0%, 100% { transform:rotate(-4deg); } 50% { transform:rotate(4deg); } }
    @keyframes gh-pulse { 50% { opacity:.25; } }
    @media (prefers-reduced-motion: reduce) { .scene * { animation:none !important; } }
    .bhead { position:absolute; left:0; top:0; bottom:10px; right:calc(min(360px, 44%) + 28px); padding:0 16px; display:flex; align-items:center; gap:12px; min-width:0; }
    .badge-ic { width:40px; height:40px; flex:none; border-radius:50%; display:grid; place-items:center; color:var(--tone, var(--gh-accent));
                background:rgba(255,255,255,.62); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--tone, var(--gh-accent)) 24%, transparent); }
    .badge-ic .i { width:24px; height:24px; }
    .night .badge-ic { background:rgba(255,255,255,.12); color:color-mix(in srgb, var(--tone, var(--gh-accent)) 72%, #fff); box-shadow:inset 0 0 0 1px rgba(255,255,255,.14); }
    .btitles { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
    .brow { display:flex; align-items:center; flex-wrap:wrap; gap:4px 8px; min-width:0; }
    .bname { font-size:16px; font-weight:500; line-height:1.25; white-space:nowrap; }
    .bsub { font-size:13px; line-height:18px; color:var(--gh-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .stpill { display:inline-flex; align-items:center; gap:4px; padding:1px 8px; border-radius:12px; font-size:11px; font-weight:500; line-height:16px; white-space:nowrap;
              --c:var(--gh-accent); background:color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color:color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .stpill::before { content:""; width:7px; height:7px; border-radius:50%; background:var(--c); }
    .stpill.good { --c:var(--tone-good); } .stpill.warn { --c:var(--tone-warn); } .stpill.bad { --c:var(--tone-bad); } .stpill.muted { --c:#8a96a6; }
    .night .stpill { background:color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color:color-mix(in srgb, var(--c) 35%, #fff); }
    @container (max-width:420px) { .scene { display:none; } .bhead { right:0; } }
    /* Tiles and rows */
    .kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:8px; }
    .tile { display:flex; align-items:center; gap:10px; min-height:56px; padding:8px 10px 8px 8px; border-radius:12px; background:var(--gh-sec); box-sizing:border-box; min-width:0; }
    .kv { display:flex; flex-direction:column; min-width:0; }
    .kv b { font-size:17px; font-weight:500; line-height:1.2; }
    .kv span { font-size:12px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ic { width:40px; height:40px; flex:none; border-radius:50%; display:grid; place-items:center; color:var(--primary-text-color);
          background:color-mix(in srgb, var(--secondary-text-color) 14%, transparent); }
    .ic .i { width:20px; height:20px; }
    .ic.acc { color:var(--gh-ink); background:color-mix(in srgb, var(--gh-accent) 16%, transparent); }
    .ic.good { color:color-mix(in srgb, var(--tone-good) 70%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-good) 16%, transparent); }
    .ic.gold { color:#9a6b00; background:rgba(232,168,0,.18); }
    .ic.blue { color:color-mix(in srgb, #3b82f6 75%, var(--primary-text-color)); background:color-mix(in srgb, #3b82f6 16%, transparent); }
    .row { border-top:0; padding:8px 10px 8px 8px; min-height:56px; border-radius:12px; background:var(--gh-sec); box-sizing:border-box; border:1px solid transparent; }
    .row.open { border-color:color-mix(in srgb, var(--gh-accent) 40%, transparent); }
    .row.sel { background:color-mix(in srgb, var(--gh-accent) 9%, var(--gh-sec)); border-color:color-mix(in srgb, var(--gh-accent) 26%, transparent); }
    .row.confirm { border-color:color-mix(in srgb, var(--tone-bad) 45%, transparent); background:color-mix(in srgb, var(--tone-bad) 8%, var(--gh-sec)); margin:0; }
    .who { all:unset; flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; cursor:default; }
    button.who { cursor:pointer; border-radius:6px; }
    button.who:focus-visible { outline:2px solid var(--gh-accent); outline-offset:2px; }
    .who .n { font-size:14px; font-weight:500; flex:none; }
    .who .s { font-size:12px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .chev { all:unset; width:28px; height:36px; flex:none; display:grid; place-items:center; cursor:pointer; color:var(--secondary-text-color); border-radius:6px; }
    .chev .i { transition:transform .15s; }
    .row.open .chev .i { transform:rotate(90deg); }
    .chev:focus-visible { outline:2px solid var(--gh-accent); }
    .info { gap:6px; flex-wrap:wrap; justify-content:flex-end; }
    .info > span { height:24px; padding:0 8px; border-radius:12px; font-size:12px; font-weight:500; color:var(--primary-text-color); background:var(--card-background-color, #fff); }
    .info .star { color:#9a6b00; } .info .ok { color:color-mix(in srgb, var(--tone-good) 70%, var(--primary-text-color)); }
    .info .pr, .info .tag { color:var(--gh-ink); } .info .dl { color:color-mix(in srgb, #3b82f6 75%, var(--primary-text-color)); }
    .info .i, .info .star .i, .info .ok .i, .info .tag .i, .info .dl .i { color:inherit; }
    .row .link { width:36px; height:36px; background:var(--card-background-color, #fff); color:var(--primary-text-color); }
    .row .link:hover { color:var(--gh-ink); background:var(--card-background-color, #fff); }
    .detail { padding:0 0 4px 38px; }
    /* Pill buttons, tinted, never filled */
    .act { min-height:36px; box-sizing:border-box; padding:0 14px; border-radius:18px; border:0; color:var(--gh-ink); background:color-mix(in srgb, var(--gh-accent) 14%, transparent); }
    .act:hover:not([disabled]) { background:color-mix(in srgb, var(--gh-accent) 22%, transparent); }
    .act.quiet { color:var(--primary-text-color); background:var(--gh-sec); }
    .act.quiet:hover:not([disabled]) { background:color-mix(in srgb, var(--primary-text-color) 10%, var(--card-background-color, #fff)); }
    .row .act.quiet { background:var(--card-background-color, #fff); }
    .act.bad { color:color-mix(in srgb, var(--tone-bad) 60%, var(--primary-text-color)); background:color-mix(in srgb, var(--tone-bad) 14%, transparent); }
    .row > .act { min-width:0; }
    .search { flex:0 1 260px; min-width:160px; height:36px; border:0; border-radius:18px; padding:0 4px 0 12px; gap:6px; color:var(--secondary-text-color); background:var(--gh-sec); }
    .search .i { width:16px; height:16px; }
    .search:focus-within { box-shadow:inset 0 0 0 2px var(--gh-accent); }
    .search input { padding:8px 6px; color:var(--primary-text-color); }
    .seg { display:inline-flex; flex-wrap:wrap; gap:2px; padding:3px; border-radius:18px; background:var(--gh-sec); }
    .seg button { border:0; background:none; cursor:pointer; font:inherit; font-size:12.5px; font-weight:500; padding:6px 12px; border-radius:15px; color:var(--secondary-text-color); }
    .seg button[aria-pressed="true"] { background:var(--card-background-color, #fff); color:var(--gh-ink); box-shadow:0 1px 2px rgba(0,0,0,.14); }
    .seg button:focus-visible, .chip:focus-visible { outline:2px solid var(--gh-accent); outline-offset:1px; }
    .chips { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .chip { display:inline-flex; align-items:center; gap:6px; min-height:34px; padding:0 12px; border-radius:17px; border:1px solid transparent; cursor:pointer;
            font:inherit; font-size:13px; font-weight:500; color:var(--primary-text-color); background:var(--gh-sec); }
    .chip em { font-style:normal; font-size:11.5px; opacity:.7; }
    .chip[aria-pressed="true"] { color:var(--gh-ink); background:color-mix(in srgb, var(--gh-accent) 14%, transparent); border-color:color-mix(in srgb, var(--gh-accent) 35%, transparent); }
    .row .pick-repo { width:20px; height:20px; border-radius:6px; border-color:#9aa3ae; }
    /* Issues and pull requests: a row per item */
    a.row.item { gap:10px; align-items:center; text-decoration:none; color:inherit; }
    a.row.item:hover { background:color-mix(in srgb, var(--gh-accent) 7%, var(--gh-sec)); }
    a.row.item:hover .n { color:var(--gh-ink); }
    .item .who .n { white-space:normal; overflow-wrap:anywhere; }
    .item .who .s { white-space:normal; }
    .item .cnt { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; max-width:45%; flex:none; }
    .item .cnt .com { display:inline-flex; align-items:center; gap:3px; height:22px; padding:0 8px; border-radius:11px; font-size:12px; background:var(--card-background-color, #fff); color:var(--secondary-text-color); }
    .item .cnt .com .i { width:13px; height:13px; }
    .rev, .lbl { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; line-height:16px; padding:3px 9px; border-radius:12px; white-space:nowrap; }
    .rev::before { content:""; width:7px; height:7px; border-radius:50%; background:currentColor; opacity:.85; }
    .rev.muted { background:var(--card-background-color, #fff); }
    @container (max-width:600px) {
      .row:not(.confirm):not(.item) { flex-wrap:wrap; row-gap:6px; }
      .row .who { flex:1 1 calc(100% - 120px); }
      .row .info { order:2; flex:1 1 100%; justify-content:flex-start; padding-left:38px; }
      .row .info .tag { display:none; }
      .item .cnt { max-width:none; flex:1 1 100%; justify-content:flex-start; order:2; padding-left:50px; }
      a.row.item { flex-wrap:wrap; }
      .detail { padding-left:0; }
    }
    /* Settings: switches, the refresh interval as a segmented choice, the save bar */
    .toggle.row { cursor:pointer; gap:12px; }
    .toggle .who { cursor:pointer; }
    .toggle .who small { font-size:12px; color:var(--secondary-text-color); }
    .toggle.row > .seg { flex:none; flex-direction:row; flex-wrap:nowrap; gap:2px; font-size:inherit; background:color-mix(in srgb, var(--primary-text-color) 7%, transparent); }
    input.sw { appearance:none; -webkit-appearance:none; width:40px; height:24px; margin:0; flex:none; border-radius:12px; position:relative; cursor:pointer;
               background:color-mix(in srgb, var(--secondary-text-color) 45%, transparent); transition:background .15s; }
    input.sw::after { content:""; position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.25); transition:left .15s; }
    input.sw:checked { background:var(--gh-accent); }
    input.sw:checked::after { left:19px; }
    input.sw:focus-visible { outline:2px solid var(--gh-accent); outline-offset:2px; }
    .interval { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .interval .field { width:110px; flex:none; }
    .interval small.note { flex:1 1 220px; font-size:12px; }
    .field { border:0; border-radius:10px; background:var(--gh-sec); min-height:44px; align-items:center; }
    .field:focus-within { box-shadow:inset 0 0 0 2px var(--gh-accent); }
    .savebar { padding:10px 12px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; position:sticky; bottom:12px; z-index:1; }
    .savebar .note { flex:1; text-align:right; font-size:12.5px; }
  `;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    // The counters and latest activity of the unfolded repository and of the account open their more-info dialog
    // (a click, or Enter / Space on the focused row); their GitHub links open as links.
    const moreInfo = (ev) => {
      const el = ev.target?.closest?.(".dt [data-entity]");
      if (!el || ev.target.closest("a")) return;
      if (ev.type === "keydown" && ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true }));
    };
    this.shadowRoot.addEventListener?.("click", moreInfo);
    this.shadowRoot.addEventListener?.("keydown", moreInfo);
    this._tab = "repos";
    this._overview = null;
    this._settings = null;
    this._draft = {};
    this._query = "";
    this._busy = false;
    this._message = null; // { tone, text }
    this._confirm = null; // repository whose unfollowing is being confirmed
    this._selected = new Set(); // repositories not followed yet, ticked to follow them together
    this._items = null; // open issues and pull requests, loaded with the first of their tabs
    this._itemsBusy = false;
    this._itemRepo = ""; // repository filter of the Issues and Pull requests tabs
    this._mine = null; // my open pull requests (any repository), loaded when the My pull requests tab opens
    this._mineBusy = false;
    this._sort = "followed"; // order of the Repositories tab
    try {
      const saved = localStorage.getItem("github_card.repos_sort");
      if (GITHUB_PANEL_SORTS.includes(saved)) this._sort = saved;
    } catch (_err) {
      // no storage: the default order
    }
  }

  // /github-config/<tab> opens that tab (Home Assistant sets the route; the base address is Repositories)
  set route(route) {
    const path = (route?.path || "").split("/").filter(Boolean)[0];
    const tab = GITHUB_PANEL_TABS.includes(path) ? path : "repos";
    if (tab !== this._tab) this._showTab(tab);
  }

  set panel(panel) {
    this._panel = panel;
    this._syncBare();
  }

  set narrow(narrow) {
    this._narrow = narrow;
    if (this._menu) this._menu.narrow = narrow;
    if (this._tabMenu) this._tabMenu.narrow = narrow;
    this._syncBare();
  }

  // The top bar hidden as saved (Settings): for everyone, or for a user who is not an administrator; until the settings
  // arrive, the panel's registration says it, so the bar is never shown then hidden while loading. The tabs stay.
  _bare() {
    const mode = githubPanelHideMode(this._settings?.hide_toolbar ?? this._panel?.config?.hide_toolbar);
    return mode === "all" || (mode === "non_admin" && this._hass?.user?.is_admin === false);
  }

  _syncBare() {
    this.toggleAttribute?.("bare", this._bare());
    // Where Home Assistant shows the menu button: narrow screen, or the sidebar set to always hidden
    this.toggleAttribute?.("menu", Boolean(this._narrow) || this._hass?.dockedSidebar === "always_hidden");
  }

  set hass(hass) {
    const first = !this._hass;
    const before = this._lang();
    this._hass = hass;
    if (this._menu) this._menu.hass = hass;
    if (this._tabMenu) this._tabMenu.hass = hass;
    this._syncBare();
    if (!first) this._updateInfo();
    if (!first) this._renderHead();
    if (first) this._start();
    else if (this._lang() !== before) this._render();
  }

  connectedCallback() {
    if (this._hass && !this._unsub) this._subscribe();
    if (!this._fold && this.shadowRoot?.querySelector?.(".topbar")) this._attachFold();
    this._watchConnection(true);
    // Back on the panel after a failed load: try again now.
    if (this._hass && this._failed) this._reload();
  }

  disconnectedCallback() {
    this._fold?.detach();
    this._fold = null;
    this._watchConnection(false);
    clearTimeout(this._retryTimer);
    if (this._unsub) {
      this._unsub.then((off) => off()).catch(() => {});
      this._unsub = null;
    }
    if (this._itemsUnsub) {
      this._itemsUnsub.then((off) => off()).catch(() => {});
      this._itemsUnsub = null;
    }
  }


  // The connection back (Home Assistant restarted, the app resumed): load again, the data may have changed meanwhile.
  _watchConnection(on) {
    const connection = this._hass?.connection;
    if (!connection?.addEventListener) return;
    this._onReady ||= () => this._reload();
    connection.removeEventListener("ready", this._onReady);
    if (on) connection.addEventListener("ready", this._onReady);
  }

  // A load that failed (Home Assistant still starting, the connection dropped) is tried again after 2 s, 5 s, 15 s,
  // then every 30 s while the panel is shown, instead of leaving it empty.
  _retry(failed) {
    clearTimeout(this._retryTimer);
    this._failed = failed;
    if (!failed) {
      this._retries = 0;
      return;
    }
    const delay = [2000, 5000, 15000, 30000][Math.min(this._retries || 0, 3)];
    this._retries = (this._retries || 0) + 1;
    this._retryTimer = setTimeout(() => {
      if (this.isConnected) this._reload();
    }, delay);
  }

  async _reload() {
    this._loadFailed = false;
    await Promise.all([this._loadSettings(), this._load()]);
    // One retry for the lot, whichever failed
    this._retry(this._loadFailed);
  }
  // Full code when it has a table (sr-Latn), else its base (de-AT → de), else English
  _lang() {
    const code = this._hass?.language || "en";
    if (GITHUB_PANEL_STRINGS[code]) return code;
    const base = code.split("-")[0];
    return GITHUB_PANEL_STRINGS[base] ? base : "en";
  }

  _t(key, vars = {}) {
    let text = GITHUB_PANEL_STRINGS[this._lang()][key] ?? GITHUB_PANEL_STRINGS.en[key] ?? key;
    for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, v);
    return text;
  }

  // The panel draws everything itself (the unfolded repository and the account too): no card to load.
  async _start() {
    this._render();
    this._subscribe();
    this._watchConnection(this.isConnected);
    await this._reload();
  }

  // Reload the list when the GitHub integration changes (a repository followed elsewhere, a reload)
  _subscribe() {
    if (this._unsub || !this._hass?.connection) return;
    this._unsub = this._hass.connection
      .subscribeMessage(
        (events) => {
          if (!this._busy && [].concat(events || []).some((ev) => ev?.entry?.domain === "github")) this._load();
        },
        { type: "config_entries/subscribe" },
      )
      .catch(() => () => {});
    this._subscribeItems();
  }

  // The open issues and pull requests: pushed by the background poller (the current snapshot at once, then after
  // each fetch), so the panel shows them without ever querying GitHub when a tab opens.
  _subscribeItems() {
    if (this._itemsUnsub || !this._hass?.connection) return;
    this._itemsUnsub = this._hass.connection
      .subscribeMessage(
        (items) => {
          this._items = items;
          this._itemsBusy = false;
          this._renderItems("issues");
          this._renderItems("pulls");
    this._renderHandle();
          this._updateTabBadges();
        },
        { type: "github_card/subscribe_items" },
      )
      .catch(() => () => {});
  }

  async _load() {
    try {
      this._overview = await this._hass.callWS({ type: "github_card/repositories" });
      // The error of a failed load goes once a load succeeds (a retry, the connection back).
      if (this._message && this._message === this._loadError) this._message = null;
    } catch (err) {
      this._message = { tone: "bad", text: this._t("error", { error: err?.message || err }) };
      this._loadError = this._message;
      this._overview = this._overview || { configured: true, followed: [], offered: [], offered_error: true };
      this._loadFailed = true;
    }
    this._renderRepos();
  }

  async _loadSettings() {
    try {
      this._settings = (await this._hass.callWS({ type: "github_card/settings" })).settings;
    } catch (_err) {
      this._settings = this._settings || { filter: "", include_starred: false, ignore_archived: false, notify_issues: false, notify_pulls: false, notify_releases: false, refresh_minutes: 15 };
      this._loadFailed = true;
    }
    this._syncBare();
    this._renderSettings();
  }

  // ── Tabs ──

  _goTab(tab, focus) {
    if (!GITHUB_PANEL_TABS.includes(tab)) return;
    this._showTab(tab, focus);
    const base = (this._panel?.url_path || "github-config").replace(/^\//, "");
    try {
      history.replaceState(history.state, "", `/${base}${tab === "repos" ? "" : `/${tab}`}`);
    } catch (_err) {
      // no history (a test, a sandboxed page): the tab still shows
    }
  }

  _showTab(tab, focus) {
    this._tab = tab;
    const root = this.shadowRoot;
    for (const button of root.querySelectorAll?.(".tab") || []) {
      const selected = button.dataset.tab === tab;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus({ preventScroll: true });
    }
    for (const name of GITHUB_PANEL_TABS) {
      const section = root.getElementById?.(`tab-${name}`);
      if (section) section.hidden = name !== tab;
    }
    // The issues and pull requests are not fetched when their tab opens: a background poller fetches them on its
    // interval and pushes them here (see _subscribeItems).
    // My pull requests are not followed repositories, so they load the first time their tab opens (then cached).
    if (tab === "mine" && !this._mine && !this._mineBusy) this._loadMine();
  }

  _render() {
    const root = this.shadowRoot;
    const tabs = GITHUB_PANEL_TABS.map((tab) => {
      const selected = tab === this._tab;
      const count = this._tabCount(tab);
      const badge = count ? `<span class="badge" aria-hidden="true">${count}</span>` : "";
      return `<button class="tab${selected ? " active" : ""}" role="tab" id="tabbtn-${tab}" data-tab="${tab}" aria-selected="${selected}" aria-controls="tab-${tab}" tabindex="${selected ? 0 : -1}">${githubPanelEsc(this._t(tab))}${badge}</button>`;
    }).join("");
    root.innerHTML = `
      <style>${GitHubPanel.STYLE}</style>
      <div class="topbar"><div class="banner${this._hass?.themes?.darkMode ? " night" : ""}">${GITHUB_PANEL_SCENE}
        <div class="bhead"><ha-menu-button class="hmenu"></ha-menu-button><div class="hinfo" style="display:contents"></div></div>
        <div class="hacts"></div></div></div>
      <div class="tabs" role="tablist"><ha-menu-button class="tabmenu"></ha-menu-button>${tabs}</div>
      <main>
        <section id="tab-repos" role="tabpanel" aria-labelledby="tabbtn-repos"><div id="repos"></div></section>
        <section id="tab-issues" role="tabpanel" aria-labelledby="tabbtn-issues"><div id="issues"></div></section>
        <section id="tab-pulls" role="tabpanel" aria-labelledby="tabbtn-pulls"><div id="pulls"></div></section>
        <section id="tab-mine" role="tabpanel" aria-labelledby="tabbtn-mine"><div id="mine"></div></section>
        <section id="tab-settings" role="tabpanel" aria-labelledby="tabbtn-settings"><div id="settings"></div></section>
      </main>`;
    this._menu = root.querySelector(".topbar ha-menu-button");
    this._renderHead();
    this._tabMenu = root.querySelector(".tabmenu");
    for (const menu of [this._menu, this._tabMenu]) {
      if (!menu) continue;
      menu.hass = this._hass;
      menu.narrow = this._narrow;
    }
    for (const button of root.querySelectorAll(".tab")) {
      button.addEventListener("click", () => this._goTab(button.dataset.tab));
      // Left and right arrows move between the tabs, as in a native tab bar
      button.addEventListener("keydown", (ev) => {
        const step = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        ev.preventDefault();
        const i = GITHUB_PANEL_TABS.indexOf(this._tab);
        this._goTab(GITHUB_PANEL_TABS[(i + step + GITHUB_PANEL_TABS.length) % GITHUB_PANEL_TABS.length], true);
      });
    }
    this._showTab(this._tab);
    this._renderRepos();
    this._renderItems("issues");
    this._renderItems("pulls");
    this._renderHandle();
    this._renderMine();
    this._renderSettings();
    this._attachFold();
  }

  /** The top bar folds on scroll into one bar with the tabs as icon pills (see githubPanelFold). */
  _attachFold() {
    this._fold?.detach();
    const I = GITHUB_PANEL_ICONS;
    this._fold = githubPanelFold(this, {
      top: ".topbar",
      tabs: ".tabs",
      tab: ".tab",
      key: (b) => b.dataset.tab,
      icons: { repos: I.code, issues: I.issue, pulls: I.pr, mine: I.account, settings: I.cog },
      badge: ".badge",
      name: ".topbar .bname",
      sub: ".topbar .bsub",
      icon: ".topbar .badge-ic",
      status: ".topbar .stpill",
      acts: ".topbar .hacts > *",
      accent: "var(--gh-accent)",
      menu: () => ({ hass: this._hass, narrow: this._narrow, show: this.hasAttribute("menu") }),
    });
  }

  // ── Repositories tab ──

  /** Rows to show: followed and offered repositories matching the search, followed first, then by name. */
  /**
   * Rows to show: followed and offered repositories matching the search, in the chosen order. `followed` (the
   * default): followed first, then by name; `name`: all by name; `stars`, `issues`, `pulls`: the followed ones by
   * that live counter (highest first), then the others by name, which have no counter.
   */
  _rows() {
    const o = this._overview;
    const q = this._query.trim().toLowerCase();
    const rows = [...o.followed.map((name) => ({ name, followed: true })), ...o.offered.map((name) => ({ name, followed: false }))]
      .filter((r) => !q || r.name.toLowerCase().includes(q));
    const byName = (a, b) => a.name.localeCompare(b.name);
    const key = { stars: "stargazers_count", issues: "issues_count", pulls: "pulls_count" }[this._sort];
    if (this._sort === "name") return rows.sort(byName);
    if (key) {
      const n = (r) => (r.followed ? this._number(r.name, key) : null) ?? -1;
      return rows.sort((a, b) => n(b) - n(a) || Number(b.followed) - Number(a.followed) || byName(a, b));
    }
    return rows.sort((a, b) => Number(b.followed) - Number(a.followed) || byName(a, b));
  }

  /** A live counter of a followed repository (its GitHub sensor), or null. */
  _number(repo, key) {
    const s = this._hass?.states?.[this._overview?.sensors?.[repo]?.[key]];
    const v = Number(s?.state);
    return s && s.state !== "" && Number.isFinite(v) ? v : null;
  }


  /** A tab's header in its first card: its icon, title, status pill and a line under them (the illustration is the
   * panel's top bar). */
  _banner(icon, title, pill, sub, tone) {
    const esc = githubPanelEsc;
    const pillHtml = pill ? `<span class="stpill ${pill.tone || ""}" role="status">${esc(pill.text)}</span>` : "";
    return `<div class="thead"><span class="badge-ic"${tone ? ` style="--tone:${tone}"` : ""}>${githubPanelIcon(icon)}</span>
        <div class="btitles"><div class="brow"><span class="bname">${esc(title)}</span>${pillHtml}</div>${sub ? `<div class="bsub">${esc(sub)}</div>` : ""}</div></div>`;
  }

  /** The top bar across the page: GitHub, how many repositories are followed, the account and when the items were
   * fetched; Refresh, the account on GitHub and the integration as round buttons. Its menu button is kept. */
  _renderHead() {
    const root = this.shadowRoot;
    const info = root?.querySelector?.(".topbar .hinfo");
    if (!info) return;
    const esc = githubPanelEsc;
    const o = this._overview;
    root.querySelector(".topbar .banner")?.classList.toggle("night", Boolean(this._hass?.themes?.darkMode));
    const pill = o?.configured ? `<span class="stpill" role="status">${esc(this._t("summary", { followed: o.followed.length, offered: o.offered.length }))}</span>` : "";
    const sub = [o?.login ? `github.com/${o.login}` : "", this._fetchedLine(this._items)].filter(Boolean).join(" · ");
    info.innerHTML = `<span class="badge-ic">${githubPanelIcon("code")}</span>
      <div class="btitles"><div class="brow"><span class="bname">${esc(this._t("title"))}</span>${pill}</div>${sub ? `<div class="bsub">${esc(sub)}</div>` : ""}</div>`;
    const acts = root.querySelector(".topbar .hacts");
    const refresh = esc(this._t("refresh"));
    const cog = esc(this._t("open_integration"));
    const gh = esc(this._t("open_github"));
    acts.innerHTML = `<button data-action="head-refresh" class="${this._itemsBusy ? "spin" : ""}" title="${refresh}" aria-label="${refresh}"${this._itemsBusy ? " disabled" : ""}>${githubPanelIcon("refresh")}</button>
      ${o?.login ? `<a href="https://github.com/${esc(o.login)}" target="_blank" rel="noopener noreferrer" title="${gh}" aria-label="${gh}">${githubPanelIcon("open")}</a>` : ""}
      <a href="/config/integrations/integration/github" title="${cog}" aria-label="${cog}">${githubPanelIcon("cog")}</a>`;
    acts.querySelector("[data-action=head-refresh]")?.addEventListener("click", () => this._refreshItems());
  }

  /** "1.8K" in the panel's language. */
  _compact(n) {
    try {
      return new Intl.NumberFormat(this._lang(), { notation: "compact", maximumFractionDigits: 1 }).format(n);
    } catch (_err) {
      return String(n);
    }
  }

  /** The sum of a live counter over the followed repositories, or null when none is known. */
  _sum(key) {
    const values = (this._overview?.followed || []).map((r) => this._number(r, key)).filter((v) => v !== null);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  }

  /** The Repositories header's tiles: stars, open issues, open pull requests and downloads of the followed repositories. */
  _kpisHtml() {
    const esc = githubPanelEsc;
    const tile = (key, icon, tone, label) => {
      const v = this._sum(key);
      return `<div class="tile"><span class="ic ${tone}">${githubPanelIcon(icon)}</span><div class="kv"><b>${esc(v === null ? "—" : this._compact(v))}</b><span>${esc(this._t(label))}</span></div></div>`;
    };
    return [
      tile("stargazers_count", "star", "gold", "stars"),
      tile("issues_count", "issue", "good", "sort_issues"),
      tile("pulls_count", "pr", "acc", "sort_pulls"),
      tile("latest_release_downloads", "download", "blue", "downloads"),
    ].join("");
  }

  /** owner/name as two lines: the name, then the owner. */
  _repoWho(name) {
    const esc = githubPanelEsc;
    const [owner, repo] = String(name).split("/");
    return `<span class="n" title="${esc(name)}">${esc(repo || name)}</span><span class="s">${esc(owner)}</span>`;
  }

  _renderRepos() {
    const host = this.shadowRoot.getElementById?.("repos");
    if (!host) return;
    githubPanelKeepView(host, () => this._drawRepos(host));
  }

  _drawRepos(host) {
    const esc = githubPanelEsc;
    const o = this._overview;
    const top = (pill, sub, body) =>
      `<div class="card top">${this._banner("code", this._t("repos"), pill, sub)}<div class="cbody">${body}</div></div>`;
    if (!o) {
      host.innerHTML = top(null, this._t("loading"), "");
      return;
    }
    if (!o.configured) {
      host.innerHTML = top({ tone: "warn", text: this._t("add_github") }, "", `<div class="note">${esc(this._t("no_github"))}</div>
        <div class="bar"><button class="act" data-action="add-github">${githubPanelIcon("plus")}${esc(this._t("add_github"))}</button></div>`);
      this._bindRepos(host);
      return;
    }
    const rows = this._rows();
    const toFollow = rows.filter((r) => !r.followed).map((r) => r.name);
    // The selection keeps only repositories still offered (a follow, other settings, another panel)
    for (const name of this._selected) if (!o.offered.includes(name)) this._selected.delete(name);
    const selected = [...this._selected];
    const notes = [];
    if (o.state && o.state !== "loaded") notes.push(`<div class="note warn">${esc(this._t("not_loaded", { state: o.state }))}</div>`);
    if (o.offered_error && o.state === "loaded") notes.push(`<div class="note warn">${esc(this._t("offered_error"))}</div>`);
    if (this._busy) notes.push(`<div class="note" role="status">${esc(this._t("working"))}</div>`);
    else if (this._message) {
      // A failed load: tried again on its own, or at once with Retry.
      const retry = this._message === this._loadError ? ` <button class="act quiet" data-action="retry">${esc(this._t("retry"))}</button>` : "";
      notes.push(`<div class="note ${this._message.tone}" role="status">${esc(this._message.text)}${retry}</div>`);
    }
    const disabled = this._busy ? " disabled" : "";
    const rowHtml = (r) => {
      const link = `<a class="link" href="https://github.com/${esc(r.name)}" target="_blank" rel="noopener noreferrer" title="${esc(this._t("open_github"))}" aria-label="${esc(this._t("open_github"))}">${githubPanelIcon("open")}</a>`;
      if (this._confirm === r.name)
        return `<div class="row confirm"><div class="note">${esc(this._t("confirm_unfollow", { repo: r.name }))}</div>
          <div class="b"><button class="act quiet" data-action="cancel">${esc(this._t("cancel"))}</button>
          <button class="act bad" data-action="unfollow-confirmed" data-repo="${esc(r.name)}"${disabled}>${esc(this._t("unfollow"))}</button></div></div>`;
      if (!r.followed) {
        const label = esc(this._t("select_repo", { repo: r.name }));
        const on = this._selected.has(r.name);
        const box = `<input type="checkbox" class="pick-repo" data-repo="${esc(r.name)}" aria-label="${label}" title="${label}"${on ? " checked" : ""}${disabled}>`;
        return `<div class="row${on ? " sel" : ""}">${box}<span class="ic">${githubPanelIcon("code")}</span><div class="who">${this._repoWho(r.name)}</div>${link}
          <button class="act" data-action="follow" data-repo="${esc(r.name)}"${disabled}>${githubPanelIcon("plus")}${esc(this._t("follow"))}</button></div>`;
      }
      // A followed repository: the chevron or its name unfolds the GitHub Card's counters and latest activity under the row
      const open = this._expanded === r.name;
      return `<div class="row${open ? " open" : ""}">
          <button class="chev" data-action="expand" data-repo="${esc(r.name)}" aria-expanded="${open}" title="${esc(this._t("details"))}" aria-label="${esc(this._t("details"))}">${githubPanelIcon("chevron")}</button>
          <span class="ic acc">${githubPanelIcon("code")}</span>
          <button class="who fold" data-action="expand" data-repo="${esc(r.name)}" aria-expanded="${open}" title="${esc(this._t("details"))}">${this._repoWho(r.name)}</button>
          <span class="info" data-repo="${esc(r.name)}">${this._infoHtml(r.name)}</span>${link}
          <button class="act quiet" data-action="unfollow" data-repo="${esc(r.name)}"${disabled}>${esc(this._t("unfollow"))}</button></div>
        ${open ? `<div class="detail" data-repo="${esc(r.name)}">${this._detailHtml(r.name)}</div>` : ""}`;
    };
    const followedRows = rows.filter((r) => r.followed);
    const offeredRows = rows.filter((r) => !r.followed);
    const loadFailed = this._message && this._message === this._loadError;
    const account = this._accountHtml();
    const sorts = GITHUB_PANEL_SORTS.map(
      (v) => `<button data-sort="${v}" aria-pressed="${v === this._sort}">${esc(this._t(`sort_${v}`))}</button>`,
    ).join("");
    host.innerHTML = `
      ${top(null, "", `<div class="kpis">${this._kpisHtml()}</div>${notes.join("")}`)}
      <div id="handle">${this._handleHtml()}</div>
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("followed_head"))} · ${o.followed.length}</h2>
          <div class="seg" role="group" aria-label="${esc(this._t("sort_label"))}">${sorts}</div></div>
        <div class="rows">${followedRows.length ? followedRows.map(rowHtml).join("") : loadFailed ? "" : `<div class="note">${esc(this._t(o.followed.length ? "empty" : "no_followed"))}</div>`}</div>
      </div>
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("to_follow"))} · ${o.offered.length}</h2>
          <label class="search">${githubPanelIcon("search")}<input type="search" placeholder="${esc(this._t("search"))}" aria-label="${esc(this._t("search"))}" value="${esc(this._query)}"></label>
          <span class="pick-acts">${this._pickActsHtml(selected.length, toFollow.length)}</span>
        </div>
        <div class="rows">${offeredRows.length ? offeredRows.map(rowHtml).join("") : `<div class="note">${esc(this._t("empty"))}</div>`}</div>
      </div>
      <div class="card list account-card"${account ? "" : " hidden"}><div class="account-slot">${account}</div></div>`;
    this._bindRepos(host);
    this._renderHead();
  }

  /** Follow the selection / Follow all, redrawn alone when a box is ticked. */
  _pickActsHtml(selected, toFollow) {
    const esc = githubPanelEsc;
    const disabled = this._busy ? " disabled" : "";
    return `${selected ? `<button class="act" data-action="follow-selected"${disabled}>${githubPanelIcon("plus")}${esc(this._t("follow_selected", { n: selected }))}</button>` : ""}${
      toFollow > 1 ? `<button class="act quiet" data-action="follow-all"${disabled}>${esc(this._t("follow_all", { n: toFollow }))}</button>` : ""
    }`;
  }

  /** To handle: the latest open pull requests and issues of the followed repositories (the Issues and Pull
   * requests tabs hold the full lists); nothing before the items load or without followed repositories. */
  _handleHtml() {
    const esc = githubPanelEsc;
    const items = this._items;
    if (!items || items.pending || items.error || !this._overview?.followed?.length) return "";
    const pending = [...(items.pulls || []).map((i) => [i, "pulls"]), ...(items.issues || []).map((i) => [i, "issues"])]
      .sort((a, b) => String(b[0].updated || "").localeCompare(String(a[0].updated || "")))
      .slice(0, 6);
    return `<div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("to_handle"))}</h2></div>
        <div class="rows">${pending.length ? pending.map(([i, kind]) => this._itemHtml(i, kind)).join("") : `<div class="note">${esc(this._t("nothing_to_handle"))}</div>`}</div>
      </div>`;
  }

  /** Redraw only the To handle card (the items changed): the Repositories tab's search keeps its focus. */
  _renderHandle() {
    const slot = this.shadowRoot?.getElementById?.("handle");
    if (slot) slot.innerHTML = this._handleHtml();
  }

  /** Live counters of a followed repository, from its GitHub sensors: stars, open issues, open pull requests, release. */
  _infoHtml(repo) {
    const ids = this._overview?.sensors?.[repo] || {};
    const value = (key) => {
      const s = this._hass?.states?.[ids[key]];
      return s && s.state !== "unavailable" && s.state !== "unknown" ? s.state : null;
    };
    const count = (key, icon, label, cls) => {
      const v = value(key);
      if (v === null) return "";
      const n = Number(v);
      let text = v;
      try {
        text = Number.isFinite(n) ? new Intl.NumberFormat(this._lang(), { notation: "compact", maximumFractionDigits: 1 }).format(n) : v;
      } catch (_err) {
        // unknown locale: the raw value
      }
      return `<span class="${cls}" title="${githubPanelEsc(`${this._t(label)}: ${v}`)}">${githubPanelIcon(icon)}${githubPanelEsc(text)}</span>`;
    };
    return [
      count("stargazers_count", "star", "stars", "star"),
      count("issues_count", "issue", "issues", "ok"),
      count("pulls_count", "pr", "pulls", "pr"),
      count("latest_release", "tag", "release", "tag"),
      count("latest_release_downloads", "download", "downloads", "dl"),
    ].join("");
  }

  /** A GitHub sensor's live state object, or undefined. */
  _state(id) {
    return id ? this._hass?.states?.[id] : undefined;
  }

  /** Counter tiles (icon in its colour, label, compact value, exact value in the tooltip) of the sensors given. */
  _tilesHtml(ids, stats) {
    const esc = githubPanelEsc;
    const tiles = stats
      .filter(([key]) => ids[key])
      .map(([key, label, icon, cls]) => {
        const s = this._state(ids[key]);
        const v = s && s.state !== "" && Number.isFinite(Number(s.state)) ? Number(s.state) : null;
        let full = v === null ? "—" : String(v);
        try {
          if (v !== null) full = new Intl.NumberFormat(this._lang()).format(v);
        } catch (_err) {
          // unknown locale: the plain number
        }
        const title = esc(`${this._t(label)}: ${full}`);
        return `<div class="dt-tile c-${cls}" data-entity="${esc(ids[key])}" role="button" tabindex="0" title="${title}" aria-label="${title}">${githubPanelIcon(icon)}<div>
          <div class="k">${esc(this._t(label))}</div><div class="v">${v === null ? "—" : esc(this._compact(v))}</div></div></div>`;
      });
    return tiles.length ? `<div class="dt-tiles">${tiles.join("")}</div>` : "";
  }

  /** A link to a GitHub page (web links only: a state attribute never becomes a javascript: URL). */
  _ghLink(url) {
    const u = /^https?:\/\//i.test(String(url || "")) ? String(url) : "";
    const title = githubPanelEsc(this._t("open_github"));
    return u ? `<a class="dt-link" href="${githubPanelEsc(u)}" target="_blank" rel="noopener noreferrer" title="${title}" aria-label="${title}">${githubPanelIcon("open")}</a>` : "";
  }

  /** The unfolded repository: its counters, then its latest release, tag, commit, pull request, issue and discussion. */
  _detailHtml(repo) {
    const esc = githubPanelEsc;
    const ids = this._overview?.sensors?.[repo] || {};
    const rows = GITHUB_PANEL_LATEST.filter(([key]) => ids[key]).map(([key, icon]) => {
      const s = this._state(ids[key]);
      const a = s?.attributes || {};
      const unknown = !s || s.state === "unavailable" || s.state === "unknown";
      let value = unknown ? "—" : esc(String(s.state).split("\n")[0]);
      if (!unknown && key === "latest_commit" && a.sha) value += `<small>${esc(String(a.sha).slice(0, 7))}</small>`;
      if (!unknown && a.number !== undefined) value += `<small>#${esc(a.number)}</small>`;
      if (!unknown && key === "latest_release" && a.tag && a.tag !== s.state) value += `<small>${esc(a.tag)}</small>`;
      const label = esc(this._t(`d_${key}`));
      return `<div class="dt-row" data-entity="${esc(ids[key])}" role="button" tabindex="0" title="${label}">
          ${githubPanelIcon(icon)}<span class="k">${label}</span><span class="v">${value}</span>${unknown ? "" : this._ghLink(a.url)}</div>`;
    });
    const latest = rows.length ? `<div class="dt-latest">${rows.join("")}</div>` : "";
    const body = `${this._tilesHtml(ids, GITHUB_PANEL_REPO_STATS)}${latest}`;
    return body ? `<div class="dt">${body}</div>` : "";
  }

  /** The GitHub account (followers, following, public repositories and gists) under the lists: empty without its
   * sensors (disabled by default in the GitHub integration), and its card hidden then. */
  _accountHtml() {
    const ids = this._overview?.account || {};
    if (!Object.values(ids).some((id) => this._state(id))) return "";
    const tiles = this._tilesHtml(ids, GITHUB_PANEL_USER_STATS);
    if (!tiles) return "";
    const login = this._overview?.login || "";
    const label = githubPanelEsc(login ? `${this._t("d_account")} · ${login}` : this._t("d_account"));
    const link = login ? this._ghLink(`https://github.com/${login}`) : "";
    return `<div class="dt"><div><div class="dt-sec">${githubPanelIcon("account")}<span class="label" title="${label}">${label}</span>${link}</div>${tiles}</div></div>`;
  }

  /** Totals of the followed repositories for the head: stars, and open issues and pull requests. */
  _totalsHtml() {
    const sum = (key) => this._sum(key);
    const fmt = (n) => this._compact(n);
    const stars = sum("stargazers_count");
    const issues = sum("issues_count");
    const pulls = sum("pulls_count");
    const parts = [];
    if (stars !== null) parts.push(`<span title="${githubPanelEsc(`${this._t("stars")}: ${stars}`)}">${githubPanelIcon("star")}${fmt(stars)}</span>`);
    if (issues !== null || pulls !== null)
      parts.push(`<span>${githubPanelEsc(this._t("open_n", { n: fmt((issues || 0) + (pulls || 0)) }))}</span>`);
    return parts.join("");
  }

  /** Total downloads of the followed repositories, shown at the foot of the Repositories tab. */
  _downloadsTotalHtml() {
    const values = (this._overview?.followed || [])
      .map((r) => this._number(r, "latest_release_downloads"))
      .filter((v) => v !== null);
    if (!values.length) return "";
    const total = values.reduce((a, b) => a + b, 0);
    let n = String(total);
    try {
      n = new Intl.NumberFormat(this._lang()).format(total);
    } catch (_err) {
      // unknown locale: the plain number
    }
    return `${githubPanelIcon("download")}<span>${githubPanelEsc(this._t("total_downloads", { n }))}</span>`;
  }

  /** Counters of the rows follow the sensors without rebuilding the list (the search field keeps its focus). */
  _updateInfo() {
    const kpis = this.shadowRoot.querySelector?.("#repos .kpis");
    if (kpis) {
      const html = this._kpisHtml();
      if (kpis.innerHTML !== html) kpis.innerHTML = html;
    }
    const slot = this.shadowRoot.querySelector?.("#repos .account-slot");
    if (slot) {
      const html = this._accountHtml();
      if (slot.innerHTML !== html) slot.innerHTML = html;
      slot.closest(".account-card").hidden = !html;
    }
    for (const span of this.shadowRoot.querySelectorAll?.("#repos .info") || []) {
      const html = this._infoHtml(span.dataset.repo);
      if (span.innerHTML !== html) span.innerHTML = html;
    }
    for (const detail of this.shadowRoot.querySelectorAll?.("#repos .detail") || []) {
      const html = this._detailHtml(detail.dataset.repo);
      if (detail.innerHTML !== html) detail.innerHTML = html;
    }
  }

  _bindRepos(host) {
    for (const button of host.querySelectorAll("[data-sort]")) button.addEventListener("click", () => {
      this._sort = GITHUB_PANEL_SORTS.includes(button.dataset.sort) ? button.dataset.sort : "followed";
      // Remembered in this browser only, like the panel's other display choices
      try {
        localStorage.setItem("github_card.repos_sort", this._sort);
      } catch (_err) {
        // no storage (private window, blocked site data): the choice lasts until the page is left
      }
      this._renderRepos();
    });
    const input = host.querySelector("input[type=search]");
    input?.addEventListener("input", () => {
      this._query = input.value;
      const at = input.selectionStart;
      this._renderRepos();
      const again = this.shadowRoot.querySelector("#repos input[type=search]");
      again?.focus({ preventScroll: true });
      again?.setSelectionRange(at, at);
    });
    for (const box of host.querySelectorAll("input.pick-repo"))
      box.addEventListener("change", () => {
        if (box.checked) this._selected.add(box.dataset.repo);
        else this._selected.delete(box.dataset.repo);
        // Updated in place, not redrawn: the list stays where it was scrolled (Safari jumped to the top)
        const slot = host.querySelector(".pick-acts");
        if (!slot) return this._renderRepos();
        box.closest(".row")?.classList.toggle("sel", box.checked);
        slot.innerHTML = this._pickActsHtml(this._selected.size, this._rows().filter((r) => !r.followed).length);
        for (const button of slot.querySelectorAll("[data-action]"))
          button.addEventListener("click", () => this._repoAction(button.dataset.action, button.dataset.repo));
      });
    for (const button of host.querySelectorAll("[data-action]"))
      button.addEventListener("click", () => this._repoAction(button.dataset.action, button.dataset.repo));
  }

  _repoAction(action, repo) {
    if (action === "add-github") return this._navigate("/config/integrations/dashboard/add?domain=github");
    if (action === "retry") return this._reload();
    if (action === "follow") return this._follow([repo], []);
    // The ticked repositories, hidden by the search or not, in one command
    if (action === "follow-selected") return this._follow([...this._selected], []);
    if (action === "follow-all")
      return this._follow(
        this._rows()
          .filter((r) => !r.followed)
          .map((r) => r.name),
        [],
      );
    if (action === "unfollow") this._confirm = repo;
    if (action === "cancel") this._confirm = null;
    // One repository unfolded at a time; its name again folds it
    if (action === "expand") return this._toggleExpand(repo);
    if (action === "unfollow-confirmed") {
      this._confirm = null;
      return this._follow([], [repo]);
    }
    this._renderRepos();
  }

  /** Unfolds `repo` (folding the one open) in place, so the list keeps its scroll; redrawn if a row is missing. */
  _toggleExpand(repo) {
    const before = this._expanded;
    this._expanded = before === repo ? null : repo;
    const host = this.shadowRoot.getElementById?.("repos");
    const rows = [before, this._expanded].filter(Boolean).map((name) => [name, this._repoRow(host, name)]);
    if (!host?.querySelector || rows.some(([, row]) => !row)) return this._renderRepos();
    for (const [name, row] of rows) {
      const open = name === this._expanded;
      row.classList.toggle("open", open);
      for (const b of row.querySelectorAll('[data-action="expand"]')) b.setAttribute("aria-expanded", String(open));
      if (row.nextElementSibling?.classList.contains("detail")) row.nextElementSibling.remove();
      if (open) {
        const detail = document.createElement("div");
        detail.className = "detail";
        detail.dataset.repo = name;
        detail.innerHTML = this._detailHtml(name);
        row.after(detail);
      }
    }
  }

  /** The followed row of `repo` in the Repositories tab, or null. */
  _repoRow(host, repo) {
    for (const b of host?.querySelectorAll?.(".chev[data-repo]") || []) if (b.dataset.repo === repo) return b.closest(".row");
    return null;
  }

  /** Follows and unfollows in one command (one reload of the GitHub integration), then lists again. */
  async _follow(add, remove) {
    if (this._busy || (!add.length && !remove.length)) return;
    this._busy = true;
    this._message = null;
    this._renderRepos();
    try {
      const res = await this._hass.callWS({ type: "github_card/follow", add, remove });
      if (!res.ok) this._message = { tone: "bad", text: this._t("error", { error: res.error }) };
      else {
        this._selected.clear();
        const text = [this._t("done", { added: res.added.length, removed: res.removed.length })];
        if (res.skipped.length) text.push(this._t("skipped", { names: res.skipped.join(", ") }));
        this._message = { tone: res.skipped.length ? "warn" : "good", text: text.join(" · ") };
      }
    } catch (err) {
      this._message = { tone: "bad", text: this._t("error", { error: err?.message || err }) };
    }
    this._busy = false;
    // The followed repositories changed: show the items as loading until the background poller (triggered by the
    // follow on the server) pushes the new ones.
    this._items = null;
    this._renderItems("issues");
    this._renderItems("pulls");
    this._renderHandle();
    this._updateTabBadges();
    await this._load();
  }

  _navigate(path) {
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  // ── Issues and Pull requests tabs ──

  /** Open issues or pull requests across the followed repositories, for the tab badge; null for other tabs or before loading. */
  _tabCount(tab) {
    if (tab !== "issues" && tab !== "pulls") return null;
    if (!this._items || this._items.error) return null;
    return Object.values(this._items.totals || {}).reduce((n, t) => n + (t[tab] || 0), 0);
  }

  /** Refresh the open-count badge on the Issues and Pull requests tabs, after their items load. */
  _updateTabBadges() {
    const root = this.shadowRoot;
    for (const tab of ["issues", "pulls"]) {
      const button = root.getElementById?.(`tabbtn-${tab}`);
      if (!button) continue;
      const count = this._tabCount(tab);
      let badge = button.querySelector(".badge");
      if (count) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "badge";
          badge.setAttribute("aria-hidden", "true");
          button.appendChild(badge);
        }
        badge.textContent = String(count);
      } else if (badge) {
        badge.remove();
      }
    }
  }

  // The Refresh button: query GitHub now (out of the poller's cycle). The fresh items come back both as the
  // result and, because the server dispatches an update, through the items subscription.
  async _refreshItems() {
    this._itemsBusy = true;
    this._renderItems("issues");
    this._renderItems("pulls");
    this._renderHandle();
    try {
      this._items = await this._hass.callWS({ type: "github_card/items", refresh: true });
    } catch (err) {
      this._items = { issues: [], pulls: [], totals: {}, error: err?.message || String(err) };
    }
    this._itemsBusy = false;
    this._renderItems("issues");
    this._renderItems("pulls");
    this._renderHandle();
    this._updateTabBadges();
  }

  /** "3 days ago" in the panel's language. */
  _ago(iso) {
    const seconds = (Date.parse(iso) - Date.now()) / 1000;
    if (!Number.isFinite(seconds)) return "";
    const steps = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
    const [unit, size] = steps.find(([, n]) => Math.abs(seconds) >= n) || ["second", 1];
    try {
      return new Intl.RelativeTimeFormat(this._lang(), { numeric: "auto" }).format(Math.round(seconds / size), unit);
    } catch (_err) {
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(seconds / size), unit);
    }
  }

  // `hideAuthor`: the My pull requests tab, where every pull request is the viewer's own, so "by me" is noise.

  _itemHtml(item, kind, hideAuthor = false) {
    const esc = githubPanelEsc;
    const meta = [
      `${esc(item.repo)} #${esc(item.number)}`,
      item.author && !hideAuthor ? esc(this._t("by", { author: item.author })) : "",
      item.updated ? esc(this._t("updated", { when: this._ago(item.updated) })) : "",
    ].filter(Boolean);
    const pills = [];
    if (kind === "pulls") {
      const review = item.draft
        ? ["muted", "draft"]
        : { APPROVED: ["good", "approved"], CHANGES_REQUESTED: ["bad", "changes_requested"], REVIEW_REQUIRED: ["warn", "review_required"] }[item.review];
      if (review) pills.push(`<span class="rev ${review[0]}">${esc(this._t(review[1]))}</span>`);
      // The rolled-up state of the pull request's checks (My pull requests tab; absent elsewhere)
      const checks = {
        SUCCESS: ["good", "checks_passing"],
        FAILURE: ["bad", "checks_failing"],
        ERROR: ["bad", "checks_failing"],
        PENDING: ["warn", "checks_pending"],
        EXPECTED: ["warn", "checks_pending"],
      }[item.checks];
      if (checks) pills.push(`<span class="rev ${checks[0]}">${esc(this._t(checks[1]))}</span>`);
    }
    for (const label of item.labels || []) {
      const color = /^[0-9a-f]{6}$/i.test(label.color) ? `#${label.color}` : "var(--secondary-text-color)";
      pills.push(`<span class="lbl" style="--c:${color}">${esc(label.name)}</span>`);
    }
    if (item.comments) pills.push(`<span class="com" title="${esc(this._t("comments", { n: item.comments }))}">${githubPanelIcon("comment")}${esc(item.comments)}</span>`);
    const url = /^https:\/\/github\.com\//.test(item.url) ? item.url : `https://github.com/${item.repo}`;
    const tone = item.draft ? "" : kind === "pulls" ? "acc" : "good";
    return `<a class="row item${item.draft ? " draft" : ""}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
        <span class="ic ${tone}">${githubPanelIcon(kind === "pulls" ? "pr" : "issue")}</span>
        <div class="who"><span class="n t">${esc(item.title)}</span><span class="s">${meta.join(" · ")}</span></div>
        ${pills.length ? `<span class="cnt">${pills.join("")}</span>` : ""}
      </a>`;
  }

  /** When the items were last fetched, for the header's line: "updated 4 minutes ago". */
  _fetchedLine(data) {
    return data?.fetched_at ? this._t("updated", { when: this._ago(new Date(data.fetched_at * 1000).toISOString()) }) : "";
  }


  _renderItems(kind) {
    const host = this.shadowRoot.getElementById?.(kind);
    if (!host) return;
    githubPanelKeepView(host, () => this._drawItems(kind, host));
  }

  _drawItems(kind, host) {
    const esc = githubPanelEsc;
    const followed = this._overview?.followed || [];
    const icon = kind === "pulls" ? "pr" : "issue";
    const tone = kind === "pulls" ? "" : "var(--tone-good)";
    const top = (pill, sub, body) => `<div class="card top">${this._banner(icon, this._t(kind), pill, sub, tone)}<div class="cbody">${body}</div></div>`;
    // Never fetched yet (pending): the background poller has not delivered the first items.
    if (!this._items || this._items.pending) {
      host.innerHTML = top(null, this._t("loading"), "");
      return;
    }
    if (this._overview && !followed.length) {
      host.innerHTML = top(null, "", `<div class="note">${esc(this._t("no_followed"))}</div>`);
      return;
    }
    const all = this._items[kind] || [];
    const items = this._itemRepo ? all.filter((i) => i.repo === this._itemRepo) : all;
    const totalsAll = this._items.totals || {};
    const totals = Object.entries(totalsAll).filter(([repo]) => !this._itemRepo || repo === this._itemRepo);
    const total = totals.reduce((n, [, t]) => n + (t[kind] || 0), 0);
    const grand = Object.values(totalsAll).reduce((n, t) => n + (t[kind] || 0), 0);
    // Only the repositories with open items get a chip, the busiest first and five at most (there can be dozens of
    // followed repositories); the others are behind "+ N more", with a search that also finds the ones at 0.
    const count = (r) => totalsAll[r]?.[kind] || 0;
    const busy = [...new Set([...followed, ...Object.keys(totalsAll)])]
      .filter((r) => count(r) > 0 || r === this._itemRepo)
      .sort((a, b) => count(b) - count(a) || a.localeCompare(b));
    const quiet = [...new Set([...followed, ...Object.keys(totalsAll)])].filter((r) => !busy.includes(r)).sort((a, b) => a.localeCompare(b));
    const shown = busy.slice(0, 5);
    const rest = busy.slice(5);
    const chip = (repo, label, n, hidden) =>
      `<button class="chip" data-repo="${esc(repo)}" aria-pressed="${repo === (this._itemRepo || "")}"${hidden ? " hidden data-quiet" : ""}>${esc(label)}${n ? ` <em>${esc(this._compact(n))}</em>` : ""}</button>`;
    const more = rest.length || quiet.length
      ? `<details class="more"><summary class="chip">${esc(this._t("more_repos", { n: rest.length }))}${githubPanelIcon("chevron")}</summary><div class="pop">
          <label class="search">${githubPanelIcon("search")}<input type="search" placeholder="${esc(this._t("search"))}" aria-label="${esc(this._t("search"))}"></label>
          ${rest.map((r) => chip(r, r, count(r))).join("")}${quiet.map((r) => chip(r, r, 0, true)).join("")}</div></details>`
      : "";
    const chips = grand || this._itemRepo
      ? [chip("", this._t("all_repos"), grand)].concat(shown.map((r) => chip(r, r, count(r)))).join("") + (rest.length ? more : "")
      : "";
    const notes = [];
    if (this._items.error) notes.push(`<div class="note bad" role="status">${esc(this._t("items_error", { error: this._items.error }))}</div>`);
    host.innerHTML = `
      ${top({ tone: this._items.error ? "bad" : grand ? (kind === "pulls" ? "" : "good") : "muted", text: this._t("open_n", { n: this._compact(grand) }) }, this._fetchedLine(this._items),
        `<div class="chips">${chips}<span class="grow"></span>${items.length ? `<button class="act quiet" data-action="copy-links">${githubPanelIcon("copy")}${esc(this._t("copy_links"))}</button>` : ""}<button class="act quiet" data-action="refresh"${this._itemsBusy ? " disabled" : ""}>${githubPanelIcon("refresh")}${esc(this._t("refresh"))}</button></div>${notes.join("")}`)}
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("open_n", { n: this._compact(total) }))}</h2></div>
        <div class="rows">${items.length ? items.map((i) => this._itemHtml(i, kind)).join("") : `<div class="note">${esc(this._t(kind === "pulls" ? "no_pulls" : "no_issues"))}</div>`}</div>
      </div>`;
    // The search of "+ N more": the repositories with open items, and those at 0 once their name is typed
    host.querySelector(".more input")?.addEventListener("input", (ev) => {
      const q = ev.target.value.trim().toLowerCase();
      for (const b of host.querySelectorAll(".more .pop .chip")) {
        const match = !q || b.dataset.repo.toLowerCase().includes(q);
        b.hidden = b.hasAttribute("data-quiet") ? !q || !match : !match;
      }
    });
    this._renderHead();
    for (const button of host.querySelectorAll("button.chip"))
      button.addEventListener("click", () => {
        this._itemRepo = button.dataset.repo;
        this._renderItems("issues");
        this._renderItems("pulls");
    this._renderHandle();
      });
    host.querySelector("[data-action=refresh]")?.addEventListener("click", () => this._refreshItems());
    host.querySelector("[data-action=copy-links]")?.addEventListener("click", (ev) => this._copyLinks(items, ev.currentTarget));
  }

  /**
   * The links of the items listed (the repository filter applied), one per line, to the clipboard; the button says
   * "Links copied" for two seconds. Without the Clipboard API (Home Assistant over plain http), through a hidden
   * text area.
   */
  async _copyLinks(items, button) {
    const text = items.map((i) => (/^https:\/\/github\.com\//.test(i.url) ? i.url : `https://github.com/${i.repo}`)).join("\n");
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (_err) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      this.shadowRoot.appendChild(area);
      area.select();
      try {
        ok = document.execCommand("copy");
      } catch (_e) {
        ok = false;
      }
      area.remove();
    }
    if (!ok || !button?.isConnected) return;
    const label = githubPanelEsc(this._t("links_copied"));
    button.innerHTML = `${githubPanelIcon("check")}${label}`;
    clearTimeout(this._copyTimer);
    this._copyTimer = setTimeout(() => {
      if (button.isConnected) button.innerHTML = `${githubPanelIcon("copy")}${githubPanelEsc(this._t("copy_links"))}`;
    }, 2000);
  }

  // ── My pull requests tab ──

  // Load my open pull requests (any repository). The server caches them for a few minutes; the first open of the
  // tab fetches them, the Refresh button (refresh=true) asks GitHub again.
  async _loadMine(refresh = false) {
    if (!this._hass) return;
    this._mineBusy = true;
    this._renderMine();
    try {
      this._mine = await this._hass.callWS({ type: "github_card/mine", refresh });
    } catch (err) {
      this._mine = { pulls: [], error: err?.message || String(err) };
    }
    this._mineBusy = false;
    this._renderMine();
  }


  _renderMine() {
    const host = this.shadowRoot.getElementById?.("mine");
    if (!host) return;
    const esc = githubPanelEsc;
    const top = (pill, sub, body) => `<div class="card top">${this._banner("pr", this._t("mine"), pill, sub)}<div class="cbody">${body}</div></div>`;
    // Not opened yet, or the fetch is in flight: show loading.
    if (!this._mine || this._mine.pending || (this._mineBusy && !this._mine.pulls)) {
      host.innerHTML = top(null, this._t("loading"), "");
      return;
    }
    const pulls = this._mine.pulls || [];
    const notes = [];
    if (this._mine.error) notes.push(`<div class="note bad" role="status">${esc(this._t("items_error", { error: this._mine.error }))}</div>`);
    host.innerHTML = `
      ${top({ tone: this._mine.error ? "bad" : pulls.length ? "" : "muted", text: this._t("open_n", { n: pulls.length }) }, this._fetchedLine(this._mine),
        `<div class="chips"><span class="grow"></span><button class="act quiet" data-action="refresh"${this._mineBusy ? " disabled" : ""}>${githubPanelIcon("refresh")}${esc(this._t("refresh"))}</button></div>${notes.join("")}`)}
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("open_n", { n: pulls.length }))}</h2></div>
        <div class="rows">${pulls.length ? pulls.map((i) => this._itemHtml(i, "pulls", true)).join("") : `<div class="note">${esc(this._t("no_mine"))}</div>`}</div>
      </div>`;
    host.querySelector("[data-action=refresh]")?.addEventListener("click", () => this._loadMine(true));
  }

  // ── Settings tab ──

  _value(key) {
    return key in this._draft ? this._draft[key] : this._settings?.[key];
  }


  _changed() {
    return Object.keys(this._draft).some((k) => this._draft[k] !== this._settings?.[k]);
  }

  /** The Settings header card: its banner says whether the changes are saved. */
  _settingsTop() {
    const changed = this._changed();
    const patterns = this._value("filter") || "";
    // The tab's header opens the first settings card: alone in a card of its own, it was only an icon and a pill
    return `<div class="sethead">${this._banner("cog", this._t("settings"), { tone: changed ? "warn" : "good", text: this._t(changed ? "unsaved" : "up_to_date") }, patterns, "#7a8594")}</div>`;
  }

  _renderSettings() {
    const host = this.shadowRoot.getElementById?.("settings");
    if (!host) return;
    const esc = githubPanelEsc;
    if (!this._settings) {
      host.innerHTML = `<div class="card top">${this._banner("cog", this._t("settings"), null, this._t("loading"), "#7a8594")}</div>`;
      return;
    }
    const toggle = (key, label, hint) => `<label class="row toggle"><div class="who"><span class="n">${esc(this._t(label))}</span>${hint ? `<small>${esc(this._t(hint))}</small>` : ""}</div>
        <input type="checkbox" class="sw" role="switch" data-key="${key}"${this._value(key) ? " checked" : ""}></label>`;
    const minutes = Number(this._value("refresh_minutes") ?? 15);
    const presets = [5, 15, 30, 60];
    const other = this._refreshOther || !presets.includes(minutes);
    const preset = presets
      .map((m) => `<button data-refresh="${m}" aria-pressed="${!other && m === minutes}">${esc(m < 60 ? `${m} min` : `${m / 60} h`)}</button>`)
      .join("");
    const changed = this._changed();
    host.innerHTML = `
      <div class="card list">
        ${this._settingsTop()}
        <div class="lhead"><h2 class="lname">${esc(this._t("s_filter"))}</h2></div>
        <label class="ctl"><span>${esc(this._t("s_patterns"))}</span>
          <div class="field"><input type="text" data-key="filter" value="${esc(this._value("filter"))}" placeholder="juju35/ha-*" spellcheck="false"></div>
          <small>${esc(this._t("s_filter_hint"))}</small></label>
        <div class="rows">${toggle("include_starred", "s_starred", "s_starred_hint")}${toggle("ignore_archived", "s_archived", "s_archived_hint")}</div>
      </div>
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("s_group_notify"))}</h2></div>
        <div class="rows">${toggle("notify_issues", "s_notify_issues", "s_notify_hint")}${toggle("notify_pulls", "s_notify_pulls", "")}${toggle("notify_releases", "s_notify_releases", "")}</div>
      </div>
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("s_group_refresh"))}</h2></div>
        <div class="interval">
          <div class="seg" role="group" aria-label="${esc(this._t("s_refresh"))}">${preset}<button data-refresh="other" aria-pressed="${other}">${esc(this._t("other"))}</button></div>
          ${other ? `<label class="field" title="${esc(this._t("s_refresh"))}"><input type="number" inputmode="numeric" data-key="refresh_minutes" aria-label="${esc(this._t("s_refresh"))}" min="${GITHUB_PANEL_MIN_REFRESH}" max="${GITHUB_PANEL_MAX_REFRESH}" step="1" value="${esc(String(this._value("refresh_minutes")))}"></label>` : ""}
          <small class="note">${esc(this._t("s_refresh_hint"))}</small>
        </div>
      </div>
      <div class="card list">
        <div class="lhead"><h2 class="lname">${esc(this._t("s_group_panel"))}</h2></div>
        <div class="rows"><div class="row toggle"><div class="who"><span class="n">${esc(this._t("s_hide_toolbar"))}</span><small>${esc(this._t("s_hide_toolbar_hint"))}</small></div>
          <div class="seg" role="group" aria-label="${esc(this._t("s_hide_toolbar"))}">${["off", "all", "non_admin"]
            .map((m) => `<button data-hide="${m}" aria-pressed="${githubPanelHideMode(this._value("hide_toolbar")) === m}">${esc(this._t(`hide_${m}`))}</button>`)
            .join("")}</div></div></div>
      </div>
      <div class="card savebar"><button class="act" data-action="save"${changed ? "" : " disabled"}>${esc(this._t("save"))}</button>
        ${changed ? `<button class="act quiet" data-action="revert">${esc(this._t("cancel"))}</button>` : ""}
        <span class="note ${this._saved ? "good" : changed ? "warn" : ""}" role="status">${esc(this._saved ? this._t("saved") : changed ? this._t("unsaved") : "")}</span></div>`;
    for (const input of host.querySelectorAll("input[data-key]")) {
      input.addEventListener(input.type === "checkbox" ? "change" : "input", () => {
        this._draft[input.dataset.key] =
          input.type === "checkbox" ? input.checked : input.type === "number" ? Number(input.value) : input.value;
        this._saved = false;
        // Typing only refreshes the header, the button and the message, so the field keeps its focus
        const now = this._changed();
        const save = host.querySelector("[data-action=save]");
        if (save) save.disabled = !now;
        const note = host.querySelector(".savebar .note");
        if (note) {
          note.className = `note ${now ? "warn" : ""}`;
          note.textContent = now ? this._t("unsaved") : "";
        }
        const top = host.querySelector(".sethead");
        if (top && (top.dataset.changed !== String(now) || input.dataset.key === "filter")) {
          top.outerHTML = this._settingsTop();
          host.querySelector(".sethead").dataset.changed = String(now);
        }
      });
    }
    for (const button of host.querySelectorAll("[data-refresh]"))
      button.addEventListener("click", () => {
        if (button.dataset.refresh === "other") this._refreshOther = true;
        else {
          this._refreshOther = false;
          this._draft.refresh_minutes = Number(button.dataset.refresh);
          this._saved = false;
        }
        this._renderSettings();
      });
    for (const button of host.querySelectorAll("[data-hide]"))
      button.addEventListener("click", () => {
        this._draft.hide_toolbar = button.dataset.hide;
        if (this._draft.hide_toolbar === this._settings?.hide_toolbar) delete this._draft.hide_toolbar;
        this._saved = false;
        this._renderSettings();
      });
    host.querySelector("[data-action=save]")?.addEventListener("click", () => this._save());
    host.querySelector("[data-action=revert]")?.addEventListener("click", () => {
      this._draft = {};
      this._refreshOther = false;
      this._renderSettings();
    });
  }

  async _save() {
    const draft = { ...this._draft };
    if ("refresh_minutes" in draft) {
      const n = Math.round(Number(draft.refresh_minutes));
      draft.refresh_minutes = Number.isFinite(n)
        ? Math.min(GITHUB_PANEL_MAX_REFRESH, Math.max(GITHUB_PANEL_MIN_REFRESH, n))
        : this._settings.refresh_minutes;
    }
    try {
      const res = await this._hass.callWS({ type: "github_card/update_settings", ...draft });
      if (res.ok) {
        this._settings = res.settings;
        this._draft = {};
        this._saved = true;
        this._syncBare();
      }
    } catch (err) {
      console.error("GitHub panel: could not save the settings", err);
    }
    this._renderSettings();
    // The settings choose the repositories offered
    await this._load();
  }
}

if (!customElements.get("github-panel")) customElements.define("github-panel", GitHubPanel);
