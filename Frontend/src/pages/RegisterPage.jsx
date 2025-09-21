import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// A simple Icon component for visual flair.
const Icon = ({ name, className }) => {
    const icons = {
        user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
        lock: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25-2.25v6.75a2.25 2.25 0 002.25 2.25z" />,
        envelope: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    };
    return (
        <svg xmlns="http://www.w.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            {icons[name]}
        </svg>
    );
};

// Main Register Page Component
export default function RegisterPage({ navigate, auth }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            // On successful registration, the onAuthStateChanged listener in App.jsx will handle navigation.
        } catch (err) {
            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError('This email address is already taken.');
                    break;
                case 'auth/invalid-email':
                    setError('Please enter a valid email address.');
                    break;
                case 'auth/weak-password':
                    setError('The password is too weak.');
                    break;
                default:
                    setError('Failed to create an account. Please try again.');
                    break;
            }
            console.error("Firebase registration error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-lg">
                <div>
                    <h2 className="text-4xl font-bold text-center text-white">Create Account</h2>
                    <p className="mt-2 text-center text-gray-400">Join SyncSpace to start collaborating</p>
                </div>
                <form className="mt-8" onSubmit={handleRegister}>
                    <div className="space-y-6">
                         <div className="relative">
                            <Icon name="envelope" className="w-6 h-6 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full py-3 pl-12 pr-4 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Email address"
                            />
                        </div>
                        <div className="relative">
                            <Icon name="lock" className="w-6 h-6 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full py-3 pl-12 pr-4 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Password"
                            />
                        </div>
                         <div className="relative">
                            <Icon name="lock" className="w-6 h-6 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full py-3 pl-12 pr-4 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Confirm Password"
                            />
                        </div>
                    </div>
                    
                    {error && <p className="mt-4 text-sm text-center text-red-400">{error}</p>}

                    <div className="mt-8">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                </form>
                <p className="mt-6 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <button onClick={() => navigate('login')} className="font-medium text-blue-400 hover:text-blue-300">
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
}