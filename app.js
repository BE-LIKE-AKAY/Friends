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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// DOM elements
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const roomUrlInput = document.getElementById('room-url');
const copyButton = document.getElementById('copy-button');
const roomIdDisplay = document.getElementById('room-id-display');
const userCountDisplay = document.getElementById('user-count');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const userEmailSpan = document.getElementById('user-email');
const userAvatarImg = document.getElementById('user-avatar');
const signOutButton = document.getElementById('signout-button');
const authSection = document.getElementById('auth-section');
const authForms = document.getElementById('auth-forms');
const guestModeDiv = document.getElementById('guest-mode');
const showAuthButton = document.getElementById('show-auth-button');
const continueGuestButton = document.getElementById('continue-guest-button');

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

// Room management
let currentRoomId = generateRoomId();
let currentUser = null;
let usersInRoom = {};
let isGuest = false;

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
            currentUser = user;
            isGuest = false;
            updateUserInfo(user);
            userInfoDiv.style.display = 'flex';
            guestModeDiv.style.display = 'none';
            authForms.style.display = 'none';
            messageInput.disabled = false;
            sendButton.disabled = false;
            
            // Join the room
            joinRoom();
        } else {
            // User is signed out
            currentUser = null;
            userInfoDiv.style.display = 'none';
            
            // Show guest mode by default
            enableGuestMode();
        }
    });
    
    // Set up event listeners
    signOutButton.addEventListener('click', signOut);
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
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
    
    // Guest mode buttons
    showAuthButton.addEventListener('click', showAuthForms);
    continueGuestButton.addEventListener('click', enableGuestMode);
    
    // Listen for messages
    database.ref(`rooms/${currentRoomId}/messages`).on('child_added', snapshot => {
        const message = snapshot.val();
        displayMessage(message);
    });
    
    // Listen for user count changes
    database.ref(`rooms/${currentRoomId}/users`).on('value', snapshot => {
        usersInRoom = snapshot.val() || {};
        const userCount = Object.keys(usersInRoom).length;
        userCountDisplay.textContent = userCount;
        
        // Check if room is full (32 users)
        if (userCount >= 32 && !usersInRoom[currentUser?.uid]) {
            showMessage('This room is full (32 users maximum). Please try another room.', 'error');
            window.location.href = window.location.pathname; // Redirect to new room
        }
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

// Validate room ID format
function isValidRoomId(roomId) {
    return /^[A-Za-z0-9]{8}$/.test(roomId);
}

// Update the room URL in the input field
function updateRoomUrl() {
    const url = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    roomUrlInput.value = url;
}

// Copy room URL to clipboard
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

// Show message in auth forms
function showMessage(message, type, form = 'signin') {
    const messageDiv = form === 'signin' ? signInMessage : signUpMessage;
    messageDiv.textContent = message;
    messageDiv.className = 'auth-message ' + type;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Update user info display
function updateUserInfo(user) {
    userNameSpan.textContent = user.displayName || 'User';
    userEmailSpan.textContent = user.email;
    
    // Set avatar (using Gravatar as fallback)
    if (user.photoURL) {
        userAvatarImg.src = user.photoURL;
    } else if (user.email) {
        const hash = md5(user.email.trim().toLowerCase());
        userAvatarImg.src = `https://www.gravatar.com/avatar/${hash}?d=identicon`;
    }
}

// Sign in with email/password
function signInWithEmail() {
    const email = signInEmail.value;
    const password = signInPassword.value;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', 'error', 'signin');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            console.error('Email sign in error:', error);
            showMessage('Sign in failed: ' + error.message, 'error', 'signin');
        });
}

// Sign up with email/password
function signUpWithEmail() {
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
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            showMessage('Account created successfully!', 'success', 'signup');
            // Clear form
            signUpEmail.value = '';
            signUpPassword.value = '';
            signUpPasswordConfirm.value = '';
            
            // Switch to sign in tab
            document.querySelector('.auth-tab[data-tab="signin"]').click();
        })
        .catch(error => {
            console.error('Email sign up error:', error);
            showMessage('Sign up failed: ' + error.message, 'error', 'signup');
        });
}

// Sign out
function signOut() {
    // Remove user from room before signing out
    if (currentUser && !isGuest) {
        database.ref(`rooms/${currentRoomId}/users/${currentUser.uid}`).remove();
    }
    auth.signOut();
    enableGuestMode();
}

// Show auth forms
function showAuthForms() {
    guestModeDiv.style.display = 'none';
    authForms.style.display = 'block';
}

// Enable guest mode
function enableGuestMode() {
    isGuest = true;
    currentUser = {
        uid: 'guest_' + Math.random().toString(36).substr(2, 9),
        displayName: 'Guest',
        email: null
    };
    
    guestModeDiv.style.display = 'flex';
    authForms.style.display = 'none';
    messageInput.disabled = false;
    sendButton.disabled = false;
    
    // Join the room as guest
    joinRoom();
}

// Join the current room
function joinRoom() {
    if (!currentUser) return;
    
    const userRef = database.ref(`rooms/${currentRoomId}/users/${currentUser.uid}`);
    
    // Set user data
    userRef.set({
        name: currentUser.displayName || (isGuest ? 'Guest' : 'User'),
        isGuest: isGuest,
        joinedAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Remove user when they leave (close browser/tab)
    window.addEventListener('beforeunload', () => {
        userRef.remove();
    });
}

// Send a message
function sendMessage() {
    if (!currentUser || !messageInput.value.trim()) return;
    
    const message = {
        text: messageInput.value.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || (isGuest ? 'Guest' : 'User'),
        isGuest: isGuest,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Push message to Firebase
    database.ref(`rooms/${currentRoomId}/messages`).push(message)
        .catch(error => {
            console.error('Error sending message:', error);
            showMessage('Failed to send message: ' + error.message, 'error');
        });
    
    // Clear input
    messageInput.value = '';
}

// Display a message in the chat
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    if (message.senderId === currentUser?.uid) {
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

// Format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Simple MD5 function for Gravatar (from https://stackoverflow.com/a/60467595)
function md5(string) {
    function rotateLeft(value, amount) {
        return (value << amount) | (value >>> (32 - amount));
    }
    
    function cmn(q, a, b, x, s, t) {
        return rotateLeft((a + q + x + t) | 0, s) + b | 0;
    }
    
    function ff(a, b, c, d, x, s, t) {
        return cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    
    function gg(a, b, c, d, x, s, t) {
        return cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    
    function hh(a, b, c, d, x, s, t) {
        return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    
    function ii(a, b, c, d, x, s, t) {
        return cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    
    const blocks = new Uint8Array(((string.length + 8) >> 6) + 1 << 6);
    for (let i = 0; i < string.length; i++) {
        blocks[i >> 2] |= string.charCodeAt(i) << (i % 4 << 3);
    }
    blocks[string.length >> 2] |= 0x80 << (string.length % 4 << 3);
    blocks[blocks.length - 2] = string.length * 8;
    
    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;
    
    for (let i = 0; i < blocks.length; i += 16) {
        const aa = a;
        const bb = b;
        const cc = c;
        const dd = d;
        
        a = ff(a, b, c, d, blocks[i + 0], 7, -680876936);
        d = ff(d, a, b, c, blocks[i + 1], 12, -389564586);
        c = ff(c, d, a, b, blocks[i + 2], 17, 606105819);
        b = ff(b, c, d, a, blocks[i + 3], 22, -1044525330);
        a = ff(a, b, c, d, blocks[i + 4], 7, -176418897);
        d = ff(d, a, b, c, blocks[i + 5], 12, 1200080426);
        c = ff(c, d, a, b, blocks[i + 6], 17, -1473231341);
        b = ff(b, c, d, a, blocks[i + 7], 22, -45705983);
        a = ff(a, b, c, d, blocks[i + 8], 7, 1770035416);
        d = ff(d, a, b, c, blocks[i + 9], 12, -1958414417);
        c = ff(c, d, a, b, blocks[i + 10], 17, -42063);
        b = ff(b, c, d, a, blocks[i + 11], 22, -1990404162);
        a = ff(a, b, c, d, blocks[i + 12], 7, 1804603682);
        d = ff(d, a, b, c, blocks[i + 13], 12, -40341101);
        c = ff(c, d, a, b, blocks[i + 14], 17, -1502002290);
        b = ff(b, c, d, a, blocks[i + 15], 22, 1236535329);
        
        a = gg(a, b, c, d, blocks[i + 1], 5, -165796510);
        d = gg(d, a, b, c, blocks[i + 6], 9, -1069501632);
        c = gg(c, d, a, b, blocks[i + 11], 14, 643717713);
        b = gg(b, c, d, a, blocks[i + 0], 20, -373897302);
        a = gg(a, b, c, d, blocks[i + 5], 5, -701558691);
        d = gg(d, a, b, c, blocks[i + 10], 9, 38016083);
        c = gg(c, d, a, b, blocks[i + 15], 14, -660478335);
        b = gg(b, c, d, a, blocks[i + 4], 20, -405537848);
        a = gg(a, b, c, d, blocks[i + 9], 5, 568446438);
        d = gg(d, a, b, c, blocks[i + 14], 9, -1019803690);
        c = gg(c, d, a, b, blocks[i + 3], 14, -187363961);
        b = gg(b, c, d, a, blocks[i + 8], 20, 1163531501);
        a = gg(a, b, c, d, blocks[i + 13], 5, -1444681467);
        d = gg(d, a, b, c, blocks[i + 2], 9, -51403784);
        c = gg(c, d, a, b, blocks[i + 7], 14, 1735328473);
        b = gg(b, c, d, a, blocks[i + 12], 20, -1926607734);
        
        a = hh(a, b, c, d, blocks[i + 5], 4, -378558);
        d = hh(d, a, b, c, blocks[i + 8], 11, -2022574463);
        c = hh(c, d, a, b, blocks[i + 11], 16, 1839030562);
        b = hh(b, c, d, a, blocks[i + 14], 23, -35309556);
        a = hh(a, b, c, d, blocks[i + 1], 4, -1530992060);
        d = hh(d, a, b, c, blocks[i + 4], 11, 1272893353);
        c = hh(c, d, a, b, blocks[i + 7], 16, -155497632);
        b = hh(b, c, d, a, blocks[i + 10], 23, -1094730640);
        a = hh(a, b, c, d, blocks[i + 13], 4, 681279174);
        d = hh(d, a, b, c, blocks[i + 0], 11, -358537222);
        c = hh(c, d, a, b, blocks[i + 3], 16, -722521979);
        b = hh(b, c, d, a, blocks[i + 6], 23, 76029189);
        a = hh(a, b, c, d, blocks[i + 9], 4, -640364487);
        d = hh(d, a, b, c, blocks[i + 12], 11, -421815835);
        c = hh(c, d, a, b, blocks[i + 15], 16, 530742520);
        b = hh(b, c, d, a, blocks[i + 2], 23, -995338651);
        
        a = ii(a, b, c, d, blocks[i + 0], 6, -198630844);
        d = ii(d, a, b, c, blocks[i + 7], 10, 1126891415);
        c = ii(c, d, a, b, blocks[i + 14], 15, -1416354905);
        b = ii(b, c, d, a, blocks[i + 5], 21, -57434055);
        a = ii(a, b, c, d, blocks[i + 12], 6, 1700485571);
        d = ii(d, a, b, c, blocks[i + 3], 10, -1894986606);
        c = ii(c, d, a, b, blocks[i + 10], 15, -1051523);
        b = ii(b, c, d, a, blocks[i + 1], 21, -2054922799);
        a = ii(a, b, c, d, blocks[i + 8], 6, 1873313359);
        d = ii(d, a, b, c, blocks[i + 15], 10, -30611744);
        c = ii(c, d, a, b, blocks[i + 6], 15, -1560198380);
        b = ii(b, c, d, a, blocks[i + 13], 21, 1309151649);
        a = ii(a, b, c, d, blocks[i + 4], 6, -145523070);
        d = ii(d, a, b, c, blocks[i + 11], 10, -1120210379);
        c = ii(c, d, a, b, blocks[i + 2], 15, 718787259);
        b = ii(b, c, d, a, blocks[i + 9], 21, -343485551);
        
        a = a + aa | 0;
        b = b + bb | 0;
        c = c + cc | 0;
        d = d + dd | 0;
    }
    
    return [a, b, c, d].map(x => {
        const hex = (x >>> 0).toString(16);
        return '00000000'.substr(0, 8 - hex.length) + hex;
    }).join('');
}

// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', init);
