'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentWorkspace, useUpdateWorkspace, useDeleteWorkspace } from '@/hooks/use-workspace';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { User, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProfileSettingsSection } from '@/features/settings/components/profile-settings-section';
import { WorkspaceSettingsSection } from '@/features/settings/components/workspace-settings-section';
import { logger } from '@/lib/logger';

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

  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'UTC');
  const [profileSaving, setProfileSaving] = useState(false);

  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || '');
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceDeleting, setWorkspaceDeleting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [accountDeleteDialogOpen, setAccountDeleteDialogOpen] = useState(false);
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('');
  const [accountDeleting, setAccountDeleting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'workspace') {
      setActiveTab('workspace');
    }
  }, []);

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

  const workspaceUrl = currentWorkspace?.name
    ? `https://meetiq/${currentWorkspace.name.toLowerCase().replace(/\s+/g, '-')}`
    : '';

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
        .update({ display_name: displayName, timezone })
        .eq('id', user?.id);

      if (error) {
        toast.error(error.message);
      } else {
        await refreshProfile();
        toast.success('Profile settings updated successfully');
      }
    } catch (err) {
      logger.error('Error occurred', err);
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
      logger.error('Error occurred', err);
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
      logger.error('Error occurred', err);
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

      const res = await fetch('/api/workspaces');
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      const workspaces = await res.json();

      await refreshWorkspaces();

      if (workspaces && workspaces.length > 0) {
        localStorage.setItem('meetiq_current_workspace', workspaces[0].id);
        toast.success(`Switched to workspace "${workspaces[0].name}"`);
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/onboarding');
      }
    } catch (err) {
      logger.error('Error occurred', err);
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
    } catch (err: unknown) {
      logger.error('Error occurred', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setAccountDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-body max-w-4xl">
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
          <ProfileSettingsSection
            profile={profile}
            displayName={displayName}
            timezone={timezone}
            profileSaving={profileSaving}
            avatarUploading={avatarUploading}
            timezoneOptions={TIMEZONES}
            accountDeleteDialogOpen={accountDeleteDialogOpen}
            deleteAccountConfirmText={deleteAccountConfirmText}
            accountDeleting={accountDeleting}
            onDisplayNameChange={setDisplayName}
            onTimezoneChange={setTimezone}
            onProfileSave={handleProfileSave}
            onAvatarUpload={handleAvatarUpload}
            onAccountDelete={handleAccountDelete}
            onConfirmAccountDelete={confirmAccountDelete}
            onCancelAccountDelete={() => { setAccountDeleteDialogOpen(false); setDeleteAccountConfirmText(''); }}
            onDeleteAccountConfirmTextChange={setDeleteAccountConfirmText}
          />
        </TabsContent>

        <TabsContent value="workspace" className="space-y-6">
          <WorkspaceSettingsSection
            workspace={currentWorkspace}
            workspaceName={workspaceName}
            workspaceUrl={workspaceUrl}
            workspaceSaving={workspaceSaving}
            workspaceDeleting={workspaceDeleting}
            deleteDialogOpen={deleteDialogOpen}
            deleteConfirmText={deleteConfirmText}
            onWorkspaceNameChange={setWorkspaceName}
            onWorkspaceSave={handleWorkspaceSave}
            onWorkspaceDelete={handleWorkspaceDelete}
            onConfirmWorkspaceDelete={confirmWorkspaceDelete}
            onCancelWorkspaceDelete={() => { setDeleteDialogOpen(false); setDeleteConfirmText(''); }}
            onDeleteConfirmTextChange={setDeleteConfirmText}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
