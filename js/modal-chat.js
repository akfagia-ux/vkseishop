import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let unsubscribe = null;
let chatModal = null;
let chatMessages = null;
let chatInput = null;
let sendBtn = null;

// Список матерных слов
const badWords = [
    'хуй', 'хуя', 'хуи', 'хую', 'хуе', 'хуём', 'хуем',
    'пизд', 'пизда', 'пизде', 'пизду', 'пиздец', 'пиздой',
    'ебать', 'ебал', 'ебет', 'ебёт', 'ебут', 'ебала', 'ебло', 'ебаный', 'ебанный',
    'бля', 'блять', 'блядь', 'блядина', 'блядство',
    'сука', 'суки', 'суку', 'сукой',
    'мудак', 'мудила', 'мудило', 'мудаки',
    'гандон', 'гондон',
    'дебил', 'дебилы', 'дебила',
    'долбоеб', 'долбоёб',
    'уебок', 'уёбок',
    'чмо', 'чмошник'
];

// Инициализация модального чата
function initModalChat() {
    // Создаем HTML структуру
    const chatHTML = `
        <div class="modal-chat-overlay" id="modalChatOverlay">
            <div class="modal-chat-container">
                <div class="modal-chat-header">
                    <div class="modal-chat-header-left">
                        <span style="font-size: 1.8rem;">💬</span>
                        <div>
                            <h2>Общий чат</h2>
                            <p class="modal-chat-subtitle">Общайтесь с другими пользователями</p>
                        </div>
                    </div>
                    <button class="modal-chat-close" id="modalChatClose">✕</button>
                </div>
                
                <div class="modal-chat-pinned-box">
                    <div class="modal-pinned-box-header">
                        <div class="modal-pinned-box-icon">📌</div>
                        <h3>Закрепленное сообщение</h3>
                    </div>
                    <div class="modal-pinned-box-content">
                        <p>🛒 <strong>Этот чат предназначен для торговли и общения.</strong></p>
                        <p>Вы можете:</p>
                        <ul>
                            <li>✅ Предлагать свои товары и услуги</li>
                            <li>✅ Обсуждать сделки с другими пользователями</li>
                            <li>✅ Задавать вопросы о товарах</li>
                        </ul>
                        <p><strong>⚠️ Правила:</strong> Без мата, спама и оскорблений. Нарушители будут замучены.</p>
                        <p style="margin-top: 0.8rem; opacity: 0.8;">Приятной торговли! 💼</p>
                    </div>
                </div>
                
                <div class="modal-chat-messages" id="modalChatMessages">
                    <div class="chat-loading">Загрузка сообщений...</div>
                </div>
                
                <div class="modal-chat-input-container">
                    <input type="text" id="modalChatInput" placeholder="Введите сообщение..." maxlength="500" disabled>
                    <button id="modalSendBtn" class="btn-send" disabled>
                        <span>📤</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', chatHTML);
    
    // Получаем элементы
    chatModal = document.getElementById('modalChatOverlay');
    chatMessages = document.getElementById('modalChatMessages');
    chatInput = document.getElementById('modalChatInput');
    sendBtn = document.getElementById('modalSendBtn');
    const closeBtn = document.getElementById('modalChatClose');
    
    // Обработчики
    closeBtn.addEventListener('click', closeChat);
    chatModal.addEventListener('click', (e) => {
        if (e.target === chatModal) closeChat();
    });
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Обработчик для ссылки "Чат" в навигации
    const chatLinks = document.querySelectorAll('a[href="chat.html"]');
    chatLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openChat();
        });
    });
    
    // Проверка авторизации
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            currentUser.userData = userDoc.data();
            
            // Проверяем мут
            if (currentUser.userData.mutedUntil) {
                const mutedUntil = currentUser.userData.mutedUntil.toDate();
                const now = new Date();
                
                if (mutedUntil > now) {
                    const remainingTime = Math.ceil((mutedUntil - now) / 1000 / 60);
                    showMuteMessage(remainingTime);
                    chatInput.disabled = true;
                    sendBtn.disabled = true;
                } else {
                    await updateDoc(doc(db, 'users', user.uid), {
                        mutedUntil: null,
                        muteReason: null
                    });
                    chatInput.disabled = false;
                    sendBtn.disabled = false;
                }
            } else {
                chatInput.disabled = false;
                sendBtn.disabled = false;
            }
            
            loadMessages();
        } else {
            chatMessages.innerHTML = '<div class="chat-auth-required">🔒 Войдите, чтобы использовать чат</div>';
            chatInput.disabled = true;
            sendBtn.disabled = true;
        }
    });
}

function openChat() {
    chatModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (chatInput && !chatInput.disabled) {
        setTimeout(() => chatInput.focus(), 100);
    }
}

function closeChat() {
    chatModal.classList.remove('active');
    document.body.style.overflow = '';
}

function showMuteMessage(minutes) {
    const muteDiv = document.createElement('div');
    muteDiv.className = 'chat-mute-warning';
    muteDiv.innerHTML = `
        <div class="mute-icon">🔇</div>
        <div class="mute-text">
            <strong>Вы замучены</strong>
            <p>Причина: Использование нецензурной лексики</p>
            <p>Осталось: ${minutes} мин.</p>
        </div>
    `;
    
    const existingMute = document.querySelector('.chat-mute-warning');
    if (existingMute) {
        existingMute.remove();
    }
    
    chatMessages.parentElement.insertBefore(muteDiv, chatMessages);
}

function containsBadWords(text) {
    const lowerText = text.toLowerCase();
    return badWords.some(word => lowerText.includes(word));
}

function loadMessages() {
    const messagesRef = collection(db, 'chat');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(100));
    
    let isFirstLoad = true;
    
    unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        messages.reverse();
        
        if (isFirstLoad) {
            // Первая загрузка - показываем все сообщения
            chatMessages.innerHTML = '';
            isFirstLoad = false;
        }
        
        displayMessages(messages);
    }, (error) => {
        console.error('Ошибка загрузки сообщений:', error);
        chatMessages.innerHTML = '<div class="chat-error">❌ Ошибка загрузки сообщений</div>';
    });
}

function displayMessages(messages) {
    if (messages.length === 0) {
        chatMessages.innerHTML = '<div class="chat-empty">Пока нет сообщений. Будьте первым!</div>';
        return;
    }
    
    // Сохраняем позицию скролла
    const wasAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 100;
    
    // Получаем существующие ID сообщений
    const existingIds = new Set();
    chatMessages.querySelectorAll('[data-message-id]').forEach(el => {
        const id = el.getAttribute('data-message-id');
        if (!id.startsWith('temp-')) {
            existingIds.add(id);
        }
    });
    
    // Добавляем только новые сообщения
    messages.forEach(message => {
        if (!existingIds.has(message.id)) {
            const messageEl = document.createElement('div');
            messageEl.className = 'chat-message';
            messageEl.setAttribute('data-message-id', message.id);
            
            if (message.userId === currentUser?.uid) {
                messageEl.classList.add('own-message');
            }
            
            const avatarStyle = message.avatarUrl 
                ? `background-image: url(${message.avatarUrl}); background-size: cover; background-position: center;`
                : '';
            const avatarIcon = message.avatarUrl ? '' : '👤';
            
            const time = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
            
            messageEl.innerHTML = `
                <div class="message-avatar" style="${avatarStyle}">${avatarIcon}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-username">${message.displayName || 'Аноним'}</span>
                        <span class="message-role">${message.role || 'покупатель'}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">${escapeHtml(message.text)}</div>
                </div>
            `;
            
            chatMessages.appendChild(messageEl);
            existingIds.add(message.id);
        }
    });
    
    // Автоскролл только если был внизу
    if (wasAtBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

async function sendMessage() {
    const text = chatInput.value.trim();
    
    if (!text || !currentUser) return;
    
    // Проверяем актуальный статус мута перед отправкой
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        if (userData.mutedUntil) {
            const mutedUntil = userData.mutedUntil.toDate();
            const now = new Date();
            
            if (mutedUntil > now) {
                const remainingTime = Math.ceil((mutedUntil - now) / 1000 / 60);
                showMuteMessage(remainingTime);
                chatInput.disabled = true;
                sendBtn.disabled = true;
                chatInput.value = '';
                
                // Показываем причину мута
                const muteWarning = document.createElement('div');
                muteWarning.className = 'chat-error-message';
                muteWarning.style.cssText = 'background: rgba(251, 146, 60, 0.2); padding: 0.8rem; border-radius: 8px; text-align: center; margin: 0.5rem 0; border-left: 4px solid #fb923c;';
                muteWarning.innerHTML = `
                    <strong>🔇 Вы замучены</strong><br>
                    <span style="opacity: 0.9;">Причина: ${userData.muteReason || 'Не указана'}</span><br>
                    <span style="opacity: 0.8;">Осталось: ${remainingTime} мин.</span>
                `;
                chatMessages.appendChild(muteWarning);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                setTimeout(() => muteWarning.remove(), 5000);
                
                return;
            } else {
                // Мут истек, снимаем его
                await updateDoc(doc(db, 'users', currentUser.uid), {
                    muted: false,
                    mutedUntil: null,
                    muteReason: null,
                    mutedBy: null,
                    mutedByName: null
                });
                chatInput.disabled = false;
                sendBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Ошибка проверки мута:', error);
    }
    
    // Проверка на мат
    if (containsBadWords(text)) {
        try {
            const { Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const muteUntil = new Date();
            muteUntil.setMinutes(muteUntil.getMinutes() + 5);
            
            await updateDoc(doc(db, 'users', currentUser.uid), {
                muted: true,
                mutedUntil: Timestamp.fromDate(muteUntil),
                muteReason: 'Использование нецензурной лексики (автомут)'
            });
            
            currentUser.userData.mutedUntil = { toDate: () => muteUntil };
            
            showMuteMessage(5);
            chatInput.disabled = true;
            sendBtn.disabled = true;
            chatInput.value = '';
            
            return;
        } catch (error) {
            console.error('Ошибка применения мута:', error);
        }
    }
    
    // Очищаем поле ввода сразу для быстрого отклика
    const messageText = text;
    chatInput.value = '';
    
    // Создаем временное сообщение (оптимистичное обновление)
    const tempMessage = {
        id: 'temp-' + Date.now(),
        text: messageText,
        userId: currentUser.uid,
        displayName: currentUser.userData.displayName || 'Аноним',
        username: currentUser.userData.username || '',
        role: currentUser.userData.role || 'покупатель',
        avatarUrl: currentUser.userData.avatarUrl || '',
        timestamp: { toDate: () => new Date() },
        isTemp: true
    };
    
    // Добавляем временное сообщение в UI сразу
    addMessageToUI(tempMessage);
    
    try {
        // Отправляем в Firestore в фоне
        await addDoc(collection(db, 'chat'), {
            text: messageText,
            userId: currentUser.uid,
            displayName: currentUser.userData.displayName || 'Аноним',
            username: currentUser.userData.username || '',
            role: currentUser.userData.role || 'покупатель',
            avatarUrl: currentUser.userData.avatarUrl || '',
            timestamp: serverTimestamp()
        });
        
        // Удаляем временное сообщение (настоящее придет через onSnapshot)
        const tempEl = document.querySelector(`[data-message-id="${tempMessage.id}"]`);
        if (tempEl) tempEl.remove();
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        
        // Удаляем временное сообщение
        const tempEl = document.querySelector(`[data-message-id="${tempMessage.id}"]`);
        if (tempEl) tempEl.remove();
        
        // Показываем ошибку
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chat-error-message';
        let errorText = '❌ Ошибка отправки. ';
        
        if (error.code === 'permission-denied') {
            errorText += 'Нет прав доступа к базе данных.';
        } else if (error.code === 'unavailable') {
            errorText += 'Нет подключения к серверу.';
        } else {
            errorText += error.message || 'Попробуйте снова.';
        }
        
        errorDiv.textContent = errorText;
        errorDiv.style.cssText = 'background: rgba(239, 68, 68, 0.2); padding: 0.8rem; border-radius: 8px; text-align: center; margin: 0.5rem 0;';
        chatMessages.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
        
        // Возвращаем текст в поле ввода
        chatInput.value = messageText;
    }
}

// Функция для добавления одного сообщения в UI
function addMessageToUI(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    messageEl.setAttribute('data-message-id', message.id);
    
    if (message.userId === currentUser?.uid) {
        messageEl.classList.add('own-message');
    }
    
    if (message.isTemp) {
        messageEl.style.opacity = '0.7';
    }
    
    const avatarStyle = message.avatarUrl 
        ? `background-image: url(${message.avatarUrl}); background-size: cover; background-position: center;`
        : '';
    const avatarIcon = message.avatarUrl ? '' : '👤';
    
    const time = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
    
    messageEl.innerHTML = `
        <div class="message-avatar" style="${avatarStyle}">${avatarIcon}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-username">${message.displayName || 'Аноним'}</span>
                <span class="message-role">${message.role || 'покупатель'}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(message.text)}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModalChat);
} else {
    initModalChat();
}

// Очистка
window.addEventListener('beforeunload', () => {
    if (unsubscribe) unsubscribe();
});
