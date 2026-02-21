import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, getDocs, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let currentChat = null;
let unreadCount = 0;
let notificationSound = null;
let modalInitialized = false;

// Инициализация звука уведомления
function initNotificationSound() {
    notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bhxqu+zpoVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVCEOc3fLBbiQFL4TP89uJNgYcarvs6aFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQhDnN3ywW4kBS+Ez/PbiTYGHGq77OmhUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBUIQ5zd8sFuJAUvhM/z24k2Bhxqu+zpoVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVCEOc3fLBbiQFL4TP89uJNgYcarvs6aFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQhDnN3ywW4kBS+Ez/PbiTYGHGq77OmhUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBUIQ5zd8sFuJAUvhM/z24k2Bhxqu+zpoVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVCEOc3fLBbiQFL4TP89uJNgYcarvs6aFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQhDnN3ywW4kBS+Ez/PbiTYGHGq77OmhUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBUIQ5zd8sFuJAUvhM/z24k2Bhxqu+zpoVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVCEOc3fLBbiQFL4TP89uJNgYcarvsw==');
}

// Инициализация модального окна (вызывается сразу)
function initModalMessages() {
    if (modalInitialized) return;
    modalInitialized = true;
    
    const modalHTML = `
        <div class="modal-messages-overlay" id="modalMessagesOverlay">
            <div class="modal-messages-container">
                <div class="modal-messages-header">
                    <h2>💬 Сообщения</h2>
                    <button class="btn-new-dm" id="btnNewDM" title="Написать ЛС">✏️</button>
                    <button class="modal-messages-close" id="modalMessagesClose">✕</button>
                </div>
                
                <div class="modal-messages-body">
                    <div class="modal-messages-sidebar">
                        <div class="modal-messages-tabs">
                            <button class="modal-messages-tab active" data-tab="direct">Личные</button>
                            <button class="modal-messages-tab" data-tab="groups">Группы</button>
                        </div>
                        
                        <div class="modal-messages-list" id="modalMessagesList">
                            <div class="messages-loading">Войдите, чтобы увидеть сообщения</div>
                        </div>
                    </div>
                    
                    <div class="modal-messages-main">
                        <div class="modal-messages-empty" id="modalMessagesEmpty">
                            <div class="empty-icon">💬</div>
                            <h3>Выберите чат</h3>
                            <p>Выберите существующий чат или создайте новый</p>
                        </div>
                        
                        <div class="modal-messages-chat" id="modalMessagesChat" style="display:none;">
                            <div class="modal-messages-chat-header">
                                <div class="modal-chat-header-info">
                                    <div class="modal-chat-avatar" id="modalChatAvatar">👤</div>
                                    <div class="modal-chat-info">
                                        <h3 id="modalChatName">Имя чата</h3>
                                        <p id="modalChatStatus">онлайн</p>
                                    </div>
                                </div>
                                <button class="btn-clear-chat" id="btnClearChat" title="Очистить чат" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: all 0.3s;">
                                    🗑️ Очистить
                                </button>
                            </div>
                            
                            <div class="modal-messages-chat-body" id="modalChatBody">
                                <div class="modal-chat-messages-list" id="modalChatMessagesList"></div>
                            </div>
                            
                            <div class="modal-messages-chat-input">
                                <input type="text" id="modalMessageInput" placeholder="Введите сообщение..." maxlength="1000">
                                <button id="modalSendMessageBtn" class="btn-send-message">📤</button>
                            </div>
                        </div>
                        
                        <div class="modal-new-dm" id="modalNewDM" style="display:none;">
                            <h3>Написать личное сообщение</h3>
                            <input type="text" id="searchUserInput" placeholder="Поиск пользователя по username или email...">
                            <div id="searchUserResults"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Обработчики
    document.getElementById('modalMessagesClose').addEventListener('click', closeModal);
    document.getElementById('modalMessagesOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'modalMessagesOverlay') closeModal();
    });
    document.getElementById('modalSendMessageBtn').addEventListener('click', sendMessage);
    document.getElementById('modalMessageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('btnNewDM').addEventListener('click', showNewDMScreen);
    document.getElementById('searchUserInput').addEventListener('input', searchUsers);
    document.getElementById('btnClearChat').addEventListener('click', clearCurrentChat);
}

// Инициализируем модальное окно сразу
initModalMessages();

function closeModal() {
    const overlay = document.getElementById('modalMessagesOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Проверка авторизации
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        currentUser.userData = userDoc.data();
        
        initNotificationSound();
        loadChats();
        listenForNewMessages();
    } else {
        // Пользователь не авторизован
        const messagesList = document.getElementById('modalMessagesList');
        if (messagesList) {
            messagesList.innerHTML = '<div class="messages-loading">Войдите, чтобы увидеть сообщения</div>';
        }
    }
});

// Загрузка списка чатов
function loadChats() {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
    
    onSnapshot(q, (snapshot) => {
        const chats = [];
        snapshot.forEach((doc) => {
            chats.push({ id: doc.id, ...doc.data() });
        });
        
        displayChats(chats);
    });
}

// Отображение списка чатов
async function displayChats(chats) {
    const messagesList = document.getElementById('modalMessagesList');
    
    if (!messagesList) return;
    
    if (chats.length === 0) {
        messagesList.innerHTML = '<div class="no-chats">Нет чатов</div>';
        return;
    }
    
    messagesList.innerHTML = '';
    
    for (const chat of chats) {
        const chatEl = document.createElement('div');
        chatEl.className = 'modal-chat-item';
        if (chat.unreadCount && chat.unreadCount[currentUser.uid] > 0) {
            chatEl.classList.add('unread');
        }
        
        let chatName = '';
        let chatAvatar = '👤';
        
        if (chat.type === 'direct') {
            const otherUserId = chat.participants.find(id => id !== currentUser.uid);
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            const otherUser = otherUserDoc.data();
            chatName = otherUser.displayName || 'Пользователь';
            chatAvatar = otherUser.avatarUrl ? `<img src="${otherUser.avatarUrl}">` : '👤';
        } else if (chat.type === 'group') {
            chatName = chat.name;
            chatAvatar = '👥';
        }
        
        const unreadBadge = chat.unreadCount && chat.unreadCount[currentUser.uid] > 0 
            ? `<span class="unread-badge">${chat.unreadCount[currentUser.uid]}</span>` 
            : '';
        
        chatEl.innerHTML = `
            <div class="modal-chat-item-avatar">${chatAvatar}</div>
            <div class="modal-chat-item-info">
                <div class="modal-chat-item-name">${chatName}</div>
                <div class="modal-chat-item-last-message">${chat.lastMessage || 'Нет сообщений'}</div>
            </div>
            ${unreadBadge}
        `;
        
        chatEl.addEventListener('click', () => openChat(chat));
        messagesList.appendChild(chatEl);
    }
}


// Открытие чата
async function openChat(chat) {
    currentChat = chat;
    
    document.getElementById('modalMessagesEmpty').style.display = 'none';
    document.getElementById('modalMessagesChat').style.display = 'flex';
    
    // Обновляем заголовок
    let chatName = '';
    
    if (chat.type === 'direct') {
        const otherUserId = chat.participants.find(id => id !== currentUser.uid);
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
        const otherUser = otherUserDoc.data();
        chatName = otherUser.displayName || 'Пользователь';
        
        // Проверяем настройки приватности
        if (otherUser.allowDirectMessages === false) {
            document.getElementById('modalMessageInput').disabled = true;
            document.getElementById('modalSendMessageBtn').disabled = true;
            document.getElementById('modalChatStatus').textContent = '🔒 Пользователь запретил личные сообщения';
        } else {
            document.getElementById('modalMessageInput').disabled = false;
            document.getElementById('modalSendMessageBtn').disabled = false;
            document.getElementById('modalChatStatus').textContent = 'онлайн';
        }
        
        if (otherUser.avatarUrl) {
            document.getElementById('modalChatAvatar').innerHTML = `<img src="${otherUser.avatarUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            document.getElementById('modalChatAvatar').textContent = '👤';
        }
    } else if (chat.type === 'group') {
        chatName = chat.name;
        document.getElementById('modalChatAvatar').textContent = '👥';
        document.getElementById('modalChatStatus').textContent = `${chat.participants.length} участников`;
        document.getElementById('modalMessageInput').disabled = false;
        document.getElementById('modalSendMessageBtn').disabled = false;
    }
    
    document.getElementById('modalChatName').textContent = chatName;
    
    // Загружаем сообщения
    loadChatMessages(chat.id);
    
    // Отмечаем сообщения как прочитанные
    markAsRead(chat.id);
}

// Загрузка сообщений чата
function loadChatMessages(chatId) {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
    
    onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        messages.reverse();
        displayChatMessages(messages);
    });
}

// Отображение сообщений
function displayChatMessages(messages) {
    const chatMessagesList = document.getElementById('modalChatMessagesList');
    
    if (!chatMessagesList) return;
    
    chatMessagesList.innerHTML = '';
    
    if (messages.length === 0) {
        chatMessagesList.innerHTML = '<div class="no-messages">Нет сообщений</div>';
        return;
    }
    
    messages.forEach(message => {
        const messageEl = document.createElement('div');
        messageEl.className = 'modal-chat-message-item';
        
        if (message.userId === currentUser.uid) {
            messageEl.classList.add('own');
        }
        
        const time = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
        
        messageEl.innerHTML = `
            <div class="modal-message-sender">${message.displayName || 'Аноним'}</div>
            <div class="modal-message-text">${escapeHtml(message.text)}</div>
            <div class="modal-message-time">${time}</div>
        `;
        
        chatMessagesList.appendChild(messageEl);
    });
    
    chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
}

// Отправка сообщения
async function sendMessage() {
    const input = document.getElementById('modalMessageInput');
    const text = input.value.trim();
    
    if (!text || !currentChat) return;
    
    try {
        const messagesRef = collection(db, 'chats', currentChat.id, 'messages');
        await addDoc(messagesRef, {
            text: text,
            userId: currentUser.uid,
            displayName: currentUser.userData.displayName || 'Аноним',
            timestamp: serverTimestamp()
        });
        
        // Обновляем последнее сообщение в чате
        const otherUserId = currentChat.participants.find(id => id !== currentUser.uid);
        await updateDoc(doc(db, 'chats', currentChat.id), {
            lastMessage: text,
            lastMessageTime: serverTimestamp(),
            [`unreadCount.${otherUserId}`]: (currentChat.unreadCount?.[otherUserId] || 0) + 1
        });
        
        input.value = '';
    } catch (error) {
        console.error('Ошибка отправки:', error);
    }
}

// Отметить как прочитанное
async function markAsRead(chatId) {
    try {
        await updateDoc(doc(db, 'chats', chatId), {
            [`unreadCount.${currentUser.uid}`]: 0
        });
    } catch (error) {
        console.error('Ошибка отметки прочитанного:', error);
    }
}

// Слушать новые сообщения для уведомлений
function listenForNewMessages() {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
    
    onSnapshot(q, (snapshot) => {
        let totalUnread = 0;
        snapshot.forEach((doc) => {
            const chat = doc.data();
            if (chat.unreadCount && chat.unreadCount[currentUser.uid]) {
                totalUnread += chat.unreadCount[currentUser.uid];
            }
        });
        
        if (totalUnread > unreadCount && unreadCount > 0) {
            // Новое сообщение - играем звук
            if (notificationSound) {
                notificationSound.play().catch(e => console.log('Не удалось воспроизвести звук'));
            }
        }
        
        unreadCount = totalUnread;
        updateUnreadBadge(totalUnread);
    });
}

// Обновить значок непрочитанных
function updateUnreadBadge(count) {
    const btn = document.getElementById('floatingMessagesBtn');
    if (!btn) return;
    
    let badge = btn.querySelector('.unread-count-badge');
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'unread-count-badge';
            btn.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : count;
    } else if (badge) {
        badge.remove();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Обработчики событий удалены, так как они теперь в initModalMessages


// Показать экран создания нового ЛС
function showNewDMScreen() {
    document.getElementById('modalMessagesEmpty').style.display = 'none';
    document.getElementById('modalMessagesChat').style.display = 'none';
    document.getElementById('modalNewDM').style.display = 'flex';
    document.getElementById('searchUserInput').value = '';
    document.getElementById('searchUserResults').innerHTML = '';
}

// Поиск пользователей
async function searchUsers(e) {
    const searchText = e.target.value.trim().toLowerCase();
    const resultsDiv = document.getElementById('searchUserResults');
    
    if (searchText.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }
    
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        const results = [];
        snapshot.forEach((doc) => {
            const userData = doc.data();
            const username = (userData.username || '').toLowerCase();
            const email = (userData.email || '').toLowerCase();
            const displayName = (userData.displayName || '').toLowerCase();
            
            if (doc.id !== currentUser.uid && 
                (username.includes(searchText) || email.includes(searchText) || displayName.includes(searchText))) {
                results.push({ id: doc.id, ...userData });
            }
        });
        
        displaySearchResults(results);
    } catch (error) {
        console.error('Ошибка поиска:', error);
    }
}

// Отображение результатов поиска
function displaySearchResults(users) {
    const resultsDiv = document.getElementById('searchUserResults');
    
    if (users.length === 0) {
        resultsDiv.innerHTML = '<div class="no-results">Пользователи не найдены</div>';
        return;
    }
    
    resultsDiv.innerHTML = '';
    
    users.forEach(user => {
        const userEl = document.createElement('div');
        userEl.className = 'search-user-item';
        
        const avatarHTML = user.avatarUrl 
            ? `<img src="${user.avatarUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` 
            : '👤';
        
        userEl.innerHTML = `
            <div class="search-user-avatar">${avatarHTML}</div>
            <div class="search-user-info">
                <div class="search-user-name">${user.displayName || 'Пользователь'}</div>
                <div class="search-user-username">@${user.username || user.email}</div>
            </div>
        `;
        
        userEl.addEventListener('click', () => startChat(user));
        resultsDiv.appendChild(userEl);
    });
}

// Начать чат с пользователем (экспортируемая функция)
export async function startChatWithUser(otherUser) {
    // Проверяем настройки приватности
    if (otherUser.allowDirectMessages === false) {
        alert('🔒 Пользователь запретил личные сообщения');
        return;
    }
    
    if (!currentUser) {
        alert('Войдите, чтобы отправлять сообщения');
        return;
    }
    
    try {
        // Проверяем, есть ли уже чат с этим пользователем
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
        const snapshot = await getDocs(q);
        
        let existingChat = null;
        snapshot.forEach((doc) => {
            const chatData = doc.data();
            if (chatData.type === 'direct' && chatData.participants.includes(otherUser.id)) {
                existingChat = { id: doc.id, ...chatData };
            }
        });
        
        if (existingChat) {
            // Открываем существующий чат
            openChat(existingChat);
        } else {
            // Создаем новый чат
            const newChatRef = await addDoc(collection(db, 'chats'), {
                type: 'direct',
                participants: [currentUser.uid, otherUser.id],
                createdAt: serverTimestamp(),
                lastMessage: '',
                lastMessageTime: serverTimestamp(),
                unreadCount: {
                    [currentUser.uid]: 0,
                    [otherUser.id]: 0
                }
            });
            
            const newChat = {
                id: newChatRef.id,
                type: 'direct',
                participants: [currentUser.uid, otherUser.id]
            };
            
            openChat(newChat);
        }
    } catch (error) {
        console.error('Ошибка создания чата:', error);
        alert('Ошибка создания чата');
    }
}

// Начать чат с пользователем (внутренняя функция)
async function startChat(otherUser) {
    return startChatWithUser(otherUser);
}


// Очистка текущего чата
async function clearCurrentChat() {
    if (!currentChat) {
        showCustomAlert('Чат не выбран');
        return;
    }
    
    const confirmed = await showCustomConfirm(
        'Вы уверены, что хотите очистить всю переписку?',
        'Это действие нельзя отменить!'
    );
    
    if (!confirmed) return;
    
    try {
        // Получаем все сообщения в чате
        const messagesRef = collection(db, 'chats', currentChat.id, 'messages');
        const snapshot = await getDocs(messagesRef);
        
        // Удаляем все сообщения
        const deletePromises = [];
        snapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        
        // Обновляем последнее сообщение в чате
        await updateDoc(doc(db, 'chats', currentChat.id), {
            lastMessage: '',
            lastMessageTime: serverTimestamp()
        });
        
        showCustomAlert('✅ Чат успешно очищен!');
    } catch (error) {
        console.error('Ошибка очистки чата:', error);
        showCustomAlert('❌ Ошибка при очистке чата');
    }
}

// Кастомное модальное окно для alert
function showCustomAlert(message) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="
            background: rgba(30, 30, 30, 0.98);
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(100, 100, 255, 0.3);
            max-width: 400px;
            animation: slideUp 0.4s ease;
        ">
            <p style="color: white; font-size: 1.1rem; margin-bottom: 1.5rem; line-height: 1.6;">${message}</p>
            <button onclick="this.closest('div').parentElement.remove()" style="
                background: linear-gradient(45deg, #8b5cf6, #6366f1);
                color: white;
                padding: 0.8rem 2rem;
                border: none;
                border-radius: 10px;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
            ">
                OK
            </button>
        </div>
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(30px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        </style>
    `;
    
    document.body.appendChild(modal);
}

// Кастомное модальное окно для confirm
function showCustomConfirm(title, message) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="
                background: rgba(30, 30, 30, 0.98);
                padding: 2rem;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 2px solid rgba(100, 100, 255, 0.3);
                max-width: 450px;
                animation: slideUp 0.4s ease;
            ">
                <h3 style="color: white; font-size: 1.3rem; margin-bottom: 1rem;">${title}</h3>
                <p style="color: rgba(255, 255, 255, 0.8); font-size: 1rem; margin-bottom: 2rem; line-height: 1.6;">${message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="confirmBtn" style="
                        background: linear-gradient(45deg, #8b5cf6, #6366f1);
                        color: white;
                        padding: 0.8rem 2rem;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
                    ">
                        OK
                    </button>
                    <button id="cancelBtn" style="
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                        padding: 0.8rem 2rem;
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: bold;
                        cursor: pointer;
                    ">
                        Отмена
                    </button>
                </div>
            </div>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            </style>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('confirmBtn').addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
    });
}
