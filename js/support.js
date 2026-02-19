import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where, orderBy, arrayUnion, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let currentUserData = null;
let currentTicketId = null;
let currentFilter = 'all';

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    currentUserData = userDoc.data();

    // Проверяем роль пользователя
    const isStaff = ['модератор', 'администратор', 'владелец'].includes(currentUserData.role);

    document.getElementById('userTicketsSection').style.display = 'block';
    
    // Все видят все тикеты
    document.querySelector('.card-header h2').textContent = '🎫 Все тикеты';
    loadAllTickets();
    
    // Если персонал, показываем фильтры
    if (isStaff) {
        document.querySelector('.ticket-filters').style.display = 'flex';
    } else {
        document.querySelector('.ticket-filters').style.display = 'none';
    }
});

// Создание тикета
document.getElementById('createTicketBtn')?.addEventListener('click', () => {
    document.getElementById('createTicketModal').style.display = 'block';
});

document.getElementById('closeCreateTicket')?.addEventListener('click', () => {
    document.getElementById('createTicketModal').style.display = 'none';
});

document.getElementById('submitTicketBtn')?.addEventListener('click', async () => {
    const subject = document.getElementById('ticketSubject').value.trim();
    const description = document.getElementById('ticketDescription').value.trim();
    const reportedUser = document.getElementById('ticketReportedUser').value.trim();
    const reportedEmail = document.getElementById('ticketReportedEmail').value.trim();
    const messageDiv = document.getElementById('createTicketMessage');
    const submitBtn = document.getElementById('submitTicketBtn');

    if (!subject || !description) {
        messageDiv.textContent = '❌ Заполните тему и описание';
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        return;
    }

    try {
        submitBtn.innerHTML = '⏳ Отправка...';
        submitBtn.disabled = true;

        await addDoc(collection(db, 'tickets'), {
            subject: subject,
            description: description,
            reportedUser: reportedUser || null,
            reportedEmail: reportedEmail || null,
            authorId: currentUser.uid,
            authorEmail: currentUser.email,
            authorDisplayName: currentUserData.displayName,
            status: 'open',
            createdAt: Timestamp.now(),
            responses: []
        });

        messageDiv.textContent = '✅ Тикет создан! Ваша заявка будет рассмотрена в течение 48 часов.';
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';

        setTimeout(() => {
            document.getElementById('createTicketModal').style.display = 'none';
            messageDiv.style.display = 'none';
            document.getElementById('ticketSubject').value = '';
            document.getElementById('ticketDescription').value = '';
            document.getElementById('ticketReportedUser').value = '';
            document.getElementById('ticketReportedEmail').value = '';
            submitBtn.innerHTML = '✅ Отправить тикет';
            submitBtn.disabled = false;
            
            // Перезагружаем все тикеты для всех
            loadAllTickets();
        }, 1500);
    } catch (error) {
        messageDiv.textContent = '❌ Ошибка: ' + error.message;
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        submitBtn.innerHTML = '✅ Отправить тикет';
        submitBtn.disabled = false;
    }
});

// Загрузка тикетов пользователя (только свои)
async function loadUserTickets() {
    const ticketsList = document.getElementById('userTicketsList');
    ticketsList.innerHTML = '<p style="text-align: center; opacity: 0.7;">⏳ Загрузка...</p>';

    try {
        const q = query(
            collection(db, 'tickets'),
            where('authorId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            ticketsList.innerHTML = '<p style="text-align: center; opacity: 0.7;">У вас пока нет тикетов</p>';
            return;
        }

        ticketsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const ticket = doc.data();
            const ticketCard = createTicketCard(doc.id, ticket);
            ticketsList.appendChild(ticketCard);
        });
    } catch (error) {
        ticketsList.innerHTML = '<p style="text-align: center; color: #ef4444;">❌ Ошибка загрузки</p>';
        console.error('Ошибка:', error);
    }
}

// Загрузка всех тикетов (для персонала)
async function loadAllTickets() {
    const ticketsList = document.getElementById('userTicketsList');
    ticketsList.innerHTML = '<p style="text-align: center; opacity: 0.7;">⏳ Загрузка...</p>';

    try {
        const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            ticketsList.innerHTML = '<p style="text-align: center; opacity: 0.7;">Нет тикетов</p>';
            return;
        }

        ticketsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const ticket = doc.data();
            
            // Фильтрация
            if (currentFilter === 'open' && ticket.status !== 'open') return;
            if (currentFilter === 'review' && ticket.status !== 'review') return;
            if (currentFilter === 'closed' && ticket.status !== 'closed') return;

            const ticketCard = createTicketCard(doc.id, ticket);
            ticketsList.appendChild(ticketCard);
        });

        if (ticketsList.children.length === 0) {
            ticketsList.innerHTML = '<p style="text-align: center; opacity: 0.7;">Нет тикетов с таким статусом</p>';
        }
    } catch (error) {
        ticketsList.innerHTML = '<p style="text-align: center; color: #ef4444;">❌ Ошибка загрузки</p>';
        console.error('Ошибка:', error);
    }
}

// Создание карточки тикета
function createTicketCard(ticketId, ticket) {
    const card = document.createElement('div');
    card.className = 'ticket-card';
    
    let statusClass = 'status-open';
    let statusText = '🟢 Открыт';
    
    if (ticket.status === 'closed') {
        statusClass = 'status-closed';
        statusText = '🔴 Закрыт';
    } else if (ticket.status === 'review') {
        statusClass = 'status-review';
        statusText = '👁️ На рассмотрении';
    }
    
    const date = ticket.createdAt.toDate().toLocaleString('ru-RU');
    
    // Проверяем, является ли это тикет текущего пользователя
    const isMyTicket = ticket.authorId === currentUser.uid;
    const myTicketBadge = isMyTicket ? '<span style="background: #10b981; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.75rem; margin-left: 0.5rem;">Мой тикет</span>' : '';
    
    // Проверяем роль для показа кнопок управления
    const isStaff = ['модератор', 'администратор', 'владелец'].includes(currentUserData.role);
    const isOwner = currentUserData.role === 'владелец';
    
    let actionButtons = '';
    if (isStaff) {
        actionButtons = '<div class="ticket-card-actions">';
        
        // Кнопки в зависимости от статуса
        if (ticket.status === 'open') {
            actionButtons += `
                <button class="btn-card-action btn-warning" onclick="changeTicketStatus('${ticketId}', 'review')">
                    👁️ На рассмотрение
                </button>
                <button class="btn-card-action btn-danger" onclick="changeTicketStatus('${ticketId}', 'closed')">
                    🔒 Закрыть
                </button>
            `;
        } else if (ticket.status === 'review') {
            actionButtons += `
                <button class="btn-card-action btn-success" onclick="changeTicketStatus('${ticketId}', 'open')">
                    🔓 Открыть
                </button>
                <button class="btn-card-action btn-danger" onclick="changeTicketStatus('${ticketId}', 'closed')">
                    🔒 Закрыть
                </button>
            `;
        } else if (ticket.status === 'closed') {
            actionButtons += `
                <button class="btn-card-action btn-success" onclick="changeTicketStatus('${ticketId}', 'open')">
                    🔓 Открыть
                </button>
            `;
        }
        
        // Кнопка удаления только для владельца
        if (isOwner) {
            actionButtons += `
                <button class="btn-card-action btn-delete" onclick="deleteTicketFromCard('${ticketId}')">
                    🗑️ Удалить
                </button>
            `;
        }
        
        actionButtons += '</div>';
    }
    
    card.innerHTML = `
        <div class="ticket-card-header">
            <h3>${ticket.subject}</h3>
            <span class="ticket-status ${statusClass}">${statusText}</span>
        </div>
        <div class="ticket-card-body">
            <p><strong>От:</strong> ${ticket.authorDisplayName} (${ticket.authorEmail})${myTicketBadge}</p>
            <p><strong>Создан:</strong> ${date}</p>
            <p class="ticket-preview">${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}</p>
        </div>
        ${actionButtons}
        <button class="btn-primary view-ticket-btn" data-ticket-id="${ticketId}">
            👁️ Просмотреть
        </button>
    `;

    card.querySelector('.view-ticket-btn').addEventListener('click', () => {
        openTicketModal(ticketId, ticket);
    });

    return card;
}

// Открытие модального окна тикета
async function openTicketModal(ticketId, ticket) {
    currentTicketId = ticketId;
    
    document.getElementById('ticketModalTitle').textContent = `Тикет #${ticketId.substring(0, 8)}`;
    document.getElementById('ticketSubjectView').textContent = ticket.subject;
    document.getElementById('ticketAuthorView').textContent = `${ticket.authorDisplayName} (${ticket.authorEmail})`;
    document.getElementById('ticketDateView').textContent = ticket.createdAt.toDate().toLocaleString('ru-RU');
    
    let statusText = '🟢 Открыт';
    let statusClass = 'status-open';
    if (ticket.status === 'closed') {
        statusText = '🔴 Закрыт';
        statusClass = 'status-closed';
    } else if (ticket.status === 'review') {
        statusText = '👁️ На рассмотрении';
        statusClass = 'status-review';
    }
    document.getElementById('ticketStatusView').textContent = statusText;
    document.getElementById('ticketStatusViewLarge').textContent = statusText;
    document.getElementById('ticketStatusViewLarge').className = `ticket-status-large ${statusClass}`;
    
    document.getElementById('ticketDescriptionView').textContent = ticket.description;

    // Показываем информацию о жалобе если есть
    if (ticket.reportedUser || ticket.reportedEmail) {
        document.getElementById('ticketReportedBox').style.display = 'block';
        document.getElementById('ticketReportedUserView').textContent = ticket.reportedUser || 'Не указан';
        document.getElementById('ticketReportedEmailView').textContent = ticket.reportedEmail || 'Не указан';
    } else {
        document.getElementById('ticketReportedBox').style.display = 'none';
    }

    // Загружаем ответы
    loadTicketResponses(ticket.responses || []);

    // Показываем форму ответа только для персонала и если тикет открыт
    const isStaff = ['модератор', 'администратор', 'владелец'].includes(currentUserData.role);
    const replyBox = document.getElementById('ticketReplyBox');
    const statusControlSection = document.getElementById('statusControlSection');
    const deleteBtn = document.getElementById('deleteTicketBtn');
    const sendReplyBtn = document.getElementById('sendReplyBtn');
    const reviewBtn = document.getElementById('reviewTicketBtn');
    const reopenBtn = document.getElementById('reopenTicketBtn');
    const closeBtn = document.getElementById('closeTicketBtn');
    
    if (isStaff) {
        // Показываем секцию управления статусом
        statusControlSection.style.display = 'block';
        
        // Управление кнопками в зависимости от статуса
        if (ticket.status === 'open') {
            replyBox.style.display = 'block';
            reviewBtn.style.display = 'block';
            closeBtn.style.display = 'block';
            reopenBtn.style.display = 'none';
        } else if (ticket.status === 'review') {
            replyBox.style.display = 'block';
            reviewBtn.style.display = 'none';
            closeBtn.style.display = 'block';
            reopenBtn.style.display = 'block';
        } else if (ticket.status === 'closed') {
            replyBox.style.display = 'none';
            reviewBtn.style.display = 'none';
            closeBtn.style.display = 'none';
            reopenBtn.style.display = 'block';
        }
    } else {
        replyBox.style.display = 'none';
        statusControlSection.style.display = 'none';
    }

    // Показываем кнопку удаления только владельцу
    if (currentUserData.role === 'владелец') {
        deleteBtn.style.display = 'block';
    } else {
        deleteBtn.style.display = 'none';
    }

    document.getElementById('viewTicketModal').style.display = 'block';
}

// Загрузка ответов тикета
function loadTicketResponses(responses) {
    const responsesList = document.getElementById('ticketResponsesList');
    
    if (!responses || responses.length === 0) {
        responsesList.innerHTML = '<p style="opacity: 0.7; text-align: center;">Пока нет ответов</p>';
        return;
    }

    responsesList.innerHTML = '';
    responses.forEach((response) => {
        const responseDiv = document.createElement('div');
        responseDiv.className = 'ticket-response';
        
        const date = response.timestamp.toDate().toLocaleString('ru-RU');
        
        responseDiv.innerHTML = `
            <div class="response-header">
                <strong>${response.authorName}</strong>
                <span class="response-date">${date}</span>
            </div>
            <p class="response-text">${response.text}</p>
        `;
        
        responsesList.appendChild(responseDiv);
    });
}

// Отправка ответа
document.getElementById('sendReplyBtn')?.addEventListener('click', async () => {
    const replyText = document.getElementById('ticketReplyText').value.trim();
    const messageDiv = document.getElementById('viewTicketMessage');
    const sendBtn = document.getElementById('sendReplyBtn');

    if (!replyText) {
        messageDiv.textContent = '❌ Введите текст ответа';
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        return;
    }

    try {
        sendBtn.innerHTML = '⏳ Отправка...';
        sendBtn.disabled = true;

        const ticketRef = doc(db, 'tickets', currentTicketId);
        await updateDoc(ticketRef, {
            responses: arrayUnion({
                text: replyText,
                authorId: currentUser.uid,
                authorName: currentUserData.displayName,
                timestamp: Timestamp.now()
            })
        });

        messageDiv.textContent = '✅ Ответ отправлен';
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';

        document.getElementById('ticketReplyText').value = '';
        
        // Перезагружаем тикет
        const ticketDoc = await getDoc(ticketRef);
        loadTicketResponses(ticketDoc.data().responses);

        setTimeout(() => {
            messageDiv.style.display = 'none';
            sendBtn.innerHTML = '💬 Отправить ответ';
            sendBtn.disabled = false;
        }, 1500);
    } catch (error) {
        messageDiv.textContent = '❌ Ошибка: ' + error.message;
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        sendBtn.innerHTML = '💬 Отправить ответ';
        sendBtn.disabled = false;
    }
});

// Закрытие тикета
document.getElementById('closeTicketBtn')?.addEventListener('click', async () => {
    const messageDiv = document.getElementById('viewTicketMessage');
    const closeBtn = document.getElementById('closeTicketBtn');

    try {
        closeBtn.innerHTML = '⏳ Закрытие...';
        closeBtn.disabled = true;

        await updateDoc(doc(db, 'tickets', currentTicketId), {
            status: 'closed',
            closedAt: Timestamp.now(),
            closedBy: currentUser.uid
        });

        messageDiv.textContent = '✅ Тикет закрыт';
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';

        setTimeout(() => {
            document.getElementById('viewTicketModal').style.display = 'none';
            messageDiv.style.display = 'none';
            closeBtn.innerHTML = '🔒 Закрыть тикет';
            closeBtn.disabled = false;
            
            // Перезагружаем все тикеты
            loadAllTickets();
        }, 1500);
    } catch (error) {
        messageDiv.textContent = '❌ Ошибка: ' + error.message;
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        closeBtn.innerHTML = '🔒 Закрыть тикет';
        closeBtn.disabled = false;
    }
});

// Перевести тикет на рассмотрение
document.getElementById('reviewTicketBtn')?.addEventListener('click', async () => {
    const messageDiv = document.getElementById('viewTicketMessage');
    const reviewBtn = document.getElementById('reviewTicketBtn');

    try {
        reviewBtn.innerHTML = '⏳ Обработка...';
        reviewBtn.disabled = true;

        await updateDoc(doc(db, 'tickets', currentTicketId), {
            status: 'review',
            reviewedAt: Timestamp.now(),
            reviewedBy: currentUser.uid
        });

        messageDiv.textContent = '✅ Тикет переведен на рассмотрение';
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';

        setTimeout(() => {
            document.getElementById('viewTicketModal').style.display = 'none';
            messageDiv.style.display = 'none';
            reviewBtn.innerHTML = '👁️ На рассмотрение';
            reviewBtn.disabled = false;
            
            loadAllTickets();
        }, 1500);
    } catch (error) {
        messageDiv.textContent = '❌ Ошибка: ' + error.message;
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        reviewBtn.innerHTML = '👁️ На рассмотрение';
        reviewBtn.disabled = false;
    }
});

// Переоткрыть тикет
document.getElementById('reopenTicketBtn')?.addEventListener('click', async () => {
    const messageDiv = document.getElementById('viewTicketMessage');
    const reopenBtn = document.getElementById('reopenTicketBtn');

    try {
        reopenBtn.innerHTML = '⏳ Открытие...';
        reopenBtn.disabled = true;

        await updateDoc(doc(db, 'tickets', currentTicketId), {
            status: 'open',
            reopenedAt: Timestamp.now(),
            reopenedBy: currentUser.uid
        });

        messageDiv.textContent = '✅ Тикет переоткрыт';
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';

        setTimeout(() => {
            document.getElementById('viewTicketModal').style.display = 'none';
            messageDiv.style.display = 'none';
            reopenBtn.innerHTML = '🔓 Открыть тикет';
            reopenBtn.disabled = false;
            
            loadAllTickets();
        }, 1500);
    } catch (error) {
        messageDiv.textContent = '❌ Ошибка: ' + error.message;
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        reopenBtn.innerHTML = '🔓 Открыть тикет';
        reopenBtn.disabled = false;
    }
});

// Удаление тикета (только владелец)
document.getElementById('deleteTicketBtn')?.addEventListener('click', async () => {
    if (currentUserData.role !== 'владелец') {
        return;
    }

    await showConfirm(
        'Вы уверены, что хотите УДАЛИТЬ этот тикет? Это действие НЕОБРАТИМО!',
        'Подтверждение удаления'
    );

    const messageDiv = document.getElementById('viewTicketMessage');
    const deleteBtn = document.getElementById('deleteTicketBtn');

    try {
        deleteBtn.innerHTML = '⏳ Удаление...';
        deleteBtn.disabled = true;

        const { deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await deleteDoc(doc(db, 'tickets', currentTicketId));

        messageDiv.textContent = '✅ Тикет удален';
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';

        setTimeout(() => {
            document.getElementById('viewTicketModal').style.display = 'none';
            messageDiv.style.display = 'none';
            deleteBtn.innerHTML = '🗑️ Удалить тикет (только владелец)';
            deleteBtn.disabled = false;
            
            // Перезагружаем тикеты
            loadAllTickets();
        }, 1500);
    } catch (error) {
        messageDiv.textContent = '❌ Ошибка: ' + error.message;
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        deleteBtn.innerHTML = '🗑️ Удалить тикет (только владелец)';
        deleteBtn.disabled = false;
    }
});

// Кастомное окно подтверждения/сообщения
function showConfirm(message, title = 'Подтверждение действия', icon = '✅') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const iconEl = document.getElementById('confirmIcon');
        const okBtn = document.getElementById('confirmOkBtn');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        iconEl.textContent = icon;
        modal.style.display = 'block';
        
        const handleOk = () => {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', handleOk);
            resolve(true);
        };
        
        okBtn.addEventListener('click', handleOk);
        
        // Закрытие по клику вне окна
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                okBtn.removeEventListener('click', handleOk);
                window.removeEventListener('click', handleOutsideClick);
                resolve(true);
            }
        };
        window.addEventListener('click', handleOutsideClick);
    });
}

// Закрытие модальных окон
document.getElementById('closeViewTicket')?.addEventListener('click', () => {
    document.getElementById('viewTicketModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('createTicketModal')) {
        document.getElementById('createTicketModal').style.display = 'none';
    }
    if (e.target === document.getElementById('viewTicketModal')) {
        document.getElementById('viewTicketModal').style.display = 'none';
    }
});

// Фильтры для персонала
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        loadAllTickets();
    });
});

// Изменение статуса тикета из карточки
window.changeTicketStatus = async function(ticketId, newStatus) {
    try {
        await updateDoc(doc(db, 'tickets', ticketId), {
            status: newStatus,
            updatedAt: Timestamp.now(),
            updatedBy: currentUser.uid
        });
        
        // Перезагружаем тикеты
        loadAllTickets();
    } catch (error) {
        console.error('Ошибка изменения статуса:', error);
    }
};

// Удаление тикета из карточки (только владелец)
window.deleteTicketFromCard = async function(ticketId) {
    if (currentUserData.role !== 'владелец') {
        return;
    }

    await showConfirm(
        'Вы уверены, что хотите УДАЛИТЬ этот тикет? Это действие НЕОБРАТИМО!',
        'Подтверждение удаления'
    );

    try {
        const { deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await deleteDoc(doc(db, 'tickets', ticketId));
        
        // Перезагружаем тикеты
        loadAllTickets();
    } catch (error) {
        console.error('Ошибка удаления:', error);
    }
};
