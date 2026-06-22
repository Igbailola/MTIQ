'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { useCreateWorkspace, useCurrentWorkspace } from '@/hooks/use-workspace';
import { demoMeetingData, type DemoCommitment, type DemoDecision } from '@/lib/data/demo-meeting';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Plus,
  X,
  Clock,
  User,
  Users,
  UploadCloud,
  FileText,
  Loader2,
  Info,
  Calendar,
  AlertCircle,
  Link as LinkIcon,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Mail,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const ROLES = [
  'Product Manager',
  'Engineer',
  'Designer',
  'Founder',
  'Other'
];

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Africa/Lagos'
];

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

  const timezonesList = COMMON_TIMEZONES.includes(timezone)
    ? COMMON_TIMEZONES
    : [...COMMON_TIMEZONES, timezone].sort();

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
    decisions: any[];
    commitments: any[];
  } | null>(null);

  // Invite states inside onboarding
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [showInviteCard, setShowInviteCard] = useState(true);

  // Timezone Auto-detect
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && COMMON_TIMEZONES.includes(detected)) {
        setTimezone(detected);
      } else if (detected) {
        setTimezone(detected);
      }
    } catch (e) {
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
            data = notifs.map((n: any) => ({
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
        console.error('Error checking invites in onboarding:', err);
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
        } catch (e) {}
      }

      const savedWorkspace = localStorage.getItem('meetiq_onboarding_workspace');
      if (savedWorkspace) {
        try {
          const parsed = JSON.parse(savedWorkspace);
          if (parsed.workspaceName) setWorkspaceName(parsed.workspaceName);
          if (parsed.invitedEmails) setInvitedEmails(parsed.invitedEmails);
        } catch (e) {}
      }
      
      const savedChoice = localStorage.getItem('meetiq_onboarding_choice');
      if (savedChoice) {
        setActionChoice(savedChoice as any);
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
            setTimeout(pollMeeting, 2000);
          }
        } catch (e) {
          if (active) setTimeout(pollMeeting, 2000);
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (err: any) {
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
          await fetch(`/api/workspaces/${ws.id}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role: 'member', sendEmail: false }),
          }).catch((err) => {
            console.error('Failed to invite teammate:', email, err);
          });
        }
      }

      saveWorkspaceData(workspaceName, invitedEmails);
      await refreshWorkspaces();
      setCurrentWorkspace(ws);
      updateStep(2);
      toast.success(`Workspace "${workspaceName}" created!`);
    } catch (err: any) {
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
    } catch (err: any) {
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
      }).catch((err) => {
        console.error('Error triggering client-side process:', err);
      });
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
          
          {/* STEP 1: PROFILE SETUP */}
          {step === 0 && (
            <div className="max-w-lg mx-auto animate-fade-in bg-white border border-meetiq-border/30 rounded-xl p-8 shadow-meetiq-sm">
              <div className="text-center sm:text-left mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
                  Welcome to MeetIQ
                </h1>
                <p className="text-base text-slate-500 mt-2">
                  Let&apos;s customize your workspace profile and default preferences.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-semibold">Your Full Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your name"
                    autoFocus
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-11 border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-semibold">Workspace Role</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`text-sm py-2 px-3 border rounded-lg text-center transition-all ${
                          role === r
                            ? 'bg-slate-900 border-slate-900 text-white font-semibold shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm font-semibold">Timezone</Label>
                  <Select value={timezone} onValueChange={(val) => setTimezone(val || 'UTC')}>
                    <SelectTrigger id="timezone" className="w-full bg-white" style={{ height: '38px' }}>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezonesList.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-12 sm:w-1/3 hover:bg-slate-50"
                    onClick={() => updateStep(1)}
                  >
                    Skip
                  </Button>
                  <Button type="submit" className="h-12 sm:w-2/3 gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: CREATE WORKSPACE OR JOIN TEAM */}
          {step === 1 && (
            pendingInvites.length > 0 && showInviteCard ? (
              <div className="max-w-xl mx-auto animate-fade-in bg-white border border-meetiq-border/30 rounded-xl p-8 shadow-meetiq-sm text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-accent">
                  <Mail className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold text-accent bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                  Pending Invitation
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-primary font-heading mt-2">
                  Join Your Team
                </h1>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  You have been invited to join the workspace <strong>&quot;{pendingInvites[0].workspaces?.name}&quot;</strong> on MeetIQ. Accepting this invite will automatically add you as a member and take you directly to your team dashboard.
                </p>

                <div className="flex flex-col gap-3 mt-8">
                  <Button
                    onClick={() => handleAcceptInviteOnboarding(pendingInvites[0].workspace_id)}
                    disabled={loading}
                    className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base gap-2 shadow-sm"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
                    Accept Invitation & Join
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDeclineInviteOnboarding(pendingInvites[0].workspace_id)}
                    disabled={loading}
                    className="text-xs text-slate-400 hover:text-slate-600 underline font-medium py-1.5 transition-colors disabled:opacity-50"
                  >
                    Decline & Create my own workspace instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 max-w-5xl mx-auto animate-fade-in bg-white border border-meetiq-border/30 rounded-xl p-6 md:p-8 shadow-meetiq-sm">
                <div className="md:col-span-3 space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
                      Create your first workspace
                    </h1>
                    <p className="text-base text-slate-500 mt-2">
                      A workspace groups meeting notes and tracks task commitments for your entire team.
                    </p>
                  </div>

                  <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="workspaceName" className="text-sm font-semibold">Workspace Name</Label>
                      <Input
                        id="workspaceName"
                        type="text"
                        placeholder="e.g. Acme Product Org"
                        autoFocus
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="h-11 border-slate-200"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Invite teammates (in-app preview)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="teammate@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="h-11 border-slate-200"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTeammateEmail();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addTeammateEmail}
                          className="h-12 bg-slate-900 hover:bg-slate-800 text-white shrink-0 px-4"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>

                      {invitedEmails.length > 0 && (
                        <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {invitedEmails.map((email, idx) => (
                            <span
                              key={email}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-full pl-3 pr-1.5 py-1"
                            >
                              {email}
                              <button
                                type="button"
                                onClick={() => removeTeammateEmail(idx)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-12 hover:bg-slate-50"
                        onClick={() => updateStep(0)}
                        disabled={loading}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 hover:bg-slate-50 border-slate-200 text-slate-600"
                        onClick={handleSkipWorkspace}
                        disabled={loading}
                      >
                        Skip Setup
                      </Button>
                      <Button type="submit" className="h-12 flex-grow gap-2" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        <span>Create Workspace</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Step 2 Right: Sidebar Switcher Live Preview */}
                <div className="md:col-span-2 flex flex-col justify-center bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <div className="space-y-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block text-center">
                      Workspace Switcher Preview
                    </span>
                    
                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white font-bold text-base shadow-sm">
                          {workspaceName ? workspaceName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-slate-900 block truncate">
                            {workspaceName || 'Acme Product Org'}
                          </span>
                          <span className="text-xs text-slate-400 block truncate font-mono">
                            meetiq.com/w/{workspaceName ? workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'acme-org'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t text-[11px] text-slate-400 font-medium">
                        {invitedEmails.length === 0 ? (
                          <span>Only you will be in this workspace.</span>
                        ) : (
                          <span>Includes you + {invitedEmails.length} teammate{invitedEmails.length > 1 ? 's' : ''} (pending confirmation).</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-400 text-center leading-relaxed">
                      Workspaces partition teams securely. Teammates receive in-app invite alerts upon joining.
                    </p>
                  </div>
                </div>
              </div>
            )
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

              {/* DEMO DISPLAY WORKSPACE */}
              {actionChoice === 'demo' && (
                <div className="space-y-6 animate-fade-in bg-white border border-slate-200 rounded-xl p-6 shadow-meetiq-xs">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <span className="text-xs font-bold text-accent uppercase tracking-wider block">
                        Interactive Sandbox &middot; Demo Mode
                      </span>
                      <h2 className="text-xl font-bold text-primary font-heading mt-1">
                        {demoMeetingData.title}
                      </h2>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActionChoice('none');
                        localStorage.removeItem('meetiq_onboarding_choice');
                      }}
                      className="text-xs hover:bg-slate-50"
                    >
                      Choose other option
                    </Button>
                  </div>

                  {/* Meeting Summary (Blue Tint) */}
                  <div className="ai-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="ai-label">
                          AI Generated Summary
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        High confidence
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-700 leading-relaxed pl-5 list-disc">
                      {demoMeetingData.summary.bullets.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Decisions List */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider block">
                      Extracted Decisions (3)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {demoMeetingData.decisions.map((decision) => (
                        <div
                          key={decision.id}
                          className="border border-slate-100 bg-slate-50/50 rounded-lg p-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {decision.content}
                          <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Decision</span>
                            <span className="text-emerald-600">High Confidence</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Commitments List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider block">
                        Extracted Commitments (4)
                      </h3>
                      <span className="text-xs text-slate-400 bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        Interactive confirmation sandbox
                      </span>
                    </div>

                    <div className="space-y-4">
                      {demoCommitments.map((c) => {
                        const isExpanded = !!expandedContexts[c.id];
                        const displayStatus = c.status;

                        return (
                          <div
                            key={c.id}
                            className={`transition-all duration-200 ${
                              displayStatus === 'pending_confirmation'
                                ? 'ai-card p-5 space-y-4 shadow-meetiq-xs'
                                : displayStatus === 'completed'
                                ? 'border border-emerald-200 bg-emerald-50/10 rounded-xl p-5 space-y-4 shadow-meetiq-xs'
                                : displayStatus === 'blocked'
                                ? 'border border-amber-200 bg-amber-50/10 rounded-xl p-5 space-y-4 shadow-meetiq-xs'
                                : 'border border-slate-200/60 rounded-xl bg-white p-5 space-y-4 shadow-meetiq-xs'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-blue-500" />
                                <span className="ai-label">
                                  AI Suggested Commitment
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                                  c.ai_confidence === 'high'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}>
                                  {c.ai_confidence === 'high' ? 'High confidence' : 'Review suggested'}
                                </span>
                              </div>
                            </div>

                            {/* Commitment Title */}
                            <div className={`transition-transform duration-300 ${animatedCardId === c.id ? 'scale-98 opacity-90' : ''}`}>
                              <h4 className="font-heading font-bold text-base text-primary leading-tight">
                                {c.title}
                              </h4>
                              {c.description && (
                                <p className="text-xs text-muted-foreground mt-1 font-body leading-normal">
                                  {c.description}
                                </p>
                              )}
                            </div>

                            {/* Meta Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Owner</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                                    {c.owner?.display_name?.charAt(0) || 'U'}
                                  </div>
                                  <span className="font-medium text-slate-700 truncate">
                                    {c.owner?.display_name}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Due Date</span>
                                <div className="flex items-center gap-1 text-slate-700 font-medium">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{c.due_date ? new Date(c.due_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'No Date'}</span>
                                </div>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Priority</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                                  c.priority === 'high'
                                    ? 'bg-red-50 text-red-700'
                                    : c.priority === 'medium'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {c.priority}
                                </span>
                              </div>

                              <div>
                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">Status</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                  displayStatus === 'pending_confirmation'
                                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                    : displayStatus === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : displayStatus === 'blocked'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {displayStatus.replace('_', ' ')}
                                </span>
                              </div>
                            </div>

                            {/* Dialogue Context snippet */}
                            {c.context_snippet && (
                              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-1">
                                <button
                                  type="button"
                                  onClick={() => toggleContext(c.id)}
                                  className="flex w-full items-center justify-between text-[10px] font-bold text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                  <span className="uppercase tracking-wider">AI Dialogue Context Snippet</span>
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                                <p className={`text-xs text-slate-600 leading-relaxed font-body mt-1 italic ${isExpanded ? '' : 'line-clamp-1'}`}>
                                  &ldquo;{c.context_snippet}&rdquo;
                                </p>
                              </div>
                            )}

                            {/* Action Buttons for Interactive Sandbox */}
                            {displayStatus === 'pending_confirmation' && (
                              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAnimatedCardId(c.id);
                                    setTimeout(() => setAnimatedCardId(null), 300);
                                    setDemoCommitments((prev) =>
                                      prev.map((item) =>
                                        item.id === c.id ? { ...item, status: 'blocked' } : item
                                      )
                                    );
                                    toast.success('Commitment rejected / blocked');
                                  }}
                                  className="flex-1 text-center text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 font-semibold transition-all"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAnimatedCardId(c.id);
                                    setTimeout(() => setAnimatedCardId(null), 300);
                                    setDemoCommitments((prev) =>
                                      prev.map((item) =>
                                        item.id === c.id ? { ...item, status: 'completed' } : item
                                      )
                                    );
                                    toast.success('Commitment confirmed & accepted!');
                                  }}
                                  className="flex-1 text-center text-xs px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all"
                                >
                                  Confirm & Accept
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t mt-8">
                    <Button
                      onClick={handleFinishOnboarding}
                      className="h-12 px-8 gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md font-bold text-base"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      <span>Finish Onboarding</span>
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* UPLOAD FORM DISPLAY WORKSPACE */}
              {actionChoice === 'upload' && (
                <div className="space-y-6 bg-white border border-slate-200 rounded-xl p-6 shadow-meetiq-xs">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                        Analyze Transcript
                      </span>
                      <h2 className="text-xl font-bold text-primary font-heading mt-1">
                        Upload real notes
                      </h2>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActionChoice('none');
                        localStorage.removeItem('meetiq_onboarding_choice');
                        setUploadedData(null);
                        setUploadedMeetingId(null);
                        localStorage.removeItem('meetiq_onboarding_meeting_id');
                      }}
                      className="text-xs hover:bg-slate-50"
                    >
                      Choose other option
                    </Button>
                  </div>

                  {!uploadedData && (
                    <form onSubmit={handleUploadSubmit} className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="uploadTitle" className="text-sm font-semibold">Meeting Title</Label>
                          <Input
                            id="uploadTitle"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            placeholder="e.g. Acme Sync Planning"
                            disabled={uploadLoading}
                            className="h-10 border-slate-200"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="uploadDate" className="text-sm font-semibold">Meeting Date</Label>
                          <Input
                            id="uploadDate"
                            type="date"
                            value={uploadDate}
                            onChange={(e) => setUploadDate(e.target.value)}
                            disabled={uploadLoading}
                            className="h-10 border-slate-200"
                            required
                          />
                        </div>
                      </div>

                      <Tabs defaultValue="paste" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-[320px] bg-slate-100 p-0.5 rounded-lg h-9">
                          <TabsTrigger value="paste" className="rounded-md text-xs font-bold">Paste Notes</TabsTrigger>
                          <TabsTrigger value="upload" className="rounded-md text-xs font-bold">Upload File</TabsTrigger>
                        </TabsList>

                        <TabsContent value="paste" className="mt-4">
                          <div className="space-y-2">
                            <Label htmlFor="rawText" className="text-xs font-bold text-slate-400 uppercase">Paste notes or dialogue transcript</Label>
                            <Textarea
                              id="rawText"
                              placeholder="Alex: I will write the database migrations by Friday.
James: Tolu and I can check the auth token refresh flow tomorrow."
                              rows={8}
                              value={fileContent}
                              onChange={(e) => setFileContent(e.target.value)}
                              disabled={uploadLoading}
                              className="font-mono text-xs"
                              required
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="upload" className="mt-4">
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
                              dragActive
                                ? 'border-accent bg-blue-50/20'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="file"
                              id="file-upload"
                              className="hidden"
                              accept=".txt"
                              onChange={handleFileChange}
                              disabled={uploadLoading}
                            />

                            {fileName ? (
                              <div className="space-y-3 w-full">
                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-accent">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-primary">{fileName}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {(fileContent.length / 1024).toFixed(1)} KB &middot; {fileContent.length.toLocaleString()} characters
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setFileName('');
                                    setFileContent('');
                                  }}
                                  disabled={uploadLoading}
                                >
                                  Remove file
                                </Button>
                              </div>
                            ) : (
                              <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-accent">
                                  <UploadCloud className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-accent hover:underline">Click to upload</span>
                                  <span className="text-sm text-slate-500"> or drag and drop</span>
                                  <p className="text-xs text-muted-foreground mt-1">Plain Text (.txt) files only (max 10MB)</p>
                                </div>
                              </label>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>

                      <Button type="submit" className="h-12 gap-2 px-6" disabled={uploadLoading}>
                        {uploadLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>AI is processing notes...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span className="text-base">Analyze Meeting</span>
                          </>
                        )}
                      </Button>
                    </form>
                  )}

                  {/* LOADING/PROCESSING STATE */}
                  {uploadLoading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center animate-pulse">
                      <Loader2 className="h-10 w-10 animate-spin text-accent" />
                      <div className="space-y-1">
                        <h4 className="font-heading font-bold text-lg text-primary">Analyzing transcript...</h4>
                        <p className="text-sm text-slate-400">
                          AI is identifying decisions, mapping commitments, and matching owner tags.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* UPLOAD RESULTS */}
                  {uploadedData && (
                    <div className="space-y-6 animate-fade-in pt-4">
                      {/* Meeting Summary */}
                      <div className="ai-card p-5 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-accent" />
                          <span className="ai-label">
                            AI Generated Summary
                          </span>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-700 leading-relaxed pl-5 list-disc">
                          {uploadedData.summary.bullets.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Decisions */}
                      {uploadedData.decisions && uploadedData.decisions.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Extracted Decisions ({uploadedData.decisions.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {uploadedData.decisions.map((d, i) => (
                              <div key={i} className="border border-slate-100 bg-slate-50/50 rounded-lg p-4 text-sm font-semibold text-slate-700">
                                {d.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Commitments */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                          Extracted Commitments ({uploadedData.commitments.length})
                        </h3>

                        {uploadedData.commitments.length === 0 ? (
                          <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
                            No commitments extracted. Ensure your notes mention specific tasks, owners, and timelines.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {uploadedData.commitments.map((c, i) => (
                              <div key={i} className="ai-card p-5 space-y-3 shadow-meetiq-xs">
                                <div className="flex items-center justify-between">
                                  <span className="ai-label">
                                    AI Suggested Commitment
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {c.ai_confidence} confidence
                                  </span>
                                </div>
                                <h4 className="font-heading font-bold text-sm text-primary">{c.title}</h4>
                                {c.description && <p className="text-xs text-slate-500 leading-normal">{c.description}</p>}
                                <div className="flex gap-4 text-xs pt-2 text-slate-500">
                                  <span>Priority: <strong className="capitalize text-slate-700">{c.priority}</strong></span>
                                  {c.due_date && <span>Due: <strong className="text-slate-700">{new Date(c.due_date).toLocaleDateString()}</strong></span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-6 border-t mt-8">
                        <Button
                          onClick={handleFinishOnboarding}
                          className="h-12 px-8 gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md font-bold text-base"
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          <span>Finish Onboarding</span>
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
