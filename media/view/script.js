export const load = content => {
  return JSON.parse(content);
};

const vscode = acquireVsCodeApi();
export const openView = (path, role) => {
  vscode.postMessage({ type: "openView", path, role });
};
