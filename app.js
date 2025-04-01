// Firebase configuration
const firebaseConfig = {
                apiKey: "AIzaSyBjh67gaNfzBTk1gNTA-bhvgZG4YX0bjeQ",
            authDomain: "friends-195c7.firebaseapp.com",
            databaseURL: "https://friends-195c7-default-rtdb.firebaseio.com",
            projectId: "friends-195c7",
            storageBucket: "friends-195c7.firebasestorage.app",
            messagingSenderId: "487210823099",
            appId: "1:487210823099:web:30fb0fb91cd484486e289e",
            measurementId: "G-PSLN4J6DGL"
};
 // Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

// DOM elements
const themeToggle = document.getElementById('theme-toggle');
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
const chatMessages = document.getElementById('chat-messages');
const usersContainer = document.getElementById('users-container');
const userCount = document.getElementById('user-count');
const attachmentButton = document.getElementById('attachment-button');
const fileInput = document.getElementById('file-input');
const typingIndicator = document.getElementById('typing-indicator');
const chatAvatar = document.getElementById('chat-avatar');
const chatUsername = document.getElementById('chat-username');

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
    messageInput.addEventListener('input', () => {
        updateTyping();
    });
    
    // File attachment
    attachmentButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileUpload);
    
    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Add tab switching logic here
        });
    });
}

// Dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Show/hide auth forms
function toggleAuthForms(formToShow) {
    loginForm.style.display = formToShow === 'login' ? 'block' : 'none';
    signupForm.style.display = formToShow === 'signup' ? 'block' : 'none';
    resetForm.style.display = formToShow === 'reset' ? 'block' : 'none';
}

function showApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
}

function showAuth() {
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
}

// Email/password authentication functions
function loginWithEmail() {
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    if (!email || !password) {
        showAlert('Please enter both email and password', 'error');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            showAlert('Login error: ' + error.message, 'error');
            console.error('Login error:', error);
        });
}

function signUpWithEmail() {
    const email = signupEmail.value;
    const password = signupPassword.value;
    const username = signupUsername.value;
    
    if (!email || !password || !username) {
        showAlert('Please fill all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Add user to database
            return database.ref('users/' + userCredential.user.uid).set({
                username: username,
                email: email,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
        })
        .catch(error => {
            showAlert('Sign up error: ' + error.message, 'error');
            console.error('Sign up error:', error);
        });
}

function sendPasswordReset() {
    const email = resetEmail.value;
    
    if (!email) {
        showAlert('Please enter your email', 'error');
        return;
    }
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showAlert('Password reset email sent. Check your inbox.', 'success');
            toggleAuthForms('login');
        })
        .catch(error => {
            showAlert('Error sending reset email: ' + error.message, 'error');
            console.error('Reset error:', error);
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

// User profile setup
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
    
    // Set user presence
    const presenceRef = database.ref('.info/connected');
    presenceRef.on('value', (snapshot) => {
        if (snapshot.val() === true) {
            userStatusRef.update({
                status: 'online',
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
        }
    });
}

// Chat functionality
function setupChat() {
    // Load users
    database.ref('users').on('value', (snapshot) => {
        users = snapshot.val() || {};
        renderUserList();
    });
    
    // Load messages
    database.ref('rooms/' + currentRoom + '/messages').on('child_added', (snapshot) => {
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
    let onlineCount = 0;
    
    Object.keys(users).forEach(userId => {
        const user = users[userId];
        if (user.status === 'online') onlineCount++;
        
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div>
                <div>${user.username}</div>
                <div style="font-size: 12px; color: var(--text-color); opacity: 0.7;">${user.email}</div>
            </div>
            <div class="user-status status-${user.status}"></div>
        `;
        
        userCard.addEventListener('click', () => {
            startPrivateChat(userId, user.username);
        });
        
        usersContainer.appendChild(userCard);
    });
    
    userCount.textContent = `${onlineCount} online`;
}

function startPrivateChat(userId, username) {
    currentRoom = `private_${[currentUser.uid, userId].sort().join('_')}`;
    chatUsername.textContent = username;
    chatAvatar.textContent = username.charAt(0).toUpperCase();
    chatMessages.innerHTML = '';
    
    // Load private messages
    database.ref('rooms/' + currentRoom + '/messages').on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
    
    const sender = users[message.senderId] || { username: 'Unknown', email: '' };
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${sender.username.charAt(0).toUpperCase()}</div>
        <div class="message-content">
            <div class="message-bubble">${message.text}</div>
            <div class="message-info">
                <span>${sender.username}</span>
                <span class="message-time">${formatTime(message.timestamp)}</span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
            showAlert('Failed to send message: ' + error.message, 'error');
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
    typingIndicator.style.display = 'inline';
}

function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size should be less than 5MB', 'error');
        return;
    }
    
    // Upload file to Firebase Storage
    const storageRef = storage.ref('chat_files/' + currentUser.uid + '/' + Date.now() + '_' + file.name);
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed', 
        (snapshot) => {
            // Progress tracking could be added here
        }, 
        (error) => {
            showAlert('File upload failed: ' + error.message, 'error');
        }, 
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                // Send message with file link
                const message = {
                    text: `File: ${file.name} (${(file.size / 1024).toFixed(1)}KB) - ${downloadURL}`,
                    senderId: currentUser.uid,
                    senderName: users[currentUser.uid]?.username || currentUser.email,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    isFile: true,
                    fileName: file.name,
                    fileUrl: downloadURL,
                    fileSize: file.size
                };
                
                database.ref('rooms/' + currentRoom + '/messages').push(message);
            });
        }
    );
}

// Helper functions
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showAlert(message, type) {
    // Implement a nice alert/notification system
    alert(`${type.toUpperCase()}: ${message}`);
}

// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', init);
