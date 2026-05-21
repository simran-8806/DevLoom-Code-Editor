# DevLoom 🚀
### Modern Online Code Editor for HTML, CSS & JavaScript

DevLoom is a sleek and powerful browser-based online code editor inspired by modern IDEs like VS Code and CodePen. It allows users to write, edit, run, preview, save, and download HTML, CSS, and JavaScript code directly inside the browser with a beautiful and responsive interface.

---

# 🌟 Features

## 🧩 Multi-Language Code Editor
- Separate editors for:
  - HTML
  - CSS
  - JavaScript
- Built using CodeMirror 5
- Syntax highlighting
- Line numbers
- Active line highlighting
- Auto-closing brackets and tags
- Smart indentation

---

## ⚡ Live Code Execution
- Run code instantly
- Real-time preview inside iframe
- Supports:
  - Full HTML documents
  - Partial HTML snippets
- Secure sandboxed execution

---

## 🖥 Integrated Console Panel
Supports:
- `console.log()`
- `console.warn()`
- `console.info()`
- `console.error()`
- Uncaught JavaScript errors
- Promise rejection handling

Features:
- Error counter badge
- Console clear button
- Styled console messages

---

## 💾 Project Persistence
- Saves code automatically using browser localStorage
- Restores previous session on reload

---

## 📥 Download Support
Users can:
- Download project as `.html`
- Download project as `.zip`

ZIP download includes:
- `index.html`
- `style.css`
- `script.js`

---

## 🌗 Dark / Light Theme
- Beautiful dark theme
- Clean light theme
- Theme persistence using localStorage
- Dynamic CodeMirror theme switching

---

## 📋 Productivity Tools
- Copy current tab code
- Auto-format indentation
- Keyboard shortcuts
- Auto-run mode

---

## 📐 Resizable Workspace
- Drag-based resize handle
- Adjustable editor and output panels

---

# ⌨ Keyboard Shortcuts

| Shortcut | Action |
|----------|---------|
| `Ctrl + Enter` | Run Code |
| `Ctrl + S` | Save Project |
| `Ctrl + 1` | Open HTML Tab |
| `Ctrl + 2` | Open CSS Tab |
| `Ctrl + 3` | Open JS Tab |
| `Escape` | Close Modal |

---

# 🛠 Tech Stack

## Frontend
- HTML5
- CSS3
- Vanilla JavaScript

## Libraries
- CodeMirror 5
- JSZip

## Fonts
- JetBrains Mono
- Syne

---

# 📂 Project Structure

```bash
DevLoom/
│
├── index.html        # Main UI structure
├── style.css         # Styling and themes
├── script.js         # Full application logic
└── README.md
```

---

# 🧠 Core Functionalities

## 1. CodeMirror Integration
Each editor is initialized dynamically using CodeMirror with:
- Syntax highlighting
- Bracket matching
- Auto-closing tags
- Active line styling
- Keyboard shortcuts

---

## 2. Live Preview System
The application combines:
- HTML
- CSS
- JavaScript

and injects them into a sandboxed iframe using:

```javascript
iframe.srcdoc
```

This enables instant rendering and secure execution.

---

## 3. Console Interception
The application overrides native console methods:

```javascript
console.log()
console.warn()
console.error()
console.info()
```

Then sends logs from iframe → parent window using:

```javascript
window.parent.postMessage()
```

This creates a fully functional browser console inside the editor.

---

## 4. Local Storage System
Projects are stored using:

```javascript
localStorage.setItem()
```

and restored using:

```javascript
localStorage.getItem()
```

This ensures projects persist even after refreshing the browser.

---

## 5. Theme Engine
Themes are managed using:

```html
data-theme="dark"
data-theme="light"
```

CSS custom properties dynamically control:
- Colors
- Backgrounds
- Borders
- Text styles
- Shadows

---

# 🎨 User Interface

## Navbar
Includes:
- DevLoom branding
- File rename input
- Save button
- Download button
- Theme toggle
- Run button

---

## Editor Panel
Includes:
- HTML/CSS/JS tabs
- CodeMirror editor
- Copy button
- Format button
- Status bar

---

## Output Panel
Includes:
- Live Preview
- Console Output
- Auto-run toggle
- Refresh button

---

## Modal System
Used for:
- New file confirmation

---

## Toast Notifications
Displays:
- Save success
- Download success
- Errors
- Status messages

---

# 🔒 Security Features

The preview iframe uses sandboxing:

```html
sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
```

This isolates executed user code from the main application.

---

# 📱 Responsive Design

DevLoom is fully responsive.

On smaller screens:
- Panels stack vertically
- Filename section hides
- Toolbar becomes compact

---

# 🚀 Future Improvements

Planned future features:
- Multiple file system
- Monaco Editor integration
- AI code suggestions
- User authentication
- Cloud storage
- Real-time collaboration
- Terminal support
- Emmet support

---

# ⚙ Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/your-username/devloom.git
```

---

## 2. Open Project

Open `index.html` inside your browser.

No build tools or installation required.

---

# 📸 Screenshots

## Dark Theme Editor
_Add screenshot here_

---

## Console Output
_Add screenshot here_

---

## Live Preview
[Open DevLoom Editor](https://simran-8806.github.io/DevLoom-Code-Editor/) 🚀

---

# 📖 Learning Outcomes

This project demonstrates:
- DOM Manipulation
- Event Handling
- Responsive Design
- Local Storage
- iframe Sandboxing
- Modular JavaScript
- Theme Management
- Browser APIs
- File Handling
- Console Interception
- Dynamic UI Rendering

---

# 🤝 Contributing

Contributions are welcome.

Feel free to:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

Developed with ❤️ using HTML, CSS, and JavaScript.

If you like this project, consider giving it a ⭐ on GitHub.
