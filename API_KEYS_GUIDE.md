# 🔑 Multi-Key API Configuration

## Overview

SummaraX now supports **multiple Gemini API keys** with automatic rotation and fallback! This ensures:

✅ **No downtime** - Automatically switches to backup keys when rate limits hit  
✅ **Load balancing** - Distributes requests across multiple keys  
✅ **Higher throughput** - 4 keys = 4x the rate limit capacity  
✅ **Zero configuration** - Just add keys, the system handles the rest  

---

## How It Works

### Round-Robin Rotation
- Keys are used in sequence: Key 1 → Key 2 → Key 3 → Key 4 → Key 1...
- Each request uses the next key in rotation
- Maximizes available quota across all keys

### Automatic Fallback
When a request fails due to:
- ⏱️ **Rate limits** (429 error)
- 🚫 **Quota exceeded** (403 error)  
- 🌐 **Network issues**

The system **automatically retries** with the next available key!

---

## Configuration

### Your Current Setup (.env)

```env
# Primary key
REACT_APP_GEMINI_API_KEY=AIzaSyB8mRWPw2I7_6mJPGVuHepn1L72zvkGjJ8

# Backup keys
REACT_APP_GEMINI_API_KEY_2=AIzaSyAfr6EBR9QlkoOo8xhdGl8LDM4bOx0wHs8
REACT_APP_GEMINI_API_KEY_3=AIzaSyBI2rD2-J-w1uJrqeXef_LrDl_shondm3M
REACT_APP_GEMINI_API_KEY_4=AIzaSyBISsT2C4Pct6a_zkILWwm7FhMPl9mUB_c
```

### Status Display

The Generator page shows:
- 🔑 **Number of configured keys**
- ✅ **"Auto-rotation enabled"** when multiple keys are available

---

## Rate Limits per Key

**Gemini 1.5 Flash (Free Tier):**
- 15 requests per minute
- 1,500 requests per day

**With 4 keys, you get:**
- 60 requests per minute (4x)
- 6,000 requests per day (4x)

---

## Logging

Check browser console for API key rotation logs:
```
Attempting API call with key #1...
✓ API call successful!
```

Or when switching keys:
```
Key failed (rate limit/quota): Resource exhausted. Trying next key...
Attempting API call with key #2...
✓ API call successful!
```

---

## Error Handling

### All Keys Fail
If all 4 keys fail, you'll see:
```
Error: All API keys failed. Please check your keys or try again later.
```

**Solutions:**
1. Wait for rate limits to reset (1 minute)
2. Check key validity at [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Add more keys to `.env`

### No Keys Configured
```
Error: No API keys configured. Please add REACT_APP_GEMINI_API_KEY to your .env file
```

**Solution:** Add at least one key with `REACT_APP_` prefix

---

## Best Practices

### For Demos (2-hour presentation)
- ✅ 1-2 keys is enough
- Rate limits rarely hit with normal demo usage

### For Development
- ✅ 2-3 keys recommended
- Prevents interruptions during testing

### For Production
- ✅ 4+ keys for high availability
- Consider upgrading to Gemini Pro API for higher limits

---

## Testing the Rotation

1. **Normal flow:** Keys rotate automatically with each request
2. **Force failure:** Remove one key temporarily to see fallback in action
3. **Check logs:** Open browser console (F12) to see which key is used

---

## Adding More Keys

Want to add a 5th key? Easy!

1. Get a new API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env`:
   ```env
   REACT_APP_GEMINI_API_KEY_5=your_new_key_here
   ```
3. Update `gemini.js`:
   ```javascript
   const GEMINI_API_KEYS = [
     process.env.REACT_APP_GEMINI_API_KEY,
     process.env.REACT_APP_GEMINI_API_KEY_2,
     process.env.REACT_APP_GEMINI_API_KEY_3,
     process.env.REACT_APP_GEMINI_API_KEY_4,
     process.env.REACT_APP_GEMINI_API_KEY_5, // Add this line
   ].filter(key => key && key !== "your_gemini_api_key_here");
   ```
4. Restart the server

---

## Security Notes

⚠️ **Never commit your `.env` file!**

The `.gitignore` is already configured to exclude:
- `.env`
- `.env.local`
- `.env.*.local`

Always use `.env.example` for sharing configuration templates.

---

## Troubleshooting

### Keys not rotating?
- Ensure all keys have `REACT_APP_` prefix
- Restart the development server: `npm start`
- Check browser console for errors

### Still hitting rate limits?
- Wait 1 minute for limits to reset
- Add more keys to increase capacity
- Consider spacing out requests

### One key is invalid?
- The system will skip invalid keys automatically
- Remove invalid keys from `.env`
- Get new keys from [Google AI Studio](https://aistudio.google.com/app/apikey)

---

**Made with ❤️ to ensure your demo runs smoothly!**
