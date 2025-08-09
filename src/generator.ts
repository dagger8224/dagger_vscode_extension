import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

type CreateOpts = {
  extensionUri: vscode.Uri;
  targetDir: string;
  appName: string;
  template: 'basic';
};

export async function createDaggerApp(opts: CreateOpts): Promise<string> {
  const { extensionUri, targetDir, appName, template } = opts;

  const safeName = appName.replace(/[^\w\-]/g, '-');
  const dest = path.join(targetDir, safeName);
  if (fs.existsSync(dest)) {
    throw new Error(`目标目录已存在：${dest}`);
  }
  fs.mkdirSync(dest, { recursive: true });

  const templateRoot = vscode.Uri.joinPath(extensionUri, 'templates', template);
  await copyDir(templateRoot.fsPath, dest, { APP_NAME: safeName });

  return dest;
}

async function copyDir(src: string, dest: string, tokens: Record<string, string>) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name.replace(/__APP_NAME__/g, tokens.APP_NAME));
    if (e.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      await copyDir(s, d, tokens);
    } else if (e.isFile()) {
      let buf = fs.readFileSync(s);
      if (!isBinary(e.name)) {
        const text = buf.toString('utf8').replace(/\{\{APP_NAME\}\}/g, tokens.APP_NAME);
        fs.writeFileSync(d, text, 'utf8');
      } else {
        fs.writeFileSync(d, buf);
      }
    }
  }
}

function isBinary(filename: string) {
  return /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.ico|\.woff|\.woff2|\.ttf)$/i.test(filename);
}
