'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useUploadMeeting } from '@/hooks/use-meetings';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { MeetingUploadSchema, type MeetingUploadInput } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileText, Loader2, UploadCloud, AlertTriangle } from 'lucide-react';
import { MAX_TRANSCRIPT_CHARS as MAX_SAFE_CHARS, HARD_LIMIT_CHARS, FILE_SIZE_LIMIT_BYTES } from '@/lib/constants';

import { logger } from '@/lib/logger';

export function MeetingUploadForm() {
  const router = useRouter();
  const { currentWorkspace } = useCurrentWorkspace();
  const uploadMeetingMutation = useUploadMeeting();
  
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Omit<MeetingUploadInput, 'workspace_id'>>({
    resolver: zodResolver(MeetingUploadSchema.omit({ workspace_id: true })),
    defaultValues: {
      title: '',
      meeting_date: new Date().toISOString().split('T')[0],
      raw_text: '',
    },
  });
  const rawTextValue = watch('raw_text');
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
    // Standard limit checks
    if (file.size > FILE_SIZE_LIMIT_BYTES) {
      toast.error('File size exceeds 10MB limit');
      return;
    }
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      toast.error('Only plain text (.txt) files are supported natively. Please copy and paste Word or PDF content.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text.length > HARD_LIMIT_CHARS) {
        toast.error(`File exceeds 500,000 character limit (${(text.length / 1000).toFixed(0)}K chars). Please split into smaller files.`);
        setFileName('');
        return;
      }
      setFileContent(text);
      setValue('raw_text', text);
      if (text.length > MAX_SAFE_CHARS) {
        toast.warning('Large transcript — the AI model may not process the full content. Consider splitting into shorter segments.');
      } else {
        toast.success(`Successfully loaded ${file.name}`);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file content');
    };
    reader.readAsText(file);
  };
  const onSubmit = async (data: Omit<MeetingUploadInput, 'workspace_id'>) => {
    if (!currentWorkspace) {
      toast.error('Please select or create a workspace first.');
      return;
    }
    if (!data.raw_text?.trim()) {
      toast.error('Please upload a file or paste meeting text.');
      return;
    }
    if (data.raw_text.length > MAX_SAFE_CHARS) {
      toast.warning('Transcript is too long for the AI model to process in full. Please split into shorter segments (max ~400K characters).');
      return;
    }
    setLoading(true);
    try {
      const meeting = await uploadMeetingMutation.mutateAsync({
        ...data,
        workspace_id: currentWorkspace.id,
      });
      // Kick off processing explicitly from browser client to bypass Next.js background fetch limitations
      fetch(`/api/meetings/${meeting.id}/process`, {
        method: 'POST',
      }).then(res => {
        if (!res.ok) logger.error('Process trigger returned:', res.status);
      }).catch((err) => {
        logger.error('Error triggering client-side process:', err);
      });
      router.push(`/meetings/${meeting.id}`);
    } catch (err) {
      logger.error("Error occurred", err, err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card className="border border-meetiq-border/50 shadow-meetiq-xs">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="e.g. Weekly Sync, Project Alignment"
                disabled={loading}
                {...register('title')}
                className={`h-10 ${errors.title ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_date">Meeting Date</Label>
              <Input
                id="meeting_date"
                type="date"
                disabled={loading}
                {...register('meeting_date')}
                className={`h-10 ${errors.meeting_date ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {errors.meeting_date && (
                <p className="text-xs text-destructive mt-1">{errors.meeting_date.message}</p>
              )}
            </div>
          </div>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-slate-100 p-0.5 rounded-lg h-10">
              <TabsTrigger value="upload" className="rounded-md text-sm font-semibold">Upload Transcript</TabsTrigger>
              <TabsTrigger value="paste" className="rounded-md text-sm font-semibold">Paste Notes / Text</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${dragActive ? 'border-accent bg-blue-50/20' : 'border-meetiq-border/50 bg-slate-50/50 hover:bg-slate-50'}`}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".txt"
                  onChange={handleFileChange}
                  disabled={loading}
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
                      {fileContent.length > MAX_SAFE_CHARS && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center justify-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Large transcript — the AI may not process the full content. Consider splitting into shorter segments.
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFileName('');
                        setFileContent('');
                        setValue('raw_text', '');
                      }}
                      disabled={loading}
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
            <TabsContent value="paste" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="raw_text">Transcript / Notes Content</Label>
                <Textarea
                  id="raw_text"
                  placeholder="Sarah: Let's release the API v2 auth endpoints by Friday.
James: I will update the documentation before the Friday release..."
                  rows={8}
                  disabled={loading}
                  {...register('raw_text')}
                  className={`font-mono text-xs ${errors.raw_text ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Paste raw transcript dialogs or summary bullet notes. Best speaker alignment comes from dialogues.
                  </p>
                  <span className={`text-xs tabular-nums ${(rawTextValue?.length || 0) > MAX_SAFE_CHARS ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                    {((rawTextValue?.length || 0) / 1000).toFixed(0)}K / {HARD_LIMIT_CHARS.toLocaleString()} chars
                  </span>
                </div>
                {(rawTextValue?.length || 0) > MAX_SAFE_CHARS && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Large transcript — the AI may not process the full content. Consider splitting into shorter segments.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <Button type="submit" className="h-12 gap-2 px-6" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Transcript...
              </>
            ) : (
              <span className="text-base">Analyze Meeting</span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
