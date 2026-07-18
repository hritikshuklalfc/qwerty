

import { useState, useCallback, useEffect } from "react"
import { ConversationStream, Message } from "./conversation-stream"
import { CommandDock } from "./command-dock"
import { LatentSidebar, Conversation } from "./latent-sidebar"
import { Layers, Moon, Sun } from "lucide-react"

import { useAuth } from "../../hooks/useAuth"
import { supabase } from "../../lib/supabase"
import { useNavigate } from "react-router-dom"
import { generateWorkflow } from "../../lib/gemini.js"

export function NeuralCore() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const theme = "dark"
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const generateTimestamp = () => {
    const now = new Date()
    return now.toLocaleTimeString("en-US", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    })
  }
  
  // Fetch conversations from Supabase
  useEffect(() => {
    if (!user?.uid || !supabase) return;
    
    const fetchConversations = async () => {
      try {
        const { data: convs, error: convError } = await supabase
          .from('ai_conversations')
          .select('*')
          .eq('user_id', user.uid)
          .order('updated_at', { ascending: false });
          
        if (convError) {
          console.error("Failed to fetch conversations", convError);
          return;
        }
        
        const { data: msgs, error: msgError } = await supabase
          .from('ai_messages')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (msgError) {
          console.error("Failed to fetch messages", msgError);
          return;
        }
        
        const loadedConversations: Conversation[] = convs.map(c => ({
          id: c.id,
          title: c.title,
          preview: c.preview || "",
          date: new Date(c.updated_at).toLocaleDateString(),
          messages: msgs
            .filter(m => m.conversation_id === c.id)
            .map(m => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
            }))
        }));
        
        setConversations(loadedConversations);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };
    
    fetchConversations();
  }, [user]);

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation)
    setMessages(conversation.messages)
  }, [])
  
  const handleNewConversation = useCallback(() => {
    setActiveConversation(null)
    setMessages([])
    setSidebarOpen(false)
  }, [])
  
  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || isThinking || !user?.uid) return
    
    const contentStr = inputValue.trim();
    let currentConvId = activeConversation?.id;
    let isNewConv = false;
    
    // 1. Create conversation if none active
    if (!currentConvId) {
      if (supabase) {
        try {
          const { data: newConv, error: convErr } = await supabase
            .from('ai_conversations')
            .insert({
              user_id: user.uid,
              title: contentStr.substring(0, 30) + (contentStr.length > 30 ? '...' : ''),
              preview: contentStr.substring(0, 50)
            })
            .select()
            .single();
            
          if (!convErr && newConv) {
            currentConvId = newConv.id;
          } else {
            currentConvId = `conv-${Date.now()}`;
          }
        } catch (err) {
          console.error("Supabase insert conversation failed", err);
          currentConvId = `conv-${Date.now()}`;
        }
      } else {
        currentConvId = `conv-${Date.now()}`;
      }
      isNewConv = true;
    } else {
      // Update updated_at and preview
      if (supabase) {
        try {
          await supabase
            .from('ai_conversations')
            .update({
              updated_at: new Date().toISOString(),
              preview: contentStr.substring(0, 50)
            })
            .eq('id', currentConvId);
        } catch (err) {
          console.error("Supabase update conversation failed", err);
        }
      }
    }
    
    // 2. Insert User Message
    let insertedUserMsg = null;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('ai_messages')
          .insert({
            conversation_id: currentConvId,
            role: 'user',
            content: contentStr
          })
          .select()
          .single();
        if (!error) insertedUserMsg = data;
      } catch (err) {
        console.error("Supabase insert message failed", err);
      }
    }

    const userMessage: Message = {
      id: insertedUserMsg?.id || `user-${Date.now()}`,
      role: "user",
      content: contentStr,
      timestamp: insertedUserMsg ? new Date(insertedUserMsg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : generateTimestamp()
    }
    
    // Update local state instantly
    let currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    
    if (isNewConv && currentConvId) {
      const newConversation: Conversation = {
        id: currentConvId,
        title: contentStr.substring(0, 30) + (contentStr.length > 30 ? '...' : ''),
        preview: contentStr.substring(0, 50),
        date: new Date().toLocaleDateString(),
        messages: currentMessages
      };
      setActiveConversation(newConversation);
      setConversations(prev => [newConversation, ...prev]);
    } else {
      setConversations(prev => prev.map(c => 
        c.id === currentConvId ? { ...c, preview: contentStr.substring(0, 50), messages: currentMessages } : c
      ));
    }
    
    setInputValue("")
    setIsThinking(true)
    
    try {
      const apiKey = localStorage.getItem('geminiApiKey') || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key is missing! Please go to the Settings menu on the sidebar to add your key.");
      }
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Generating workflow configuration...",
        timestamp: generateTimestamp()
      }
      currentMessages = [...currentMessages, assistantMessage]
      setMessages(currentMessages)

      const workflowConfig = await generateWorkflow(userMessage.content, apiKey);
      
      const aiResponseContent = `Workflow generated successfully! \n\n**To use this:**\n1. Copy the JSON block below.\n2. Navigate to the Orchestration Editor.\n3. Click anywhere on the canvas and press \`Ctrl+V\` (Paste) to import it!\n\n\`\`\`json\n${JSON.stringify(workflowConfig, null, 2)}\n\`\`\``;
      
      // 3. Insert AI Message
      let insertedAiMsg = null;
      if (supabase) {
        try {
          const { data } = await supabase
            .from('ai_messages')
            .insert({
              conversation_id: currentConvId,
              role: 'assistant',
              content: aiResponseContent
            })
            .select()
            .single();
          insertedAiMsg = data;
        } catch (err) {
          console.error("Supabase AI message insert failed", err);
        }
      }
      
      const successMessage: Message = {
        id: insertedAiMsg?.id || `assistant-success-${Date.now()}`,
        role: "assistant",
        content: aiResponseContent,
        timestamp: insertedAiMsg ? new Date(insertedAiMsg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : generateTimestamp()
      }
      
      // Remove temporary thinking message and add success
      currentMessages = currentMessages.filter(m => m.id !== assistantMessage.id).concat(successMessage);
      setMessages(currentMessages)
      setConversations(prev => prev.map(c => 
        c.id === currentConvId ? { ...c, messages: currentMessages } : c
      ));
      
      setIsThinking(false)
      
    } catch (error) {
      // 4. Insert Error Message
      const aiErrorContent = `## Error\n\nFailed to generate workflow. Make sure your Gemini API Key is set in the Settings menu.\n\n${error.message}`;
      
      let insertedErrorMsg = null;
      if (supabase) {
        try {
          const { data } = await supabase
            .from('ai_messages')
            .insert({
              conversation_id: currentConvId,
              role: 'assistant',
              content: aiErrorContent
            })
            .select()
            .single();
          insertedErrorMsg = data;
        } catch (err) {
          console.error("Supabase error message insert failed", err);
        }
      }
        
      const errorMessage: Message = {
        id: insertedErrorMsg?.id || `assistant-error-${Date.now()}`,
        role: "assistant",
        content: aiErrorContent,
        timestamp: insertedErrorMsg ? new Date(insertedErrorMsg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : generateTimestamp()
      }
      
      // Remove temporary thinking message and add error
      currentMessages = currentMessages.filter(m => m.content !== "Generating workflow configuration...").concat(errorMessage);
      setMessages(currentMessages)
      setConversations(prev => prev.map(c => 
        c.id === currentConvId ? { ...c, messages: currentMessages } : c
      ));
      
      setIsThinking(false)
    }
  }, [inputValue, isThinking, messages, activeConversation, navigate, user])
  
  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-transparent text-foreground">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" />
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-16 lg:px-24 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-foreground uppercase">
            Neural_Core
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/50">
            //
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/50 uppercase truncate max-w-[200px]">
            {activeConversation ? activeConversation.title : "New Conversation"}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme toggle removed */}
          
          {/* History button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors magnetic-hover"
            aria-label="Open history sidebar"
          >
            <Layers className="w-4 h-4" />
            <span className="font-mono text-[10px] tracking-wider uppercase hidden sm:inline">
              History
            </span>
            {conversations.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-violet-500/20 text-violet-400 font-mono text-[9px]">
                {conversations.length}
              </span>
            )}
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <ConversationStream 
        messages={messages} 
        isThinking={isThinking} 
      />
      
      {/* Command dock */}
      <CommandDock
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        isThinking={isThinking}
        disabled={isThinking}
      />
      
      {/* History sidebar */}
      <LatentSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversation?.id ?? null}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  )
}
