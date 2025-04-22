// src/app/ai-assistant/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { HiPaperAirplane, HiDocumentAdd } from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

// Mock API call for OpenAI/Claude service
// In a real app, this would be implemented as an API route that makes the actual API call
const fetchAIResponse = async (
  prompt: string, 
  caseContext: any | null = null, 
  documentContext: string | null = null
): Promise<string> => {
  // This is a simplified mock
  // In production, you would make a real API call to OpenAI or Claude
  console.log('AI Request:', { prompt, caseContext, documentContext });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock responses based on prompt keywords
  if (prompt.toLowerCase().includes('draft') || prompt.toLowerCase().includes('write')) {
    return 'I have drafted the document based on your requirements. Here is the suggested text:\n\n[Document content would appear here with proper formatting and legal language based on the case details provided]';
  }
  
  if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('review')) {
    return 'Based on my analysis of the document, here are my observations:\n\n1. The agreement contains several ambiguous clauses in sections 3.2 and 5.1 that could be clarified.\n2. The indemnification clause is more favorable to the opposing party.\n3. There are potential compliance issues with local regulations in section 7.\n\nI recommend revising these sections to strengthen your client\'s position.';
  }
  
  if (prompt.toLowerCase().includes('summarize')) {
    return 'Summary of the document:\n\nThis is a mortgage foreclosure complaint filed against John Doe regarding the property at 123 Main St. The complaint alleges that the defendant has failed to make payments for 6 months, totaling $12,500 in arrears. The plaintiff is seeking foreclosure and sale of the property to satisfy the debt of $275,000 plus interest and costs.';
  }
  
  if (prompt.toLowerCase().includes('deadline') || prompt.toLowerCase().includes('timeline')) {
    return 'Based on the foreclosure regulations in this jurisdiction, here are the key deadlines to be aware of:\n\n- Defendant has 21 days to file an answer to the complaint\n- If no answer is filed, you can move for default judgment after day 22\n- Redemption period is 6 months from judgment\n- Sale can be scheduled approximately 30-45 days after judgment\n- Confirmation hearing typically 30 days after sale';
  }
  
  // Default response
  return 'I\'ve analyzed your request and the case information provided. To best assist you with this legal matter, I would need more specific details about what you\'re looking to accomplish. Would you like me to draft a document, review existing content, provide legal analysis, or suggest strategy?';
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
    // Add initial greeting message
    setMessages([
      {
        id: '1',
        sender: 'ai',
        content: 'Hello! I\'m your AI legal assistant. I can help you draft documents, analyze legal content, summarize case information, and more. Select a case to get started, or just ask me a general legal question.',
        timestamp: new Date()
      }
    ]);
    
    // Fetch cases
    fetchCases();
  }, []);
  
  useEffect(() => {
    // Fetch case details when a case is selected
    if (selectedCaseId) {
      fetchCaseDetails(selectedCaseId);
      fetchCaseDocuments(selectedCaseId);
    }
  }, [selectedCaseId]);
  
  useEffect(() => {
    // Fetch document content when a document is selected
    if (selectedDocumentId) {
      fetchDocumentContent(selectedDocumentId);
    } else {
      setDocumentContent(null);
    }
  }, [selectedDocumentId]);
  
  useEffect(() => {
    // Scroll to bottom of messages when messages update
    scrollToBottom();
  }, [messages]);
  
  const fetchCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('firm_id')
          .eq('id', user.id)
          .single();
        
        if (userData?.firm_id) {
          const { data } = await supabase
            .from('cases')
            .select('id, title, case_number, case_type, status')
            .eq('firm_id', userData.firm_id)
            .order('created_at', { ascending: false });
          
          if (data) {
            setCases(data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };
  
  const fetchCaseDetails = async (caseId: string) => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          client:client_id(
            id, first_name, last_name, organization_name, email, phone
          ),
          opposing_party:opposing_party_id(
            id, first_name, last_name, organization_name, email, phone
          )
        `)
        .eq('id', caseId)
        .single();
      
      if (error) throw error;
      
      setSelectedCase(data);
    } catch (error) {
      console.error('Error fetching case details:', error);
    }
  };
  
  const fetchCaseDocuments = async (caseId: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, name, document_type, file_path')
        .eq('case_id', caseId)
        .eq('is_template', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDocuments(data || []);
      setSelectedDocumentId(''); // Reset selected document
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };
  
  const fetchDocumentContent = async (documentId: string) => {
    // In a real app, this would fetch the actual document content
    // For this demo, we'll use mock content
    setDocumentContent(
      'MORTGAGE FORECLOSURE COMPLAINT\n\n' +
      'COMES NOW the Plaintiff, by and through its undersigned counsel, and files this ' +
      'Complaint to Foreclose Mortgage against the Defendants, and alleges:\n\n' +
      '1. This is an action to foreclose a mortgage on real property located in County, State.\n' +
      '2. Plaintiff is the legal holder of the Note and Mortgage.\n' +
      '3. On [Date], Defendants executed and delivered a Promissory Note in the principal amount of $000,000.00.\n' +
      '4. To secure the Note, Defendants executed and delivered a Mortgage on the Property.\n' +
      '5. Defendants have defaulted under the terms of the Note and Mortgage by failing to make the payment due on [Date] and all subsequent payments.\n' +
      '6. Plaintiff has declared the full amount due under the Note and Mortgage to be immediately due and payable.\n' +
      '7. The principal amount now due to the Plaintiff is $000,000.00 plus interest, late charges, and costs.\n\n' +
      'WHEREFORE, Plaintiff requests that the Court:\n' +
      'A. Take jurisdiction of this action;\n' +
      'B. Enter judgment foreclosing the Mortgage;\n' +
      'C. Order the Property sold at public sale;\n' +
      'D. Award attorneys\' fees and costs; and\n' +
      'E. Grant such other relief as the Court deems just and proper.'
    );
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get AI response
      const aiResponse = await fetchAIResponse(
        input,
        selectedCase,
        documentContent
      );
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3/4 rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                  >
                    <div className="whitespace-pre-line">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
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
                <Button
                  className="ml-2"
                  onClick={handleSendMessage}
                  disabled={isLoading}
                >
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
        
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <h2 className="text-lg font-medium text-white mb-4">Context</h2>
            
            <div className="space-y-4">
              <Select
                label="Select Case"
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                options={[
                  { value: '', label: 'No case selected' },
                  ...cases.map(c => ({
                    value: c.id,
                    label: `${c.title} (${c.case_number})`
                  }))
                ]}
              />
              
              {selectedCaseId && documents.length > 0 && (
                <Select
                  label="Select Document"
                  value={selectedDocumentId}
                  onChange={(e) => setSelectedDocumentId(e.target.value)}
                  options={[
                    { value: '', label: 'No document selected' },
                    ...documents.map(d => ({
                      value: d.id,
                      label: d.name
                    }))
                  ]}
                />
              )}
            </div>
          </Card>
          
          {selectedCase && (
            <Card className="mb-6">
              <h2 className="text-lg font-medium text-white mb-4">Case Information</h2>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Case Type:</span>
                  <span className="text-white ml-2">{selectedCase.case_type}</span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white ml-2">{selectedCase.status}</span>
                </div>
                <div>
                  <span className="text-gray-400">Client:</span>
                  <span className="text-white ml-2">
                    {selectedCase.client?.organization_name || 
                      `${selectedCase.client?.first_name || ''} ${selectedCase.client?.last_name || ''}`.trim() ||
                      'Unknown'}
                  </span>
                </div>
                {selectedCase.opposing_party && (
                  <div>
                    <span className="text-gray-400">Opposing Party:</span>
                    <span className="text-white ml-2">
                      {selectedCase.opposing_party?.organization_name || 
                        `${selectedCase.opposing_party?.first_name || ''} ${selectedCase.opposing_party?.last_name || ''}`.trim() ||
                        'Unknown'}
                    </span>
                  </div>
                )}
                {selectedCase.court_name && (
                  <div>
                    <span className="text-gray-400">Court:</span>
                    <span className="text-white ml-2">{selectedCase.court_name}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
          
          <Card>
            <h2 className="text-lg font-medium text-white mb-4">Suggestion Prompts</h2>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setInput('Draft a demand letter for payment based on the case details.')}
              >
                Draft a demand letter
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setInput('Analyze this document for potential issues or weaknesses.')}
              >
                Analyze document
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setInput('Summarize the key facts of this case.')}
              >
                Summarize case
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setInput('What are the key deadlines I should be aware of for this foreclosure case?')}
              >
                Deadlines & timeline
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setInput('What defenses might the opposing party raise?')}
              >
                Potential defenses
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
