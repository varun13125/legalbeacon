// src/app/documents/templates/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  DocumentIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from 'react-icons/hi2';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Template {
  id: string;
  name: string;
  document_type: string;
  file_path: string;
  file_size: number;
  created_at: string;
  creator_name: string;
  description: string | null;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firmId, setFirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      fetchTemplates();
    }
  }, [firmId, searchTerm]);

  const fetchTemplates = async () => {
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
          created_at,
          uploaded_by,
          description
        `)
        .eq('firm_id', firmId)
        .eq('is_template', true)
        .order('name', { ascending: true });
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        // Get creator names
        const templatesWithCreators = await Promise.all(
          data.map(async (template) => {
            const { data: userData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', template.uploaded_by)
              .single();
            
            return {
              ...template,
              creator_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unknown'
            };
          })
        );
        
        setTemplates(templatesWithCreators);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
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

  return (
    <MainLayout title="Document Templates">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Document Templates</h1>
        <Link href="/documents/templates/new">
          <Button className="flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Template
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>
      
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Create document templates to streamline your workflow'}
            </p>
            <Link href="/documents/templates/new">
              <Button>
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Template
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
                    Created By
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
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-white">{template.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {template.document_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {formatFileSize(template.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {template.creator_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {formatDate(template.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link href={`/documents/templates/${template.id}/use`}>
                          <Button variant="primary" size="sm">
                            Use
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </MainLayout>
  );
}

// src/app/documents/templates/new/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  document_type: z.string().min(1, 'Document type is required'),
  description: z.string().optional(),
  file: z.instanceof(FileList).refine(files => files.length > 0, 'File is required'),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function NewTemplatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [firmId, setFirmId] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
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
        }
      }
    }
    
    fetchFirmId();
  }, []);

  const onSubmit = async (data: TemplateFormValues) => {
    if (!firmId) return;
    
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
      const filePath = `templates/${fileName}`;
      
      // Create template record
      const { error } = await supabase
        .from('documents')
        .insert({
          firm_id: firmId,
          name: data.name,
          document_type: data.document_type,
          description: data.description || null,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: user.id,
          is_template: true,
          // For templates, we don't need case_id or other case-specific fields
          // We're using the documents table for both documents and templates
          case_id: '00000000-0000-0000-0000-000000000000', // Dummy ID for templates
        });
      
      if (error) throw error;
      
      // Redirect to templates page
      router.push('/documents/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout title="New Document Template">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create Document Template</h1>
        <p className="text-gray-400 mt-1">Upload a template file with placeholders for case information</p>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Template Name"
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
                { value: 'demand_letter', label: 'Demand Letter' },
                { value: 'motion', label: 'Motion' },
                { value: 'other', label: 'Other' },
              ]}
            />
            
            <Textarea
              label="Description"
              id="description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Explain what this template is used for and what placeholders it contains"
            />
            
            <div className="mb-4">
              <label htmlFor="file" className="block text-sm font-medium text-gray-300 mb-1">
                Template File
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
              <p className="text-gray-400 text-sm mt-2">
                Upload a document with placeholders in format: {'{{case_number}}'}, {'{{client_name}}'}, {'{{court_name}}'}, etc.
              </p>
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
                Create Template
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </MainLayout>
  );
}

// src/app/documents/templates/[id]/use/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from 'react-datepicker';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

interface Case {
  id: string;
  title: string;
  case_number: string;
}

interface Template {
  id: string;
  name: string;
  document_type: string;
  description: string | null;
}

interface Party {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  type: string;
}

// Form schema
const generateDocumentSchema = z.object({
  case_id: z.string().min(1, 'Case is required'),
  document_name: z.string().min(1, 'Document name is required'),
  filing_date: z.date().optional(),
  custom_fields: z.record(z.string()).optional(),
});

type GenerateDocumentFormValues = z.infer<typeof generateDocumentSchema>;

export default function UseTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [isLoading, setIsLoading] = useState(true);
  const [processingDocument, setProcessingDocument] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [firmId, setFirmId] = useState<string | null>(null);
  
  // For custom fields that might be in the template
  const [customFieldKeys, setCustomFieldKeys] = useState<string[]>([]);
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GenerateDocumentFormValues>({
    resolver: zodResolver(generateDocumentSchema),
    defaultValues: {
      custom_fields: {},
    },
  });
  
  const watchCaseId = watch('case_id');
  
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
          fetchTemplate(data.firm_id);
          fetchCases(data.firm_id);
        }
      }
    }
    
    fetchFirmId();
  }, [templateId]);
  
  useEffect(() => {
    if (watchCaseId && firmId) {
      fetchCaseDetails(watchCaseId);
    }
  }, [watchCaseId, firmId]);
  
  const fetchTemplate = async (firmId: string) => {
    const { data, error } = await supabase
      .from('documents')
      .select('id, name, document_type, description')
      .eq('id', templateId)
      .eq('firm_id', firmId)
      .eq('is_template', true)
      .single();
    
    if (error) {
      console.error('Error fetching template:', error);
      router.push('/documents/templates');
      return;
    }
    
    setTemplate(data);
    
    // For this demo, we'll just use some example custom fields
    // In a real app, you would parse the template file to extract placeholders
    setCustomFieldKeys(['judge_name', 'opposing_counsel', 'property_address', 'loan_amount']);
    
    setIsLoading(false);
  };
  
  const fetchCases = async (firmId: string) => {
    const { data } = await supabase
      .from('cases')
      .select('id, title, case_number')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setCases(data);
    }
  };
  
  const fetchCaseDetails = async (caseId: string) => {
    // Fetch the case
    const { data: caseData } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();
    
    if (caseData) {
      setSelectedCase(caseData);
      
      // Pre-fill the document name with case info
      setValue('document_name', `${template?.name || 'Document'} - ${caseData.case_number}`);
      
      // Fetch parties associated with the case
      const { data: partiesData } = await supabase
        .from('parties')
        .select('*')
        .eq('firm_id', firmId)
        .in('id', [caseData.client_id, caseData.opposing_party_id].filter(Boolean));
      
      if (partiesData) {
        setParties(partiesData);
      }
    }
  };
  
  const onSubmit = async (data: GenerateDocumentFormValues) => {
    if (!firmId || !template || !selectedCase) return;
    
    setProcessingDocument(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // In a real app, this would:
      // 1. Fetch the template file
      // 2. Replace placeholders with actual data
      // 3. Upload the generated document
      // 4. Create a document record
      
      // For this demo, we'll simulate it
      const filePath = `documents/${selectedCase.id}/${Date.now()}_${data.document_name}.docx`;
      
      // Create document record
      const { data: documentData, error } = await supabase
        .from('documents')
        .insert({
          firm_id: firmId,
          case_id: data.case_id,
          name: data.document_name,
          document_type: template.document_type,
          file_path: filePath,
          file_size: 150000, // Dummy size
          uploaded_by: user.id,
          is_template: false,
          version: 1,
        })
        .select();
      
      if (error) throw error;
      
      // Redirect to the case documents tab
      router.push(`/cases/${data.case_id}?tab=documents`);
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setProcessingDocument(false);
    }
  };
  
  // Helper to get party display name
  const getPartyDisplayName = (party: Party) => {
    if (party.organization_name) {
      return party.organization_name;
    }
    return `${party.first_name || ''} ${party.last_name || ''}`.trim();
  };
  
  if (isLoading) {
    return (
      <MainLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!template) {
    return (
      <MainLayout title="Template Not Found">
        <Card className="text-center py-12">
          <h2 className="text-xl font-medium text-white mb-4">Template Not Found</h2>
          <p className="text-gray-400 mb-6">The template you're trying to use doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/documents/templates')}>
            Back to Templates
          </Button>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Generate Document - ${template.name}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Generate Document</h1>
        <p className="text-gray-400 mt-1">Template: {template.name}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Document Information</h2>
                
                <div className="space-y-4">
                  <Select
                    label="Case"
                    id="case_id"
                    {...register('case_id')}
                    error={errors.case_id?.message}
                    options={[
                      { value: '', label: 'Select a case' },
                      ...cases.map(c => ({
                        value: c.id,
                        label: `${c.title} (${c.case_number})`
                      }))
                    ]}
                  />
                  
                  <Input
                    label="Document Name"
                    id="document_name"
                    {...register('document_name')}
                    error={errors.document_name?.message}
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
                  </div>
                </div>
              </div>
              
              {customFieldKeys.length > 0 && selectedCase && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Custom Fields</h2>
                  <p className="text-gray-400 mb-4">
                    Fill in any additional information needed for this document:
                  </p>
                  
                  <div className="space-y-4">
                    {customFieldKeys.map((key) => (
                      <Input
                        key={key}
                        label={key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        id={`custom_fields.${key}`}
                        {...register(`custom_fields.${key}` as any)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
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
                  isLoading={processingDocument}
                  disabled={!watchCaseId}
                >
                  Generate Document
                </Button>
              </div>
            </div>
          </form>
        </Card>
        
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Template Details</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="text-white">{template.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Type</p>
                <p className="text-white">{template.document_type}</p>
              </div>
              
              {template.description && (
                <div>
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="text-white">{template.description}</p>
                </div>
              )}
            </div>
          </Card>
          
          {selectedCase && (
            <Card>
              <h2 className="text-xl font-semibold text-white mb-4">Case Details</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Case Title</p>
                  <p className="text-white">{selectedCase.title}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Case Number</p>
                  <p className="text-white">{selectedCase.case_number}</p>
                </div>
                
                {parties.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400">Parties</p>
                    <ul className="mt-1 space-y-1">
                      {parties.map(party => (
                        <li key={party.id} className="text-white">
                          {getPartyDisplayName(party)} ({party.type})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
