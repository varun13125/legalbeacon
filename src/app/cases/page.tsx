// src/app/cases/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from 'react-icons/hi2';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

interface Case {
  id: string;
  title: string;
  case_number: string;
  case_type: string;
  status: string;
  client_id: string;
  client_name?: string;
  filing_date?: string;
  assigned_to?: string;
  assigned_to_name?: string;
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firmId, setFirmId] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

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
        }
      }
    }
    
    fetchFirmId();
  }, []);

  useEffect(() => {
    if (firmId) {
      fetchCases();
    }
  }, [firmId, searchTerm, statusFilter, typeFilter, currentPage]);

  const fetchCases = async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('cases')
        .select(`
          id,
          title,
          case_number,
          case_type,
          status,
          client_id,
          filing_date,
          assigned_to
        `)
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,case_number.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        query = query.eq('case_type', typeFilter);
      }
      
      // Count total for pagination
      const { count } = await query.select('id', { count: 'exact', head: true });
      
      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data: casesData, error } = await query
        .range(from, to);
      
      if (error) throw error;
      
      if (casesData) {
        // Calculate total pages
        setTotalPages(Math.ceil((count || 0) / itemsPerPage));
        
        // Get client names and assigned user names for each case
        const casesWithDetails = await Promise.all(
          casesData.map(async (caseItem) => {
            // Get client name
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
            
            // Get assigned user name if applicable
            let assignedToName;
            if (caseItem.assigned_to) {
              const { data: userData } = await supabase
                .from('users')
                .select('first_name, last_name')
                .eq('id', caseItem.assigned_to)
                .single();
              
              if (userData) {
                assignedToName = `${userData.first_name} ${userData.last_name}`;
              }
            }
            
            return {
              ...caseItem,
              client_name: clientName,
              assigned_to_name: assignedToName
            };
          })
        );
        
        setCases(casesWithDetails);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <MainLayout title="Cases">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Cases</h1>
        <Link href="/cases/new">
          <Button className="flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Case
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'closed', label: 'Closed' }
              ]}
              className="w-40"
            />
            
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'foreclosure', label: 'Foreclosure' },
                { value: 'civil litigation', label: 'Civil Litigation' },
                { value: 'family law', label: 'Family Law' },
                { value: 'corporate law', label: 'Corporate Law' },
                { value: 'real estate', label: 'Real Estate' }
              ]}
              className="w-40"
            />
          </div>
        </div>
      </Card>
      
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-white mb-2">No cases found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first case'}
            </p>
            {!(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <Link href="/cases/new">
                <Button>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Case
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
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
                      Filing Date
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
                  {cases.map((caseItem) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {caseItem.filing_date ? new Date(caseItem.filing_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {caseItem.assigned_to_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center border-t border-gray-700 px-4 py-3 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, cases.length)}
                      </span>{' '}
                      of <span className="font-medium">{totalPages * itemsPerPage}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        {/* Chevron left icon */}
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            currentPage === i + 1
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                          } text-sm font-medium`}
                        >
                          {i + 1}
                        </button>
                      ))
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        {/* Chevron right icon */}
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </MainLayout>
  );
}
