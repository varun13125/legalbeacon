// src/app/ai-assistant/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { HiPaperAirplane } from 'react-icons/hi';
import { supabase } from '@/lib/supabase';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const fetchAIResponse = async (prompt: string, caseContext: any | null = null, documentContext: string | null = null): Promise<string> => {
  console.log('AI Request:', { prompt, caseContext, documentContext });
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (prompt.toLowerCase().includes('draft') || prompt.toLowerCase().includes('write')) {
    return 'I have drafted the document based on your requirements. Here is the suggested text...';
  }

  if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('review')) {
    return 'Based on my analysis of the document, here are my observations...';
  }

  if (prompt.toLowerCase().includes('summarize')) {
    return 'Summary of the document: This is a mortgage foreclosure complaint...';
  }

  if (prompt.toLowerCase().includes('deadline') || prompt.toLowerCase().includes('timeline')) {
    return 'Key deadlines include: 21 days to file an answer, 6-month redemption period...';
  }

  return 'I\'ve analyzed your request. Please provide more specific details.';
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
    setMessages([{
      id: '1',
      sender: 'ai',
      content: 'Hello! I\'m your AI legal assistant...',
      timestamp: new Date()
    }]);
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetails(selectedCaseId);
      fetchCaseDocuments(selectedCaseId);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    if (selectedDocumentId) fetchDocumentContent(selectedDocumentId);
    else setDocumentContent(null);
  }, [selectedDocumentId]);

  useEffect(() => scrollToBottom(), [messages]);

  const fetchCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase.from('users').select('firm_id').eq('id', user.id).single();
        if (userData?.firm_id) {
          const { data } = await supabase.from('cases').select('id, title, case_number, case_type, status').eq('firm_id', userData.firm_id).order('created_at', { ascending: false });
          if (data) setCases(data);
        }
      }
    } catch (err) { console.error('Error fetching cases:', err); }
  };

  const fetchCaseDetails = async (caseId: string) => {
    try {
      const { data, error } = await supabase.from('cases').select(`*, client:client_id(id, first_name, last_name, organization_name), opposing_party:opposing_party_id(id, first_name, last_name, organization_name)`).eq('id', caseId).single();
      if (error) throw error;
      setSelectedCase(data);
    } catch (err) { console.error('Error fetching case details:', err); }
  };

  const fetchCaseDocuments = async (caseId: string) => {
    try {
      const { data, error } = await supabase.from('documents').select('id, name, document_type, file_path').eq('case_id', caseId).eq('is_template', false).order('created_at', { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (err) { console.error('Error fetching documents:', err); }
  };

  const fetchDocumentContent = async (docId: string) => {
    setDocumentContent('MORTGAGE FORECLOSURE COMPLAINT\n\n...');
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const newMessage: Message = { id: Date.now().toString(), sender: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiReply = await fetchAIResponse(input, selectedCase, documentContent);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', content: aiReply, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', content: 'Error processing request.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const formatTimestamp = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                    <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>{formatTimestamp(msg.timestamp)}</div>
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
                  {isLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <HiPaperAirplane className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
