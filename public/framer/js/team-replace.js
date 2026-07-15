(function() {
  // Team members data - mapped from placeholder names to actual people
  var replacements = {
    'Stefan Holm':   { name: 'Utsav Raj',    image: '../people_images/Utsav Raj.jpeg' },
    'Ron Bilevich':  { name: 'Hritik Raj',   image: '../people_images/Hritik Raj.jpeg' },
    'Marek Novak':   { name: 'Sachin Rana',   image: '../people_images/Sachin Rana.jpg' },
    'Lukas Weber':   { name: 'Mannat Kumar',  image: '../people_images/Mannat Kumar.jpeg' }
  };

  // Names to hide (placeholders without real replacements)
  var hideNames = ['Anders Jensen', 'Mateo Silva', 'Julian Krause', 'Thomas Wright'];

  function replaceTeam() {
    var teamSection = document.querySelector('[data-framer-name="Team"]');
    if (!teamSection) return;

    // Get all team member cards
    var cards = teamSection.querySelectorAll('.framer-FUdMQ');

    cards.forEach(function(card) {
      // Find the name element
      var nameEl = card.querySelector('.framer-styles-preset-ccv9s9');
      if (!nameEl) return;

      var currentName = nameEl.textContent.trim();

      // Check if this placeholder needs replacement
      if (replacements[currentName]) {
        var member = replacements[currentName];

        // Replace name
        nameEl.textContent = member.name;

        // Replace image
        var img = card.querySelector('img');
        if (img) {
          img.src = member.image;
          img.srcset = member.image;
          img.alt = member.name;
          img.style.objectFit = 'cover';
        }

        // Make the figure visible (Framer sets opacity:0 on figures)
        var figure = card.querySelector('figure');
        if (figure) {
          figure.style.opacity = '1';
        }
      }

      // Hide cards for placeholder team members we don't have images for
      if (hideNames.indexOf(currentName) !== -1) {
        // Walk up to the ssr-variant wrapper or container-level parent
        var wrapper = card.closest('.ssr-variant') || card.closest('[class*="-container"]');
        if (wrapper) {
          wrapper.style.display = 'none';
        } else {
          card.style.display = 'none';
        }
      }
    });
  }

  // Run replacements at multiple stages to ensure Framer content is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      replaceTeam();
      setTimeout(replaceTeam, 500);
      setTimeout(replaceTeam, 1500);
    });
  } else {
    replaceTeam();
    setTimeout(replaceTeam, 500);
    setTimeout(replaceTeam, 1500);
  }

  window.addEventListener('load', function() {
    setTimeout(replaceTeam, 300);
    setTimeout(replaceTeam, 1000);
  });
})();
