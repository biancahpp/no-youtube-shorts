(function () {
  'use strict';

  const SHORTS_THUMBNAIL_SELECTOR = '.ytThumbnailViewModelAspectRatio2By3';
  /** YouTube custom element for the Shorts shelf beside a video. */
  const REEL_SHELF_TAG = 'ytd-reel-shelf-renderer';
  /** YouTube custom element for a section on the homepage. */
  const RICH_SECTION_TAG = 'ytd-rich-section-renderer';
  /** Homepage Shorts carousel: ytd-rich-shelf-renderer with is-shorts attribute. */
  const RICH_SHELF_IS_SHORTS = 'ytd-rich-shelf-renderer[is-shorts]';

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
    removeShortsRichSectionsIn(container);
    // Always remove reel shelves from the whole document (sidebar beside video). When the observer
    // gets a small added node, the shelf is an ancestor so we must search body.
    removeReelShelvesIn(document.body);
    const thumbnails = Array.from(container.querySelectorAll(SHORTS_THUMBNAIL_SELECTOR));
    thumbnails.forEach(removeShort);
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
