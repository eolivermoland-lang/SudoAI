# 🤖 SudoAI - Intelligent AI Assistant

A beautiful, modern AI chatbot with user authentication, chat history, and intelligent responses.

## ✨ Features

- ✅ **User Authentication** - Secure login and signup with Firebase
- ✅ **Chat History** - Save and access all your conversations
- ✅ **Smart AI** - Intelligent responses (with API integration)
- ✅ **Beautiful UI** - Modern, professional design
- ✅ **Real-time Updates** - Messages sync instantly
- ✅ **Multiple Chats** - Create and manage multiple conversations
- ✅ **Responsive** - Works on all devices

## 🚀 Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: **SudoAI** (or your preferred name)
4. Follow the setup wizard
5. Click "Continue" through the steps

### Step 2: Enable Authentication

1. In your Firebase project, click **Authentication** in the left menu
2. Click "Get Started"
3. Click on **Email/Password** under Sign-in method
4. Toggle **Enable** and click Save

### Step 3: Enable Firestore Database

1. Click **Firestore Database** in the left menu
2. Click "Create Database"
3. Choose **Start in test mode** (or production mode for security)
4. Select a location and click **Enable**

### Step 4: Get Firebase Configuration

1. Click the **⚙️ Settings** icon → Project Settings
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "SudoAI Web")
5. Copy the `firebaseConfig` object

### Step 5: Update app.js

Open `app.js` and replace the Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 6 (Optional): Enable Full AI Intelligence

#### Option A: Use OpenAI API (Recommended for best results)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys and create a new key
4. Copy your API key
5. In `app.js`, find the `getAIResponse()` function
6. Uncomment the OpenAI code and add your API key:

```javascript
const OPENAI_API_KEY = 'your-api-key-here';
```

#### Option B: Use Free Alternatives

You can integrate free AI APIs like:
- **Hugging Face** - Free AI models
- **Cohere** - Free tier available
- **Claude API** - Anthropic's AI
- **Google Gemini** - Google's AI

### Step 7: Run the Application

1. Open `index.html` in your web browser
2. Or use a local server:
   ```bash
   python -m http.server 8000
   # Then open http://localhost:8000
   ```

## 📖 How to Use

### First Time Setup

1. **Sign Up**
   - Click "Sign Up" tab
   - Enter your name, email, and password
   - Click "Create Account"

2. **Login**
   - Enter your email and password
   - Click "Log In"

### Using the Chatbot

1. **Start a New Chat**
   - Click "➕ New Chat" button
   - Type your message
   - Press Enter to send

2. **View Chat History**
   - All your conversations are saved in the sidebar
   - Click on any chat to continue it

3. **Delete a Chat**
   - Open the chat you want to delete
   - Click the 🗑️ icon in the header
   - Confirm deletion

4. **Logout**
   - Click "🚪 Logout" at the bottom of the sidebar

## 🎨 Features Explained

### Authentication System
- Secure Firebase authentication
- Email and password login
- User profiles with display names
- Last login tracking

### Chat Management
- Create unlimited chats
- Auto-saves all messages
- Chat titles auto-generated from first message
- Message timestamps
- Delete chats anytime

### AI Integration
- Intelligent responses (when API is configured)
- Typing indicators
- Smooth animations
- Markdown support for code and formatting

### User Interface
- Dark theme with gradient accents
- Responsive design (mobile-friendly)
- Smooth animations and transitions
- Professional chat bubbles
- Collapsible sidebar
- Modern glassmorphism effects

## 🔧 Customization

### Change Colors

Edit `style.css` and modify the CSS variables:

```css
:root {
    --primary: #6366f1;     /* Main color */
    --secondary: #8b5cf6;   /* Secondary color */
    --bg-dark: #0f172a;     /* Dark background */
    /* ... more colors ... */
}
```

### Change AI Personality

In `app.js`, modify the system message:

```javascript
messages: [
    {
        role: 'system',
        content: 'You are SudoAI, a helpful and intelligent AI assistant.'
    },
    { role: 'user', content: userMessage }
]
```

### Add More Features

You can extend the app with:
- Voice input
- Image generation
- File sharing
- Code highlighting
- Multi-language support

## 🛡️ Security

### Production Security Rules

For production, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /chats/{chatId} {
      allow read, write: if request.auth != null &&
                            resource.data.userId == request.auth.uid;

      match /messages/{messageId} {
        allow read, write: if request.auth != null &&
                              get(/databases/$(database)/documents/chats/$(chatId)).data.userId == request.auth.uid;
      }
    }
  }
}
```

## 💡 Tips

- The AI currently uses simulated responses in demo mode
- Add your OpenAI API key for real intelligent conversations
- Chat history is stored in Firestore automatically
- Use Shift+Enter for multi-line messages
- All chats are private to each user

## 🐛 Troubleshooting

### "Firebase not initialized"
- Make sure you've added your Firebase config in `app.js`
- Check that all Firebase services are enabled

### "API Key error"
- Verify your OpenAI API key is correct
- Check you have credits in your OpenAI account
- Make sure the API key has proper permissions

### "Can't send messages"
- Ensure Firestore is enabled
- Check browser console for errors
- Verify you're logged in

## 📝 License

This project is free to use for personal and educational purposes.

## 🤝 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Firebase configuration
3. Ensure all services are enabled
4. Check API key permissions

---

**Enjoy your intelligent AI assistant! 🚀🤖**
