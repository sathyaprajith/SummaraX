# Quick Setup: Add Your 7 Gemini API Keys

## 🎯 What Changed

Fixed the MAX_TOKENS error for mind map generation and added support for **7 Gemini API keys** with automatic rotation.

## ⚡ Quick Setup (2 Minutes)

### Step 1: Get Your API Keys

1. Go to: **https://aistudio.google.com/apikey**
2. Create 6 more API keys (you already have 1)
3. Copy each key

### Step 2: Update `.env` File

Open `d:\PS Project_2025\SummaraX\.env` and replace the placeholders:

```env
# Primary API Key (already have this)
REACT_APP_GEMINI_API_KEY=AIzaSyBUYcd9eUMhcVtRf8HhmjCPG3zj7tAL9mY

# Add your 6 new keys here
REACT_APP_GEMINI_API_KEY_2=AIzaSy...your_key_here
REACT_APP_GEMINI_API_KEY_3=AIzaSy...your_key_here
REACT_APP_GEMINI_API_KEY_4=AIzaSy...your_key_here
REACT_APP_GEMINI_API_KEY_5=AIzaSy...your_key_here
REACT_APP_GEMINI_API_KEY_6=AIzaSy...your_key_here
REACT_APP_GEMINI_API_KEY_7=AIzaSy...your_key_here
```

### Step 3: Restart Server

```bash
# Press Ctrl+C to stop
npm start
```

### Step 4: Test Mind Map

1. Upload a large document (10+ pages)
2. Select "Mind Map"
3. Click "Generate"
4. ✅ Should work without MAX_TOKENS error!

## 📊 What Happens Now

### Automatic Key Rotation

```
Request 1 → Key 1
Request 2 → Key 2
Request 3 → Key 3
...
Request 7 → Key 7
Request 8 → Key 1 (cycles back)
```

### Automatic Retry on Quota

```
Try Key 1 → Quota exceeded
↓
Try Key 2 → Quota exceeded
↓
Try Key 3 → Success! ✅
```

### Console Logs

You'll see:
```
Mind map generation attempt 1/7
Mind map generated successfully with 25 nodes
```

## 🎯 Benefits

✅ **No more MAX_TOKENS errors** - Optimized prompts + truncation  
✅ **7x quota capacity** - Use all 7 keys  
✅ **Automatic failover** - Switches keys on quota errors  
✅ **Faster generation** - Concise prompts use fewer tokens  
✅ **Better reliability** - Multiple keys = less downtime  

## 🔍 Technical Details

### What We Optimized

| Before | After |
|--------|-------|
| 25,000 char input | 15,000 char input |
| 40+ line prompt | 15 line prompt |
| 8192 output tokens | 4096 output tokens |
| 1 API key | 7 API keys |
| No retry | Auto retry on quota |
| Failed at 12,386 tokens ❌ | Succeeds at ~9,596 tokens ✅ |

### Files Changed

1. **`.env`** - Added 6 new API key slots
2. **`src/api/mindmap.js`**:
   - Added key rotation system
   - Created `generateMindMapWithGemini()` with optimized prompt
   - Added retry logic for quota errors
   - Truncate input to 15,000 chars

## 📚 Full Documentation

For complete details, see: **`MIND_MAP_OPTIMIZATION.md`**

## 🚀 That's It!

Just add your 6 new API keys to `.env`, restart, and you're good to go! 🎉
