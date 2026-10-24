const welcome = document.querySelector("#welcome");
const message = document.querySelector("#msg");
const languageToggle = document.querySelector("#language-toggle");
const eyebrow = document.querySelector("#home-eyebrow");
const role = document.querySelector("#home-role");
const resumeLinkLabel = document.querySelector("#resume-link-label");
const themeToggle = document.querySelector("#theme-toggle");

if (languageToggle && welcome && message && eyebrow && role && resumeLinkLabel) {
  const englishMessage =
    "I'm a software engineer at the IRS with experience modernizing enterprise Java systems, troubleshooting complex production issues, and coordinating releases. My background also includes operational technology cybersecurity, from asset inventories and STIG hardening to network diagrams. My goal is to keep building secure, reliable software and improve how teams maintain complex systems.";

  const spanishMessage =
    "Soy ingeniero de software en el Servicio de Impuestos Internos de Estados Unidos (IRS). Tengo experiencia modernizando sistemas empresariales en Java, resolviendo problemas complejos en producción y coordinando lanzamientos. También cuento con experiencia en ciberseguridad de tecnología operativa (OT): inventarios de dispositivos, aplicación de STIGs y elaboración de diagramas de red. Mi objetivo es seguir desarrollando software seguro y confiable y mejorar la forma en que los equipos mantienen sistemas complejos.";

  let english = true;

  languageToggle.addEventListener("click", () => {
    english = !english;
    const language = english ? "en" : "es";

    welcome.textContent = english ? "Welcome!" : "¡Bienvenidos!";
    welcome.lang = language;
    message.textContent = english ? englishMessage : spanishMessage;
    message.lang = language;
    eyebrow.textContent = english
      ? "Software Engineer · Application Development"
      : "Ingeniería de software · Desarrollo de aplicaciones";
    role.textContent = english
      ? "Building secure, reliable systems."
      : "Desarrollando sistemas seguros y confiables.";
    resumeLinkLabel.textContent = english
      ? "Explore my experience"
      : "Conoce mi experiencia";
    document.documentElement.lang = language;
    languageToggle.textContent = english ? "Leer en español" : "Read in English";
    languageToggle.setAttribute("aria-pressed", String(!english));
  });
}

if (themeToggle) {
  const darkTheme = localStorage.getItem("portfolio-theme") === "dark";
  document.body.classList.toggle("theme-dark", darkTheme);

  const updateThemeControl = () => {
    const isDark = document.body.classList.contains("theme-dark");
    const label = isDark ? "Switch to light theme" : "Switch to dark theme";

    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.firstElementChild.textContent = isDark ? "☀" : "◐";
  };

  updateThemeControl();
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("theme-dark");
    localStorage.setItem("portfolio-theme", isDark ? "dark" : "light");
    updateThemeControl();
  });
}
