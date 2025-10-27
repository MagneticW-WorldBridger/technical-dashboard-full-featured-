# Woodstock Widget CSP Debugging Guide

## Immediate Action Required

### For Darrell (Technical Team):

Add these domains to CSP whitelist:

```xml
<!-- Already added ✅ -->
<value id="chat-widget" type="host">https://dynamiccode-ochre.vercel.app</value>

<!-- MISSING - ADD IMMEDIATELY ❌ -->
<value id="chat-widget-iframe" type="host">https://woodstock.demo.aiprlassist.com</value>
<value id="chat-widget-icons" type="host">https://storage.googleapis.com</value>
```

## Browser Console Debugging

### Step 1: Check Console Errors
Open browser console on: https://wfostage.rvadv.com/furniture/living-room/sofas-loveseats/loveseats

Look for:
- `[AI PRL Assist]` log messages
- CSP violation errors
- Network request failures
- Image load failures

### Step 2: Check Network Tab
Filter for:
- `dynamiccode-ochre.vercel.app` (should be 200)
- `woodstock.demo.aiprlassist.com` (likely blocked)
- `storage.googleapis.com` (likely blocked)

### Step 3: Check Elements Tab
Look for:
- `.ai-prl-chat-bubble` element
- Background images loading
- CSS styles applied

## Expected Console Output (When Working)

```
[AI PRL Assist] 🚀 AUTO-INIT detected configuration
[AI PRL Assist] ✅ Using EMBEDDED config for siteId: woodstock_outlet
[AI PRL Assist] Widget ready with config
[AI PRL Assist] Bubble shown
[AI PRL Assist] Teaser shown
```

## Troubleshooting Steps

### If No Console Messages:
1. Script not loading - check CSP for `dynamiccode-ochre.vercel.app`
2. JavaScript errors - check for syntax/runtime errors

### If Console Shows Loading but No Visual:
1. Icon not loading - check CSP for `storage.googleapis.com`
2. CSS conflicts - check for z-index issues
3. Element positioning - check bubble positioning

### If Bubble Shows but Chat Doesn't Open:
1. Iframe blocked - check CSP for `woodstock.demo.aiprlassist.com`
2. Click handler issues - check JavaScript errors

## Alternative CSP Formats

Different servers use different CSP formats. Try these if above doesn't work:

### Apache/Nginx Header Format:
```
Content-Security-Policy: frame-src 'self' https://dynamiccode-ochre.vercel.app https://woodstock.demo.aiprlassist.com; img-src 'self' https://storage.googleapis.com; script-src 'self' https://dynamiccode-ochre.vercel.app;
```

### Meta Tag Format:
```html
<meta http-equiv="Content-Security-Policy" content="frame-src 'self' https://dynamiccode-ochre.vercel.app https://woodstock.demo.aiprlassist.com; img-src 'self' https://storage.googleapis.com; script-src 'self' https://dynamiccode-ochre.vercel.app;">
```

## Testing Commands

### For Jean (Internal Testing):
```bash
# Test script loading
curl -I https://dynamiccode-ochre.vercel.app/chat-widget-nuclear.js

# Test API endpoint
curl https://dynamiccode-ochre.vercel.app/api/load-config?siteId=woodstock_outlet

# Test chat URL
curl -I https://woodstock.demo.aiprlassist.com
```

## Emergency Fallback Options

If CSP can't be modified immediately:

### Option 1: Self-Hosted Icons
Replace Google Storage icon with self-hosted:
```json
"iconUrl": "https://wfostage.rvadv.com/assets/chat-icon.png"
```

### Option 2: New Tab Mode
Force new tab opening (bypasses CSP):
```json
"noOverlay": true
```

### Option 3: Inline SVG Icon
Replace external icon with inline SVG (no external requests).

## Contact Information

**Technical Issue Owner:** Jean (Chat Widget Developer)
**Client Technical Contact:** Darrell Hollis (darrellh@rvadv.com)
**Project Manager:** Jessica Carrasquillo

## Expected Timeline

- **Immediate (0-2 hours):** Darrell adds missing CSP domains
- **Verification (2-4 hours):** Test widget functionality on stage site
- **Deployment (24-48 hours):** Move to production if tests pass

## Success Criteria

✅ Chat bubble appears in bottom-right corner
✅ Bubble shows Woodstock branding/icon  
✅ Teaser message appears after 3 seconds
✅ Clicking bubble opens chat interface
✅ Chat interface loads without errors
✅ All console logs show successful initialization

