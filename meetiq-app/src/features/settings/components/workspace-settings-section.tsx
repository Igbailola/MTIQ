'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ShieldAlert, AlertTriangle, Trash2 } from 'lucide-react';

interface WorkspaceSettingsSectionProps {
  workspace: { id: string; name: string } | null;
  workspaceName: string;
  workspaceUrl: string;
  workspaceSaving: boolean;
  workspaceDeleting: boolean;
  deleteDialogOpen: boolean;
  deleteConfirmText: string;
  onWorkspaceNameChange: (val: string) => void;
  onWorkspaceSave: (e: React.FormEvent) => void;
  onWorkspaceDelete: () => void;
  onConfirmWorkspaceDelete: () => void;
  onCancelWorkspaceDelete: () => void;
  onDeleteConfirmTextChange: (val: string) => void;
}

export function WorkspaceSettingsSection({
  workspace, workspaceName, workspaceUrl, workspaceSaving, workspaceDeleting,
  deleteDialogOpen, deleteConfirmText,
  onWorkspaceNameChange, onWorkspaceSave, onWorkspaceDelete,
  onConfirmWorkspaceDelete, onCancelWorkspaceDelete, onDeleteConfirmTextChange,
}: WorkspaceSettingsSectionProps) {
  if (!workspace) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-slate-50">
        No workspace active. Create a workspace in onboarding first.
      </div>
    );
  }

  return (
    <>
      <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
        <CardHeader className="pb-3 border-b border-slate-50">
          <CardTitle className="text-sm font-heading font-semibold text-primary">Workspace Profile</CardTitle>
          <CardDescription>Change the branding name of the active workspace.</CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <form onSubmit={onWorkspaceSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wsNameEdit">Workspace Name</Label>
              <Input
                id="wsNameEdit"
                value={workspaceName}
                onChange={(e) => onWorkspaceNameChange(e.target.value)}
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
            onClick={onWorkspaceDelete}
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

      <Dialog open={deleteDialogOpen} onOpenChange={() => onCancelWorkspaceDelete()}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg gap-0 p-0">
          <DialogHeader className="px-10 pt-10 pb-0">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-5">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-center text-lg font-heading font-semibold">
              Delete Workspace
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground px-4 pt-2 leading-relaxed">
              This action is <strong>permanent</strong> and will delete all meetings, commitments, decisions, and activity logs for <strong>{workspace.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="px-10 pt-8 pb-6">
            <Label htmlFor="deleteConfirm" className="text-sm text-muted-foreground block mb-3">
              Type <span className="font-mono font-semibold text-foreground">delete {workspace.name}</span> to confirm:
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirmText}
              onChange={(e) => onDeleteConfirmTextChange(e.target.value)}
              placeholder={`delete ${workspace.name}`}
              className="h-12 text-base px-4"
            />
          </div>
          <DialogFooter className="px-10 pb-10 pt-0 border-t-0 gap-3 bg-transparent">
            <Button
              variant="outline"
              onClick={onCancelWorkspaceDelete}
              className="flex-1 h-12 text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirmWorkspaceDelete}
              disabled={deleteConfirmText !== `delete ${workspace.name}` || workspaceDeleting}
              className="flex-1 h-12 text-sm bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
