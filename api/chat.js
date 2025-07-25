const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set');
}

if (!process.env.OPENAI_ASSISTANT_ID) {
  console.error('❌ OPENAI_ASSISTANT_ID is not set');
}

if (!process.env.SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is not set');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory conversation store
const conversations = {};

// Function to save conversation to Supabase
async function saveConversationToSupabase(sessionId, conversation) {
  try {
    const { data, error } = await supabase
      .from('conversations_web_chatbot')
      .upsert([
        {
          conversation_id: sessionId,
          messages: conversation
        }
      ], { onConflict: ['conversation_id'] });

    if (error) {
      console.error('Supabase error:', error);
      return null;
    }

    console.log('Conversation upserted to Supabase:', data);
    return data;
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return null;
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { message, sessionId } = req.body;
  if (!message || !sessionId) {
    res.status(400).json({ error: 'Missing message or sessionId' });
    return;
  }

  if (!conversations[sessionId]) {
    conversations[sessionId] = [];
  }
  conversations[sessionId].push({ role: 'user', content: message });

  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Use OpenAI Realtime API (Assistant API)
    console.log('Creating thread...');
    const thread = await openai.beta.threads.create();
    
    if (!thread || !thread.id) {
      throw new Error('Failed to create thread - thread.id is undefined');
    }
    
    console.log('Thread created:', thread.id);
    
    // Add message to thread
    console.log('Adding message to thread...');
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message
    });

    // Check if assistant ID is available
    if (!process.env.OPENAI_ASSISTANT_ID) {
      throw new Error('OpenAI Assistant ID is not configured');
    }

    // Run assistant
    console.log('Creating run with assistant ID:', process.env.OPENAI_ASSISTANT_ID);
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      instructions: 'You are a helpful AI assistant. Respond in the same language the user speaks.'
    });

    if (!run || !run.id) {
      throw new Error('Failed to create run - run.id is undefined');
    }
    
    console.log('Run created:', run.id);

    // Wait for run to complete
    console.log('Waiting for run to complete...');
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log('Run status:', runStatus.status);
    }

    if (runStatus.status === 'completed') {
      // Get messages from thread
      console.log('Getting messages from thread...');
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      
      if (assistantMessage && assistantMessage.content.length > 0) {
        const aiMessage = assistantMessage.content[0].text.value;
        conversations[sessionId].push({ role: 'assistant', content: aiMessage });
        
        // Save conversation to Supabase
        const savedData = await saveConversationToSupabase(sessionId, conversations[sessionId]);
        
        res.status(200).json({ 
          response: aiMessage,
          savedToSupabase: savedData ? true : false,
          messageCount: conversations[sessionId].length,
          threadId: thread.id
        });
      } else {
        res.status(500).json({ error: 'No response from assistant' });
      }
    } else if (runStatus.status === 'failed') {
      console.error('Run failed:', runStatus);
      res.status(500).json({ error: `Run failed: ${runStatus.last_error?.message || 'Unknown error'}` });
    } else {
      res.status(500).json({ error: `Run ended with status: ${runStatus.status}` });
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
    
    if (error.message.includes('API key')) {
      errorMessage = 'Lỗi cấu hình API. Vui lòng kiểm tra lại.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Hệ thống đang bận. Vui lòng thử lại sau.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 