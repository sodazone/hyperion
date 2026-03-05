import Alpine from "alpinejs";
import htmx from "htmx.org";

import { dashboard } from "./dashboard";
import { multiselect } from "./multiselect";
import { pagination } from "./pagination";
import { richSelect } from "./rich-select";
import { sidebar } from "./sidebar";

window.Alpine = Alpine;
window.htmx = htmx;

Alpine.data("sidebar", sidebar);
Alpine.data("dashboard", dashboard);
Alpine.data("richSelect", richSelect);
Alpine.data("multiselect", multiselect);
Alpine.data("pagination", pagination);

Alpine.start();
