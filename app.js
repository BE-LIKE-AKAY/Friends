// Firebase configuration - REPLACE WITH YOUR CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyABC123XYZ456DEF789GHI",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456ghi789jkl"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// DOM elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const resetForm = document.getElementById('reset-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupUsername = document.getElementById('signup-username');
const signupButton = document.getElementById('signup-button');
const resetEmail = document.getElementById('reset-email');
const resetButton = document.getElementById('reset-button');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const showReset = document.getElementById('show-reset');
const showLoginFromReset = document.getElementById('show-login-from-reset');
const logoutButton = document.getElementById('logout-button');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages-container');
const usersContainer = document.getElementById('users-container');
const typingIndicator = document.getElementById('typing-indicator');
const chatAvatar = document.getElementById('chat-avatar');
const chatUsername = document.getElementById('chat-username');
const themeToggle = document.getElementById('theme-toggle');

// App state
let currentUser = null;
let users = {};
let currentRoom = 'global';
let isTyping = false;
let lastTypingTime = 0;
let typingTimeout;

// Initialize the app
function init() {
    // Check for dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Set up auth state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            setupUserProfile(user);
            showApp();
            setupChat();
        } else {
            currentUser = null;
            showAuth();
        }
    });

    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleDarkMode);
    
    // Auth form toggles
    showSignup.addEventListener('click', () => toggleAuthForms('signup'));
    showLogin.addEventListener('click', () => toggleAuthForms('login'));
    showReset.addEventListener('click', () => toggleAuthForms('reset'));
    showLoginFromReset.addEventListener('click', () => toggleAuthForms('login'));
    
    // Auth actions
    loginButton.addEventListener('click', loginWithEmail);
    signupButton.addEventListener('click', signUpWithEmail);
    resetButton.addEventListener('click', sendPasswordReset);
    logoutButton.addEventListener('click', logout);
    
    // Chat actions
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Typing detection
    messageInput.addEventListener('input', updateTyping);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function toggleAuthForms(formToShow) {
    loginForm.classList.toggle('hidden', formToShow !== 'login');
    signupForm.classList.toggle('hidden', formToShow !== 'signup');
    resetForm.classList.toggle('hidden', formToShow !== 'reset');
    
    // Clear errors when switching forms
    clearErrors();
}

function showApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
}

function showAuth() {
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
    // Show login form by default
    toggleAuthForms('login');
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

function loginWithEmail() {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    
    clearErrors();
    
    if (!email) {
        showError('login-email-error', 'Email is required');
        return;
    }
    
    if (!password) {
        showError('login-password-error', 'Password is required');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            showError('login-password-error', error.message);
        });
}

function signUpWithEmail() {
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();
    const username = signupUsername.value.trim();
    
    clearErrors();
    
    if (!email) {
        showError('signup-email-error', 'Email is required');
        return;
    }
    
    if (!password) {
        showError('signup-password-error', 'Password is required');
        return;
    }
    
    if (password.length < 6) {
        showError('signup-password-error', 'Password must be at least 6 characters');
        return;
    }
    
    if (!username) {
        showError('signup-username-error', 'Username is required');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Add user to database
            return database.ref('users/' + userCredential.user.uid).set({
                username: username,
                email: email,
                status: 'online',
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
        })
        .catch(error => {
            showError('signup-email-error', error.message);
        });
}

function sendPasswordReset() {
    const email = resetEmail.value.trim();
    
    clearErrors();
    
    if (!email) {
        showError('reset-email-error', 'Email is required');
        return;
    }
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert('Password reset email sent. Please check your inbox.');
            toggleAuthForms('login');
        })
        .catch(error => {
            showError('reset-email-error', error.message);
        });
}

function logout() {
    // Update user status to offline
    if (currentUser) {
        database.ref('users/' + currentUser.uid).update({
            status: 'offline',
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
    }
    auth.signOut();
}

function setupUserProfile(user) {
    // Set user online status
    const userStatusRef = database.ref('users/' + user.uid);
    
    userStatusRef.onDisconnect().update({
        status: 'offline',
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
    
    userStatusRef.update({
        status: 'online',
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
}

function setupChat() {
    // Load users
    database.ref('users').on('value', (snapshot) => {
        users = snapshot.val() || {};
        renderUserList();
    });
    
    // Load messages
    database.ref('rooms/' + currentRoom + '/messages').limitToLast(50).on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });
    
    // Listen for typing indicators
    database.ref('rooms/' + currentRoom + '/typing').on('child_changed', (snapshot) => {
        const typingData = snapshot.val();
        if (typingData.userId !== currentUser.uid && typingData.isTyping) {
            showTypingIndicator(typingData.username);
        } else {
            hideTypingIndicator();
        }
    });
}

function renderUserList() {
    usersContainer.innerHTML = '';
    
    Object.keys(users).forEach(userId => {
        const user = users[userId];
        if (userId === currentUser.uid) return; // Don't show current user in list
        
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div>${user.username}</div>
            <div class="status-indicator ${user.status === 'online' ? 'online' : 'offline'}"></div>
        `;
        
        userCard.addEventListener('click', () => {
            startPrivateChat(userId, user.username);
        });
        
        usersContainer.appendChild(userCard);
    });
}

function startPrivateChat(userId, username) {
    // Clear existing listeners to prevent duplicates
    database.ref('rooms/' + currentRoom + '/messages').off();
    database.ref('rooms/' + currentRoom + '/typing').off();
    
    currentRoom = `private_${[currentUser.uid, userId].sort().join('_')}`;
    chatUsername.textContent = username;
    chatAvatar.textContent = username.charAt(0).toUpperCase();
    messagesContainer.innerHTML = '';
    
    // Load private messages
    database.ref('rooms/' + currentRoom + '/messages').limitToLast(50).on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });
    
    // Listen for typing indicators in private chat
    database.ref('rooms/' + currentRoom + '/typing').on('child_changed', (snapshot) => {
        const typingData = snapshot.val();
        if (typingData.userId !== currentUser.uid && typingData.isTyping) {
            showTypingIndicator(typingData.username);
        } else {
            hideTypingIndicator();
        }
    });
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    
    const sender = users[message.senderId] || { username: 'Unknown' };
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-bubble">${message.text}</div>
        <div style="font-size: 12px; margin-top: 5px;">
            ${sender.username} • ${time}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    
    const message = {
        text: text,
        senderId: currentUser.uid,
        senderName: users[currentUser.uid]?.username || currentUser.email,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    database.ref('rooms/' + currentRoom + '/messages').push(message)
        .then(() => {
            messageInput.value = '';
            stopTyping();
        })
        .catch(error => {
            alert('Failed to send message: ' + error.message);
        });
}

function updateTyping() {
    if (!currentUser) return;
    
    const currentTime = new Date().getTime();
    
    if (!isTyping) {
        isTyping = true;
        database.ref('rooms/' + currentRoom + '/typing/' + currentUser.uid).set({
            userId: currentUser.uid,
            username: users[currentUser.uid]?.username || currentUser.email,
            isTyping: true,
            timestamp: currentTime
        });
    }
    
    lastTypingTime = currentTime;
    
    if (!typingTimeout) {
        typingTimeout = setTimeout(() => {
            const timeSinceLastTyping = new Date().getTime() - lastTypingTime;
            if (timeSinceLastTyping >= 2000 && isTyping) {
                stopTyping();
            }
        }, 2000);
    }
}

function stopTyping() {
    if (!currentUser) return;
    
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }
    
    if (isTyping) {
        isTyping = false;
        database.ref('rooms/' + currentRoom + '/typing/' + currentUser.uid).update({
            isTyping: false,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }
}

function showTypingIndicator(username) {
    typingIndicator.textContent = `${username} is typing...`;
}

function hideTypingIndicator() {
    typingIndicator.textContent = '';
}

// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', init);
