# Web Chatbot với Lịch sử Hội thoại

Ứng dụng chatbot web với tính năng lưu trữ và hiển thị lịch sử hội thoại từ Supabase.

## Tính năng

- 💬 Chat với AI sử dụng OpenAI GPT-3.5
- 📋 Hiển thị lịch sử hội thoại
- 💾 Lưu trữ cuộc hội thoại vào Supabase
- 🎨 Giao diện đẹp và responsive
- 📱 Hỗ trợ mobile

## Cài đặt

1. **Clone project và cài đặt dependencies:**
```bash
cd week_3/web_chatbot_backend
npm install
```

2. **Tạo file .env với các biến môi trường:**
```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=3000
```

3. **Cấu hình Supabase:**
   - Tạo project trên [Supabase](https://supabase.com)
   - Tạo bảng `conversations_web_chatbot` với schema:
   ```sql
   CREATE TABLE conversations_web_chatbot (
     id BIGSERIAL PRIMARY KEY,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     conversation_id TEXT UNIQUE NOT NULL,
     messages JSONB
   );
   ```

4. **Chạy ứng dụng:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

5. **Truy cập ứng dụng:**
   - Mở trình duyệt và truy cập: `http://localhost:3000`

## Cách sử dụng

1. **Chat với AI:**
   - Gõ tin nhắn vào ô input
   - Nhấn Enter hoặc click "Send"
   - AI sẽ trả lời và lưu cuộc hội thoại

2. **Xem lịch sử:**
   - Click button "📋 Lịch sử hội thoại"
   - Xem danh sách các cuộc hội thoại
   - Click vào cuộc hội thoại để xem chi tiết

## API Endpoints

- `POST /api/chat` - Gửi tin nhắn và nhận phản hồi từ AI
- `GET /api/history` - Lấy lịch sử hội thoại từ Supabase

## Cấu trúc Project

```
web_chatbot_backend/
├── api/
│   ├── chat.js          # API xử lý chat
│   └── history.js       # API lấy lịch sử
├── index.html           # Giao diện chính
├── script.js            # JavaScript frontend
├── style.css            # CSS styling
├── server.js            # Express server
├── package.json         # Dependencies
└── README.md           # Hướng dẫn
```

## Troubleshooting

1. **Lỗi kết nối Supabase:**
   - Kiểm tra SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY
   - Đảm bảo bảng `conversations_web_chatbot` đã được tạo

2. **Lỗi OpenAI API:**
   - Kiểm tra OPENAI_API_KEY có hợp lệ không
   - Đảm bảo có đủ credit trong tài khoản OpenAI

3. **Lỗi server:**
   - Kiểm tra port 3000 có đang được sử dụng không
   - Thay đổi PORT trong file .env nếu cần

## Tính năng nâng cao

- [ ] Xóa cuộc hội thoại
- [ ] Tìm kiếm trong lịch sử
- [ ] Export lịch sử
- [ ] Voice chat
- [ ] Đa ngôn ngữ 