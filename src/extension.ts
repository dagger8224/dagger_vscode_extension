import * as vscode from 'vscode';
import { createDaggerApp } from './generator';
import { SidebarProvider } from './SidebarProvider';

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

      panel.webview.html = getWizardHtml(panel, context);

      panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg?.type === 'create') {
          try {
            const targetDir = await pickTargetFolder();
            if (!targetDir) return;
            const { appName, type } = msg.payload;
            const createdPath = await createDaggerApp({
              extensionUri: context.extensionUri,
              targetDir,
              appName,
              type
            });
            const open = await vscode.window.showInformationMessage(
              `dagger.js application created at ${createdPath}`, 'Open folder'
            );
            if (open) {
              vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(createdPath), true);
            }
          } catch (err: any) {
            vscode.window.showErrorMessage(`Failed to create application: ${err?.message || String(err)}`);
          }
        }
      });
    })
  );

  // Sidebar provider
  const provider = new SidebarProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
}

function getWizardHtml(panel: vscode.WebviewPanel, ctx: vscode.ExtensionContext) {
  // Allow loading local resources from media/
  panel.webview.options = {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(ctx.extensionUri, 'framework'), vscode.Uri.joinPath(ctx.extensionUri, 'media')]
  };

  const wizardRoot = vscode.Uri.joinPath(ctx.extensionUri, 'media/wizard');

  // Read HTML and inject CSP source + script URI
  const html = require('fs').readFileSync(vscode.Uri.joinPath(wizardRoot, 'index.html').fsPath, 'utf8')
    .replace(/\{\{cspSource\}\}/g, panel.webview.cspSource)
    .replace(/\{\{scriptUri\}\}/g, String(panel.webview.asWebviewUri(vscode.Uri.joinPath(wizardRoot, 'script.js'))))
    .replace(/\{\{styleUri\}\}/g, String(panel.webview.asWebviewUri(vscode.Uri.joinPath(wizardRoot, 'style.css'))))
    // .replace(/\{\{modulesUri\}\}/g, String(panel.webview.asWebviewUri(vscode.Uri.joinPath(wizardRoot,'modules.json'))))
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
