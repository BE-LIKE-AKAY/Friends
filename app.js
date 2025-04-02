// Firebase configuration - REPLACE WITH YOUR CONFIG
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
// Firebase configuration - REPLACE WITH YOUR CONFIG
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

// DOM elements
const authSection = document.getElementById('auth-section');
const chatSection = document.getElementById('chat-section');
const chatContainer = document.getElementById('chat-container');
const welcomeMessage = document.getElementById('welcome-message');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const roomUrlInput = document.getElementById('room-url');
const copyButton = document.getElementById('copy-button');
const roomIdDisplay = document.getElementById('room-id-display');
const userCountDisplay = document.getElementById('user-count');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const userEmailSpan = document.getElementById('user-email');
const userAvatar = document.getElementById('user-avatar');
const signOutButton = document.getElementById('signout-button');
const guestNotice = document.getElementById('guest-notice');
const showAuthButton = document.getElementById('show-auth-button');
const continueGuestButton = document.getElementById('continue-guest-button');
const typingIndicator = document.getElementById('typing-indicator');

// Auth form elements
const authTabs = document.querySelectorAll('.auth-tab');
const signInForm = document.getElementById('signin-form');
const signUpForm = document.getElementById('signup-form');
const signInEmail = document.getElementById('signin-email');
const signInPassword = document.getElementById('signin-password');
const signInButton = document.getElementById('signin-button');
const signInMessage = document.getElementById('signin-message');
const signUpEmail = document.getElementById('signup-email');
const signUpPassword = document.getElementById('signup-password');
const signUpPasswordConfirm = document.getElementById('signup-password-confirm');
const signUpButton = document.getElementById('signup-button');
const signUpMessage = document.getElementById('signup-message');

// Chat state
let currentRoomId = generateRoomId();
let currentUser = null;
let usersInRoom = {};
let isGuest = false;
let lastTypingTime = 0;
let typingTimeout = null;
let isTyping = false;
let messageCount = 0;

// Initialize the app
function init() {
    // Check for room ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    if (roomId && isValidRoomId(roomId)) {
        currentRoomId = roomId;
    }
    
    updateRoomUrl();
    roomIdDisplay.textContent = currentRoomId;
    
    // Set up auth state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            handleUserSignIn(user);
        } else {
            // User is signed out
            handleUserSignOut();
        }
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Auto-resize textarea
    setupTextareaAutoResize();
}

function handleUserSignIn(user) {
    currentUser = user;
    isGuest = false;
    updateUserInfo(user);
    userInfoDiv.style.display = 'flex';
    guestNotice.style.display = 'none';
    authSection.style.display = 'none';
    chatSection.style.display = 'block';
    messageInput.disabled = false;
    sendButton.disabled = false;
    
    // Join the room
    joinRoom();
}

function handleUserSignOut() {
    currentUser = null;
    userInfoDiv.style.display = 'none';
    authSection.style.display = 'block';
    chatSection.style.display = 'none';
    
    // Show guest mode by default
    enableGuestMode();
}

function setupEventListeners() {
    // Auth and navigation
    signOutButton.addEventListener('click', signOut);
    showAuthButton.addEventListener('click', showAuthForms);
    continueGuestButton.addEventListener('click', enableGuestMode);
    
    // Message sending
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Typing indicator
    messageInput.addEventListener('input', () => {
        updateTypingStatus(true);
    });
    
    // Room sharing
    copyButton.addEventListener('click', copyRoomUrl);
    
    // Auth tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            signInForm.classList.remove('active');
            signUpForm.classList.remove('active');
            
            if (tab.dataset.tab === 'signin') {
                signInForm.classList.add('active');
            } else {
                signUpForm.classList.add('active');
            }
        });
    });
    
    // Auth form submissions
    signInButton.addEventListener('click', signInWithEmail);
    signUpButton.addEventListener('click', signUpWithEmail);
}

function setupTextareaAutoResize() {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

// Generate a random room ID
function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function isValidRoomId(roomId) {
    return /^[A-Za-z0-9]{8}$/.test(roomId);
}

function updateRoomUrl() {
    const url = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    roomUrlInput.value = url;
}

function copyRoomUrl() {
    roomUrlInput.select();
    document.execCommand('copy');
    
    // Visual feedback
    const originalText = copyButton.innerHTML;
    copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
        copyButton.innerHTML = originalText;
    }, 2000);
}

function showMessage(message, type, form = 'signin') {
    const messageDiv = form === 'signin' ? signInMessage : signUpMessage;
    messageDiv.textContent = message;
    messageDiv.className = 'message-box ' + type;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function updateUserInfo(user) {
    const displayName = user.displayName || user.email.split('@')[0];
    userNameSpan.textContent = displayName;
    userEmailSpan.textContent = user.email;
    
    // Set avatar initials
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    userAvatar.textContent = initials;
    userAvatar.style.backgroundColor = stringToColor(user.email);
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

async function signInWithEmail() {
    const email = signInEmail.value;
    const password = signInPassword.value;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', 'error', 'signin');
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        console.error('Sign in error:', error);
        showMessage('Sign in failed: ' + error.message, 'error', 'signin');
    }
}

async function signUpWithEmail() {
    const email = signUpEmail.value;
    const password = signUpPassword.value;
    const passwordConfirm = signUpPasswordConfirm.value;
    
    if (!email || !password || !passwordConfirm) {
        showMessage('Please fill in all fields', 'error', 'signup');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password should be at least 6 characters', 'error', 'signup');
        return;
    }
    
    if (password !== passwordConfirm) {
        showMessage('Passwords do not match', 'error', 'signup');
        return;
    }
    
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        showMessage('Account created successfully!', 'success', 'signup');
        
        // Clear form
        signUpEmail.value = '';
        signUpPassword.value = '';
        signUpPasswordConfirm.value = '';
        
        // Switch to sign in tab
        document.querySelector('.auth-tab[data-tab="signin"]').click();
    } catch (error) {
        console.error('Sign up error:', error);
        showMessage('Sign up failed: ' + error.message, 'error', 'signup');
    }
}

function signOut() {
    // Remove user from room before signing out
    if (currentUser && !isGuest) {
        database.ref(`rooms/${currentRoomId}/users/${currentUser.uid}`).remove();
    }
    auth.signOut();
    enableGuestMode();
}

function showAuthForms() {
    guestNotice.style.display = 'none';
    authForms.style.display = 'block';
}

function enableGuestMode() {
    isGuest = true;
    currentUser = {
        uid: 'guest_' + Math.random().toString(36).substr(2, 9),
        displayName: 'Guest' + Math.floor(Math.random() * 1000),
        email: null
    };
    
    updateUserInfo(currentUser);
    guestNotice.style.display = 'flex';
    authForms.style.display = 'none';
    authSection.style.display = 'none';
    chatSection.style.display = 'block';
    messageInput.disabled = false;
    sendButton.disabled = false;
    
    // Join the room as guest
    joinRoom();
}

function joinRoom() {
    if (!currentUser) return;
    
    const userRef = database.ref(`rooms/${currentRoomId}/users/${currentUser.uid}`);
    
    // Set user data
    userRef.set({
        name: currentUser.displayName,
        isGuest: isGuest,
        joinedAt: firebase.database.ServerValue.TIMESTAMP,
        isTyping: false,
        lastActive: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Update last active time every 30 seconds
    const activeInterval = setInterval(() => {
        userRef.update({
            lastActive: firebase.database.ServerValue.TIMESTAMP
        });
    }, 30000);
    
    // Set up message listener
    setupMessageListener();
    
    // Set up user count listener
    setupUserCountListener();
    
    // Set up typing listener
    setupTypingListener();
    
    // Remove user when they leave (close browser/tab)
    window.addEventListener('beforeunload', () => {
        clearInterval(activeInterval);
        userRef.remove();
    });
}

function setupMessageListener() {
    database.ref(`rooms/${currentRoomId}/messages`).limitToLast(100).on('child_added', snapshot => {
        const message = snapshot.val();
        displayMessage(message);
        
        // Hide welcome message after first message
        if (messageCount === 0) {
            welcomeMessage.style.display = 'none';
        }
        messageCount++;
    });
}

function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    // Determine if message is from current user
    const isCurrentUser = message.senderId === (currentUser?.uid || (isGuest && currentUser?.uid));
    
    if (isCurrentUser) {
        messageDiv.classList.add('sent');
    } else {
        messageDiv.classList.add('received');
    }
    
    const senderName = document.createElement('div');
    senderName.className = 'message-sender';
    senderName.textContent = message.senderName + (message.isGuest ? ' (Guest)' : '');
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = message.text;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = formatTimestamp(message.timestamp);
    
    messageDiv.appendChild(senderName);
    messageDiv.appendChild(messageText);
    messageDiv.appendChild(messageTime);
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
    const messageText = messageInput.value.trim();
    if ((!currentUser && !isGuest) || !messageText) return;
    
    const senderId = isGuest ? currentUser.uid : currentUser?.uid;
    const senderName = isGuest ? currentUser.displayName : currentUser?.displayName || currentUser?.email.split('@')[0];
    
    const message = {
        text: messageText,
        senderId: senderId,
        senderName: senderName,
        isGuest: isGuest,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        // Reset input field immediately for better UX
        messageInput.value = '';
        messageInput.style.height = 'auto';
        updateTypingStatus(false);
        
        // Disable send button while sending
        sendButton.disabled = true;
        
        await database.ref(`rooms/${currentRoomId}/messages`).push(message);
        
        // Re-enable send button
        sendButton.disabled = false;
    } catch (error) {
        console.error('Error sending message:', error);
        showMessage('Failed to send message: ' + error.message, 'error');
        
        // Restore message if failed to send
        messageInput.value = messageText;
        sendButton.disabled = false;
    }
}

function setupUserCountListener() {
    database.ref(`rooms/${currentRoomId}/users`).on('value', snapshot => {
        const users = snapshot.val() || {};
        
        // Filter out inactive users (last active > 2 minutes ago)
        const now = Date.now();
        const activeUsers = Object.keys(users).filter(userId => {
            return users[userId].lastActive && (now - users[userId].lastActive) < 120000;
        });
        
        usersInRoom = activeUsers.reduce((acc, userId) => {
            acc[userId] = users[userId];
            return acc;
        }, {});
        
        const userCount = activeUsers.length;
        userCountDisplay.textContent = userCount;
        
        // Check if room is full (32 users)
        if (userCount >= 32 && !usersInRoom[currentUser?.uid]) {
            showMessage('This room is full (32 users maximum). Please try another room.', 'error');
            window.location.href = window.location.pathname; // Redirect to new room
        }
    });
}

function setupTypingListener() {
    database.ref(`rooms/${currentRoomId}/users`).on('value', snapshot => {
        const users = snapshot.val() || {};
        const typingUsers = [];
        
        Object.keys(users).forEach(userId => {
            if (userId !== currentUser?.uid && users[userId].isTyping) {
                typingUsers.push(users[userId].name);
            }
        });
        
        updateTypingIndicator(typingUsers);
    });
}

function updateTypingStatus(typing) {
    if (!currentUser || isTyping === typing) return;
    
    clearTimeout(typingTimeout);
    
    if (typing) {
        // User started typing
        isTyping = true;
        database.ref(`rooms/${currentRoomId}/users/${currentUser.uid}`).update({
            isTyping: true,
            lastActive: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Set timeout to stop typing after 3 seconds of inactivity
        typingTimeout = setTimeout(() => {
            updateTypingStatus(false);
        }, 3000);
    } else {
        // User stopped typing
        isTyping = false;
        database.ref(`rooms/${currentRoomId}/users/${currentUser.uid}`).update({
            isTyping: false
        });
    }
}

function updateTypingIndicator(typingUsers) {
    if (typingUsers.length === 0) {
        typingIndicator.textContent = '';
        return;
    }
    
    let message = '';
    if (typingUsers.length === 1) {
        message = `${typingUsers[0]} is typing...`;
    } else if (typingUsers.length === 2) {
        message = `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    } else {
        message = `${typingUsers[0]}, ${typingUsers[1]} and others are typing...`;
    }
    
    typingIndicator.textContent = message;
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', init);
