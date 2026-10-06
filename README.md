# QR Link Generator

> Turn any link into an instant, scannable QR code. Clean, modern, client-side, and privacy-focused with 100% direct URL encoding.

![QR Link Generator Preview](https://img.shields.io/badge/Status-Complete-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-orange?style=for-the-badge)

---

## Overview

**QR Link Generator** is a fast, web-based tool designed to turn web addresses directly into high-contrast QR codes. 

When scanned by a smartphone camera, users are taken directly to the exact destination link—with no middleman, URL shorteners, or redirect servers.

---

## Features

- **100% Direct Encoding**: Encodes the exact URL entered without intermediate redirects or database lookups.
- **Strict URL Validation**: Validates inputs to ensure they are proper HTTP/HTTPS links, rejecting invalid strings, spaces, and plain text.
- **Smart Protocol Suggestion**: If a domain is entered without protocol (e.g. `google.com`), provides a one-click chip to format as `https://google.com`.
- **High-Resolution PNG Download**: Exports crisp, print-ready ($1000 \times 1000\,\text{px}$) PNG files with a quiet-zone white margin for reliable camera detection.
- **Copy & Test Link**: One-click clipboard copy with animated toast notification, plus an instant "Test Link" button to verify destination URLs.
- **Responsive & Themed**: Fully responsive on desktop, tablet, and mobile with Dark Mode and Light Mode support.
- **Offline Capable**: Uses a local client-side QR generation engine with CDN fallback.

---

## Getting Started

No build tools or external servers required.

### 1. Clone the repository
```bash
git clone https://github.com/Pranjal2110/Prompt.git
cd Prompt
```

### 2. Run locally
Open `index.html` in your browser:
```bash
# On macOS:
open index.html

# Or with a local server:
python3 -m http.server 3000
```

---

## Project Structure

```text
├── index.html       # Semantic HTML5 markup, accessibility tags & SEO metadata
├── style.css        # Vanilla CSS design system, dark/light themes & animations
├── app.js           # URL validation, QR generation & PNG export logic
├── qrcode.min.js    # Local client-side QR generation library
└── README.md        # Documentation
```

---

## License

This project is licensed under the [MIT License](LICENSE).
