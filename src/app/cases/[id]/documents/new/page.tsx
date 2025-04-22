// src/app/cases/[id]/documents/new/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const documentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  document_type: z.string().min(1, 'Document type is required'),
  related_party_id: z.string().optional(),
  file: z.instanceof(FileList).refine(files => files.length > 0, 'File is required'),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

export default function NewDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [isLoading, setIsLoading] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);
  const [parties, setParties] = useState<any[]>([]);
  const [firmId, setFirmId] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
  });

  useEffect(() => {
    async function fetchData() {
      // Get current user's firm_id
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('firm_id')
          .eq('id', user.id)
          .single();
        
        if (userData?.firm_id) {
          setFirmId(userData.firm_id);
          
          // Fetch case data
          const { data: caseData } = await supabase
            .from('cases')
            .select('*')
            .eq('id', caseId)
            .eq('firm_id', userData.firm_id)
            .single();
          
          setCaseData(caseData);
          
          // Fetch related parties
          const { data: partiesData } = await supabase
            .from('parties')
            .select('*')
            .eq('firm_id', userData.firm_id)
            .in('id', [caseData.client_id, caseData.opposing_party_id].filter(Boolean));
          
          setParties(partiesData || []);
        }
      }
    }
    
    if (caseId) {
      fetchData();
    }
  }, [caseId]);

  const onSubmit = async (data: DocumentFormValues) => {
    if (!firmId || !caseId) return;
    
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const file = data.file[0];
      
      // In a real app, this would upload to Supabase Storage
      // For this demo, we'll simulate it
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `documents/${caseId}/${fileName}`;
      
      // Create document record
      const { data: documentData, error } = await supabase
        .from('documents')
        .insert({
          firm_id: firmId,
          case_id: caseId,
          name: data.name,
          document_type: data.document_type,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: user.id,
          related_party_id: data.related_party_id || null,
        })
        .select();
      
      if (error) throw error;
      
      // Redirect back to case
      router.push(`/cases/${caseId}?tab=documents`);
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get party display name
  const getPartyDisplayName = (party: any) => {
    if (!party) return '';
    
    if (party.organization_name) {
      return party.organization_name;
    }
    return `${party.first_name || ''} ${party.last_name || ''}`.trim();
  };
  
  if (!caseData) {
    return (
      <MainLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Upload Document">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Upload Document</h1>
        <p className="text-gray-400 mt-1">Case: {caseData.title}</p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Document Name"
              id="name"
              {...register('name')}
              error={errors.name?.message}
            />
            
            <Select
              label="Document Type"
              id="document_type"
              {...register('document_type')}
              error={errors.document_type?.message}
              options={[
                { value: '', label: 'Select document type' },
                { value: 'pleading', label: 'Pleading' },
                { value: 'correspondence', label: 'Correspondence' },
                { value: 'contract', label: 'Contract' },
                { value: 'notice', label: 'Notice' },
                { value: 'court_filing', label: 'Court Filing' },
                { value: 'evidence', label: 'Evidence' },
                { value: 'other', label: 'Other' },
              ]}
            />
            
            {parties.length > 0 && (
              <Select
                label="Related Party"
                id="related_party_id"
                {...register('related_party_id')}
                error={errors.related_party_id?.message}
                options={[
                  { value: '', label: 'No related party' },
                  ...parties.map(party => ({
                    value: party.id,
                    label: getPartyDisplayName(party)
                  }))
                ]}
              />
            )}
            
            <div className="mb-4">
              <label htmlFor="file" className="block text-sm font-medium text-gray-300 mb-1">
                File
              </label>
              <input
                id="file"
                type="file"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('file')}
              />
              {errors.file && (
                <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                isLoading={isLoading}
              >
                Upload Document
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </MainLayout>
  );
}

// src/app/documents/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  DocumentIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon
} from 'react-icons/hi2';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Document {
  id: string;
  name: string;
  document_type: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  version: number;
  created_at: string;
  related_party_id: string | null;
  case_id: string;
  case_title: string;
  uploader_name: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firmId, setFirmId] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [caseFilter, setCaseFilter] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Cases for filter dropdown
  const [cases, setCases] = useState<{ id: string; title: string }[]>([]);

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
          fetchCases(data.firm_id);
        }
      }
    }
    
    fetchFirmId();
  }, []);

  useEffect(() => {
    if (firmId) {
      fetchDocuments();
    }
  }, [firmId, searchTerm, typeFilter, caseFilter, currentPage]);

  const fetchCases = async (firmId: string) => {
    const { data } = await supabase
      .from('cases')
      .select('id, title')
      .eq('firm_id', firmId)
      .order('title', { ascending: true });
    
    if (data) {
      setCases(data);
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('documents')
        .select(`
          id,
          name,
          document_type,
          file_path,
          file_size,
          uploaded_by,
          version,
          created_at,
          related_party_id,
          case_id
        `)
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      if (typeFilter !== 'all') {
        query = query.eq('document_type', typeFilter);
      }
      
      if (caseFilter !== 'all') {
        query = query.eq('case_id', caseFilter);
      }
      
      // Count total for pagination
      const { count } = await query.select('id', { count: 'exact', head: true });
      
      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data: documentsData, error } = await query
        .range(from, to);
      
      if (error) throw error;
      
      if (documentsData) {
        // Calculate total pages
        setTotalPages(Math.ceil((count || 0) / itemsPerPage));
        
        // Get additional details for each document
        const documentsWithDetails = await Promise.all(
          documentsData.map(async (doc) => {
            // Get case title
            const { data: caseData } = await supabase
              .from('cases')
              .select('title')
              .eq('id', doc.case_id)
              .single();
            
            // Get uploader name
            const { data: userData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', doc.uploaded_by)
              .single();
            
            return {
              ...doc,
              case_title: caseData?.title || 'Unknown Case',
              uploader_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unknown'
            };
          })
        );
        
        setDocuments(documentsWithDetails);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
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
  
  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <MainLayout title="Documents">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Documents</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => {/* Open filter modal */}}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </Button>
          </div>
          <Link href="/documents/templates">
            <Button variant="outline" className="flex items-center">
              Templates
            </Button>
          </Link>
        </div>
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
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'pleading', label: 'Pleading' },
                { value: 'correspondence', label: 'Correspondence' },
                { value: 'contract', label: 'Contract' },
                { value: 'notice', label: 'Notice' },
                { value: 'court_filing', label: 'Court Filing' },
                { value: 'evidence', label: 'Evidence' },
                { value: 'other', label: 'Other' }
              ]}
              className="w-48"
            />
            
            <Select
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Cases' },
                ...cases.map(c => ({ value: c.id, label: c.title }))
              ]}
              className="w-48"
            />
          </div>
        </div>
      </Card>
      
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || typeFilter !== 'all' || caseFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by uploading your first document'}
            </p>
          </div>
        ) : (
          <>
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
                      Case
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/cases/${doc.case_id}`} className="text-blue-400 hover:text-blue-300">
                          {doc.case_title}
                        </Link>
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center border-t border-gray-700 px-4 py-3 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, documents.length)}
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
                      ))}
                      
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
