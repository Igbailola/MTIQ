'use client';

import React, { useState } from 'react';
import type { Decision } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { logger } from '@/lib/logger';

interface DecisionCardProps {
  decision: Decision;
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const [feedback, setFeedback] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleThumbsUp = async () => {
    if (feedback === 'thumbs_up') return;
    setFeedback('thumbs_up');
    setShowForm(false);

    try {
      const fbRes = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'decision',
          entity_id: decision.id,
          feedback: 'thumbs_up',
        }),
      });
      if (!fbRes.ok) throw new Error('Feedback submission failed');
      toast.success('Thanks for your feedback! 👍');
    } catch (err) {
      logger.error("Error occurred", err, err);
    }
  };

  const handleThumbsDown = () => {
    setFeedback('thumbs_down');
    setShowForm(true);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const submitFeedbackForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'decision',
          entity_id: decision.id,
          feedback: 'thumbs_down',
          categories: selectedCategories,
        }),
      });

      if (res.ok) {
        toast.success('Thanks, this helps improve MeetIQ');
        setShowForm(false);
      } else {
        toast.error('Failed to save feedback');
      }
    } catch (err) {
      logger.error("Error occurred", err, err);
      toast.error('Error saving feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-meetiq-border/5 hover:border-slate-300/50 transition-colors bg-white shadow-meetiq-xs">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium font-body text-slate-800 leading-relaxed">
            {decision.content}
          </p>

          <div className="flex items-center gap-1.5 shrink-0">
            {decision.ai_confidence && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                decision.ai_confidence === 'high'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  : decision.ai_confidence === 'medium'
                  ? 'text-amber-700 bg-amber-50 border-amber-100'
                  : 'text-red-700 bg-red-50 border-red-100'
              }`}>
                {decision.ai_confidence === 'high' ? 'High' : decision.ai_confidence === 'medium' ? 'Medium' : 'Low'}
              </span>
            )}
          </div>
        </div>

        {/* Action / Feedback */}
        <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>AI Extracted</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 ${feedback === 'thumbs_up' ? 'text-emerald-600 bg-emerald-50' : ''}`}
              onClick={handleThumbsUp}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 ${feedback === 'thumbs_down' ? 'text-red-600 bg-red-50' : ''}`}
              onClick={handleThumbsDown}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Feedback form */}
        {showForm && (
          <form onSubmit={submitFeedbackForm} className="border-t border-dashed border-slate-200/5 pt-3 mt-2 space-y-2 bg-slate-50 p-3 rounded-md border">
            <p className="text-xs font-semibold text-primary">What needs improvement?</p>
            <div className="grid grid-cols-2 gap-1.5">
              {['Inaccurate phrasing', 'Not a decision', 'Wrong context', 'Missing context', 'Other'].map((category) => (
                <div key={category} className="flex items-center space-x-1.5">
                  <Checkbox
                    id={`decision-cat-${category}`}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  <Label
                    htmlFor={`decision-cat-${category}`}
                    className="text-xs font-normal text-slate-600 cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-1.5 pt-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
