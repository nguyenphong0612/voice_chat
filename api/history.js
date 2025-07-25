const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Lấy tất cả cuộc hội thoại từ Supabase, sắp xếp theo thời gian tạo mới nhất
    const { data: conversations, error } = await supabase
      .from('conversations_web_chatbot')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Giới hạn 50 cuộc hội thoại gần nhất

    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ 
        error: 'Database error', 
        details: error.message 
      });
      return;
    }

    // Trả về danh sách cuộc hội thoại
    res.status(200).json({ 
      conversations: conversations || [],
      count: conversations ? conversations.length : 0
    });

  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}; 