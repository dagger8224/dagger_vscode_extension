const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/*
const isBinary = filename => /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.ico|\.woff|\.woff2|\.ttf)$/i.test(filename);
*/

const writeFile = (file, content) => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content, 'utf8');
  }
};

exports.createDaggerApp = (context, targetDir, payload) => {
  const dest = path.join(targetDir, payload.appName);
  if (fs.existsSync(dest)) {
    vscode.window.showErrorMessage(`The target directory "${ dest }" already exists!`);
    return '';
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
  return fetch(`https://cdn.jsdelivr.net/npm/@peakman/dagger.js@${ payload.version }/${ daggerFileName }`)
   .then(res => res.text(), err => {
      vscode.window.showErrorMessage(`Failed to fetch ${ daggerFileName } (V${ payload.version }) from CDN: ${ err }`);
   })
   .then(data => {
    writeFile(path.join(frameworkDir, daggerFileName), data);
    const structure = {
      entry: 'index.html',
      options: 'configs/options.json',
      readme: 'README.md',
      style: '',
      script: '',
      routers: '',
      modules: ''
    };
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
    structure.style = 'style.css';
    writeFile(path.join(dest,'style.css'), `/* Add global CSS here */
`);
  }
  // write script.js
  if (payload.enableGlobalScript) {
    structure.script = 'script.js';
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
  const rootSelectors = payload.rootSelectors.split(',').map(s => s.trim());
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
    structure.modules = 'configs/modules.json';
    writeFile(path.join(configsDir, 'modules.json'), `{
}
`);
  }

  // write routers.json
  if (payload.enableRouterConfig) {
    structure.routers = 'configs/routers.json';
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
  // write the hidden config file
  const currentTime = new Date().toISOString();
  const packageJsonPath = path.join(context.extensionPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  writeFile(path.join(dest, 'dagger.application.config.json'), JSON.stringify({
    appName: payload.appName,
    createTime: currentTime,
    updateTime: currentTime,
    creator: 'vscode:dagger_app_wizard',
    version: packageJson.version,
    parameters: payload,
    structure
  }, null, 2));
  return dest;
  });
};
