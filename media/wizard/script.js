export const load = () => ({
  appName: 'my-dagger-app',
  mode: 'debug',
  version: '0.9.21',
  rootSelectors: 'title, body',
  routerMode: 'hash',
  prefix: '#',
  defaultRoute: '/',
  enableGlobalScript: true,
  enableGlobalStyle: true,
  enableIntegrity: false,
  enableDebugDirective: true,
  enableLog: true,
  enableWarning: true,
  enableModuleConfig: true,
  enableRouterConfig: true,
  isValid: true
});

export const validateAppName = (appName, $scope) => {
  $scope.invalid = !/^[a-zA-Z0-9_-]{3,}$/.test(appName);
  $scope.isValid &&= !$scope.invalid;
};

export const validateVersion = (version, $scope) => {
  $scope.invalid = !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version);
  $scope.isValid &&= !$scope.invalid;
};

const vscode = acquireVsCodeApi();

export const createApp = $scope => {
  vscode.postMessage({ type: 'create', payload: Object.assign({}, $scope) });
};
