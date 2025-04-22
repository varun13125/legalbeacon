// src/app/cases/new/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

// Define types for parties and users
interface Party {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  is_client: boolean;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

// Form schema
const newCaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  case_number: z.string().min(1, 'Case number is required'),
  case_type: z.string().min(1, 'Case type is required'),
  status: z.string().min(1, 'Status is required'),
  description: z.string().optional(),
  client_id: z.string().min(1, 'Client is required'),
  opposing_party_id: z.string().optional(),
  assigned_to: z.string().optional(),
  court_name: z.string().optional(),
  court_location: z.string().optional(),
  judge_name: z.string().optional(),
  filing_date: z.date().optional(),
});

type NewCaseFormValues = z.infer<typeof newCaseSchema>;

export default function NewCasePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [firmId, setFirmId] = useState<string | null>(null);
  const [clients, setClients] = useState<Party[]>([]);
  const [opposingParties, setOpposingParties] = useState<Party[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<NewCaseFormValues>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      status: 'active',
      case_type: 'foreclosure',
    },
  });

  useEffect(() => {
    async function fetchFirmId() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('firm_id')
          .eq('id', user.id)
          .single();
        
        if (data?.firm_id) {
          setFirmId(data.firm_id);
          fetchParties(data.firm_id);
          fetchUsers(data.firm_id);
        }
      }
    }
    
    fetchFirmId();
  }, []);

  const fetchParties = async (firmId: string) => {
    // Fetch clients
    const { data: clientsData } = await supabase
      .from('parties')
      .select('id, first_name, last_name, organization_name')
      .eq('firm_id', firmId)
      .eq('is_client', true);
    
    if (clientsData) {
      setClients(clientsData);
    }
    
    // Fetch opposing parties
    const { data: opposingPartiesData } = await supabase
      .from('parties')
      .select('id, first_name, last_name, organization_name')
      .eq('firm_id', firmId)
      .eq('is_client', false);
    
    if (opposingPartiesData) {
      setOpposingParties(opposingPartiesData);
    }
  };

  const fetchUsers = async (firmId: string) => {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('firm_id', firmId);
    
    if (data) {
      setUsers(data);
    }
  };

  const onSubmit = async (data: NewCaseFormValues) => {
    if (!firmId) return;
    
    setIsLoading(true);
    
    try {
      // Create the case
      const { data: newCase, error } = await supabase
        .from('cases')
        .insert({
          firm_id: firmId,
          title: data.title,
          case_number: data.case_number,
          case_type: data.case_type,
          status: data.status,
          description: data.description || null,
          client_id: data.client_id,
          opposing_party_id: data.opposing_party_id || null,
          assigned_to: data.assigned_to || null,
          court_name: data.court_name || null,
          court_location: data.court_location || null,
          judge_name: data.judge_name || null,
          filing_date: data.filing_date ? data.filing_date.toISOString() : null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // If it's a foreclosure case, set up additional fields
      if (data.case_type === 'foreclosure' && newCase) {
        // For simplicity, we'd usually prompt for more information here
        // Let's assume we're creating placeholder security interest data
        await supabase
          .from('security_interests')
          .insert({
            firm_id: firmId,
            case_id: newCase.id,
            type: 'Mortgage',
            description: 'Primary mortgage on property',
            lender_id: data.client_id, // Assuming client is the lender
            borrower_id: data.opposing_party_id || data.client_id, // Fallback if no opposing party
            amount: 0, // Would be collected in a more detailed form
          });
      }
      
      // Redirect to the case page
      router.push(`/cases/${newCase?.id || ''}`);
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPartyDisplayName = (party: Party) => {
    if (party.organization_name) {
      return party.organization_name;
    }
    return `${party.first_name || ''} ${party.last_name || ''}`.trim();
  };

  return (
    <MainLayout title="New Case">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create New Case</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Case Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Title"
                  id="title"
                  {...register('title')}
                  error={errors.title?.message}
                />
                
                <Input
                  label="Case Number"
                  id="case_number"
                  {...register('case_number')}
                  error={errors.case_number?.message}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Select
                  label="Case Type"
                  id="case_type"
                  {...register('case_type')}
                  error={errors.case_type?.message}
                  options={[
                    { value: 'foreclosure', label: 'Foreclosure' },
                    { value: 'civil litigation', label: 'Civil Litigation' },
                    { value: 'family law', label: 'Family Law' },
                    { value: 'corporate law', label: 'Corporate Law' },
                    { value: 'real estate', label: 'Real Estate' },
                  ]}
                />
                
                <Select
                  label="Status"
                  id="status"
                  {...register('status')}
                  error={errors.status?.message}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                />
              </div>
              
              <div className="mt-4">
                <Textarea
                  label="Description"
                  id="description"
                  {...register('description')}
                  error={errors.description?.message}
                />
              </div>
            </Card>
            
            <Card className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Court Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Court Name"
                  id="court_name"
                  {...register('court_name')}
                  error={errors.court_name?.message}
                />
                
                <Input
                  label="Court Location"
                  id="court_location"
                  {...register('court_location')}
                  error={errors.court_location?.message}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Judge Name"
                  id="judge_name"
                  {...register('judge_name')}
                  error={errors.judge_name?.message}
                />
                
                <div className="flex flex-col">
                  <label htmlFor="filing_date" className="block text-sm font-medium text-gray-300 mb-1">
                    Filing Date
                  </label>
                  <Controller
                    control={control}
                    name="filing_date"
                    render={({ field: { onChange, value } }) => (
                      <DatePicker
                        selected={value}
                        onChange={onChange}
                        dateFormat="MM/dd/yyyy"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        wrapperClassName="w-full"
                      />
                    )}
                  />
                  {errors.filing_date && (
                    <p className="text-red-500 text-sm mt-1">{errors.filing_date.message}</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Parties</h2>
              
              <div className="mb-4">
                <Select
                  label="Client"
                  id="client_id"
                  {...register('client_id')}
                  error={errors.client_id?.message}
                  options={[
                    { value: '', label: 'Select a client' },
                    ...clients.map(client => ({
                      value: client.id,
                      label: getPartyDisplayName(client)
                    }))
                  ]}
                />
              </div>
              
              <div className="mb-4">
                <Select
                  label="Opposing Party"
                  id="opposing_party_id"
                  {...register('opposing_party_id')}
                  error={errors.opposing_party_id?.message}
                  options={[
                    { value: '', label: 'Select an opposing party' },
                    ...opposingParties.map(party => ({
                      value: party.id,
                      label: getPartyDisplayName(party)
                    }))
                  ]}
                />
              </div>
            </Card>
            
            <Card className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Assignment</h2>
              
              <div className="mb-4">
                <Select
                  label="Assigned To"
                  id="assigned_to"
                  {...register('assigned_to')}
                  error={errors.assigned_to?.message}
                  options={[
                    { value: '', label: 'Not assigned' },
                    ...users.map(user => ({
                      value: user.id,
                      label: `${user.first_name} ${user.last_name}`
                    }))
                  ]}
                />
              </div>
            </Card>
            
            <div className="flex justify-end mt-6">
              <Button
                type="button"
                variant="outline"
                className="mr-4"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                isLoading={isLoading}
              >
                Create Case
              </Button>
            </div>
          </div>
        </div>
      </form>
    </MainLayout>
  );
}
