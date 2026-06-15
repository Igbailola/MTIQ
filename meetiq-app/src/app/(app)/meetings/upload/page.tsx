'use client';

import React from 'react';
import { MeetingUploadForm } from '@/features/meetings/components/meeting-upload-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MeetingUploadPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="border border-meetiq-border/5 bg-white hover:bg-slate-50 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
            Analyze New Meeting
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            Provide a transcript or paste meeting summary notes for AI extraction.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <MeetingUploadForm />
      </div>
    </div>
  );
}
