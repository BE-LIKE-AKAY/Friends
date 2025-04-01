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
const signInButton = document.getElementById('signin-button');
const signOutButton = document.getElementById('signout-button');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');

// Room management
let currentRoomId = generateRoomId();
let currentUser = null;
let usersInRoom = {};

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
            userInfoDiv.style.display = 'block';
            userNameSpan.textContent = user.displayName || user.email;
            signInButton.style.display = 'none';
            signOutButton.style.display = 'inline-block';
            messageInput.disabled = false;
            sendButton.disabled = false;
            
            // Join the room
            joinRoom();
        } else {
            // User is signed out
            currentUser = null;
            userInfoDiv.style.display = 'none';
            signInButton.style.display = 'inline-block';
            signOutButton.style.display = 'none';
            messageInput.disabled = true;
            sendButton.disabled = true;
        }
    });
    
    // Set up event listeners
    signInButton.addEventListener('click', signInWithGoogle);
    signOutButton.addEventListener('click', signOut);
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    copyButton.addEventListener('click', copyRoomUrl);
    
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
            alert('This room is full (32 users maximum). Please try another room.');
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
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
        copyButton.textContent = 'Copy Link';
    }, 2000);
}

// Sign in with Google
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error('Sign in error:', error);
        alert('Sign in failed: ' + error.message);
    });
}

// Sign out
function signOut() {
    // Remove user from room before signing out
    if (currentUser) {
        database.ref(`rooms/${currentRoomId}/users/${currentUser.uid}`).remove();
    }
    auth.signOut();
}

// Join the current room
function joinRoom() {
    if (!currentUser) return;
    
    const userRef = database.ref(`rooms/${currentRoomId}/users/${currentUser.uid}`);
    
    // Set user data
    userRef.set({
        name: currentUser.displayName || currentUser.email,
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
        senderName: currentUser.displayName || currentUser.email,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Push message to Firebase
    database.ref(`rooms/${currentRoomId}/messages`).push(message)
        .catch(error => {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + error.message);
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
    senderName.style.fontWeight = 'bold';
    senderName.style.marginBottom = '4px';
    senderName.textContent = message.senderName;
    
    const messageText = document.createElement('div');
    messageText.textContent = message.text;
    
    const timestamp = document.createElement('div');
    timestamp.style.fontSize = '0.8em';
    timestamp.style.marginTop = '4px';
    timestamp.style.textAlign = 'right';
    timestamp.textContent = formatTimestamp(message.timestamp);
    
    messageDiv.appendChild(senderName);
    messageDiv.appendChild(messageText);
    messageDiv.appendChild(timestamp);
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', init);
