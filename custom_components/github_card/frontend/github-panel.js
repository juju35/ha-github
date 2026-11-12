/*
 * GitHub panel for Home Assistant (administrators only)
 * https://github.com/juju35/ha-github
 *
 * Four tabs under the toolbar, as in Smart Comfort and IPTV (text tabs, the active one underlined, the tab in the
 * address, Settings last):
 * - Repositories: the repositories of your GitHub account (and your starred ones, if chosen), followed or not by the
 *   core GitHub integration; follow or stop following one, or follow all of them at once (one reload of the GitHub
 *   integration for the whole change), through the github_card/* WebSocket commands. Each followed repository shows
 *   its live counters and unfolds the GitHub Card's details; the head gives the totals (stars, open issues and pull
 *   requests), the GitHub account (followers…) closes the list;
 * - Issues and Pull requests: the open ones of the followed repositories, most recently updated first, from the
 *   GitHub API (github_card/items, cached 5 minutes by the integration; Refresh asks GitHub again);
 * - Settings: which repositories are offered (name patterns, starred ones) and the new issue / pull request
 *   notifications.
 */

const GITHUB_PANEL_VERSION = "2.5.0";
// No Activity tab since 2.3.0: the Repositories tab shows the same; /github-config/activity opens Repositories.
const GITHUB_PANEL_TABS = ["repos", "issues", "pulls", "settings"];
// Orders of the Repositories tab (see GitHubPanel._rows)
const GITHUB_PANEL_SORTS = ["followed", "name", "stars", "issues", "pulls"];

// Translations: one list per language, in the order of KEYS (the tests check the parity).
const GITHUB_PANEL_KEYS = [
  "title", "repos", "activity", "settings", "open_integration", "loading",
  "no_github", "add_github", "not_loaded", "offered_error",
  "summary", "search", "follow_all", "follow", "unfollow", "followed", "confirm_unfollow", "cancel",
  "working", "done", "skipped", "error", "empty", "open_github",
  "s_filter", "s_filter_hint", "s_starred", "s_starred_hint", "s_notify_issues", "s_notify_pulls", "s_notify_releases", "s_notify_hint",
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
    "Notify new issues", "Notify new pull requests", "Notify new releases",
    "A Home Assistant notification for each new issue or pull request of the followed repositories.",
    "Save", "Saved.",
    "Issues", "Pull requests", "Refresh", "No open issue in the followed repositories.", "No open pull request in the followed repositories.", "Follow repositories in the Repositories tab to see their issues and pull requests here.", "GitHub could not be queried ({error}). Try again later.", "Draft", "Approved", "Changes requested", "Review required", "by {author}", "updated {when}", "Comments: {n}", "All repositories", "Open: {n}",
    "Stars", "Latest release", "Show or hide the details",
    "Sort", "Followed first", "Name", "Stars", "Open issues", "Open pull requests",
    "Retry",
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
    "Notifier les nouvelles issues", "Notifier les nouvelles pull requests", "Notifier les nouvelles versions",
    "Une notification Home Assistant pour chaque nouvelle issue ou pull request des dépôts suivis.",
    "Enregistrer", "Enregistré.",
    "Issues", "Pull requests", "Actualiser", "Aucune issue ouverte dans les dépôts suivis.", "Aucune pull request ouverte dans les dépôts suivis.", "Suivez des dépôts dans l’onglet Dépôts pour voir ici leurs issues et pull requests.", "GitHub n’a pas pu être interrogé ({error}). Réessayez plus tard.", "Brouillon", "Approuvée", "Modifications demandées", "Revue requise", "par {author}", "mise à jour {when}", "Commentaires : {n}", "Tous les dépôts", "Ouvertes : {n}",
    "Étoiles", "Dernière version", "Afficher ou masquer le détail",
    "Tri", "Suivis d’abord", "Nom", "Étoiles", "Issues ouvertes", "Pull requests ouvertes",
    "Réessayer",
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
    "Neue Issues melden", "Neue Pull Requests melden", "Neue Releases melden",
    "Eine Home-Assistant-Benachrichtigung für jedes neue Issue oder jeden neuen Pull Request der verfolgten Repositorys.",
    "Speichern", "Gespeichert.",
    "Issues", "Pull Requests", "Aktualisieren", "Kein offenes Issue in den verfolgten Repositorys.", "Kein offener Pull Request in den verfolgten Repositorys.", "Verfolge Repositorys im Tab Repositorys, um hier ihre Issues und Pull Requests zu sehen.", "GitHub konnte nicht abgefragt werden ({error}). Versuche es später erneut.", "Entwurf", "Genehmigt", "Änderungen angefordert", "Review erforderlich", "von {author}", "aktualisiert {when}", "Kommentare: {n}", "Alle Repositorys", "Offen: {n}",
    "Sterne", "Neuestes Release", "Details ein- oder ausblenden",
    "Sortierung", "Verfolgte zuerst", "Name", "Sterne", "Offene Issues", "Offene Pull Requests",
    "Erneut versuchen",
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
    "Notificar nuevas issues", "Notificar nuevas pull requests", "Notificar nuevas versiones",
    "Una notificación de Home Assistant por cada nueva issue o pull request de los repositorios seguidos.",
    "Guardar", "Guardado.",
    "Issues", "Pull requests", "Actualizar", "Ninguna issue abierta en los repositorios seguidos.", "Ninguna pull request abierta en los repositorios seguidos.", "Sigue repositorios en la pestaña Repositorios para ver aquí sus issues y pull requests.", "No se pudo consultar GitHub ({error}). Inténtalo más tarde.", "Borrador", "Aprobada", "Cambios solicitados", "Revisión requerida", "por {author}", "actualizada {when}", "Comentarios: {n}", "Todos los repositorios", "Abiertas: {n}",
    "Estrellas", "Última versión", "Mostrar u ocultar el detalle",
    "Orden", "Seguidos primero", "Nombre", "Estrellas", "Issues abiertas", "Pull requests abiertas",
    "Reintentar",
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
    "Обавести о новим проблемима", "Обавести о новим pull захтевима", "Обавести о новим издањима",
    "Обавештење у Home Assistant-у за сваки нови проблем или pull захтев праћених репозиторијума.",
    "Сачувај", "Сачувано.",
    "Проблеми", "Pull захтеви", "Освежи", "Нема отворених проблема у праћеним репозиторијумима.", "Нема отворених pull захтева у праћеним репозиторијумима.", "Пратите репозиторијуме на картици Репозиторијуми да бисте овде видели њихове проблеме и pull захтеве.", "GitHub није могао да се упита ({error}). Покушајте касније.", "Нацрт", "Одобрен", "Тражене измене", "Потребан преглед", "аутор {author}", "ажурирано {when}", "Коментари: {n}", "Сви репозиторијуми", "Отворено: {n}",
    "Звездице", "Најновије издање", "Прикажи или сакриј детаље",
    "Редослед", "Прво праћени", "Име", "Звездице", "Отворени проблеми", "Отворени pull захтеви",
    "Покушај поново",
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
    "Obavesti o novim problemima", "Obavesti o novim pull zahtevima", "Obavesti o novim izdanjima",
    "Obaveštenje u Home Assistant-u za svaki novi problem ili pull zahtev praćenih repozitorijuma.",
    "Sačuvaj", "Sačuvano.",
    "Problemi", "Pull zahtevi", "Osveži", "Nema otvorenih problema u praćenim repozitorijumima.", "Nema otvorenih pull zahteva u praćenim repozitorijumima.", "Pratite repozitorijume na kartici Repozitorijumi da biste ovde videli njihove probleme i pull zahteve.", "GitHub nije mogao da se upita ({error}). Pokušajte kasnije.", "Nacrt", "Odobren", "Tražene izmene", "Potreban pregled", "autor {author}", "ažurirano {when}", "Komentari: {n}", "Svi repozitorijumi", "Otvoreno: {n}",
    "Zvezdice", "Najnovije izdanje", "Prikaži ili sakrij detalje",
    "Redosled", "Prvo praćeni", "Ime", "Zvezdice", "Otvoreni problemi", "Otvoreni pull zahtevi",
    "Pokušaj ponovo",
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
    "Notifica nuove issue", "Notifica nuove pull request", "Notifica nuove release",
    "Una notifica di Home Assistant per ogni nuova issue o pull request dei repository seguiti.",
    "Salva", "Salvato.",
    "Issue", "Pull request", "Aggiorna", "Nessuna issue aperta nei repository seguiti.", "Nessuna pull request aperta nei repository seguiti.", "Segui dei repository nella scheda Repository per vedere qui le loro issue e pull request.", "Impossibile interrogare GitHub ({error}). Riprova più tardi.", "Bozza", "Approvata", "Modifiche richieste", "Revisione richiesta", "di {author}", "aggiornata {when}", "Commenti: {n}", "Tutti i repository", "Aperte: {n}",
    "Stelle", "Ultima release", "Mostra o nascondi i dettagli",
    "Ordinamento", "Prima i seguiti", "Nome", "Stelle", "Issue aperte", "Pull request aperte",
    "Riprova",
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
    "Nieuwe issues melden", "Nieuwe pull requests melden", "Nieuwe releases melden",
    "Een Home Assistant-melding voor elke nieuwe issue of pull request van de gevolgde repositories.",
    "Opslaan", "Opgeslagen.",
    "Issues", "Pull requests", "Vernieuwen", "Geen open issue in de gevolgde repositories.", "Geen open pull request in de gevolgde repositories.", "Volg repositories in het tabblad Repositories om hier hun issues en pull requests te zien.", "GitHub kon niet worden bevraagd ({error}). Probeer het later opnieuw.", "Concept", "Goedgekeurd", "Wijzigingen gevraagd", "Review vereist", "door {author}", "bijgewerkt {when}", "Reacties: {n}", "Alle repositories", "Open: {n}",
    "Sterren", "Nieuwste release", "Details tonen of verbergen",
    "Sortering", "Gevolgde eerst", "Naam", "Sterren", "Open issues", "Open pull requests",
    "Opnieuw proberen",
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
    "Notificar novas issues", "Notificar novos pull requests", "Notificar novas versões",
    "Uma notificação do Home Assistant para cada nova issue ou pull request dos repositórios seguidos.",
    "Guardar", "Guardado.",
    "Issues", "Pull requests", "Atualizar", "Nenhuma issue em aberto nos repositórios seguidos.", "Nenhum pull request em aberto nos repositórios seguidos.", "Siga repositórios no separador Repositórios para ver aqui as suas issues e pull requests.", "Não foi possível consultar o GitHub ({error}). Tente mais tarde.", "Rascunho", "Aprovado", "Alterações pedidas", "Revisão necessária", "por {author}", "atualizado {when}", "Comentários: {n}", "Todos os repositórios", "Em aberto: {n}",
    "Estrelas", "Versão mais recente", "Mostrar ou ocultar o detalhe",
    "Ordenação", "Seguidos primeiro", "Nome", "Estrelas", "Issues em aberto", "Pull requests em aberto",
    "Tentar novamente",
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
    "Powiadamiaj o nowych zgłoszeniach", "Powiadamiaj o nowych pull requestach", "Powiadamiaj o nowych wydaniach",
    "Powiadomienie Home Assistant o każdym nowym zgłoszeniu lub pull requeście śledzonych repozytoriów.",
    "Zapisz", "Zapisano.",
    "Zgłoszenia", "Pull requesty", "Odśwież", "Brak otwartych zgłoszeń w śledzonych repozytoriach.", "Brak otwartych pull requestów w śledzonych repozytoriach.", "Śledź repozytoria w zakładce Repozytoria, aby zobaczyć tu ich zgłoszenia i pull requesty.", "Nie udało się odpytać GitHub ({error}). Spróbuj później.", "Szkic", "Zatwierdzony", "Wymagane zmiany", "Wymagana recenzja", "autor: {author}", "zaktualizowano {when}", "Komentarze: {n}", "Wszystkie repozytoria", "Otwarte: {n}",
    "Gwiazdki", "Najnowsze wydanie", "Pokaż lub ukryj szczegóły",
    "Sortowanie", "Najpierw śledzone", "Nazwa", "Gwiazdki", "Otwarte zgłoszenia", "Otwarte pull requesty",
    "Spróbuj ponownie",
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
    "Notifică issue-urile noi", "Notifică pull request-urile noi", "Notifică versiunile noi",
    "O notificare Home Assistant pentru fiecare issue sau pull request nou al depozitelor urmărite.",
    "Salvează", "Salvat.",
    "Issue-uri", "Pull request-uri", "Reîmprospătează", "Niciun issue deschis în depozitele urmărite.", "Niciun pull request deschis în depozitele urmărite.", "Urmărește depozite în fila Depozite pentru a vedea aici issue-urile și pull request-urile lor.", "GitHub nu a putut fi interogat ({error}). Încearcă mai târziu.", "Ciornă", "Aprobat", "Modificări solicitate", "Revizuire necesară", "de {author}", "actualizat {when}", "Comentarii: {n}", "Toate depozitele", "Deschise: {n}",
    "Stele", "Cea mai recentă versiune", "Afișează sau ascunde detaliile",
    "Sortare", "Mai întâi cele urmărite", "Nume", "Stele", "Issue-uri deschise", "Pull request-uri deschise",
    "Reîncearcă",
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
    "Giv besked om nye issues", "Giv besked om nye pull requests", "Giv besked om nye udgivelser",
    "En Home Assistant-meddelelse for hver ny issue eller pull request i de fulgte repositories.",
    "Gem", "Gemt.",
    "Issues", "Pull requests", "Opdater", "Ingen åbne issues i de fulgte repositories.", "Ingen åbne pull requests i de fulgte repositories.", "Følg repositories under fanen Repositories for at se deres issues og pull requests her.", "GitHub kunne ikke forespørges ({error}). Prøv igen senere.", "Kladde", "Godkendt", "Ændringer ønsket", "Gennemgang påkrævet", "af {author}", "opdateret {when}", "Kommentarer: {n}", "Alle repositories", "Åbne: {n}",
    "Stjerner", "Seneste udgivelse", "Vis eller skjul detaljer",
    "Sortering", "Fulgte først", "Navn", "Stjerner", "Åbne issues", "Åbne pull requests",
    "Prøv igen",
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
    "Meddela nya ärenden", "Meddela nya pull requests", "Meddela nya versioner",
    "En Home Assistant-avisering för varje nytt ärende eller ny pull request i de följda repona.",
    "Spara", "Sparat.",
    "Ärenden", "Pull requests", "Uppdatera", "Inga öppna ärenden i de följda repona.", "Inga öppna pull requests i de följda repona.", "Följ repon under fliken Repon för att se deras ärenden och pull requests här.", "GitHub kunde inte frågas ({error}). Försök igen senare.", "Utkast", "Godkänd", "Ändringar begärda", "Granskning krävs", "av {author}", "uppdaterad {when}", "Kommentarer: {n}", "Alla repon", "Öppna: {n}",
    "Stjärnor", "Senaste release", "Visa eller dölj detaljer",
    "Sortering", "Följda först", "Namn", "Stjärnor", "Öppna ärenden", "Öppna pull requests",
    "Försök igen",
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
    "Известявай за нови проблеми", "Известявай за нови pull заявки", "Известявай за нови версии",
    "Известие в Home Assistant за всеки нов проблем или pull заявка на следените хранилища.",
    "Запази", "Запазено.",
    "Проблеми", "Pull заявки", "Опресни", "Няма отворени проблеми в следените хранилища.", "Няма отворени pull заявки в следените хранилища.", "Следете хранилища в раздела Хранилища, за да виждате тук проблемите и pull заявките им.", "GitHub не можа да бъде запитан ({error}). Опитайте по-късно.", "Чернова", "Одобрена", "Поискани промени", "Нужен преглед", "от {author}", "обновено {when}", "Коментари: {n}", "Всички хранилища", "Отворени: {n}",
    "Звезди", "Последна версия", "Покажи или скрий подробностите",
    "Подреждане", "Първо следените", "Име", "Звезди", "Отворени проблеми", "Отворени pull заявки",
    "Опитай отново",
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
    "Уведомлять о новых задачах", "Уведомлять о новых pull-запросах", "Уведомлять о новых релизах",
    "Уведомление Home Assistant о каждой новой задаче или pull-запросе отслеживаемых репозиториев.",
    "Сохранить", "Сохранено.",
    "Задачи", "Pull-запросы", "Обновить", "Нет открытых задач в отслеживаемых репозиториях.", "Нет открытых pull-запросов в отслеживаемых репозиториях.", "Отслеживайте репозитории на вкладке «Репозитории», чтобы видеть здесь их задачи и pull-запросы.", "Не удалось запросить GitHub ({error}). Повторите позже.", "Черновик", "Одобрен", "Запрошены изменения", "Требуется ревью", "автор {author}", "обновлено {when}", "Комментарии: {n}", "Все репозитории", "Открыто: {n}",
    "Звёзды", "Последний релиз", "Показать или скрыть подробности",
    "Сортировка", "Сначала отслеживаемые", "Имя", "Звёзды", "Открытые задачи", "Открытые pull-запросы",
    "Повторить",
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
    "Сповіщати про нові задачі", "Сповіщати про нові pull-запити", "Сповіщати про нові релізи",
    "Сповіщення Home Assistant про кожну нову задачу або pull-запит відстежуваних репозиторіїв.",
    "Зберегти", "Збережено.",
    "Задачі", "Pull-запити", "Оновити", "Немає відкритих задач у відстежуваних репозиторіях.", "Немає відкритих pull-запитів у відстежуваних репозиторіях.", "Відстежуйте репозиторії на вкладці «Репозиторії», щоб бачити тут їхні задачі та pull-запити.", "Не вдалося запитати GitHub ({error}). Спробуйте пізніше.", "Чернетка", "Схвалено", "Запитано зміни", "Потрібне рев’ю", "автор {author}", "оновлено {when}", "Коментарі: {n}", "Усі репозиторії", "Відкрито: {n}",
    "Зірки", "Останній реліз", "Показати або приховати подробиці",
    "Сортування", "Спершу відстежувані", "Назва", "Зірки", "Відкриті задачі", "Відкриті pull-запити",
    "Повторити",
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
    "Új hibajegyek értesítése", "Új pull requestek értesítése", "Új kiadások értesítése",
    "Home Assistant értesítés a követett tárolók minden új hibajegyéről vagy pull requestjéről.",
    "Mentés", "Mentve.",
    "Hibajegyek", "Pull requestek", "Frissítés", "Nincs nyitott hibajegy a követett tárolókban.", "Nincs nyitott pull request a követett tárolókban.", "Kövess tárolókat a Tárolók lapon, hogy itt lásd a hibajegyeiket és pull requestjeiket.", "A GitHub nem volt lekérdezhető ({error}). Próbáld újra később.", "Piszkozat", "Jóváhagyva", "Módosítás kérve", "Felülvizsgálat szükséges", "szerző: {author}", "frissítve {when}", "Hozzászólások: {n}", "Minden tároló", "Nyitott: {n}",
    "Csillagok", "Legújabb kiadás", "Részletek megjelenítése vagy elrejtése",
    "Rendezés", "Követettek elöl", "Név", "Csillagok", "Nyitott hibajegyek", "Nyitott pull requestek",
    "Újra",
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
    "Upozorniť na nové problémy", "Upozorniť na nové pull requesty", "Upozorniť na nové vydania",
    "Upozornenie Home Assistant na každý nový problém alebo pull request sledovaných repozitárov.",
    "Uložiť", "Uložené.",
    "Problémy", "Pull requesty", "Obnoviť", "Žiadny otvorený problém v sledovaných repozitároch.", "Žiadny otvorený pull request v sledovaných repozitároch.", "Sledujte repozitáre na karte Repozitáre, aby ste tu videli ich problémy a pull requesty.", "GitHub sa nepodarilo opýtať ({error}). Skúste to neskôr.", "Koncept", "Schválené", "Požadované zmeny", "Vyžaduje sa kontrola", "autor {author}", "aktualizované {when}", "Komentáre: {n}", "Všetky repozitáre", "Otvorené: {n}",
    "Hviezdičky", "Najnovšie vydanie", "Zobraziť alebo skryť podrobnosti",
    "Zoradenie", "Najprv sledované", "Názov", "Hviezdičky", "Otvorené problémy", "Otvorené pull requesty",
    "Skúsiť znova",
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
    "Upozornit na nové problémy", "Upozornit na nové pull requesty", "Upozornit na nová vydání",
    "Oznámení Home Assistant pro každý nový problém nebo pull request sledovaných repozitářů.",
    "Uložit", "Uloženo.",
    "Problémy", "Pull requesty", "Obnovit", "Žádný otevřený problém ve sledovaných repozitářích.", "Žádný otevřený pull request ve sledovaných repozitářích.", "Sledujte repozitáře na kartě Repozitáře, abyste zde viděli jejich problémy a pull requesty.", "GitHub se nepodařilo dotázat ({error}). Zkuste to později.", "Koncept", "Schváleno", "Požadovány změny", "Vyžadována kontrola", "autor {author}", "aktualizováno {when}", "Komentáře: {n}", "Všechny repozitáře", "Otevřeno: {n}",
    "Hvězdičky", "Nejnovější vydání", "Zobrazit nebo skrýt podrobnosti",
    "Řazení", "Nejdřív sledované", "Název", "Hvězdičky", "Otevřené problémy", "Otevřené pull requesty",
    "Zkusit znovu",
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
    "Obvesti o novih težavah", "Obvesti o novih pull requestih", "Obvesti o novih izdajah",
    "Obvestilo Home Assistant za vsako novo težavo ali pull request spremljanih repozitorijev.",
    "Shrani", "Shranjeno.",
    "Težave", "Pull requesti", "Osveži", "V spremljanih repozitorijih ni odprtih težav.", "V spremljanih repozitorijih ni odprtih pull requestov.", "Spremljajte repozitorije na zavihku Repozitoriji, da tukaj vidite njihove težave in pull requeste.", "GitHuba ni bilo mogoče poizvedeti ({error}). Poskusite pozneje.", "Osnutek", "Odobreno", "Zahtevane spremembe", "Potreben pregled", "avtor {author}", "posodobljeno {when}", "Komentarji: {n}", "Vsi repozitoriji", "Odprto: {n}",
    "Zvezdice", "Najnovejša izdaja", "Prikaži ali skrij podrobnosti",
    "Razvrščanje", "Najprej spremljani", "Ime", "Zvezdice", "Odprte težave", "Odprti pull requesti",
    "Poskusi znova",
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
    "Paziņot par jaunām problēmām", "Paziņot par jauniem pull pieprasījumiem", "Paziņot par jauniem laidieniem",
    "Home Assistant paziņojums par katru jaunu sekoto krātuvju problēmu vai pull pieprasījumu.",
    "Saglabāt", "Saglabāts.",
    "Problēmas", "Pull pieprasījumi", "Atsvaidzināt", "Sekotajās krātuvēs nav atvērtu problēmu.", "Sekotajās krātuvēs nav atvērtu pull pieprasījumu.", "Sekojiet krātuvēm cilnē Krātuves, lai šeit redzētu to problēmas un pull pieprasījumus.", "GitHub nevarēja vaicāt ({error}). Mēģiniet vēlāk.", "Melnraksts", "Apstiprināts", "Pieprasītas izmaiņas", "Nepieciešama pārskatīšana", "autors {author}", "atjaunināts {when}", "Komentāri: {n}", "Visas krātuves", "Atvērti: {n}",
    "Zvaigznes", "Jaunākais laidiens", "Rādīt vai paslēpt informāciju",
    "Kārtošana", "Vispirms sekotās", "Nosaukums", "Zvaigznes", "Atvērtās problēmas", "Atvērtie pull pieprasījumi",
    "Mēģināt vēlreiz",
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
    "Ειδοποίηση για νέα ζητήματα", "Ειδοποίηση για νέα pull requests", "Ειδοποίηση για νέες εκδόσεις",
    "Μια ειδοποίηση Home Assistant για κάθε νέο ζήτημα ή pull request των παρακολουθούμενων αποθετηρίων.",
    "Αποθήκευση", "Αποθηκεύτηκε.",
    "Ζητήματα", "Pull requests", "Ανανέωση", "Κανένα ανοιχτό ζήτημα στα παρακολουθούμενα αποθετήρια.", "Κανένα ανοιχτό pull request στα παρακολουθούμενα αποθετήρια.", "Παρακολουθήστε αποθετήρια στην καρτέλα Αποθετήρια για να βλέπετε εδώ τα ζητήματα και τα pull requests τους.", "Δεν ήταν δυνατή η επικοινωνία με το GitHub ({error}). Δοκιμάστε αργότερα.", "Πρόχειρο", "Εγκρίθηκε", "Ζητήθηκαν αλλαγές", "Απαιτείται έλεγχος", "από {author}", "ενημερώθηκε {when}", "Σχόλια: {n}", "Όλα τα αποθετήρια", "Ανοιχτά: {n}",
    "Αστέρια", "Τελευταία έκδοση", "Εμφάνιση ή απόκρυψη λεπτομερειών",
    "Ταξινόμηση", "Πρώτα τα παρακολουθούμενα", "Όνομα", "Αστέρια", "Ανοιχτά ζητήματα", "Ανοιχτά pull requests",
    "Δοκιμή ξανά",
  ],
};

const GITHUB_PANEL_STRINGS = Object.fromEntries(
  Object.entries(GITHUB_PANEL_TRANSLATIONS).map(([l, list]) => [l, Object.fromEntries(GITHUB_PANEL_KEYS.map((k, i) => [k, list[i]]))]),
);

const githubPanelEsc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// mdi paths used by the panel (ha-icon is avoided so that the screenshots and tests need no frontend)
const GITHUB_PANEL_ICONS = {
  code: "M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z",
  open: "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z",
  cog: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",
  plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
  issue: "M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,9.5A2.5,2.5 0 0,0 9.5,12A2.5,2.5 0 0,0 12,14.5A2.5,2.5 0 0,0 14.5,12A2.5,2.5 0 0,0 12,9.5Z",
  pr: "M6,3A3,3 0 0,1 9,6C9,7.31 8.17,8.42 7,8.83V15.17C8.17,15.58 9,16.69 9,18A3,3 0 0,1 6,21A3,3 0 0,1 3,18C3,16.69 3.83,15.58 5,15.17V8.83C3.83,8.42 3,7.31 3,6A3,3 0 0,1 6,3M6,5A1,1 0 0,0 5,6A1,1 0 0,0 6,7A1,1 0 0,0 7,6A1,1 0 0,0 6,5M6,17A1,1 0 0,0 5,18A1,1 0 0,0 6,19A1,1 0 0,0 7,18A1,1 0 0,0 6,17M21,18A3,3 0 0,1 18,21A3,3 0 0,1 15,18C15,16.69 15.83,15.58 17,15.17V7H15V10.25L10.75,6L15,1.75V5H17A2,2 0 0,1 19,7V15.17C20.17,15.58 21,16.69 21,18M18,17A1,1 0 0,0 17,18A1,1 0 0,0 18,19A1,1 0 0,0 19,18A1,1 0 0,0 18,17Z",
  chevron: "M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z",
  star: "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z",
  tag: "M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.89,2 2,2.89 2,4V11C2,11.55 2.22,12.05 2.59,12.41L11.58,21.41C11.95,21.77 12.45,22 13,22C13.55,22 14.05,21.77 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.44 21.77,11.94 21.41,11.58Z",
  comment: "M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9Z",
  refresh: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
};
const githubPanelIcon = (name) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${GITHUB_PANEL_ICONS[name]}"/></svg>`;

class GitHubPanel extends HTMLElement {
  static STYLE = `
    :host { display:block; min-height:100%; background:var(--primary-background-color); color:var(--primary-text-color);
            --gh-accent:#8957e5; --tone-good:var(--success-color, #43a047); --tone-warn:var(--warning-color, #ffa600); --tone-bad:var(--error-color, #db4437); }
    .i { width:18px; height:18px; fill:currentColor; flex:none; }
    .toolbar { height:var(--header-height, 56px); display:flex; align-items:center; gap:8px; padding:0 12px; box-sizing:border-box;
               background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color, #fff);
               border-bottom:var(--app-header-border-bottom, none); font-size:20px; position:sticky; top:0; z-index:2; }
    .toolbar .grow { flex:1; }
    .toolbar a { color:inherit; display:flex; padding:8px; border-radius:50%; }
    .toolbar a .i { width:22px; height:22px; }
    .toolbar a:hover { background:rgba(255,255,255,.12); }
    /* Tabs under the toolbar, as in Smart Comfort: text, the active one underlined, sticky with the toolbar */
    .tabs { display:flex; gap:4px; padding:0 12px; overflow-x:auto; background:var(--app-header-background-color, var(--primary-color));
            position:sticky; top:var(--header-height, 56px); z-index:2; }
    .tab { background:none; border:none; border-bottom:2px solid transparent; color:var(--app-header-text-color, #fff); opacity:.75;
           padding:12px 14px; font:inherit; font-size:14px; cursor:pointer; white-space:nowrap; }
    .tab:hover, .tab:focus-visible { opacity:1; outline:none; }
    .tab.active { opacity:1; border-bottom-color:var(--app-header-text-color, #fff); }
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
    .info .star .i { color:#e3a008; } .info .ok .i { color:var(--tone-good); } .info .tag .i { color:var(--gh-accent); }
    .detail { padding:4px 0 12px 26px; }
    @media (max-width: 600px) { .info .tag, .info .ok:nth-child(3) { display:none; } .detail { padding-left:0; } }
    /* Confirmation in place of the row, like the card popups (at the top of what they act on) */
    .confirm { flex-direction:column; align-items:stretch; gap:8px; padding:10px 12px; margin:4px 0; border-radius:10px;
               border:1px solid color-mix(in srgb, var(--tone-bad) 45%, transparent); background:color-mix(in srgb, var(--tone-bad) 8%, transparent); }
    .confirm .b { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
    /* Narrow (phone): the name keeps the line, the chip goes */
    @media (max-width: 420px) { .row .chip { display:none; } }
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
  `;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "repos";
    this._overview = null;
    this._settings = null;
    this._draft = {};
    this._query = "";
    this._busy = false;
    this._message = null; // { tone, text }
    this._confirm = null; // repository whose unfollowing is being confirmed
    this._items = null; // open issues and pull requests, loaded with the first of their tabs
    this._itemsBusy = false;
    this._itemRepo = ""; // repository filter of the Issues and Pull requests tabs
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
  }

  set narrow(narrow) {
    this._narrow = narrow;
    if (this._menu) this._menu.narrow = narrow;
  }

  set hass(hass) {
    const first = !this._hass;
    const before = this._lang();
    this._hass = hass;
    if (this._menu) this._menu.hass = hass;
    if (!first) this._updateInfo();
    if (first) this._start();
    else if (this._lang() !== before) this._render();
  }

  connectedCallback() {
    if (this._hass && !this._unsub) this._subscribe();
    this._watchConnection(true);
    // Back on the panel after a failed load: try again now.
    if (this._hass && this._failed) this._reload();
  }

  disconnectedCallback() {
    this._watchConnection(false);
    clearTimeout(this._retryTimer);
    if (this._unsub) {
      this._unsub.then((off) => off()).catch(() => {});
      this._unsub = null;
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
    await Promise.all([this._loadSettings(), this._load(), this._needsItems() ? this._loadItems() : null]);
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

  // The data and the card (only the account and the unfolded repository use it) load side by side: waiting for the
  // card first held the whole panel empty until its bundle and its language file were in.
  async _start() {
    this._render();
    this._subscribe();
    this._watchConnection(this.isConnected);
    const version = this._panel?.config?.version || GITHUB_PANEL_VERSION;
    const card = customElements.get("github-card")
      ? null
      : import(`/github_card/github-card.js?v=${version}`)
          .then(() => customElements.whenDefined("github-card"))
          .then(() => {
            if (this._overview) this._renderRepos();
          })
          .catch((err) => console.error("GitHub panel: could not load the card", err));
    await Promise.all([this._reload(), card]);
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
      this._settings = this._settings || { filter: "", include_starred: false, notify_issues: false, notify_pulls: false, notify_releases: false };
      this._loadFailed = true;
    }
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
    if (this._hass && this._needsItems() && !this._items && !this._itemsBusy) this._loadItems();
  }

  _render() {
    const root = this.shadowRoot;
    const tabs = GITHUB_PANEL_TABS.map((tab) => {
      const selected = tab === this._tab;
      return `<button class="tab${selected ? " active" : ""}" role="tab" id="tabbtn-${tab}" data-tab="${tab}" aria-selected="${selected}" aria-controls="tab-${tab}" tabindex="${selected ? 0 : -1}">${githubPanelEsc(this._t(tab))}</button>`;
    }).join("");
    root.innerHTML = `
      <style>${GitHubPanel.STYLE}</style>
      <div class="toolbar">
        <ha-menu-button></ha-menu-button>
        <span class="grow">${githubPanelEsc(this._t("title"))}</span>
        <a href="/config/integrations/integration/github" title="${githubPanelEsc(this._t("open_integration"))}" aria-label="${githubPanelEsc(this._t("open_integration"))}">${githubPanelIcon("cog")}</a>
      </div>
      <div class="tabs" role="tablist">${tabs}</div>
      <main>
        <section id="tab-repos" role="tabpanel" aria-labelledby="tabbtn-repos"><div id="repos"></div></section>
        <section id="tab-issues" role="tabpanel" aria-labelledby="tabbtn-issues"><div id="issues"></div></section>
        <section id="tab-pulls" role="tabpanel" aria-labelledby="tabbtn-pulls"><div id="pulls"></div></section>
        <section id="tab-settings" role="tabpanel" aria-labelledby="tabbtn-settings"><div id="settings"></div></section>
      </main>`;
    this._menu = root.querySelector("ha-menu-button");
    if (this._menu) {
      this._menu.hass = this._hass;
      this._menu.narrow = this._narrow;
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
    this._renderSettings();
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

  _renderRepos() {
    const host = this.shadowRoot.getElementById?.("repos");
    if (!host) return;
    const esc = githubPanelEsc;
    const o = this._overview;
    if (!o) {
      host.innerHTML = `<div class="box"><div class="note">${esc(this._t("loading"))}</div></div>`;
      return;
    }
    if (!o.configured) {
      host.innerHTML = `<div class="box"><div class="note">${esc(this._t("no_github"))}</div>
        <div class="bar"><button class="act" data-action="add-github">${githubPanelIcon("plus")}${esc(this._t("add_github"))}</button></div></div>`;
      this._bindRepos(host);
      return;
    }
    const rows = this._rows();
    const toFollow = rows.filter((r) => !r.followed).map((r) => r.name);
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
    const list = rows.map((r) => {
      const link = `<a class="link" href="https://github.com/${esc(r.name)}" target="_blank" rel="noopener noreferrer" title="${esc(this._t("open_github"))}" aria-label="${esc(this._t("open_github"))}">${githubPanelIcon("open")}</a>`;
      if (this._confirm === r.name)
        return `<div class="row confirm"><div class="note">${esc(this._t("confirm_unfollow", { repo: r.name }))}</div>
          <div class="b"><button class="act quiet" data-action="cancel">${esc(this._t("cancel"))}</button>
          <button class="act bad" data-action="unfollow-confirmed" data-repo="${esc(r.name)}"${disabled}>${esc(this._t("unfollow"))}</button></div></div>`;
      const action = r.followed
        ? `<button class="act quiet" data-action="unfollow" data-repo="${esc(r.name)}"${disabled}>${esc(this._t("unfollow"))}</button>`
        : `<button class="act" data-action="follow" data-repo="${esc(r.name)}"${disabled}>${githubPanelIcon("plus")}${esc(this._t("follow"))}</button>`;
      if (!r.followed)
        return `<div class="row">${githubPanelIcon("code")}<span class="n" title="${esc(r.name)}">${esc(r.name)}</span>${link}${action}</div>`;
      // A followed repository: its name unfolds the GitHub Card's counters and latest activity under the row
      const open = this._expanded === r.name;
      return `<div class="row${open ? " open" : ""}">
          <button class="fold" data-action="expand" data-repo="${esc(r.name)}" aria-expanded="${open}" title="${esc(this._t("details"))}">
            ${githubPanelIcon("chevron")}<span class="n" title="${esc(r.name)}">${esc(r.name)}</span></button>
          <span class="info" data-repo="${esc(r.name)}">${this._infoHtml(r.name)}</span>${link}${action}</div>
        ${open ? `<div class="detail" data-repo="${esc(r.name)}"></div>` : ""}`;
    });
    host.innerHTML = `<div class="box">
        <div class="head">
          <span class="sum">${esc(this._t("summary", { followed: o.followed.length, offered: o.offered.length }))}<span class="totals">${this._totalsHtml()}</span></span>
          <select class="pick" data-sort aria-label="${esc(this._t("sort_label"))}" title="${esc(this._t("sort_label"))}">${GITHUB_PANEL_SORTS.map(
            (v) => `<option value="${v}"${v === this._sort ? " selected" : ""}>${esc(this._t(`sort_${v}`))}</option>`,
          ).join("")}</select>
          <label class="search"><input type="search" placeholder="${esc(this._t("search"))}" aria-label="${esc(this._t("search"))}" value="${esc(this._query)}"></label>
          ${toFollow.length > 1 ? `<button class="act" data-action="follow-all"${disabled}>${githubPanelIcon("plus")}${esc(this._t("follow_all", { n: toFollow.length }))}</button>` : ""}
        </div>
        ${notes.join("")}
        <div class="list">${list.length ? list.join("") : this._message && this._message === this._loadError ? "" : `<div class="note">${esc(this._t("empty"))}</div>`}</div>
        <div class="account-slot"></div>
      </div>`;
    this._bindRepos(host);
    this._mountDetail(host);
    this._mountAccount(host);
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
      count("pulls_count", "pr", "pulls", "ok"),
      count("latest_release", "tag", "release", "tag"),
    ].join("");
  }

  /** The embedded GitHub Card of the unfolded repository, kept across re-renders (and its hass kept current). */
  _mountDetail(host) {
    const slot = host.querySelector(".detail");
    if (!slot || !customElements.get("github-card")) return;
    const repo = slot.dataset.repo;
    if (this._detail?.repo !== repo) {
      const card = document.createElement("github-card");
      card.setConfig({ embed: true, repositories: [repo], show_account: false });
      this._detail = { repo, card };
    }
    this._detail.card.hass = this._hass;
    slot.appendChild(this._detail.card);
  }

  /** The GitHub account (followers, following, public repositories and gists) under the list: the card's section. */
  _mountAccount(host) {
    const slot = host.querySelector(".account-slot");
    if (!slot || !customElements.get("github-card")) return;
    if (!this._account) {
      this._account = document.createElement("github-card");
      this._account.setConfig({ embed: true });
    }
    this._account.hass = this._hass;
    slot.appendChild(this._account);
    // The separator only when the card shows the account (its sensors are disabled by default)
    slot.classList.toggle("on", !!this._account.shadowRoot?.innerHTML);
  }

  /** Totals of the followed repositories for the head: stars, and open issues and pull requests. */
  _totalsHtml() {
    const sum = (key) => {
      const values = (this._overview?.followed || []).map((r) => this._number(r, key)).filter((v) => v !== null);
      return values.length ? values.reduce((a, b) => a + b, 0) : null;
    };
    const fmt = (n) => {
      try {
        return new Intl.NumberFormat(this._lang(), { notation: "compact", maximumFractionDigits: 1 }).format(n);
      } catch (_err) {
        return String(n);
      }
    };
    const stars = sum("stargazers_count");
    const issues = sum("issues_count");
    const pulls = sum("pulls_count");
    const parts = [];
    if (stars !== null) parts.push(`<span title="${githubPanelEsc(`${this._t("stars")}: ${stars}`)}">${githubPanelIcon("star")}${fmt(stars)}</span>`);
    if (issues !== null || pulls !== null)
      parts.push(`<span>${githubPanelEsc(this._t("open_n", { n: fmt((issues || 0) + (pulls || 0)) }))}</span>`);
    return parts.join("");
  }

  /** Counters of the rows follow the sensors without rebuilding the list (the search field keeps its focus). */
  _updateInfo() {
    const totals = this.shadowRoot.querySelector?.("#repos .totals");
    if (totals) {
      const html = this._totalsHtml();
      if (totals.innerHTML !== html) totals.innerHTML = html;
    }
    if (this._account) {
      this._account.hass = this._hass;
      this.shadowRoot.querySelector?.("#repos .account-slot")?.classList.toggle("on", !!this._account.shadowRoot?.innerHTML);
    }
    for (const span of this.shadowRoot.querySelectorAll?.("#repos .info") || []) {
      const html = this._infoHtml(span.dataset.repo);
      if (span.innerHTML !== html) span.innerHTML = html;
    }
    if (this._detail) this._detail.card.hass = this._hass;
  }

  _bindRepos(host) {
    host.querySelector("select[data-sort]")?.addEventListener("change", (ev) => {
      this._sort = GITHUB_PANEL_SORTS.includes(ev.target.value) ? ev.target.value : "followed";
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
      again?.focus();
      again?.setSelectionRange(at, at);
    });
    for (const button of host.querySelectorAll("[data-action]"))
      button.addEventListener("click", () => this._repoAction(button.dataset.action, button.dataset.repo));
  }

  _repoAction(action, repo) {
    if (action === "add-github") return this._navigate("/config/integrations/dashboard/add?domain=github");
    if (action === "retry") return this._reload();
    if (action === "follow") return this._follow([repo], []);
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
    if (action === "expand") this._expanded = this._expanded === repo ? null : repo;
    if (action === "unfollow-confirmed") {
      this._confirm = null;
      return this._follow([], [repo]);
    }
    this._renderRepos();
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
        const text = [this._t("done", { added: res.added.length, removed: res.removed.length })];
        if (res.skipped.length) text.push(this._t("skipped", { names: res.skipped.join(", ") }));
        this._message = { tone: res.skipped.length ? "warn" : "good", text: text.join(" · ") };
      }
    } catch (err) {
      this._message = { tone: "bad", text: this._t("error", { error: err?.message || err }) };
    }
    this._busy = false;
    // Other repositories followed: their issues and pull requests next time a tab shows them
    this._items = null;
    await this._load();
    if (this._needsItems()) this._loadItems();
  }

  _navigate(path) {
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  // ── Issues and Pull requests tabs ──

  _needsItems() {
    return this._tab === "issues" || this._tab === "pulls";
  }

  async _loadItems(refresh = false) {
    this._itemsBusy = true;
    this._renderItems("issues");
    this._renderItems("pulls");
    try {
      this._items = await this._hass.callWS({ type: "github_card/items", refresh });
    } catch (err) {
      this._items = { issues: [], pulls: [], totals: {}, error: err?.message || String(err) };
    }
    this._itemsBusy = false;
    this._renderItems("issues");
    this._renderItems("pulls");
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

  _itemHtml(item, kind) {
    const esc = githubPanelEsc;
    const meta = [
      `<span>${esc(item.repo)} #${esc(item.number)}</span>`,
      item.author ? `<span>${esc(this._t("by", { author: item.author }))}</span>` : "",
      item.updated ? `<span title="${esc(item.updated)}">${esc(this._t("updated", { when: this._ago(item.updated) }))}</span>` : "",
      item.comments ? `<span title="${esc(this._t("comments", { n: item.comments }))}">${githubPanelIcon("comment")}${esc(item.comments)}</span>` : "",
    ];
    if (kind === "pulls") {
      const review = item.draft
        ? ["muted", "draft"]
        : { APPROVED: ["good", "approved"], CHANGES_REQUESTED: ["bad", "changes_requested"], REVIEW_REQUIRED: ["warn", "review_required"] }[item.review];
      if (review) meta.push(`<span class="rev ${review[0]}">${esc(this._t(review[1]))}</span>`);
    }
    for (const label of item.labels || []) {
      const color = /^[0-9a-f]{6}$/i.test(label.color) ? `#${label.color}` : "var(--secondary-text-color)";
      meta.push(`<span class="lbl" style="--c:${color}">${esc(label.name)}</span>`);
    }
    const url = /^https:\/\/github\.com\//.test(item.url) ? item.url : `https://github.com/${item.repo}`;
    return `<a class="item${item.draft ? " draft" : ""}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">
        ${githubPanelIcon(kind === "pulls" ? "pr" : "issue")}
        <div class="body"><span class="t">${esc(item.title)}</span><div class="m">${meta.filter(Boolean).join("")}</div></div>
      </a>`;
  }

  _renderItems(kind) {
    const host = this.shadowRoot.getElementById?.(kind);
    if (!host) return;
    const esc = githubPanelEsc;
    const followed = this._overview?.followed || [];
    if (!this._items) {
      host.innerHTML = `<div class="box"><div class="note">${esc(this._t("loading"))}</div></div>`;
      return;
    }
    if (this._overview && !followed.length) {
      host.innerHTML = `<div class="box"><div class="note">${esc(this._t("no_followed"))}</div></div>`;
      return;
    }
    const all = this._items[kind] || [];
    const items = this._itemRepo ? all.filter((i) => i.repo === this._itemRepo) : all;
    const totals = Object.entries(this._items.totals || {}).filter(([repo]) => !this._itemRepo || repo === this._itemRepo);
    const total = totals.reduce((n, [, t]) => n + (t[kind] || 0), 0);
    const repos = [...new Set([...followed, ...Object.keys(this._items.totals || {})])].sort((a, b) => a.localeCompare(b));
    const options = [`<option value="">${esc(this._t("all_repos"))}</option>`]
      .concat(repos.map((r) => `<option value="${esc(r)}"${r === this._itemRepo ? " selected" : ""}>${esc(r)}</option>`))
      .join("");
    const notes = [];
    if (this._items.error) notes.push(`<div class="note bad" role="status">${esc(this._t("items_error", { error: this._items.error }))}</div>`);
    host.innerHTML = `<div class="box">
        <div class="head">
          <span class="sum">${esc(this._t("open_n", { n: total }))}</span>
          <select class="pick" aria-label="${esc(this._t("all_repos"))}">${options}</select>
          <button class="act" data-action="refresh"${this._itemsBusy ? " disabled" : ""}>${githubPanelIcon("refresh")}${esc(this._t("refresh"))}</button>
        </div>
        ${notes.join("")}
        <div class="list">${items.length ? items.map((i) => this._itemHtml(i, kind)).join("") : `<div class="note">${esc(this._t(kind === "pulls" ? "no_pulls" : "no_issues"))}</div>`}</div>
      </div>`;
    host.querySelector("select")?.addEventListener("change", (ev) => {
      this._itemRepo = ev.target.value;
      this._renderItems("issues");
      this._renderItems("pulls");
    });
    host.querySelector("[data-action=refresh]")?.addEventListener("click", () => this._loadItems(true));
  }

  // ── Settings tab ──

  _value(key) {
    return key in this._draft ? this._draft[key] : this._settings?.[key];
  }

  _renderSettings() {
    const host = this.shadowRoot.getElementById?.("settings");
    if (!host) return;
    const esc = githubPanelEsc;
    if (!this._settings) {
      host.innerHTML = `<div class="box"><div class="note">${esc(this._t("loading"))}</div></div>`;
      return;
    }
    const toggle = (key, label, hint) => `<label class="toggle"><div><span>${esc(this._t(label))}</span>${hint ? `<small>${esc(this._t(hint))}</small>` : ""}</div>
        <input type="checkbox" data-key="${key}"${this._value(key) ? " checked" : ""}></label>`;
    const changed = Object.keys(this._draft).some((k) => this._draft[k] !== this._settings[k]);
    host.innerHTML = `<div class="box form">
        <label class="ctl"><span>${esc(this._t("s_filter"))}</span>
          <div class="field"><input type="text" data-key="filter" value="${esc(this._value("filter"))}" placeholder="juju35/ha-*" spellcheck="false"></div>
          <small>${esc(this._t("s_filter_hint"))}</small></label>
        ${toggle("include_starred", "s_starred", "s_starred_hint")}
        ${toggle("notify_issues", "s_notify_issues", "s_notify_hint")}
        ${toggle("notify_pulls", "s_notify_pulls", "")}
        ${toggle("notify_releases", "s_notify_releases", "")}
        <div class="bar"><button class="act" data-action="save"${changed ? "" : " disabled"}>${esc(this._t("save"))}</button>
          ${this._saved ? `<span class="note good" role="status">${esc(this._t("saved"))}</span>` : ""}</div>
      </div>`;
    for (const input of host.querySelectorAll("input[data-key]")) {
      input.addEventListener(input.type === "checkbox" ? "change" : "input", () => {
        this._draft[input.dataset.key] = input.type === "checkbox" ? input.checked : input.value;
        this._saved = false;
        // Typing only refreshes the button, so the field keeps its focus
        const save = host.querySelector("[data-action=save]");
        if (save) save.disabled = !Object.keys(this._draft).some((k) => this._draft[k] !== this._settings[k]);
        host.querySelector(".note.good")?.remove();
      });
    }
    host.querySelector("[data-action=save]")?.addEventListener("click", () => this._save());
  }

  async _save() {
    try {
      const res = await this._hass.callWS({ type: "github_card/update_settings", ...this._draft });
      if (res.ok) {
        this._settings = res.settings;
        this._draft = {};
        this._saved = true;
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
