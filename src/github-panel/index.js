// Entry point: the modules in their original order. scripts/build-frontend.mjs (scripts/bundle.mjs) concatenates them
// in this order into the single classic script the integration serves.
import "./core.js";
import "./i18n/github-panel-translations.js";
import "./helpers.js";
import "./fold-css.js";
import "./fold.js";
import "./panel.js";
