import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTasks } from '../../hooks/useTasks';
import { useSubmissions } from '../../hooks/useSubmissions';
import TaskCard from './TaskCard';
import { useNavigate } from 'react-router-dom';

const TABS = ['All', 'Pending', 'Submitted', 'Approved', 'Rejected'];

export default function TasksScreen() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { submissions, loading: subsLoading } = useSubmissions();
  const [activeTab, setActiveTab] = useState('All');
  const navigate = useNavigate();

  const processedTasks = useMemo(() => {
    return tasks.map(task => {
      const sub = submissions.find(s => s.taskId === task.id);
      return { ...task, status: sub ? sub.status : 'pending', submissionId: sub?.id };
    });
  }, [tasks, submissions]);

  const filteredTasks = useMemo(() => {
    if (activeTab === 'All') return processedTasks;
    return processedTasks.filter(t => t.status === activeTab.toLowerCase());
  }, [processedTasks, activeTab]);

  if (tasksLoading || subsLoading) return <div className="p-4 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pb-24">
      <h1 className="text-2xl font-bold text-white mb-1">Tasks</h1>
      <p className="text-gray-400 text-sm mb-6">Complete tasks to earn money</p>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab ? 'bg-[#E8B84B] text-black' : 'bg-[#1A1A1A] text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredTasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            status={task.status}
            onClick={() => navigate(`/tasks/${task.id}`)}
          />
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-20 text-gray-500">No tasks found</div>
        )}
      </div>
    </div>
  );
}
