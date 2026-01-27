import { useState, useEffect } from "react";
import { Plus, X, Trash2, Pencil, MapPin, Loader2, Users } from "lucide-react";
import { useAuth } from "../../lib/stores/authStore";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Meeting = {
  id: number;
  meet_title: string;
  meet_date: string;
  duration: string; // Backend returns HH:MM:SS
  meet_description: string;
  meet_location: string;
  participants: Array<{
    id: number;
    username: string;
  }>;
};

type Member = {
  id: number;
  username: string;
  email: string;
  role: { id: number; role_name: string };
  department?: { id: number; dept_name: string };
};

export default function MeetingsPage() {
  const { token, user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const canManageMeetings =
    user?.role === "admin" ||
    user?.backendRole === "mod" ||
    user?.role === "manager" ||
    user?.backendRole === "manager";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState<number | "">(1);
  const [minutes, setMinutes] = useState<number | "">(30);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Helper for requests
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

  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const meetingsData = await apiRequest("/meetings/");
      setMeetings(
        Array.isArray(meetingsData) ? meetingsData : meetingsData.results || [],
      );

      try {
        const memRes = await apiRequest("/members/");
        const mems = Array.isArray(memRes) ? memRes : memRes.results || [];
        setMembers(mems);
      } catch (e) {}
    } catch (error) {
      console.error("Failed to fetch meetings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const formatDurationForBackend = (h: number | "", m: number | "") => {
    const hh = String(h || 0).padStart(2, "0");
    const mm = String(m || 0).padStart(2, "0");
    return `${hh}:${mm}:00`;
  };

  const parseDurationFromBackend = (dur: string) => {
    const parts = dur.split(":");
    return {
      h: parseInt(parts[0]) || 0,
      m: parseInt(parts[1]) || 0,
    };
  };

  const resetForm = () => {
    setTitle("");
    setHours(1);
    setMinutes(30);
    setDate("");
    setTime("");
    setDescription("");
    setLocation("");
    setSelectedMemberIds([]);
    setEditingMeeting(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setTitle(meeting.meet_title);
    setDescription(meeting.meet_description);
    setLocation(meeting.meet_location || "");
    setSelectedMemberIds(meeting.participants.map((p) => p.id.toString()));

    const { h, m } = parseDurationFromBackend(meeting.duration);
    setHours(h);
    setMinutes(m);

    // Backend: 2026-01-26T19:00:15Z
    if (meeting.meet_date) {
      const d = new Date(meeting.meet_date);
      setDate(d.toISOString().split("T")[0]);
      setTime(d.toISOString().split("T")[1].substring(0, 5));
    } else {
      setDate("");
      setTime("");
    }

    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (!date || !time) {
      alert("Date and Time are required");
      return;
    }

    setSaving(true);
    try {
      const dateTimeStr = `${date}T${time}:00`;
      const payload = {
        meet_title: title.trim(),
        meet_description: description.trim(),
        meet_date: dateTimeStr,
        duration: formatDurationForBackend(hours, minutes),
        meet_location: location.trim(),
        participants_ids: selectedMemberIds.map((id) => parseInt(id)),
      };

      if (editingMeeting) {
        await apiRequest(`/meetings/${editingMeeting.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/meetings/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (e) {
      alert(
        `Failed to save meeting: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this meeting?")) return;
    try {
      await apiRequest(`/meetings/${id}/`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      alert("Failed to delete meeting");
    }
  };

  const isEditing = !!editingMeeting;

  if (!token) {
    return (
      <div className="text-gray-100 flex items-center justify-center py-20">
        <p className="text-gray-400">Please log in to view meetings.</p>
      </div>
    );
  }

  return (
    <div className="text-gray-100 font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
        <p className="text-gray-400 mt-1">Schedule and manage team meetings</p>
      </header>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Upcoming Meetings</h2>
          {canManageMeetings && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus size={18} />
              New Meeting
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-emerald-500 mr-2" />
            <p className="text-gray-400">Loading meetings...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.length === 0 ? (
              <div className="bg-[#1a1a1a] rounded-lg p-10 text-center border border-gray-800">
                <p className="text-gray-500">No upcoming meetings scheduled.</p>
              </div>
            ) : (
              meetings.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#1a1a1a] border-l-4 border-emerald-500 rounded-lg p-5 hover:bg-[#202020] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{m.meet_title}</h3>
                      <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        {new Date(m.meet_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {" • "}
                        {new Date(m.meet_date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {m.meet_location && (
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                          <MapPin size={14} className="text-emerald-400" />
                          {m.meet_location}
                        </p>
                      )}
                      {m.participants && m.participants.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(() => {
                            const participantIds = m.participants.map(
                              (p) => p.id,
                            );

                            // Check if "All Members" (compare with current members list if available)
                            if (
                              members.length > 0 &&
                              members.length === participantIds.length &&
                              members.every((mem) =>
                                participantIds.includes(mem.id),
                              )
                            ) {
                              return (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                                  All Members
                                </span>
                              );
                            }

                            // Check if "All Managers"
                            const allManagerIds = members
                              .filter((mem) => mem.role.role_name === "manager")
                              .map((mem) => mem.id);
                            if (
                              allManagerIds.length > 0 &&
                              allManagerIds.length === participantIds.length &&
                              allManagerIds.every((id) =>
                                participantIds.includes(id),
                              )
                            ) {
                              return (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                                  All Managers
                                </span>
                              );
                            }

                            // Check if "Department" (only if current user is manager and dept matches)
                            if (user?.department) {
                              const deptMemberIds = members
                                .filter(
                                  (mem) =>
                                    mem.department?.id === user.department?.id,
                                )
                                .map((mem) => mem.id);
                              if (
                                deptMemberIds.length > 0 &&
                                deptMemberIds.length ===
                                  participantIds.length &&
                                deptMemberIds.every((id) =>
                                  participantIds.includes(id),
                                )
                              ) {
                                const deptName =
                                  (user.department as any).name ||
                                  (user.department as any).dept_name ||
                                  "Department";
                                return (
                                  <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30">
                                    {deptName} Team
                                  </span>
                                );
                              }
                            }

                            // Default: list names
                            return m.participants.map((p) => (
                              <span
                                key={p.id}
                                className="text-[10px] bg-[#2a2a2a] text-gray-300 px-2 py-0.5 rounded border border-gray-700"
                              >
                                {p.username}
                              </span>
                            ));
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canManageMeetings && (
                          <>
                            <button
                              onClick={() => openEditModal(m)}
                              className="p-1.5 hover:bg-gray-800 rounded-md text-blue-400 hover:text-blue-300"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="p-1.5 hover:bg-gray-800 rounded-md text-red-400 hover:text-red-300"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                      <span className="inline-block bg-[#111] text-emerald-400 text-xs font-medium px-3 py-1 rounded-full ml-2 whitespace-nowrap">
                        {m.duration.split(":").slice(0, 2).join("H ") + "MIN"}
                      </span>
                    </div>
                  </div>

                  {m.meet_description && (
                    <p className="mt-3 text-gray-300 text-sm leading-relaxed max-w-3xl">
                      {m.meet_description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-gray-800 shadow-2xl">
            <div className="sticky top-0 bg-[#141414] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {isEditing ? "Edit Meeting" : "New Meeting"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meeting Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  placeholder="Enter meeting title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-[#1e1e1e] border border-gray-700 rounded-lg overflow-hidden focus-within:border-emerald-500 transition-colors">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={hours}
                      onChange={(e) =>
                        setHours(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-16 bg-transparent px-3 py-2.5 focus:outline-none text-center"
                    />
                    <span className="text-gray-500 pr-3">H</span>
                  </div>
                  <div className="flex items-center bg-[#1e1e1e] border border-gray-700 rounded-lg overflow-hidden focus-within:border-emerald-500 transition-colors">
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={minutes}
                      onChange={(e) =>
                        setMinutes(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-16 bg-transparent px-3 py-2.5 focus:outline-none text-center"
                    />
                    <span className="text-gray-500 pr-3">MIN</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* New Location field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500"
                    placeholder="Conference Room A, Zoom, Office HQ..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-emerald-400" />
                    Add Participants (Optional)
                  </div>
                </label>

                {canManageMeetings && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(user?.role === "admin" ||
                      user?.backendRole === "mod") && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = members.map((m) => m.id.toString());
                            const allSelected =
                              allIds.length > 0 &&
                              allIds.every((id) =>
                                selectedMemberIds.includes(id),
                              );
                            if (allSelected)
                              setSelectedMemberIds(
                                selectedMemberIds.filter(
                                  (id) => !allIds.includes(id),
                                ),
                              );
                            else
                              setSelectedMemberIds(
                                Array.from(
                                  new Set([...selectedMemberIds, ...allIds]),
                                ),
                              );
                          }}
                          className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                            members.length > 0 &&
                            members
                              .map((m) => m.id.toString())
                              .every((id) => selectedMemberIds.includes(id))
                              ? "bg-emerald-500 text-black border-emerald-500"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          }`}
                        >
                          All Members ({members.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const managerIds = members
                              .filter((m) => m.role.role_name === "manager")
                              .map((m) => m.id.toString());
                            const allManagersSelected =
                              managerIds.length > 0 &&
                              managerIds.every((id) =>
                                selectedMemberIds.includes(id),
                              );
                            if (allManagersSelected)
                              setSelectedMemberIds(
                                selectedMemberIds.filter(
                                  (id) => !managerIds.includes(id),
                                ),
                              );
                            else
                              setSelectedMemberIds(
                                Array.from(
                                  new Set([
                                    ...selectedMemberIds,
                                    ...managerIds,
                                  ]),
                                ),
                              );
                          }}
                          className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                            members.filter(
                              (m) => m.role.role_name === "manager",
                            ).length > 0 &&
                            members
                              .filter((m) => m.role.role_name === "manager")
                              .every((m) =>
                                selectedMemberIds.includes(m.id.toString()),
                              )
                              ? "bg-blue-500 text-black border-blue-500"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                          }`}
                        >
                          Managers
                        </button>
                      </>
                    )}
                    {(user?.role === "manager" ||
                      user?.backendRole === "manager") &&
                      user?.department && (
                        <button
                          type="button"
                          onClick={() => {
                            const myDeptId = user.department?.id;
                            const deptMemberIds = members
                              .filter((m) => m.department?.id === myDeptId)
                              .map((m) => m.id.toString());
                            const allDeptSelected =
                              deptMemberIds.length > 0 &&
                              deptMemberIds.every((id) =>
                                selectedMemberIds.includes(id),
                              );
                            if (allDeptSelected)
                              setSelectedMemberIds(
                                selectedMemberIds.filter(
                                  (id) => !deptMemberIds.includes(id),
                                ),
                              );
                            else
                              setSelectedMemberIds(
                                Array.from(
                                  new Set([
                                    ...selectedMemberIds,
                                    ...deptMemberIds,
                                  ]),
                                ),
                              );
                          }}
                          className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                            members.filter(
                              (m) => m.department?.id === user.department?.id,
                            ).length > 0 &&
                            members
                              .filter(
                                (m) => m.department?.id === user.department?.id,
                              )
                              .every((m) =>
                                selectedMemberIds.includes(m.id.toString()),
                              )
                              ? "bg-purple-500 text-black border-purple-500"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
                          }`}
                        >
                          My Department
                        </button>
                      )}
                    <button
                      type="button"
                      onClick={() => setSelectedMemberIds([])}
                      className="text-[10px] bg-gray-500/10 text-gray-400 px-2 py-1 rounded border border-gray-500/20 hover:bg-gray-500/20 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <div className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {members.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-[#252525] p-2 rounded transition-colors group"
                    >
                      <input
                        type="checkbox"
                        className="rounded border border-gray-600 text-emerald-500 bg-[#0f0f0f] focus:ring-emerald-500 focus:ring-offset-0"
                        checked={selectedMemberIds.includes(
                          member.id.toString(),
                        )}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedMemberIds([
                              ...selectedMemberIds,
                              member.id.toString(),
                            ]);
                          else
                            setSelectedMemberIds(
                              selectedMemberIds.filter(
                                (id) => id !== member.id.toString(),
                              ),
                            );
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium group-hover:text-emerald-400 transition-colors">
                          {member.username}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {member.email}
                        </span>
                      </div>
                    </label>
                  ))}
                  {members.length === 0 && (
                    <p className="text-gray-500 text-xs text-center py-4 italic">
                      No members available to add
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  {selectedMemberIds.length} participant(s) selected.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg px-4 py-2.5 resize-none focus:outline-none focus:border-emerald-500"
                  placeholder="Add details about the meeting..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || saving}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:text-gray-300 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {isEditing ? "Save Changes" : "Create Meeting"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
