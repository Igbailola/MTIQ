'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, UploadCloud, FileText, Loader2, ArrowRight } from 'lucide-react';

interface UploadData {
  summary: { bullets: string[] };
  decisions: { content: string }[];
  commitments: { title: string; description: string | null; ai_confidence: string; priority: string; due_date: string | null }[];
}

interface UploadSectionProps {
  uploadTitle: string;
  uploadDate: string;
  fileName: string;
  fileContent: string;
  dragActive: boolean;
  uploadLoading: boolean;
  uploadedData: UploadData | null;
  onUploadTitleChange: (val: string) => void;
  onUploadDateChange: (val: string) => void;
  onFileContentChange: (val: string) => void;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  onChooseOther: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFinish: () => void;
}

export function UploadSection({
  uploadTitle, uploadDate, fileName, fileContent, dragActive, uploadLoading, uploadedData,
  onUploadTitleChange, onUploadDateChange, onFileContentChange,
  onDrag, onDrop, onFileChange, onFileRemove, onChooseOther, onSubmit, onFinish,
}: UploadSectionProps) {
  return (
    <div className="space-y-6 bg-white border border-slate-200 rounded-xl p-6 shadow-meetiq-xs">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
            Analyze Transcript
          </span>
          <h2 className="text-xl font-bold text-primary font-heading mt-1">Upload real notes</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onChooseOther} className="text-xs hover:bg-slate-50">
          Choose other option
        </Button>
      </div>

      {!uploadedData && (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="uploadTitle" className="text-sm font-semibold">Meeting Title</Label>
              <Input
                id="uploadTitle"
                value={uploadTitle}
                onChange={(e) => onUploadTitleChange(e.target.value)}
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
                onChange={(e) => onUploadDateChange(e.target.value)}
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
                  placeholder="Alex: I will write the database migrations by Friday.\nJames: Tolu and I can check the auth token refresh flow tomorrow."
                  rows={8}
                  value={fileContent}
                  onChange={(e) => onFileContentChange(e.target.value)}
                  disabled={uploadLoading}
                  className="font-mono text-xs"
                  required
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div
                onDragEnter={onDrag}
                onDragOver={onDrag}
                onDragLeave={onDrag}
                onDrop={onDrop}
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
                  onChange={onFileChange}
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
                    <Button type="button" variant="outline" size="sm" onClick={onFileRemove} disabled={uploadLoading}>
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
              <><Loader2 className="h-4 w-4 animate-spin" /><span>AI is processing notes...</span></>
            ) : (
              <><Sparkles className="h-4 w-4" /><span className="text-base">Analyze Meeting</span></>
            )}
          </Button>
        </form>
      )}

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

      {uploadedData && (
        <div className="space-y-6 animate-fade-in pt-4">
          <div className="ai-card p-5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="ai-label">AI Generated Summary</span>
            </div>
            <ul className="space-y-2 text-sm text-slate-700 leading-relaxed pl-5 list-disc">
              {uploadedData.summary.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </div>

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
                      <span className="ai-label">AI Suggested Commitment</span>
                      <span className="text-xs text-slate-400">{c.ai_confidence} confidence</span>
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
            <Button onClick={onFinish} className="h-12 px-8 gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md font-bold text-base" disabled={uploadLoading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Finish Onboarding</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
