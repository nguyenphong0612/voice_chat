const OpenAI = require('openai');
const dotenv = require('dotenv');
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createAssistant() {
  try {
    const assistant = await openai.beta.assistants.create({
      name: "Voice Chatbot Assistant",
      instructions: `You are a helpful AI assistant for a voice chatbot. 
      
Key guidelines:
- Respond in the same language the user speaks
- Be conversational and friendly
- Keep responses concise but helpful
- If user speaks Vietnamese, respond in Vietnamese
- If user speaks English, respond in English
- Be helpful with general questions, coding, writing, analysis
- Always be polite and professional`,
      model: "gpt-4-turbo-preview",
      tools: []
    });

    console.log('✅ Assistant created successfully!');
    console.log('Assistant ID:', assistant.id);
    console.log('Name:', assistant.name);
    console.log('Model:', assistant.model);
    
    // Save to .env file
    const fs = require('fs');
    const envPath = '.env';
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Add or update OPENAI_ASSISTANT_ID
    if (envContent.includes('OPENAI_ASSISTANT_ID=')) {
      envContent = envContent.replace(
        /OPENAI_ASSISTANT_ID=.*/,
        `OPENAI_ASSISTANT_ID=${assistant.id}`
      );
    } else {
      envContent += `\nOPENAI_ASSISTANT_ID=${assistant.id}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Assistant ID saved to .env file');
    
    return assistant.id;
    
  } catch (error) {
    console.error('❌ Error creating assistant:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createAssistant()
    .then(id => {
      console.log('\n🎉 Setup complete!');
      console.log('Next steps:');
      console.log('1. Add OPENAI_ASSISTANT_ID to Vercel environment variables');
      console.log('2. Deploy your backend');
      console.log('3. Test your voice chatbot!');
    })
    .catch(console.error);
}

module.exports = { createAssistant }; 