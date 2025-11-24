// Moodle Hidden Text Scanner

(function() {
  console.log("injectionkiller: scanning for prompt injection attacks.");

  const THRESHOLD_FONT_SIZE_PX = 0.7;
  const THRESHOLD_OPACITY = 0.1;

  function isTransparent(style) {
    // Check opacity
    if (parseFloat(style.opacity) < THRESHOLD_OPACITY) return true;
    
    // Check text color alpha
    const color = style.color; // usually "rgb(r, g, b)" or "rgba(r, g, b, a)"
    if (color.startsWith('rgba')) {
      const alpha = parseFloat(color.split(',')[3]);
      if (alpha < THRESHOLD_OPACITY) return true;
    }
    if (color === 'transparent') return true;

    return false;
  }

  function isSmall(style) {
    const fontSize = parseFloat(style.fontSize);
    return fontSize < THRESHOLD_FONT_SIZE_PX;
  }

  function scanPage() {
    console.log("injectionkiller: scanning page...");
    const allElements = document.querySelectorAll('body *');
    const suspiciousElements = [];

    allElements.forEach(el => {
      // Skip script, style, and other non-visible metadata tags
      if (['SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT'].includes(el.tagName)) return;

      const style = window.getComputedStyle(el);
      const transparent = isTransparent(style);
      const small = isSmall(style);

      if (transparent && small) {
        // Verify it actually has text content AND is copy-pastable (rendered)
        // innerText checks if the element is visible (not display:none, visibility:hidden)
        // and returns the text as rendered.
        if (el.innerText.trim().length > 0) {
           suspiciousElements.push(el);
        }
      }
    });

    console.log(`injectionkiller: found ${suspiciousElements.length} suspicious elements!`);
    console.log(suspiciousElements);

    if (suspiciousElements.length > 0) {
      checkSettingsAndNotify(suspiciousElements);
    }
  }

  function checkSettingsAndNotify(elements) {
    const storage = (typeof browser !== 'undefined' ? browser : chrome).storage;
    
    // Use local storage to check for 'peaceOfMind' setting
    storage.local.get(['mode'], (result) => {
      const mode = result.mode || 'manual'; // Default to manual
      
      if (mode === 'peaceOfMind') {
        // Automatically remove elements
        elements.forEach(el => el.remove());
        showPeaceOfMindNotification(elements.length);
      } else {
        // Default manual mode
        notifyUser(elements);
      }
    });
  }

  function showPeaceOfMindNotification(count) {
     // Remove existing banner if any
    const existing = document.getElementById('injection-finder-notification');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'injection-finder-notification';
    banner.style.setProperty('background-color', '#509951', 'important');
    
    const msg = document.createElement('span');
    msg.textContent = `🛡️ injectionkiller: successfully removed ${count} hidden element${count > 1 ? 's' : ''}.`;
    
    // Simple layout for this one
    banner.appendChild(msg);
    document.body.prepend(banner);

    setTimeout(() => {
        banner.classList.add('fade-out');
        // Remove from DOM after transition completes
        setTimeout(() => {
          if (banner.parentNode) banner.remove();
        }, 2000); // Match transition time + buffer
    }, 1000);
  }

  function createBanner(elements) {
    const banner = document.createElement('div');
    banner.id = 'injection-finder-notification';
    
    const msg = document.createElement('span');
    msg.textContent = `⚠️ injectionkiller: found hidden text elements!`;
    
    const revealBtn = document.createElement('button');
    revealBtn.textContent = "reveal";
    
    let isRevealed = false;

    revealBtn.onclick = () => {
      isRevealed = !isRevealed;
      elements.forEach((el) => {
        el.classList.toggle('injection-finder-highlight');
      });
      revealBtn.textContent = isRevealed ? "hide" : "reveal";
    };

    const removeBtn = document.createElement('button');
    removeBtn.textContent = "remove";
    removeBtn.onclick = () => {
      elements.forEach(el => el.remove());
      banner.remove(); // Remove banner after deleting elements
      showPeaceOfMindNotification(elements.length);
      stopObserver(); // Stop scanning as user has taken action
    };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = "dismiss";
    closeBtn.onclick = () => {
      banner.remove();
      stopObserver(); // Stop scanning as user dismissed the warning
    };

    leftContainer = document.createElement('div');
    rightContainer = document.createElement('div');
    leftContainer.appendChild(msg);
    rightContainer.appendChild(revealBtn);
    rightContainer.appendChild(removeBtn);
    rightContainer.appendChild(closeBtn);

    banner.appendChild(leftContainer);
    banner.appendChild(rightContainer);

    return banner;
  }

  function notifyUser(elements) {
    // Remove existing banner if any
    const existing = document.getElementById('injection-finder-notification');
    if (existing) existing.remove();

    const banner = createBanner(elements);
    document.body.prepend(banner);
  }

  // Listen for settings updates from popup
  const runtime = (typeof browser !== 'undefined' ? browser : chrome).runtime;
  runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateSettings") {
       console.log("injectionkiller: settings updated to", request.mode);
       // Trigger a re-scan to apply new settings immediately
       scanPage(); 
    }
  });

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanPage);
  } else {
    scanPage();
  }

  // Observe for dynamic content
  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(scanPage, 2000); // Debounce scan
  });
  
  function startObserver() {
     observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserver() {
    console.log("injectionkiller: stopping observer.");
    observer.disconnect();
    clearTimeout(timeout);
  }

  startObserver();

})();

