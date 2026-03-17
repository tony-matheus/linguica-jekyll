(function () {
  'use strict';

  var searchModalEl = document.getElementById('searchModal');
  var searchModalBackdrop = document.getElementById('searchModalBackdrop');
  var searchModalDialog = document.getElementById('searchModalDialog');
  var searchModalInput = document.getElementById('searchModalInput');
  var searchModalResults = document.getElementById('searchModalResults');
  var searchModalPlaceholder = document.getElementById('searchModalPlaceholder');
  var searchModalClose = document.getElementById('searchModalClose');

  if (!searchModalEl || !searchModalInput || !searchModalResults) return;

  var baseurl = searchModalEl.getAttribute('data-baseurl') || '';
  var placeholderText = searchModalPlaceholder
    ? (searchModalPlaceholder.getAttribute('data-placeholder') || 'Type to search posts…')
    : 'Type to search posts…';

  var typingTimer = null;
  var TYPING_DEBOUNCE_MS = 250;
  var isTyping = false;

  function getModalOpen() {
    return searchModalEl.getAttribute('aria-hidden') !== 'true';
  }

  function resetToEmptyState() {
    if (!searchModalPlaceholder) return;
    searchModalPlaceholder.textContent = placeholderText;
    searchModalResults.innerHTML = '';
    searchModalResults.appendChild(searchModalPlaceholder);
  }

  function markTyping() {
    isTyping = true;
    if (typingTimer) clearTimeout(typingTimer);
    typingTimer = setTimeout(function () {
      isTyping = false;
      if (searchModalInput.value.trim() === '') {
        resetToEmptyState();
      }
    }, TYPING_DEBOUNCE_MS);
  }

  function openModal() {
    if (getModalOpen()) return;
    searchModalEl.setAttribute('aria-hidden', 'false');
    searchModalEl.classList.add('search-modal--open');
    searchModalInput.value = '';
    isTyping = false;
    resetToEmptyState();
    searchModalInput.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!getModalOpen()) return;
    searchModalEl.classList.remove('search-modal--open');
    searchModalEl.classList.add('search-modal--closing');
    var duration = 220;
    setTimeout(function () {
      searchModalEl.classList.remove('search-modal--closing');
      searchModalEl.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }, duration);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    var s = String(str);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildImageSrc(image) {
    if (!image || !image.trim()) return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
    return baseurl + (baseurl.endsWith('/') ? '' : '/') + image;
  }

  var compactCardTemplate =
    '<article class="search-result-card post-horizontal-card post-horizontal-card--compact post-horizontal-card--image-left">' +
    '  <div class="post-horizontal-card__media">' +
    '    <a href="{url}" class="post-horizontal-card__media-link">' +
    '      <div class="post-horizontal-card__image-wrapper">' +
    '        <img class="post-horizontal-card__image" src="{image}" alt="{title}" loading="lazy">' +
    '      </div>' +
    '    </a>' +
    '  </div>' +
    '  <div class="post-horizontal-card__body">' +
    '    <a class="post-horizontal-card__link" href="{url}">' +
    '      <time class="post-horizontal-card__date">{date}</time>' +
    '      <h2 class="post-horizontal-card__title">{title}</h2>' +
    '    </a>' +
    '    <p class="post-horizontal-card__author">by <i class="icon-user" aria-hidden="true"></i> {author}</p>' +
    '    <p class="post-horizontal-card__excerpt">{excerpt}</p>' +
    '    <a class="post-horizontal-card__read-more" href="{url}">→ Read Article</a>' +
    '  </div>' +
    '</article>';

  SimpleJekyllSearch({
    searchInput: searchModalInput,
    resultsContainer: searchModalResults,
    json: '{{ "/search.json" | relative_url }}',
    searchResultTemplate: compactCardTemplate,
    noResultsText: '<p class="search-modal__no-results">No results found.</p>',
    middleware: function (key, value, template) {
      if (value === undefined || value === null) return '';
      var v = String(value);
      if (key === 'title' || key === 'excerpt' || key === 'author') return escapeHtml(v);
      if (key === 'image') return buildImageSrc(value);
      return v;
    },
    success: function () {
      if (searchModalPlaceholder && searchModalResults.contains(searchModalPlaceholder)) {
        searchModalPlaceholder.remove();
      }
    },
    noResults: function () {
      var query = searchModalInput.value.trim();

      if (!query) {
        resetToEmptyState();
        return;
      }

      if (isTyping) return;

      if (searchModalPlaceholder) {
        searchModalPlaceholder.textContent = 'No results found.';
        if (!searchModalResults.contains(searchModalPlaceholder)) {
          searchModalResults.innerHTML = '';
          searchModalResults.appendChild(searchModalPlaceholder);
        }
      }
    },
  });

  searchModalResults.addEventListener('click', function (e) {
    if (e.target.closest('.search-result-card a')) closeModal();
  });

  searchModalBackdrop.addEventListener('click', closeModal);
  searchModalClose.addEventListener('click', closeModal);

  searchModalInput.addEventListener('input', function () {
    markTyping();
  });

  searchModalInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
  });

  function handleOpenSearch() {
    openModal();
  }

  var searchToggle = document.getElementById('searchToggle');
  var searchBtns = document.querySelectorAll('.search-btn--icon, .search-btn--full');
  if (searchToggle) searchToggle.addEventListener('click', handleOpenSearch);
  searchBtns.forEach(function (btn) {
    btn.addEventListener('click', handleOpenSearch);
  });

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (getModalOpen()) closeModal();
      else openModal();
    }
  });

  // Post banner background modes: color, pixels, blur
  (function () {
    var banner = document.querySelector('[data-post-banner]');
    if (!banner) return;

    var img = banner.querySelector('[data-post-banner-image]');
    var bg = banner.querySelector('[data-post-banner-bg]');
    if (!img || !bg) return;

    var mode = (banner.getAttribute('data-post-banner-mode') || 'color').toLowerCase();
    if (mode === 'none') return;

    function applyDominantColor() {
      if (!img.complete || !img.naturalWidth) {
        img.addEventListener('load', applyDominantColor, { once: true });
        return;
      }

      try {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        if (mode === 'pixels') {
          // Very low-res, then scaled up with pixelated rendering
          var pixelSize = 32;
          canvas.width = pixelSize;
          canvas.height = pixelSize;
          context.drawImage(img, 0, 0, pixelSize, pixelSize);

          var dataUrl = canvas.toDataURL();
          bg.style.backgroundImage = 'url(' + dataUrl + ')';
          bg.style.backgroundSize = 'cover';
          bg.style.backgroundPosition = 'center';
          bg.style.imageRendering = 'pixelated';
        } else if (mode === 'blur') {
          // Higher-res blurred version
          var blurWidth = 320;
          var aspect = img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 0.5625;
          canvas.width = blurWidth;
          canvas.height = Math.round(blurWidth * aspect);
          context.drawImage(img, 0, 0, canvas.width, canvas.height);

          var blurDataUrl = canvas.toDataURL();
          bg.style.backgroundImage = 'url(' + blurDataUrl + ')';
          bg.style.backgroundSize = 'cover';
          bg.style.backgroundPosition = 'center';
          bg.style.filter = 'blur(20px)';
          bg.style.transform = 'scale(1.05)';
        } else {
          // Default: average color tint
          var sampleSize = 32;
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          context.drawImage(img, 0, 0, sampleSize, sampleSize);

          var imageData = context.getImageData(0, 0, sampleSize, sampleSize).data;
          var r = 0;
          var g = 0;
          var b = 0;
          var count = 0;

          for (var i = 0; i < imageData.length; i += 4) {
            var alpha = imageData[i + 3];
            if (alpha < 128) continue;
            r += imageData[i];
            g += imageData[i + 1];
            b += imageData[i + 2];
            count++;
          }

          if (!count) return;

          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);

          var tint = 'rgb(' + Math.round(r * 0.9) + ', ' + Math.round(g * 0.9) + ', ' + Math.round(b * 0.9) + ')';
          bg.style.backgroundColor = tint;
        }
      } catch (e) {
        // Ignore canvas errors (e.g., cross-origin)
      }
    }

    applyDominantColor();
  })();
})();
