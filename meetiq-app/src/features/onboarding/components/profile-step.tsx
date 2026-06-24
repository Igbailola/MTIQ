'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';

const ROLES = ['Product Manager', 'Engineering Lead', 'Design Lead', 'Individual Contributor', 'Other'];

const timezonesList = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland',
];

interface ProfileStepProps {
  displayName: string;
  role: string;
  timezone: string;
  loading: boolean;
  onDisplayNameChange: (val: string) => void;
  onRoleChange: (val: string) => void;
  onTimezoneChange: (val: string) => void;
  onSkip: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProfileStep({
  displayName, role, timezone, loading,
  onDisplayNameChange, onRoleChange, onTimezoneChange,
  onSkip, onSubmit,
}: ProfileStepProps) {
  return (
    <div className="max-w-lg mx-auto animate-fade-in bg-white border border-meetiq-border/30 rounded-xl p-8 shadow-meetiq-sm">
      <div className="text-center sm:text-left mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
          Welcome to MeetIQ
        </h1>
        <p className="text-base text-slate-500 mt-2">
          Let&apos;s customize your workspace profile and default preferences.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-sm font-semibold">Your Full Name</Label>
          <Input
            id="displayName"
            type="text"
            placeholder="Enter your name"
            autoFocus
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
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
                onClick={() => onRoleChange(r)}
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
          <Select value={timezone} onValueChange={(val) => onTimezoneChange(val || 'UTC')}>
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

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            className="h-12 sm:w-1/3 hover:bg-slate-50"
            onClick={onSkip}
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
  );
}
