import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');

let currentUser = null;
let unsubscribe = null;

// Список матерных слов для фильтрации
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
                sendMessageBtn.disabled = true;
            } else {
                // Мут истек, снимаем
                await updateDoc(doc(db, 'users', user.uid), {
                    mutedUntil: null,
                    muteReason: null
                });
                chatInput.disabled = false;
                sendMessageBtn.disabled = false;
            }
        }
        
        // Загружаем сообщения
        loadMessages();
        
        // Включаем ввод (если не замучен)
        if (!currentUser.userData.mutedUntil || new Date(currentUser.userData.mutedUntil.toDate()) <= new Date()) {
            chatInput.disabled = false;
            sendMessageBtn.disabled = false;
        }
    } else {
        chatMessages.innerHTML = '<div class="chat-auth-required">🔒 Войдите, чтобы использовать чат</div>';
        chatInput.disabled = true;
        sendMessageBtn.disabled = true;
    }
});

// Показать сообщение о муте
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

// Проверка на мат
function containsBadWords(text) {
    const lowerText = text.toLowerCase();
    return badWords.some(word => lowerText.includes(word));
}

// Загрузка сообщений в реальном времени
function loadMessages() {
    const messagesRef = collection(db, 'chat');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
    
    unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        // Сортируем по возрастанию для отображения
        messages.reverse();
        
        displayMessages(messages);
    });
}

// Отображение сообщений
function displayMessages(messages) {
    if (messages.length === 0) {
        chatMessages.innerHTML = '<div class="chat-empty">Пока нет сообщений. Будьте первым!</div>';
        return;
    }
    
    chatMessages.innerHTML = '';
    
    messages.forEach(message => {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message';
        
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
    });
    
    // Прокрутка вниз
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Отправка сообщения
async function sendMessage() {
    const text = chatInput.value.trim();
    
    if (!text || !currentUser) return;
    
    // Проверка на мат
    if (containsBadWords(text)) {
        try {
            // Мутим на 5 минут
            const muteUntil = new Date();
            muteUntil.setMinutes(muteUntil.getMinutes() + 5);
            
            await updateDoc(doc(db, 'users', currentUser.uid), {
                mutedUntil: muteUntil,
                muteReason: 'Использование нецензурной лексики'
            });
            
            // Обновляем локальные данные
            currentUser.userData.mutedUntil = { toDate: () => muteUntil };
            
            // Показываем предупреждение
            showMuteMessage(5);
            
            // Блокируем ввод
            chatInput.disabled = true;
            sendMessageBtn.disabled = true;
            chatInput.value = '';
            
            return;
        } catch (error) {
            console.error('Ошибка применения мута:', error);
        }
    }
    
    try {
        await addDoc(collection(db, 'chat'), {
            text: text,
            userId: currentUser.uid,
            displayName: currentUser.userData.displayName || 'Аноним',
            username: currentUser.userData.username || '',
            role: currentUser.userData.role || 'покупатель',
            avatarUrl: currentUser.userData.avatarUrl || '',
            timestamp: serverTimestamp()
        });
        
        chatInput.value = '';
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        alert('Ошибка отправки сообщения');
    }
}

// Обработчики событий
sendMessageBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Очистка при выходе
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});
