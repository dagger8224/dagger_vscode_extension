import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'dagger.sidebar';

  constructor(private readonly ctx: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    view.webview.options = { enableScripts: true };
    view.webview.html = this.getHtml(view.webview);

    view.webview.onDidReceiveMessage(async (msg) => {
      switch (msg?.type) {
        case 'openWizard':
          vscode.commands.executeCommand('dagger.createApp');
          break;
      }
    });
  }

  private getHtml(webview: vscode.Webview) {
    const nonce = String(Date.now());
    return /* html */ `
      <!doctype html>
      <html lang="zh">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="Content-Security-Policy"
            content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 10px; }
            button { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid #7774; cursor: pointer; }
            .hint { margin-top: 10px; font-size: 12px; opacity: .8; }
          </style>
        </head>
        <body>
          <h3 style="margin-top:0;">dagger.js 向导</h3>
          <button id="open">创建新应用</button>
          <div class="hint">基于模板快速生成 dagger.js 应用。</div>
          <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            document.getElementById('open').addEventListener('click', () => {
              vscode.postMessage({ type: 'openWizard' });
            });
          </script>
        </body>
      </html>
    `;
  }
}
