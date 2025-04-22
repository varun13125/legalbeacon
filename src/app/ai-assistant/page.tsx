'use client';

import React, { useEffect, useState, useRef } from 'react';
import { HiPaperAirplane, HiDocumentAdd } from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const fetchAIResponse = async (
  prompt: string,
  caseContext: any | null = null,
  documentContext: string | null = null
): Promise<string> => {
  console.log('AI Request:', { prompt, caseContext, documentContext });
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (prompt.toLowerCase().includes('draft')) {
    return 'Drafted document:\n\n[Legal formatted content based on case data]';
  }
  if (prompt.toLowerCase().includes('analyze')) {
    return 'Analysis:\n\n1. Clause 3.2 ambiguous.\n2. Indemnity favors other party.\n3. Review compliance in Section 7.';
  }
  if (prompt.toLowerCase().includes('summarize')) {
    return 'Summary:\n\nMortgage foreclosure complaint for 123 Main St, $12,500 arrears, $275,000 principal.';
  }
  if (prompt.toLowerCase().includes('deadline')) {
    return 'Deadlines:\n\n- 21 days to respond\n- Default after 22\n- Redemption: 6 months\n- Sale: 30-45 days after judgment.';
  }
  return 'Please specify if you need a draft, analysis, summary, or timeline.';
};

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface Case {
  id: string;
  title: string;
  case_number: string;
  case_type: string;
  status: string;
}

interface Document {
  id: string;
  name: string;
  document_type: string;
  file_path: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        sender: 'ai',
        content: 'Hi! I’m your AI legal assistant. Ask me to draft, review, summarize or suggest legal strategies.',
        timestamp: new Date()
      }
    ]);
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetails(selectedCaseId);
      fetchCaseDocuments(selectedCaseId);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    if (selectedDocumentId) {
      fetchDocumentContent(selectedDocumentId);
    } else {
      setDocumentContent(null);
    }
  }, [selectedDocumentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase.from('users').select('firm_id').eq('id', user.id).single();
        if (userData?.firm_id) {
          const { data } = await supabase
            .from('cases')
            .select('id, title, case_number, case_type, status')
            .eq('firm_id', userData.firm_id)
            .order('created_at', { ascending: false });
          if (data) setCases(data);
        }
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const fetchCaseDetails = async (caseId: string) => {
    try {
      const { data } = await supabase
        .from('cases')
        .select(`*, client:client_id(id, first_name, last_name, organization_name, email, phone), opposing_party:opposing_party_id(id, first_name, last_name, organization_name, email, phone)`)
        .eq('id', caseId)
        .single();
      setSelectedCase(data);
    } catch (error) {
      console.error('Error fetching case details:', error);
    }
  };

  const fetchCaseDocuments = async (caseId: string) => {
    try {
      const { data } = await supabase
        .from('documents')
        .select('id, name, document_type, file_path')
        .eq('case_id', caseId)
        .eq('is_template', false)
        .order('created_at', { ascending: false });
      setDocuments(data || []);
      setSelectedDocumentId('');
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchDocumentContent = async (documentId: string) => {
    setDocumentContent('Sample document: Mortgage Foreclosure Complaint...');
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await fetchAIResponse(input, selectedCase, documentContent);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI error:', err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: 'Something went wrong. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout title="AI Legal Assistant">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Legal Assistant</h1>
        <p className="text-gray-400 mt-1">Get AI-powered assistance with your legal work</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-3/4 rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                    <div className="whitespace-pre-line">{msg.content}</div>
                    <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-700 p-4">
              <div className="flex">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button className="ml-2" onClick={handleSendMessage} disabled={isLoading}>
                  {isLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <HiPaperAirplane className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-white mb-4">Context</h2>
            <Select
              label="Select Case"
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              options={[{ value: '', label: 'No case selected' }, ...cases.map(c => ({ value: c.id, label: `${c.title} (${c.case_number})` }))]}
            />
            {selectedCaseId && documents.length > 0 && (
              <Select
                label="Select Document"
                value={selectedDocumentId}
                onChange={(e) => setSelectedDocumentId(e.target.value)}
                options={[{ value: '', label: 'No document selected' }, ...documents.map(d => ({ value: d.id, label: d.name }))]}
              />
            )}
          </Card>

          {selectedCase && (
            <Card>
              <h2 className="text-lg font-medium text-white mb-4">Case Info</h2>
              <div className="space-y-2 text-sm text-white">
                <p><span className="text-gray-400">Type:</span> {selectedCase.case_type}</p>
                <p><span className="text-gray-400">Status:</span> {selectedCase.status}</p>
                <p><span className="text-gray-400">Client:</span> {selectedCase.client?.organization_name || `${selectedCase.client?.first_name} ${selectedCase.client?.last_name}`}</p>
                <p><span className="text-gray-400">Opposing:</span> {selectedCase.opposing_party?.organization_name || `${selectedCase.opposing_party?.first_name} ${selectedCase.opposing_party?.last_name}`}</p>
                {selectedCase.court_name && <p><span className="text-gray-400">Court:</span> {selectedCase.court_name}</p>}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-medium text-white mb-4">Quick Prompts</h2>
            <div className="space-y-2">
              {[
                'Draft a demand letter for payment based on the case details.',
                'Analyze this document for potential issues or weaknesses.',
                'Summarize the key facts of this case.',
                'What are the key deadlines I should be aware of for this foreclosure case?',
                'What defenses might the opposing party raise?'
              ].map((prompt, i) => (
                <Button key={i} variant="outline" size="sm" className="w-full justify-start" onClick={() => setInput(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
