# Legal Documents Setup Guide

## Overview
This guide explains how to customize the Terms and Conditions and Privacy Policy for your Wellness Buddy PWA application.

## Files Created

### Components (Modal Versions)
- `src/components/TermsAndConditions.js` - Modal popup version for login screen
- `src/components/PrivacyPolicy.js` - Modal popup version for login screen

### Pages (Standalone Versions)
- `src/pages/TermsPage.js` - Full page version accessible via routing
- `src/pages/PrivacyPage.js` - Full page version accessible via routing

## Customization Required

### 1. Company Information
Update the following placeholders in both Terms and Privacy Policy:

```javascript
// Replace these placeholders with your actual information:
- [Your Business Address] → Your actual business address
- [Your Phone Number] → Your contact phone number
- [Your Jurisdiction] → Your legal jurisdiction (e.g., "California, USA")
- support@wellnessbuddy.app → Your actual support email
- privacy@wellnessbuddy.app → Your actual privacy contact email
```

### 2. Legal Jurisdiction
In the Terms and Conditions, update the "Governing Law" section:
```javascript
// Line in TermsAndConditions.js:
"These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction]"
```

### 3. Business Details
Update contact information in both documents:
- Business name and address
- Contact email addresses
- Phone numbers
- Legal entity information

## Features Included

### ✅ Industry Standard Compliance
- **GDPR Compliance**: Data protection rights, consent, data portability
- **CCPA Compliance**: California privacy rights and disclosures
- **COPPA Compliance**: Children's privacy protection (under 13)
- **Mobile App Guidelines**: App store compliance requirements

### ✅ Comprehensive Coverage
**Terms and Conditions Include:**
- Service description and user accounts
- Health disclaimers (important for wellness apps)
- User conduct and prohibited uses
- Intellectual property rights
- Liability limitations and disclaimers
- Termination policies
- Changes to terms procedure

**Privacy Policy Includes:**
- Detailed data collection practices
- Information usage and sharing policies
- Third-party service disclosures
- Data security measures
- User rights and choices (GDPR/CCPA)
- Data retention policies
- International transfer safeguards
- Cookie and tracking disclosures

### ✅ User Experience Features
- **Responsive Design**: Works on all device sizes
- **Accessible**: Keyboard navigation and screen reader friendly
- **Professional Styling**: Matches your app's design theme
- **Easy Navigation**: Clear close buttons and scroll functionality
- **Interactive Links**: Clickable terms and privacy links in login footer

## Implementation Details

### Login Integration
The Terms and Privacy Policy are integrated into your login screen:

```javascript
// In Login.js footer:
<p className="mt-6 text-center text-xs text-gray-400">
  By continuing, you agree to our{' '}
  <button onClick={() => setShowTerms(true)}>Terms</button>{' '}
  and{' '}
  <button onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
</p>
```

### Modal Behavior
- **Backdrop Click**: Closes modal when clicking outside
- **Escape Key**: Close with keyboard navigation
- **Scroll Support**: Full content scrollable within modal
- **Mobile Optimized**: Responsive design for all screen sizes

## Legal Recommendations

### ⚠️ Important Legal Notes

1. **Professional Review**: Have these documents reviewed by a qualified attorney familiar with:
   - Your jurisdiction's laws
   - Health app regulations (FDA, medical device laws)
   - Data privacy laws (GDPR, CCPA, etc.)
   - Mobile app compliance requirements

2. **Regular Updates**: Legal requirements change frequently. Review and update:
   - When laws change in your jurisdiction
   - When you add new features or data collection
   - When you change third-party services
   - At least annually as a best practice

3. **Consent Tracking**: Consider implementing:
   - Version tracking for terms acceptance
   - Timestamp logging when users accept terms
   - Re-consent prompts when terms are updated significantly

4. **Health App Specific**: Since this is a wellness app, consider additional disclosures for:
   - Medical disclaimers and limitations
   - AI/ML accuracy limitations
   - Integration with health data regulations
   - Professional medical advice disclaimers

## Technical Integration

### Adding to Routes (Optional)
If you want standalone pages accessible via URL:

```javascript
// In your App.js or router configuration:
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

// Add routes:
<Route path="/terms" element={<TermsPage />} />
<Route path="/privacy" element={<PrivacyPage />} />
```

### Styling Customization
Both components use Tailwind CSS classes that match your app's design system:
- Green/teal gradient headers
- Consistent spacing and typography
- Responsive breakpoints
- Accessible color contrast

## Testing Checklist

- [ ] Terms modal opens and closes properly
- [ ] Privacy modal opens and closes properly  
- [ ] Content is fully scrollable on mobile devices
- [ ] Links and buttons are properly clickable
- [ ] Backdrop clicks close the modals
- [ ] Content is readable on all screen sizes
- [ ] All placeholder text has been replaced with actual information
- [ ] Contact information is correct and functional
- [ ] Legal disclaimers are appropriate for your use case

## Deployment Notes

These legal documents are included in your production build and will be available to users immediately. Make sure all customizations are complete before deploying to production.

---

**Disclaimer**: These templates provide a starting point for legal compliance but do not constitute legal advice. Always consult with qualified legal counsel for your specific situation and jurisdiction.
