# dagger_vscode_extension (App Wizard)

Minimal extension with:
- Command `dagger.js: Create App` opening a one-off Webview wizard
- Sidebar (WebviewView) as a persistent entry point

## Run
1. `npm install`
4. Use the Activity Bar **dagger** icon → "Create New App" or run the command palette entry
3. Press **F5** to launch Extension Development Host

## Notes
- Adjust `engines.vscode` if your VS Code is older.
- The generated template is under `templates/basic/`. It includes minimal dagger.js placeholders.
