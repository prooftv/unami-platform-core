import { PREFERENCE_REGISTRY } from './preferences-config';

export function ThemeBootScript() {
  const registry = JSON.stringify(PREFERENCE_REGISTRY);

  const code = `
    (function () {
      try {
        var root = document.documentElement;
        var REGISTRY = ${registry};

        function readCookie(name) {
          var match = document.cookie.split("; ").find(function(c) {
            return c.startsWith(name + "=");
          });
          return match ? decodeURIComponent(match.split("=")[1]) : null;
        }

        Object.keys(REGISTRY).forEach(function(key) {
          var definition = REGISTRY[key];
          var value = readCookie(key);
          var resolved = (value && definition.values.indexOf(value) >= 0) ? value : definition.defaultValue;
          root.setAttribute(definition.attribute, resolved);
        });

        var mode = readCookie("theme_mode") || "light";
        var resolvedMode =
          mode === "system" && window.matchMedia
            ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
            : mode === "dark" ? "dark" : "light";

        root.classList.toggle("dark", resolvedMode === "dark");
        root.style.colorScheme = resolvedMode;
      } catch (e) {}
    })();
  `;

  /* biome-ignore lint/security/noDangerouslySetInnerHtml: required for pre-hydration boot script */
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
