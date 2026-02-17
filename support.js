// Система поддержки с тикетами

// Проверка авторизации при загрузке страницы
firebase.auth().onAuthStateChanged((user) => {
    const supportLoginRequired = document.getElementById('supportLoginRequired');
    const supportSection = document.getElementById('supportSection');
    
    if (user) {
        if (supportLoginRequired) supportLoginRequired.style.display = 'none';
        if (supportSection) supportSection.style.display = 'block';
        loadUserTickets();
    } else {
        if (supportLoginRequired) supportLoginRequired.style.display = 'block';
        if (supportSection) supportSection.style.display = 'none';
    }
});

// Кнопка входа на странице поддержки
const supportLoginBtn = document.getElementById('supportLoginBtn');
if (supportLoginBtn) {
    supportLoginBtn.onclick = () => {
        document.getElementById('openAuthBtn').click();
    };
}

// Модальное окно создания тикета
const createTicketModal = document.getElementById('createTicketModal');
const createTicketBtn = document.getElementById('createTicketBtn');
const closeTicket = document.querySelector('.close-ticket');

if (createTicketBtn) {
    createTicketBtn.onclick = () => {
        createTicketModal.style.display = 'block';
        setTimeout(() => createTicketModal.classList.add('show'), 10);
    };
}

if (closeTicket) {
    closeTicket.onclick = () => {
        createTicketModal.classList.remove('show');
        setTimeout(() => createTicketModal.style.display = 'none', 300);
    };
}

// Счетчик символов
const ticketDescription = document.getElementById('ticketDescription');
const charCount = document.getElementById('charCount');

if (ticketDescription && charCount) {
    ticketDescription.addEventListener('input', () => {
        charCount.textContent = ticketDescription.value.length;
    });
}

// Создание тикета
const createTicketForm = document.getElementById('createTicketForm');
if (createTicketForm) {
    createTicketForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        const subject = document.getElementById('ticketSubject').value.trim();
        const category = document.getElementById('ticketCategory').value;
        const description = document.getElementById('ticketDescription').value.trim();
        
        if (!subject || !category || !description) {
            alert('Заполните все поля');
            return;
        }
        
        try {
            // Получаем профиль пользователя
            const profileResult = await profileManager.getProfile(user.uid);
            const displayName = profileResult.success ? 
                (profileResult.profile.displayName || user.email.split('@')[0]) : 
                user.email.split('@')[0];
            
            // Создаем тикет
            const ticketData = {
                userId: user.uid,
                userEmail: user.email,
                userName: displayName,
                subject: subject,
                category: category,
                description: description,
                status: 'open',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                messages: []
            };
            
            await db.collection('supportTickets').add(ticketData);
            
            alert('✅ Тикет успешно создан!');
            createTicketForm.reset();
            charCount.textContent = '0';
            createTicketModal.classList.remove('show');
            setTimeout(() => createTicketModal.style.display = 'none', 300);
            
            loadUserTickets();
        } catch (error) {
            console.error('Ошибка создания тикета:', error);
            alert('❌ Ошибка создания тикета');
        }
    };
}

// Загрузка тикетов пользователя
async function loadUserTickets() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const ticketsList = document.getElementById('ticketsList');
    const noTickets = document.getElementById('noTickets');
    
    try {
        const snapshot = await db.collection('supportTickets')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        if (snapshot.empty) {
            ticketsList.innerHTML = '';
            noTickets.style.display = 'block';
            return;
        }
        
        noTickets.style.display = 'none';
        ticketsList.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const ticket = doc.data();
            const ticketCard = createTicketCard(doc.id, ticket);
            ticketsList.appendChild(ticketCard);
        });
    } catch (error) {
        console.error('Ошибка загрузки тикетов:', error);
    }
}

// Создание карточки тикета
function createTicketCard(ticketId, ticket) {
    const card = document.createElement('div');
    card.className = 'ticket-card';
    
    const statusClass = ticket.status === 'open' ? 'status-open' : 'status-closed';
    const statusText = ticket.status === 'open' ? 'Открыт' : 'Закрыт';
    const categoryNames = {
        'order': 'Заказ',
        'payment': 'Оплата',
        'account': 'Аккаунт',
        'technical': 'Техническая проблема',
        'other': 'Другое'
    };
    
    const date = new Date(ticket.createdAt).toLocaleString('ru-RU');
    const messagesCount = ticket.messages ? ticket.messages.length : 0;
    
    card.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-title">
                <h3>${escapeHtml(ticket.subject)}</h3>
                <span class="ticket-category">${categoryNames[ticket.category]}</span>
            </div>
            <span class="ticket-status ${statusClass}">${statusText}</span>
        </div>
        <div class="ticket-body">
            <p class="ticket-description">${escapeHtml(ticket.description)}</p>
        </div>
        <div class="ticket-footer">
            <span class="ticket-date">📅 ${date}</span>
            <span class="ticket-messages">💬 ${messagesCount} ответов</span>
            <button class="btn-small view-ticket-btn" data-ticket-id="${ticketId}">Открыть</button>
        </div>
    `;
    
    // Обработчик открытия тикета
    const viewBtn = card.querySelector('.view-ticket-btn');
    viewBtn.onclick = () => openTicket(ticketId);
    
    return card;
}

// Открытие тикета для просмотра
async function openTicket(ticketId) {
    try {
        const doc = await db.collection('supportTickets').doc(ticketId).get();
        if (!doc.exists) {
            alert('Тикет не найден');
            return;
        }
        
        const ticket = doc.data();
        const user = firebase.auth().currentUser;
        const profileResult = await profileManager.getProfile(user.uid);
        const isAdmin = profileResult.success && profileResult.profile.role === 'admin';
        
        showTicketView(ticketId, ticket, isAdmin);
    } catch (error) {
        console.error('Ошибка открытия тикета:', error);
        alert('Ошибка открытия тикета');
    }
}

// Отображение просмотра тикета
function showTicketView(ticketId, ticket, isAdmin) {
    const viewTicketModal = document.getElementById('viewTicketModal');
    const ticketViewContent = document.getElementById('ticketViewContent');
    
    const statusClass = ticket.status === 'open' ? 'status-open' : 'status-closed';
    const statusText = ticket.status === 'open' ? 'Открыт' : 'Закрыт';
    const categoryNames = {
        'order': 'Заказ',
        'payment': 'Оплата',
        'account': 'Аккаунт',
        'technical': 'Техническая проблема',
        'other': 'Другое'
    };
    
    const date = new Date(ticket.createdAt).toLocaleString('ru-RU');
    
    let messagesHtml = '';
    if (ticket.messages && ticket.messages.length > 0) {
        messagesHtml = '<div class="ticket-messages-list">';
        ticket.messages.forEach(msg => {
            const msgDate = new Date(msg.timestamp).toLocaleString('ru-RU');
            const isAdminMsg = msg.isAdmin;
            messagesHtml += `
                <div class="ticket-message ${isAdminMsg ? 'admin-message' : 'user-message'}">
                    <div class="message-author">${isAdminMsg ? '👑 ' : ''}${escapeHtml(msg.author)}</div>
                    <div class="message-text">${escapeHtml(msg.text)}</div>
                    <div class="message-time">${msgDate}</div>
                </div>
            `;
        });
        messagesHtml += '</div>';
    }
    
    const canReply = ticket.status === 'open';
    
    ticketViewContent.innerHTML = `
        <div class="ticket-view-header">
            <div>
                <h2>${escapeHtml(ticket.subject)}</h2>
                <div class="ticket-view-meta">
                    <span class="ticket-category">${categoryNames[ticket.category]}</span>
                    <span class="ticket-status ${statusClass}">${statusText}</span>
                </div>
            </div>
        </div>
        <div class="ticket-view-info">
            <p><strong>От:</strong> ${escapeHtml(ticket.userName)} (${escapeHtml(ticket.userEmail)})</p>
            <p><strong>Дата:</strong> ${date}</p>
        </div>
        <div class="ticket-view-description">
            <h3>Описание проблемы:</h3>
            <p>${escapeHtml(ticket.description)}</p>
        </div>
        ${messagesHtml}
        ${canReply ? `
            <div class="ticket-reply-form">
                <h3>Ответить:</h3>
                <textarea id="replyText" placeholder="Ваш ответ..." rows="4" maxlength="1000"></textarea>
                <div class="ticket-reply-actions">
                    <button class="btn" id="sendReplyBtn">Отправить ответ</button>
                    ${isAdmin ? '<button class="btn btn-danger" id="closeTicketBtn">Закрыть тикет</button>' : ''}
                </div>
            </div>
        ` : '<p class="ticket-closed-notice">Этот тикет закрыт. Ответы больше не принимаются.</p>'}
    `;
    
    viewTicketModal.style.display = 'block';
    setTimeout(() => viewTicketModal.classList.add('show'), 10);
    
    // Обработчик отправки ответа
    const sendReplyBtn = document.getElementById('sendReplyBtn');
    if (sendReplyBtn) {
        sendReplyBtn.onclick = () => sendReply(ticketId);
    }
    
    // Обработчик закрытия тикета (только для админов)
    const closeTicketBtn = document.getElementById('closeTicketBtn');
    if (closeTicketBtn) {
        closeTicketBtn.onclick = () => closeTicket(ticketId);
    }
}

// Отправка ответа на тикет
async function sendReply(ticketId) {
    const replyText = document.getElementById('replyText');
    const text = replyText.value.trim();
    
    if (!text) {
        alert('Введите текст ответа');
        return;
    }
    
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
        const profileResult = await profileManager.getProfile(user.uid);
        const displayName = profileResult.success ? 
            (profileResult.profile.displayName || user.email.split('@')[0]) : 
            user.email.split('@')[0];
        const isAdmin = profileResult.success && profileResult.profile.role === 'admin';
        
        const message = {
            author: displayName,
            text: text,
            timestamp: Date.now(),
            isAdmin: isAdmin
        };
        
        await db.collection('supportTickets').doc(ticketId).update({
            messages: firebase.firestore.FieldValue.arrayUnion(message),
            updatedAt: Date.now()
        });
        
        alert('✅ Ответ отправлен!');
        replyText.value = '';
        
        // Перезагружаем тикет
        const doc = await db.collection('supportTickets').doc(ticketId).get();
        showTicketView(ticketId, doc.data(), isAdmin);
        loadUserTickets();
    } catch (error) {
        console.error('Ошибка отправки ответа:', error);
        alert('❌ Ошибка отправки ответа');
    }
}

// Закрытие тикета (только для админов)
async function closeTicket(ticketId) {
    if (!confirm('Вы уверены, что хотите закрыть этот тикет?')) return;
    
    try {
        await db.collection('supportTickets').doc(ticketId).update({
            status: 'closed',
            updatedAt: Date.now()
        });
        
        alert('✅ Тикет закрыт!');
        
        const viewTicketModal = document.getElementById('viewTicketModal');
        viewTicketModal.classList.remove('show');
        setTimeout(() => viewTicketModal.style.display = 'none', 300);
        
        loadUserTickets();
    } catch (error) {
        console.error('Ошибка закрытия тикета:', error);
        alert('❌ Ошибка закрытия тикета');
    }
}

// Закрытие модального окна просмотра тикета
const closeViewTicket = document.querySelector('.close-view-ticket');
if (closeViewTicket) {
    closeViewTicket.onclick = () => {
        const viewTicketModal = document.getElementById('viewTicketModal');
        viewTicketModal.classList.remove('show');
        setTimeout(() => viewTicketModal.style.display = 'none', 300);
    };
}

// Функция экранирования HTML (если еще не определена)
if (typeof escapeHtml === 'undefined') {
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
