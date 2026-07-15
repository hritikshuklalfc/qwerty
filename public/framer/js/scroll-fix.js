(function() {
  // Safer fallback for Framer scroll animations
  function fixScrollAnimations() {
    // Only target elements that are explicitly Framer appear animations
    var animatedElements = document.querySelectorAll('[data-framer-appear-id]');
    if (!animatedElements.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var computedOpacity = window.getComputedStyle(el).opacity;
          
          // If the element is still invisible when it enters the viewport
          if (parseFloat(computedOpacity) < 0.1) {
            el.style.setProperty('transition', 'opacity 0.4s ease-out, transform 0.4s ease-out', 'important');
            el.style.setProperty('opacity', '1', 'important');
            
            // Safely reset translation for appear effects without breaking centering
            var currentTransform = el.style.transform;
            if (currentTransform && currentTransform.includes('translate')) {
               // Only remove the specific appear translations like translateY(40px)
               // We avoid completely clearing transform as it might break layout
               el.style.setProperty('transform', currentTransform.replace(/translate[XY]\([^)]*\)/g, 'translate(0px, 0px)'), 'important');
            }
          }
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.01,
      rootMargin: '200px 0px'
    });

    animatedElements.forEach(function(el) {
      observer.observe(el);
    });
  }

  // Initialize safely
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(fixScrollAnimations, 1500);
    });
  } else {
    setTimeout(fixScrollAnimations, 1500);
  }

  window.addEventListener('load', function() {
    setTimeout(fixScrollAnimations, 2500);
  });
})();

