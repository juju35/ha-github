// Entry point: the modules in their original order. scripts/build-frontend.mjs (scripts/bundle.mjs) concatenates them
// in this order into the single classic script the integration serves.
import "./card-picker.js";
import "./core.js";
import "./i18n/translations.js";
import "./strings.js";
import "./helpers.js";
import "./discovery.js";
import "./styles.js";
import "./cards.js";
import "./visual-editors.js";
import "./register.js";
