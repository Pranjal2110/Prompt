/**
 * ==============================================================================
 * QR Link Generator — Modern & Reliable Client-Side Application Logic
 * ==============================================================================
 *
 * Core Workflow:
 * 1. User inputs a URL.
 * 2. URL is validated strictly (must be non-empty, valid URL with http:// or https://).
 * 3. Exact URL is directly encoded into a QR code using the client-side library.
 * 4. Phone camera scans the QR and is taken directly to the exact destination URL.
 * 5. User can download the QR code as a high-resolution PNG image.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------------------------------
  // DOM Elements Selection
  // ----------------------------------------------------------------------------
  const qrForm = document.getElementById('qrForm');
  const urlInput = document.getElementById('urlInput');
  const inputWrapper = document.getElementById('inputWrapper');
  const clearInputBtn = document.getElementById('clearInputBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  const generateBtn = document.getElementById('generateBtn');
  const errorMessage = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  const suggestionBox = document.getElementById('suggestionBox');
  const suggestionChip = document.getElementById('suggestionChip');

  const placeholderState = document.getElementById('placeholderState');
  const resultState = document.getElementById('resultState');
  const qrContainer = document.getElementById('qrcode');
  const encodedUrlText = document.getElementById('encodedUrlText');
  const testLinkAnchor = document.getElementById('testLinkAnchor');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const generateNewBtn = document.getElementById('generateNewBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  const sampleChips = document.querySelectorAll('.sample-chip');

  // State variables
  let currentQrCodeInstance = null;
  let activeValidatedUrl = '';
  let toastTimer = null;

  // ----------------------------------------------------------------------------
  // 1. Theme Management (Dark / Light Mode)
  // ----------------------------------------------------------------------------
  const savedTheme = localStorage.getItem('qr_app_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('qr_app_theme', newTheme);
  });

  // ----------------------------------------------------------------------------
  // 2. URL Validation Logic
  // ----------------------------------------------------------------------------
  /**
   * Validates that the input is a non-empty, syntactically correct HTTP/HTTPS URL.
   * Rejects plain text (e.g. 'hello', '12345'), empty input, and malformed URLs.
   *
   * @param {string} input - The raw string from the input field
   * @returns {object} Validation result { isValid: boolean, error?: string, suggestion?: string, sanitizedUrl?: string }
   */
  function validateUrl(input) {
    const trimmed = (input || '').trim();

    // Check empty input
    if (!trimmed) {
      return {
        isValid: false,
        error: 'Please enter a URL.'
      };
    }

    // Check for whitespace inside the URL
    if (/\s/.test(trimmed)) {
      return {
        isValid: false,
        error: 'Please enter a valid URL. URLs cannot contain spaces.'
      };
    }

    // Try standard URL parsing
    try {
      const parsed = new URL(trimmed);

      // Enforce http:// or https:// protocol requirement
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return {
          isValid: false,
          error: 'Please enter a valid URL. Links must start with http:// or https://'
        };
      }

      // Check hostname validity (must not be empty and must look like a real host)
      if (!parsed.hostname || parsed.hostname.length < 1) {
        return {
          isValid: false,
          error: 'Please enter a valid URL.'
        };
      }

      // Reject simple non-domain words like 'http://hello' unless it is localhost or contains a dot
      if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
        return {
          isValid: false,
          error: 'Please enter a valid URL.'
        };
      }

      // Passed all checks! Return exact sanitized URL
      return {
        isValid: true,
        sanitizedUrl: trimmed
      };
    } catch (err) {
      // If parsing failed, check if the user entered a domain without protocol (e.g., 'google.com' or 'example.org/path')
      const domainPattern = /^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(:\d+)?(\/.*)?$/;
      let suggestion = null;
      if (domainPattern.test(trimmed)) {
        suggestion = `https://${trimmed}`;
      }

      return {
        isValid: false,
        error: 'Please enter a valid URL.',
        suggestion: suggestion
      };
    }
  }

  // ----------------------------------------------------------------------------
  // 3. UI Error & Suggestion Helpers
  // ----------------------------------------------------------------------------
  function showError(msg, suggestion = null) {
    errorText.textContent = msg;
    errorMessage.classList.remove('hidden');
    inputWrapper.classList.add('input-error');

    if (suggestion) {
      suggestionChip.textContent = suggestion;
      suggestionBox.classList.remove('hidden');
    } else {
      suggestionBox.classList.add('hidden');
    }
  }

  function clearError() {
    errorMessage.classList.add('hidden');
    suggestionBox.classList.add('hidden');
    inputWrapper.classList.remove('input-error');
  }

  // Clicking on the suggestion chip fixes the URL and triggers generation
  suggestionChip.addEventListener('click', () => {
    const fixedUrl = suggestionChip.textContent;
    urlInput.value = fixedUrl;
    clearError();
    updateInputState();
    generateQrCode(fixedUrl);
  });

  // ----------------------------------------------------------------------------
  // 4. Input Field Interactions (Clear, Paste, Typing)
  // ----------------------------------------------------------------------------
  function updateInputState() {
    if (urlInput.value.length > 0) {
      clearInputBtn.classList.remove('hidden');
    } else {
      clearInputBtn.classList.add('hidden');
    }
  }

  urlInput.addEventListener('input', () => {
    updateInputState();
    if (!errorMessage.classList.contains('hidden')) {
      clearError();
    }
  });

  // Clear button action
  clearInputBtn.addEventListener('click', () => {
    urlInput.value = '';
    updateInputState();
    clearError();
    urlInput.focus();
  });

  // Paste from clipboard button action
  pasteBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          urlInput.value = text.trim();
          updateInputState();
          clearError();
          urlInput.focus();
          showToast('Pasted from clipboard');
        }
      } else {
        urlInput.focus();
      }
    } catch (err) {
      // Browser blocked clipboard or permission denied; simply focus input
      urlInput.focus();
    }
  });

  // Sample quick chips
  sampleChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const sample = chip.getAttribute('data-sample');
      urlInput.value = sample;
      updateInputState();
      clearError();
      generateQrCode(sample);
    });
  });

  // ----------------------------------------------------------------------------
  // 5. QR Code Generation Logic
  // ----------------------------------------------------------------------------
  /**
   * Generates a QR code containing the exact URL.
   * Strictly encodes the exact URL without modifications or redirections.
   *
   * @param {string} urlToEncode - The exact validated URL to encode
   */
  function generateQrCode(urlToEncode) {
    if (typeof QRCode === 'undefined') {
      showError('QR Code library is still loading. Please try again in a moment.');
      return;
    }

    // Save active URL
    activeValidatedUrl = urlToEncode;

    // Reset QR canvas container
    qrContainer.innerHTML = '';

    try {
      // Initialize QRCode with High error correction level for maximum readability
      currentQrCodeInstance = new QRCode(qrContainer, {
        text: urlToEncode,
        width: 230,
        height: 230,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      // Update encoded URL details in result card
      encodedUrlText.textContent = urlToEncode;
      encodedUrlText.title = urlToEncode;

      // Update test link
      testLinkAnchor.href = urlToEncode;

      // Switch view: Hide placeholder, show result state with animation
      placeholderState.classList.add('hidden');
      resultState.classList.remove('hidden');

      // Scroll smoothly to preview section on mobile devices
      if (window.innerWidth < 640) {
        resultState.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      showToast('QR Code generated!');
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      showError('Unable to generate QR code for this link. Please check the URL.');
    }
  }

  // Form submission handler
  qrForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();

    const rawInput = urlInput.value;
    const validation = validateUrl(rawInput);

    if (!validation.isValid) {
      showError(validation.error, validation.suggestion);
      urlInput.focus();
      return;
    }

    generateQrCode(validation.sanitizedUrl);
  });

  // ----------------------------------------------------------------------------
  // 6. QR Code Download Functionality (High-Resolution PNG)
  // ----------------------------------------------------------------------------
  /**
   * Downloads the generated QR code as a high-resolution PNG image.
   * Adds a white quiet-zone border around the QR code to ensure 100% scan
   * reliability on any background or photo viewer.
   */
  downloadBtn.addEventListener('click', () => {
    if (!activeValidatedUrl) {
      showError('Please generate a QR code first.');
      return;
    }

    // Locate the canvas or image generated by QRCode library
    const renderedCanvas = qrContainer.querySelector('canvas');
    const renderedImg = qrContainer.querySelector('img');

    // Create a high-resolution export canvas (1000 x 1000 px) for crystal-clear prints & screens
    const targetSize = 1000;
    const margin = 80; // White quiet zone padding
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = targetSize;
    exportCanvas.height = targetSize;
    const ctx = exportCanvas.getContext('2d');

    // 1. Fill solid white background (guarantees scanner contrast)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetSize, targetSize);

    const drawQr = (source) => {
      // 2. Draw QR code centered with nearest-neighbor rendering for crisp pixels
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, margin, margin, targetSize - margin * 2, targetSize - margin * 2);

      // 3. Trigger download as PNG with the requested meaningful filename
      exportCanvas.toBlob((blob) => {
        if (!blob) {
          showError('Failed to generate image download.');
          return;
        }

        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = 'qr-code.png'; // Exact requested filename
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadUrl);

        showToast('QR Code downloaded as qr-code.png');
      }, 'image/png');
    };

    if (renderedCanvas) {
      drawQr(renderedCanvas);
    } else if (renderedImg && renderedImg.src) {
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      tempImg.onload = () => drawQr(tempImg);
      tempImg.src = renderedImg.src;
    } else {
      showError('No QR code found to download.');
    }
  });

  // ----------------------------------------------------------------------------
  // 7. Auxiliary Actions (Copy Link, Generate New QR)
  // ----------------------------------------------------------------------------
  // Copy URL to clipboard
  copyUrlBtn.addEventListener('click', async () => {
    if (!activeValidatedUrl) return;

    try {
      await navigator.clipboard.writeText(activeValidatedUrl);
      const copyLabel = copyUrlBtn.querySelector('.copy-label');
      const originalText = copyLabel.textContent;
      copyLabel.textContent = 'Copied!';
      showToast('Link copied to clipboard');

      setTimeout(() => {
        copyLabel.textContent = originalText;
      }, 2000);
    } catch (err) {
      // Fallback if clipboard API is unavailable
      const textArea = document.createElement('textarea');
      textArea.value = activeValidatedUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Link copied to clipboard');
    }
  });

  // Generate New QR button
  generateNewBtn.addEventListener('click', () => {
    urlInput.value = '';
    updateInputState();
    clearError();
    urlInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ----------------------------------------------------------------------------
  // 8. Toast Notification Utility
  // ----------------------------------------------------------------------------
  function showToast(message) {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastMessage.textContent = message;
    toastNotification.classList.remove('hidden');

    toastTimer = setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 2400);
  }
});
