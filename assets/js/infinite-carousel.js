/**
 * Infinite Carousel JavaScript Logic
 * Follows web-animation-design guidelines for high performance mobile interactions.
 */
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".carousel-container");
  const track = document.querySelector(".carousel-track");
  
  if (!container || !track) return;
  
  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    // If the user prefers reduced motion, the CSS already sets overflow-x: auto
    // and disables the animation. We can safely skip the JS enhancement.
    return;
  }

  // Configuration
  const SPEED = 0.5; // pixels per frame
  let currentX = 0;
  let isPaused = false;
  let animationFrameId = null;

  // Touch & Drag state
  let isDragging = false;
  let startX = 0;
  let previousTouchX = 0;
  let velocity = 0;
  let lastTime = 0;

  // Clone items to ensure seamless infinite looping
  // The CSS was built with duplicated nodes via Jekyll for the CSS marquee.
  // We will assume the track already has enough items (at least 2 sets of the original items).
  
  function getTrackWidth() {
    // The total scrollable width of the track.
    return track.scrollWidth;
  }

  function getHalfWidth() {
    // We assume the track contains exactly 2 identical sets of elements (because of the Jekyll loop).
    // The seamless loop point is exactly half the total scrollable width.
    return getTrackWidth() / 2;
  }

  function animate(time) {
    if (!lastTime) lastTime = time;
    const deltaTime = time - lastTime;
    
    if (!isDragging && !isPaused) {
      // Auto-scroll logic + inertia from swipe
      currentX -= SPEED + velocity;
      
      // Apply friction to the swipe velocity
      velocity *= 0.95; 
      if (Math.abs(velocity) < 0.1) velocity = 0;

      // Handle seamless looping (moving left)
      if (Math.abs(currentX) >= getHalfWidth()) {
        currentX += getHalfWidth(); // Loop back to the start
      }
      
      // Handle seamless looping (moving right, e.g., from a fast swipe)
      if (currentX > 0) {
        currentX -= getHalfWidth();
      }
    } else if (isDragging) {
      // While dragging, just keep track bounded
      if (Math.abs(currentX) >= getHalfWidth()) {
         currentX += getHalfWidth();
      }
      if (currentX > 0) {
         currentX -= getHalfWidth();
      }
    }

    // Apply transform using hardware acceleration
    track.style.transform = `translate3d(${currentX}px, 0, 0)`;

    lastTime = time;
    animationFrameId = requestAnimationFrame(animate);
  }

  // Interaction Events
  track.addEventListener("mouseenter", () => isPaused = true);
  track.addEventListener("mouseleave", () => isPaused = false);

  track.addEventListener("touchstart", (e) => {
    isDragging = true;
    isPaused = true;
    startX = e.touches[0].clientX;
    previousTouchX = startX;
    velocity = 0;
  }, { passive: true });

  track.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - previousTouchX;
    
    currentX += deltaX;
    velocity = deltaX / 2; // Capture momentum
    
    previousTouchX = touchX;
  }, { passive: true });

  track.addEventListener("touchend", () => {
    isDragging = false;
    isPaused = false;
  });
  
  // Start the loop
  animationFrameId = requestAnimationFrame(animate);
});
