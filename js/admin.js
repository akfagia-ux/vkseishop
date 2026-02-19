import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, getDocs, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentUser = null;
let selectedUserId = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();

    if (!['модератор', 'администратор', 'владелец'].includes(userData.role)) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = { uid: user.uid, ...userData };
    loadUsers();
});

async function loadUsers() {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    usersSnapshot.forEach((doc) => {
        // Пропускаем текущего пользователя и удаленные аккаунты
        if (doc.id === currentUser.uid || doc.data().deleted) {
            return;
        }
        
        const user = doc.data();
        const row = tbody.insertRow();
        
        // Проверяем статус мута
        let statusText = 'Активен';
        if (user.banned) {
            statusText = '🚫 Заблокирован';
        } else if (user.muted && user.muteUntil && user.muteUntil.toDate() > new Date()) {
            statusText = '🔇 Замучен';
        }
        
        // Показываем количество предупреждений
        const warningsCount = user.warnings ? user.warnings.length : 0;
        const warningsBadge = warningsCount > 0 ? ` <span style="background: #f59e0b; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.8rem;">⚠️ ${warningsCount}</span>` : '';
        
        row.innerHTML = `
            <td>${user.email}</td>
            <td>${user.displayName || 'Не указано'}</td>
            <td>${user.role}${warningsBadge}</td>
            <td>${statusText}</td>
            <td><button class="btn-primary manage-btn" data-uid="${doc.id}">Управление</button></td>
        `;
    });

    document.querySelectorAll('.manage-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedUserId = e.target.dataset.uid;
            openUserModal(selectedUserId);
        });
    });
}

async function openUserModal(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    document.getElementById('modalUserEmail').textContent = userData.email;
    
    // Настройка селектора ролей
    const roleSelect = document.getElementById('roleSelect');
    roleSelect.value = userData.role;
    
    // Определяем иерархию ролей
    const roleHierarchy = {
        'покупатель': 0,
        'vip': 1,
        'hard': 2,
        'модератор': 3,
        'администратор': 4,
        'владелец': 5
    };
    
    const currentUserLevel = roleHierarchy[currentUser.role] || 0;
    const targetUserLevel = roleHierarchy[userData.role] || 0;
    
    // Скрываем роли выше текущего пользователя
    const allOptions = roleSelect.querySelectorAll('option');
    allOptions.forEach(option => {
        const optionLevel = roleHierarchy[option.value] || 0;
        
        // Модератор не может выдавать роли модератора и выше
        if (currentUser.role === 'модератор' && optionLevel >= 3) {
            option.style.display = 'none';
        }
        // Администратор не может выдавать роль владельца
        else if (currentUser.role === 'администратор' && optionLevel >= 5) {
            option.style.display = 'none';
        }
        // Владелец не может выдавать роль владельца
        else if (currentUser.role === 'владелец' && optionLevel >= 5) {
            if (userData.role === 'владелец') {
                option.style.display = 'block';
                option.disabled = true;
            } else {
                option.style.display = 'none';
            }
        }
        else {
            option.style.display = 'block';
            option.disabled = false;
        }
    });
    
    // Модератор не может банить/управлять пользователями выше его уровня
    const canManage = currentUserLevel > targetUserLevel;
    
    const banBtn = document.getElementById('banUserBtn');
    const unbanBtn = document.getElementById('unbanUserBtn');
    const banReasonGroup = document.getElementById('banReasonGroup');
    const banReasonInput = document.getElementById('banReason');
    const changeRoleBtn = document.getElementById('changeRoleBtn');
    const moderatorActions = document.getElementById('moderatorActions');

    if (!canManage) {
        // Блокируем все действия для пользователей выше по рангу
        banBtn.style.display = 'none';
        unbanBtn.style.display = 'none';
        banReasonGroup.style.display = 'none';
        moderatorActions.style.display = 'none';
        changeRoleBtn.disabled = true;
        changeRoleBtn.style.opacity = '0.5';
        changeRoleBtn.title = 'Вы не можете управлять этим пользователем';
    } else {
        moderatorActions.style.display = 'block';
        changeRoleBtn.disabled = false;
        changeRoleBtn.style.opacity = '1';
        changeRoleBtn.title = '';
        
        if (userData.banned) {
            banBtn.style.display = 'none';
            unbanBtn.style.display = 'inline-block';
            banReasonGroup.style.display = 'none';
            banReasonInput.value = '';
        } else {
            banBtn.style.display = 'inline-block';
            unbanBtn.style.display = 'none';
            banReasonGroup.style.display = 'block';
            banReasonInput.value = '';
        }

        // Проверяем мут
        const muteBtn = document.getElementById('muteUserBtn');
        const unmuteBtn = document.getElementById('unmuteUserBtn');
        
        if (userData.muted && userData.muteUntil && userData.muteUntil.toDate() > new Date()) {
            muteBtn.style.display = 'none';
            unmuteBtn.style.display = 'inline-block';
        } else {
            muteBtn.style.display = 'inline-block';
            unmuteBtn.style.display = 'none';
        }

        // Загружаем предупреждения
        loadWarnings(userData.warnings || []);
    }

    document.getElementById('userModal').style.display = 'block';
}

document.querySelector('#userModal .close').addEventListener('click', () => {
    document.getElementById('userModal').style.display = 'none';
});

document.getElementById('changeRoleBtn').addEventListener('click', async () => {
    const newRole = document.getElementById('roleSelect').value;
    const messageDiv = document.getElementById('adminMessage');
    
    // Проверяем, что не пытаются выдать роль владельца
    if (newRole === 'владелец') {
        messageDiv.textContent = '❌ Нельзя выдать роль владельца';
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        return;
    }
    
    try {
        await updateDoc(doc(db, 'users', selectedUserId), {
            role: newRole
        });
        messageDiv.textContent = '✅ Роль изменена';
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
            loadUsers();
        }, 1500);
    } catch (error) {
        console.error('Ошибка:', error);
    }
});

document.getElementById('banUserBtn').addEventListener('click', async () => {
    const messageDiv = document.getElementById('adminMessage');
    const banReason = document.getElementById('banReason').value.trim();
    
    if (!banReason) {
        messageDiv.textContent = '❌ Укажите причину бана';
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        return;
    }
    
    try {
        await updateDoc(doc(db, 'users', selectedUserId), {
            banned: true,
            banReason: banReason,
            bannedAt: new Date()
        });
        messageDiv.textContent = '✅ Пользователь заблокирован';
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        
        // Обновляем кнопки
        document.getElementById('banUserBtn').style.display = 'none';
        document.getElementById('unbanUserBtn').style.display = 'inline-block';
        document.getElementById('banReasonGroup').style.display = 'none';
        document.getElementById('banReason').value = '';
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
    }
});

document.getElementById('unbanUserBtn').addEventListener('click', async () => {
    const messageDiv = document.getElementById('adminMessage');
    
    try {
        await updateDoc(doc(db, 'users', selectedUserId), {
            banned: false,
            banReason: null,
            bannedAt: null
        });
        messageDiv.textContent = '✅ Пользователь разблокирован';
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        
        // Обновляем кнопки
        document.getElementById('banUserBtn').style.display = 'inline-block';
        document.getElementById('unbanUserBtn').style.display = 'none';
        document.getElementById('banReasonGroup').style.display = 'block';
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
    }
});

document.getElementById('applyDiscountBtn').addEventListener('click', async () => {
    const email = document.getElementById('discountEmail').value;
    const discount = parseInt(document.getElementById('discountPercent').value);

    const usersSnapshot = await getDocs(collection(db, 'users'));
    let found = false;

    for (const userDoc of usersSnapshot.docs) {
        if (userDoc.data().email === email) {
            await updateDoc(doc(db, 'users', userDoc.id), {
                discount: discount
            });
            found = true;
            break;
        }
    }

    if (found) {
        document.getElementById('discountEmail').value = '';
        document.getElementById('discountPercent').value = '';
    }
});

document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        document.getElementById('usersTab').style.display = tab === 'users' ? 'block' : 'none';
        document.getElementById('discountsTab').style.display = tab === 'discounts' ? 'block' : 'none';
    });
});

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.href = 'index.html';
});

document.getElementById('searchUser').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const email = row.cells[0].textContent.toLowerCase();
        row.style.display = email.includes(searchTerm) ? '' : 'none';
    });
});

// Загрузка предупреждений
function loadWarnings(warnings) {
    const warningsContent = document.getElementById('warningsContent');
    
    if (!warnings || warnings.length === 0) {
        warningsContent.innerHTML = '<p style="opacity: 0.7; font-size: 0.8rem; text-align: center;">Нет предупреждений</p>';
        return;
    }

    // Добавляем заголовок с общим счетчиком
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'background: rgba(251, 146, 60, 0.3); padding: 0.7rem; border-radius: 8px; margin-bottom: 0.8rem; text-align: center; font-weight: bold; border: 2px solid rgba(251, 146, 60, 0.5);';
    
    if (warnings.length >= 3) {
        headerDiv.innerHTML = `🚫 ПРЕДУПРЕЖДЕНИЙ: ${warnings.length}/3 - АВТОБАН!`;
        headerDiv.style.background = 'rgba(239, 68, 68, 0.3)';
        headerDiv.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    } else {
        headerDiv.innerHTML = `⚠️ ПРЕДУПРЕЖДЕНИЙ: ${warnings.length}/3`;
    }
    
    warningsContent.innerHTML = '';
    warningsContent.appendChild(headerDiv);

    warnings.forEach((warning, index) => {
        const warnDiv = document.createElement('div');
        warnDiv.style.cssText = 'background: rgba(255, 193, 7, 0.2); padding: 0.5rem; border-radius: 5px; margin-bottom: 0.5rem; border-left: 3px solid #ffc107; font-size: 0.8rem;';
        
        const date = warning.date.toDate().toLocaleString('ru-RU');
        warnDiv.innerHTML = `
            <strong>#${index + 1}</strong> - ${date}<br>
            <span style="opacity: 0.9;">${warning.reason}</span><br>
            <small style="opacity: 0.7;">От: ${warning.moderatorName}</small>
        `;
        
        warningsContent.appendChild(warnDiv);
    });
}

// Мут пользователя
document.getElementById('muteUserBtn').addEventListener('click', async () => {
    const messageDiv = document.getElementById('adminMessage');
    const muteHours = parseInt(document.getElementById('muteHours').value);
    const muteReason = document.getElementById('muteReason').value.trim();
    
    if (!muteHours || muteHours < 1) {
        messageDiv.textContent = '❌ Укажите количество часов';
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        return;
    }

    if (!muteReason) {
        messageDiv.textContent = '❌ Укажите причину мута';
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        return;
    }
    
    try {
        const { Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const muteUntil = new Date();
        muteUntil.setHours(muteUntil.getHours() + muteHours);
        
        await updateDoc(doc(db, 'users', selectedUserId), {
            muted: true,
            muteReason: muteReason,
            muteUntil: Timestamp.fromDate(muteUntil),
            mutedBy: currentUser.uid,
            mutedByName: currentUser.displayName
        });
        
        messageDiv.textContent = `✅ Пользователь замучен на ${muteHours} ч.`;
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        
        document.getElementById('muteUserBtn').style.display = 'none';
        document.getElementById('unmuteUserBtn').style.display = 'inline-block';
        document.getElementById('muteHours').value = '';
        document.getElementById('muteReason').value = '';
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
    }
});

// Размут пользователя
document.getElementById('unmuteUserBtn').addEventListener('click', async () => {
    const messageDiv = document.getElementById('adminMessage');
    
    try {
        await updateDoc(doc(db, 'users', selectedUserId), {
            muted: false,
            muteReason: null,
            muteUntil: null,
            mutedBy: null,
            mutedByName: null
        });
        
        messageDiv.textContent = '✅ Пользователь размучен';
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        
        document.getElementById('muteUserBtn').style.display = 'inline-block';
        document.getElementById('unmuteUserBtn').style.display = 'none';
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
    }
});

// Выдать предупреждение
document.getElementById('warnUserBtn').addEventListener('click', async () => {
    const messageDiv = document.getElementById('adminMessage');
    const warnReason = document.getElementById('warnReason').value.trim();
    
    if (!warnReason) {
        messageDiv.textContent = '❌ Укажите причину предупреждения';
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        return;
    }
    
    try {
        const { Timestamp, arrayUnion, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Получаем текущие предупреждения
        const userDoc = await getDoc(doc(db, 'users', selectedUserId));
        const userData = userDoc.data();
        const currentWarnings = userData.warnings || [];
        const newWarningsCount = currentWarnings.length + 1;
        
        // Добавляем предупреждение
        await updateDoc(doc(db, 'users', selectedUserId), {
            warnings: arrayUnion({
                reason: warnReason,
                date: Timestamp.now(),
                moderatorId: currentUser.uid,
                moderatorName: currentUser.displayName || currentUser.email
            })
        });
        
        // Создаем чат с пользователем для отправки уведомления
        const chatId = [currentUser.uid, selectedUserId].sort().join('_');
        const chatRef = doc(db, 'chats', chatId);
        
        // Проверяем существует ли чат
        const chatDoc = await getDoc(chatRef);
        if (!chatDoc.exists()) {
            // Создаем новый чат
            await setDoc(chatRef, {
                participants: [currentUser.uid, selectedUserId],
                participantsData: {
                    [currentUser.uid]: {
                        displayName: currentUser.displayName || 'Система',
                        username: currentUser.username || '',
                        role: currentUser.role,
                        avatarUrl: currentUser.avatarUrl || ''
                    },
                    [selectedUserId]: {
                        displayName: userData.displayName || 'Пользователь',
                        username: userData.username || '',
                        role: userData.role,
                        avatarUrl: userData.avatarUrl || ''
                    }
                },
                createdAt: Timestamp.now(),
                lastMessage: '',
                lastMessageTime: Timestamp.now(),
                type: 'direct'
            });
        }
        
        // Отправляем системное сообщение в чат
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        let warningMessage = `⚠️ **ПРЕДУПРЕЖДЕНИЕ ${newWarningsCount}/3**\n\n`;
        warningMessage += `📝 Причина: ${warnReason}\n`;
        warningMessage += `👮 Модератор: ${currentUser.displayName || currentUser.email}\n`;
        warningMessage += `📅 Дата: ${new Date().toLocaleString('ru-RU')}\n\n`;
        
        if (newWarningsCount >= 3) {
            warningMessage += `🚫 **ВЫ ПОЛУЧИЛИ 3 ПРЕДУПРЕЖДЕНИЯ И БУДЕТЕ ЗАБАНЕНЫ!**`;
        } else {
            warningMessage += `⚠️ При получении 3 предупреждений вы будете автоматически забанены!`;
        }
        
        await addDoc(messagesRef, {
            text: warningMessage,
            senderId: currentUser.uid,
            senderName: '🤖 Система модерации',
            timestamp: Timestamp.now(),
            isSystem: true
        });
        
        // Обновляем lastMessage в чате
        await updateDoc(chatRef, {
            lastMessage: `⚠️ Предупреждение ${newWarningsCount}/3`,
            lastMessageTime: Timestamp.now()
        });
        
        // Если 3 предупреждения - автобан
        if (newWarningsCount >= 3) {
            await updateDoc(doc(db, 'users', selectedUserId), {
                banned: true,
                banReason: `Автоматический бан за 3 предупреждения. Последнее: ${warnReason}`,
                bannedAt: Timestamp.now(),
                bannedBy: currentUser.uid
            });
            
            messageDiv.textContent = `✅ Предупреждение выдано (${newWarningsCount}/3). Пользователь автоматически забанен!`;
            messageDiv.className = 'admin-message success';
            
            // Обновляем кнопки бана
            document.getElementById('banUserBtn').style.display = 'none';
            document.getElementById('unbanUserBtn').style.display = 'inline-block';
            document.getElementById('banReasonGroup').style.display = 'none';
        } else {
            messageDiv.textContent = `✅ Предупреждение выдано (${newWarningsCount}/3). Уведомление отправлено в ЛС.`;
            messageDiv.className = 'admin-message success';
        }
        
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
        
        document.getElementById('warnReason').value = '';
        
        // Перезагружаем предупреждения
        const updatedUserDoc = await getDoc(doc(db, 'users', selectedUserId));
        loadWarnings(updatedUserDoc.data().warnings || []);
        
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
        messageDiv.textContent = '❌ Ошибка: ' + error.message;
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
});



