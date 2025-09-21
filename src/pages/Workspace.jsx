import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, onSnapshot, collection, addDoc, deleteDoc, serverTimestamp, query, orderBy, updateDoc } from 'firebase/firestore';

// A simple Icon component for visual flair.
const Icon = ({ name, className }) => {
    const icons = {
        trash: <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134H8.033c-1.12 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" />,
        upload: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            {icons[name]}
        </svg>
    );
};


// --- Component 1: CollaborativeEditor ---
function CollaborativeEditor({ workspaceId, db, appId }) {
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('Ready');
    const debounceTimeout = useRef(null);

    useEffect(() => {
        if (!workspaceId || !db || !appId) return;
        
        const docRef = doc(db, `artifacts/${appId}/public/data/workspaces/${workspaceId}/documents/main_doc`);
        setStatus('Connecting...');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const remoteContent = docSnap.data().content;
                setContent(currentContent => currentContent !== remoteContent ? remoteContent : currentContent);
            } else {
                setDoc(docRef, { content: '' });
            }
            setStatus('Ready');
        }, (error) => {
            console.error("Error listening to document:", error);
            setStatus('Error');
        });
        return () => unsubscribe();
    }, [workspaceId, db, appId]);

    const handleChange = (e) => {
        if (!workspaceId || !db || !appId) return;
        
        const newText = e.target.value;
        setContent(newText);
        setStatus('Typing...');
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            const docRef = doc(db, `artifacts/${appId}/public/data/workspaces/${workspaceId}/documents/main_doc`);
            setStatus('Saving...');
            setDoc(docRef, { content: newText }, { merge: true })
                .then(() => {
                    setStatus('Saved');
                    setTimeout(() => setStatus('Ready'), 2000);
                })
                .catch(error => {
                    console.error("Error saving document:", error);
                    setStatus('Error');
                });
        }, 1000);
    };
    
    return (
        <div className="flex flex-col h-full pt-4 flex-grow">
            <textarea
                value={content}
                onChange={handleChange}
                className="w-full flex-grow bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="Start typing your collaborative document..."
            />
            <div className={`text-right text-sm mt-2 pr-2 transition-colors duration-300 ${status === 'Saved' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                Status: {status}
            </div>
        </div>
    );
}

// --- Component 2: KanbanBoard ---
function KanbanBoard({ workspaceId, db, appId }) {
    const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] });
    const [draggedTask, setDraggedTask] = useState(null);

    useEffect(() => {
        if (!workspaceId || !db || !appId) return;

        const tasksRef = collection(db, `artifacts/${appId}/public/data/workspaces/${workspaceId}/tasks`);
        const q = query(tasksRef, orderBy('createdAt'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newTasks = { todo: [], inProgress: [], done: [] };
            snapshot.forEach(doc => {
                const task = { id: doc.id, ...doc.data() };
                if (newTasks[task.status]) {
                   newTasks[task.status].push(task);
                }
            });
            setTasks(newTasks);
        });
        return () => unsubscribe();
    }, [db, appId, workspaceId]);

    const handleDragStart = (e, task) => setDraggedTask(task);
    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = async (e, status) => {
        e.preventDefault();
        if (draggedTask && draggedTask.status !== status) {
            const taskRef = doc(db, `artifacts/${appId}/public/data/workspaces/${workspaceId}/tasks`, draggedTask.id);
            await updateDoc(taskRef, { status: status });
        }
        setDraggedTask(null);
    };

    const handleDelete = async (taskId) => {
         const taskRef = doc(db, `artifacts/${appId}/public/data/workspaces/${workspaceId}/tasks`, taskId);
         await deleteDoc(taskRef);
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 h-full">
            {['todo', 'inProgress', 'done'].map(status => (
                <KanbanColumn key={status} status={status} tasks={tasks[status]} db={db} appId={appId} workspaceId={workspaceId} onDragOver={handleDragOver} onDrop={handleDrop} onDragStart={handleDragStart} onDelete={handleDelete} />
            ))}
        </div>
    );
};

const KanbanColumn = ({ status, tasks, db, appId, workspaceId, onDragOver, onDrop, onDragStart, onDelete }) => {
    const [newTaskText, setNewTaskText] = useState('');
    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        await addDoc(collection(db, `artifacts/${appId}/public/data/workspaces/${workspaceId}/tasks`), { text: newTaskText, status: status, createdAt: serverTimestamp() });
        setNewTaskText('');
    };
    const statusLabels = { todo: 'To Do', inProgress: 'In Progress', done: 'Done' };
    
    return (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex flex-col h-full" onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)}>
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">{statusLabels[status]}</h3>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                {tasks.map(task => (
                    <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task)} className="bg-white dark:bg-gray-700 p-3 rounded-md cursor-grab active:cursor-grabbing flex justify-between items-center shadow">
                       <p className="break-words text-gray-800 dark:text-gray-200">{task.text}</p>
                       <button onClick={() => onDelete(task.id)} className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 ml-2 flex-shrink-0"><Icon name="trash" className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddTask} className="mt-4 flex gap-2"><input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Add a new task..." className="flex-grow bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /><button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex-shrink-0">+</button></form>
        </div>
    );
};

// --- Component 3: WorkspaceChat ---
function WorkspaceChat({ workspaceId, user, db, appId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null); 

    useEffect(() => {
        if (!workspaceId || !db || !appId) return;

        const q = query(collection(db, `artifacts/${appId}/public/data/workspaces/${workspaceId}/messages`), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = [];
            querySnapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [workspaceId, db, appId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;
        await addDoc(collection(db, `artifacts/${appId}/public/data/workspaces/${workspaceId}/messages`), {
            text: newMessage,
            createdAt: serverTimestamp(),
            uid: user.uid,
            displayName: user.email 
        });
        setNewMessage('');
    };
    
    return (
        <div className="flex flex-col h-full pt-4 flex-grow">
            <div className="flex-grow bg-gray-100 dark:bg-gray-800 rounded-t-lg p-4 space-y-4 overflow-y-auto">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.uid === user.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-lg ${msg.uid === user.uid ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'}`}>
                            <p className="text-xs text-blue-200 dark:text-gray-400 mb-1">{msg.displayName}</p>
                            <p className="break-words">{msg.text}</p>
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex-shrink-0 flex gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-b-lg">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-grow bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Send</button>
            </form>
        </div>
    );
}

// --- Component 4: FileManager (Placeholder) ---
function FileManager() { 
    return (
        <div className="pt-4 h-full">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 h-full">
                 <h2 className="text-xl font-bold mb-4">Project Files</h2>
                 <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mb-6">
                    <Icon name="upload" className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Drag & drop files here or click to upload</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">File upload functionality is not yet implemented.</p>
                 </div>
                 <div>
                    <h3 className="font-semibold mb-3">Uploaded Files:</h3>
                    <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-md text-gray-500 dark:text-gray-400">
                        <p>No files have been uploaded yet.</p>
                    </div>
                 </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
export default function WorkspacePage({ navigate, workspaceId, user, db, appId }) {
    const [activeTab, setActiveTab] = useState('kanban');
    const [workspaceName, setWorkspaceName] = useState('');

    useEffect(() => {
        if (!workspaceId || !db || !appId) return;
        const workspaceRef = doc(db, `artifacts/${appId}/public/data/workspaces/${workspaceId}`);
        const unsubscribe = onSnapshot(workspaceRef, (docSnap) => {
            if (docSnap.exists()) {
                setWorkspaceName(docSnap.data().name);
            } else {
                navigate('dashboard');
            }
        });
        return () => unsubscribe();
    }, [workspaceId, db, appId]);

    const tabs = [
        { id: 'kanban', label: 'Kanban Board' },
        { id: 'editor', label: 'Document' },
        { id: 'chat', label: 'Chat' },
        { id: 'files', label: 'Files' }, 
    ];
    
    const renderActiveComponent = () => {
        switch (activeTab) {
            case 'kanban':
                return <KanbanBoard workspaceId={workspaceId} db={db} appId={appId} />;
            case 'editor':
                return <CollaborativeEditor workspaceId={workspaceId} db={db} appId={appId} />;
            case 'chat':
                return <WorkspaceChat workspaceId={workspaceId} user={user} db={db} appId={appId} />;
            case 'files':
                return <FileManager />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col min-h-screen w-full p-4 md:p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <header className="mb-6 flex-shrink-0">
                <button onClick={() => navigate('dashboard')} className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
                    &larr; Back to Dashboard
                </button>
                <h1 className="text-4xl font-bold capitalize">{workspaceName}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your project tasks, documents, and conversations.</p>
            </header>
            
            <nav className="flex border-b border-gray-200 dark:border-gray-700 mb-6 flex-shrink-0">
                {tabs.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-3 px-5 font-medium text-sm transition-colors duration-200
                            ${activeTab === tab.id 
                                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-white' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <main className="flex-grow flex flex-col">
                {renderActiveComponent()}
            </main>
        </div>
    );
}

