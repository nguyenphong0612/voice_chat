module.exports = async (req, res) => {
  const envCheck = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set',
    OPENAI_ASSISTANT_ID: process.env.OPENAI_ASSISTANT_ID ? '✅ Set' : '❌ Not set',
    SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };

  res.status(200).json({
    message: 'Environment variables check',
    environment: envCheck,
    timestamp: new Date().toISOString()
  });
}; 