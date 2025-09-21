import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Import your page components from their respective files
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
// CORRECTED: The import now points to the correct file name "Workspace.jsx"
import WorkspacePage from './pages/Workspace.jsx';

// --- Firebase Configuration ---
// This section should be updated to securely read from your .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};


// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = firebaseConfig.appId;

export default function AppRouter() { // Renamed from App
    const [user, setUser] = useState(null);
    const [page, setPage] = useState('login'); // 'login', 'register', 'dashboard', 'workspace'
    const [loading, setLoading] = useState(true); // To show a loading state while checking auth
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
    
    useEffect(() => {
        // This is the core authentication listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setPage('dashboard');
            } else {
                setUser(null);
                setPage('login');
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const navigate = (targetPage, workspaceId = null) => {
        if (workspaceId) {
            setSelectedWorkspaceId(workspaceId);
        }
        setPage(targetPage);
    };
    
    const handleLogout = async () => {
        await signOut(auth);
        setSelectedWorkspaceId(null);
    };

    // Show a loading screen while Firebase checks the user's auth status
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <p>Loading SyncSpace...</p>
            </div>
        );
    }

    // Main Router Logic
    const renderPage = () => {
        if (!user) {
            switch (page) {
                case 'register':
                    return <RegisterPage navigate={navigate} auth={auth} />;
                case 'login':
                default:
                    return <LoginPage navigate={navigate} auth={auth} />;
            }
        } else {
             switch (page) {
                case 'workspace':
                    // CHANGED: Passed the 'user' state object directly
                    return <WorkspacePage navigate={navigate} db={db} appId={appId} workspaceId={selectedWorkspaceId} user={user} />;
                case 'dashboard':
                default:
                    // CHANGED: Passed the 'user' state object directly instead of 'auth'
                    return <DashboardPage navigate={navigate} db={db} appId={appId} user={user} onLogout={handleLogout} />;
            }
        }
    };
    
    return (
        <div className="font-sans">
            {renderPage()}
        </div>
    );
}

