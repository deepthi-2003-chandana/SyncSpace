import React from 'react';

export default function FileManager() {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-300">File Sharing & Version Control</h2>
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-10 text-center">
        <p className="text-gray-500">Drag & drop files here to upload.</p>
        <p className="text-xs text-gray-600 mt-2">File repository coming soon.</p>
      </div>
    </div>
  );
}