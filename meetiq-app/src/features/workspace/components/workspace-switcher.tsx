'use client';

import React, { useState } from 'react';
import { useCurrentWorkspace, useWorkspaces, useCreateWorkspace } from '@/hooks/use-workspace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function WorkspaceSwitcher() {
  const { currentWorkspace, setCurrentWorkspace } = useCurrentWorkspace();
  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspaceMutation = useCreateWorkspace();
  
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) {
      toast.error('Workspace name is required');
      return;
    }
    setCreating(true);
    try {
      const ws = await createWorkspaceMutation.mutateAsync({ name: newWorkspaceName });
      setNewWorkspaceName('');
      setDialogOpen(false);
      setCurrentWorkspace(ws);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-1.5 h-auto text-primary font-heading font-semibold hover:bg-slate-50 focus-visible:outline-none"
            />
          }
        >
          <div className="flex flex-col items-start">
            <span className="truncate max-w-[140px] text-sm font-semibold">
              {isLoading ? 'Loading...' : currentWorkspace?.name || 'Select Workspace'}
            </span>
            {currentWorkspace && (
              <span className="text-xs text-muted-foreground truncate max-w-[140px] -mt-0.5">
                meetiq/{currentWorkspace.name.toLowerCase().replace(/\s+/g, '-')}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase">
            Workspaces
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isLoading ? (
            <DropdownMenuItem disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading workspaces...</span>
            </DropdownMenuItem>
          ) : (
            workspaces?.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onSelect={() => setCurrentWorkspace(ws)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{ws.name}</span>
                {currentWorkspace?.id === ws.id && (
                  <Check className="h-4 w-4 text-accent shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />
          <DialogTrigger
            render={
              <DropdownMenuItem onSelect={() => setOpen(false)} className="cursor-pointer text-accent" />
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Workspace</span>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Create a New Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateWorkspace} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="wsName">Workspace Name</Label>
            <Input
              id="wsName"
              placeholder="e.g. Engineering Team, Marketing"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              disabled={creating}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Workspace'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
