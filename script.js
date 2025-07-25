const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const historyBtn = document.getElementById('history-btn');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');
const closeBtn = document.querySelector('.close');
const voiceBtn = document.getElementById('voice-btn');
const voiceStatus = document.getElementById('voice-status');
const voiceFeedback = document.getElementById('voice-feedback');

// Generate a simple sessionId for the user (could be improved)
const sessionId = 'sess-' + Math.random().toString(36).substr(2, 9);

// Speech Recognition setup
let recognition;
let isRecording = false;

// Check if browser supports speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = true;
  
  // Check available languages and set Vietnamese if supported
  const availableLanguages = [
    'vi-VN', 'vi', 'en-US', 'en-GB', 'en-AU', 'en-CA'
  ];
  
  // Try Vietnamese first, fallback to English
  let selectedLang = 'vi-VN';
  
  // Check if Vietnamese is supported (basic check)
  if (!window.speechSynthesis.getVoices().some(voice => voice.lang.startsWith('vi'))) {
    console.log('Vietnamese not supported, falling back to English');
    selectedLang = 'en-US';
  }
  
  recognition.lang = selectedLang;
  console.log('Using language:', selectedLang);
  
  // Speech Synthesis setup
  const synth = window.speechSynthesis;
  
  // Get available voices
  function getAvailableVoices() {
    const voices = synth.getVoices();
    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    return voices;
  }
  
  // Wait for voices to load
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = getAvailableVoices;
  }
  
  // Voice recognition events
  recognition.onstart = () => {
    isRecording = true;
    voiceBtn.classList.add('recording');
    voiceStatus.textContent = 'Đang lắng nghe...';
    voiceStatus.className = 'voice-status listening';
    voiceFeedback.textContent = '';
  };
  
  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    // Show interim results
    if (interimTranscript) {
      voiceFeedback.textContent = `Đang nghe: ${interimTranscript}`;
    }
    
    // Process final result
    if (finalTranscript) {
      voiceFeedback.textContent = `Bạn nói: ${finalTranscript}`;
      userInput.value = finalTranscript;
      
      // Auto-send the message
      setTimeout(() => {
        sendMessage(finalTranscript);
        stopRecording();
      }, 500);
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    
    let errorMessage = 'Lỗi nhận diện giọng nói';
    switch(event.error) {
      case 'no-speech':
        errorMessage = 'Không nghe thấy giọng nói. Vui lòng thử lại.';
        break;
      case 'audio-capture':
        errorMessage = 'Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.';
        break;
      case 'not-allowed':
        errorMessage = 'Quyền truy cập microphone bị từ chối.';
        break;
      case 'network':
        errorMessage = 'Lỗi kết nối mạng.';
        break;
      case 'language-not-supported':
        errorMessage = 'Ngôn ngữ không được hỗ trợ. Đang chuyển sang tiếng Anh.';
        recognition.lang = 'en-US';
        break;
      default:
        errorMessage = `Lỗi: ${event.error}`;
    }
    
    voiceStatus.textContent = errorMessage;
    voiceStatus.className = 'voice-status error';
    stopRecording();
  };
  
  recognition.onend = () => {
    stopRecording();
  };
  
  // Voice button click handler
  voiceBtn.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
  
  function startRecording() {
    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      voiceStatus.textContent = 'Lỗi khởi động microphone';
      voiceStatus.className = 'voice-status error';
    }
  }
  
  function stopRecording() {
    isRecording = false;
    voiceBtn.classList.remove('recording');
    voiceStatus.textContent = 'Nhấn microphone để bắt đầu';
    voiceStatus.className = 'voice-status';
    voiceFeedback.textContent = '';
    
    try {
      recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }
  
  // Function to speak text
  function speakText(text) {
    if (synth.speaking) {
      synth.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find Vietnamese voice, fallback to English
    const voices = synth.getVoices();
    const vietnameseVoice = voices.find(voice => voice.lang.startsWith('vi'));
    const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
    
    if (vietnameseVoice) {
      utterance.voice = vietnameseVoice;
      utterance.lang = 'vi-VN';
    } else if (englishVoice) {
      utterance.voice = englishVoice;
      utterance.lang = 'en-US';
      console.log('Vietnamese voice not available, using English');
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    synth.speak(utterance);
  }
  
} else {
  // Browser doesn't support speech recognition
  voiceBtn.style.display = 'none';
  voiceStatus.textContent = 'Trình duyệt không hỗ trợ nhận diện giọng nói';
  voiceStatus.className = 'voice-status error';
}

function appendMessage(role, content) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;
  msgDiv.textContent = content;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message assistant loading';
  loadingDiv.textContent = 'Analyzing...';
  loadingDiv.id = 'loading-message';
  chatBox.appendChild(loadingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function hideLoading() {
  const loadingDiv = document.getElementById('loading-message');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

// Hiển thị modal lịch sử
function showHistoryModal() {
  historyModal.style.display = 'block';
  loadConversationHistory();
}

// Ẩn modal lịch sử
function hideHistoryModal() {
  historyModal.style.display = 'none';
}

// Load lịch sử hội thoại từ Supabase
async function loadConversationHistory() {
  // Hiển thị loading
  historyList.innerHTML = '<div class="loading-history">Đang tải lịch sử...</div>';
  
  try {
    const response = await fetch('/api/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.conversations && data.conversations.length > 0) {
      displayConversations(data.conversations);
    } else {
      historyList.innerHTML = '<div class="no-history">Chưa có lịch sử hội thoại nào</div>';
    }
  } catch (error) {
    console.error('Error loading history:', error);
    historyList.innerHTML = '<div class="no-history">Lỗi khi tải lịch sử: ' + error.message + '</div>';
  }
}

// Hiển thị danh sách cuộc hội thoại
function displayConversations(conversations) {
  historyList.innerHTML = '';
  
  conversations.forEach(conversation => {
    const conversationDiv = document.createElement('div');
    conversationDiv.className = 'conversation-item';
    
    // Format ngày tháng
    const date = new Date(conversation.created_at);
    const formattedDate = date.toLocaleString('vi-VN');
    
    // Lấy preview tin nhắn đầu tiên
    let preview = 'Không có tin nhắn';
    if (conversation.messages && conversation.messages.length > 0) {
      const firstMessage = conversation.messages[0];
      if (firstMessage.content) {
        preview = firstMessage.content.length > 100 
          ? firstMessage.content.substring(0, 100) + '...' 
          : firstMessage.content;
      }
    }
    
    conversationDiv.innerHTML = `
      <div class="conversation-header">
        <span>Cuộc hội thoại #${conversation.id}</span>
        <span class="conversation-date">${formattedDate}</span>
      </div>
      <div class="conversation-id">ID: ${conversation.conversation_id}</div>
      <div class="conversation-preview">${preview}</div>
    `;
    
    // Thêm event listener để xem chi tiết
    conversationDiv.addEventListener('click', () => {
      showConversationDetail(conversation);
    });
    
    historyList.appendChild(conversationDiv);
  });
}

// Hiển thị chi tiết cuộc hội thoại
function showConversationDetail(conversation) {
  // Tạo modal mới để hiển thị chi tiết
  const detailModal = document.createElement('div');
  detailModal.className = 'modal';
  detailModal.style.display = 'block';
  
  const date = new Date(conversation.created_at);
  const formattedDate = date.toLocaleString('vi-VN');
  
  let messagesHtml = '';
  if (conversation.messages && conversation.messages.length > 0) {
    conversation.messages.forEach(message => {
      const roleClass = message.role === 'user' ? 'user' : 'assistant';
      messagesHtml += `
        <div class="message ${roleClass}">
          <strong>${message.role === 'user' ? 'Bạn' : 'Bot'}:</strong> ${message.content}
        </div>
      `;
    });
  }
  
  detailModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Chi tiết cuộc hội thoại #${conversation.id}</h3>
        <span class="close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
      </div>
      <div style="padding: 20px;">
        <div style="margin-bottom: 15px; color: #666;">
          <strong>ID:</strong> ${conversation.conversation_id}<br>
          <strong>Thời gian:</strong> ${formattedDate}
        </div>
        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 15px; background: #f9f9f9;">
          ${messagesHtml || '<p>Không có tin nhắn nào</p>'}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(detailModal);
  
  // Đóng modal khi click bên ngoài
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) {
      detailModal.remove();
    }
  });
}

// Event listeners
historyBtn.addEventListener('click', showHistoryModal);
closeBtn.addEventListener('click', hideHistoryModal);

// Đóng modal khi click bên ngoài
window.addEventListener('click', (event) => {
  if (event.target === historyModal) {
    hideHistoryModal();
  }
});

async function sendMessage(message) {
  if (!message.trim()) return;
  
  console.log('Sending message:', message);
  
  appendMessage('user', message);
  userInput.value = '';
  showLoading();
  
  // Update status
  voiceStatus.textContent = 'Đang xử lý...';
  voiceStatus.className = 'voice-status processing';

  try {
    // Use main chat API with OpenAI
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId })
    });
    
    console.log('Response status:', res.status);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Response data:', data);
    hideLoading();
    
    if (data.response) {
      appendMessage('assistant', data.response);
      
      // Speak the response
      if (window.speechSynthesis) {
        speakText(data.response);
      }
      
      // Show save status
      if (data.savedToSupabase) {
        console.log('✅ Conversation saved to Supabase');
      } else {
        console.log('❌ Failed to save to Supabase');
      }
      
      // Log thread ID for debugging
      if (data.threadId) {
        console.log('Thread ID:', data.threadId);
      }
    } else if (data.error) {
      appendMessage('assistant', 'Lỗi: ' + data.error);
    }
    
    // Reset status
    voiceStatus.textContent = 'Nhấn microphone để bắt đầu';
    voiceStatus.className = 'voice-status';
    
  } catch (err) {
    hideLoading();
    console.error('Network error:', err);
    appendMessage('assistant', 'Lỗi kết nối mạng. Vui lòng thử lại.');
    
    // Reset status
    voiceStatus.textContent = 'Nhấn microphone để bắt đầu';
    voiceStatus.className = 'voice-status';
  }
}

// Form submit handler
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;
  
  await sendMessage(message);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Space bar to start/stop recording
  if (e.code === 'Space' && !e.target.matches('input, textarea')) {
    e.preventDefault();
    if (recognition && !isRecording) {
      startRecording();
    } else if (isRecording) {
      stopRecording();
    }
  }
  
  // Escape to stop recording
  if (e.code === 'Escape' && isRecording) {
    stopRecording();
  }
}); 