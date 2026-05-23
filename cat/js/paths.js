/**
 * Fix asset URLs for GitHub Pages (/kidgames/cat/) and local dev.
 * Without this, opening /kidgames/cat (no trailing slash) breaks relative paths.
 */
(() => {
  function gameRoot() {
    let path = window.location.pathname;
    if (path.endsWith(".html")) {
      path = path.slice(0, path.lastIndexOf("/") + 1);
    } else if (!path.endsWith("/")) {
      path = `${path}/`;
    }
    return path;
  }

  const root = gameRoot();

  window.__GAME_ROOT__ = root;
  window.assetUrl = (relativePath) => `${root}${relativePath.replace(/^\//, "")}`;
})();
