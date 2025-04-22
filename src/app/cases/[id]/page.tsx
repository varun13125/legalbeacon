// src/app/cases/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PencilIcon, 
  DocumentIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  UserIcon,
  HomeIcon,
  PlusIcon,
  TrashIcon
} from 'react-icons/hi2';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

// Define types
interface Case {
  id: string;
  title: string;
  case_number: string;
  case_type: string;
  status: string;
  description: string | null;
  client_id: string;
  opposing_party_id: string | null;
  court_name: string | null;
  court_location: string | null;
  judge_name: string | null;
  filing_date: string | null;
  closure_date: string | null;
  assigned_to: string | null;
}

interface Party {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  type: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface SecurityInterest {
  id: string;
  type: string;
  description: string;
  property_address: string | null;
  recorded_date: string | null;
  amount: number;
  lien_position: number | null;
  lender_id: string;
  borrower_id: string;
  maturity_date: string | null;
  interest_rate: number | null;
  property_value: number | null;
  lender_name?: string;
  borrower_name?: string;
}

interface Document {
  id: string;
  name: string;
  document_type: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  version: number;
  created_at: string;
  uploader_name?: string;
}

interface Deadline {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  reminder_date: string | null;
  assignee_name?: string;
}

interface Financial {
  id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  recorded_by: string;
  invoice_id: string | null;
  party_id: string | null;
  recorder_name?: string;
  party_name?: string;
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [client, setClient] = useState<Party | null>(null);
  const [opposingParty, setOpposingParty] = useState<Party | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [securityInterests, setSecurityInterests] = useState<SecurityInterest[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    if (caseId) {
      fetchCaseData();
    }
  }, [caseId]);
  
  const fetchCaseData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch case details
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();
      
      if (caseError) throw caseError;
      setCaseData(caseData);
      
      // Fetch related data in parallel
      await Promise.all([
        fetchParties(caseData),
        fetchAssignedUser(caseData),
        fetchSecurityInterests(caseData),
        fetchDocuments(caseData),
        fetchDeadlines(caseData),
        fetchFinancials(caseData)
      ]);
    } catch (error) {
      console.error('Error fetching case data:', error);
      // Handle not found
      router.push('/cases');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchParties = async (caseData: Case) => {
    // Fetch client
    if (caseData.client_id) {
      const { data: clientData } = await supabase
        .from('parties')
        .select('*')
        .eq('id', caseData.client_id)
        .single();
      
      setClient(clientData || null);
    }
    
    // Fetch opposing party if exists
    if (caseData.opposing_party_id) {
      const { data: opposingPartyData } = await supabase
        .from('parties')
        .select('*')
        .eq('id', caseData.opposing_party_id)
        .single();
      
      setOpposingParty(opposingPartyData || null);
    }
  };
  
  const fetchAssignedUser = async (caseData: Case) => {
    if (caseData.assigned_to) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', caseData.assigned_to)
        .single();
      
      setAssignedUser(userData || null);
    }
  };
  
  const fetchSecurityInterests = async (caseData: Case) => {
    // Only fetch security interests for foreclosure cases
    if (caseData.case_type.toLowerCase() === 'foreclosure') {
      const { data: interestsData } = await supabase
        .from('security_interests')
        .select('*')
        .eq('case_id', caseData.id);
      
      if (interestsData && interestsData.length > 0) {
        // Fetch party names for each security interest
        const interestsWithNames = await Promise.all(
          interestsData.map(async (interest) => {
            // Get lender name
            const { data: lenderData } = await supabase
              .from('parties')
              .select('first_name, last_name, organization_name')
              .eq('id', interest.lender_id)
              .single();
            
            // Get borrower name
            const { data: borrowerData } = await supabase
              .from('parties')
              .select('first_name, last_name, organization_name')
              .eq('id', interest.borrower_id)
              .single();
            
            return {
              ...interest,
              lender_name: getPartyDisplayName(lenderData),
              borrower_name: getPartyDisplayName(borrowerData)
            };
          })
        );
        
        setSecurityInterests(interestsWithNames);
      } else {
        setSecurityInterests([]);
      }
    }
  };
  
  const fetchDocuments = async (caseData: Case) => {
    const { data: documentsData } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseData.id)
      .order('created_at', { ascending: false });
    
    if (documentsData && documentsData.length > 0) {
      // Get uploader names
      const documentsWithUploaders = await Promise.all(
        documentsData.map(async (doc) => {
          const { data: userData } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', doc.uploaded_by)
            .single();
          
          return {
            ...doc,
            uploader_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unknown'
          };
        })
      );
      
      setDocuments(documentsWithUploaders);
    } else {
      setDocuments([]);
    }
  };
  
  const fetchDeadlines = async (caseData: Case) => {
    const { data: deadlinesData } = await supabase
      .from('deadlines')
      .select('*')
      .eq('case_id', caseData.id)
      .order('due_date', { ascending: true });
    
    if (deadlinesData && deadlinesData.length > 0) {
      // Get assignee names
      const deadlinesWithAssignees = await Promise.all(
        deadlinesData.map(async (deadline) => {
          if (deadline.assigned_to) {
            const { data: userData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', deadline.assigned_to)
              .single();
            
            return {
              ...deadline,
              assignee_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unassigned'
            };
          }
          
          return {
            ...deadline,
            assignee_name: 'Unassigned'
          };
        })
      );
      
      setDeadlines(deadlinesWithAssignees);
    } else {
      setDeadlines([]);
    }
  };
  
  const fetchFinancials = async (caseData: Case) => {
    const { data: financialsData } = await supabase
      .from('financials')
      .select('*')
      .eq('case_id', caseData.id)
      .order('transaction_date', { ascending: false });
    
    if (financialsData && financialsData.length > 0) {
      // Get recorder and party names
      const financialsWithNames = await Promise.all(
        financialsData.map(async (financial) => {
          // Get recorder name
          const { data: userData } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', financial.recorded_by)
            .single();
          
          let partyName = null;
          if (financial.party_id) {
            const { data: partyData } = await supabase
              .from('parties')
              .select('first_name, last_name, organization_name')
              .eq('id', financial.party_id)
              .single();
            
            partyName = getPartyDisplayName(partyData);
          }
          
          return {
            ...financial,
            recorder_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unknown',
            party_name: partyName
          };
        })
      );
      
      setFinancials(financialsWithNames);
    } else {
      setFinancials([]);
    }
  };
  
  // Helper function to get party display name
  const getPartyDisplayName = (party: any) => {
    if (!party) return 'Unknown';
    
    if (party.organization_name) {
      return party.organization_name;
    }
    return `${party.first_name || ''} ${party.last_name || ''}`.trim();
  };
  
  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Helper for status badges
  const getStatusBadgeVariant = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'closed':
        return 'default';
      case 'completed':
        return 'success';
      case 'overdue':
        return 'danger';
      default:
        return 'info';
    }
  };
  
  // Helper for priority badges
  const getPriorityBadgeVariant = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // Helper for file size formatting
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  // Handler for deleting a case
  const handleDeleteCase = async () => {
    if (!caseData) return;
    
    if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        
        // Delete all related records first
        await Promise.all([
          supabase.from('security_interests').delete().eq('case_id', caseData.id),
          supabase.from('documents').delete().eq('case_id', caseData.id),
          supabase.from('deadlines').delete().eq('case_id', caseData.id),
          supabase.from('financials').delete().eq('case_id', caseData.id)
        ]);
        
        // Then delete the case itself
        const { error } = await supabase
          .from('cases')
          .delete()
          .eq('id', caseData.id);
        
        if (error) throw error;
        
        // Redirect back to cases list
        router.push('/cases');
      } catch (error) {
        console.error('Error deleting case:', error);
        alert('Failed to delete the case. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout title="Case Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!caseData) {
    return (
      <MainLayout title="Case Not Found">
        <Card>
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-white mb-2">Case Not Found</h2>
            <p className="text-gray-400 mb-6">The case you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/cases">
              <Button>Back to Cases</Button>
            </Link>
          </div>
        </Card>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={caseData.title}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{caseData.title}</h1>
            <Badge variant={getStatusBadgeVariant(caseData.status)}>
              {caseData.status}
            </Badge>
          </div>
          <p className="text-gray-400 mt-1">Case Number: {caseData.case_number}</p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Link href={`/cases/${caseId}/edit`}>
            <Button variant="outline" className="flex items-center">
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          
          <Button variant="danger" className="flex items-center" onClick={handleDeleteCase}>
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          {caseData.case_type.toLowerCase() === 'foreclosure' && (
            <TabsTrigger value="security">Security Interests</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Case Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-400">Title</p>
                    <p className="text-white">{caseData.title}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Case Number</p>
                    <p className="text-white">{caseData.case_number}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Case Type</p>
                    <p className="text-white">{caseData.case_type}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <div>
                      <Badge variant={getStatusBadgeVariant(caseData.status)}>
                        {caseData.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Filing Date</p>
                    <p className="text-white">{formatDate(caseData.filing_date)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Closure Date</p>
                    <p className="text-white">{formatDate(caseData.closure_date)}</p>
                  </div>
                </div>
                
                {caseData.description && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-400 mb-2">Description</p>
                    <p className="text-white whitespace-pre-line">{caseData.description}</p>
                  </div>
                )}
              </Card>
              
              <Card className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Court Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-400">Court Name</p>
                    <p className="text-white">{caseData.court_name || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Court Location</p>
                    <p className="text-white">{caseData.court_location || '-'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400">Judge Name</p>
                    <p className="text-white">{caseData.judge_name || '-'}</p>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Parties</h2>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">Client</p>
                  {client ? (
                    <div className="bg-gray-700 p-3 rounded-md">
                      <p className="text-white font-medium">
                        {getPartyDisplayName(client)}
                      </p>
                      {client.email && <p className="text-gray-300 text-sm">{client.email}</p>}
                      {client.phone && <p className="text-gray-300 text-sm">{client.phone}</p>}
                    </div>
                  ) : (
                    <p className="text-gray-400">No client information</p>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Opposing Party</p>
                  {opposingParty ? (
                    <div className="bg-gray-700 p-3 rounded-md">
                      <p className="text-white font-medium">
                        {getPartyDisplayName(opposingParty)}
                      </p>
                      {opposingParty.email && <p className="text-gray-300 text-sm">{opposingParty.email}</p>}
                      {opposingParty.phone && <p className="text-gray-300 text-sm">{opposingParty.phone}</p>}
                    </div>
                  ) : (
                    <p className="text-gray-400">No opposing party information</p>
                  )}
                </div>
              </Card>
              
              <Card className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Assignment</h2>
                
                {assignedUser ? (
                  <div className="bg-gray-700 p-3 rounded-md">
                    <p className="text-white font-medium">
                      {`${assignedUser.first_name} ${assignedUser.last_name}`}
                    </p>
                    <p className="text-gray-300 text-sm">{assignedUser.email}</p>
                  </div>
                ) : (
                  <p className="text-gray-400">Not assigned</p>
                )}
              </Card>
              
              <Card>
                <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                
                <div className="space-y-2">
                  <Link href={`/cases/${caseId}/documents/new`}>
                    <Button variant="outline" className="w-full justify-center">
                      <DocumentIcon className="h-5 w-5 mr-2" />
                      Add Document
                    </Button>
                  </Link>
                  
                  <Link href={`/cases/${caseId}/deadlines/new`}>
                    <Button variant="outline" className="w-full justify-center">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      Add Deadline
                    </Button>
                  </Link>
                  
                  <Link href={`/cases/${caseId}/financials/new`}>
                    <Button variant="outline" className="w-full justify-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                      Add Financial Record
                    </Button>
                  </Link>
                  
                  {caseData.case_type.toLowerCase() === 'foreclosure' && (
                    <Link href={`/cases/${caseId}/security/new`}>
                      <Button variant="outline" className="w-full justify-center">
                        <HomeIcon className="h-5 w-5 mr-2" />
                        Add Security Interest
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Documents</h2>
              <Link href={`/cases/${caseId}/documents/new`}>
                <Button className="flex items-center">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </Link>
            </div>
            
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-6">No documents found for this case</p>
                <Link href={`/cases/${caseId}/documents/new`}>
                  <Button>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Document
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Uploaded By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <span className="text-white">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {doc.document_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {doc.uploader_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {formatDate(doc.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="deadlines">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Deadlines</h2>
              <Link href={`/cases/${caseId}/deadlines/new`}>
                <Button className="flex items-center">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Deadline
                </Button>
              </Link>
            </div>
            
            {deadlines.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-6">No deadlines found for this case</p>
                <Link href={`/cases/${caseId}/deadlines/new`}>
                  <Button>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Deadline
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {deadlines.map((deadline) => (
                      <tr key={deadline.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <span className="text-white">{deadline.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {formatDate(deadline.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getPriorityBadgeVariant(deadline.priority)}>
                            {deadline.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(deadline.status)}>
                            {deadline.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {deadline.assignee_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="financials">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Financial Records</h2>
              <Link href={`/cases/${caseId}/financials/new`}>
                <Button className="flex items-center">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Financial Record
                </Button>
              </Link>
            </div>
            
            {financials.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-6">No financial records found for this case</p>
                <Link href={`/cases/${caseId}/financials/new`}>
                  <Button>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Financial Record
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Related Party
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Recorded By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {financials.map((financial) => (
                      <tr key={financial.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <span className="text-white">{financial.transaction_type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          ${financial.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {financial.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {formatDate(financial.transaction_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {financial.party_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                          {financial.recorder_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
        
        {caseData.case_type.toLowerCase() === 'foreclosure' && (
          <TabsContent value="security">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Security Interests</h2>
                <Link href={`/cases/${caseId}/security/new`}>
                  <Button className="flex items-center">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Security Interest
                  </Button>
                </Link>
              </div>
              
              {securityInterests.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-6">No security interests found for this case</p>
                  <Link href={`/cases/${caseId}/security/new`}>
                    <Button>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add Security Interest
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Property
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Lien Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Lender
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Borrower
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {securityInterests.map((interest) => (
                        <tr key={interest.id} className="hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <HomeIcon className="h-5 w-5 text-gray-400 mr-3" />
                              <span className="text-white">{interest.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            {interest.property_address || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            ${interest.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            {interest.lien_position || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            {interest.lender_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            {interest.borrower_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </MainLayout>
  );
}
