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
