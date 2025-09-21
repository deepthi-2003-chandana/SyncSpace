import React, { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export default function CollaborativeEditor({ workspaceId, db, appId }) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Ready'); // Tracks the saving status

  // Effect for setting up the real-time listener from Firestore
  useEffect(() => {
    if (!workspaceId || !db || !appId) return;

    setStatus('Connecting...');
    const docRef = doc(db, /artifacts/${appId}/public/data/workspaces/${workspaceId}/documents/main_doc);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteContent = docSnap.data().content;
        // Update local content only if it's different, preventing cursor jumps
        if (remoteContent !== content) {
          setContent(remoteContent);
        }
      } else {
        // If the document doesn't exist, you can create an initial one
        setDoc(docRef, { content: '' });
      }
      setStatus('Ready');
    }, (error) => {
      console.error("Error listening to document:", error);
      setStatus('Error');
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [workspaceId, db, appId]); // Re-run only if these props change

  // Effect for debouncing user input and saving to Firestore
  useEffect(() => {
    // Don't save if the content hasn't changed or is still being fetched
    if (status !== 'Typing...') return;

    const handler = setTimeout(() => {
      setStatus('Saving...');
      const docRef = doc(db, /artifacts/${appId}/public/data/workspaces/${workspaceId}/documents/main_doc);
      
      setDoc(docRef, { content }, { merge: true })
        .then(() => {
          setStatus('Saved');
          // Revert to 'Ready' after a moment to give user feedback
          setTimeout(() => setStatus('Ready'), 2000);
        })
        .catch(error => {
          console.error("Error saving document:", error);
          setStatus('Error');
        });
    }, 1000); // Wait 1 second after the user stops typing

    return () => {
      clearTimeout(handler);
    };
  }, [content]); // This effect runs whenever the 'content' changes

  const handleChange = (e) => {
    setContent(e.target.value);
    setStatus('Typing...');
  };
  
  // A small component to show the current status
  const StatusIndicator = () => {
    let indicatorColor = 'text-gray-400';
    let indicatorText = 'Ready';
    
    switch (status) {
        case 'Typing...':
            indicatorText = 'Typing...';
            indicatorColor = 'text-blue-400';
            break;
        case 'Saving...':
            indicatorText = 'Saving...';
            indicatorColor = 'text-yellow-400';
            break;
        case 'Saved':
            indicatorText = 'All changes saved.';
            indicatorColor = 'text-green-400';
            break;
        case 'Error':
            indicatorText = 'Connection error.';
            indicatorColor = 'text-red-500';
            break;
        default:
            indicatorText = 'Ready';
            indicatorColor = 'text-gray-400';
    }
    
    return <p className={transition-colors duration-300 ${indicatorColor}}>{indicatorText}</p>;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Collaborative Document</h2>
      <div className="bg-white text-gray-800 rounded-md p-4 h-96 overflow-y-auto">
        <textarea 
          className="w-full h-full border-none outline-none resize-none"
          placeholder="Start typing your document here..."
          value={content}
          onChange={handleChange}
        >
        </textarea>
      </div>
      <div className="mt-4 text-sm">
        <StatusIndicator />
      </div>
    </div>
  );
}