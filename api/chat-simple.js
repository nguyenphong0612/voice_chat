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
  
  console.log('Received request:', { message, sessionId });
  
  if (!message || !sessionId) {
    res.status(400).json({ error: 'Missing message or sessionId' });
    return;
  }

  try {
    // Simple response for testing
    const response = `Bạn đã gửi: "${message}". Đây là phản hồi test từ server.`;
    
    res.status(200).json({ 
      response: response,
      savedToSupabase: false,
      messageCount: 1,
      threadId: 'test-thread-123'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}; 