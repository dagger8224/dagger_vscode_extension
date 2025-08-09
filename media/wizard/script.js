(function(){
  const vscode = acquireVsCodeApi();
  const $ = (id) => document.getElementById(id);
  const state = vscode.getState?.() || {};

  if (state.appName) $('appName').value = state.appName;
  if (state.template) $('template').value = state.template;

  $('create').addEventListener('click', () => {
    const appName = ($('appName').value || 'my-dagger-app').trim();
    const template = $('template').value;
    vscode.postMessage({ type: 'create', appName, template });
  });

  ['appName', 'template'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      vscode.setState?.({ appName: $('appName').value, template: $('template').value });
    });
  });
})();
