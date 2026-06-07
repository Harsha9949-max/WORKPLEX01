import React from 'react';

export default function MissionTracking({ tasks, workers, submissions }: { tasks: any[], workers: any[], submissions: any[] }) {
  // Logic to calculate status
  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-8">
      <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Mission Tracking</h2>
      <div className="grid grid-cols-1 gap-4">
        {tasks.map(task => {
            const taskSubmissions = submissions.filter(s => s.taskId === task.id);
            const workersForTask = workers.filter(w => task.targetRoles.includes(w.role) && w.venture === task.venture);
            return (
                <div key={task.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-[#2A2A2A]">
                    <h3 className="text-sm font-black text-white mb-2">{task.title}</h3>
                    <div className="flex gap-4 text-xs">
                        <span className="text-[#10B981]">Completed: {taskSubmissions.filter(s => s.status === 'approved').length}</span>
                        <span className="text-amber-500">Submitted: {taskSubmissions.filter(s => s.status === 'pending').length}</span>
                        <span className="text-red-500">Not Completed: {workersForTask.length - taskSubmissions.length}</span>
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
}
