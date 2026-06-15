'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCreateWorkspace } from '@/hooks/use-workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const WORKSPACE_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
];

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { user } = useAuth();
  const createWorkspaceMutation = useCreateWorkspace();
  const supabase = createClient();

  const [workspaceName, setWorkspaceName] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const workspaceUrl = workspaceName
    ? `https://meetiq/${workspaceName.toLowerCase().replace(/\s+/g, '-')}`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }
    setLoading(true);
    try {
      await createWorkspaceMutation.mutateAsync({ name: workspaceName });

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user?.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Welcome to MeetIQ!');
      router.refresh();
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="focus-visible:outline-none">
              <Image
                src="/meetiq-logo.png"
                alt="MeetIQ"
                width={112}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>
          </div>
          <h2 className="mt-[30px] text-2xl font-semibold text-primary font-heading">
            Create a Workspace
          </h2>
          <p className="mt-1 text-base text-muted-foreground font-body max-w-sm">
            Workspaces group meetings, commitments, and team members together
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-meetiq-border/5 rounded-xl p-8 shadow-meetiq-xs space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspaceName" className="text-base">Workspace Name</Label>
            <Input
              id="workspaceName"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Acme Corp, Product Team"
              className="h-[44px]"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspaceUrl" className="text-base">Workspace URL</Label>
            <Input
              id="workspaceUrl"
              value={workspaceUrl}
              readOnly
              className="h-[44px] text-slate-500 bg-slate-50/50"
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-base">Your Role</Label>
            <Select value={role} onValueChange={(val) => setRole(val ?? 'member')} disabled={loading}>
              <SelectTrigger id="role" className="h-[44px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {WORKSPACE_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-base">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Workspace'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
            >
              Skip workspace creation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
