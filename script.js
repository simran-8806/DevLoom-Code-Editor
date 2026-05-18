/* ═══════════════════════════════════════════════════
   DevLoom — script.js
   Full application logic for the online code editor
═══════════════════════════════════════════════════ */

/* ══════════════════════════════════════
   1. CONSTANTS & STATE
══════════════════════════════════════ */

/** localStorage key for persisting code */
const STORAGE_KEY = 'devloom_project';

/** Which tab is currently active: 'html' | 'css' | 'js' */
let activeTab = 'html';

/** Current theme: 'dark' | 'light' */
let currentTheme = localStorage.getItem('codeforge_theme') || 'dark';

/** Auto-run debounce timer */
let autoRunTimer = null;

/** Whether the code has been saved since last edit */
let isSaved = true;

/** Number of console errors shown (for badge) */
let consoleErrorCount = 0;

/** References to the three CodeMirror instances */
let editors = {};

/** Default starter code for a brand-new file */
const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Page</title>
</head>
<body>

  <h1>Hello, Devloom! 👋</h1>
  <p>Edit the HTML, CSS, and JS tabs and click <strong>Run</strong>.</p>
  <button id="btn">Click me</button>

</body>
</html>`;

const DEFAULT_CSS = `/* Global styles */
body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #e0e0e0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px;
}

h1 {
  font-size: 2.5rem;
  background: linear-gradient(90deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 12px;
}

p {
  color: #94a3b8;
  font-size: 1rem;
  margin-bottom: 24px;
}

button {
  padding: 10px 28px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover {
  background: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
}`;

const DEFAULT_JS = `// Your JavaScript goes here
const btn = document.getElementById('btn');

btn.addEventListener('click', () => {
  const messages = [
    'Hello from CodeForge! 🚀',
    'You clicked me again! 😄',
    'Keep coding! 💻',
    'You are awesome! ⭐',
  ];
  const random = messages[Math.floor(Math.random() * messages.length)];
  alert(random);
  console.log('Button clicked:', random);
});

console.log('Script loaded successfully ✅');`;


/* ══════════════════════════════════════
   2. DOM REFERENCES
══════════════════════════════════════ */
const $ = id => document.getElementById(id);

const elBody          = document.body;
const elHtml          = document.documentElement;
const elTabs          = document.querySelectorAll('.tab');
const elOutputTabs    = document.querySelectorAll('.output-tab');
const elBtnRun        = $('btnRun');
const elBtnNew        = $('btnNew');
const elBtnSave       = $('btnSave');
const elBtnDownload   = $('btnDownload');
const elBtnTheme      = $('btnTheme');
const elBtnCopy       = $('btnCopy');
const elBtnFormat     = $('btnFormat');
const elBtnRefresh    = $('btnRefresh');
const elBtnClearConsole = $('btnClearConsole');
const elPreviewFrame  = $('previewFrame');
const elConsoleOutput = $('consoleOutput');
const elConsoleBadge  = $('consoleBadge');
const elAutoRun       = $('autoRun');
const elFileTitle     = $('fileTitle');
const elStatusLang    = $('statusLang');
const elStatusCursor  = $('statusCursor');
const elStatusSaved   = $('statusSaved');
const elStatusMsg     = $('statusMsg');
const elModalNewFile  = $('modalNewFile');
const elModalCancel   = $('modalCancel');
const elModalConfirm  = $('modalConfirm');
const elToast         = $('toast');
const elResizeHandle  = $('resizeHandle');
const elEditorPanel   = $('editorPanel');
const elOutputPanel   = $('outputPanel');
const elThemeIcon     = $('themeIcon');


/* ══════════════════════════════════════
   3. CODEMIRROR SETUP
══════════════════════════════════════ */

/**
 * Initialize a CodeMirror instance on a given textarea element.
 * @param {string} id - ID of the textarea element
 * @param {string} mode - CodeMirror language mode
 */
function initEditor(id, mode) {
  const textarea = document.getElementById(id);

  const cm = CodeMirror.fromTextArea(textarea, {
    mode,
    theme: currentTheme === 'dark' ? 'dracula' : 'eclipse',
    lineNumbers: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    autoCloseTags: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    styleActiveLine: true,
    lineWrapping: false,
    extraKeys: {
      // Ctrl+Enter or Cmd+Enter = Run
      'Ctrl-Enter':  () => runCode(),
      'Cmd-Enter':   () => runCode(),
      // Ctrl+S = Save
      'Ctrl-S':      (cm) => { cm.save(); saveCode(); return false; },
      'Cmd-S':       (cm) => { cm.save(); saveCode(); return false; },
      // Tab inserts spaces
      'Tab': (cm) => {
        if (cm.somethingSelected()) { cm.indentSelection('add'); }
        else { cm.replaceSelection('  ', 'end'); }
      },
    },
  });

  // Track cursor position for status bar
  cm.on('cursorActivity', (instance) => {
    const cursor = instance.getCursor();
    elStatusCursor.textContent = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
  });

  // Mark as unsaved on every change
  cm.on('change', () => {
    markUnsaved();
    if (elAutoRun.checked) {
      clearTimeout(autoRunTimer);
      autoRunTimer = setTimeout(runCode, 800); // debounce 800ms
    }
  });

  return cm;
}

// Boot all three editors
editors.html = initEditor('editor-html', 'htmlmixed');
editors.css  = initEditor('editor-css',  'css');
editors.js   = initEditor('editor-js',   'javascript');


/* ══════════════════════════════════════
   4. LOAD / SAVE CODE
══════════════════════════════════════ */

/**
 * Load code from localStorage, or fall back to defaults.
 */
function loadCode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      editors.html.setValue(data.html || DEFAULT_HTML);
      editors.css.setValue(data.css   || DEFAULT_CSS);
      editors.js.setValue(data.js     || DEFAULT_JS);
      elFileTitle.value = data.title  || 'untitled';
      showToast('Project loaded from storage ✓', 'info');
    } else {
      // First run: load defaults
      editors.html.setValue(DEFAULT_HTML);
      editors.css.setValue(DEFAULT_CSS);
      editors.js.setValue(DEFAULT_JS);
    }
    markSaved();
  } catch (e) {
    console.error('Failed to load saved code:', e);
    editors.html.setValue(DEFAULT_HTML);
    editors.css.setValue(DEFAULT_CSS);
    editors.js.setValue(DEFAULT_JS);
  }
}

/**
 * Save current code to localStorage.
 */
function saveCode() {
  try {
    const data = {
      html:  editors.html.getValue(),
      css:   editors.css.getValue(),
      js:    editors.js.getValue(),
      title: elFileTitle.value.trim() || 'untitled',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    markSaved();
    showToast('Saved! ✓', 'success');
    setStatus('Saved to localStorage');
  } catch (e) {
    showToast('Save failed!', 'error');
    console.error('Save error:', e);
  }
}

/** Mark UI as "unsaved" */
function markUnsaved() {
  isSaved = false;
  elStatusSaved.textContent = '● Unsaved';
  elStatusSaved.classList.remove('saved');
}

/** Mark UI as "saved" */
function markSaved() {
  isSaved = true;
  elStatusSaved.textContent = '✔ Saved';
  elStatusSaved.classList.add('saved');
}

/** Clear all editors and reset to blank */
function clearEditors() {
  editors.html.setValue('');
  editors.css.setValue('');
  editors.js.setValue('');
  elFileTitle.value = 'untitled';
  clearConsole();
  elPreviewFrame.srcdoc = '';
  markUnsaved();
  setStatus('New file created');
}


/* ══════════════════════════════════════
   5. RUN CODE / PREVIEW
══════════════════════════════════════ */

/**
 * Combine HTML, CSS, and JS and inject into the preview iframe.
 * Also intercepts console calls from inside the iframe.
 */
function runCode() {
  // Visual feedback: pulse run button
  elBtnRun.classList.add('running');
  setTimeout(() => elBtnRun.classList.remove('running'), 600);

  const html  = editors.html.getValue();
  const css   = editors.css.getValue();
  const js    = editors.js.getValue();

  // Clear old console output
  clearConsole();

  /*
   * We build a complete HTML document and inject it via srcdoc.
   * The console-interceptor script is injected BEFORE user code so
   * that console.log / warn / error / info calls are captured and
   * sent back to the parent page via postMessage.
   */
  const consoleInterceptor = `
    <script>
      (function() {
        const methods = ['log', 'warn', 'error', 'info'];
        methods.forEach(method => {
          const original = console[method].bind(console);
          console[method] = function(...args) {
            original(...args);
            const msg = args.map(a => {
              try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
              catch(e) { return String(a); }
            }).join(' ');
            window.parent.postMessage({ type: 'console', method, msg }, '*');
          };
        });

        // Capture uncaught errors
        window.onerror = function(msg, src, line, col) {
          window.parent.postMessage({
            type: 'console',
            method: 'error',
            msg: \`Uncaught Error: \${msg} (line \${line})\`
          }, '*');
        };

        window.addEventListener('unhandledrejection', e => {
          window.parent.postMessage({
            type: 'console',
            method: 'error',
            msg: 'Unhandled Promise Rejection: ' + (e.reason?.message || e.reason)
          }, '*');
        });
      })();
    <\/script>
  `;

  // Detect if user wrote a full HTML document or just partial tags
  const isFullDoc = html.trim().toLowerCase().startsWith('<!doctype') || html.trim().toLowerCase().startsWith('<html');

  let doc;

  if (isFullDoc) {
    // User wrote a complete document — inject CSS and JS into it
    doc = html;
    if (css.trim()) {
      if (doc.toLowerCase().includes('</head>')) {
        doc = doc.replace(/<\/head>/i, `<style>\n${css}\n</style>\n</head>`);
      } else {
        doc = `<style>\n${css}\n</style>\n` + doc;
      }
    }
    const scriptBlock = `${consoleInterceptor}${js.trim() ? `<script>\n${js}\n<\/script>` : ''}`;
    if (doc.toLowerCase().includes('</body>')) {
      doc = doc.replace(/<\/body>/i, `${scriptBlock}\n</body>`);
    } else {
      doc += scriptBlock;
    }
  } else {
    // User wrote partial HTML — wrap it in a full document automatically
    doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${css.trim() ? `<style>\n${css}\n</style>` : ''}
</head>
<body>
${html}
${consoleInterceptor}
${js.trim() ? `<script>\n${js}\n<\/script>` : ''}
</body>
</html>`;
  }

  // Reset iframe first to force a fresh render, then set content
  elPreviewFrame.srcdoc = '';
  setTimeout(() => { elPreviewFrame.srcdoc = doc; }, 50);

  // Switch to preview tab automatically
  switchOutputTab('preview');
  setStatus('Code executed');
}


/* ══════════════════════════════════════
   6. CONSOLE PANEL
══════════════════════════════════════ */

/**
 * Listen for postMessage from the iframe (console intercepts).
 */
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'console') {
    addConsoleEntry(event.data.method, event.data.msg);
  }
});

/**
 * Add a single entry to the console panel.
 * @param {string} type - 'log' | 'warn' | 'error' | 'info'
 * @param {string} msg  - The message text
 */
function addConsoleEntry(type, msg) {
  // Remove placeholder if present
  const placeholder = elConsoleOutput.querySelector('.console-placeholder');
  if (placeholder) placeholder.remove();

  const entry = document.createElement('div');
  entry.className = `console-entry console-entry--${type}`;
  entry.innerHTML = `
    <span class="console-type">${type}</span>
    <span class="console-text">${escapeHtml(msg)}</span>
  `;
  elConsoleOutput.appendChild(entry);
  elConsoleOutput.scrollTop = elConsoleOutput.scrollHeight;

  // Update error badge
  if (type === 'error') {
    consoleErrorCount++;
    elConsoleBadge.textContent = consoleErrorCount;
    elConsoleBadge.style.display = 'inline-block';
  }
}

/** Clear the console panel */
function clearConsole() {
  elConsoleOutput.innerHTML = '<div class="console-placeholder">Console output will appear here after running code…</div>';
  consoleErrorCount = 0;
  elConsoleBadge.style.display = 'none';
}

/** Sanitize user text before inserting into DOM */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


/* ══════════════════════════════════════
   7. TAB SWITCHING
══════════════════════════════════════ */

/**
 * Switch editor tab.
 * @param {string} tabName - 'html' | 'css' | 'js'
 */
function switchTab(tabName) {
  activeTab = tabName;

  // Update tab button styles
  elTabs.forEach(t => {
    t.classList.toggle('tab--active', t.dataset.tab === tabName);
  });

  // Show/hide editor panes
  document.querySelectorAll('.editor-pane').forEach(p => {
    p.classList.toggle('active', p.id === `pane-${tabName}`);
  });

  // Refresh the now-visible CodeMirror instance
  // (required after display: none → block transition)
  setTimeout(() => {
    editors[tabName].refresh();
    editors[tabName].focus();
  }, 10);

  // Update status bar language label
  const labels = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
  elStatusLang.textContent = labels[tabName];
}

/**
 * Switch output tab.
 * @param {string} name - 'preview' | 'console'
 */
function switchOutputTab(name) {
  elOutputTabs.forEach(t => {
    t.classList.toggle('output-tab--active', t.dataset.output === name);
  });

  document.querySelectorAll('.output-pane').forEach(p => {
    p.classList.toggle('active', p.id === `output-${name}`);
  });
}


/* ══════════════════════════════════════
   8. THEME TOGGLE
══════════════════════════════════════ */

/** Apply and persist a theme */
function setTheme(theme) {
  currentTheme = theme;
  elHtml.dataset.theme = theme;
  localStorage.setItem('codeforge_theme', theme);

  // Update CodeMirror themes
  const cmTheme = theme === 'dark' ? 'dracula' : 'eclipse';
  Object.values(editors).forEach(ed => ed.setOption('theme', cmTheme));

  // Update icon
  elThemeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}


/* ══════════════════════════════════════
   9. DOWNLOAD
══════════════════════════════════════ */

/**
 * Download the combined HTML/CSS/JS as a single .html file.
 * Also attempts a ZIP if JSZip is available.
 */
function downloadCode() {
  const html  = editors.html.getValue();
  const css   = editors.css.getValue();
  const js    = editors.js.getValue();
  const title = elFileTitle.value.trim() || 'codeforge-project';

  // Build combined HTML file
  let combined = html;

  if (!combined.trim().toLowerCase().startsWith('<!doctype') && !combined.trim().toLowerCase().startsWith('<html')) {
    combined = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title></head><body>${combined}</body></html>`;
  }

  if (css.trim()) {
    combined = combined.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
  }

  if (js.trim()) {
    const jsTag = `<script>\n${js}\n<\/script>`;
    if (combined.includes('</body>')) {
      combined = combined.replace('</body>', `${jsTag}\n</body>`);
    } else {
      combined += jsTag;
    }
  }

  // If JSZip is available, download as ZIP (separate files)
  if (typeof JSZip !== 'undefined') {
    const zip = new JSZip();
    zip.file('index.html', html);
    zip.file('style.css',  css);
    zip.file('script.js',  js);
    zip.generateAsync({ type: 'blob' }).then(blob => {
      triggerDownload(blob, `${title}.zip`, 'application/zip');
      showToast('Downloaded as ZIP ✓', 'success');
    });
  } else {
    // Fallback: single combined HTML
    const blob = new Blob([combined], { type: 'text/html' });
    triggerDownload(blob, `${title}.html`, 'text/html');
    showToast('Downloaded as HTML ✓', 'success');
  }
}

/** Create a temporary anchor and trigger a file download */
function triggerDownload(blob, filename, type) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


/* ══════════════════════════════════════
   10. COPY CODE
══════════════════════════════════════ */

/** Copy the active editor's code to clipboard */
function copyActiveCode() {
  const code = editors[activeTab].getValue();
  navigator.clipboard.writeText(code).then(() => {
    showToast('Copied to clipboard ✓', 'success');
    setStatus('Code copied');
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied ✓', 'success');
  });
}


/* ══════════════════════════════════════
   11. FORMAT / AUTO-INDENT
══════════════════════════════════════ */

/** Run CodeMirror's built-in auto-indent on all lines */
function formatCode() {
  const cm = editors[activeTab];
  const lineCount = cm.lineCount();
  cm.operation(() => {
    for (let i = 0; i < lineCount; i++) {
      cm.indentLine(i, 'smart');
    }
  });
  showToast('Code formatted ✓', 'info');
}


/* ══════════════════════════════════════
   12. RESIZE HANDLE (drag)
══════════════════════════════════════ */

(function setupResize() {
  let isDragging = false;
  let startX, startWidth;
  const workspace = document.querySelector('.workspace');

  elResizeHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX     = e.clientX;
    startWidth = elEditorPanel.offsetWidth;
    elResizeHandle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta    = e.clientX - startX;
    const newWidth = Math.max(240, Math.min(startWidth + delta, workspace.offsetWidth - 240));
    elEditorPanel.style.width = `${newWidth}px`;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      elResizeHandle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Refresh editors after resize
      Object.values(editors).forEach(ed => ed.refresh());
    }
  });
})();


/* ══════════════════════════════════════
   13. STATUS BAR HELPERS
══════════════════════════════════════ */

let statusTimer = null;

/** Show a temporary message in the status bar */
function setStatus(msg) {
  elStatusMsg.textContent = msg;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { elStatusMsg.textContent = ''; }, 3000);
}


/* ══════════════════════════════════════
   14. TOAST NOTIFICATION
══════════════════════════════════════ */

let toastTimer = null;

/**
 * Show a toast notification.
 * @param {string} msg  - Message text
 * @param {string} type - 'success' | 'error' | 'info'
 */
function showToast(msg, type = 'info') {
  elToast.textContent = msg;
  elToast.className   = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    elToast.classList.remove('show');
  }, 2500);
}


/* ══════════════════════════════════════
   15. MODAL (New File confirm)
══════════════════════════════════════ */

function openNewFileModal() {
  elModalNewFile.classList.add('open');
}

function closeNewFileModal() {
  elModalNewFile.classList.remove('open');
}

elModalCancel.addEventListener('click', closeNewFileModal);
elModalConfirm.addEventListener('click', () => {
  closeNewFileModal();
  clearEditors();
});

// Close modal on backdrop click
elModalNewFile.addEventListener('click', (e) => {
  if (e.target === elModalNewFile) closeNewFileModal();
});


/* ══════════════════════════════════════
   16. EVENT LISTENERS
══════════════════════════════════════ */

// ── Editor tab clicks ──
elTabs.forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// ── Output tab clicks ──
elOutputTabs.forEach(tab => {
  tab.addEventListener('click', () => switchOutputTab(tab.dataset.output));
});

// ── Toolbar buttons ──
elBtnRun.addEventListener('click', runCode);

elBtnSave.addEventListener('click', saveCode);

elBtnNew.addEventListener('click', () => {
  if (!isSaved) {
    openNewFileModal();
  } else {
    clearEditors();
  }
});

elBtnDownload.addEventListener('click', downloadCode);

elBtnTheme.addEventListener('click', toggleTheme);

elBtnCopy.addEventListener('click', copyActiveCode);

elBtnFormat.addEventListener('click', formatCode);

elBtnRefresh.addEventListener('click', runCode);

elBtnClearConsole.addEventListener('click', clearConsole);

// ── Auto-run toggle ──
elAutoRun.addEventListener('change', () => {
  if (elAutoRun.checked) {
    showToast('Auto-run enabled', 'info');
    runCode(); // run immediately when toggled on
  }
});

// ── File title: update file extension badge ──
elFileTitle.addEventListener('input', markUnsaved);

// ── Global keyboard shortcuts ──
document.addEventListener('keydown', (e) => {
  const ctrl = e.ctrlKey || e.metaKey;

  // Ctrl+Enter → Run
  if (ctrl && e.key === 'Enter') {
    e.preventDefault();
    runCode();
  }

  // Ctrl+S → Save
  if (ctrl && e.key === 's') {
    e.preventDefault();
    saveCode();
  }

  // Escape → close modal
  if (e.key === 'Escape') {
    closeNewFileModal();
  }

  // Ctrl+1/2/3 → switch editor tabs
  if (ctrl && e.key === '1') { e.preventDefault(); switchTab('html'); }
  if (ctrl && e.key === '2') { e.preventDefault(); switchTab('css');  }
  if (ctrl && e.key === '3') { e.preventDefault(); switchTab('js');   }
});


/* ══════════════════════════════════════
   17. BOOT SEQUENCE
══════════════════════════════════════ */

(function init() {
  // Apply saved theme
  setTheme(currentTheme);

  // Load saved code from localStorage
  loadCode();

  // Set initial active tab
  switchTab('html');

  // Auto-run on first load to populate preview
  setTimeout(() => {
    runCode();
    setStatus('Welcome to Devloom 🚀');
  }, 300);

  // Prevent accidental tab close if unsaved
  window.addEventListener('beforeunload', (e) => {
    if (!isSaved) {
      e.preventDefault();
      e.returnValue = ''; // Required for Chrome
    }
  });

  console.log('%cDevloom loaded ✓', 'color: #7C3AED; font-weight: bold; font-size: 14px;');
})();
