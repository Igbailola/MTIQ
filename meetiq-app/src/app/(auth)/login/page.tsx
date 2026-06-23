'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { LoginSchema, type LoginInput } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import { logger } from '@/lib/logger';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();
  const [nextParam, setNextParam] = useState('/dashboard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next) {
        setNextParam(next);
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Successfully logged in!');
        router.refresh();
        
        const params = new URLSearchParams(window.location.search);
        const next = params.get('next') ?? '/dashboard';
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .maybeSingle();
          
          if (profile && !profile.onboarding_completed) {
            router.push(`/onboarding?next=${encodeURIComponent(next)}`);
            return;
          }
        }
        
        router.push(next);
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
      logger.error("Error occurred", err, err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error('Failed to initiate Google sign-in.');
      logger.error("Error occurred", err, err);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center sm:text-left mb-[26px]">
        <h2 className="text-2xl font-semibold text-primary font-heading">Sign In</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Enter your credentials to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={loading}
            {...register('email')}
            className={`h-[44px] ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-0">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-base">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              disabled={loading}
              {...register('password')}
              className={`h-[44px] pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive mt-0">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <div className="relative flex pt-0 pb-2 items-center mb-0">
        <div className="flex-grow border-t border-meetiq-border/30"></div>
        <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase font-semibold">OR</span>
        <div className="flex-grow border-t border-meetiq-border/30"></div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-base bg-white text-slate-700 border-meetiq-border/30 hover:bg-slate-50"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
      >
        {googleLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
        Continue with Google
      </Button>

      <div className="text-center text-xs text-muted-foreground mt-4">
        Don&apos;t have an account?{' '}
        <Link href={`/register?next=${encodeURIComponent(nextParam)}`} className="text-accent hover:underline font-semibold">
          Sign up
        </Link>
      </div>
    </div>
  );
}
