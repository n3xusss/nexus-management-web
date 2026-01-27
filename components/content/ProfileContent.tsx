"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/stores/authStore";
import {
  getTags,
  getSchools,
  createCustomSchool,
  BackendUser,
} from "../../lib/api";

export default function ProfileContent() {
  const { user, updateProfile, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tagsList, setTagsList] = useState<
    Array<{ id: number; tag_name: string; color: string }>
  >([]);
  const [schoolsList, setSchoolsList] = useState<
    Array<{ id: number; school_name: string; school_description: string }>
  >([]);
  const [formData, setFormData] = useState({
    username: user?.name || "",
    phone_number: user?.phoneNumber || "",
    academic_level: user?.academicLevel || "",
    tag_ids: user?.tags?.map((tag) => tag.id) || [],
    school_id: user?.school?.id ? user.school.id.toString() : "",
  });
  const [customSchoolName, setCustomSchoolName] = useState("");
  const [showCustomSchool, setShowCustomSchool] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.image || null,
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    fetchTagsAndSchools();
  }, []);

  const fetchTagsAndSchools = async () => {
    try {
      const [tags, schools] = await Promise.all([
        getTags(token),
        getSchools(token),
      ]);
      setTagsList(tags);
      setSchoolsList(schools);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagToggle = (tagId: number) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleCreateCustomSchool = async () => {
    if (!customSchoolName.trim() || !token) return;

    try {
      setLoading(true);
      const newSchool = await createCustomSchool(customSchoolName, token);
      setSchoolsList((prev) => [
        ...prev,
        { ...newSchool, school_description: "" },
      ]);
      setFormData((prev) => ({
        ...prev,
        school_id: String(newSchool.id),
      }));
      setCustomSchoolName("");
      setShowCustomSchool(false);
    } catch (error) {
      console.error("Failed to create school:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const data = new FormData();

      // Add text fields
      if (formData.username) data.append("username", formData.username);
      if (formData.phone_number)
        data.append("phone_number", formData.phone_number);
      if (formData.academic_level)
        data.append("academic_level", formData.academic_level);
      if (formData.school_id)
        data.append("school_id", formData.school_id.toString());

      // Add tag IDs - FormData handles arrays differently
      formData.tag_ids.forEach((tagId) => {
        data.append("tag_ids", tagId.toString());
      });

      // Handle image
      if (selectedImage) {
        data.append("image", selectedImage);
      } else if (imagePreview === null && user?.image) {
        // If image was removed
        data.append("image", "");
      }

      // Log FormData contents

      const result = await updateProfile(data);
      setIsEditing(false);

      // Refresh tags and schools in case new ones were created
      await fetchTagsAndSchools();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      username: user?.name || "",
      phone_number: user?.phoneNumber || "",
      academic_level: user?.academicLevel || "",
      tag_ids: user?.tags?.map((tag) => tag.id) || [],
      school_id: user?.school?.id ? user.school.id.toString() : "",
    });
    setImagePreview(user?.image || null);
    setSelectedImage(null);
    setCustomSchoolName("");
    setShowCustomSchool(false);
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.name) {
      return user.name.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getJoinDate = () => {
    return "December 2024";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-[#808080]">
              View and manage your personal information
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-[#00d084] to-[#00a66c] hover:from-[#00e894] hover:to-[#00c07a] text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                ></path>
              </svg>
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-[#00d084] to-[#00a66c] hover:from-[#00e894] hover:to-[#00c07a] text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Overview */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Information Card */}
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              Personal Information
            </h2>

            <div className="space-y-6">
              {/* Profile Image Section */}
              <div className="flex items-start gap-6">
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#00d084] shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00d084] to-[#007a52] flex items-center justify-center border-2 border-[#3a3a3a] shadow-lg">
                      <span className="text-white text-2xl font-bold">
                        {getUserInitials()}
                      </span>
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2 flex gap-2">
                      <label className="cursor-pointer bg-[#2a2a2a] hover:bg-[#3a3a3a] p-2 rounded-full shadow-lg">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          ></path>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          ></path>
                        </svg>
                      </label>
                      {imagePreview && (
                        <button
                          onClick={handleRemoveImage}
                          className="bg-[#e74c3c] hover:bg-[#c0392b] p-2 rounded-full shadow-lg"
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {user?.name}
                  </h3>
                  <p className="text-[#808080] mb-4">{user?.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#2a2a2a] text-[#00d084] text-xs font-semibold px-3 py-1 rounded-full">
                      {user?.role}
                    </span>
                    {user?.department && (
                      <span className="bg-[#2a2a2a] text-[#808080] text-xs font-semibold px-3 py-1 rounded-full">
                        {user.department.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Read-only Fields */}
                <div className="space-y-2">
                  <label className="text-sm text-[#808080]">Email</label>
                  <div className="bg-[#2a2a2a] rounded-lg p-3 text-white">
                    {user?.email}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#808080]">Role</label>
                  <div className="bg-[#2a2a2a] rounded-lg p-3 text-white capitalize">
                    {user?.role}
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-2">
                  <label className="text-sm text-[#808080]">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 text-white focus:outline-none focus:border-[#00d084] transition-colors"
                      placeholder="Enter username"
                    />
                  ) : (
                    <div className="bg-[#2a2a2a] rounded-lg p-3 text-white">
                      {user?.name || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#808080]">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 text-white focus:outline-none focus:border-[#00d084] transition-colors"
                      placeholder="0612345678"
                      pattern="0[567][0-9]{8}"
                    />
                  ) : (
                    <div className="bg-[#2a2a2a] rounded-lg p-3 text-white">
                      {user?.phoneNumber || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#808080]">
                    Academic Level
                  </label>
                  {isEditing ? (
                    <select
                      name="academic_level"
                      value={formData.academic_level}
                      onChange={handleInputChange}
                      className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 text-white focus:outline-none focus:border-[#00d084] transition-colors"
                    >
                      <option value="">Select level</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                      <option value="PhD">PhD</option>
                    </select>
                  ) : (
                    <div className="bg-[#2a2a2a] rounded-lg p-3 text-white">
                      {user?.academicLevel || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#808080]">Department</label>
                  <div className="bg-[#2a2a2a] rounded-lg p-3 text-white">
                    {user?.department?.name || "Not assigned"}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#808080]">Member Since</label>
                  <div className="bg-[#2a2a2a] rounded-lg p-3 text-white">
                    {getJoinDate()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                ></path>
              </svg>
              Interests & Skills
            </h2>

            {isEditing ? (
              <div className="space-y-4">
                <p className="text-[#808080] text-sm">
                  Select tags that represent your interests and skills:
                </p>
                <div className="flex flex-wrap gap-2">
                  {tagsList.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        formData.tag_ids.includes(tag.id)
                          ? "border-2 border-opacity-50 shadow-lg transform scale-105"
                          : "border border-[#3a3a3a] hover:border-opacity-50"
                      }`}
                      style={{
                        backgroundColor: `${tag.color}20`,
                        borderColor: tag.color,
                        color: formData.tag_ids.includes(tag.id)
                          ? "#fff"
                          : tag.color,
                      }}
                    >
                      {tag.tag_name}
                      {formData.tag_ids.includes(tag.id) && (
                        <span className="ml-2">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                {tagsList.length === 0 && (
                  <p className="text-[#808080] text-sm">
                    No tags available. Contact admin to add tags.
                  </p>
                )}
              </div>
            ) : (
              <div>
                {user?.tags && user.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-4 py-2 rounded-full text-sm font-medium border"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color,
                        }}
                      >
                        {tag.tag_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#808080]">No tags added yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - School & Additional Info */}
        <div className="space-y-8">
          {/* School Information */}
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                ></path>
              </svg>
              School Information
            </h2>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#808080]">
                    Select School
                  </label>
                  <select
                    name="school_id"
                    value={formData.school_id || ""}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 text-white focus:outline-none focus:border-[#00d084] transition-colors"
                  >
                    <option value="">Select a school</option>
                    {schoolsList.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.school_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomSchool(!showCustomSchool)}
                    className="text-[#00d084] hover:text-[#00e894] text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      ></path>
                    </svg>
                    {showCustomSchool ? "Cancel" : "Add Custom School"}
                  </button>

                  {showCustomSchool && (
                    <div className="space-y-3 pt-3 border-t border-[#3a3a3a]">
                      <input
                        type="text"
                        value={customSchoolName}
                        onChange={(e) => setCustomSchoolName(e.target.value)}
                        placeholder="Enter school name"
                        className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 text-white focus:outline-none focus:border-[#00d084] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCustomSchool}
                        disabled={!customSchoolName.trim() || loading}
                        className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] hover:border-[#00d084] text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Creating..." : "Add School"}
                      </button>
                    </div>
                  )}
                </div>

                {formData.school_id &&
                  schoolsList.find(
                    (s) => s.id.toString() === formData.school_id,
                  ) && (
                    <div className="mt-4 p-3 bg-[#2a2a2a] rounded-lg">
                      <p className="text-sm text-[#808080]">Selected School:</p>
                      <p className="text-white font-medium">
                        {
                          schoolsList.find(
                            (s) => s.id.toString() === formData.school_id,
                          )?.school_name
                        }
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div>
                {user?.school ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-[#2a2a2a] rounded-lg">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {user.school.name}
                      </h3>
                      <p className="text-sm text-[#808080]">
                        {user.school.description}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#808080]">No school information added.</p>
                )}
              </div>
            )}
          </div>

          {/* Account Stats */}
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                ></path>
              </svg>
              Account Overview
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-[#2a2a2a] rounded-lg">
                <div>
                  <p className="text-sm text-[#808080]">Account Status</p>
                  <p className="text-white font-medium">Active</p>
                </div>
                <span className="w-2 h-2 bg-[#00d084] rounded-full"></span>
              </div>

              <div className="flex justify-between items-center p-3 bg-[#2a2a2a] rounded-lg">
                <div>
                  <p className="text-sm text-[#808080]">Profile Completion</p>
                  <p className="text-white font-medium">
                    {user?.firstName && user?.lastName ? "100%" : "50%"}
                  </p>
                </div>
                <div className="w-16 bg-[#3a3a3a] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#00d084] to-[#00a66c] h-2 rounded-full transition-all duration-500"
                    style={{
                      width: user?.firstName && user?.lastName ? "100%" : "50%",
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-[#2a2a2a] rounded-lg">
                <div>
                  <p className="text-sm text-[#808080]">Last Updated</p>
                  <p className="text-white font-medium">Today</p>
                </div>
                <svg
                  className="w-5 h-5 text-[#808080]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
