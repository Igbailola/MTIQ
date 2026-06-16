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
import { Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WorkspaceSwitcherProps {
  initial?: string;
}

export function WorkspaceSwitcher({ initial = 'M' }: WorkspaceSwitcherProps) {
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
        <DropdownMenuTrigger className="focus-visible:outline-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white select-none cursor-pointer hover:bg-blue-700 transition-colors">
            {initial}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-3" align="start">
          {currentWorkspace && (
            <div className="px-1.5 pb-2 mb-2 border-b border-border">
              <p className="text-sm font-semibold text-primary truncate">
                {currentWorkspace.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                meetiq/{currentWorkspace.name.toLowerCase().replace(/\s+/g, '-')}
              </p>
            </div>
          )}
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase">
            Workspaces
          </DropdownMenuLabel>
          
          {isLoading ? (
            <DropdownMenuItem disabled className="py-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading workspaces...</span>
            </DropdownMenuItem>
          ) : (
            workspaces?.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onSelect={() => setCurrentWorkspace(ws)}
                className="py-2 flex items-center justify-between"
              >
                <span className="truncate">{ws.name}</span>
                {currentWorkspace?.id === ws.id && (
                  <Check className="h-4 w-4 text-accent shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}

          <DialogTrigger
            nativeButton={false}
            render={
              <DropdownMenuItem onSelect={() => setOpen(false)} className="py-2 cursor-pointer text-accent" />
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
              className="h-10 py-1.5"
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
