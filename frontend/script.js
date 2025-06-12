// 全局变量
let isLoading = false;
let eventSource = null;

// DOM元素
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorToast = document.getElementById('errorToast');
const charCount = document.querySelector('.char-count');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    adjustTextareaHeight();
});

// 事件监听器
function initializeEventListeners() {
    // 发送按钮点击
    sendButton.addEventListener('click', sendMessage);
    
    // 输入框事件
    messageInput.addEventListener('input', function() {
        updateCharCount();
        adjustTextareaHeight();
        updateSendButton();
    });
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 粘贴事件
    messageInput.addEventListener('paste', function() {
        setTimeout(() => {
            updateCharCount();
            adjustTextareaHeight();
            updateSendButton();
        }, 0);
    });
}

// 更新字符计数
function updateCharCount() {
    const count = messageInput.value.length;
    charCount.textContent = `${count}/2000`;
    
    if (count > 1800) {
        charCount.style.color = '#ef4444';
    } else if (count > 1500) {
        charCount.style.color = '#f59e0b';
    } else {
        charCount.style.color = 'rgba(255, 255, 255, 0.5)';
    }
}

// 调整输入框高度
function adjustTextareaHeight() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// 更新发送按钮状态
function updateSendButton() {
    const hasText = messageInput.value.trim().length > 0;
    sendButton.disabled = !hasText || isLoading;
}

// 发送消息
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isLoading) return;
    
    // 添加用户消息到界面
    addUserMessage(message);
    
    // 清空输入框
    messageInput.value = '';
    updateCharCount();
    adjustTextareaHeight();
    updateSendButton();
    
    // 显示加载状态
    showLoading();
    
    try {
        await streamChatResponse(message);
    } catch (error) {
        console.error('发送消息失败:', error);
        showError('发送消息失败，请稍后重试');
        hideLoading();
    }
}

// 添加用户消息
function addUserMessage(message) {
    const messageElement = createMessageElement('user', message);
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

// 添加助手消息
function addAssistantMessage(content, isComplete = false) {
    let messageElement = document.querySelector('.assistant-message.streaming');
    
    if (!messageElement) {
        messageElement = createMessageElement('assistant', '', true);
        chatMessages.appendChild(messageElement);
    }
    
    const messageText = messageElement.querySelector('.message-text');
    
    if (isComplete) {
        // 完整消息，使用Markdown渲染
        messageText.innerHTML = marked.parse(content);
        messageElement.classList.remove('streaming');
        
        // 更新时间
        const timeElement = messageElement.querySelector('.message-time');
        timeElement.textContent = formatTime(new Date());
    } else {
        // 流式消息，直接添加文本
        messageText.textContent += content;
    }
    
    scrollToBottom();
}

// 创建消息元素
function createMessageElement(type, content, isStreaming = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${type}-message${isStreaming ? ' streaming' : ''}`;
    
    if (type === 'assistant') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${type === 'user' ? escapeHtml(content) : (content ? marked.parse(content) : '')}</div>
                <div class="message-time">${formatTime(new Date())}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(content)}</div>
                <div class="message-time">${formatTime(new Date())}</div>
            </div>
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
        `;
    }
    
    return messageDiv;
}

// 流式聊天响应
async function streamChatResponse(message) {
    try {
        const response = await fetch('http://localhost:8000/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';
        
        hideLoading();
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        // 流式传输完成，渲染完整的Markdown
                        addAssistantMessage(fullResponse, true);
                        return;
                    }
                    
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.content) {
                            fullResponse += parsed.content;
                            addAssistantMessage(parsed.content, false);
                        }
                    } catch (e) {
                        console.warn('解析SSE数据失败:', e);
                    }
                }
            }
        }
        
        // 如果没有收到[DONE]信号，也要渲染完整消息
        if (fullResponse) {
            addAssistantMessage(fullResponse, true);
        }
        
    } catch (error) {
        console.error('流式响应错误:', error);
        showError('连接服务器失败，请检查后端服务是否启动');
        throw error;
    }
}

// 显示加载状态
function showLoading() {
    isLoading = true;
    loadingIndicator.style.display = 'flex';
    updateSendButton();
}

// 隐藏加载状态
function hideLoading() {
    isLoading = false;
    loadingIndicator.style.display = 'none';
    updateSendButton();
}

// 显示错误提示
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorToast.style.display = 'flex';
    
    setTimeout(() => {
        errorToast.style.display = 'none';
    }, 5000);
}

// 滚动到底部
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 格式化时间
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // 小于1分钟
        return '刚刚';
    } else if (diff < 3600000) { // 小于1小时
        return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 小于1天
        return `${Math.floor(diff / 3600000)}小时前`;
    } else {
        return date.toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面隐藏时关闭EventSource连接
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
    }
});

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    if (eventSource) {
        eventSource.close();
    }
});
