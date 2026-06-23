'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Loader2, ShieldAlert, AlertTriangle, Trash2 } from 'lucide-react';

interface ProfileSettingsSectionProps {
  profile: {
    avatar_url?: string | null;
    display_name?: string | null;
  } | null;
  displayName: string;
  timezone: string;
  profileSaving: boolean;
  avatarUploading: boolean;
  timezoneOptions: { value: string; label: string }[];
  accountDeleteDialogOpen: boolean;
  deleteAccountConfirmText: string;
  accountDeleting: boolean;
  onDisplayNameChange: (val: string) => void;
  onTimezoneChange: (val: string) => void;
  onProfileSave: (e: React.FormEvent) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAccountDelete: () => void;
  onConfirmAccountDelete: () => void;
  onCancelAccountDelete: () => void;
  onDeleteAccountConfirmTextChange: (val: string) => void;
}

export function ProfileSettingsSection({
  profile, displayName, timezone, profileSaving, avatarUploading, timezoneOptions,
  accountDeleteDialogOpen, deleteAccountConfirmText, accountDeleting,
  onDisplayNameChange, onTimezoneChange, onProfileSave, onAvatarUpload,
  onAccountDelete, onConfirmAccountDelete, onCancelAccountDelete,
  onDeleteAccountConfirmTextChange,
}: ProfileSettingsSectionProps) {
  return (
    <>
      <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
        <CardHeader className="pb-3 border-b border-slate-50">
          <CardTitle className="text-sm font-heading font-semibold text-primary">Personal Profile</CardTitle>
          <CardDescription>Update your public display name and default timezone.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={onProfileSave} className="space-y-4">
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
                  onChange={onAvatarUpload}
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
                onChange={(e) => onDisplayNameChange(e.target.value)}
                placeholder="Sarah Chen"
                disabled={profileSaving}
                required
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profTimezone">Default Timezone</Label>
              <Select value={timezone} onValueChange={(val) => onTimezoneChange(val ?? '')} disabled={profileSaving}>
                <SelectTrigger id="profTimezone" className="bg-white">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="w-full sm:min-w-[260px]">
                  {timezoneOptions.map((tz) => (
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
            onClick={onAccountDelete}
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

      <Dialog open={accountDeleteDialogOpen} onOpenChange={() => onCancelAccountDelete()}>
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
              onChange={(e) => onDeleteAccountConfirmTextChange(e.target.value)}
              placeholder="delete my account"
              className="h-12 text-base px-4"
            />
          </div>
          <DialogFooter className="px-10 pb-10 pt-0 border-t-0 gap-3 bg-transparent">
            <Button
              variant="outline"
              onClick={onCancelAccountDelete}
              className="flex-1 h-12 text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmAccountDelete}
              disabled={deleteAccountConfirmText !== 'delete my account' || accountDeleting}
              className="flex-1 h-12 text-sm bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
