// src/app/login/page.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-950">
      <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-gradient-to-br from-blue-900 to-gray-900">
        <div className="max-w-2xl px-8">
          <h1 className="text-4xl font-bold text-white mb-6">LegalBeacon</h1>
          <p className="text-xl text-gray-300">
            Your comprehensive legal case management platform for foreclosure and beyond.
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Sign in to your account</h2>
          </div>
          
          {error && (
            <div className="bg-red-500 text-white p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <Link href="/reset-password" className="font-medium text-blue-500 hover:text-blue-400">
                  Forgot your password?
                </Link>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-blue-500 hover:text-blue-400">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/app/register/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least 1 special character'),
  confirmPassword: z.string(),
  firmName: z.string().min(2, 'Firm name is required'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. Create the user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. Create the firm
      const { data: firmData, error: firmError } = await supabase
        .from('firms')
        .insert({
          name: data.firmName,
          address: '', // These would be filled in later
          phone: '',
          email: data.email,
          subscription_tier: 'basic',
        })
        .select();

      if (firmError) throw firmError;
      if (!firmData || firmData.length === 0) throw new Error('Firm creation failed');

      // 3. Create the user profile linked to the firm
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          role: 'admin', // First user is an admin
          firm_id: firmData[0].id,
        });

      if (userError) throw userError;

      // Success - redirect to confirmation page
      router.push('/register/confirmation');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-950">
      <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-gradient-to-br from-blue-900 to-gray-900">
        <div className="max-w-2xl px-8">
          <h1 className="text-4xl font-bold text-white mb-6">LegalBeacon</h1>
          <p className="text-xl text-gray-300">
            Join thousands of legal professionals who trust LegalBeacon for their case management needs.
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Create your account</h2>
          </div>
          
          {error && (
            <div className="bg-red-500 text-white p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('firstName')}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('lastName')}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="firmName" className="block text-sm font-medium text-gray-300 mb-1">
                Firm Name
              </label>
              <input
                id="firmName"
                type="text"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('firmName')}
              />
              {errors.firmName && (
                <p className="text-red-500 text-sm mt-1">{errors.firmName.message}</p>
              )}
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800"
                  {...register('acceptTerms')}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="acceptTerms" className="text-gray-300">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-500 hover:text-blue-400">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-500 hover:text-blue-400">
                    Privacy Policy
                  </Link>
                </label>
                {errors.acceptTerms && (
                  <p className="text-red-500 text-sm mt-1">{errors.acceptTerms.message}</p>
                )}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BriefcaseIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  PlusIcon
} from 'react-icons/hi2';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Case {
  id: string;
  title: string;
  case_number: string;
  case_type: string;
  status: string;
  client_id: string;
  client_name?: string;
}

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  upcomingDeadlines: number;
  totalParties: number;
  totalDocuments: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    upcomingDeadlines: 0,
    totalParties: 0,
    totalDocuments: 0,
  });

  useEffect(() => {
    async function fetchUserAndData() {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Get user's firm_id
        const { data: userData } = await supabase
          .from('users')
          .select('firm_id')
          .eq('id', user.id)
          .single();
        
        if (userData?.firm_id) {
          const firmId = userData.firm_id;
          
          // Fetch recent cases
          const { data: casesData } = await supabase
            .from('cases')
            .select(`
              id,
              title,
              case_number,
              case_type,
              status,
              client_id
            `)
            .eq('firm_id', firmId)
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (casesData) {
            // Get client names for each case
            const casesWithClients = await Promise.all(
              casesData.map(async (caseItem) => {
                const { data: clientData } = await supabase
                  .from('parties')
                  .select('first_name, last_name, organization_name')
                  .eq('id', caseItem.client_id)
                  .single();
                
                let clientName = 'Unknown Client';
                if (clientData) {
                  clientName = clientData.organization_name || 
                    `${clientData.first_name} ${clientData.last_name}`;
                }
                
                return {
                  ...caseItem,
                  client_name: clientName
                };
              })
            );
            
            setRecentCases(casesWithClients);
          }
          
          // Fetch dashboard stats
          const [
            { count: totalCases },
            { count: activeCases },
            { count: upcomingDeadlines },
            { count: totalParties },
            { count: totalDocuments }
          ] = await Promise.all([
            supabase.from('cases').select('*', { count: 'exact', head: true }).eq('firm_id', firmId),
            supabase.from('cases').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).eq('status', 'active'),
            supabase.from('deadlines').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).gte('due_date', new Date().toISOString()).lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
            supabase.from('parties').select('*', { count: 'exact', head: true }).eq('firm_id', firmId),
            supabase.from('documents').select('*', { count: 'exact', head: true }).eq('firm_id', firmId)
          ]);
          
          setStats({
            totalCases: totalCases || 0,
            activeCases: activeCases || 0,
            upcomingDeadlines: upcomingDeadlines || 0,
            totalParties: totalParties || 0,
            totalDocuments: totalDocuments || 0
          });
        }
      }
      
      setIsLoading(false);
    }
    
    fetchUserAndData();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'closed':
        return 'default';
      default:
        return 'info';
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.user_metadata?.first_name || 'User'}
        </h1>
        <p className="text-gray-400 mt-1">
          Here's what's happening with your cases today
        </p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-700 mr-4">
              <BriefcaseIcon className="h-6 w-6 text-blue-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-200">Total Cases</p>
              <p className="text-2xl font-bold text-white">{stats.totalCases}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900 to-green-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-700 mr-4">
              <BriefcaseIcon className="h-6 w-6 text-green-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-200">Active Cases</p>
              <p className="text-2xl font-bold text-white">{stats.activeCases}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-700 mr-4">
              <ClockIcon className="h-6 w-6 text-yellow-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-200">Upcoming Deadlines</p>
              <p className="text-2xl font-bold text-white">{stats.upcomingDeadlines}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-900 to-purple-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-700 mr-4">
              <UserGroupIcon className="h-6 w-6 text-purple-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-200">Parties</p>
              <p className="text-2xl font-bold text-white">{stats.totalParties}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-900 to-indigo-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-700 mr-4">
              <DocumentTextIcon className="h-6 w-6 text-indigo-200" />
            </div>
            <div>
              <p className="text-sm font-medium text-indigo-200">Documents</p>
              <p className="text-2xl font-bold text-white">{stats.totalDocuments}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Recent cases section */}
      <Card title="Recent Cases" className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Recent Cases</h3>
          <Link href="/cases/new">
            <Button size="sm" className="flex items-center">
              <PlusIcon className="h-4 w-4 mr-1" />
              New Case
            </Button>
          </Link>
        </div>
        
        {recentCases.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No cases found</p>
            <Link href="/cases/new">
              <Button variant="primary" size="md" className="mt-4">
                Create your first case
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Case
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Case Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentCases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/cases/${caseItem.id}`} className="text-blue-400 hover:text-blue-300">
                        {caseItem.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {caseItem.case_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {caseItem.case_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {caseItem.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                        {caseItem.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/cases/${caseItem.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {recentCases.length > 0 && (
          <div className="mt-4 text-right">
            <Link href="/cases" className="text-blue-400 hover:text-blue-300 text-sm">
              View all cases →
            </Link>
          </div>
        )}
      </Card>
      
      {/* Quick actions section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/cases/new">
              <Button variant="primary" className="w-full justify-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Case
              </Button>
            </Link>
            <Link href="/parties/new">
              <Button variant="secondary" className="w-full justify-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Party
              </Button>
            </Link>
            <Link href="/documents/new">
              <Button variant="outline" className="w-full justify-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                New Document
              </Button>
            </Link>
          </div>
        </Card>
        
        <Card className="col-span-2">
          <h3 className="text-lg font-medium text-white mb-4">Upcoming Deadlines</h3>
          {/* Placeholder for upcoming deadlines */}
          <div className="text-center py-8">
            <p className="text-gray-400">No upcoming deadlines</p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
