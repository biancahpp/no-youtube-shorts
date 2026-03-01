(function () {
  'use strict';

  const SHORTS_THUMBNAIL_SELECTOR = '.ytThumbnailViewModelAspectRatio2By3';
  /** YouTube custom element for the Shorts shelf beside a video. */
  const REEL_SHELF_TAG = 'ytd-reel-shelf-renderer';
  /** YouTube custom element for a section on the homepage. */
  const RICH_SECTION_TAG = 'ytd-rich-section-renderer';
  /** Homepage Shorts carousel: ytd-rich-shelf-renderer with is-shorts attribute. */
  const RICH_SHELF_IS_SHORTS = 'ytd-rich-shelf-renderer[is-shorts]';
  /** Loader placeholder that can be left after removing the Shorts shelf (watch-page sidebar). */
  const CONTINUATION_ITEM_TAG = 'ytd-continuation-item-renderer';
  /** Homepage grid item (video card); more stable anchor than whole section. */
  const RICH_ITEM_TAG = 'ytd-rich-item-renderer';
  /** Homepage main grid. */
  const RICH_GRID_TAG = 'ytd-rich-grid-renderer';

  /**
   * True if this element is (or contains) the homepage Shorts section.
   */
  function isShortsSection(section) {
    return section.querySelector(RICH_SHELF_IS_SHORTS) ||
      section.querySelector(SHORTS_THUMBNAIL_SELECTOR) ||
      section.querySelector(REEL_SHELF_TAG);
  }

  /**
   * Remove ytd-rich-section-renderer elements that contain Shorts (homepage "Shorts" carousel).
   */
  function removeShortsRichSectionsIn(container) {
    if (!container || !container.querySelectorAll) return;
    const sections = Array.from(container.querySelectorAll(RICH_SECTION_TAG));
    sections.forEach(function (section) {
      if (isShortsSection(section)) section.remove();
    });
  }

  /**
   * Remove all reel-shelf elements in `container` (Shorts shelf beside a video).
   */
  function removeReelShelvesIn(container) {
    if (!container || !container.querySelectorAll) return;
    const shelves = Array.from(container.querySelectorAll(REEL_SHELF_TAG));
    shelves.forEach(function (el) { el.remove(); });
  }

  /**
   * Remove ytd-continuation-item-renderer (loader with spinner) only when it has an element
   * after it—i.e. more content has loaded and the loader is the leftover Shorts placeholder.
   * Avoids touching continuation items used for comments or still loading.
   */
  function removeOrphanedShortsLoadersIn(container) {
    if (!container || !container.querySelectorAll) return;
    const items = Array.from(container.querySelectorAll(CONTINUATION_ITEM_TAG));
    items.forEach(function (el) {
      if (el.nextElementSibling) el.remove();
    });
  }

  /**
   * Find the smallest ancestor of `thumbnail` that contains exactly one Short thumbnail.
   * Returns that ancestor, or null if none (e.g. thumbnail is inside a container with many Shorts).
   */
  function findWrappingParent(thumbnail) {
    let el = thumbnail.parentElement;
    while (el) {
      const count = el.querySelectorAll(SHORTS_THUMBNAIL_SELECTOR).length;
      if (count === 1) return el;
      el = el.parentElement;
    }
    return null;
  }

  /**
   * Find the element that actually scrolls on the page (homepage grid lives inside it).
   * YouTube may use document or an inner div with overflow.
   */
  function getScrollContainer() {
    const grid = document.querySelector(RICH_GRID_TAG);
    if (grid) {
      let el = grid.parentElement;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const oy = style.overflowY;
        if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') {
          return el;
        }
        el = el.parentElement;
      }
    }
    return document.scrollingElement || document.documentElement;
  }

  /**
   * Find a visible homepage element we are not removing, to use as scroll anchor.
   * Prefer first visible video card (ytd-rich-item-renderer) not in a Shorts section; else first visible non-Shorts section.
   * Returns { element, top } or null.
   */
  function getHomepageScrollAnchor() {
    const viewHeight = window.innerHeight;

    // Prefer first visible rich-item (video card) that isn't inside a Shorts section
    const items = document.body.querySelectorAll(RICH_ITEM_TAG);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const section = item.closest(RICH_SECTION_TAG);
      if (section && isShortsSection(section)) continue;
      const rect = item.getBoundingClientRect();
      if (rect.top < viewHeight && rect.bottom > 0) {
        return { element: item, top: rect.top };
      }
    }

    // Fallback: first visible non-Shorts section
    const sections = document.body.querySelectorAll(RICH_SECTION_TAG);
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (isShortsSection(section)) continue;
      const rect = section.getBoundingClientRect();
      if (rect.top < viewHeight && rect.bottom > 0) {
        return { element: section, top: rect.top };
      }
    }
    return null;
  }

  /**
   * Apply scroll delta to the correct container (window vs inner div).
   */
  function applyScrollDelta(delta) {
    const container = getScrollContainer();
    if (container === document.documentElement || container === document.body) {
      window.scrollBy(0, delta);
    } else {
      container.scrollTop += delta;
    }
  }

  /**
   * Remove one Short: remove its wrapping parent if found (so the whole card is removed),
   * otherwise remove just the thumbnail element.
   */
  function removeShort(thumbnail) {
    if (!thumbnail.isConnected) return;
    const wrapper = findWrappingParent(thumbnail);
    if (wrapper) wrapper.remove();
    else thumbnail.remove();
  }

  /**
   * Remove all Shorts in `container`: rich sections that contain Shorts (homepage),
   * reel shelves (sidebar), then any remaining Short thumbnails via wrapping parent or thumbnail.
   */
  function removeShortsIn(container) {
    if (!container || !container.querySelectorAll) return;
    // If the added node is itself the homepage Shorts section (contains Shorts), remove it.
    if (container.nodeType === Node.ELEMENT_NODE &&
        container.tagName &&
        container.tagName.toLowerCase() === RICH_SECTION_TAG &&
        isShortsSection(container)) {
      container.remove();
      return;
    }
    // On homepage only, save scroll anchor before removing sections so we can restore view after.
    const isHomepage = /^\/(feed\/.*)?$/.test(window.location.pathname) || window.location.pathname === '/';
    const anchor = isHomepage && document.body.querySelector(RICH_SECTION_TAG) ? getHomepageScrollAnchor() : null;
    const savedTop = anchor ? anchor.top : null;

    removeShortsRichSectionsIn(container);
    // Always remove reel shelves from the whole document (sidebar beside video). When the observer
    // gets a small added node, the shelf is an ancestor so we must search body.
    removeReelShelvesIn(document.body);
    // Remove continuation-item loader when content has loaded after it (next sibling present).
    removeOrphanedShortsLoadersIn(document.body);
    const thumbnails = Array.from(container.querySelectorAll(SHORTS_THUMBNAIL_SELECTOR));
    thumbnails.forEach(removeShort);

    // Restore scroll so the same row stays in view (avoids jump when Shorts are removed).
    if (anchor && anchor.element.isConnected && savedTop != null) {
      const el = anchor.element;
      const saved = savedTop;
      function restore() {
        if (!el.isConnected) return;
        const newTop = el.getBoundingClientRect().top;
        applyScrollDelta(newTop - saved);
      }
      requestAnimationFrame(function () {
        requestAnimationFrame(restore);
      });
    }
  }

  /**
   * One-time cleanup: remove all Shorts currently on the page.
   */
  function removeAllShorts() {
    removeShortsIn(document.body);
  }

  /**
   * Start observing the DOM for new nodes; remove any Shorts that appear.
   */
  function observeForNewShorts() {
    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            removeShortsIn(node);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  removeAllShorts();
  // Second pass after a short delay (homepage Shorts section often injects slightly later).
  setTimeout(removeAllShorts, 800);
  observeForNewShorts();
})();
