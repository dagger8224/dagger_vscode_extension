import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createDaggerApp } from './generator';

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

export function activate(context: vscode.ExtensionContext) {
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
            const createdPath = await createDaggerApp({
              // extensionUri: context.extensionUri,
              targetDir,
              payload: msg.payload
            });
            if (createdPath) {
              const open = await vscode.window.showInformationMessage(
                `dagger.js application created at ${createdPath}`, 'Open folder'
              );
              if (open) {
                vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(createdPath), true);
              }
            }
          } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to create application: ${err?.message || String(err)}`);
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
  const resolvedStructure: Record<string, string> = {};
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
      'dagger.explorer.parseFolder', async (uri: vscode.Uri) => {
        console.error('parseFolder');
      }
    ),
    vscode.commands.registerCommand(
      'dagger.explorer.parseFile', async (uri: vscode.Uri) => {
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
          json.role = resolvedStructure[uri.fsPath] || '';
          json.type = 'file';
          try {
            json.content = fs.readFileSync(uri.fsPath, 'utf8');
          } catch {
            json.valid = false;
            json.content = '(binary or unreadable as utf8)';
          }
          if (json.role === 'entry') {

          } else if (json.role === 'options') {
            
          } else {
            
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
      'dagger.explorer.createNamespace', async (uri: vscode.Uri) => {
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
            } catch (err: any) {
              vscode.window.showErrorMessage(`Failed to create namespace: ${err?.message || String(err)}`);
            }
          }
        });
      }
    ),
  );
}

function getHtml(panel: vscode.WebviewPanel, ctx: vscode.ExtensionContext, type: string, json?: any) {
  // Allow loading local resources from media/
  panel.webview.options = {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, 'framework'), vscode.Uri.joinPath(ctx.extensionUri, 'media')]
  };

  const fileRoot = vscode.Uri.joinPath(ctx.extensionUri, `media/${ type }`);

  // Read HTML and inject CSP source + script URI
  const html = fs.readFileSync(vscode.Uri.joinPath(fileRoot, 'index.html').fsPath, 'utf8')
    .replace(/\{\{cspSource\}\}/g, panel.webview.cspSource)
    .replace(/\{\{scriptUri\}\}/g, String(panel.webview.asWebviewUri(vscode.Uri.joinPath(fileRoot, 'script.js'))))
    .replace(/\{\{styleUri\}\}/g, String(panel.webview.asWebviewUri(vscode.Uri.joinPath(fileRoot, 'style.css'))))
    .replace(/\{\{json\}\}/g, json || '')
    // .replace(/\{\{modulesUri\}\}/g, String(panel.webview.asWebviewUri(vscode.Uri.joinPath(fileRoot,'modules.json'))))
    .replace(/\{\{daggerUri\}\}/g, String(panel.webview.asWebviewUri(vscode.Uri.joinPath(ctx.extensionUri, 'framework/dagger.release.js'))));

  return html;
}

async function pickTargetFolder(): Promise<string | undefined> {
  const res = await vscode.window.showOpenDialog({
    canSelectMany: false,
    canSelectFiles: false,
    canSelectFolders: true
  });
  return res?.[0]?.fsPath;
}

export function deactivate() {}
