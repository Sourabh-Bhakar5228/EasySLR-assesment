'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);

  const errorParam = searchParams.get('error');

  React.useEffect(() => {
    if (errorParam) {
      if (errorParam === 'CredentialsSignin') {
        toast.error('Invalid email or password.');
      } else {
        toast.error('An error occurred during sign in.');
      }
    }
  }, [errorParam]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Signed in successfully!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-800/10 blur-[120px]" />

      <div className="w-full max-w-md z-10 animate-fade-in">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
            <FileText className="h-5.5 w-5.5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Easy<span className="text-primary-400">SLR</span>
          </span>
        </div>

        <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-white text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-slate-400 text-center text-sm">
              Enter your credentials to access your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <Input
                  {...register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="admin@easyslr.com"
                  error={errors.email?.message}
                  className="bg-slate-950/50 border-slate-800 focus:border-primary-500 text-white pl-10"
                />
                <Mail className="absolute left-3 top-[34px] h-4 w-4 text-slate-500" />
              </div>

              <div className="relative">
                <Input
                  {...register('password')}
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  className="bg-slate-950/50 border-slate-800 focus:border-primary-500 text-white pl-10"
                />
                <Lock className="absolute left-3 top-[34px] h-4 w-4 text-slate-500" />
              </div>

              <Button
                type="submit"
                className="w-full mt-2 bg-primary-600 hover:bg-primary-500 text-white font-medium"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              <p>Demo Email: <span className="text-slate-300 font-mono">admin@easyslr.com</span></p>
              <p className="mt-1">Demo Password: <span className="text-slate-300 font-mono">adminpassword123</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
