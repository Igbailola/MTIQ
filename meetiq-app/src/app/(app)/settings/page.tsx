'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentWorkspace, useUpdateWorkspace, useDeleteWorkspace } from '@/hooks/use-workspace';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Camera, Loader2, Settings, User, Trash2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'EST / America/New_York' },
  { value: 'America/Chicago', label: 'CST / America/Chicago' },
  { value: 'America/Denver', label: 'MST / America/Denver' },
  { value: 'America/Los_Angeles', label: 'PST / America/Los_Angeles' },
  { value: 'Europe/London', label: 'GMT / Europe/London' },
  { value: 'Europe/Paris', label: 'CET / Europe/Paris' },
  { value: 'Asia/Tokyo', label: 'JST / Asia/Tokyo' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { currentWorkspace, refreshWorkspaces } = useCurrentWorkspace();
  const supabase = createClient();

  const updateWorkspaceMutation = useUpdateWorkspace(currentWorkspace?.id || '');
  const deleteWorkspaceMutation = useDeleteWorkspace(currentWorkspace?.id || '');

  // Form states
  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const [profileSaving, setProfileSaving] = useState(false);

  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || '');
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceDeleting, setWorkspaceDeleting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Account deletion states
  const [accountDeleteDialogOpen, setAccountDeleteDialogOpen] = useState(false);
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('');
  const [accountDeleting, setAccountDeleting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'workspace') {
      setActiveTab('workspace');
    }
  }, []);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const workspaceUrl = currentWorkspace?.name
    ? `https://meetiq/${currentWorkspace.name.toLowerCase().replace(/\s+/g, '-')}`
    : '';

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setTimezone(profile.timezone || 'UTC');
    }
  }, [profile]);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceName(currentWorkspace.name || '');
    }
  }, [currentWorkspace]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }
    setProfileSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          timezone,
        })
        .eq('id', user?.id);

      if (error) {
        toast.error(error.message);
      } else {
        await refreshProfile();
        toast.success('Profile settings updated successfully');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      await refreshProfile();
      toast.success('Profile photo updated');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload profile photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleWorkspaceSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error('Workspace name is required');
      return;
    }
    setWorkspaceSaving(true);
    try {
      await updateWorkspaceMutation.mutateAsync({ name: workspaceName });
    } catch (err) {
      console.error(err);
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const handleWorkspaceDelete = () => {
    setDeleteConfirmText('');
    setDeleteDialogOpen(true);
  };

  const confirmWorkspaceDelete = async () => {
    const confirmString = `delete ${currentWorkspace?.name}`;
    if (deleteConfirmText !== confirmString) {
      toast.error('Confirmation text did not match. Please type the exact phrase.');
      return;
    }

    setDeleteDialogOpen(false);
    setWorkspaceDeleting(true);
    try {
      await deleteWorkspaceMutation.mutateAsync();
      
      // Fetch fresh list of workspaces to check if any are left
      const res = await fetch('/api/workspaces');
      const workspaces = await res.json();
      
      await refreshWorkspaces();
      
      if (workspaces && workspaces.length > 0) {
        // Set the first remaining workspace as the active one
        localStorage.setItem('meetiq_current_workspace', workspaces[0].id);
        toast.success(`Switched to workspace "${workspaces[0].name}"`);
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/onboarding');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWorkspaceDeleting(false);
    }
  };

  const handleAccountDelete = () => {
    setDeleteAccountConfirmText('');
    setAccountDeleteDialogOpen(true);
  };

  const confirmAccountDelete = async () => {
    if (deleteAccountConfirmText !== 'delete my account') {
      toast.error('Confirmation text did not match. Please type "delete my account".');
      return;
    }

    setAccountDeleteDialogOpen(false);
    setAccountDeleting(true);
    try {
      const res = await fetch('/api/profile/delete', { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      toast.success('Your account has been deleted successfully.');
      await signOut();
      router.push('/register');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setAccountDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-body max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Manage your personal profile and workspace configurations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="flex w-full sm:w-auto h-9 bg-slate-100 p-1.5 rounded-lg max-w-[400px] gap-1 items-stretch overflow-x-auto">
          <TabsTrigger value="profile" className="rounded-md px-3 text-xs font-semibold gap-2">
            <User className="h-4 w-4 shrink-0" />
            <span>Profile Settings</span>
          </TabsTrigger>
          <TabsTrigger value="workspace" className="rounded-md px-3 text-xs font-semibold gap-2">
            <Settings className="h-4 w-4 shrink-0" />
            <span>Workspace Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-sm font-heading font-semibold text-primary">Personal Profile</CardTitle>
              <CardDescription>Update your public display name and default timezone.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleProfileSave} className="space-y-4">
                {/* Profile Image */}
                <div className="flex items-center gap-4 pb-2">
                  <Avatar size="lg">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-base bg-slate-100">
                      {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <label
                      htmlFor="avatarUpload"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 cursor-pointer"
                    >
                      {avatarUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      {avatarUploading ? 'Uploading...' : 'Change Photo'}
                    </label>
                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF. 2MB max.</p>
                    <input
                      id="avatarUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={avatarUploading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profName">Display Name</Label>
                  <Input
                    id="profName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Sarah Chen"
                    disabled={profileSaving}
                    required
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profTimezone">Default Timezone</Label>
                  <Select value={timezone} onValueChange={(val) => setTimezone(val ?? '')} disabled={profileSaving}>
                    <SelectTrigger id="profTimezone" className="bg-white">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="w-full sm:min-w-[260px]">
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={profileSaving} className="h-12 gap-2 px-6">
                    {profileSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-base">Saving...</span>
                      </>
                    ) : (
                      <span className="text-base">Save Changes</span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-red-200 bg-red-50/5 shadow-meetiq-xs">
            <CardHeader className="pb-3 border-b border-red-100">
              <CardTitle className="text-sm font-heading font-semibold text-red-800 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-700/80">
                Irreversible settings that permanently destroy your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-red-950">Delete Account</h4>
                <p className="text-sm text-red-700">
                  Permanently delete your profile, owned workspaces, and all associated meeting data.
                </p>
              </div>
              <Button
                variant="destructive"
                className="shrink-0 text-sm py-2.5 px-3.5 h-auto bg-red-600 hover:bg-red-700 text-white"
                onClick={handleAccountDelete}
                disabled={accountDeleting}
              >
                {accountDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Account
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Dialog open={accountDeleteDialogOpen} onOpenChange={setAccountDeleteDialogOpen}>
            <DialogContent showCloseButton={false} className="sm:max-w-lg gap-0 p-0">
              <DialogHeader className="px-10 pt-10 pb-0">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-5">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <DialogTitle className="text-center text-lg font-heading font-semibold">
                  Delete Account
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground px-4 pt-2 leading-relaxed">
                  This action is <strong>permanent</strong> and cannot be undone. It will delete your profile, workspaces you own, and all related records.
                </DialogDescription>
              </DialogHeader>
              <div className="px-10 pt-8 pb-6">
                <Label htmlFor="deleteAccountConfirm" className="text-sm text-muted-foreground block mb-3">
                  Type <span className="font-mono font-semibold text-foreground">delete my account</span> to confirm:
                </Label>
                <Input
                  id="deleteAccountConfirm"
                  value={deleteAccountConfirmText}
                  onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
                  placeholder="delete my account"
                  className="h-12 text-base px-4"
                />
              </div>
              <DialogFooter className="px-10 pb-10 pt-0 border-t-0 gap-3 bg-transparent">
                <Button
                  variant="outline"
                  onClick={() => { setAccountDeleteDialogOpen(false); setDeleteAccountConfirmText(''); }}
                  className="flex-1 h-12 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmAccountDelete}
                  disabled={deleteAccountConfirmText !== 'delete my account' || accountDeleting}
                  className="flex-1 h-12 text-sm bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-6">
          {currentWorkspace ? (
            <>
              <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
                <CardHeader className="pb-3 border-b border-slate-50">
                  <CardTitle className="text-sm font-heading font-semibold text-primary">Workspace Profile</CardTitle>
                  <CardDescription>Change the branding name of the active workspace.</CardDescription>
                </CardHeader>
                <CardContent className="p-3">
                  <form onSubmit={handleWorkspaceSave} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wsNameEdit">Workspace Name</Label>
                      <Input
                        id="wsNameEdit"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="e.g. Engineering Team"
                        disabled={workspaceSaving}
                        required
                        className="h-10 py-1.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="wsUrlEdit">Workspace URL</Label>
                      <Input
                        id="wsUrlEdit"
                        value={workspaceUrl}
                        disabled
                        className="h-10 py-1.5 bg-slate-50 text-muted-foreground"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={workspaceSaving} className="h-12 gap-2 px-6">
                        {workspaceSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-base">Updating...</span>
                          </>
                        ) : (
                          <span className="text-base">Update Workspace</span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border border-red-200 bg-red-50/5 shadow-meetiq-xs">
                <CardHeader className="pb-3 border-b border-red-100">
                  <CardTitle className="text-sm font-heading font-semibold text-red-800 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-red-700/80">
                    Irreversible settings that destroy active workspace resource items.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-red-950">Delete Workspace</h4>
                    <p className="text-sm text-red-700">
                      Deletes all meetings transcripts, extracted decisions, and commitments for all members.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="shrink-0 text-sm py-2.5 px-3.5 h-auto bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleWorkspaceDelete}
                    disabled={workspaceDeleting}
                  >
                    {workspaceDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Workspace
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent showCloseButton={false} className="sm:max-w-lg gap-0 p-0">
                  <DialogHeader className="px-10 pt-10 pb-0">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-5">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-lg font-heading font-semibold">
                      Delete Workspace
                    </DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground px-4 pt-2 leading-relaxed">
                      This action is <strong>permanent</strong> and will delete all meetings, commitments, decisions, and activity logs for <strong>{currentWorkspace?.name}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="px-10 pt-8 pb-6">
                    <Label htmlFor="deleteConfirm" className="text-sm text-muted-foreground block mb-3">
                      Type <span className="font-mono font-semibold text-foreground">delete {currentWorkspace?.name}</span> to confirm:
                    </Label>
                    <Input
                      id="deleteConfirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={`delete ${currentWorkspace?.name}`}
                      className="h-12 text-base px-4"
                    />
                  </div>
                  <DialogFooter className="px-10 pb-10 pt-0 border-t-0 gap-3 bg-transparent">
                    <Button
                      variant="outline"
                      onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(''); }}
                      className="flex-1 h-12 text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmWorkspaceDelete}
                      disabled={deleteConfirmText !== `delete ${currentWorkspace?.name}` || workspaceDeleting}
                      className="flex-1 h-12 text-sm bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete Workspace
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-slate-50">
              No workspace active. Create a workspace in onboarding first.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
