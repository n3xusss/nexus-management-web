"use client";

import { useState, useEffect } from "react";
import { Plus, X, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../../lib/stores/authStore";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type TaskStatus = "To Do" | "In Progress" | "Late" | "Overdue";

type Task = {
  id: string;
  name: string;
  project: string; // Name for display
  projectId?: number; // ID for editing
  due: string;
  progress?: number;
  status: TaskStatus;
  description?: string;
  started?: string;
  created?: string;
  lastUpdated?: string;
};

type Project = {
  id: number;
  name: string;
  category: string;
  progress: number;
  done: number;
  total: number;
  due: string;
  description?: string;
  departments?: any[];
};

type Member = {
  id: number;
  username: string;
  email: string;
};

export default function Dashboard() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskStatus | "All">("All");
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newProjectId, setNewProjectId] = useState<string>("");
  const [newMemberIds, setNewMemberIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Project Create Modal (Admin)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [assignedDeptIds, setAssignedDeptIds] = useState<string[]>([]);
  const [allDepts, setAllDepts] = useState<any[]>([]);
  const [creatingProject, setCreatingProject] = useState(false);

  // Project Edit Modal (Admin)
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjName, setEditProjName] = useState("");
  const [editProjDesc, setEditProjDesc] = useState("");
  const [editAssignedDeptIds, setEditAssignedDeptIds] = useState<string[]>([]);
  const [savingProject, setSavingProject] = useState(false);

  // Detail modal
  const [showDetail, setShowDetail] = useState<Task | null>(null);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editName, setEditName] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editProjectId, setEditProjectId] = useState<string>("");
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Helper for requests
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) return null;

    // endpoint should be like '/projects/' (leading slash necessary)
    // API_BASE likely ends with /api (from check earlier).
    // We want to avoid double slash if API_BASE handles it?
    // .env was http://localhost:8000/api
    // So url = http://localhost:8000/api/projects/

    const url = `${API_BASE}${endpoint}`;

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const text = await res.text();

      if (!res.ok) {
        // Try to parse error message from backend
        let errorMessage = `API Error: ${res.status}`;
        try {
          const errorData = JSON.parse(text);
          // Django REST framework error format
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.non_field_errors) {
            errorMessage = errorData.non_field_errors.join(", ");
          } else if (typeof errorData === "object") {
            // Field-specific errors
            errorMessage = Object.entries(errorData)
              .map(
                ([field, errors]) =>
                  `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`,
              )
              .join("; ");
          }
        } catch (e) {
          // If not JSON, use text directly if short enough
          if (text && text.length < 200) {
            errorMessage = text;
          }
        }

        if (res.status === 403) {
          throw new Error(errorMessage);
        }

        throw new Error(errorMessage);
      }

      try {
        return text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    } catch (e) {
      throw e;
    }
  };

  const fetchProjectsAndTasks = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Projects
      let projData: any = [];
      try {
        const res = await apiRequest("/projects/");
        projData = res || [];
      } catch (e) {}

      // Tasks
      let taskData: any = [];
      try {
        const res = await apiRequest("/tasks/");
        taskData = res || [];
      } catch (e) {}

      // Members - Extract from available data
      let memberData: Member[] = [];

      // Try fetching from /members/ (works for Admins)
      try {
        const memRes = await apiRequest("/members/");
        if (Array.isArray(memRes)) memberData = memRes;
        else if (memRes && Array.isArray(memRes.results))
          memberData = memRes.results;
      } catch (e) {
        // 403 for Managers - build member list from current user
        // Backend validates actual permissions on task creation
        if (user?.id) {
          memberData = [
            {
              id: parseInt(user.id),
              username: user.name || user.username || "You",
              email: user.email || "",
            },
          ];
        }
      }
      setMembers(memberData);

      // Map Projects
      const mappedProjects: Project[] = (
        Array.isArray(projData) ? projData : projData.results || []
      ).map((p: any) => {
        const pTasks = p.tasks || [];
        const total = pTasks.length;
        const done = pTasks.filter((t: any) => t.progress === 100).length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        return {
          id: p.id,
          name: p.project_name,
          category: "General",
          progress,
          done,
          total,
          due: "Ongoing",
          description: p.project_description,
          departments: p.departments || [],
        };
      });
      setProjects(mappedProjects);

      // Map Tasks
      const mappedTasks: Task[] = (
        Array.isArray(taskData) ? taskData : taskData.results || []
      ).map((t: any) => {
        let status: TaskStatus = "To Do";
        const dueDate = new Date(t.due_date);
        const now = new Date();
        if (t.progress === 100) status = "In Progress";
        else if (t.progress > 0) status = "In Progress";
        if (dueDate < now && t.progress < 100) status = "Overdue";

        return {
          id: t.id.toString(),
          name: t.task_name,
          project: t.project ? t.project.project_name : "Unassigned",
          projectId: t.project ? t.project.id : undefined,
          due: new Date(t.due_date).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          progress: t.progress,
          status,
          description: t.task_description,
          started: new Date(t.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          created: new Date(t.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          lastUpdated: new Date(t.updated_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        };
      });
      setTasks(mappedTasks);

      // Fetch Departments if Admin
      if (user?.role === "admin" || user?.backendRole === "mod") {
        try {
          const deptRes = await apiRequest("/departments/");
          const depts = Array.isArray(deptRes)
            ? deptRes
            : deptRes.results || [];
          setAllDepts(depts);
        } catch (e) {}
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndTasks();
  }, [token]);

  // Reset new task form when modal opens
  useEffect(() => {
    if (showCreateModal) {
      setNewName("");
      setNewDesc("");
      setNewDue("");
      setNewProjectId("");
      // Default to assigning self if possible
      if (user && user.id) {
        setNewMemberIds([user.id.toString()]);
      } else {
        setNewMemberIds([]);
      }
    }
  }, [showCreateModal, user]);

  const filteredTasks =
    activeFilter === "All"
      ? tasks
      : tasks.filter((t) => t.status === activeFilter);

  const createTask = async () => {
    if (!newName.trim()) {
      alert("Task name is required");
      return;
    }
    if (!newMemberIds.length) {
      alert("At least one contributor is required");
      return;
    }
    if (!newDue) {
      alert("Deadline is required");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        task_name: newName,
        task_description: newDesc,
        due_date: newDue, // YYYY-MM-DD
        project_id: newProjectId ? parseInt(newProjectId) : null,
        member_ids: newMemberIds.map((id) => parseInt(id)),
        progress: 0,
      };

      await apiRequest("/tasks/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowCreateModal(false);
      fetchProjectsAndTasks();
    } catch (e) {
      alert(
        `Failed to create task: ${e instanceof Error ? e.message : "Unknown error"}.`,
      );
    } finally {
      setCreating(false);
    }
  };

  const createProject = async () => {
    if (!newProjName.trim()) {
      alert("Project name is required");
      return;
    }
    setCreatingProject(true);
    try {
      const payload = {
        project_name: newProjName,
        project_description: newProjDesc,
        department_ids: assignedDeptIds.map((id) => parseInt(id)),
      };
      await apiRequest("/projects/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setShowCreateProjectModal(false);
      setNewProjName("");
      setNewProjDesc("");
      setAssignedDeptIds([]);
      fetchProjectsAndTasks();
    } catch (e) {
      alert("Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setEditProjName(project.name);
    setEditProjDesc(project.description || "");
    setEditAssignedDeptIds(
      project.departments?.map((d: any) => d.id.toString()) || [],
    );
    setShowEditProjectModal(true);
  };

  const saveEditProject = async () => {
    if (!editingProject) return;
    if (!editProjName.trim()) {
      alert("Project name is required");
      return;
    }
    setSavingProject(true);
    try {
      const payload = {
        project_name: editProjName,
        project_description: editProjDesc,
        department_ids: editAssignedDeptIds.map((id) => parseInt(id)),
      };
      await apiRequest(`/projects/${editingProject.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setShowEditProjectModal(false);
      setEditingProject(null);
      fetchProjectsAndTasks();
    } catch (e) {
      alert("Failed to update project");
    } finally {
      setSavingProject(false);
    }
  };

  const deleteProject = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this project? All related tasks will be affected.",
      )
    )
      return;
    try {
      await apiRequest(`/projects/${id}/`, { method: "DELETE" });
      fetchProjectsAndTasks();
    } catch (e) {
      alert("Failed to delete project");
    }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setEditName(task.name);
    // Convert formatted date back to YYYY-MM-DD if possible, but formatted is locale string
    // This is tricky. Ideally we store ISO or parse it.
    // Since we don't have original ISO in Task except mapped...
    // I'll leave date empty or require re-entry to simple things up or store raw date?
    // Let's rely on user re-entering date for now as parsing locale string is flaky.
    setEditDue(""); // User must pick date
    setEditDesc(task.description || "");
    setEditProjectId(task.projectId ? task.projectId.toString() : "");
    setEditMemberIds([]); // We don't overwrite members on simple edit
    setShowDetail(null);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editingTask) return;
    setSaving(true);
    try {
      const payload: any = {
        task_name: editName,
        task_description: editDesc,
      };
      if (editDue) payload.due_date = editDue;
      if (editProjectId) payload.project_id = parseInt(editProjectId);
      if (editMemberIds.length > 0)
        payload.member_ids = editMemberIds.map((id) => parseInt(id));

      await apiRequest(`/tasks/${editingTask.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setShowEditModal(false);
      setEditingTask(null);
      fetchProjectsAndTasks();
    } catch (e) {
      alert("Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      // Optimistic update? No, safer to wait.
      await apiRequest(`/tasks/${id}/`, { method: "DELETE" });
      setShowDetail(null);
      fetchProjectsAndTasks();
    } catch (e) {
      alert("Failed to delete task. You might not have permission.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0f0f11] text-gray-100 flex items-center justify-center">
        <p className="text-gray-400">Please log in to view projects.</p>
      </div>
    );
  }

  if (loading && tasks.length === 0 && projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0f11] text-gray-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#6366f1] mr-2" />
        <p className="text-gray-400">Loading projects...</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-gray-400 mt-1">
              Track progress and manage tasks
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Projects */}
          <div className="lg:col-span-8">
            <div className="bg-[#111113] rounded-2xl p-6 border border-[#1a1a1f]">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold">Active Projects</h2>
                {(user?.role === "admin" || user?.backendRole === "mod") && (
                  <button
                    onClick={() => setShowCreateProjectModal(true)}
                    className="flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-[#10b981]/20"
                  >
                    <Plus size={16} /> Create Project
                  </button>
                )}
              </div>
              {projects.length === 0 ? (
                <p className="text-gray-500">No active projects found.</p>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {projects.map((p, i) => (
                    <div
                      key={i}
                      className="bg-[#17171c] rounded-xl p-5 border border-[#222229]"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">{p.name}</h3>
                          <p className="text-xs text-[#8b5cf6] mt-0.5">
                            {p.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(user?.role === "admin" ||
                            user?.backendRole === "mod") && (
                            <div className="flex gap-1.5 mr-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditProject(p);
                                }}
                                className="p-1.5 bg-[#1a1a1f] hover:bg-[#222229] rounded-lg transition-colors text-gray-400 hover:text-white"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteProject(p.id);
                                }}
                                className="p-1.5 bg-[#1a1a1f] hover:bg-[#222229] rounded-lg transition-colors text-red-500/70 hover:text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                          <span className="text-[#10b981] font-medium">
                            {p.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#1f1f24] rounded-full mb-3.5 overflow-hidden">
                        <div
                          className="h-full bg-[#10b981]"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>
                          {p.done}/{p.total} Tasks
                        </span>
                        <span className="text-[#f97316]">{p.due}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tasks - Only for Managers and others */}
          <div className="lg:col-span-4">
            <div className="bg-[#111113] rounded-2xl p-6 border border-[#1a1a1f]">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-semibold">Tasks</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 bg-[#10b981] hover:bg-[#059669] px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  <Plus size={16} /> New Task
                </button>
              </div>

              <div className="flex gap-2 mb-5 flex-wrap">
                {(["All", "To Do", "In Progress", "Late"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveFilter(s)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      activeFilter === s
                        ? "bg-[#4f46e5] text-white"
                        : "bg-[#1a1a1f] hover:bg-[#222229]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tasks found.</p>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setShowDetail(task)}
                      className="bg-[#17171c] p-4 rounded-xl border border-[#222229] hover:border-[#4f46e5]/50 cursor-pointer transition"
                    >
                      <div className="font-medium">{task.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {task.project}
                      </div>
                      <div className="mt-3 flex justify-between items-center text-xs">
                        <span className="text-[#f97316]">
                          {task.due ? `Till ${task.due}` : "Overdue"}
                        </span>
                        <div className="flex items-center gap-2">
                          {task.progress != null && (
                            <span className="px-2.5 py-0.5 bg-[#6d28d9]/30 text-[#c084fc] rounded-full text-[11px]">
                              {task.progress}%
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                              task.status === "In Progress"
                                ? "bg-[#6d28d9]/40 text-[#c084fc]"
                                : task.status === "Late"
                                  ? "bg-orange-900/60 text-orange-300"
                                  : task.status === "Overdue"
                                    ? "bg-red-950/70 text-red-300"
                                    : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111113] rounded-2xl w-full max-w-md border border-[#1a1a1f] max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Create New Task</h2>
                <button onClick={() => setShowCreateModal(false)}>
                  <X className="text-gray-400 hover:text-white" size={24} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Task Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-[#6366f1]"
                    placeholder="Enter task name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Project
                  </label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#6366f1]"
                  >
                    <option value="">Select project (optional)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Contributors *
                  </label>
                  {members.length > 0 ? (
                    <select
                      multiple
                      value={newMemberIds}
                      onChange={(e) =>
                        setNewMemberIds(
                          Array.from(
                            e.target.selectedOptions,
                            (option) => option.value,
                          ),
                        )
                      }
                      className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#6366f1] h-24"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.username}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <AlertCircle size={16} />
                      {user
                        ? `Task will be assigned to you. Backend enforces department permissions.`
                        : "No members available"}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Hold Ctrl/Cmd to select multiple. Current:{" "}
                    {newMemberIds.length}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Deadline <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#6366f1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={4}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-[#6366f1] resize-none"
                    placeholder="Enter task description"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-[#1a1a1f]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 bg-[#1a1a1f] hover:bg-[#222229] rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                disabled={creating}
                className="px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111113] rounded-2xl w-full max-w-md border border-[#1a1a1f] max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Edit Task</h2>
                <button onClick={() => setShowEditModal(false)}>
                  <X className="text-gray-400 hover:text-white" size={24} />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Task Name *
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#6366f1]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={editDue}
                    onChange={(e) => setEditDue(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#6366f1]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep current deadline
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Project
                  </label>
                  <select
                    value={editProjectId}
                    onChange={(e) => setEditProjectId(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#6366f1]"
                  >
                    <option value="">No Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Add Contributors (Optional)
                  </label>
                  {members.length > 0 ? (
                    <select
                      multiple
                      value={editMemberIds}
                      onChange={(e) =>
                        setEditMemberIds(
                          Array.from(
                            e.target.selectedOptions,
                            (option) => option.value,
                          ),
                        )
                      }
                      className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#6366f1] h-24"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.username}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      Contributor list unavailable
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#6366f1] resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-5 border-t border-[#1a1a1f]">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 bg-[#1a1a1f] hover:bg-[#222229] rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111113] rounded-2xl w-full max-w-2xl border border-[#1a1a1f]">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{showDetail.name}</h2>
                  <p className="text-[#8b5cf6] mt-1 text-sm">
                    {showDetail.project}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(showDetail)}
                    className="p-2.5 bg-[#1a1a1f] hover:bg-[#222229] rounded-lg"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => deleteTask(showDetail.id)}
                    className="p-2.5 bg-[#1a1a1f] hover:bg-[#222229] rounded-lg"
                  >
                    <Trash2 size={18} className="text-red-400" />
                  </button>
                  <button onClick={() => setShowDetail(null)}>
                    <X className="text-gray-400 hover:text-white" size={24} />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-5 gap-6">
                <div className="md:col-span-3 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      Task Description
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {showDetail.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Progress</h3>
                    <div className="bg-[#17171c] rounded-xl p-4 border border-[#222229]">
                      <div className="flex justify-between text-sm mb-2.5">
                        <span>Completion</span>
                        <span className="text-[#10b981] font-medium">
                          {showDetail.progress ?? 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#1f1f24] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#10b981]"
                          style={{ width: `${showDetail.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Started</div>
                      <div>{showDetail.started || "—"}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Due Date</div>
                      <div className="text-[#f97316]">
                        {showDetail.due || "Overdue"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Created</div>
                      <div>{showDetail.created || "—"}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Last Updated</div>
                      <div>{showDetail.lastUpdated || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL (Admin Only) */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111113] rounded-2xl w-full max-w-md border border-[#1a1a1f] max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Create New Project</h2>
                <button onClick={() => setShowCreateProjectModal(false)}>
                  <X className="text-gray-400 hover:text-white" size={24} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Project Name *
                  </label>
                  <input
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-[#10b981]"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-[#10b981] resize-none"
                    placeholder="Enter project description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Assign Departments
                  </label>
                  <div className="bg-[#17171c] border border-[#222229] rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                    {allDepts.map((dept) => (
                      <label
                        key={dept.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-[#1a1a1f] p-1 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-[#222229] text-[#10b981] bg-[#111113] focus:ring-[#10b981]"
                          checked={assignedDeptIds.includes(dept.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked)
                              setAssignedDeptIds([
                                ...assignedDeptIds,
                                dept.id.toString(),
                              ]);
                            else
                              setAssignedDeptIds(
                                assignedDeptIds.filter(
                                  (id) => id !== dept.id.toString(),
                                ),
                              );
                          }}
                        />
                        <span className="text-sm text-gray-300">
                          {dept.dept_name}
                        </span>
                      </label>
                    ))}
                    {allDepts.length === 0 && (
                      <p className="text-gray-500 text-xs text-center py-2">
                        No departments found
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-[#1a1a1f]">
              <button
                onClick={() => setShowCreateProjectModal(false)}
                className="px-5 py-2.5 bg-[#1a1a1f] hover:bg-[#222229] rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={creatingProject}
                className="px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition"
              >
                {creatingProject && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL (Admin Only) */}
      {showEditProjectModal && editingProject && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111113] rounded-2xl w-full max-w-md border border-[#1a1a1f] max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Edit Project</h2>
                <button onClick={() => setShowEditProjectModal(false)}>
                  <X className="text-gray-400 hover:text-white" size={24} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Project Name *
                  </label>
                  <input
                    value={editProjName}
                    onChange={(e) => setEditProjName(e.target.value)}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#10b981]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editProjDesc}
                    onChange={(e) => setEditProjDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-[#17171c] border border-[#222229] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#10b981] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Assigned Departments
                  </label>
                  <div className="bg-[#17171c] border border-[#222229] rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                    {allDepts.map((dept) => (
                      <label
                        key={dept.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-[#1a1a1f] p-1 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-[#222229] text-[#10b981] bg-[#111113] focus:ring-[#10b981]"
                          checked={editAssignedDeptIds.includes(
                            dept.id.toString(),
                          )}
                          onChange={(e) => {
                            if (e.target.checked)
                              setEditAssignedDeptIds([
                                ...editAssignedDeptIds,
                                dept.id.toString(),
                              ]);
                            else
                              setEditAssignedDeptIds(
                                editAssignedDeptIds.filter(
                                  (id) => id !== dept.id.toString(),
                                ),
                              );
                          }}
                        />
                        <span className="text-sm text-gray-300">
                          {dept.dept_name}
                        </span>
                      </label>
                    ))}
                    {allDepts.length === 0 && (
                      <p className="text-gray-500 text-xs text-center py-2">
                        No departments found
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-[#1a1a1f]">
              <button
                onClick={() => setShowEditProjectModal(false)}
                className="px-5 py-2.5 bg-[#1a1a1f] hover:bg-[#222229] rounded-lg text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={saveEditProject}
                disabled={savingProject}
                className="px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition"
              >
                {savingProject && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
