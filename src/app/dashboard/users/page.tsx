'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCheck,
  UserX,
  Search,
  Shield,
  PlusCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { apiFetch } from '@/lib/api-client';
import Link from 'next/link';

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // User Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // User Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    roleId: '',
    active: true,
  });

  // Role Modal state
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: {
      canCreateBills: true,
      canViewStock: true,
      canManageProducts: false,
      canDeleteProducts: false,
      canRecordStockIn: false,
      canViewCostAndProfit: false,
      canViewReports: false,
      canManageUsers: false,
      canApplyDiscount: true,
      canRecordPayments: true,
    } as Record<string, boolean>,
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await apiFetch('/api/admin/users');
      setUsersList(data.users || []);
      setRolesList(data.roles || []);
      setCurrentUserId(data.currentUserId || '');
    } catch (err: any) {
      console.error('Failed to fetch users data:', err);
      setErrorMsg(err?.message || 'Access Denied: User Management is restricted to Administrators only.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      roleId: rolesList.length > 0 ? rolesList[0].id : '',
      active: true,
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (u: any) => {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      username: u.username,
      password: '',
      roleId: u.role?.id || (rolesList.length > 0 ? rolesList[0].id : ''),
      active: u.active,
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowAddModal(false);
      setSuccessToast(`User "${formData.name}" created successfully!`);
      setTimeout(() => setSuccessToast(''), 4000);
      await fetchUsersData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setFormError('');
    try {
      await apiFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setShowEditModal(false);
      setSuccessToast(`Updated user "${formData.name}" successfully!`);
      setTimeout(() => setSuccessToast(''), 4000);
      await fetchUsersData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserActive = async (u: any) => {
    if (u.id === currentUserId) {
      alert('You cannot deactivate your own active admin account.');
      return;
    }
    try {
      await apiFetch(`/api/admin/users/${u.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !u.active }),
      });
      setSuccessToast(`Account status updated for "${u.name}".`);
      setTimeout(() => setSuccessToast(''), 3000);
      await fetchUsersData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (u.id === currentUserId) {
      alert('You cannot delete your own active admin account.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete user "${u.name}" (@${u.username})?`)) {
      return;
    }

    try {
      await apiFetch(`/api/admin/users/${u.id}`, {
        method: 'DELETE',
      });
      setSuccessToast(`User "${u.name}" deleted.`);
      setTimeout(() => setSuccessToast(''), 3000);
      await fetchUsersData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete user');
    }
  };

  // Role Management handlers
  const handleOpenAddRoleModal = () => {
    setRoleFormData({
      name: '',
      description: '',
      permissions: {
        canCreateBills: true,
        canViewStock: true,
        canManageProducts: false,
        canDeleteProducts: false,
        canRecordStockIn: false,
        canViewCostAndProfit: false,
        canViewReports: false,
        canManageUsers: false,
        canApplyDiscount: true,
        canRecordPayments: true,
      },
    });
    setFormError('');
    setShowAddRoleModal(true);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await apiFetch('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(roleFormData),
      });
      setShowAddRoleModal(false);
      setSuccessToast(`New Role "${roleFormData.name}" created successfully!`);
      setTimeout(() => setSuccessToast(''), 4000);
      await fetchUsersData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: any) => {
    if (!confirm(`Are you sure you want to delete custom role "${role.name}"?`)) {
      return;
    }
    try {
      await apiFetch(`/api/admin/roles/${role.id}`, {
        method: 'DELETE',
      });
      setSuccessToast(`Role "${role.name}" deleted.`);
      setTimeout(() => setSuccessToast(''), 3000);
      await fetchUsersData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete role');
    }
  };

  const handleToggleRolePermission = async (roleId: string, permKey: string, currentValue: boolean) => {
    try {
      await apiFetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ [permKey]: !currentValue }),
      });
      setSuccessToast('Updated role permissions successfully!');
      setTimeout(() => setSuccessToast(''), 3000);
      await fetchUsersData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update role permissions');
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.role?.name || '').toLowerCase().includes(q)
    );
  });

  if (errorMsg) {
    return (
      <div className="py-16 px-4 text-center space-y-4 max-w-md mx-auto">
        <div className="inline-flex p-4 rounded-3xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-sm text-gray-500">{errorMsg}</p>
        <Link href="/dashboard">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs mt-2">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-app-text)]">
              User Management & Access Control
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Add staff accounts, update passwords, and configure granular role permissions
            </p>
          </div>
        </div>

        {/* Primary Header Action */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'users' ? (
            <Button
              onClick={handleOpenAddModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md px-4 py-2 rounded-xl"
            >
              <UserPlus className="w-4 h-4" />
              Add New User
            </Button>
          ) : (
            <Button
              onClick={handleOpenAddRoleModal}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md px-4 py-2 rounded-xl"
            >
              <PlusCircle className="w-4 h-4" />
              Add New Role
            </Button>
          )}
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs (Users List vs Role Permissions Matrix) */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Store Users ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'permissions'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Role Permissions Matrix ({rolesList.length})
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <Card className="shadow-xs border-gray-200 bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-5 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search user by name, username, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400 text-xs">Loading store users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No users found matching "{searchQuery}"
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((u) => {
                        const isSelf = u.id === currentUserId;
                        const roleName = u.role?.name || 'No Role';
                        const isAdminRole = roleName.toLowerCase().includes('admin');

                        return (
                          <tr key={u.id} className="hover:bg-gray-50/70">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${
                                  isAdminRole ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                                    {u.name}
                                    {isSelf && (
                                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">
                                        You
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[11px] text-gray-400 font-mono">@{u.username}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                isAdminRole
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {roleName}
                              </span>
                            </td>

                            <td className="px-4 py-3.5">
                              {u.active ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" /> Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200 inline-flex items-center gap-1">
                                  <UserX className="w-3 h-3" /> Inactive
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-gray-500 font-mono text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString('en-IN')}
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditModal(u)}
                                  className="h-8 px-2.5 text-[11px] text-gray-700 hover:bg-gray-100 cursor-pointer"
                                  title="Edit User & Password"
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1 text-gray-500" /> Edit
                                </Button>

                                {!isSelf && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleToggleUserActive(u)}
                                      className={`h-8 px-2.5 text-[11px] cursor-pointer ${
                                        u.active
                                          ? 'text-amber-700 hover:bg-amber-50 border-amber-200'
                                          : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                                      }`}
                                      title={u.active ? 'Deactivate Account' : 'Activate Account'}
                                    >
                                      {u.active ? 'Deactivate' : 'Activate'}
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteUser(u)}
                                      className="h-8 px-2 text-[11px] text-red-600 hover:bg-red-50 border-red-200 cursor-pointer"
                                      title="Delete Account"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards List View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUserId;
                    const roleName = u.role?.name || 'No Role';
                    const isAdminRole = roleName.toLowerCase().includes('admin');

                    return (
                      <div key={u.id} className="py-3.5 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center ${
                              isAdminRole ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200">
                                    You
                                  </span>
                                )}
                              </h4>
                              <span className="text-[10px] text-gray-400 font-mono block">@{u.username}</span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isAdminRole
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {roleName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {u.active ? (
                            <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                              ● Active Account
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-red-600 flex items-center gap-1">
                              ● Inactive Account
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(u)}
                              className="h-7 px-2 text-[10px] text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                              Edit Profile
                            </Button>

                            {!isSelf && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(u)}
                                className="h-7 px-2 text-[10px] text-red-600 hover:bg-red-50 border-red-200 cursor-pointer"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: ROLE PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Permission controls helper card */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Understanding Role Permissions Controls:</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                • <strong>View Stock Inventory (<code className="font-mono text-emerald-900 font-bold">canViewStock</code>)</strong>: Controls whether a user role can see products and consignments list.<br />
                • <strong>Record Stock-In (<code className="font-mono text-emerald-900 font-bold">canRecordStockIn</code>)</strong>: Controls whether a role can add new inbound shipments.<br />
                • <strong>View Cost & Profit (<code className="font-mono text-emerald-900 font-bold">canViewCostAndProfit</code>)</strong>: Controls whether unit costs and profit margins are visible to that role.
              </p>
            </div>
          </div>

          {rolesList.map((role) => {
            const isCoreRole = role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'super admin';

            const permissionConfigs: { key: string; label: string; desc: string }[] = [
              { key: 'canCreateBills', label: 'Create POS Bills', desc: 'Allow generating outbound bills & POS checkout' },
              { key: 'canViewStock', label: 'View Stock Inventory & Consignments', desc: 'View products list and consignments history' },
              { key: 'canManageProducts', label: 'Manage Products', desc: 'Add or edit product details and prices' },
              { key: 'canDeleteProducts', label: 'Delete Products', desc: 'Delete products from store catalog' },
              { key: 'canRecordStockIn', label: 'Record Stock-In', desc: 'Create inbound purchase consignments' },
              { key: 'canViewCostAndProfit', label: 'View Cost & Profit', desc: 'View cost prices and net profit margins' },
              { key: 'canViewReports', label: 'View Analytics & Reports', desc: 'Access comprehensive reports and analytics' },
              { key: 'canManageUsers', label: 'Manage Users & Permissions', desc: 'Create users, reset passwords, grant permissions' },
              { key: 'canApplyDiscount', label: 'Apply Discounts', desc: 'Apply item or bill discounts during POS checkout' },
              { key: 'canRecordPayments', label: 'Record Due Payments', desc: 'Record partial or settlement payments on bills' },
            ];

            return (
              <Card key={role.id} className="shadow-xs border-gray-200 bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          {role.name} Role
                          {isCoreRole && (
                            <span className="px-2 py-0.2 text-[9px] font-bold bg-purple-50 text-purple-700 rounded border border-purple-200">
                              System Core Role
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-gray-500">{role.description || 'Custom defined user permissions'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCoreRole && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRole(role)}
                          className="h-7 px-2.5 text-[10px] text-red-600 hover:bg-red-50 border-red-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Role
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissionConfigs.map((cfg) => {
                      const enabled = Boolean(role[cfg.key]);

                      return (
                        <div
                          key={cfg.key}
                          onClick={() => handleToggleRolePermission(role.id, cfg.key, enabled)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            enabled
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-gray-50/60 border-gray-200 text-gray-500'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold block">{cfg.label}</span>
                            <span className="text-[10px] text-gray-500 block">{cfg.desc}</span>
                          </div>

                          <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${
                            enabled ? 'bg-emerald-600 justify-end' : 'bg-gray-300 justify-start'
                          }`}>
                            <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD NEW ROLE */}
      <AnimatePresence>
        {showAddRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-r from-purple-500/10 to-transparent border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-600 text-white rounded-xl">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Create Custom Role</h3>
                    <p className="text-[11px] text-gray-500">Define custom permissions for staff</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddRoleModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRole} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Role Name</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Store Manager, Inventory Supervisor"
                    value={roleFormData.name}
                    onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Description</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Handles inventory receiving and staff scheduling"
                    value={roleFormData.description}
                    onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold text-gray-900 block">Initial Permissions:</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'canCreateBills', label: 'Create POS Bills' },
                      { key: 'canViewStock', label: 'View Stock & Consignments' },
                      { key: 'canManageProducts', label: 'Manage Products' },
                      { key: 'canDeleteProducts', label: 'Delete Products' },
                      { key: 'canRecordStockIn', label: 'Record Inbound Stock-In' },
                      { key: 'canViewCostAndProfit', label: 'View Cost & Profit' },
                      { key: 'canViewReports', label: 'View Store Analytics' },
                      { key: 'canManageUsers', label: 'Manage Users & Roles' },
                      { key: 'canApplyDiscount', label: 'Apply Discounts' },
                      { key: 'canRecordPayments', label: 'Record Due Payments' },
                    ].map((p) => (
                      <label key={p.key} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={Boolean(roleFormData.permissions[p.key])}
                          onChange={(e) =>
                            setRoleFormData({
                              ...roleFormData,
                              permissions: {
                                ...roleFormData.permissions,
                                [p.key]: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                        />
                        <span className="text-xs font-medium text-gray-800">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddRoleModal(false)}
                    className="text-xs text-gray-600"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={saving}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4"
                  >
                    {saving ? 'Creating...' : 'Create Role'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD NEW USER */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Add New User</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Full Name</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Username</Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. johndoe"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Password</Label>
                  <Input
                    type="password"
                    required
                    placeholder="Set user password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Role</Label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} - {r.description || 'Standard User'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-gray-700">Account Active</span>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                    className="text-xs text-gray-600"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={saving}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4"
                  >
                    {saving ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT USER & RESET PASSWORD */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Edit User Details</h3>
                    <p className="text-[11px] text-gray-500">@{selectedUser.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2 border border-red-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Full Name</Label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Username</Label>
                  <Input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    New Password <span className="text-gray-400 font-normal">(Leave blank to keep unchanged)</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter new password if changing"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Role</Label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} - {r.description || 'Standard User'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-gray-700">Account Active</span>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditModal(false)}
                    className="text-xs text-gray-600"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={saving}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
