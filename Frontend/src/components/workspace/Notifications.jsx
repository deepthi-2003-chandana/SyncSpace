import React from 'react';

export default function Notifications() {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-300">Notifications</h2>
      <div className="space-y-3">
        <div className="bg-gray-700 p-3 rounded-md">
            <p className="text-sm text-gray-300"> <span className="font-bold text-blue-400">@JaneDoe</span> mentioned you in a task: "Finalize presentation".</p>
            <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
        </div>
         <div className="bg-gray-700 p-3 rounded-md">
            <p className="text-sm text-gray-300">A new file <span className="font-bold text-green-400">"Q3_Report.pdf"</span> was uploaded.</p>
            <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
        </div>
      </div>
      <p className="text-center text-gray-500 mt-8">Real-time alerts will be implemented here.</p>
    </div>
  );
}
