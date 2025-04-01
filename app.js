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
const themeToggle = document.getElementById('theme-toggle');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const resetForm = document.getElementById('reset-form');
const chatInterface = document.getElementById('chat-interface');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupButton = document.getElementById('signup-button');
const resetEmail = document.getElementById('reset-email');
const resetButton = document.getElementById('reset-button');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const showReset = document.getElementById('show-reset');
const showLoginFromReset = document.getElementById('show-login-from-reset');

// Initialize the app
function init() {
    // Check for dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }
    
    // Set up auth state listener
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            currentUser = user;
            showChatInterface();
        } else {
            // User is signed out
            currentUser = null;
            showAuthForms();
        }
    });
    
    // Set up event listeners
    themeToggle.addEventListener('click', toggleDarkMode);
    loginButton.addEventListener('click', loginWithEmail);
    signupButton.addEventListener('click', signUpWithEmail);
    resetButton.addEventListener('click', sendPasswordReset);
    showSignup.addEventListener('click', () => toggleAuthForms('signup'));
    showLogin.addEventListener('click', () => toggleAuthForms('login'));
    showReset.addEventListener('click', () => toggleAuthForms('reset'));
    showLoginFromReset.addEventListener('click', () => toggleAuthForms('login'));
    
    // Add Enter key support
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginWithEmail();
    });
    signupPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') signUpWithEmail();
    });
    resetEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendPasswordReset();
    });
}

// Dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
}

// Show/hide auth forms
function toggleAuthForms(formToShow) {
    loginForm.style.display = formToShow === 'login' ? 'block' : 'none';
    signupForm.style.display = formToShow === 'signup' ? 'block' : 'none';
    resetForm.style.display = formToShow === 'reset' ? 'block' : 'none';
}

function showChatInterface() {
    loginForm.style.display = 'none';
    signupForm.style.display = 'none';
    resetForm.style.display = 'none';
    chatInterface.style.display = 'block';
    // Initialize your chat functionality here
}

function showAuthForms() {
    chatInterface.style.display = 'none';
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    resetForm.style.display = 'none';
}

// Email/password authentication functions
function loginWithEmail() {
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            alert('Login error: ' + error.message);
            console.error('Login error:', error);
        });
}

function signUpWithEmail() {
    const email = signupEmail.value;
    const password = signupPassword.value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .catch(error => {
            alert('Sign up error: ' + error.message);
            console.error('Sign up error:', error);
        });
}

function sendPasswordReset() {
    const email = resetEmail.value;
    
    if (!email) {
        alert('Please enter your email');
        return;
    }
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            alert('Password reset email sent. Check your inbox.');
            toggleAuthForms('login');
        })
        .catch(error => {
            alert('Error sending reset email: ' + error.message);
            console.error('Reset error:', error);
        });
}

// Initialize the app when the page loads
window.addEventListener('DOMContentLoaded', init);
