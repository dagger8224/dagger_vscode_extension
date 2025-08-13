# dagger.js App Wizard

## 🎯 Overview

> A VS Code extension for quickly creating dagger.js applications with an one-time creation wizard (Webview Panel) and a persistent sidebar entry (Webview View).  
> Ideal for bootstrapping demo projects, prototypes, or learning examples.

[![Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-007ACC)](https://marketplace.visualstudio.com/items?itemName=peakman.daggerjs-app-wizard)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/peakman.daggerjs-app-wizard.svg)](https://marketplace.visualstudio.com/items?itemName=peakman.daggerjs-app-wizard)
[![Version](https://img.shields.io/visual-studio-marketplace/v/peakman.daggerjs-app-wizard.svg)](https://marketplace.visualstudio.com/items?itemName=peakman.daggerjs-app-wizard)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#license)

---

## ✨ Features

- **Creation Wizard (WebviewPanel)**: Run "dagger.js: Create App" from the Command Palette, enter your app name, choose a destination folder, and generate a ready-to-use project structure based on the parameters you choose.  
- **Persistent Sidebar (WebviewView)**: Always-available dagger icon in the Activity Bar with a "Create App" button on the home page.  
- **No Template Copy Required (optional)**: Directly creates files in the target folder without copying pre-existing templates.  
- **Post-Creation Convenience**: Option to open the generated project folder immediately after creation.

---

## 📦 Installation

### From Marketplace (Recommended)
1. Open VS Code → Extensions view (`Ctrl/⌘+Shift+X`)  
2. Search for **"dagger.js App Wizard"** → Install

### From a VSIX File
- GUI: Extensions view → `...` menu (More Actions) → **Install from VSIX…**  
- CLI:  
  ```bash
  code --install-extension daggerjs-app-wizard-x.y.z.vsix
  ```

---

## 🚀 Quick Start

1. **Open the Command Palette** → Run **"dagger.js: Create App"**  
2. Enter your application name (letters/numbers/underscores/hyphens only, min length 3)  
3. Select the output directory  
4. Click **Create**  
5. When prompted, choose **Open Folder** to enter the new project  
6. Start a static dev server (such as `Live Server`, port configurable)
   Then open `http://localhost:3000` in your browser.

---

## 🧩 Generated Project Structure

```
<your-app>/
├─ package.json
├─ index.html
├─ style.css
├─ script.js
├─ README.md
├─ framework/
│  └─ dagger.js
└─  configs/
    ├─ modules.json
    ├─ routes.json
    └─ options.json
```

## ⌨️ Commands

| Command ID | Title | Description |
|---|---|---|
| `dagger.createApp` | dagger.js: Create App | Opens the creation wizard |

**Sidebar View**  
- View ID: `dagger.sidebar` (WebviewView)  
- Activity Bar container ID: `dagger`

### Debugging Tips
- **Extension Host Logs**: Main VS Code window → Debug Console or "Output → Log (Extension Host)"  
- **Webview Logs**: In the development host window → `F1 → Developer: Toggle Developer Tools` → Console/Sources  

---

## 🐞 FAQ

**Q: Clicking "Create" does nothing.**  
A: Open Developer Tools in the Extension Development Host (`F1 → Developer: Toggle Developer Tools`) and check for CSP or missing asset errors.

**Q: Why do I get CSP errors in vscode.dev?**  
A: Web-based VS Code has stricter CSP, which may block the creation wizard from working. To work around this, you can use a local VS Code installation or run the extension in a local environment.

**Q: How do I include dagger.js in the generated project?**  
A: Replace the script tag in `index.html` with your preferred source:
```html
<script src="https://unpkg.com/dagger.js"></script>
```

**Q: Can I customize which files are generated?**  
A:You can toggle the switchers in the creation wizard to include or exclude certain files. Fore example, you can exclude the `script.js` file by unchecking the "Enable global script.js" switcher.

---

## 📝 Version History

See the "Version History" tab on the Marketplace page or the `CHANGELOG.md` file in this repo.

---

## 📄 License

MIT

---
