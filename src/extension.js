const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { createDaggerApp } = require('./generator');

// const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const entryParser = () => {};
const optionsParser = () => {};
const modulesConfigParser = () => {};
const routersConfigParser = () => {};
const namespaceParser = () => {};
const viewParser = () => {};
const scriptParser = () => {};
const styleParser = () => {};
const jsonParser = () => {};

const activate = context => {
  // Command: open one-off wizard
  context.subscriptions.push(
    vscode.commands.registerCommand('dagger.createApp', async () => {
      const panel = vscode.window.createWebviewPanel(
        'daggerCreateApp',
        'dagger.js - Create App',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getHtml(panel, context, 'wizard');

      panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg?.type === 'create') {
          try {
            const targetDir = await pickTargetFolder();
            if (!targetDir) return;
            const createdPath = await createDaggerApp(context, targetDir, msg.payload);
            if (createdPath) {
              const open = await vscode.window.showInformationMessage(
                `dagger.js application created at ${createdPath}`, 'Open folder'
              );
              if (open) {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(createdPath), true);
              }
            }
          } catch (err) {
            vscode.window.showErrorMessage(`Failed to create application: ${ err?.message || err }`);
          }
        }
      });
    })
  );
  let basePath = '';
  let configs = null;
  try {
    const folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
      basePath = folders[0].uri.fsPath;
      const configFile = path.join(basePath, 'dagger.application.config.json');
      if (fs.existsSync(configFile)) {
        configs = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      }
    }
  } catch (err) {
    console.error(err);
  }
  if (!configs) {
      vscode.window.showErrorMessage('Please open a dagger.js workspace folder first.');
      return;
  }
  const structure = configs.structure;
  const resolvedStructure = {};
  Object.keys(structure).forEach(key => {
    const relativePath = structure[key];
    if (relativePath) {
      const fullPath = path.join(basePath, relativePath);
      if (!fs.existsSync(fullPath)) {
        vscode.window.showErrorMessage(`Path ${fullPath} does not exist.`);
      } else {
        resolvedStructure[fullPath] = key;
      }
    }
  });
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'dagger.explorer.parseFolder', async (uri) => {
        console.error('parseFolder');
      }
    ),
    vscode.commands.registerCommand(
      'dagger.explorer.parseFile', async (uri) => {
        const json = {
          role: '',
          type: '',
          path: uri.fsPath,
          content: '',
          valid: true
        };
        const stats = fs.statSync(uri.fsPath);
        if (stats.isDirectory()) {
          json.type = 'directory';
        } else if (stats.isFile()) {
          const role = resolvedStructure[uri.fsPath] || '';
          if (!role) {
            vscode.window.showErrorMessage(`File ${uri.fsPath} is not registered in the current application.`);
            return;
          }
          json.role = role;
          json.type = 'file';
          try {
            json.content = fs.readFileSync(uri.fsPath, 'utf8');
          } catch {
            json.valid = false;
            json.content = '(binary or unreadable as utf8)';
          }
          if (role === 'application.configs') {
            json.data = {
              title: 'Application Configs',
              sbutitle: 'Save',
              html: '<button +click="openView()">openView</button>'
            };
          } else if (role === 'application.entry') {
          } else if (role === 'application.options') {
          } else if (role === 'application.routers') {
          } else if (role === 'application.modules') {
          } else if (role === 'application.readme') {
          } else if (role === 'global.script') {
          } else if (role === 'global.style') {
            
          } else {
            vscode.window.showErrorMessage(`Unsupported role ${role} for file ${uri.fsPath}`);
          }
        }
        const panel = vscode.window.createWebviewPanel(
          'dagger.filePreview',
          `dagger view: ${ path.basename(uri.fsPath) }`,
          { viewColumn: vscode.ViewColumn.Active, preserveFocus: false },
          {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
          }
        );

        panel.webview.html = getHtml(panel, context, 'view', JSON.stringify(json, null, 2));
        panel.webview.onDidReceiveMessage(msg => {
        });
      }
    ),
    vscode.commands.registerCommand(
      'dagger.explorer.createNamespace', async (uri) => {
        vscode.window.showInputBox({
          prompt: 'Enter the name of the new namespace'
        }).then(async name => {
          name && (name = name.trim());
          if (name) {
            try {
              // TODO: update the structure config
              const modulePath = path.join(uri.fsPath, name);
              fs.mkdirSync(modulePath, { recursive: true });
              fs.writeFileSync(path.join(modulePath, 'index.html'), `
<!doctype html>
<html lang="en">
  <script type="dagger/modules">
    {
      "view": "./view.html",
      "style": "./style.css",
      "script": "./script.js"
    }
  </script>
</html>
`);
              fs.writeFileSync(path.join(modulePath, 'view.html'), '');
              fs.writeFileSync(path.join(modulePath,'style.css'), '');
              fs.writeFileSync(path.join(modulePath,'script.js'), '');
            } catch (err) {
              vscode.window.showErrorMessage(`Failed to create namespace: ${ err?.message || err }`);
            }
          }
        });
      }
    ),
  );
}

const getHtml = (panel, ctx, type, json) => {
  // Allow loading local resources from media/
  panel.webview.options = {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, 'framework'), vscode.Uri.joinPath(ctx.extensionUri, 'media')]
  };
  const fileRoot = vscode.Uri.joinPath(ctx.extensionUri, `media/${ type }`);
  // Read HTML and inject CSP source + script URI
  const html = fs.readFileSync(vscode.Uri.joinPath(fileRoot, 'index.html').fsPath, 'utf8')
    .replace(/\{\{cspSource\}\}/g, panel.webview.cspSource)
    .replace(/\{\{scriptUri\}\}/g, panel.webview.asWebviewUri(vscode.Uri.joinPath(fileRoot, 'script.js')))
    .replace(/\{\{styleUri\}\}/g, panel.webview.asWebviewUri(vscode.Uri.joinPath(fileRoot, 'style.css')))
    .replace(/\{\{json\}\}/g, json || '')
    .replace(/\{\{daggerUri\}\}/g, panel.webview.asWebviewUri(vscode.Uri.joinPath(ctx.extensionUri, 'framework/dagger.release.js')));

  return html;
}

const pickTargetFolder = async () => {
  const res = await vscode.window.showOpenDialog({
    canSelectMany: false,
    canSelectFiles: false,
    canSelectFolders: true
  });
  return res?.[0]?.fsPath;
}

const deactivate = () => {};

module.exports = { activate, deactivate };
