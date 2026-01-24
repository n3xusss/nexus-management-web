'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, Transition } from '@headlessui/react';
import { create } from 'zustand';
import clsx from 'clsx';
import { useAuth } from '../../lib/stores/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

type TaskStatus = 'todo' | 'inprogress' | 'late' | 'completed';
type Category = string;
type Label = 'Bug' | 'Need Help' | 'Want Fix' | 'Enhancement' | 'Question';

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  category: string;
  project?: string;
  department?: string;
  progress?: number;
  status: TaskStatus;
}

interface Issue {
  id: string;
  title: string;
  label: Label;
  description: string;
  reportedBy: string;
  reportedAgo: string;
  status: 'Open' | 'In Review' | 'New';
  relatedTask?: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  author: string;
  avatarColor: string;
  timeAgo: string;
  message: string;
  attachments?: string[];
}

// Store definition with API integration
const useStore = create<{
  tasks: Task[];
  issues: Issue[];
  selectedTask: Task | null;
  selectedIssue: Issue | null;
  isProgressOpen: boolean;
  isReportOpen: boolean;
  isIssueDetailsOpen: boolean;
  activeFilter: Category;
  token: string | null;

  setToken: (token: string | null) => void;
  setTasks: (tasks: Task[]) => void;
  setIssues: (issues: Issue[]) => void;
  setSelectedTask: (task: Task | null) => void;
  setSelectedIssue: (issue: Issue | null) => void;
  openProgress: (task: Task) => void;
  closeProgress: () => void;
  openReport: () => void;
  closeReport: () => void;
  openIssueDetails: (issue: Issue) => void;
  closeIssueDetails: () => void;
  setActiveFilter: (filter: Category) => void;

  // API Actions
  fetchData: () => Promise<void>;
  updateTaskProgress: (id: string, progress: number) => Promise<void>;
  moveTask: (id: string, status: TaskStatus) => Promise<void>;
  startTaskProgress: (id: string) => Promise<void>;
  addIssue: (issue: Omit<Issue, 'id' | 'comments' | 'reportedBy' | 'reportedAgo' | 'status'>) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
  fetchComments: (issueId: string) => Promise<void>;
  addComment: (issueId: string, text: string) => Promise<void>;
}>((set, get) => ({
  tasks: [],
  issues: [],
  selectedTask: null,
  selectedIssue: null,
  isProgressOpen: false,
  isReportOpen: false,
  isIssueDetailsOpen: false,
  activeFilter: 'All',
  token: null,

  setToken: (token) => set({ token }),
  setTasks: (tasks) => set({ tasks }),
  setIssues: (issues) => set({ issues }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setSelectedIssue: (issue) => set({ selectedIssue: issue }),

  openProgress: (task) => set({ selectedTask: task, isProgressOpen: true }),
  closeProgress: () => set({ isProgressOpen: false, selectedTask: null }),

  openReport: () => set({ isReportOpen: true }),
  closeReport: () => set({ isReportOpen: false }),

  openIssueDetails: (issue) => {
    set({ selectedIssue: issue, isIssueDetailsOpen: true });
    get().fetchComments(issue.id);
  },
  closeIssueDetails: () => set({ isIssueDetailsOpen: false, selectedIssue: null }),

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  fetchData: async () => {
    const { token } = get();
    if (!token) return;

    try {
      // Fetch Tasks
      const tasksRes = await fetch(`${API_BASE}/tasks/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const results = Array.isArray(tasksData) ? tasksData : (tasksData.results || []);
        if (results.length > 0) console.log("Backend Task Payload:", results[0]);
        // Map backend tasks to frontend format
        const mappedTasks = results.map((t: any) => {
          const progress = t.progress || 0;
          const dueDate = t.due_date ? new Date(t.due_date) : null;
          const isLate = dueDate && dueDate < new Date() && progress < 100;

          let status: TaskStatus = 'todo';
          if (progress >= 100) status = 'completed';
          else if (isLate) status = 'late';
          else if (progress > 0) status = 'inprogress';

          return {
            id: t.id.toString(),
            title: t.title || t.task_name || 'Untitled Task',
            description: t.description || t.task_description || '',
            dueDate: dueDate ? dueDate.toLocaleDateString() : undefined,
            category: t.project?.project_name || t.category || 'General',
            project: t.project?.project_name,
            progress: progress,
            status: status
          };
        });
        set({ tasks: mappedTasks });
      }

      // Fetch Issues
      const issuesRes = await fetch(`${API_BASE}/issues/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        const results = Array.isArray(issuesData) ? issuesData : (issuesData.results || []);
        const mappedIssues = results.map((i: any) => ({
          id: i.id.toString(),
          title: i.title || i.issue_title || 'Untitled Issue',
          label: i.label || i.issue_type || 'Bug',
          description: i.description || i.issue_description || '',
          reportedBy: i.reported_by?.username || 'Unknown',
          reportedAgo: i.created_at ? new Date(i.created_at).toLocaleDateString() : 'Recently',
          status: i.status || 'Open',
          relatedTask: i.related_task?.title || '',
          comments: []
        }));
        set({ issues: mappedIssues });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  },

  updateTaskProgress: async (id, progress) => {
    const { token, tasks } = get();
    // Optimistic update
    set({
      tasks: tasks.map(t => t.id === id ? { ...t, progress, status: progress >= 100 ? 'completed' : t.status } : t)
    });

    if (token) {
      try {
        const response = await fetch(`${API_BASE}/tasks/${id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ progress })
        });

        if (!response.ok) {
          const errMsg = await response.text();
          console.error("Task update failed:", response.status, errMsg);
          if (response.status === 403) {
            alert("Permission denied: You cannot update progress for this task (only Managers who created it or Moderators can).");
          } else {
            alert(`Failed to save progress: ${response.status}`);
          }
        }
      } catch (error) {
        console.error("Failed to update task progress:", error);
        alert("Network error: Could not connect to backend.");
      }
    }
  },

  moveTask: async (id, status) => {
    const { token, tasks } = get();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Optimistic update
    let newProgress = task.progress;
    if (status === 'todo') newProgress = 0;
    else if (status === 'inprogress' && task.progress === 0) newProgress = 10;

    set({
      tasks: tasks.map(t => t.id === id ? { ...t, status, progress: newProgress } : t)
    });

    if (token) {
      try {
        await fetch(`${API_BASE}/tasks/${id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ progress: newProgress })
        });
      } catch (error) {
        console.error("Failed to move task:", error);
      }
    }
  },

  startTaskProgress: async (id) => {
    const { token, tasks } = get();
    set({
      tasks: tasks.map(t => t.id === id ? { ...t, status: 'inprogress', progress: 0 } : t)
    });

    if (token) {
      try {
        await fetch(`${API_BASE}/tasks/${id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ progress: 10 })
        });
      } catch (error) {
        console.error("Failed to start task:", error);
      }
    }
  },

  addIssue: async (newIssue) => {
    const { token, issues, tasks } = get();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/issues/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          issue_title: newIssue.title,
          issue_description: newIssue.description,
          task: parseInt(newIssue.relatedTask)
        })
      });

      if (response.ok) {
        const savedIssue = await response.json();
        const taskTitle = tasks.find(t => t.id === newIssue.relatedTask)?.title || '';

        set({
          issues: [{
            id: savedIssue.id.toString(),
            title: newIssue.title,
            label: newIssue.label,
            description: newIssue.description,
            reportedBy: 'You',
            reportedAgo: 'Just now',
            status: 'New',
            relatedTask: taskTitle,
            comments: []
          }, ...issues],
          isReportOpen: false
        });
      } else {
        const errorData = await response.text();
        console.error('Issue API Error:', response.status, errorData);

        if (response.status === 403) {
          alert("Permission denied: You do not have permission to perform this action.");
          return;
        }

        throw new Error(`Failed to create issue: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error("Failed to add issue:", error);
      alert("Failed to report issue");
    }
  },

  fetchComments: async (issueId) => {
    const { token, selectedIssue } = get();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/issue-comments/?issue_id=${issueId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.results || []);
        const mapped = results.map((c: any) => ({
          id: c.id.toString(),
          author: c.user?.username || 'Unknown',
          avatarColor: 'bg-teal-500',
          timeAgo: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Just now',
          message: c.comment_text || ''
        }));

        if (selectedIssue && selectedIssue.id === issueId) {
          set({
            selectedIssue: { ...selectedIssue, comments: mapped }
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  },

  addComment: async (issueId, text) => {
    const { token, selectedIssue } = get();
    if (!token || !text.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/issue-comments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          issue: parseInt(issueId),
          comment_text: text
        })
      });

      if (res.ok) {
        const saved = await res.json();
        if (selectedIssue && selectedIssue.id === issueId) {
          const newComment = {
            id: saved.id.toString(),
            author: 'You',
            avatarColor: 'bg-orange-500',
            timeAgo: 'Just now',
            message: text
          };
          set({
            selectedIssue: {
              ...selectedIssue,
              comments: [...selectedIssue.comments, newComment]
            }
          });
        }
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  },

  deleteIssue: async (id) => {
    const { token, issues } = get();
    // Optimistic delete
    set({
      issues: issues.filter(i => i.id !== id),
      isIssueDetailsOpen: false,
      selectedIssue: null
    });

    if (token) {
      try {
        await fetch(`${API_BASE}/issues/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error("Failed to delete issue:", error);
      }
    }
  },
}));

function SortableTaskCard({ task }: { task: Task }) {
  const { openProgress, startTaskProgress, updateTaskProgress } = useStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((task.status === 'inprogress' || task.status === 'late') && task.progress !== undefined) {
      openProgress(task);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'group bg-[#111111] border border-white/5 rounded-2xl p-5 cursor-grab active:cursor-grabbing transition-all duration-200 shadow-lg',
        task.status === 'todo' && 'hover:border-green-500/30',
        task.status === 'inprogress' && 'hover:border-orange-500/30',
        task.status === 'late' && 'hover:border-red-500/30',
        isDragging && 'opacity-50 scale-105 shadow-2xl'
      )}
      onClick={handleCardClick}
    >
      <div className="flex flex-col gap-4">
        {/* Top Info: Category & Project */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className={clsx(
              "text-[10px] font-bold uppercase tracking-wider",
              task.status === 'todo' ? 'text-green-500' :
                task.status === 'inprogress' ? 'text-orange-500' : 'text-red-500'
            )}>
              {task.category}
            </span>
            {task.project && (
              <span className="text-[10px] text-gray-500 font-medium">
                {task.project}
              </span>
            )}
          </div>
          {task.status === 'late' && (
            <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded uppercase tracking-tighter">
              Late
            </span>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-white font-bold text-base mb-1 group-hover:text-white transition-colors">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Action / Deadline Row */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {task.dueDate || 'No Deadline'}
            </span>
          </div>

          {task.status === 'todo' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startTaskProgress(task.id);
              }}
              className="px-4 py-1.5 bg-white text-black hover:bg-green-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
            >
              Start
            </button>
          ) : (
            <div className="flex flex-col items-end gap-1 min-w-[80px]">
              <span className={clsx(
                "text-[9px] font-bold uppercase tracking-widest",
                task.status === 'late' ? 'text-red-500' : 'text-gray-500'
              )}>{task.progress}%</span>
              <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-500",
                    task.status === 'late' ? 'bg-red-500' : 'bg-orange-500'
                  )}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default function TasksPage() {
  const { token, user } = useAuth();
  const store = useStore();
  const {
    tasks,
    issues,
    selectedTask,
    selectedIssue,
    isProgressOpen,
    isReportOpen,
    isIssueDetailsOpen,
    activeFilter,
    closeProgress,
    closeReport,
    closeIssueDetails,
    updateTaskProgress,
    openReport,
    openIssueDetails,
    setActiveFilter,
    addIssue,
    deleteIssue,
    setToken,
    fetchData
  } = store;

  // Sync auth token and fetch data
  useEffect(() => {
    if (token) {
      setToken(token);
      fetchData();
    }
  }, [token, setToken, fetchData]);

  const [newIssueForm, setNewIssueForm] = useState({
    title: '',
    label: 'Bug' as Label,
    description: '',
    relatedTask: '',
  });

  const [newCommentText, setNewCommentText] = useState('');
  const [localProgress, setLocalProgress] = useState(0);

  useEffect(() => {
    if (selectedTask) {
      setLocalProgress(selectedTask.progress || 0);
    }
  }, [selectedTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !active.id) return;

    const activeId = active.id as string;
    const overId = over.id as TaskStatus;

    if (overId === 'completed') return;

    store.moveTask(activeId, overId);
  };

  const allCategories = useMemo(() => {
    const dept = user?.department?.name?.toLowerCase() || '';
    if (dept.includes('design')) return ['All', 'UI/UX', 'Motion', 'Graphic'];
    if (dept.includes('dev')) return ['All', 'Web', 'Mobile', 'Backend'];

    // Default: use "All" plus any project names found in tasks
    const projectCategories = Array.from(new Set(tasks.map((t) => t.project).filter(Boolean))) as string[];
    return ['All', ...projectCategories];
  }, [user?.department?.name, tasks]);

  const filteredTasks = tasks
    .filter((t) => t.status !== 'completed')
    .filter((t) => activeFilter === 'All' || t.category === activeFilter || t.project === activeFilter);

  const columns = {
    todo: filteredTasks.filter((t) => t.status === 'todo'),
    inprogress: filteredTasks.filter((t) => t.status === 'inprogress'),
    late: filteredTasks.filter((t) => t.status === 'late'),
  };

  const getLabelColor = (label: Label) => {
    const colors: Record<Label, string> = {
      'Bug': 'bg-red-600',
      'Need Help': 'bg-blue-600',
      'Want Fix': 'bg-orange-600',
      'Enhancement': 'bg-emerald-600',
      'Question': 'bg-purple-600',
    };
    return colors[label] || 'bg-gray-600';
  };

  const handleSubmitIssue = () => {
    if (!newIssueForm.title || !newIssueForm.description || !newIssueForm.relatedTask) {
      alert("Please fill in all required fields and select a related task.");
      return;
    }

    addIssue({
      title: newIssueForm.title,
      label: newIssueForm.label,
      description: newIssueForm.description,
      relatedTask: newIssueForm.relatedTask,
    });

    setNewIssueForm({ title: '', label: 'Bug', description: '', relatedTask: '' });
  };

  return (
    <>
      <div className="">
        {/* Header */}
        <header className="mb-10 relative">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Tasks
            </h1>
            <div className="flex items-center gap-3">
              {user?.department && (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#00d084]/10 border border-[#00d084]/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-[#00d084] rounded-full animate-pulse" />
                  <span className="text-[10px] uppercase font-bold text-[#00d084] tracking-widest">{user.department.name}</span>
                </div>
              )}
              <div className="w-6 h-6 bg-red-500/20 rounded-full border border-red-500/50 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">
            Manage your assigned tasks and report issues for {user?.department?.name || 'your department'}
          </p>
        </header>

        <div className="flex gap-8">
          {/* Main Task Board */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                Assigned Tasks
              </h2>
              <button
                onClick={() => fetchData()}
                className="group flex items-center gap-2.5 px-5 py-2.5 bg-[#1a1a1a]/40 backdrop-blur-md border border-white/5 rounded-2xl text-gray-400 hover:text-white hover:border-orange-500/30 hover:bg-orange-500/5 transition-all duration-300 shadow-lg"
              >
                <div className="w-5 h-5 flex items-center justify-center bg-white/5 rounded-lg group-hover:bg-orange-500/20 group-hover:text-orange-500 transition-colors">
                  <svg className="w-3.5 h-3.5 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Sync Board</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-3 mb-8">
              {allCategories.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={clsx(
                    'px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 shadow-lg',
                    activeFilter === filter
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/25 scale-105'
                      : 'bg-[#1a1a1a]/50 text-gray-400 border border-gray-700 hover:bg-gray-800 hover:border-gray-600 hover:scale-105 hover:shadow-md'
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Task Board */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-3 gap-2">
                {(['todo', 'inprogress', 'late'] as const).map((column) => (
                  <div key={column} className="bg-[#0d0d0d]/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/[0.03] shadow-2xl transition-all h-fit">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={clsx(
                        "text-sm font-bold uppercase tracking-wider",
                        column === 'todo' ? 'text-green-500' :
                          column === 'inprogress' ? 'text-orange-500' : 'text-red-500'
                      )}>
                        {column === 'todo' ? 'To Do' :
                          column === 'inprogress' ? 'In Progress' : 'Late'}
                      </h3>
                      <span className={clsx(
                        'text-[10px] font-bold px-3 py-1 rounded-full border',
                        column === 'todo' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          column === 'inprogress' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                      )}>
                        {columns[column].length}
                      </span>
                    </div>

                    <SortableContext
                      items={columns[column].map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div
                        className="space-y-4 min-h-[400px] drop-zone"
                        id={column}
                      >
                        {columns[column].length === 0 ? (
                          <div className="text-center py-12 text-gray-500 text-sm">
                            {column === 'todo' ? 'No tasks here' :
                              column === 'inprogress' ? 'No tasks in progress' :
                                'No late tasks'}
                          </div>
                        ) : (
                          columns[column].map((task) => (
                            <SortableTaskCard key={task.id} task={task} />
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </div>
                ))}
              </div>
            </DndContext>
          </div>

          {/* Team Reported Issues Sidebar */}
          <div className="w-96 bg-[#0d0d0d]/80 backdrop-blur-xl rounded-2xl p-6 border border-[#222222]/50 shadow-2xl">
            <h3 className="text-xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              Team Reported Issues
            </h3>

            <div className="space-y-4 mb-8">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => openIssueDetails(issue)}
                  className="group bg-[#111111]/80 border border-[#222222]/50 rounded-xl p-5 cursor-pointer hover:border-orange-500/50 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-orange-400">
                      {issue.title}
                    </h4>
                    <span className={clsx(
                      'text-xs font-bold px-3 py-1 rounded-full text-white shadow-lg',
                      getLabelColor(issue.label)
                    )}>
                      {issue.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-2">Reported {issue.reportedAgo}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {issue.description}
                  </p>

                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    Status: <span className="font-medium capitalize">{issue.status}</span>
                  </p>
                </div>
              ))}
              {issues.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">No issues reported</p>
              )}
            </div>

            <button
              onClick={openReport}
              className="w-full border-2 border-dashed border-gray-600 rounded-xl py-5 text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-900/50 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <span className="text-2xl">+</span>
              Report New Issue
            </button>
          </div>
        </div>
      </div>

      {/* Update Progress Modal */}
      <Transition show={isProgressOpen} as={React.Fragment}>
        <Dialog onClose={closeProgress} className="relative z-50">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="bg-[#0a0a0a] rounded-3xl p-8 w-full max-w-sm border border-[#1a1a1a] shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <Dialog.Title className="text-2xl font-bold text-white">
                    Update Progress
                  </Dialog.Title>
                  <button
                    onClick={closeProgress}
                    className="text-gray-400 hover:text-white text-2xl font-bold p-2 hover:bg-gray-900/50 rounded-xl transition-all"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Task:</p>
                    <p className="text-lg font-semibold text-white">{selectedTask?.title}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-sm text-gray-400">Progress Completion</span>
                      <span className="text-2xl font-bold text-teal-400">
                        {localProgress}%
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={localProgress}
                        onChange={(e) => setLocalProgress(Number(e.target.value))}
                        className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${localProgress}%, #374151 ${localProgress}%, #374151 100%)`,
                        }}
                      />
                      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-5 pointer-events-none">
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-teal-500 rounded-full shadow-lg border-4 border-black"
                          style={{ left: `${localProgress}%`, transform: `translateX(-50%) translateY(-50%)` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-12 pt-8 border-t border-gray-800">
                  <button
                    onClick={closeProgress}
                    className="flex-1 px-6 py-4 bg-gray-900/50 text-gray-400 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 font-medium transition-all shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (selectedTask) {
                        updateTaskProgress(selectedTask.id, localProgress);
                        closeProgress();
                      }
                    }}
                    className="flex-1 group relative flex items-center justify-center gap-3 px-8 py-5 bg-green-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[22px] hover:bg-green-600 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.4)] hover:shadow-[0_15px_40px_-10px_rgba(249,115,22,0.6)] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span>save progress</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 border-l border-white/20 pl-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Report New Issue Modal */}
      <Transition show={isReportOpen} as={React.Fragment}>
        <Dialog onClose={closeReport} className="relative z-50">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-[#0a0a0a] rounded-3xl p-8 max-w-lg w-full border border-[#1a1a1a] shadow-2xl max-h-[90vh] overflow-y-auto">
                <Dialog.Title className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
                  Report New Issue
                  <span className="text-red-400 text-sm font-medium">*</span>
                </Dialog.Title>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-red-400 font-medium mb-3">
                      Issue Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newIssueForm.title}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                      placeholder="Login Button Not Working"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 font-medium mb-3">Label <span className="text-red-400">*</span></label>
                    <div className="flex flex-wrap gap-3">
                      {(['Bug', 'Need Help', 'Want Fix', 'Enhancement', 'Question'] as Label[]).map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setNewIssueForm({ ...newIssueForm, label })}
                          className={clsx(
                            'px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg',
                            newIssueForm.label === label
                              ? getLabelColor(label) + ' text-white shadow-lg shadow-red-500/25 scale-105'
                              : 'bg-[#1a1a1a]/50 text-gray-400 border-2 border-gray-700 hover:border-gray-600 hover:bg-gray-800 hover:scale-105'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-red-400 font-medium mb-3">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={newIssueForm.description}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, description: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl px-5 py-4 text-white placeholder-gray-500 resize-vertical focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                      placeholder="Describe the issue..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 font-medium mb-3">Related Task <span className="text-red-400">*</span></label>
                    <select
                      value={newIssueForm.relatedTask}
                      onChange={(e) => setNewIssueForm({ ...newIssueForm, relatedTask: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl px-5 py-4 text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none"
                    >
                      <option value="">Select a task...</option>
                      {tasks.map(task => (
                        <option key={task.id} value={task.id} className="bg-[#0a0a0a]">
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-12 pt-8 border-t border-gray-800">
                  <button
                    onClick={closeReport}
                    className="flex-1 px-8 py-4 bg-gray-900/50 text-gray-400 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-gray-600 font-semibold transition-all shadow-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitIssue}
                    disabled={!newIssueForm.title.trim() || !newIssueForm.description.trim()}
                    className="flex-1 px-8 py-4 bg-teal-500 text-black font-bold rounded-xl hover:bg-teal-400 shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Submit Issue
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Issue Details Modal */}
      <Transition show={isIssueDetailsOpen} as={React.Fragment}>
        <Dialog onClose={closeIssueDetails} className="relative z-50">
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-[#0a0a0a] rounded-3xl p-8 max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-[#1a1a1a] shadow-2xl">
                {selectedIssue && (
                  <>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <span className={clsx(
                            'px-6 py-2 rounded-2xl text-sm font-bold text-white shadow-xl',
                            getLabelColor(selectedIssue.label)
                          )}>
                            {selectedIssue.label}
                          </span>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full" />
                              Reported by {selectedIssue.reportedBy}
                            </div>
                            <span>•</span>
                            <span>{selectedIssue.reportedAgo}</span>
                          </div>
                        </div>
                        <Dialog.Title className="text-3xl font-bold text-white mb-2">
                          {selectedIssue.title}
                        </Dialog.Title>
                      </div>
                      <button
                        onClick={closeIssueDetails}
                        className="text-gray-400 hover:text-white text-3xl font-bold p-3 hover:bg-gray-900/50 rounded-2xl transition-all"
                      >
                        ×
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-8 mb-12">
                      <div className="col-span-2">
                        <h4 className="text-xl font-bold mb-4 text-white">Description</h4>
                        <p className="text-gray-300 text-lg leading-relaxed bg-[#1a1a1a]/50 p-6 rounded-2xl border border-[#333333]">
                          {selectedIssue.description}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-4 text-white">Status</h4>
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-[#333333]">
                          <span className="text-2xl font-bold capitalize text-teal-400 block">
                            {selectedIssue.status}
                          </span>
                          {selectedIssue.relatedTask && (
                            <p className="text-sm text-gray-400 mt-2">Related: {selectedIssue.relatedTask}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
                        Collaboration & Help
                        <span className="text-sm text-gray-500 font-normal">({selectedIssue.comments.length})</span>
                      </h4>

                      <div className="space-y-6 mb-8">
                        {selectedIssue.comments.length > 0 ? (
                          selectedIssue.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-4 p-6 bg-[#1a1a1a]/50 rounded-2xl border border-[#333333]/50 hover:border-gray-600 transition-all">
                              <div className={clsx('w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center', comment.avatarColor)}>
                                <span className="font-semibold text-white text-sm">
                                  {comment.author[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-semibold text-white text-sm truncate">{comment.author}</span>
                                  <span className="text-xs text-gray-500">{comment.timeAgo}</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed mb-4">{comment.message}</p>
                                {comment.attachments?.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {comment.attachments.map((file, i) => (
                                      <div key={i} className="bg-gray-800/50 px-3 py-2 rounded-xl text-xs text-gray-300 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all flex items-center gap-2">
                                        📎 {file}
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-4">No comments yet.</p>
                        )}
                      </div>

                      <div className="flex items-end gap-3 p-6 bg-[#1a1a1a]/50 rounded-3xl border-2 border-dashed border-gray-700">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newCommentText.trim()) {
                              store.addComment(selectedIssue.id, newCommentText);
                              setNewCommentText('');
                            }
                          }}
                          placeholder="Type your message or offer help..."
                          className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-lg p-0"
                        />
                        <div className="flex items-center gap-2 text-sm">
                          <button
                            onClick={() => {
                              if (newCommentText.trim()) {
                                store.addComment(selectedIssue.id, newCommentText);
                                setNewCommentText('');
                              }
                            }}
                            className="bg-teal-500 text-black px-8 py-4 rounded-2xl font-bold hover:bg-teal-400 shadow-lg hover:shadow-teal-500/25 transition-all whitespace-nowrap"
                          >
                            Send Message
                          </button>
                          <button
                            onClick={() => deleteIssue(selectedIssue.id)}
                            className="bg-red-600/90 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-600 shadow-lg hover:shadow-red-500/25 transition-all whitespace-nowrap border border-red-600/50"
                          >
                            Delete Issue
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          background: #10b981;
          border-radius: 50%;
          cursor: pointer;
          border: 4px solid #000;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          transition: all 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.6);
        }
        input[type="range"]::-moz-range-thumb {
          width: 28px;
          height: 28px;
          background: #10b981;
          border-radius: 50%;
          cursor: pointer;
          border: 4px solid #000;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .drop-zone {
          min-height: 400px;
        }
        @media (max-width: 1536px) {
          .grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </>
  );
}