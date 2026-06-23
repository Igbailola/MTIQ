'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ArrowLeft, Plus, X, Mail, Check } from 'lucide-react';

interface PendingInvite {
  workspace_id: string;
  workspaces?: { name: string } | null;
}

interface WorkspaceStepProps {
  workspaceName: string;
  inviteEmail: string;
  invitedEmails: string[];
  loading: boolean;
  pendingInvites: PendingInvite[];
  showInviteCard: boolean;
  onWorkspaceNameChange: (val: string) => void;
  onInviteEmailChange: (val: string) => void;
  onAddTeammateEmail: () => void;
  onRemoveTeammateEmail: (idx: number) => void;
  onAcceptInvite: (workspaceId: string) => void;
  onDeclineInvite: (workspaceId: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function WorkspaceStep({
  workspaceName, inviteEmail, invitedEmails, loading,
  pendingInvites, showInviteCard,
  onWorkspaceNameChange, onInviteEmailChange,
  onAddTeammateEmail, onRemoveTeammateEmail,
  onAcceptInvite, onDeclineInvite,
  onBack, onSkip, onSubmit,
}: WorkspaceStepProps) {
  if (pendingInvites.length > 0 && showInviteCard) {
    return (
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
          You have been invited to join the workspace <strong>&quot;{pendingInvites[0].workspaces?.name}&quot;</strong> on MeetIQ.
        </p>

        <div className="flex flex-col gap-3 mt-8">
          <Button
            onClick={() => onAcceptInvite(pendingInvites[0].workspace_id)}
            disabled={loading}
            className="h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base gap-2 shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
            Accept Invitation & Join
          </Button>
          <button
            type="button"
            onClick={() => onDeclineInvite(pendingInvites[0].workspace_id)}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-slate-600 underline font-medium py-1.5 transition-colors disabled:opacity-50"
          >
            Decline & Create my own workspace instead
          </button>
        </div>
      </div>
    );
  }

  return (
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

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspaceName" className="text-sm font-semibold">Workspace Name</Label>
            <Input
              id="workspaceName"
              type="text"
              placeholder="e.g. Acme Product Org"
              autoFocus
              value={workspaceName}
              onChange={(e) => onWorkspaceNameChange(e.target.value)}
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
                onChange={(e) => onInviteEmailChange(e.target.value)}
                className="h-11 border-slate-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddTeammateEmail();
                  }
                }}
              />
              <Button
                type="button"
                onClick={onAddTeammateEmail}
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
                      onClick={() => onRemoveTeammateEmail(idx)}
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
              onClick={onBack}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 hover:bg-slate-50 border-slate-200 text-slate-600"
              onClick={onSkip}
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
  );
}
