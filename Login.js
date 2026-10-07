import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword
} 
from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


const loginform = document.querySelector(".loginform");
const message = document.querySelector(".loginmessage");


loginform.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.querySelector("#loginemail").value.trim();
    const password = document.querySelector("#loginpassword").value;

    if (!email || !password) {
        message.textContent = "Please enter your email and password.";
        return;
    }

    try {

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        console.log("Logged in:", userCredential.user.email);

        message.textContent = "Login successful!";

        // Go to dashboard
        window.location.href = "Dashboard.html";

    } catch (error) {

        console.error(error);

        if (error.code === "auth/invalid-credential") {
            message.textContent = "Incorrect email or password.";
        } 
        else if (error.code === "auth/user-not-found") {
            message.textContent = "No account found with this email.";
        } 
        else if (error.code === "auth/wrong-password") {
            message.textContent = "Incorrect password.";
        } 
        else {
            message.textContent = "Login failed. Please try again.";
        }
    }
});