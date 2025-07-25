const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

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
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
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
    // Use OpenAI Realtime API (Assistant API)
    console.log('Creating thread...');
    const thread = await openai.beta.threads.create();
    
    if (!thread || !thread.id) {
      throw new Error('Failed to create thread');
    }
    
    console.log('Thread created:', thread.id);
    
    // Add message to thread
    console.log('Adding message to thread...');
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message
    });

    // Run assistant
    console.log('Creating run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID || 'asst_default',
      instructions: 'You are a helpful AI assistant. Respond in the same language the user speaks.'
    });

    if (!run || !run.id) {
      throw new Error('Failed to create run');
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
    res.status(500).json({ error: error.message });
  }
}; 