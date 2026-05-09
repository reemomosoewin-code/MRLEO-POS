// ============================================================
//  main.js — Entry point. Imports everything to wire up the app.
//  This is the ONE file you put in <script type="module"> in index.html
// ============================================================

import { initPWA }   from './pwa.js';
import { boot }      from './auth.js';

// All window.* bindings happen inside each module's own file.
// main.js just needs to import them so the browser loads the modules.
import './pin.js';
import './session.js';
import './pos.js';
import './sales.js';
import './expenses.js';
import './reports.js';
import './commission.js';
import './admin.js';
import './superadmin.js';
import './ui.js';
import './utils.js';

// Boot sequence
initPWA();
window.onload = boot;
