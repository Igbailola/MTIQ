'use client';

import React, { useState, useEffect } from 'react';
import { POLL_INTERVAL_MS } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { demoMeetingData, type DemoCommitment, type DemoDecision } from '@/lib/data/demo-meeting';
import type { Decision, Commitment } from '@/types/database';
import {
  Sparkles,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProfileStep } from '@/features/onboarding/components/profile-step';
import { WorkspaceStep } from '@/features/onboarding/components/workspace-step';
import { DemoSection } from '@/features/onboarding/components/demo-section';
import { UploadSection } from '@/features/onboarding/components/upload-section';


import { logger } from '@/lib/logger';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { refreshWorkspaces, setCurrentWorkspace } = useCurrentWorkspace();
  const supabase = createClient();
  
  // Step State
  const [step, setStep] = useState(0); // 0 = Profile, 1 = Workspace, 2 = Try Demo/Upload
  const [loading, setLoading] = useState(false);
  const [stepLoaded, setStepLoaded] = useState(false);

  // Step 1: Profile State
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Product Manager');
  const [timezone, setTimezone] = useState('UTC');
  const [animatedCardId, setAnimatedCardId] = useState<string | null>(null);

  // Step 2: Workspace State
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  // Step 3: See in Action State
  const [actionChoice, setActionChoice] = useState<'none' | 'demo' | 'upload'>('none');
  
  // Demo interactive commitments state
  const [demoCommitments, setDemoCommitments] = useState<DemoCommitment[]>([]);
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({});

  // Real Upload State
  const [uploadTitle, setUploadTitle] = useState('Product Team Weekly Sync');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadedMeetingId, setUploadedMeetingId] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<{
    summary: { bullets: string[]; ai_confidence: string };
    decisions: Decision[];
    commitments: Commitment[];
  } | null>(null);

  // Invite states inside onboarding
  const [pendingInvites, setPendingInvites] = useState<{ workspace_id: string; role: string; status: string; workspaces: { name: string } | null }[]>([]);
  const [showInviteCard, setShowInviteCard] = useState(true);

  // Timezone Auto-detect
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
      }
    } catch {
      // Fallback to UTC
    }
  }, []);

  // Pre-fill profile name when user info resolves
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    } else if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name);
    } else if (user?.email) {
      setDisplayName(user.email.split('@')[0]);
    }
    if (profile?.timezone) {
      setTimezone(profile.timezone);
    }
    if (user?.user_metadata?.role) {
      setRole(user.user_metadata.role);
    }
  }, [profile, user]);

  // Fetch pending invitations for this user
  useEffect(() => {
    if (!user) return;
    const checkInvites = async () => {
      try {
        let { data, error } = await supabase
          .from('workspace_members')
          .select('workspace_id, role, status, workspaces(name)')
          .eq('user_id', user.id)
          .eq('status', 'pending');

        if (error && (error.message?.includes('status') || error.code === 'PGRST100')) {
          // Fallback: notifications table
          const { data: notifs } = await supabase
            .from('notifications')
            .select('workspace_id, workspaces(name)')
            .eq('user_id', user.id)
            .eq('type', 'member_invited')
            .eq('read', false);

          if (notifs) {
            data = notifs.map((n: { workspace_id: string; workspaces: { name: string } | null }) => ({
              workspace_id: n.workspace_id,
              role: 'member',
              status: 'pending',
              workspaces: n.workspaces,
            }));
          }
        }
        
        if (data) {
          setPendingInvites(data);
        }
      } catch (err) {
        logger.error('Error checking invites in onboarding:', err);
      }
    };
    checkInvites();
  }, [user, supabase]);

  // Restore state from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStep = localStorage.getItem('meetiq_onboarding_step');
      if (savedStep) {
        setStep(parseInt(savedStep, 10));
      }
      
      const savedProfile = localStorage.getItem('meetiq_onboarding_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.displayName) setDisplayName(parsed.displayName);
          if (parsed.role) setRole(parsed.role);
          if (parsed.timezone) setTimezone(parsed.timezone);
        } catch (e) { logger.error('Failed to parse saved onboarding profile', e); }
      }

      const savedWorkspace = localStorage.getItem('meetiq_onboarding_workspace');
      if (savedWorkspace) {
        try {
          const parsed = JSON.parse(savedWorkspace);
          if (parsed.workspaceName) setWorkspaceName(parsed.workspaceName);
          if (parsed.invitedEmails) setInvitedEmails(parsed.invitedEmails);
        } catch (e) { logger.error('Failed to parse saved onboarding workspace', e); }
      }
      
      const savedChoice = localStorage.getItem('meetiq_onboarding_choice');
      if (savedChoice) {
        setActionChoice(savedChoice as 'none' | 'demo' | 'upload');
      }

      const savedMeetingId = localStorage.getItem('meetiq_onboarding_meeting_id');
      if (savedMeetingId) {
        setUploadedMeetingId(savedMeetingId);
      }

      setStepLoaded(true);
    }
  }, []);

  // Sync state to LocalStorage
  const updateStep = (newStep: number) => {
    setStep(newStep);
    localStorage.setItem('meetiq_onboarding_step', newStep.toString());
  };

  const saveProfileData = (name: string, r: string, tz: string) => {
    localStorage.setItem('meetiq_onboarding_profile', JSON.stringify({ displayName: name, role: r, timezone: tz }));
  };

  const saveWorkspaceData = (name: string, emails: string[]) => {
    localStorage.setItem('meetiq_onboarding_workspace', JSON.stringify({ workspaceName: name, invitedEmails: emails }));
  };

  // Step 3 Polling uploaded meeting
  useEffect(() => {
    let active = true;
    if (uploadedMeetingId && actionChoice === 'upload' && !uploadedData) {
      const pollMeeting = async () => {
        try {
          const res = await fetch(`/api/meetings/${uploadedMeetingId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (!active) return;

          if (data.status === 'ready') {
            setUploadedData({
              summary: {
                bullets: data.raw_text ? [
                  'Successfully analyzed the uploaded meeting.',
                  'Extracted core discussions and generated the commitments list below.',
                ] : ['No text summary generated.'],
                ai_confidence: 'high'
              },
              decisions: data.decisions || [],
              commitments: data.commitments || []
            });
            setUploadLoading(false);
          } else if (data.status === 'error') {
            toast.error('AI Analysis failed. Falling back to demo data template.');
            setActionChoice('demo');
            setDemoCommitments(demoMeetingData.commitments);
            setUploadLoading(false);
          } else {
            // Still processing, poll again in 2s
            setTimeout(pollMeeting, POLL_INTERVAL_MS);
          }
        } catch (e) {
          if (active) setTimeout(pollMeeting, POLL_INTERVAL_MS);
        }
      };
      setUploadLoading(true);
      pollMeeting();
    }
    return () => {
      active = false;
    };
  }, [uploadedMeetingId, actionChoice, uploadedData]);

  // Load demo commitments initially
  useEffect(() => {
    if (demoCommitments.length === 0) {
      setDemoCommitments(demoMeetingData.commitments);
    }
  }, [demoCommitments]);

  const handleAcceptInviteOnboarding = async (workspaceId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ status: 'active' })
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId);

      if (error && (error.message?.includes('status') || error.code === 'PGRST100')) {
        const { data: exists } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('workspace_id', workspaceId)
          .maybeSingle();

        if (!exists) {
          await supabase.from('workspace_members').insert({
            user_id: user.id,
            workspace_id: workspaceId,
            role: 'member',
          });
        }
      } else if (error) {
        throw error;
      }

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('type', 'member_invited');

      await supabase.from('notifications').insert({
        user_id: user.id,
        workspace_id: workspaceId,
        type: 'member_accepted',
        title: 'Workspace Joined',
        message: 'You have joined the workspace.',
      }).catch(() => {});

      // Mark onboarding as completed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileError) throw profileError;

      localStorage.setItem('meetiq_current_workspace', workspaceId);
      
      // Clean up localStorage onboarding states
      localStorage.removeItem('meetiq_onboarding_step');
      localStorage.removeItem('meetiq_onboarding_profile');
      localStorage.removeItem('meetiq_onboarding_workspace');
      localStorage.removeItem('meetiq_onboarding_choice');
      localStorage.removeItem('meetiq_onboarding_meeting_id');

      toast.success('Joined workspace successfully! Welcome to MeetIQ.');
      await refreshProfile();
      await refreshWorkspaces();
      router.push('/dashboard');
      router.refresh();
    } catch (e: unknown) {
      toast.error(e.message || 'Failed to join workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInviteOnboarding = async (workspaceId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('type', 'member_invited');

      toast.success('Invitation declined.');
      setPendingInvites((prev) => prev.filter((inv) => inv.workspace_id !== workspaceId));
      setShowInviteCard(false);
    } catch (e: unknown) {
      toast.error(e.message || 'Failed to decline invitation');
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      // Update role in auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { role }
      });
      if (authError) throw authError;

      // Update name and timezone in profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          timezone,
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      saveProfileData(displayName, role, timezone);
      await refreshProfile();
      updateStep(1);
      toast.success('Profile saved successfully!');
    } catch (err: unknown) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    setLoading(true);
    try {
      // Create Workspace via API
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create workspace');
      }

      const ws = await res.json();

      // Invite teammates silently (in-app only)
      if (invitedEmails.length > 0) {
        for (const email of invitedEmails) {
          fetch(`/api/workspaces/${ws.id}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role: 'member', sendEmail: false }),
          }).then(res => {
            if (!res.ok) logger.error('Failed to invite teammate:', email);
          }).catch((err) => {
            logger.error('Failed to invite teammate:', { email, err });
          });
        }
      }

      saveWorkspaceData(workspaceName, invitedEmails);
      await refreshWorkspaces();
      setCurrentWorkspace(ws);
      updateStep(2);
      toast.success(`Workspace "${workspaceName}" created!`);
    } catch (err: unknown) {
      toast.error(err.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipWorkspace = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Personal Workspace' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create workspace');
      }

      const ws = await res.json();
      saveWorkspaceData('Personal Workspace', []);
      await refreshWorkspaces();
      setCurrentWorkspace(ws);
      updateStep(2);
    } catch (err: unknown) {
      toast.error(err.message || 'Failed to skip workspace creation');
    } finally {
      setLoading(false);
    }
  };

  const addTeammateEmail = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (invitedEmails.includes(email)) {
      toast.error('Email already added');
      return;
    }
    if (email === user?.email) {
      toast.error('You cannot invite yourself');
      return;
    }
    const updated = [...invitedEmails, email];
    setInvitedEmails(updated);
    setInviteEmail('');
    saveWorkspaceData(workspaceName, updated);
  };

  const removeTeammateEmail = (index: number) => {
    const updated = invitedEmails.filter((_, i) => i !== index);
    setInvitedEmails(updated);
    saveWorkspaceData(workspaceName, updated);
  };

  // Step 3 Real Upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }
    if (!file.name.endsWith('.txt')) {
      toast.error('Only plain text (.txt) files are supported.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContent.trim()) {
      toast.error('Please upload a file or paste meeting notes.');
      return;
    }

    setUploadLoading(true);
    try {
      // Fetch user's workspaces to find active workspace
      const wsRes = await fetch('/api/workspaces');
      if (!wsRes.ok) throw new Error('Failed to fetch workspaces');
      const workspacesList = await wsRes.json();
      const activeWorkspace = workspacesList[0];

      if (!activeWorkspace) {
        toast.error('No workspace found. Please reload or contact support.');
        setUploadLoading(false);
        return;
      }

      // Create Meeting Notes
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle,
          meeting_date: uploadDate,
          raw_text: fileContent,
          workspace_id: activeWorkspace.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload transcript');
      }

      const meeting = await res.json();
      setUploadedMeetingId(meeting.id);
      localStorage.setItem('meetiq_onboarding_meeting_id', meeting.id);
      toast.info('Meeting uploaded! AI processing started.');

      // Kick off processing explicitly from browser client to bypass Next.js background fetch limitations
      fetch(`/api/meetings/${meeting.id}/process`, {
        method: 'POST',
      }).then(res => {
        if (!res.ok) logger.error('Process trigger returned:', res.status);
      }).catch((err) => {
        logger.error('Error triggering client-side process:', err);
      });
    } catch (err: unknown) {
      toast.error(err.message || 'Failed to analyze meeting');
      setUploadLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user?.id);

      if (error) throw error;

      // Clean up localStorage onboarding states
      localStorage.removeItem('meetiq_onboarding_step');
      localStorage.removeItem('meetiq_onboarding_profile');
      localStorage.removeItem('meetiq_onboarding_workspace');
      localStorage.removeItem('meetiq_onboarding_choice');
      localStorage.removeItem('meetiq_onboarding_meeting_id');

      await refreshProfile();
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') ?? '/dashboard';
      router.push(next);
      toast.success('Welcome to MeetIQ! Onboarding completed.');
    } catch (err: unknown) {
      toast.error(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user?.id);

      if (error) throw error;

      localStorage.removeItem('meetiq_onboarding_step');
      localStorage.removeItem('meetiq_onboarding_profile');
      localStorage.removeItem('meetiq_onboarding_workspace');
      localStorage.removeItem('meetiq_onboarding_choice');
      localStorage.removeItem('meetiq_onboarding_meeting_id');

      await refreshProfile();
      router.refresh();
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') ?? '/dashboard';
      router.push(next);
    } catch (err: unknown) {
      toast.error(err.message || 'Failed to skip onboarding');
    } finally {
      setLoading(false);
    }
  };

  const toggleContext = (id: string) => {
    setExpandedContexts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (authLoading || !stepLoaded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 font-body">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-xs font-semibold text-muted-foreground uppercase font-heading">
            Loading MeetIQ Onboarding...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body text-slate-900">
      {/* Onboarding Nav Bar */}
      <nav className="sticky top-0 z-50 border-b border-meetiq-border/20 bg-white/80 backdrop-blur-lg">
        <div className="flex h-[72px] items-center justify-between px-4 sm:px-6 md:px-[45px]">
          <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none">
            <Image
              src="/meetiq-logo.png"
              alt="MeetIQ Logo"
              width={110}
              height={32}
              className="h-8 w-auto object-contain"
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

      {step <= 2 && (
        <div className="flex items-center justify-center gap-2 mt-10 mb-10">
          {[0, 1, 2].map((i) => (
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

      {/* Wizard Steps Shell */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-16">
        <div className="w-full max-w-5xl transition-all duration-300">
          
          {step === 0 && (
            <ProfileStep
              displayName={displayName}
              role={role}
              timezone={timezone}
              loading={loading}
              onDisplayNameChange={setDisplayName}
              onRoleChange={setRole}
              onTimezoneChange={setTimezone}
              onSkip={() => updateStep(1)}
              onSubmit={handleSaveProfile}
            />
          )}

          {/* STEP 2: CREATE WORKSPACE OR JOIN TEAM */}
          {step === 1 && (
            <WorkspaceStep
              workspaceName={workspaceName}
              inviteEmail={inviteEmail}
              invitedEmails={invitedEmails}
              loading={loading}
              pendingInvites={pendingInvites}
              showInviteCard={showInviteCard}
              onWorkspaceNameChange={setWorkspaceName}
              onInviteEmailChange={setInviteEmail}
              onAddTeammateEmail={addTeammateEmail}
              onRemoveTeammateEmail={removeTeammateEmail}
              onAcceptInvite={handleAcceptInviteOnboarding}
              onDeclineInvite={handleDeclineInviteOnboarding}
              onBack={() => updateStep(0)}
              onSkip={handleSkipWorkspace}
              onSubmit={handleCreateWorkspaceSubmit}
            />
          )}

          {/* STEP 3: TRY DEMO / UPLOAD */}
          {step === 2 && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
              <div className="text-center max-w-xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight text-primary font-heading">
                  See MeetIQ in action
                </h1>
                <p className="text-base text-slate-500 mt-2">
                  Test drive with our sample meeting simulation or upload your own notes to check extraction.
                </p>
              </div>

              {actionChoice === 'none' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Interactive Demo Card */}
                  <button
                    onClick={() => {
                      setActionChoice('demo');
                      localStorage.setItem('meetiq_onboarding_choice', 'demo');
                    }}
                    className="flex flex-col items-center text-center p-8 bg-white border border-slate-200 rounded-xl hover:border-accent hover:shadow-meetiq-md transition-all group duration-200"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-6 group-hover:scale-105 transition-transform">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-bold text-accent bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                      Instant Simulation
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">
                      Try our Interactive Demo
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Instant simulation of a Product Sprint Planning meeting. Explore commitments, decisions, and interactive tooltips.
                    </p>
                  </button>

                  {/* Upload Transcript Card */}
                  <button
                    onClick={() => {
                      setActionChoice('upload');
                      localStorage.setItem('meetiq_onboarding_choice', 'upload');
                    }}
                    className="flex flex-col items-center text-center p-8 bg-white border border-slate-200 rounded-xl hover:border-accent hover:shadow-meetiq-md transition-all group duration-200"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6 group-hover:scale-105 transition-transform">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                      Your Data
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">
                      Analyze Real Transcript
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Upload a plain text (.txt) transcript or copy-paste dialogue notes to test actual AI extraction on your own meeting.
                    </p>
                  </button>
                </div>
              )}

              {actionChoice === 'demo' && (
                <DemoSection
                  demoMeetingData={demoMeetingData}
                  demoCommitments={demoCommitments}
                  expandedContexts={expandedContexts}
                  animatedCardId={animatedCardId}
                  loading={loading}
                  onChooseOther={() => {
                    setActionChoice('none');
                    localStorage.removeItem('meetiq_onboarding_choice');
                  }}
                  onToggleContext={toggleContext}
                  onAnimateCard={setAnimatedCardId}
                  onSetDemoCommitments={setDemoCommitments}
                  onFinish={handleFinishOnboarding}
                />
              )}

              {actionChoice === 'upload' && (
                <UploadSection
                  uploadTitle={uploadTitle}
                  uploadDate={uploadDate}
                  fileName={fileName}
                  fileContent={fileContent}
                  dragActive={dragActive}
                  uploadLoading={uploadLoading}
                  uploadedData={uploadedData}
                  onUploadTitleChange={setUploadTitle}
                  onUploadDateChange={setUploadDate}
                  onFileContentChange={setFileContent}
                  onDrag={handleDrag}
                  onDrop={handleDrop}
                  onFileChange={handleFileChange}
                  onFileRemove={() => { setFileName(''); setFileContent(''); }}
                  onChooseOther={() => {
                    setActionChoice('none');
                    localStorage.removeItem('meetiq_onboarding_choice');
                    setUploadedData(null);
                    setUploadedMeetingId(null);
                    localStorage.removeItem('meetiq_onboarding_meeting_id');
                  }}
                  onSubmit={handleUploadSubmit}
                  onFinish={handleFinishOnboarding}
                />
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
