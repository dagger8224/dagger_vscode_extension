import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { debug } from 'console';

type CreateOpts = {
  targetDir: string;
  payload: any;
};

/*
function isBinary(filename: string) {
  return /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.ico|\.woff|\.woff2|\.ttf)$/i.test(filename);
}
*/

function writeFile(file: string, content: string) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

export async function createDaggerApp(opts: CreateOpts): Promise<string> {
  const { targetDir, payload } = opts;

  const dest = path.join(targetDir, payload.appName);
  if (fs.existsSync(dest)) {
    vscode.window.showErrorMessage(`The target directory "${ dest }" already exists!`);
  }
  fs.mkdirSync(dest, { recursive: true });

  // create framework folder
  const frameworkDir = path.join(dest, 'framework');
  fs.mkdirSync(frameworkDir, { recursive: true });
  let daggerFileName = '';
  const { mode } = payload;
  if (mode === 'debug') {
    daggerFileName = 'dagger.js';
  } else if (mode === 'debug.min') {
    daggerFileName = 'dagger.min.js';
  } else if (mode ==='release') {
    daggerFileName = 'dagger.release.js';
  } else if (mode ==='release.min') {
    daggerFileName = 'dagger.release.min.js';
  }
  fetch(`https://cdn.jsdelivr.net/npm/@peakman/dagger.js@${ payload.version }/${ daggerFileName }`)
   .then(res => res.text(), err => {
      vscode.window.showErrorMessage(`Failed to fetch ${ daggerFileName } (V${ payload.version }) from CDN: ${ err }`);
   })
   .then(data => writeFile(path.join(frameworkDir, daggerFileName), String(data)));

  // write index.html
  
  writeFile(path.join(dest, 'index.html'), `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>[dg-cloak] { display: none !important; }</style>
    <script type="module" crossorigin="anonymous" src="./framework/${ daggerFileName }" defer></script>
    <script type="dagger/options" src="./configs/options.json"></script>
    ${ payload.enableModuleConfig ? '<script type="dagger/modules" src="./configs/modules.json"></script>' : '' }
    ${ payload.enableRouterConfig ? '<script type="dagger/routers" src="./configs/routers.json"></script>' : '' }
    ${ payload.enableGlobalStyle ? '<link rel="stylesheet" href="./style.css" />' : '' }
    ${ payload.enableGlobalScript ? '<script type="text/javascript" src="./script.js"></script>' : '' }
    <title>${ payload.appName }</title>
  </head>
  <body>
    <main dg-cloak +load="{ name: 'dagger', clickCount: 0 }">
      <h1 >Hello, \$\{ name \}!</h1>
      <button +click="clickCount++">
        Clicked \$\{ clickCount \} times!
      </button>
    </main>
  </body>
</html>
`);
  // write style.css
  if (payload.enableGlobalStyle) {
    writeFile(path.join(dest,'style.css'), `/* Add global CSS here */
`);
  }
  // write script.js
  if (payload.enableGlobalScript) {
    writeFile(path.join(dest,'script.js'), `/* Add global script here */
`);
  }
  // write README.md
  writeFile(path.join(dest, 'README.md'), `
# ${ payload.appName }  
## The configuration used to create & initialize this application is as follows:  
\`\`\`
${ JSON.stringify(payload, null, 2) }
\`\`\`
`);
  // create configs folder
  const configsDir = path.join(dest, 'configs');
  fs.mkdirSync(configsDir, { recursive: true });

  // write options.json
  const rootSelectors = payload.rootSelectors.split(',').map((s: any) => s.trim());
  if (['debug', 'debug.min'].includes(payload.mode)) {
    writeFile(path.join(configsDir, 'options.json'), JSON.stringify({
      rootSelectors,
      integrity: payload.enableIntegrity,
      debugDirective: payload.enableDebugDirective,
      log: payload.enableLog,
      warning: payload.enableWarning
    }, null, 2));
  } else {
    writeFile(path.join(configsDir, 'options.json'), JSON.stringify({
      rootSelectors
    }, null, 2));
  }

  // write modules.json
  if (payload.enableModuleConfig) {
    writeFile(path.join(configsDir, 'modules.json'), `{
}
`);
  }

  // write routers.json
  if (payload.enableRouterConfig) {
    writeFile(path.join(configsDir, 'routers.json'), `
  ${ JSON.stringify({
    mode: payload.routerMode,
    prefix: payload.prefix,
    aliaes: {},
    default: payload.defaultRoute,
    routing: {
      tailable: true,
      children: []
    }
  }, null, 2) }
`);
  }

  return dest;
}
