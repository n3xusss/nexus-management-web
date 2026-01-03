'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../lib/stores/authStore';
import { useDashboardStore } from '../../lib/stores/dashboardStore';
import { 
  getMembers,
  getDepartments,
  updateMember,
  deleteMember,
  BackendUser,
  Department,
  formatFrontendUser,
  FrontendUser,
  getTags,
  getSchools
} from '../../lib/api';

// Types
interface MemberWithDetails extends BackendUser {
  frontendUser: FrontendUser;
}

// Member Card Component
interface MemberCardProps {
  member: MemberWithDetails;
  isSelected: boolean;
  onSelect: () => void;
  onAssignDepartment: () => void;
  onDelete: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ 
  member, 
  isSelected, 
  onSelect, 
  onAssignDepartment, 
  onDelete 
}) => {
  return (
    <div 
      className={`p-4 bg-[#1e1e1e] border rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-[#00d084] bg-[#2a2a2a]' 
          : 'border-[#3a3a3a] hover:border-[#00d084] hover:bg-[#2a2a2a]'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d084] to-[#007a52] flex items-center justify-center text-white font-bold text-lg">
            {member.first_name?.charAt(0) || member.username?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {member.first_name && member.last_name 
                ? `${member.first_name} ${member.last_name}`
                : member.username
              }
            </h3>
            <p className="text-xs text-[#808080]">
              {member.email}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                member.department 
                  ? 'bg-[#00d084]/10 text-[#00d084]' 
                  : 'bg-[#e67e22]/10 text-[#e67e22]'
              }`}>
                {member.department?.dept_name || 'No Department'}
              </span>
              <span className="px-2 py-0.5 text-xs bg-[#2a2a2a] rounded-full text-[#808080]">
                {member.role?.role_name || 'member'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssignDepartment();
            }}
            className="px-3 py-1 text-xs bg-[#00d084] hover:bg-[#00b874] text-white rounded transition-colors"
          >
            Assign
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-3 py-1 text-xs bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-[#808080]">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{member.phone_number || 'No phone'}</span>
        </div>
        <div className="flex items-center gap-1 text-[#808080]">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>{member.school?.school_name || 'No school'}</span>
        </div>
        <div className="col-span-2 flex flex-wrap gap-1 mt-2">
          {member.tags?.slice(0, 3).map(tag => (
            <span 
              key={tag.id} 
              className="px-2 py-0.5 text-xs bg-[#2a2a2a] rounded border border-[#3a3a3a] text-[#808080]"
              style={{ borderLeftColor: tag.color || '#00d084' }}
            >
              {tag.tag_name}
            </span>
          ))}
          {member.tags && member.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs bg-[#2a2a2a] rounded text-[#808080]">
              +{member.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal Components
interface AssignDepartmentModalProps {
  member: MemberWithDetails | null;
  departments: Department[];
  onClose: () => void;
  onAssign: (departmentId: number | null) => Promise<void>;
}

const AssignDepartmentModal: React.FC<AssignDepartmentModalProps> = ({
  member,
  departments,
  onClose,
  onAssign
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(member?.department?.id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!member) return;
    
    setIsSubmitting(true);
    try {
      await onAssign(selectedDeptId);
      onClose();
    } catch (error) {
      console.error('Failed to assign department:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-[#3a3a3a]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">
              Assign Department to {member.first_name || member.username}
            </h3>
            <button
              onClick={onClose}
              className="text-[#808080] hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-4 p-4 bg-[#2a2a2a] rounded-lg">
            <div className="text-sm text-[#808080] mb-2">Current Tags:</div>
            <div className="flex flex-wrap gap-1">
              {member.tags?.map(tag => (
                <span 
                  key={tag.id}
                  className="px-2 py-1 text-xs rounded border border-[#3a3a3a]"
                  style={{ 
                    backgroundColor: `${tag.color}20`,
                    borderLeftColor: tag.color
                  }}
                >
                  {tag.tag_name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">
              Select Department
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div 
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedDeptId === null 
                    ? 'border-[#00d084] bg-[#00d084]/10' 
                    : 'border-[#3a3a3a] hover:border-[#00d084] hover:bg-[#2a2a2a]'
                }`}
                onClick={() => setSelectedDeptId(null)}
              >
                <div className="font-medium text-white mb-1">No Department</div>
                <div className="text-xs text-[#808080]">
                  Member will not be assigned to any specific department
                </div>
              </div>
              
              {departments.map(dept => (
                <div 
                  key={dept.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedDeptId === dept.id 
                      ? 'border-[#00d084] bg-[#00d084]/10' 
                      : 'border-[#3a3a3a] hover:border-[#00d084] hover:bg-[#2a2a2a]'
                  }`}
                  onClick={() => setSelectedDeptId(dept.id)}
                >
                  <div className="font-medium text-white mb-1">{dept.dept_name}</div>
                  <div className="text-xs text-[#808080]">
                    {dept.dept_description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedDeptId === member.department?.id}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isSubmitting 
                  ? 'bg-[#00d084]/50 cursor-not-allowed' 
                  : 'bg-[#00d084] hover:bg-[#00b874]'
              }`}
            >
              {isSubmitting ? 'Assigning...' : 'Assign Department'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DeleteMemberModalProps {
  member: MemberWithDetails | null;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  member,
  onClose,
  onDelete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Failed to delete member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-xl font-semibold text-white mb-2">
            Delete Member
          </h3>
          <p className="text-sm text-[#808080]">
            Are you sure you want to delete this member? This action cannot be undone.
          </p>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-[#2a2a2a] rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d084] to-[#007a52] flex items-center justify-center text-white font-bold">
                {member.first_name?.charAt(0) || member.username?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="font-medium text-white">
                  {member.first_name && member.last_name 
                    ? `${member.first_name} ${member.last_name}`
                    : member.username
                  }
                </div>
                <div className="text-xs text-[#808080]">{member.email}</div>
              </div>
            </div>
            
            <div className="text-sm text-[#808080] space-y-1">
              <div>Department: {member.department?.dept_name || 'None'}</div>
              <div>Role: {member.role?.role_name || 'member'}</div>
              <div>Phone: {member.phone_number || 'Not provided'}</div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isSubmitting 
                  ? 'bg-[#e74c3c]/50 cursor-not-allowed' 
                  : 'bg-[#e74c3c] hover:bg-[#c0392b]'
              }`}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Member'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminMembersContent() {
  const { token } = useAuth();
  const [members, setMembers] = useState<MemberWithDetails[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMember, setSelectedMember] = useState<MemberWithDetails | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [filter, setFilter] = useState<'all' | 'new' | 'with-dept'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current || !token || hasFetchedRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      
      // Fetch all data in parallel
      const [membersData, departmentsData, tagsData, schoolsData] = await Promise.all([
        getMembers(token),
        getDepartments(token),
        getTags(token),
        getSchools(token)
      ]);

      // Format members with frontend user data
      const membersWithDetails: MemberWithDetails[] = membersData.map(member => ({
        ...member,
        frontendUser: formatFrontendUser(member)
      }));

      setMembers(membersWithDetails);
      setFilteredMembers(membersWithDetails);
      setDepartments(departmentsData);
      setTags(tagsData);
      setSchools(schoolsData);
      
      hasFetchedRef.current = true;
    } catch (error) {
      console.error('Failed to fetch members data:', error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && !hasFetchedRef.current) {
      const timeoutId = setTimeout(() => {
        fetchData();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
    
    return () => {
      isFetchingRef.current = false;
    };
  }, [token, fetchData]);

  // Apply filters
  useEffect(() => {
    let filtered = members;

    // Apply type filter
    if (filter === 'new') {
      filtered = filtered.filter(member => !member.department);
    } else if (filter === 'with-dept') {
      filtered = filtered.filter(member => member.department);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => {
        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
        return (
          fullName.includes(query) ||
          member.username.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          (member.department?.dept_name?.toLowerCase().includes(query) || false)
        );
      });
    }

    setFilteredMembers(filtered);
  }, [members, filter, searchQuery]);

  const handleAssignDepartment = async (memberId: number, departmentId: number | null) => {
    if (!token) return;

    try {
      await updateMember(token, memberId, {
        department_id: departmentId
      });

      // Update local state
      setMembers(prev => prev.map(member => {
        if (member.id === memberId) {
          const dept = departmentId 
            ? departments.find(d => d.id === departmentId)
            : null;
          return { ...member, department: dept };
        }
        return member;
      }));

      if (selectedMember?.id === memberId) {
        setSelectedMember(prev => prev ? {
          ...prev,
          department: departmentId 
            ? departments.find(d => d.id === departmentId) 
            : null
        } : null);
      }
    } catch (error) {
      console.error('Failed to assign department:', error);
      throw error;
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!token) return;

    try {
      await deleteMember(token, memberId);
      
      // Update local state
      setMembers(prev => prev.filter(member => member.id !== memberId));
      if (selectedMember?.id === memberId) {
        setSelectedMember(null);
      }
    } catch (error) {
      console.error('Failed to delete member:', error);
      throw error;
    }
  };

  const handleRefresh = () => {
    hasFetchedRef.current = false;
    fetchData();
  };

  const getMemberStats = () => {
    const total = members.length;
    const withDept = members.filter(m => m.department).length;
    const newMembers = total - withDept;

    return { total, withDept, newMembers };
  };

  const stats = getMemberStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CFC9D] mx-auto mb-4"></div>
          <p className="text-white">Loading members data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Member Management
          </h1>
          <p className="text-[#808080]">
            Manage all members, assign departments, and perform administrative actions
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-[#808080]">Total Members</div>
        </div>
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.withDept}</div>
          <div className="text-sm text-[#808080]">With Department</div>
        </div>
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{stats.newMembers}</div>
          <div className="text-sm text-[#808080]">New Members</div>
        </div>
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{departments.length}</div>
          <div className="text-sm text-[#808080]">Departments</div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search members by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#00d084]"
              />
              <svg 
                className="absolute right-3 top-2.5 w-5 h-5 text-[#808080]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' 
                  ? 'bg-[#00d084] text-white' 
                  : 'bg-[#2a2a2a] text-[#808080] hover:text-white'
              }`}
            >
              All Members
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'new' 
                  ? 'bg-[#e67e22] text-white' 
                  : 'bg-[#2a2a2a] text-[#808080] hover:text-white'
              }`}
            >
              New (No Dept)
            </button>
            <button
              onClick={() => setFilter('with-dept')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'with-dept' 
                  ? 'bg-[#3498db] text-white' 
                  : 'bg-[#2a2a2a] text-[#808080] hover:text-white'
              }`}
            >
              With Department
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-2">
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#3a3a3a]">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">
                  {filter === 'new' ? 'New Members' : 
                   filter === 'with-dept' ? 'Members with Department' : 
                   'All Members'} ({filteredMembers.length})
                </h2>
                <div className="text-sm text-[#808080]">
                  Showing {filteredMembers.length} of {members.length} members
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {filteredMembers.length > 0 ? (
                filteredMembers.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    isSelected={selectedMember?.id === member.id}
                    onSelect={() => setSelectedMember(member)}
                    onAssignDepartment={() => {
                      setSelectedMember(member);
                      setShowAssignModal(true);
                    }}
                    onDelete={() => {
                      setSelectedMember(member);
                      setShowDeleteModal(true);
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#808080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-5.201a5.5 5.5 0 00-7.5-4.85" />
                    </svg>
                  </div>
                  <p className="text-[#808080]">No members found</p>
                  {searchQuery && (
                    <p className="text-sm text-[#666] mt-1">
                      Try changing your search criteria
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Member Details */}
        <div className="lg:col-span-1">
          {selectedMember ? (
            <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00d084] to-[#007a52] flex items-center justify-center text-white font-bold text-2xl">
                  {selectedMember.first_name?.charAt(0) || selectedMember.username?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {selectedMember.first_name && selectedMember.last_name 
                      ? `${selectedMember.first_name} ${selectedMember.last_name}`
                      : selectedMember.username
                    }
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs bg-[#2a2a2a] rounded-full text-[#808080]">
                      {selectedMember.role?.role_name || 'member'}
                    </span>
                    {selectedMember.department && (
                      <span className="px-2 py-1 text-xs bg-[#00d084]/10 text-[#00d084] rounded-full">
                        {selectedMember.department.dept_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-[#808080] mb-1">Contact Information</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white">
                      <svg className="w-4 h-4 text-[#808080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">{selectedMember.email}</span>
                    </div>
                    {selectedMember.phone_number && (
                      <div className="flex items-center gap-2 text-white">
                        <svg className="w-4 h-4 text-[#808080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm">{selectedMember.phone_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-[#808080] mb-1">Academic Information</div>
                  <div className="space-y-2">
                    {selectedMember.school && (
                      <div className="text-white text-sm">
                        <span className="font-medium">School:</span> {selectedMember.school.school_name}
                      </div>
                    )}
                    {selectedMember.academic_level && (
                      <div className="text-white text-sm">
                        <span className="font-medium">Academic Level:</span> {selectedMember.academic_level}
                      </div>
                    )}
                  </div>
                </div>

                {selectedMember.tags && selectedMember.tags.length > 0 && (
                  <div>
                    <div className="text-sm text-[#808080] mb-2">Tags & Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedMember.tags.map(tag => (
                        <span 
                          key={tag.id}
                          className="px-2 py-1 text-xs rounded border border-[#3a3a3a] text-white"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            borderLeftColor: tag.color
                          }}
                        >
                          {tag.tag_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-[#808080] mb-2">Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-3 py-2 bg-[#00d084] hover:bg-[#00b874] text-white text-sm rounded transition-colors"
                    >
                      {selectedMember.department ? 'Change Dept' : 'Assign Dept'}
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-3 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-sm rounded transition-colors"
                    >
                      Delete Member
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#808080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-[#808080]">Select a member to view details</p>
              <p className="text-sm text-[#666] mt-1">
                Click on any member from the list
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAssignModal && selectedMember && (
        <AssignDepartmentModal
          member={selectedMember}
          departments={departments}
          onClose={() => setShowAssignModal(false)}
          onAssign={(deptId) => handleAssignDepartment(selectedMember.id!, deptId)}
        />
      )}

      {showDeleteModal && selectedMember && (
        <DeleteMemberModal
          member={selectedMember}
          onClose={() => setShowDeleteModal(false)}
          onDelete={() => handleDeleteMember(selectedMember.id!)}
        />
      )}
    </div>
  );
}