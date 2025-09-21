import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// A simple Icon component for visual flair.
const Icon = ({ name, className }) => {
    const icons = {
        plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
        workspace: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />,
        logout: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />,
        trash: <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.033c-1.12 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" />,
        pencil: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            {icons[name]}
        </svg>
    );
};

export default function DashboardPage({ navigate, onLogout, db, appId, user }) {
    const [workspaces, setWorkspaces] = useState([]);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // ADDED: State to manage which workspace is being edited
    const [editingWorkspaceId, setEditingWorkspaceId] = useState(null);
    const [editingWorkspaceName, setEditingWorkspaceName] = useState('');

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        } 
        setIsLoading(true);
        const workspacesColRef = collection(db, `artifacts/${appId}/public/data/workspaces`);
        const q = query(workspacesColRef, where("members", "array-contains", user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedWorkspaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWorkspaces(fetchedWorkspaces);
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching workspaces:", err);
            setError("Could not load workspaces.");
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId, user]);

    const handleCreateWorkspace = async (e) => {
        e.preventDefault();
        if (newWorkspaceName.trim() === '' || !user) return;
        setError('');
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/workspaces`), { 
                name: newWorkspaceName.trim(),
                owner: user.uid,
                members: [user.uid],
                createdAt: serverTimestamp()
            });
            setNewWorkspaceName('');
        } catch (err) {
            console.error("Error creating workspace:", err);
            setError('Failed to create workspace. Please try again.');
        }
    };

    const handleDeleteWorkspace = async (workspaceId, e) => {
        e.stopPropagation(); 
        if (window.confirm("Are you sure you want to delete this workspace?")) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/public/data/workspaces`, workspaceId));
            } catch (err) {
                setError("Failed to delete workspace.");
            }
        }
    };

    // ADDED: Function to start editing a workspace name
    const handleEditWorkspace = (workspace, e) => {
        e.stopPropagation();
        setEditingWorkspaceId(workspace.id);
        setEditingWorkspaceName(workspace.name);
    };

    // ADDED: Function to save the updated workspace name
    const handleUpdateWorkspaceName = async (e) => {
        e.preventDefault();
        if (editingWorkspaceName.trim() === '') return;
        try {
            const workspaceRef = doc(db, `artifacts/${appId}/public/data/workspaces`, editingWorkspaceId);
            await updateDoc(workspaceRef, { name: editingWorkspaceName.trim() });
            setEditingWorkspaceId(null);
            setEditingWorkspaceName('');
        } catch (err) {
            setError("Failed to update workspace name.");
        }
    };

    const handleSelectWorkspace = (workspace) => {
        navigate('workspace', workspace.id);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
            <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-bold">Your Workspaces</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Select a project or create a new one.</p>
                    </div>
                    <button onClick={onLogout} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors duration-200">
                        <Icon name="logout" className="w-6 h-6" />
                        <span>Logout</span>
                    </button>
                </header>

                <form onSubmit={handleCreateWorkspace} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-10 flex flex-col sm:flex-row items-center gap-4">
                    <input type="text" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="Enter new workspace name..." className="flex-grow w-full bg-gray-200 dark:bg-gray-700 p-3 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white p-3 px-6 rounded-md font-semibold flex items-center justify-center gap-2">
                        <Icon name="plus" className="w-5 h-5" />
                        Create
                    </button>
                </form>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                {isLoading ? (
                    <p className="text-center text-gray-500 dark:text-gray-400">Loading workspaces...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workspaces.map(ws => (
                            <div key={ws.id} onClick={() => editingWorkspaceId !== ws.id && handleSelectWorkspace(ws)} className="group relative bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-200">
                                {editingWorkspaceId === ws.id ? (
                                    <form onSubmit={handleUpdateWorkspaceName}>
                                        <input type="text" value={editingWorkspaceName} onChange={(e) => setEditingWorkspaceName(e.target.value)} className="w-full bg-gray-200 dark:bg-gray-700 p-2 rounded-md outline-none ring-2 ring-blue-500 text-xl font-semibold" autoFocus />
                                        <div className="flex gap-2 mt-4">
                                            <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-md text-sm">Save</button>
                                            <button type="button" onClick={() => setEditingWorkspaceId(null)} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md text-sm">Cancel</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="cursor-pointer">
                                        <Icon name="workspace" className="w-10 h-10 mb-4 text-blue-500 dark:text-blue-400" />
                                        <h3 className="text-xl font-semibold capitalize">{ws.name}</h3>
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleEditWorkspace(ws, e)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600" aria-label="Edit workspace">
                                                <Icon name="pencil" className="w-5 h-5" />
                                            </button>
                                            <button onClick={(e) => handleDeleteWorkspace(ws.id, e)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600" aria-label="Delete workspace">
                                                <Icon name="trash" className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                 { !isLoading && workspaces.length === 0 &&
                    <div className="text-center py-16 px-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Icon name="workspace" className="w-16 h-16 mx-auto text-gray-500 dark:text-gray-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Workspaces Found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Get started by creating your first workspace above.</p>
                    </div>
                 }
            </div>
        </div>
    );
}

