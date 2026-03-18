document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.querySelector(".signature-overlay");
  if (!overlay) return;

  // We add a tiny delay to ensure the SVG is fully rendered before calculating lengths
  requestAnimationFrame(() => {
    const paths = overlay.querySelectorAll("svg path");
    
    paths.forEach((path, index) => {
      // Calculate exact length of the path for drawing animation
      const length = path.getTotalLength();
      
      // Update custom CSS variables for this specific path
      // This ensures any new signature.svg works automatically
      path.style.setProperty("--path-length", length);
      
      // Stagger multiple paths slightly (if the SVG contains more than one)
      path.style.setProperty("--path-delay", `${index * 300}ms`);
    });
  });
});
