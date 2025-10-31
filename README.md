# 🎬 YouTube AI Content Filter

> Community-powered Chrome extension to flag and filter AI-generated content on YouTube.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green)](https://chrome.google.com/webstore)

A powerful browser extension that helps identify AI-generated content on YouTube through community flagging and classification.

**[🚀 Installation](#-installation) • [✨ Features](#-features) • [🤝 Contributing](CONTRIBUTING.md)**

## ✨ Features

- 🚩 **Flag Videos**: Mark any YouTube video as AI-generated content
- 🏷️ **Visual Badges**: See "AI Content" badges on flagged video thumbnails
- 🎯 **Category System**: Classify content by type (AI Video, Music, Voice, Images)
- 👁️ **Hide Flagged Content**: Optional feature to hide AI-flagged videos
- 🔄 **Smart Caching**: Efficient data management with manual refresh option
- 🌐 **Community-Powered**: Crowd-sourced flagging system

## 🚀 Installation

### For Users

#### Chrome Web Store
*Coming soon - Under review*

#### Manual Installation
1. Download the latest release from [Releases](https://github.com/YOUR-USERNAME/youtube-ai-filter/releases)
2. Extract the ZIP file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked**
6. Select the extracted folder

### For Developers

```bash
git clone https://github.com/YOUR-USERNAME/youtube-ai-filter.git
cd youtube-ai-filter
cp config.example.js config.js
# Edit config.js with your backend credentials
# Load extension in chrome://extensions/
```

---

## 📖 Usage

### Flagging Content

1. Navigate to any YouTube video
2. Click the extension icon in your toolbar
3. Select one or more AI content categories:
   - 🎬 **AI Video** - AI-generated video content
   - 🎵 **AI Music** - AI-generated music or audio
   - 🎤 **AI Voice** - AI voice synthesis or dubbing
   - 🖼️ **AI Images** - AI-generated images in the video
4. Click **"Flag current video as AI"**
5. The video will be marked and visible to all users

### Viewing Flagged Content

- **Homepage**: Flagged videos show badges on thumbnails
- **Watch Page**: Video title displays an AI content badge
- **Recommendations**: Side panel videos also show badges
- **Hover**: See detailed category breakdown in tooltips

### Hiding Content

Toggle the **"Hide AI-flagged videos"** option in the popup to automatically hide flagged content from your feed.

## 🏗️ Architecture

### Project Structure

```
youtube-ai-filter/
├── manifest.json       # Extension configuration
├── content.js          # Main extension logic and badge management
├── popup.html          # Extension popup interface
├── popup.js            # Popup functionality
├── style.css           # Badge and popup styles
├── config.js           # Backend configuration (not in repo)
└── config.example.js   # Configuration template
```

### Configuration

The extension uses a configurable backend. Copy `config.example.js` to `config.js` and fill in your credentials:

```javascript
const FIREBASE_CONFIG_EXTERNAL = {
    apiKey: "YOUR_API_KEY",
    projectId: "YOUR_PROJECT_ID",
    collectionPath: "flags",
    minimumFlagCount: 1
};
```

### Data Structure

Each flagged video stores:
- **Flag count**: Total number of flags
- **Categories**: Breakdown by AI content type
- **Flaggers**: Anonymous user IDs (prevents duplicate flags)
- **Timestamp**: Last update time

## 🐛 Troubleshooting

**Badges not appearing?**
- Click **"🔄 Refresh & Clear Cache"** in the extension popup
- Check Chrome Console for errors (`F12` → Console)
- Ensure you're logged into the backend properly

**Cannot flag videos?**
- Make sure you're on a YouTube video page
- Check that at least one category is selected
- Look for error messages in the popup

**Performance issues?**
- Clear cache using the refresh button
- Reload the extension in `chrome://extensions/`
- Check your internet connection

## 🤝 Contributing

We welcome contributions! Here's how you can help:

- 🐛 **Report bugs** via [GitHub Issues](https://github.com/YOUR-USERNAME/youtube-ai-filter/issues)
- 💡 **Suggest features** in [Discussions](https://github.com/YOUR-USERNAME/youtube-ai-filter/discussions)
- 🔧 **Submit pull requests** - see [CONTRIBUTING.md](CONTRIBUTING.md)
- 📖 **Improve documentation**
- 🌍 **Add translations**

### Development Setup

1. Fork and clone the repository
2. Set up your backend configuration
3. Load the extension in Chrome
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## 🔒 Privacy & Security

- **Anonymous Flagging**: No personal information is collected
- **Local Storage**: User preferences stored locally in browser
- **Secure Backend**: All data encrypted in transit
- **No Tracking**: We don't track your browsing or viewing habits

**For Contributors:** Never commit sensitive credentials. Use `config.js` (gitignored) for local development.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright © 2025 YouTube AI Content Filter Contributors

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR-USERNAME/youtube-ai-filter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR-USERNAME/youtube-ai-filter/discussions)
- **Email**: support@example.com

---

## 🌟 Show Your Support

If you find this extension useful:
- ⭐ Star this repository
- 🐦 Share on social media
- 🔗 Link from your blog/website
- 💬 Leave feedback in Discussions

**Made with ❤️ by the open source community**

