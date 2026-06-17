'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCreateWorkspace } from '@/hooks/use-workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Check, Sparkles, Loader2, Building2, User, PartyPopper } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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

const WORKSPACE_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
];

const STEPS = [
  { title: 'Set up your profile', description: 'Tell us a bit about yourself' },
  { title: 'Create your workspace', description: 'Name your team space' },
  { title: 'All set!', description: 'You are ready to go' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const createWorkspaceMutation = useCreateWorkspace();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [workspaceName, setWorkspaceName] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
    if (profile?.timezone) {
      setTimezone(profile.timezone);
    }
  }, [profile]);

  const workspaceUrl = workspaceName
    ? `https://meetiq/${workspaceName.toLowerCase().replace(/\s+/g, '-')}`
    : '';

  const handleStep1 = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter your display name');
      return;
    }
    setStep(1);
  };

  const handleStep2 = async () => {
    if (!workspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }
    setLoading(true);
    try {
      await createWorkspaceMutation.mutateAsync({ name: workspaceName });

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          timezone,
          onboarding_completed: true,
        })
        .eq('id', user?.id);

      if (profileError) {
        toast.error(profileError.message);
        return;
      }

      await refreshProfile();
      setStep(2);
    } catch {
      // Error handled by mutation
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = () => {
    router.refresh();
    router.push('/dashboard');
  };

  const handleSkip = () => {
    setLoading(true);
    supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user?.id)
      .then(({ error }) => {
        if (error) {
          toast.error(error.message);
          return;
        }
        router.refresh();
        router.push('/dashboard');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-body">
      <nav className="sticky top-0 z-50 border-b border-slate-100/50 bg-white/80 backdrop-blur-lg">
        <div className="flex h-[70px] items-center justify-between px-[45px]">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/meetiq-logo.png"
              alt="MeetIQ"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          {step < 2 && (
            <button
              onClick={handleSkip}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Skip onboarding
            </button>
          )}
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-lg mx-auto">
          {step < 2 && (
            <div className="flex items-center justify-center gap-2 mb-10">
              {STEPS.slice(0, 2).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-10 bg-slate-900'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          )}

          {step === 0 && (
            <div className="bg-white border border-meetiq-border/5 rounded-xl p-8 sm:p-10 shadow-meetiq-sm">
              <div className="text-center mb-8">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                  <User className="h-7 w-7 text-blue-600" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/50 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 mb-3">
                  <Sparkles className="h-3 w-3" />
                  Step 1 of 2
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-primary font-heading mt-3">
                  Welcome to MeetIQ
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Set up your profile so your team knows who you are
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Sarah Chen"
                    className="h-10"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select value={timezone} onValueChange={(val) => setTimezone(val ?? 'UTC')} disabled={loading}>
                    <SelectTrigger id="timezone" className="h-10 bg-white">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Button
                  onClick={handleStep1}
                  disabled={loading}
                  className="w-full h-12 text-base gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="bg-white border border-meetiq-border/5 rounded-xl p-8 sm:p-10 shadow-meetiq-sm">
              <div className="text-center mb-8">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                  <Building2 className="h-7 w-7 text-indigo-600" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/50 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 mb-3">
                  <Sparkles className="h-3 w-3" />
                  Step 2 of 2
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-primary font-heading mt-3">
                  Create a Workspace
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Workspaces group meetings, commitments, and team members together
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">Workspace Name</Label>
                  <Input
                    id="workspaceName"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Acme Corp, Product Team"
                    className="h-10"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workspaceUrl">Workspace URL</Label>
                  <Input
                    id="workspaceUrl"
                    value={workspaceUrl}
                    readOnly
                    className="h-10 text-slate-500 bg-slate-50/50"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Select value={role} onValueChange={(val) => setRole(val ?? 'admin')} disabled={loading}>
                    <SelectTrigger id="role" className="h-10 bg-white">
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
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Button
                  onClick={handleStep2}
                  disabled={loading}
                  className="w-full h-12 text-base gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Create Workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setStep(0)}
                  className="inline-flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <PartyPopper className="h-10 w-10 text-emerald-600" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-primary font-heading">
                You are all set!
              </h1>
              <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
                Your workspace &quot;{workspaceName}&quot; is ready. Upload a meeting transcript or
                recording to start extracting commitments with AI.
              </p>

              <div className="mt-8 bg-white border border-meetiq-border/5 rounded-xl p-6 shadow-meetiq-xs">
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 shrink-0">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Profile</p>
                      <p className="text-sm font-medium text-primary">{displayName || user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 shrink-0">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Workspace</p>
                      <p className="text-sm font-medium text-primary">{workspaceName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 shrink-0">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="text-sm font-medium text-primary capitalize">{role}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  onClick={handleStep3}
                  className="w-full h-12 text-base gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
