# Privacy Policy for YouTube AI Content Filter

**Last Updated: November 2, 2025**

## Introduction

YouTube AI Content Filter ("the Extension", "we", "our") is committed to protecting your privacy. This privacy policy explains what data we collect, how we use it, and your rights regarding your information.

## Data Collection

### What We Collect

The Extension collects minimal data necessary for its core functionality:

1. **Anonymous User ID**
   - A randomly generated UUID (Universally Unique Identifier)
   - Generated locally in your browser using `crypto.randomUUID()`
   - Stored in your browser's local storage (Chrome sync storage)
   - Purpose: Prevent duplicate flagging of the same video by one user
   - This ID is NOT linked to any personal information

2. **User Preferences**
   - Video filtering enabled/disabled state
   - Minimum flag threshold (1-10)
   - Selected AI category filters
   - Stored locally in your browser only

3. **Community Flagging Data** (stored in Firebase)
   - YouTube video IDs (public identifiers)
   - Flag counts per video
   - AI content category counts (video, music, voice, images)
   - Anonymous user IDs (only to prevent duplicate flags)
   - Timestamp of last flag

### What We DO NOT Collect

We explicitly DO NOT collect:

- ❌ Personal names, email addresses, or contact information
- ❌ Browsing history or list of videos you watch
- ❌ IP addresses or geolocation data
- ❌ Keystroke logging or mouse tracking
- ❌ Video viewing duration or watch behavior
- ❌ Google account information
- ❌ Any personally identifiable information (PII)
- ❌ Cookies or third-party tracking data

## How We Use Data

### Anonymous User ID
- Used solely to check if a specific user has already flagged a video
- Prevents spam and duplicate flags from the same user
- Never shared with third parties
- Cannot be used to identify you personally

### User Preferences
- Stored locally in your browser
- Never transmitted to any server
- Used only to customize your viewing experience

### Community Flagging Data
- Public database accessible to all extension users
- Used to display AI content badges on YouTube
- Helps community make informed viewing decisions
- No personal information attached to flags

## Data Storage

### Local Storage (Your Browser)
- Anonymous user ID
- Extension preferences and settings
- Managed by Chrome's `chrome.storage.sync` API
- Stays on your device and syncs across your Chrome browsers (if signed in)

### Remote Storage (Firebase Firestore)
- Video IDs and flag counts
- Anonymous user IDs (random UUIDs only)
- AI category statistics
- Hosted on Google Cloud Platform
- No encryption of data at rest (public, non-sensitive data)
- Transmitted over HTTPS (encrypted in transit)

## Data Sharing

### We DO NOT:
- Sell your data to anyone
- Share data with advertisers
- Provide data to third-party analytics services
- Use data for purposes unrelated to the extension's function
- Transfer data for credit scoring or lending purposes

### We DO:
- Make flagging data publicly available to all extension users (video IDs, flag counts, categories only)
- Store anonymous flags in a shared Firebase database
- All data is community-contributed and public by design

## Data Retention

- **Anonymous User IDs**: Retained indefinitely in Firebase (necessary to prevent duplicate flags)
- **Flag Data**: Retained indefinitely (public community database)
- **Local Preferences**: Retained until you uninstall the extension or clear browser data

## Your Rights

### You Have the Right To:

1. **Delete Your Local Data**
   - Uninstall the extension to remove all local data
   - Clear Chrome storage: `chrome://settings/clearBrowserData`

2. **Stop Using the Extension**
   - Simply uninstall from `chrome://extensions/`
   - No account or registration to cancel

3. **Request Information**
   - Contact us via GitHub Issues for data-related questions
   - We cannot identify which flags belong to your anonymous ID

### Limitations

Because we use anonymous UUIDs with no link to personal information:
- We cannot identify which data belongs to you
- We cannot delete specific flags from the database
- We cannot modify historical flag data
- This is by design to protect your privacy

## Third-Party Services

### Firebase (Google Cloud)
- We use Firebase Firestore to store community flags
- Subject to Google's Privacy Policy: https://policies.google.com/privacy
- Firebase does not collect personal information through our extension
- We use Firebase REST API (no Firebase SDK or analytics)

### YouTube
- The extension operates on YouTube.com
- Subject to YouTube's Privacy Policy: https://www.youtube.com/t/privacy
- We do not transmit your YouTube activity to our servers

## Children's Privacy

This extension does not knowingly collect data from children under 13. The extension is designed for general YouTube users and does not request age information.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted:
- In the extension's GitHub repository
- In updated extension versions
- On this privacy policy page

Continued use of the extension after changes constitutes acceptance.

## Security

We implement reasonable security measures:
- HTTPS encryption for all data transmission
- No storage of passwords or authentication credentials
- Minimal data collection reduces exposure
- Open-source code for transparency

However, no method of transmission over the Internet is 100% secure.

## Open Source Transparency

This extension is open-source:
- Source code: https://github.com/YOUR-USERNAME/youtube-ai-filter
- You can review exactly what data is collected and how
- Community contributions and audits welcome

## Contact Us

For privacy concerns or questions:

- **GitHub Issues**: https://github.com/YOUR-USERNAME/youtube-ai-filter/issues
- **Email**: your-email@example.com (if you have one)
- **Repository**: https://github.com/YOUR-USERNAME/youtube-ai-filter

## Legal Compliance

### GDPR (European Users)
- **Data Minimization**: We collect only essential anonymous data
- **Purpose Limitation**: Data used only for flagging functionality
- **Storage Limitation**: Data retained only as needed for service
- **Right to Access**: Limited by anonymous nature of data
- **Legal Basis**: Legitimate interest (community content moderation)

### CCPA (California Users)
- We do not sell personal information
- We collect no personal information as defined by CCPA
- Anonymous identifiers are not linked to you

### General
- This extension complies with Chrome Web Store policies
- We are committed to responsible data handling
- Privacy by design principles applied throughout

---

## Summary

**In Plain English:**

✅ We only collect an anonymous ID to prevent spam flagging  
✅ All your preferences stay on your device  
✅ We don't track what you watch or where you browse  
✅ The flagging database is public and anonymous by design  
✅ We never sell data or use it for ads  
✅ You can uninstall anytime with no account to delete  

**Questions?** Open an issue on GitHub or contact us directly.

---

**YouTube AI Content Filter is an independent, open-source project not affiliated with YouTube or Google.**

