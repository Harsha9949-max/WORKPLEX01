const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        try {
            filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
        } catch (err) {
            if (err.code === 'ENOENT') return;
        }
    });
    return filelist;
};

const files = walkSync('src');

files.forEach(file => {
    if (file.includes('node_modules') || file.includes('.git') || !file.match(/\.(tsx|ts|json)$/)) {
        return;
    }

    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    if (file.endsWith('.json')) {
        try {
            let json = JSON.parse(content);
            const recurse = (obj) => {
                for (let key in obj) {
                    if (typeof obj[key] === 'string') {
                        obj[key] = obj[key]
                            .replace(/\bTasks\b/g, 'Missions')
                            .replace(/\btasks\b/g, 'missions')
                            .replace(/\bTask\b/g, 'Mission')
                            .replace(/\btask\b/g, 'mission');
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        recurse(obj[key]);
                    }
                }
            };
            recurse(json);
            fs.writeFileSync(file, JSON.stringify(json, null, 2));
        } catch (e) {
            console.error('Failed to parse JSON', file);
        }
        return;
    }

    // For tsx/ts files, we only want to replace UI-facing text.
    // What is UI-facing? 
    // 1. Text inside JSX: >...<
    // 2. Text inside strings: '...' or "..." or `...`
    
    // We can do simple string replacements for the most common hardcoded text found.
    // Let's do selective regex replace. Replace `Task` with `Mission` only if preceded by a space, quote, or >.
    
    // A trick: replace \bTask\b to Mission only if it's inside quotes or >...<
    // Since doing that with regex in JS is tricky, let's just do global replace but exclude known variable names.
    // Known vars: firstTaskDone, taskList, taskForm, taskItem, selectedTask, fetchTask, addTasks, setTasks
    // These won't be matched by \bTask\b because it's part of a word.
    
    // Wait, what about `task.title`? It matches \btask\b.
    // To avoid breaking code, let's only replace Capitalized versions globally, and lowercase ones selectively.
    content = content.replace(/>task</g, '>mission<');
    content = content.replace(/>tasks</g, '>missions<');
    content = content.replace(/>Task</g, '>Mission<');
    content = content.replace(/>Tasks</g, '>Missions<');
    content = content.replace(/> Tasks/g, '> Missions');
    content = content.replace(/Tasks </g, 'Missions <');
    content = content.replace(/> Task/g, '> Mission');
    content = content.replace(/Task </g, 'Mission <');
    
    // Add specifically text that appears in code
    content = content.replace(/Mystery Task/gi, 'Mystery Mission');
    content = content.replace(/Task Management/g, 'Mission Management');
    
    content = content.replace(/Publish Week's Tasks/gi, "Publish Week's Missions");
    content = content.replace(/New Task/g, 'New Mission');
    content = content.replace(/Task submission/gi, 'Mission submission');
    content = content.replace(/Loading task\.\.\./gi, 'Loading mission...');
    content = content.replace(/Loading tasks\.\.\./gi, 'Loading missions...');
    content = content.replace(/their tasks!/gi, 'their missions!');
    content = content.replace(/complete tasks\./gi, 'complete missions.');
    content = content.replace(/marketing tasks/gi, 'marketing missions');
    content = content.replace(/relevant to the task\./gi, 'relevant to the mission.');
    content = content.replace(/What kind of tasks/gi, 'What kind of missions');
    content = content.replace(/task approval/gi, 'mission approval');
    content = content.replace(/explore and complete tasks/gi, 'explore and complete missions');
    content = content.replace(/Complete your first task/gi, 'Complete your first mission');
    content = content.replace(/No tasks available/gi, 'No missions available');
    content = content.replace(/Task Detail/g, 'Mission Detail');
    content = content.replace(/Tasks Available/gi, 'Missions Available');
    content = content.replace(/task completion/gi, 'mission completion');
    content = content.replace(/\bTask\b/g, (match, offset, string) => {
        // Only replace if preceded by > or space and followed by < or space
        if (string[offset - 1] === '>' || string[offset - 1] === ' ' || string[offset - 1] === "'" || string[offset - 1] === '"') {
            if (string[offset + 4] === '<' || string[offset + 4] === ' ' || string[offset + 4] === "'" || string[offset + 4] === '"') {
                return 'Mission';
            }
        }
        return match;
    });
    content = content.replace(/\bTasks\b/g, (match, offset, string) => {
        if (string[offset - 1] === '>' || string[offset - 1] === ' ' || string[offset - 1] === "'" || string[offset - 1] === '"') {
            if (string[offset + 5] === '<' || string[offset + 5] === ' ' || string[offset + 5] === "'" || string[offset + 5] === '"') {
                return 'Missions';
            }
        }
        return match;
    });
    content = content.replace(/\btask\b/g, (match, offset, string) => {
        if (string[offset - 1] === '>' || string[offset - 1] === ' ') {
            if (string[offset + 4] === '<' || string[offset + 4] === ' ') {
                return 'mission';
            }
        }
        return match;
    });
    content = content.replace(/\btasks\b/g, (match, offset, string) => {
        if (string[offset - 1] === '>' || string[offset - 1] === ' ') {
            if (string[offset + 5] === '<' || string[offset + 5] === ' ') {
                return 'missions';
            }
        }
        return match;
    });
    content = content.replace(/tasks added/g, 'missions added');
    content = content.replace(/tasks done/g, 'missions done');
    content = content.replace(/No tasks/gi, 'No missions');
    content = content.replace(/No Task/gi, 'No Mission');
    content = content.replace(/daily tasks/gi, 'daily missions');
    content = content.replace(/Task Title/gi, 'Mission Title');
    content = content.replace(/Task Amt/gi, 'Mission Amt');
    content = content.replace(/Create Task/gi, 'Create Mission');
    content = content.replace(/Add Task/gi, 'Add Mission');
    content = content.replace(/View Task/gi, 'View Mission');
    content = content.replace(/Start Task/gi, 'Start Mission');
    content = content.replace(/Tasks \(/g, 'Missions \(');
    content = content.replace(/New Viral Task/gi, 'New Viral Mission');
    content = content.replace(/direct tasks/gi, 'direct missions');
    content = content.replace(/first task/gi, 'first mission');
    content = content.replace(/task proof/gi, 'mission proof');
    content = content.replace(/task completion/gi, 'mission completion');
    content = content.replace(/task execution/gi, 'mission execution');
    content = content.replace(/my task/gi, 'my mission');
    content = content.replace(/task status/gi, 'mission status');
    content = content.replace(/task details/gi, 'mission details');
    content = content.replace(/task submitted/gi, 'mission submitted');
    content = content.replace(/Task Completed/gi, 'Mission Completed');
    content = content.replace(/night task/gi, 'night mission');
    content = content.replace(/weekly tasks/gi, 'weekly missions');
    content = content.replace(/pending tasks/gi, 'pending missions');
    content = content.replace(/tasks completed/gi, 'missions completed');
    content = content.replace(/this week's tasks/gi, "this week's missions");
    content = content.replace(/task earning/gi, 'mission earning');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
    }
});

console.log('Task -> Mission replacement done.');
