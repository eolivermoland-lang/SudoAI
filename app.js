// ========== Firebase Configuration ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
    getAuth, onAuthStateChanged,
    createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
    getFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, query, where, orderBy,
    deleteDoc, updateDoc, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
    getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Firebase configuration - Replace with your own!
const firebaseConfig = {
    apiKey: "AIzaSyBvpCnBT6dwmKpt4i-dtYgVkVGkwIygRm4",
    authDomain: "sudoaipro.firebaseapp.com",
    projectId: "sudoaipro",
    storageBucket: "sudoaipro.appspot.com",
    messagingSenderId: "631854320688",
    appId: "1:631854320688:web:49852b65e1376b354d31f5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ========== State Management ==========
let currentUser = null;
let currentChatId = null;
let chatHistory = [];
let sidebarOpen = true;
let currentLanguage = localStorage.getItem('language') || 'en';
let selectedImage = null;

// User plan and usage tracking
let userPlan = {
    type: 'free', // 'free' or 'pro'
    promptsUsed: 0,
    imagesGenerated: 0,
    lastReset: null
};

const LIMITS = {
    free: {
        promptsPerDay: 100,
        imagesPerDay: 5,
        canUploadImages: false
    },
    pro: {
        promptsPerDay: Infinity,
        imagesPerDay: Infinity,
        canUploadImages: true
    }
};

// ========== Language Translations ==========
const translations = {
    en: {
        // Auth Screen
        appTitle: 'SudoAI',
        tagline: 'Your Intelligent AI Assistant',
        loginTab: 'Login',
        signupTab: 'Sign Up',
        welcomeBack: 'Welcome Back',
        loginSubtitle: 'Log in to continue your conversations',
        emailPlaceholder: 'Email',
        passwordPlaceholder: 'Password',
        loginButton: 'Log In',
        createAccount: 'Create Account',
        signupSubtitle: 'Start chatting with SudoAI today',
        namePlaceholder: 'Full Name',
        passwordMinPlaceholder: 'Password (min 6 characters)',
        signupButton: 'Create Account',

        // Main App
        newChat: '➕ New Chat',
        chatHistory: 'Chat History',
        logout: '🚪 Logout',
        newChatTitle: 'New Chat',

        // Chat
        typingPlaceholder: 'Type your message...',
        inputHint: 'Press Enter to send • Shift+Enter for new line',
        welcomeTitle: '👋 Hello! I\'m SudoAI',
        welcomeText: 'I\'m your intelligent AI assistant. I can help you with:',
        startPrompt: 'Ask me anything to get started!',

        // Capabilities
        cap1: '💬 General conversations',
        cap2: '💡 Answering questions',
        cap3: '📝 Writing assistance',
        cap4: '🧠 Problem solving',
        cap5: '💻 Coding help',
        cap6: '🎨 Creative ideas',

        // Messages
        errorMessage: '❌ Sorry, I encountered an error. Please try again.',
        logoutConfirm: 'Are you sure you want to logout?',
        deleteChatConfirm: 'Are you sure you want to delete this chat? This cannot be undone.',

        // Validation
        fillAllFields: '❌ Please fill all fields',
        passwordMinLength: '❌ Password must be at least 6 characters',
        accountCreated: '✅ Account created successfully!',
        loginSuccess: '✅ Logged in successfully!',

        // Language
        language: '🌐 Language'
    },
    no: {
        // Auth Screen
        appTitle: 'SudoAI',
        tagline: 'Din Intelligente AI-Assistent',
        loginTab: 'Logg Inn',
        signupTab: 'Registrer',
        welcomeBack: 'Velkommen Tilbake',
        loginSubtitle: 'Logg inn for å fortsette samtalene dine',
        emailPlaceholder: 'E-post',
        passwordPlaceholder: 'Passord',
        loginButton: 'Logg Inn',
        createAccount: 'Opprett Konto',
        signupSubtitle: 'Begynn å chatte med SudoAI i dag',
        namePlaceholder: 'Fullt Navn',
        passwordMinPlaceholder: 'Passord (minimum 6 tegn)',
        signupButton: 'Opprett Konto',

        // Main App
        newChat: '➕ Ny Chat',
        chatHistory: 'Chat-Historie',
        logout: '🚪 Logg Ut',
        newChatTitle: 'Ny Chat',

        // Chat
        typingPlaceholder: 'Skriv meldingen din...',
        inputHint: 'Trykk Enter for å sende • Shift+Enter for ny linje',
        welcomeTitle: '👋 Hei! Jeg er SudoAI',
        welcomeText: 'Jeg er din intelligente AI-assistent. Jeg kan hjelpe deg med:',
        startPrompt: 'Spør meg om hva som helst for å komme i gang!',

        // Capabilities
        cap1: '💬 Generelle samtaler',
        cap2: '💡 Besvare spørsmål',
        cap3: '📝 Skrivehjelp',
        cap4: '🧠 Problemløsning',
        cap5: '💻 Kodehjelp',
        cap6: '🎨 Kreative ideer',

        // Messages
        errorMessage: '❌ Beklager, jeg støtte på en feil. Vennligst prøv igjen.',
        logoutConfirm: 'Er du sikker på at du vil logge ut?',
        deleteChatConfirm: 'Er du sikker på at du vil slette denne chatten? Dette kan ikke angres.',

        // Validation
        fillAllFields: '❌ Vennligst fyll ut alle feltene',
        passwordMinLength: '❌ Passordet må være minst 6 tegn',
        accountCreated: '✅ Konto opprettet!',
        loginSuccess: '✅ Logget inn!',

        // Language
        language: '🌐 Språk'
    },
    es: {
        // Auth Screen
        appTitle: 'SudoAI',
        tagline: 'Tu Asistente de IA Inteligente',
        loginTab: 'Iniciar Sesión',
        signupTab: 'Registrarse',
        welcomeBack: 'Bienvenido de Nuevo',
        loginSubtitle: 'Inicia sesión para continuar tus conversaciones',
        emailPlaceholder: 'Correo Electrónico',
        passwordPlaceholder: 'Contraseña',
        loginButton: 'Iniciar Sesión',
        createAccount: 'Crear Cuenta',
        signupSubtitle: 'Comienza a chatear con SudoAI hoy',
        namePlaceholder: 'Nombre Completo',
        passwordMinPlaceholder: 'Contraseña (mínimo 6 caracteres)',
        signupButton: 'Crear Cuenta',

        // Main App
        newChat: '➕ Nuevo Chat',
        chatHistory: 'Historial de Chat',
        logout: '🚪 Cerrar Sesión',
        newChatTitle: 'Nuevo Chat',

        // Chat
        typingPlaceholder: 'Escribe tu mensaje...',
        inputHint: 'Presiona Enter para enviar • Shift+Enter para nueva línea',
        welcomeTitle: '👋 ¡Hola! Soy SudoAI',
        welcomeText: 'Soy tu asistente de IA inteligente. Puedo ayudarte con:',
        startPrompt: '¡Pregúntame lo que quieras para comenzar!',

        // Capabilities
        cap1: '💬 Conversaciones generales',
        cap2: '💡 Responder preguntas',
        cap3: '📝 Asistencia de escritura',
        cap4: '🧠 Resolución de problemas',
        cap5: '💻 Ayuda con código',
        cap6: '🎨 Ideas creativas',

        // Messages
        errorMessage: '❌ Lo siento, encontré un error. Por favor, inténtalo de nuevo.',
        logoutConfirm: '¿Estás seguro de que quieres cerrar sesión?',
        deleteChatConfirm: '¿Estás seguro de que quieres eliminar este chat? Esto no se puede deshacer.',

        // Validation
        fillAllFields: '❌ Por favor completa todos los campos',
        passwordMinLength: '❌ La contraseña debe tener al menos 6 caracteres',
        accountCreated: '✅ ¡Cuenta creada con éxito!',
        loginSuccess: '✅ ¡Sesión iniciada con éxito!',

        // Language
        language: '🌐 Idioma'
    },
    fr: {
        // Auth Screen
        appTitle: 'SudoAI',
        tagline: 'Votre Assistant IA Intelligent',
        loginTab: 'Connexion',
        signupTab: 'S\'inscrire',
        welcomeBack: 'Bienvenue',
        loginSubtitle: 'Connectez-vous pour continuer vos conversations',
        emailPlaceholder: 'E-mail',
        passwordPlaceholder: 'Mot de passe',
        loginButton: 'Se Connecter',
        createAccount: 'Créer un Compte',
        signupSubtitle: 'Commencez à discuter avec SudoAI aujourd\'hui',
        namePlaceholder: 'Nom Complet',
        passwordMinPlaceholder: 'Mot de passe (minimum 6 caractères)',
        signupButton: 'Créer un Compte',

        // Main App
        newChat: '➕ Nouveau Chat',
        chatHistory: 'Historique des Chats',
        logout: '🚪 Déconnexion',
        newChatTitle: 'Nouveau Chat',

        // Chat
        typingPlaceholder: 'Tapez votre message...',
        inputHint: 'Appuyez sur Entrée pour envoyer • Maj+Entrée pour nouvelle ligne',
        welcomeTitle: '👋 Bonjour! Je suis SudoAI',
        welcomeText: 'Je suis votre assistant IA intelligent. Je peux vous aider avec:',
        startPrompt: 'Demandez-moi n\'importe quoi pour commencer!',

        // Capabilities
        cap1: '💬 Conversations générales',
        cap2: '💡 Répondre aux questions',
        cap3: '📝 Aide à la rédaction',
        cap4: '🧠 Résolution de problèmes',
        cap5: '💻 Aide au codage',
        cap6: '🎨 Idées créatives',

        // Messages
        errorMessage: '❌ Désolé, j\'ai rencontré une erreur. Veuillez réessayer.',
        logoutConfirm: 'Êtes-vous sûr de vouloir vous déconnecter?',
        deleteChatConfirm: 'Êtes-vous sûr de vouloir supprimer ce chat? Cela ne peut pas être annulé.',

        // Validation
        fillAllFields: '❌ Veuillez remplir tous les champs',
        passwordMinLength: '❌ Le mot de passe doit contenir au moins 6 caractères',
        accountCreated: '✅ Compte créé avec succès!',
        loginSuccess: '✅ Connecté avec succès!',

        // Language
        language: '🌐 Langue'
    }
};

function t(key) {
    return translations[currentLanguage][key] || translations['en'][key] || key;
}

function updateUILanguage() {
    // Auth screen
    document.querySelector('.tagline').textContent = t('tagline');
    document.getElementById('loginTab').textContent = t('loginTab');
    document.getElementById('signupTab').textContent = t('signupTab');
    document.querySelector('#loginForm h2').textContent = t('welcomeBack');
    document.querySelector('#loginForm .form-subtitle').textContent = t('loginSubtitle');
    document.getElementById('loginEmail').placeholder = t('emailPlaceholder');
    document.getElementById('loginPassword').placeholder = t('passwordPlaceholder');
    document.querySelector('#loginForm .primary-btn').textContent = t('loginButton');

    document.querySelector('#signupForm h2').textContent = t('createAccount');
    document.querySelector('#signupForm .form-subtitle').textContent = t('signupSubtitle');
    document.getElementById('signupName').placeholder = t('namePlaceholder');
    document.getElementById('signupEmail').placeholder = t('emailPlaceholder');
    document.getElementById('signupPassword').placeholder = t('passwordMinPlaceholder');
    document.querySelector('#signupForm .primary-btn').textContent = t('signupButton');

    // Main app (only if user is logged in)
    if (currentUser) {
        document.querySelector('.new-chat-btn').innerHTML = t('newChat');
        document.querySelector('.chat-history-section h3').textContent = t('chatHistory');
        document.querySelector('.logout-btn').innerHTML = t('logout');
        document.getElementById('messageInput').placeholder = t('typingPlaceholder');
        document.querySelector('.input-hint').textContent = t('inputHint');

        // Update welcome message if visible
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.querySelector('h1').textContent = t('welcomeTitle');
            welcomeMsg.querySelector('p').textContent = t('welcomeText');
            welcomeMsg.querySelector('.start-prompt').textContent = t('startPrompt');

            const caps = welcomeMsg.querySelectorAll('.capability-card');
            if (caps.length === 6) {
                caps[0].textContent = t('cap1');
                caps[1].textContent = t('cap2');
                caps[2].textContent = t('cap3');
                caps[3].textContent = t('cap4');
                caps[4].textContent = t('cap5');
                caps[5].textContent = t('cap6');
            }
        }
    }

    // Update language selector
    const langSelector = document.getElementById('languageSelect');
    if (langSelector) {
        langSelector.value = currentLanguage;
    }
}

window.changeLanguage = function(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateUILanguage();
};

// ========== DOM Elements ==========
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatHistoryEl = document.getElementById('chatHistory');
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const chatTitle = document.getElementById('chatTitle');
const sidebar = document.getElementById('sidebar');
const loadingOverlay = document.getElementById('loadingOverlay');

// ========== Auth Functions ==========
window.switchAuthTab = function(tab) {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');

    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
};

window.signup = async function() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const msgEl = document.getElementById('signupMsg');

    if (!name || !email || !password) {
        showMessage(msgEl, t('fillAllFields'), 'error');
        return;
    }

    if (password.length < 6) {
        showMessage(msgEl, t('passwordMinLength'), 'error');
        return;
    }

    showLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });

        // Create user document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: name,
            email: email,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
        });

        showMessage(msgEl, t('accountCreated'), 'success');
    } catch (error) {
        console.error('Signup error:', error);
        showMessage(msgEl, `❌ ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
};

window.login = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const msgEl = document.getElementById('loginMsg');

    if (!email || !password) {
        showMessage(msgEl, t('fillAllFields'), 'error');
        return;
    }

    showLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);

        // Update last login
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            lastLogin: serverTimestamp()
        });

        showMessage(msgEl, t('loginSuccess'), 'success');
    } catch (error) {
        console.error('Login error:', error);
        showMessage(msgEl, `❌ ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
};

window.logout = async function() {
    if (confirm(t('logoutConfirm'))) {
        await signOut(auth);
    }
};

// ========== Chat Functions ==========
window.startNewChat = async function() {
    if (!currentUser) {
        console.error('Cannot create chat: No user logged in');
        return;
    }

    showLoading(true);
    try {
        console.log('Creating new chat for user:', currentUser.uid);
        const chatRef = await addDoc(collection(db, 'chats'), {
            userId: currentUser.uid,
            title: 'New Chat',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            messageCount: 0
        });

        currentChatId = chatRef.id;
        console.log('New chat created with ID:', currentChatId);

        chatMessages.innerHTML = '';
        chatTitle.textContent = 'New Chat';
        messageInput.focus();
        await loadChatHistory();
    } catch (error) {
        console.error('Error creating chat:', error);
        console.error('Error details:', error.message, error.code);
        alert('Failed to create new chat. Please check browser console for details.');
    } finally {
        showLoading(false);
    }
};

window.sendMessage = async function() {
    const message = messageInput.value.trim();
    const hasImage = selectedImage !== null;

    if (!message && !hasImage) return;

    // Check prompt limit before sending
    if (!checkPromptLimit()) {
        openUpgradeModal();
        return;
    }

    // Create a new chat if none exists
    if (!currentChatId) {
        console.log('No current chat, creating new one...');
        await startNewChat();
        if (!currentChatId) {
            alert('Failed to create chat. Please try again.');
            return;
        }
    }

    // Disable input
    sendBtn.disabled = true;
    messageInput.disabled = true;

    let imageUrl = null;

    try {
        // Upload image if selected
        if (hasImage) {
            console.log('Uploading image...');
            showLoading(true);
            imageUrl = await uploadImageToStorage(selectedImage, currentChatId, Date.now().toString());
            console.log('Image uploaded successfully:', imageUrl);
        }

        // Add user message to UI
        addMessageToUI('user', message, imageUrl);
        messageInput.value = '';
        removeImagePreview();

        // Save user message to Firestore
        console.log('Saving user message to Firestore...');
        const userMessageData = {
            role: 'user',
            content: message || '',
            timestamp: serverTimestamp()
        };
        if (imageUrl) {
            userMessageData.imageUrl = imageUrl;
        }
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), userMessageData);
        console.log('User message saved successfully');

        // Update chat
        await updateChatInfo();

        // Show typing indicator
        showTypingIndicator();

        // Get AI response
        const aiResponse = await getAIResponse(message || 'User sent an image');

        // Remove typing indicator
        removeTypingIndicator();

        // Add AI message to UI
        addMessageToUI('ai', aiResponse);

        // Save AI message to Firestore
        console.log('Saving AI message to Firestore...');
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
            role: 'ai',
            content: aiResponse,
            timestamp: serverTimestamp()
        });
        console.log('AI message saved successfully');

        await updateChatInfo();

        // Increment prompt usage
        await incrementPromptUsage();

        // Force reload chat history to update sidebar
        setTimeout(async () => {
            await loadChatHistory();
        }, 500);

    } catch (error) {
        console.error('Error sending message:', error);
        console.error('Error details:', error.message, error.code);
        removeTypingIndicator();
        addMessageToUI('ai', t('errorMessage'));
    } finally {
        showLoading(false);
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
};

async function getAIResponse(userMessage) {
    const GEMINI_API_KEY = 'AIzaSyB0LEIagiDhhI9j1iAIIlqtitOXaHSRq5I'; 
    const GEMINI_MODEL = 'gemini-2.5-flash';
    const GEMINI_API_VERSION = 'v1';

    console.log('🤖 Calling Gemini AI for:', userMessage);

    if (!GEMINI_API_KEY) {
        return await simulateAIResponse(userMessage);
    }

    try {
        const url = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
        console.log('📡 Fetch:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { parts: [{ text: userMessage }] }
                ],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 2048
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }

        const data = await response.json();
        console.log('📦 Gemini response:', data);

        if (data.candidates?.length > 0) {
            const parts = data.candidates[0].content.parts;
            return parts.map(p => p.text).join('\n\n');
        }

        throw new Error("No valid response");
    } catch (error) {
        console.error("❌ Gemini error:", error);
        return await simulateAIResponse(userMessage);
    }
}


async function simulateAIResponse(message) {
    // Smart AI simulation - Works without external APIs!
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));

    const lowerMessage = message.toLowerCase();

    // ========== GREETINGS ==========
    if (lowerMessage.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
        const greetings = [
            '👋 Hello! I\'m SudoAI, your intelligent AI assistant. How can I help you today?',
            '✨ Hey there! Great to see you. What can I do for you?',
            '🌟 Hi! I\'m here to help. What\'s on your mind?',
            '👋 Hello! Ready to assist you with anything you need!'
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // ========== HOW ARE YOU ==========
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how r u')) {
        return '🤖 I\'m functioning perfectly, thank you for asking! I\'m energized and ready to help you with whatever you need. How are you doing today?';
    }

    // ========== CAPABILITIES ==========
    if (lowerMessage.includes('what can you do') || lowerMessage.includes('your capabilities') || (lowerMessage.includes('help') && lowerMessage.includes('me'))) {
        return '💡 I\'m SudoAI, and I can help you with:\n\n📚 **Knowledge & Learning**\n• Answer questions on various topics\n• Explain complex concepts simply\n• Provide detailed information\n\n✍️ **Writing & Creativity**\n• Help with writing and editing\n• Generate creative ideas\n• Improve your text\n\n💻 **Programming & Tech**\n• Explain code and concepts\n• Debug problems\n• Suggest solutions\n\n🧠 **Problem Solving**\n• Analyze situations\n• Suggest approaches\n• Think through challenges\n\nWhat would you like help with?';
    }

    // ========== PROGRAMMING ==========
    if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('javascript') || lowerMessage.includes('python') || lowerMessage.includes('html') || lowerMessage.includes('css')) {
        return '💻 I\'d be happy to help with programming!\n\nI can assist with:\n• **Debugging** - Find and fix errors\n• **Code explanation** - Understand how code works\n• **Best practices** - Write better code\n• **Problem solving** - Algorithm and logic help\n• **Languages** - JavaScript, Python, HTML, CSS, and more\n\nWhat programming challenge are you working on? Share some details and I\'ll help you out!';
    }

    // ========== WHO ARE YOU ==========
    if (lowerMessage.includes('who are you') || lowerMessage.includes('what are you')) {
        return '🤖 I\'m **SudoAI**, an intelligent AI assistant designed to help you with various tasks!\n\nI can:\n• Answer your questions\n• Help solve problems\n• Assist with learning\n• Provide information\n• Support your creative work\n\nI\'m here to make your life easier. Think of me as your digital assistant who\'s always ready to help! What can I do for you today?';
    }

    // ========== NAME ==========
    if (lowerMessage.includes('your name') || lowerMessage.includes('what should i call you')) {
        return '🤖 I\'m **SudoAI**! You can call me Sudo for short. I\'m your intelligent AI assistant. What would you like to talk about?';
    }

    // ========== MATH ==========
    if (lowerMessage.includes('calculate') || lowerMessage.includes('math') || lowerMessage.includes('solve') || lowerMessage.match(/\d+[\+\-\*\/]\d+/)) {
        const mathMatch = lowerMessage.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
        if (mathMatch) {
            const num1 = parseFloat(mathMatch[1]);
            const operator = mathMatch[2];
            const num2 = parseFloat(mathMatch[3]);
            let result;

            switch(operator) {
                case '+': result = num1 + num2; break;
                case '-': result = num1 - num2; break;
                case '*': result = num1 * num2; break;
                case '/': result = num1 / num2; break;
            }

            return `🔢 The answer is: **${result}**\n\nCalculation: ${num1} ${operator} ${num2} = ${result}`;
        }
        return '🔢 I can help with math! Give me a calculation like "25 + 37" or "144 / 12" and I\'ll solve it for you!';
    }

    // ========== TIME/DATE ==========
    if (lowerMessage.includes('what time') || lowerMessage.includes('current time') || lowerMessage.includes('what date') || lowerMessage.includes('today')) {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        return `🕐 **Current Time:** ${time}\n📅 **Today's Date:** ${date}`;
    }

    // ========== JOKES ==========
    if (lowerMessage.includes('joke') || lowerMessage.includes('funny') || lowerMessage.includes('make me laugh')) {
        const jokes = [
            '😄 Why did the programmer quit his job?\nBecause he didn\'t get arrays! (a raise)',
            '🤣 Why do programmers prefer dark mode?\nBecause light attracts bugs!',
            '😂 A SQL query walks into a bar, walks up to two tables and asks...\n"Can I join you?"',
            '😆 Why did the developer go broke?\nBecause he used up all his cache!',
            '🤖 How many programmers does it take to change a light bulb?\nNone, that\'s a hardware problem!'
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // ========== WEATHER ==========
    if (lowerMessage.includes('weather') || lowerMessage.includes('temperature')) {
        return '🌤️ I don\'t have access to live weather data right now, but I can help you!\n\nYou can check the weather by:\n• Visiting weather.com\n• Using your device\'s weather app\n• Asking Google Assistant or Siri\n\nIs there anything else I can help you with?';
    }

    // ========== LEARNING ==========
    if (lowerMessage.includes('learn') || lowerMessage.includes('teach me') || lowerMessage.includes('explain')) {
        return '📚 I\'d love to help you learn!\n\nWhat topic are you interested in? I can explain:\n• **Technology** - Programming, computers, internet\n• **Science** - Physics, biology, chemistry\n• **Math** - Algebra, calculus, geometry\n• **Languages** - Grammar, writing, vocabulary\n• **General Knowledge** - History, geography, culture\n\nJust ask me about any topic and I\'ll explain it clearly!';
    }

    // ========== ADVICE ==========
    if (lowerMessage.includes('advice') || lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
        return '💡 I\'m here to help with advice!\n\nWhat do you need guidance on?\n• Career or education decisions\n• Learning new skills\n• Problem-solving approaches\n• Project ideas\n• Study tips\n\nGive me more details and I\'ll provide thoughtful suggestions!';
    }

    // ========== WRITING ==========
    if (lowerMessage.includes('write') || lowerMessage.includes('essay') || lowerMessage.includes('article') || lowerMessage.includes('story')) {
        return '✍️ I can definitely help with writing!\n\nI can assist you with:\n• **Essays** - Structure, arguments, clarity\n• **Stories** - Plot ideas, characters, dialogue\n• **Articles** - Research, organization, tone\n• **Emails** - Professional communication\n• **Creative writing** - Poetry, fiction, scripts\n\nWhat are you working on? Share your topic or draft!';
    }

    // ========== MOTIVATION ==========
    if (lowerMessage.includes('motivate') || lowerMessage.includes('inspire') || lowerMessage.includes('feeling down') || lowerMessage.includes('sad')) {
        return '💪 You\'ve got this!\n\n✨ Remember:\n• Every expert was once a beginner\n• Progress happens one step at a time\n• Challenges help you grow stronger\n• Your efforts are making a difference\n\nKeep pushing forward! What are you working on? I\'m here to support you!';
    }

    // ========== THANKS ==========
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('appreciate')) {
        return '😊 You\'re very welcome! I\'m happy I could help.\n\nIf you need anything else, just ask. I\'m always here to assist you!';
    }

    // ========== GOODBYE ==========
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
        return '👋 Goodbye! It was great chatting with you. Come back anytime you need help!\n\n✨ Your chat history is saved, so you can continue where you left off.';
    }

    // ========== CONVERSATION TOPICS ==========
    if (lowerMessage.includes('talk about') || lowerMessage.includes('discuss')) {
        return '💬 I\'d love to have a conversation!\n\nWhat topic interests you?\n• Technology and innovation\n• Science and nature\n• Arts and creativity\n• Philosophy and ideas\n• Current events\n• Personal growth\n\nPick a topic or ask me anything!';
    }

    // ========== INTELLIGENT DEFAULT RESPONSE ==========
    // Try to give a contextual response based on keywords
    if (lowerMessage.includes('?')) {
        return `🤔 That's an interesting question! While I can understand you're asking "${message}", I'd be happy to help if you could provide a bit more context or rephrase your question.\n\nI'm knowledgeable about many topics including:\n• Technology & Programming\n• Science & Math\n• Writing & Creativity\n• Problem Solving\n• General Knowledge\n\nHow can I assist you specifically?`;
    }

    // Generic intelligent response
    const genericResponses = [
        `I understand you mentioned "${message}". Could you tell me more about what you'd like to know or accomplish? I'm here to help with any questions or tasks!`,
        `Interesting! You're talking about "${message}". What specific aspect would you like me to help you with? I can provide information, explanations, or guidance!`,
        `I see you're interested in "${message}". Let me help! Could you elaborate on what you'd like to know? I'm great at explaining things clearly!`,
        `Thanks for sharing that! To give you the best response about "${message}", could you provide a bit more detail about what you're looking for?`
    ];

    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

async function updateChatInfo() {
    if (!currentChatId) return;

    try {
        const messagesSnapshot = await getDocs(collection(db, 'chats', currentChatId, 'messages'));
        const messages = messagesSnapshot.docs.map(doc => doc.data());

        // Get first user message as title
        const firstUserMessage = messages.find(m => m.role === 'user');
        const title = firstUserMessage
            ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
            : 'New Chat';

        await updateDoc(doc(db, 'chats', currentChatId), {
            title: title,
            updatedAt: serverTimestamp(),
            messageCount: messages.length
        });

        chatTitle.textContent = title;
    } catch (error) {
        console.error('Error updating chat info:', error);
    }
}

function addMessageToUI(role, content, imageUrl = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Add image if present
    if (imageUrl) {
        console.log('Adding image to message:', imageUrl);
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'message-image';
        img.alt = 'Image';
        img.onclick = () => window.open(imageUrl, '_blank');
        img.onerror = () => {
            console.error('Failed to load image:', imageUrl);
            img.alt = '❌ Failed to load image';
        };
        img.onload = () => {
            console.log('✅ Image loaded successfully in message');
        };
        contentDiv.appendChild(img);
    }

    // Add text content if present
    if (content) {
        const textDiv = document.createElement('div');
        textDiv.innerHTML = formatMessageContent(content);
        contentDiv.appendChild(textDiv);
    }

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    messageDiv.appendChild(avatar);
    const wrapper = document.createElement('div');
    wrapper.style.flex = '1';
    wrapper.appendChild(contentDiv);
    wrapper.appendChild(time);
    messageDiv.appendChild(wrapper);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format message content with markdown-like styling
function formatMessageContent(content) {
    // Escape HTML to prevent XSS
    let formatted = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    // Format code blocks (```code```)
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Format inline code (`code`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Format bold (**text**)
    formatted = formatted.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

    // Format italic (*text*)
    formatted = formatted.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Format bullet points (• or -)
    formatted = formatted.replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Format numbered lists
    formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Format headers (## Header or **Header**)
    formatted = formatted.replace(/^##\s+(.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');

    // Format line breaks (preserve \n\n as paragraphs)
    formatted = formatted.replace(/\n\n+/g, '</p><p>');
    formatted = '<p>' + formatted + '</p>';

    // Format single line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    // Clean up empty paragraphs
    formatted = formatted.replace(/<p><\/p>/g, '');
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');

    return formatted;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message ai';
    indicator.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const typing = document.createElement('div');
    typing.className = 'message-content typing-indicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    indicator.appendChild(avatar);
    indicator.appendChild(typing);
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

// ========== Chat History Functions ==========
async function loadChatHistory() {
    if (!currentUser) {
        console.error('Cannot load chat history: No user logged in');
        return;
    }

    try {
        console.log('Loading chat history for user:', currentUser.uid);

        // Try without orderBy first in case index is not created
        const chatsQuery = query(
            collection(db, 'chats'),
            where('userId', '==', currentUser.uid)
        );

        const snapshot = await getDocs(chatsQuery);
        console.log('Found', snapshot.size, 'chats');

        chatHistory = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Chat:', doc.id, data);
            return {
                id: doc.id,
                ...data
            };
        });

        // Sort manually by updatedAt
        chatHistory.sort((a, b) => {
            const aTime = a.updatedAt?.toMillis?.() || 0;
            const bTime = b.updatedAt?.toMillis?.() || 0;
            return bTime - aTime;
        });

        renderChatHistory();
    } catch (error) {
        console.error('Error loading chat history:', error);
        console.error('Error details:', error.message, error.code);
    }
}

function renderChatHistory() {
    console.log('Rendering chat history, count:', chatHistory.length);
    chatHistoryEl.innerHTML = '';

    if (chatHistory.length === 0) {
        chatHistoryEl.innerHTML = '<div style="padding: 12px; color: var(--text-muted); font-size: 0.9rem;">No chat history yet. Start a new chat!</div>';
        return;
    }

    chatHistory.forEach(chat => {
        const item = document.createElement('div');
        item.className = 'chat-history-item';
        if (chat.id === currentChatId) item.classList.add('active');

        const title = chat.title || 'Untitled Chat';
        const messageCount = chat.messageCount || 0;

        item.innerHTML = `
            <div class="chat-history-title">${title}</div>
            <div class="chat-history-preview">${messageCount} messages</div>
        `;

        item.onclick = () => loadChat(chat.id);
        chatHistoryEl.appendChild(item);
    });

    console.log('Chat history rendered successfully');
}

async function loadChat(chatId) {
    if (!chatId) return;

    showLoading(true);
    try {
        currentChatId = chatId;

        // Get chat info
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        const chatData = chatDoc.data();
        chatTitle.textContent = chatData.title || 'Chat';

        // Load messages
        const messagesQuery = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const messagesSnapshot = await getDocs(messagesQuery);
        chatMessages.innerHTML = '';

        messagesSnapshot.forEach(doc => {
            const msg = doc.data();
            addMessageToUI(msg.role, msg.content, msg.imageUrl || null);
        });

        renderChatHistory();
        messageInput.focus();
    } catch (error) {
        console.error('Error loading chat:', error);
        alert('Failed to load chat');
    } finally {
        showLoading(false);
    }
}

window.deleteCurrentChat = async function() {
    if (!currentChatId) return;

    if (confirm(t('deleteChatConfirm'))) {
        showLoading(true);
        try {
            // Delete all messages
            const messagesSnapshot = await getDocs(collection(db, 'chats', currentChatId, 'messages'));
            const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Delete chat
            await deleteDoc(doc(db, 'chats', currentChatId));

            currentChatId = null;
            chatMessages.innerHTML = '';
            chatTitle.textContent = 'New Chat';

            await loadChatHistory();

            // Start new chat
            startNewChat();
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Failed to delete chat');
        } finally {
            showLoading(false);
        }
    }
};

// ========== UI Functions ==========
window.toggleSidebar = function() {
    sidebar.classList.toggle('active');
    sidebarOpen = !sidebarOpen;
};

window.handleKeyPress = function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
};

// ========== Image Upload Functions ==========
window.handleImageUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image file is too large. Maximum size is 5MB.');
        return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }

    selectedImage = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imagePreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
};

window.removeImagePreview = function() {
    selectedImage = null;
    document.getElementById('previewImg').src = '';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('imageUpload').value = '';
};

async function uploadImageToStorage(file, chatId, messageId) {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `chats/${chatId}/images/${fileName}`);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
}

// ========== Image Generation Functions ==========
window.openImageGenerationModal = function() {
    document.getElementById('imageGenModal').classList.remove('hidden');
    document.getElementById('imagePrompt').focus();
};

window.closeImageGenerationModal = function() {
    document.getElementById('imageGenModal').classList.add('hidden');
    document.getElementById('imagePrompt').value = '';
};

window.generateImage = async function() {
    const prompt = document.getElementById('imagePrompt').value.trim();

    if (!prompt) {
        alert('Please enter a description for the image.');
        return;
    }

    closeImageGenerationModal();
    showLoading(true);

    try {
        console.log('🎨 Starting image generation with prompt:', prompt);

        // Add the generated image to chat
        if (!currentChatId) {
            console.log('No current chat, creating new one...');
            await startNewChat();
        }

        console.log('Current chat ID:', currentChatId);

        // Add user message showing what they requested
        console.log('Adding user request message...');
        addMessageToUI('user', `🎨 Generate: ${prompt}`);
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
            role: 'user',
            content: `🎨 Generate: ${prompt}`,
            timestamp: serverTimestamp()
        });

        // Show typing indicator while generating
        showTypingIndicator();

        // Generate the image
        console.log('Calling image generation API...');
        const imageUrl = await generateImageWithAPI(prompt);
        console.log('✅ Image URL received:', imageUrl);

        // Remove typing indicator
        removeTypingIndicator();

        // Add AI message with generated image
        console.log('Adding generated image to chat...');
        addMessageToUI('ai', 'Here\'s your generated image:', imageUrl);

        await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
            role: 'ai',
            content: 'Here\'s your generated image:',
            imageUrl: imageUrl,
            timestamp: serverTimestamp()
        });

        console.log('Image generation complete!');
        await updateChatInfo();

        // Increment image usage
        await incrementImageUsage();

        // Force reload chat history
        setTimeout(async () => {
            await loadChatHistory();
        }, 500);

    } catch (error) {
        console.error('❌ Error generating image:', error);
        removeTypingIndicator();
        addMessageToUI('ai', '❌ Sorry, failed to generate image. Please try again.');
        alert('Failed to generate image: ' + error.message);
    } finally {
        showLoading(false);
    }
};

async function generateImageWithAPI(prompt) {
    // Using Pollinations.ai - Free AI image generation
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);

    // Pollinations.ai URL
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;

    console.log('Generated image URL:', imageUrl);

    // Verify the image loads by creating a test image
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            console.log('Image loaded successfully');
            resolve(imageUrl);
        };
        img.onerror = (error) => {
            console.error('Image failed to load:', error);
            reject(new Error('Failed to load generated image'));
        };
        img.src = imageUrl;

        // Timeout after 30 seconds
        setTimeout(() => {
            reject(new Error('Image generation timeout'));
        }, 30000);
    });
}

// Alternative: Hugging Face Stable Diffusion (requires API token)
async function generateWithHuggingFace(prompt) {
    const HF_API_TOKEN = ''; // Add your Hugging Face API token here if you want to use this instead

    if (!HF_API_TOKEN) {
        throw new Error('Hugging Face API token not configured');
    }

    const response = await fetch(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: prompt }),
        }
    );

    if (!response.ok) {
        throw new Error('Failed to generate image with Hugging Face');
    }

    const blob = await response.blob();

    // Upload to Firebase Storage
    const timestamp = Date.now();
    const storageRef = ref(storage, `generated/${timestamp}.png`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    element.style.color = type === 'success' ? 'var(--success)' : 'var(--danger)';
    element.style.border = `1px solid ${type === 'success' ? 'var(--success)' : 'var(--danger)'}`;
}

function showLoading(show) {
    loadingOverlay.classList.toggle('hidden', !show);
}

// ========== Auth State Observer ==========
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log('🔐 User logged in:', user.email);
        currentUser = user;
        authScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');

        userNameEl.textContent = user.displayName || 'User';
        userEmailEl.textContent = user.email;

        console.log('📋 Loading chat history...');
        await loadChatHistory();

        console.log('💳 Loading user plan...');
        await loadUserPlan();

        console.log('Current chat ID:', currentChatId, 'Chat history count:', chatHistory.length);

        // If no chats exist or no current chat, create a new one
        if (chatHistory.length === 0 || !currentChatId) {
            console.log('✨ Creating initial chat...');
            await startNewChat();
        }

        // Update UI language
        updateUILanguage();
    } else {
        console.log('🚪 User logged out');
        currentUser = null;
        authScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
        chatHistory = [];
        currentChatId = null;
    }
});

// Auto-resize textarea
messageInput?.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// ========== Plan & Usage Management ==========
async function loadUserPlan() {
    if (!currentUser) return;

    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();

        if (userData && userData.plan) {
            userPlan = {
                type: userData.plan.type || 'free',
                promptsUsed: userData.plan.promptsUsed || 0,
                imagesGenerated: userData.plan.imagesGenerated || 0,
                lastReset: userData.plan.lastReset ? userData.plan.lastReset.toDate() : new Date()
            };

            // Check if we need to reset daily usage
            const today = new Date().toDateString();
            const lastResetDate = new Date(userPlan.lastReset).toDateString();

            if (today !== lastResetDate) {
                // Reset usage for new day
                userPlan.promptsUsed = 0;
                userPlan.imagesGenerated = 0;
                userPlan.lastReset = new Date();

                await updateDoc(doc(db, 'users', currentUser.uid), {
                    'plan.promptsUsed': 0,
                    'plan.imagesGenerated': 0,
                    'plan.lastReset': serverTimestamp()
                });
            }
        } else {
            // Initialize plan for new user
            userPlan = {
                type: 'free',
                promptsUsed: 0,
                imagesGenerated: 0,
                lastReset: new Date()
            };

            await updateDoc(doc(db, 'users', currentUser.uid), {
                plan: {
                    type: 'free',
                    promptsUsed: 0,
                    imagesGenerated: 0,
                    lastReset: serverTimestamp()
                }
            });
        }

        updatePlanUI();
    } catch (error) {
        console.error('Error loading user plan:', error);
    }
}

function updatePlanUI() {
    const planBadge = document.getElementById('planBadge');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const usageStats = document.getElementById('usageStats');
    const promptCount = document.getElementById('promptCount');
    const imageCount = document.getElementById('imageCount');

    if (!planBadge) return;

    if (userPlan.type === 'pro') {
        planBadge.textContent = 'PRO';
        planBadge.className = 'plan-badge pro';
        upgradeBtn.classList.add('hidden');
        usageStats.classList.add('hidden');
    } else {
        planBadge.textContent = 'FREE';
        planBadge.className = 'plan-badge free';
        upgradeBtn.classList.remove('hidden');
        usageStats.classList.remove('hidden');

        // Update usage counts
        if (promptCount) {
            promptCount.textContent = userPlan.promptsUsed;
        }
        if (imageCount) {
            imageCount.textContent = userPlan.imagesGenerated;
        }
    }
}

async function incrementPromptUsage() {
    userPlan.promptsUsed++;

    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            'plan.promptsUsed': userPlan.promptsUsed
        });
        updatePlanUI();
    } catch (error) {
        console.error('Error updating prompt usage:', error);
    }
}

async function incrementImageUsage() {
    userPlan.imagesGenerated++;

    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            'plan.imagesGenerated': userPlan.imagesGenerated
        });
        updatePlanUI();
    } catch (error) {
        console.error('Error updating image usage:', error);
    }
}

function checkPromptLimit() {
    const limit = LIMITS[userPlan.type].promptsPerDay;

    if (userPlan.promptsUsed >= limit) {
        alert(`⚠️ Daily limit reached!\n\nYou've used ${limit} prompts today.\n\nUpgrade to Pro for unlimited prompts! ⭐`);
        return false;
    }

    return true;
}

function checkImageLimit() {
    const limit = LIMITS[userPlan.type].imagesPerDay;

    if (userPlan.imagesGenerated >= limit) {
        alert(`⚠️ Daily limit reached!\n\nYou've generated ${limit} images today.\n\nUpgrade to Pro for unlimited image generation! ⭐`);
        return false;
    }

    return true;
}

function checkUploadPermission() {
    if (!LIMITS[userPlan.type].canUploadImages) {
        alert('⚠️ Image upload is a Pro feature!\n\nUpgrade to Pro to upload your own images. ⭐');
        return false;
    }

    return true;
}

// ========== Upgrade Modal Functions ==========
window.openUpgradeModal = function() {
    document.getElementById('upgradeModal').classList.remove('hidden');
    initializePayPalButton();
};

window.closeUpgradeModal = function() {
    document.getElementById('upgradeModal').classList.add('hidden');
};

function initializePayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (!container || container.children.length > 0) return;

    paypal.Buttons({
        style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe'
        },

        createSubscription: function(data, actions) {
            return actions.subscription.create({
                'plan_id': 'P-YOUR-PLAN-ID' // Replace with your actual PayPal Plan ID
            });
        },

        onApprove: async function(data, actions) {
            console.log('Subscription approved:', data.subscriptionID);

            try {
                // Update user to Pro
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    'plan.type': 'pro',
                    'plan.subscriptionId': data.subscriptionID,
                    'plan.upgradedAt': serverTimestamp()
                });

                userPlan.type = 'pro';
                updatePlanUI();

                closeUpgradeModal();

                alert('🎉 Welcome to SudoAI Pro!\n\nYou now have unlimited access to all features!');
            } catch (error) {
                console.error('Error upgrading user:', error);
                alert('Error activating Pro. Please contact support.');
            }
        },

        onError: function(err) {
            console.error('PayPal error:', err);
            alert('Payment failed. Please try again.');
        }
    }).render('#paypal-button-container');
}

// ========== Modified Click Handlers ==========
window.handleUploadClick = function() {
    if (!checkUploadPermission()) {
        openUpgradeModal();
        return;
    }
    document.getElementById('imageUpload').click();
};

window.handleGenerateClick = function() {
    if (!checkImageLimit()) {
        openUpgradeModal();
        return;
    }
    openImageGenerationModal();
};

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    updateUILanguage();

    // Update both language selectors
    const langSelector = document.getElementById('languageSelect');
    const langSelectorApp = document.querySelector('.language-select-app');
    if (langSelector) langSelector.value = currentLanguage;
    if (langSelectorApp) langSelectorApp.value = currentLanguage;
});

console.log('🤖 SudoAI initialized successfully!');
console.log('⚠️ Remember to configure your Firebase project and add an AI API key!');
