import React from 'react';

export default function WorkspaceChat() {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-300">Workspace Chat</h2>
      <div className="h-96 border border-gray-700 rounded-md flex items-center justify-center">
        <p className="text-gray-500">Real-time chat is under construction.</p>
      </div>
       <div className="mt-4 flex gap-2">
        <input type="text" placeholder="Type a message..." disabled className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md cursor-not-allowed" />
        <button disabled className="py-2 px-4 font-semibold text-white bg-blue-800 rounded-md cursor-not-allowed">Send</button>
       </div>
    </div>
  );
}