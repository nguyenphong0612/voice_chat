const OpenAI = require('openai');
const dotenv = require('dotenv');
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createAssistant() {
  try {
    console.log('Creating OpenAI Assistant...');
    
    const assistant = await openai.beta.assistants.create({
      name: "Voice Chat Assistant",
      instructions: "You are a helpful AI assistant that can communicate in multiple languages. Respond in the same language the user speaks. Be friendly, helpful, and provide accurate information.",
      model: "gpt-4o-mini",
      tools: []
    });

    console.log('✅ Assistant created successfully!');
    console.log('Assistant ID:', assistant.id);
    console.log('Name:', assistant.name);
    console.log('Model:', assistant.model);
    
    // Copy this ID to your environment variables
    console.log('\n📋 Copy this to your .env file:');
    console.log(`OPENAI_ASSISTANT_ID=${assistant.id}`);
    
    return assistant.id;
  } catch (error) {
    console.error('❌ Error creating assistant:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createAssistant()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = createAssistant; 