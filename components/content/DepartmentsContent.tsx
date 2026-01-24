"use client";
import { FilePenLine, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../lib/stores/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

type Department = {
  id: number;
  shortCode: string;
  name: string;
  description: string;
  memberCount: number;
  projectCount: number;
  managerInitial: string;
  managerName: string;
};

interface BackendDepartment {
  id: number;
  dept_name: string;
  dept_description: string;
  members_count?: number;
  projects?: any[];
  managers?: Array<{
    id: number;
    username: string;
    image?: string;
  }>;
}

export default function DepartmentsContent() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [shortCode, setShortCode] = useState("");
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");
  // Manually managed fields for display/dummy purposes in creation
  // memberCount and projectCount come from backend usually

  // Helpers
  const convertToFrontend = (backendDept: BackendDepartment): Department => {
    const manager = backendDept.managers?.[0];
    const managerName = manager?.username || "Unassigned";
    const managerInitial = managerName.charAt(0).toUpperCase();

    // Generate shortcode if not present (backend doesn't store shortCode, so we generate from name)
    const words = backendDept.dept_name.split(" ");
    const generatedCode = words.length > 1
      ? words.slice(0, 2).map(w => w[0]).join("")
      : backendDept.dept_name.substring(0, 2);

    return {
      id: backendDept.id,
      shortCode: generatedCode.toUpperCase(),
      name: backendDept.dept_name,
      description: backendDept.dept_description,
      memberCount: backendDept.members_count || 0,
      projectCount: backendDept.projects?.length || 0,
      managerInitial,
      managerName,
    };
  };

  const fetchDepartments = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/departments/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error("Failed to fetch departments");

      const data = await response.json();
      const results = Array.isArray(data) ? data : (data.results || []);
      setDepartments(results.map(convertToFrontend));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [token]);

  const openCreateForm = () => {
    setShortCode("");
    setDeptName("");
    setDeptDescription("");
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (dept: Department) => {
    setShortCode(dept.shortCode);
    setDeptName(dept.name);
    setDeptDescription(dept.description);
    setEditingId(dept.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setDeptName("");
    setDeptDescription("");
    setShortCode("");
  };

  const handleSubmit = async () => {
    if (!deptName.trim() || !deptDescription.trim()) return;
    if (!token) return;

    setIsSubmitting(true);
    try {
      const payload = {
        dept_name: deptName,
        dept_description: deptDescription,
        // manager_ids: [] // We don't have manager selection UI yet
      };

      let response;
      if (editingId !== null) {
        response = await fetch(`${API_BASE}/departments/${editingId}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API_BASE}/departments/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to save department");
      }

      await fetchDepartments();
      handleCancel();
    } catch (err) {
      console.error(err);
      alert("Error saving department");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      const response = await fetch(`${API_BASE}/departments/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete department");

      await fetchDepartments();
      if (editingId === id) handleCancel();
    } catch (err) {
      console.error(err);
      alert("Failed to delete department");
    }
  };

  if (loading && departments.length === 0) {
    return <div className="text-white">Loading departments...</div>;
  }

  if (error && departments.length === 0) {
    return (
      <div className="text-center text-red-400">
        <p>{error}</p>
        <button onClick={fetchDepartments} className="mt-4 px-4 py-2 bg-[#2a2a2a] text-white rounded">Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">Departments</h2>
      <p className="text-[#808080] mb-8">Manage all club departments</p>

      <button
        onClick={openCreateForm}
        className="bg-[#7CFC9D] text-black px-4 py-2 rounded-lg font-semibold mb-6 hover:bg-[#6eea8c] transition-colors"
      >
        + Create Department
      </button>

      {showForm && (
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">
            {editingId !== null ? "Edit Department" : "New Department"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-white mb-1">Department Name</label>
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="w-full px-4 py-2 bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg"
                placeholder="Enter department name"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-white mb-1">Description</label>
              <textarea
                rows={3}
                value={deptDescription}
                onChange={(e) => setDeptDescription(e.target.value)}
                className="w-full px-4 py-2 bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-lg"
                placeholder="Enter department description"
              />
            </div>
            {/* Short code, counts, and manager fields are auto-handled or read-only from backend for now */}

            <div className="md:col-span-2 flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#7CFC9D] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#6eea8c] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : editingId !== null ? "Update Department" : "Add Department"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="text-gray-400 px-6 py-2 rounded-lg font-semibold hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <DepartmentCard
            key={dept.id}
            data={dept}
            onEdit={() => handleEdit(dept)}
            onDelete={() => handleDelete(dept.id)}
          />
        ))}
      </div>
    </div>
  );
}

const departmentColors = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-red-600",
  "bg-orange-600",
  "bg-yellow-600",
  "bg-green-600",
  "bg-teal-600",
  "bg-cyan-600",
  "bg-indigo-600",
];

const getDepartmentColor = (id: number) => {
  return departmentColors[id % departmentColors.length];
};

const DepartmentCard = ({
  data,
  onEdit,
  onDelete,
}: {
  data: Department;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const iconColor = getDepartmentColor(data.id);

  return (
    <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6 text-white h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl ${iconColor} flex items-center justify-center text-2xl font-bold`}>
            {data.shortCode}
          </div>
          <div>
            <h3 className="text-xl font-bold">{data.name}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {data.memberCount} members • {data.projectCount} projects
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <FilePenLine
            size={20}
            className="text-gray-500 cursor-pointer hover:text-white transition-colors"
            onClick={onEdit}
          />
          <Trash2
            size={20}
            className="text-gray-500 cursor-pointer hover:text-red-400 transition-colors"
            onClick={onDelete}
          />
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-6 line-clamp-3 break-words flex-grow">
        {data.description}
      </p>

      <div className="mt-auto">
        <p className="uppercase text-xs font-semibold text-gray-500 tracking-wider mb-3">
          Department Manager
        </p>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-xl font-bold">
            {data.managerInitial}
          </div>
          <div>
            <p className="text-xl font-bold">{data.managerName}</p>
            <p className="text-sm text-gray-400">Manager</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Active in {data.projectCount} projects
          </p>
          <span className="px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
            Active
          </span>
        </div>
      </div>
    </div>
  );
};
