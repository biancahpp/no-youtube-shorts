# No YouTube Shorts

A minimal browser extension that removes YouTube Shorts thumbnails from the feed so you can browse YouTube without short-form content begging for your attention.

If you, like me, love YouTube but don’t want to be distracted by short-form content and the “brain rot” that comes with endless scrolling, this extension is for you. It hides Shorts from the homepage and from the shelf beside videos. No thumbnails, no clickbait, just the long-form stuff you came for.

---

## What it does

- **Removes Shorts thumbnails** from the YouTube homepage and from the “Shorts” shelf next to videos.
- **Keeps watching** as you scroll: when YouTube loads more content, the extension removes new Shorts too (via a DOM observer).
- **No account, no server, no data.** Everything runs in your browser. We don’t collect, store, or send any data.

---

## Why short-form content can be harmful

Research suggests that heavy use of short-form video (TikTok, YouTube Shorts, Reels) is linked to:

- **Worse attention and self-control** – A 2023 study found that short-form video use (e.g. TikTok) with rapid context-switching degraded people’s ability to retain intentions and carry out planned actions (prospective memory), more so than other platforms ([Chen et al., 2023](https://arxiv.org/abs/2302.03714)).
- **“TikTok brain”** – Short clips are designed to match shrinking attention spans; over time, heavy consumption can make it harder to focus on longer content and sustain attention ([Science Times, 2024](https://www.sciencetimes.com/articles/50587/20240607/tiktok-brain-short-videos-suit-attention-spans-killing-ability-concentrate.htm)).
- **Cognitive and mental health** – A 2024 meta-analysis of many studies reported that more short-form video use was associated with poorer cognitive function (especially attention and inhibitory control) and with higher stress and anxiety ([systematic review, e.g. medRxiv 2025](https://www.medrxiv.org/content/10.1101/2025.08.27.25334540v2.full)).

This extension doesn’t fix the whole problem, but it helps you keep Shorts out of sight so you can choose what you watch instead of being nudged into endless short clips.

---

## Browser compatibility

The extension is built for **Manifest V3** (Chromium extension format), so it works in:

- **Chrome**
- **Edge, Brave, Opera, Vivaldi, and other Chromium-based browsers**

**Firefox** supports Manifest V3; you can try loading the unpacked extension via `about:debugging` → “This Firefox” → “Load Temporary Add-on” and selecting the folder. Behavior should be the same since the code only uses standard DOM APIs and no Chrome-specific ones.

**Safari** uses a different extension format and would require separate packaging (e.g. via Xcode) to run there.

---

## Installation

**Chrome / Chromium-based browsers**

1. Open the browser’s extensions page (e.g. Chrome: `chrome://extensions/`).
2. Turn on **Developer mode** (usually top right).
3. Click **Load unpacked** and select the folder that contains `manifest.json` and `content.js`.
4. Go to YouTube. Shorts thumbnails should disappear from the feed and from the sidebar; new ones are removed as they load while you scroll.

**Firefox** – Use `about:debugging` → “This Firefox” → “Load Temporary Add-on” and select the extension folder.

---

## Privacy and data

- **We do not collect any data.** The extension does not send information to any server.
- **We do not use analytics, tracking, or telemetry.** There is no backend; everything runs locally in your browser.
- **We do not store or read your personal information.** The content script only looks at the page’s DOM to find and hide Shorts thumbnails. It does not access your account, watch history, or any other data.

You can confirm this by reading the source: the extension consists of `manifest.json` (no broad permissions) and `content.js` (DOM-only logic, no network requests).

**Privacy policy:** [View our privacy policy](https://your-username.github.io/no-youtube-shorts/).

---

## How it works

The extension injects a small script on YouTube pages that:

1. **Homepage** – Removes whole Shorts sections (`ytd-rich-section-renderer` that contain the Shorts carousel, e.g. `ytd-rich-shelf-renderer[is-shorts]` or the 2:3 Shorts thumbnail class).
2. **Watch page sidebar** – Removes the Shorts shelf (`ytd-reel-shelf-renderer`) and, when content has loaded after it, the leftover loader (`ytd-continuation-item-renderer` with spinner) so the spinner doesn’t stay on screen.
3. **Any remaining Shorts** – Finds thumbnails with the 2:3 aspect-ratio class YouTube uses for Shorts, walks up the DOM to the smallest parent that wraps that one Short, and removes that block so the layout stays clean.
4. **Scroll restoration (homepage only)** – Before removing Shorts, it picks a visible anchor (the first visible video card or non-Shorts section), detects the actual scroll container (the element that scrolls, not necessarily the window), then after removals restores scroll so that anchor stays in the same place and the feed doesn’t jump.
5. **Ongoing** – A `MutationObserver` runs so when YouTube adds more content (e.g. on infinite scroll), new Shorts and loaders are removed as they appear.

No API keys, no external services, no data collection—just DOM manipulation to hide Shorts.

---

## License

Use and modify as you like. No warranty; use at your own risk.

