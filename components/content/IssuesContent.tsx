"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  ChevronRight,
  X,
  Send,
  Loader2,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../lib/stores/authStore";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Issue = {
  id: number;
  issue_title: string;
  issue_description: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    image?: string;
  };
  task: {
    id: number;
    task_name: string;
    project?: { project_name: string };
  };
};

type Comment = {
  id: number;
  comment_text: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    image?: string;
  };
};

type Task = {
  id: number;
  task_name: string;
};

export default function IssuesContent() {
  const { token, user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "my">("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // Creation State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueDesc, setNewIssueDesc] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [hiddenIssueIds, setHiddenIssueIds] = useState<number[]>([]);

  // Load hidden issues on mount / user change
  useEffect(() => {
    if (!user?.id) return;
    const key = `hiddenIssues_${user.id}`;
    const hidden = localStorage.getItem(key);
    if (hidden) {
      try {
        setHiddenIssueIds(JSON.parse(hidden));
      } catch (e) {
        setHiddenIssueIds([]);
      }
    } else {
      setHiddenIssueIds([]);
    }
  }, [user?.id]);

  const hideIssueLocally = (id: number) => {
    if (!user?.id) return;
    const updated = [...hiddenIssueIds, id];
    setHiddenIssueIds(updated);
    localStorage.setItem(`hiddenIssues_${user.id}`, JSON.stringify(updated));
    if (selectedIssue?.id === id) setSelectedIssue(null);
  };

  // Permissions helper
  const canManageIssues =
    user?.role === "admin" ||
    user?.role === "manager" ||
    user?.backendRole === "mod" ||
    user?.backendRole === "manager";
  const canManageAllData =
    user?.role === "admin" || user?.backendRole === "mod";

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) return null;
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `API Error: ${res.status}`;
      try {
        const errorData = JSON.parse(text);
        if (errorData.detail) errorMessage = errorData.detail;
        else if (typeof errorData === "object") {
          errorMessage = Object.entries(errorData)
            .map(
              ([field, errors]) =>
                `${field}: ${Array.isArray(errors) ? errors.join(", ") : errors}`,
            )
            .join("; ");
        }
      } catch (e) {
        if (text && text.length < 200) errorMessage = text;
      }
      throw new Error(errorMessage);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  };

  const fetchIssues = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await apiRequest("/issues/");
      setIssues(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error("Failed to fetch issues", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await apiRequest("/tasks/");
      setAvailableTasks(Array.isArray(data) ? data : data.results || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchIssues();
    fetchTasks();
  }, [token]);

  useEffect(() => {
    if (selectedIssue) {
      fetchComments(selectedIssue.id);
    }
  }, [selectedIssue]);

  const fetchComments = async (issueId: number) => {
    try {
      setLoadingComments(true);
      const data = await apiRequest(`/issue-comments/?issue_id=${issueId}`);
      setComments(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error("Failed to fetch comments", e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedIssue) return;
    try {
      setSendingComment(true);
      await apiRequest("/issue-comments/", {
        method: "POST",
        body: JSON.stringify({
          issue: selectedIssue.id,
          comment_text: newComment.trim(),
        }),
      });
      setNewComment("");
      fetchComments(selectedIssue.id);
    } catch (e) {
      alert("Failed to post comment");
    } finally {
      setSendingComment(false);
    }
  };

  const handleCreateIssue = async () => {
    if (!newIssueTitle.trim() || !selectedTaskId) return;
    try {
      setCreating(true);
      await apiRequest("/issues/", {
        method: "POST",
        body: JSON.stringify({
          issue_title: newIssueTitle.trim(),
          issue_description: newIssueDesc.trim(),
          task: parseInt(selectedTaskId),
        }),
      });
      setIsCreateModalOpen(false);
      setNewIssueTitle("");
      setNewIssueDesc("");
      setSelectedTaskId("");
      fetchIssues();
    } catch (e) {
      alert("Failed to create issue");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteIssue = async (id: number, creatorId: number) => {
    const isCreatorOrAdmin =
      creatorId.toString() === user?.id?.toString() || user?.role === "admin";

    if (!isCreatorOrAdmin) {
      if (
        confirm(
          "Hide this issue from your view? it will still be saved in the database.",
        )
      ) {
        hideIssueLocally(id);
      }
      return;
    }

    if (
      !confirm("Are you sure you want to delete this issue from the database?")
    )
      return;
    try {
      await apiRequest(`/issues/${id}/`, { method: "DELETE" });
      if (selectedIssue?.id === id) setSelectedIssue(null);
      fetchIssues();
    } catch (e) {
      alert("Failed to delete issue. You might not have permission.");
    }
  };

  const handleToggleSolved = async (issue: Issue) => {
    const isSolved = isIssueSolved(issue.issue_title);
    let newTitle = issue.issue_title;
    if (isSolved) {
      newTitle = issue.issue_title.replace("[SOLVED]", "").trim();
    } else {
      newTitle = `[SOLVED] ${issue.issue_title}`;
    }

    try {
      await apiRequest(`/issues/${issue.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          issue_title: newTitle,
        }),
      });
      fetchIssues();
      if (selectedIssue?.id === issue.id) {
        setSelectedIssue({ ...selectedIssue, issue_title: newTitle });
      }
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    }
  };

  const filteredIssues = issues.filter((i) => {
    if (hiddenIssueIds.includes(i.id)) return false;
    const matchesSearch =
      i.issue_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.task.task_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" || i.user.id.toString() === user?.id?.toString();
    return matchesSearch && matchesFilter;
  });

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Please log in to view issues.
      </div>
    );
  }

  const isIssueSolved = (title: string) => title.includes("[SOLVED]");
  const cleanTitle = (title: string) => title.replace("[SOLVED]", "").trim();

  return (
    <div className="text-gray-100 min-h-[calc(100vh-10rem)]">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Issues & Reports
          </h2>
          <p className="text-gray-400 mt-1">Track and resolve project issues</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-lg font-semibold transition-all shadow-lg hover:shadow-emerald-500/20"
        >
          <Plus size={20} />
          Report Issue
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Issues List */}
        <div
          className={`${selectedIssue ? "lg:col-span-4 hidden lg:block" : "lg:col-span-12"} space-y-4`}
        >
          <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3 border border-gray-800 focus-within:border-emerald-500/50 transition-colors">
            <Search className="text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search issues or tasks..."
              className="bg-transparent border-none outline-none w-full text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="h-6 w-[1px] bg-gray-800 mx-2" />
            <select
              className="bg-transparent border-none outline-none text-sm text-gray-400 cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All Issues</option>
              <option value="my">My Issues</option>
            </select>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="text-gray-500">Loading issues...</p>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="bg-[#1a1a1a] rounded-xl p-12 text-center border border-gray-800">
                <AlertCircle className="mx-auto text-gray-600 mb-4" size={48} />
                <h3 className="text-white font-semibold text-lg">
                  No issues found
                </h3>
                <p className="text-gray-500 mt-1">
                  Try adjusting your search or report a new issue.
                </p>
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`bg-[#1a1a1a] border rounded-xl p-4 cursor-pointer hover:border-emerald-500/30 transition-all group ${selectedIssue?.id === issue.id ? "border-emerald-500/50 ring-1 ring-emerald-500/50" : "border-gray-800 shadow-sm"} ${isIssueSolved(issue.issue_title) ? "opacity-70" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        {issue.task.project?.project_name || "Project"}
                      </span>
                      {isIssueSolved(issue.issue_title) && (
                        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 size={12} /> Solved
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3
                    className={`font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 ${isIssueSolved(issue.issue_title) ? "line-through decoration-gray-500" : ""}`}
                  >
                    {cleanTitle(issue.issue_title)}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 mb-3 line-clamp-2 leading-relaxed">
                    {issue.issue_description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">By </span>
                      <span className="text-xs text-gray-300 font-medium">
                        {issue.user.username}
                      </span>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-gray-600 transition-transform ${selectedIssue?.id === issue.id ? "rotate-90 text-emerald-500" : ""}`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Issue Details / Conversation */}
        {selectedIssue && (
          <div className="lg:col-span-8 bg-[#1a1a1a] rounded-xl border border-gray-800 flex flex-col h-full min-h-[500px] shadow-2xl relative">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#1f1f1f] rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="lg:hidden p-1.5 hover:bg-gray-800 rounded-lg text-gray-400"
                >
                  <X size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white leading-tight">
                      {cleanTitle(selectedIssue.issue_title)}
                    </h3>
                    {isIssueSolved(selectedIssue.issue_title) && (
                      <CheckCircle2 className="text-emerald-500" size={16} />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Related to:{" "}
                    <span className="text-emerald-400">
                      {selectedIssue.task.task_name}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedIssue.user.id.toString() === user?.id?.toString() && (
                  <button
                    onClick={() => handleToggleSolved(selectedIssue)}
                    className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      isIssueSolved(selectedIssue.issue_title)
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                        : "bg-emerald-500 text-black hover:bg-emerald-400"
                    }`}
                  >
                    {isIssueSolved(selectedIssue.issue_title)
                      ? "Mark Unsolved"
                      : "Mark Solved"}
                  </button>
                )}
                <button
                  onClick={() =>
                    handleDeleteIssue(selectedIssue.id, selectedIssue.user.id)
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    selectedIssue.user.id.toString() === user?.id?.toString() ||
                    user?.role === "admin"
                      ? "hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                      : "hover:bg-gray-800 text-gray-500 hover:text-gray-300"
                  }`}
                  title={
                    selectedIssue.user.id.toString() === user?.id?.toString() ||
                    user?.role === "admin"
                      ? "Delete from Database"
                      : "Hide from View"
                  }
                >
                  {selectedIssue.user.id.toString() === user?.id?.toString() ||
                  user?.role === "admin" ? (
                    <Trash2 size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hidden lg:block"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Original Report */}
              <div className="bg-[#242424] rounded-xl p-4 border border-gray-800 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-500">
                    {selectedIssue.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {selectedIssue.user.username}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Reported on{" "}
                      {new Date(selectedIssue.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedIssue.issue_description}
                </p>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="h-[1px] bg-gray-800 flex-1"></div>
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  Discussion
                </span>
                <div className="h-[1px] bg-gray-800 flex-1"></div>
              </div>

              {/* Comments */}
              <div className="space-y-4 pb-2">
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <Loader2
                      size={24}
                      className="animate-spin text-emerald-500"
                    />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-600 text-xs italic">
                      No comments yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex-shrink-0 flex items-center justify-center uppercase font-bold text-xs text-gray-500">
                        {comment.user.username.charAt(0)}
                      </div>
                      <div className="flex-1 bg-[#1d1d1d] rounded-2xl rounded-tl-none p-3 border border-gray-800/50 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-emerald-500/90">
                            {comment.user.username}
                          </span>
                          <span className="text-[10px] text-gray-600">
                            {new Date(comment.created_at).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          {comment.comment_text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Post Comment Input */}
            <div className="p-4 bg-[#1f1f1f] rounded-b-xl border-t border-gray-800">
              <div className="flex items-center gap-2 bg-[#161616] p-2 pr-1 rounded-2xl border border-gray-800 focus-within:border-emerald-500/50 transition-colors">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="bg-transparent border-none outline-none flex-1 px-2 text-sm text-gray-200 py-2"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                />
                <button
                  disabled={!newComment.trim() || sendingComment}
                  onClick={handleAddComment}
                  className="bg-emerald-500 text-black p-2 rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {sendingComment ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Issue Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-emerald-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Plus className="text-emerald-500" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Report New Issue
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Assign to Task *
                </label>
                <select
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none transition-colors appearance-none"
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                >
                  <option value="">Select a task...</option>
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.task_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none transition-colors"
                  placeholder="Summary of the issue..."
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500/50 outline-none transition-colors h-32 resize-none"
                  placeholder="Detailed explanation of the problem..."
                  value={newIssueDesc}
                  onChange={(e) => setNewIssueDesc(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={
                    !newIssueTitle.trim() || !selectedTaskId || creating
                  }
                  onClick={handleCreateIssue}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:grayscale text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 size={18} className="animate-spin" />}
                  Create Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
