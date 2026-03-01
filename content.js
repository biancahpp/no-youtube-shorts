(function () {
  'use strict';

  const SHORTS_THUMBNAIL_SELECTOR = '.ytThumbnailViewModelAspectRatio2By3';

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
   * Find all Short thumbnails inside `container` and remove each (via wrapping parent or thumbnail).
   */
  function removeShortsIn(container) {
    if (!container || !container.querySelectorAll) return;
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
  observeForNewShorts();
})();
