import React, { useState } from 'react';
import { ChevronLeftIcon, PlusIcon } from './icons.jsx';

export const KanbanPage = ({ workspace, onBackToDashboard }) => {
    const [columns, setColumns] = useState({
        'todo': { name: 'To Do', tasks: [{ id: '1', content: 'Design the landing page' }, { id: '2', content: 'Setup project repository' }] },
        'inprogress': { name: 'In Progress', tasks: [{ id: '3', content: 'Develop authentication flow' }] },
        'done': { name: 'Done', tasks: [{ id: '4', content: 'Create project wireframes' }] },
    });
    
    const [draggedTask, setDraggedTask] = useState(null);

    const handleDragStart = (e, task, columnId) => {
        setDraggedTask({ task, fromColumnId: columnId });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };
    
    const handleDrop = (e, toColumnId) => {
        e.preventDefault();
        if (!draggedTask) return;

        const { task, fromColumnId } = draggedTask;
        if (fromColumnId === toColumnId) return;

        const newColumns = { ...columns };
        // Remove task from the source column
        newColumns[fromColumnId].tasks = newColumns[fromColumnId].tasks.filter(t => t.id !== task.id);
        // Add task to the destination column
        newColumns[toColumnId].tasks.push(task);
        
        setColumns(newColumns);
        setDraggedTask(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans w-full flex flex-col">
            <header className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center">
                    <button onClick={onBackToDashboard} className="flex items-center text-gray-300 hover:text-white mr-4"><ChevronLeftIcon /> Back</button>
                    <h1 className="text-2xl font-bold">{workspace.name}</h1>
                </div>
            </header>
            <main className="flex-grow p-8 overflow-x-auto">
                <div className="flex space-x-6">
                    {Object.entries(columns).map(([columnId, column]) => (
                        <div 
                            key={columnId} 
                            className="bg-gray-800 rounded-lg w-80 flex-shrink-0"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, columnId)}
                        >
                            <h2 className="text-lg font-semibold p-4 border-b border-gray-700">{column.name}</h2>
                            <div className="p-4 space-y-4 min-h-[200px]">
                                {column.tasks.map(task => (
                                    <div 
                                        key={task.id} 
                                        className="bg-gray-700 p-4 rounded-md shadow-sm cursor-grab"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task, columnId)}
                                    >
                                        <p>{task.content}</p>
                                    </div>
                                ))}
                            </div>
                             <div className="p-4 mt-auto">
                                <button className="w-full text-left text-gray-400 hover:text-white p-2 rounded-md transition flex items-center"><PlusIcon/> Add task</button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};