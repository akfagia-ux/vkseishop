import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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

    currentUser = { 
        uid: user.uid, 
        userData: userData,
        ...userData 
    };
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
        } else if ((user.mutedUntil && user.mutedUntil.toDate() > new Date()) || 
                   (user.muteUntil && user.muteUntil.toDate() > new Date())) {
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
        
        // Проверяем оба варианта названия поля (muted/mutedUntil и muteUntil)
        const isMuted = (userData.mutedUntil && userData.mutedUntil.toDate() > new Date()) ||
                       (userData.muteUntil && userData.muteUntil.toDate() > new Date());
        
        if (isMuted) {
            muteBtn.style.display = 'none';
            unmuteBtn.style.display = 'inline-block';
        } else {
            muteBtn.style.display = 'inline-block';
            unmuteBtn.style.display = 'none';
        }

        // Управление предупреждениями - только для владельца
        const warnGroup = document.querySelector('.warn-group');
        const warnBtn = document.getElementById('warnUserBtn');
        const removeWarnBtn = document.getElementById('removeWarnBtn');
        
        if (currentUser.role === 'владелец') {
            warnGroup.style.display = 'block';
            warnBtn.style.display = 'inline-block';
            
            // Показываем кнопку снятия предупреждения если есть предупреждения
            if (userData.warnings && userData.warnings.length > 0) {
                if (!removeWarnBtn) {
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'btn-success btn-action';
                    removeBtn.id = 'removeWarnBtn';
                    removeBtn.innerHTML = '✅ Снять последнее предупреждение';
                    removeBtn.style.marginTop = '0.5rem';
                    warnBtn.parentElement.appendChild(removeBtn);
                    
                    removeBtn.addEventListener('click', removeLastWarning);
                } else {
                    removeWarnBtn.style.display = 'inline-block';
                }
            } else if (removeWarnBtn) {
                removeWarnBtn.style.display = 'none';
            }
        } else {
            warnGroup.style.display = 'none';
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
            mutedUntil: null,  // Очищаем оба варианта поля
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

// Выдать предупреждение (только для владельца)
document.getElementById('warnUserBtn').addEventListener('click', async () => {
    // Проверка прав доступа
    if (currentUser.role !== 'владелец') {
        const messageDiv = document.getElementById('adminMessage');
        messageDiv.textContent = '❌ Только владелец может выдавать предупреждения';
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        return;
    }
    
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
    
    // Показываем индикатор загрузки
    const warnBtn = document.getElementById('warnUserBtn');
    const originalText = warnBtn.innerHTML;
    warnBtn.innerHTML = '⏳ Выдача...';
    warnBtn.disabled = true;
    
    try {
        const { Timestamp, arrayUnion, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Получаем текущие предупреждения
        const userDoc = await getDoc(doc(db, 'users', selectedUserId));
        const userData = userDoc.data();
        const currentWarnings = userData.warnings || [];
        
        // Создаем новое предупреждение
        const newWarning = {
            reason: warnReason,
            date: Timestamp.now(),
            moderatorId: currentUser.uid,
            moderatorName: currentUser.displayName || currentUser.email
        };
        
        const newWarningsCount = currentWarnings.length + 1;
        
        // МОМЕНТАЛЬНО показываем новое предупреждение в UI
        const updatedWarnings = [...currentWarnings, newWarning];
        loadWarnings(updatedWarnings);
        
        // Показываем кнопку снятия предупреждения сразу
        const removeWarnBtn = document.getElementById('removeWarnBtn');
        if (removeWarnBtn) {
            removeWarnBtn.style.display = 'inline-block';
        }
        
        // Показываем сообщение об успехе сразу
        if (newWarningsCount >= 3) {
            messageDiv.textContent = `✅ Предупреждение выдано (${newWarningsCount}/3). Пользователь будет забанен!`;
        } else {
            messageDiv.textContent = `✅ Предупреждение выдано (${newWarningsCount}/3)`;
        }
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';
        
        // Очищаем поле ввода
        document.getElementById('warnReason').value = '';
        warnBtn.innerHTML = originalText;
        warnBtn.disabled = false;
        
        // Теперь сохраняем в базу данных (в фоне)
        await updateDoc(doc(db, 'users', selectedUserId), {
            warnings: arrayUnion(newWarning)
        });
        
        // Создаем чат с пользователем для отправки уведомления (в фоне)
        sendWarningNotification(userData, warnReason, newWarningsCount);
        
        // Если 3 предупреждения - автобан
        if (newWarningsCount >= 3) {
            await updateDoc(doc(db, 'users', selectedUserId), {
                banned: true,
                banReason: `Автоматический бан за 3 предупреждения. Последнее: ${warnReason}`,
                bannedAt: Timestamp.now(),
                bannedBy: currentUser.uid
            });
            
            messageDiv.textContent = `✅ Предупреждение выдано (${newWarningsCount}/3). Пользователь автоматически забанен!`;
            
            // Обновляем кнопки бана
            document.getElementById('banUserBtn').style.display = 'none';
            document.getElementById('unbanUserBtn').style.display = 'inline-block';
            document.getElementById('banReasonGroup').style.display = 'none';
        }
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        
        loadUsers();
    } catch (error) {
        console.error('Ошибка:', error);
        messageDiv.textContent = '❌ Ошибка: ' + error.message;
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
        
        warnBtn.innerHTML = originalText;
        warnBtn.disabled = false;
        
        // Перезагружаем предупреждения из базы при ошибке
        const userDoc = await getDoc(doc(db, 'users', selectedUserId));
        loadWarnings(userDoc.data().warnings || []);
    }
});

// Отправка уведомления о предупреждении (асинхронно)
async function sendWarningNotification(userData, warnReason, newWarningsCount) {
    try {
        const { Timestamp, setDoc, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
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
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
    }
}

// Снять последнее предупреждение (только для владельца)
async function removeLastWarning() {
    // Проверка прав доступа
    if (currentUser.role !== 'владелец') {
        const messageDiv = document.getElementById('adminMessage');
        messageDiv.textContent = '❌ Только владелец может снимать предупреждения';
        messageDiv.className = 'admin-message error';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        return;
    }
    
    const messageDiv = document.getElementById('adminMessage');
    
    try {
        const userDoc = await getDoc(doc(db, 'users', selectedUserId));
        const userData = userDoc.data();
        const warnings = userData.warnings || [];
        
        if (warnings.length === 0) {
            messageDiv.textContent = '❌ Нет предупреждений для снятия';
            messageDiv.className = 'admin-message error';
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 2000);
            return;
        }
        
        // Удаляем последнее предупреждение
        warnings.pop();
        
        await updateDoc(doc(db, 'users', selectedUserId), {
            warnings: warnings
        });
        
        // Если был бан за 3 предупреждения - снимаем бан
        if (userData.banned && userData.banReason && userData.banReason.includes('Автоматический бан за 3 предупреждения')) {
            await updateDoc(doc(db, 'users', selectedUserId), {
                banned: false,
                banReason: null,
                bannedAt: null
            });
            
            messageDiv.textContent = `✅ Предупреждение снято (${warnings.length}/3). Автобан снят.`;
            
            // Обновляем кнопки бана
            document.getElementById('banUserBtn').style.display = 'inline-block';
            document.getElementById('unbanUserBtn').style.display = 'none';
            document.getElementById('banReasonGroup').style.display = 'block';
        } else {
            messageDiv.textContent = `✅ Предупреждение снято (${warnings.length}/3)`;
        }
        
        messageDiv.className = 'admin-message success';
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 2000);
        
        // Перезагружаем предупреждения
        loadWarnings(warnings);
        
        // Скрываем кнопку снятия если нет предупреждений
        if (warnings.length === 0) {
            const removeWarnBtn = document.getElementById('removeWarnBtn');
            if (removeWarnBtn) {
                removeWarnBtn.style.display = 'none';
            }
        }
        
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
}





// ============================================
// УПРАВЛЕНИЕ ОТЗЫВАМИ
// ============================================

import { showNotification, showConfirm } from './notifications.js';

// Переключение вкладок (обновленное)
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        document.getElementById('usersTab').style.display = tab === 'users' ? 'block' : 'none';
        document.getElementById('ordersTab').style.display = tab === 'orders' ? 'block' : 'none';
        document.getElementById('discountsTab').style.display = tab === 'discounts' ? 'block' : 'none';
        document.getElementById('reviewsTab').style.display = tab === 'reviews' ? 'block' : 'none';
        document.getElementById('chatTab').style.display = tab === 'chat' ? 'block' : 'none';
        
        // Загружаем заказы при открытии вкладки
        if (tab === 'orders') {
            loadOrders();
        }
        
        // Проверяем права доступа для вкладки отзывов
        if (tab === 'reviews') {
            checkReviewsAccess();
        }
    });
});

// Проверка доступа к управлению отзывами
function checkReviewsAccess() {
    const isOwner = currentUser && currentUser.role === 'владелец';
    const addReviewForm = document.querySelector('#reviewsTab .discount-form');
    const addReviewBtn = document.getElementById('addReviewBtn');
    
    if (!isOwner) {
        // Блокируем форму для не-владельцев
        if (addReviewForm) {
            const inputs = addReviewForm.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.disabled = true;
                input.placeholder = '🔒 Только для владельца';
            });
        }
        
        if (addReviewBtn) {
            addReviewBtn.disabled = true;
            addReviewBtn.style.opacity = '0.5';
            addReviewBtn.style.cursor = 'not-allowed';
            addReviewBtn.innerHTML = '🔒 Только владелец может добавлять отзывы';
        }
        
        // Показываем предупреждение
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = 'background: rgba(239, 68, 68, 0.2); padding: 1rem; border-radius: 10px; border: 2px solid rgba(239, 68, 68, 0.5); margin-bottom: 1rem; text-align: center;';
        warningDiv.innerHTML = '🔒 <strong>Только владелец может добавлять и удалять отзывы</strong>';
        
        const existingWarning = addReviewForm?.querySelector('[style*="rgba(239, 68, 68"]');
        if (!existingWarning && addReviewForm) {
            addReviewForm.insertBefore(warningDiv, addReviewForm.firstChild);
        }
    } else {
        // Разблокируем форму для владельца
        if (addReviewForm) {
            const inputs = addReviewForm.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.disabled = false;
                input.placeholder = input.id === 'reviewUsername' ? 'Например: ProGamer2024' :
                                   input.id === 'reviewText' ? 'Отличный сервис!' :
                                   'Например: Discord, 10 ₽';
            });
        }
        
        if (addReviewBtn) {
            addReviewBtn.disabled = false;
            addReviewBtn.style.opacity = '1';
            addReviewBtn.style.cursor = 'pointer';
            addReviewBtn.innerHTML = '✅ Добавить отзыв';
        }
    }
}

// Добавление нового отзыва
document.getElementById('addReviewBtn')?.addEventListener('click', async () => {
    // Проверка прав доступа
    if (!currentUser || currentUser.role !== 'владелец') {
        showNotification('Только владелец может добавлять отзывы!', 'error');
        return;
    }
    
    const username = document.getElementById('reviewUsername').value.trim();
    const text = document.getElementById('reviewText').value.trim();
    const service = document.getElementById('reviewService').value.trim();
    
    if (!username || !text || !service) {
        showNotification('Заполните все поля!', 'error');
        return;
    }
    
    try {
        const { Timestamp, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const reviewsRef = collection(db, 'reviews');
        await addDoc(reviewsRef, {
            username: username,
            text: text,
            service: service,
            date: new Date().toISOString(),
            timestamp: Timestamp.now()
        });
        
        showNotification('Отзыв успешно добавлен!', 'success');
        
        // Очищаем поля
        document.getElementById('reviewUsername').value = '';
        document.getElementById('reviewText').value = '';
        document.getElementById('reviewService').value = '';
        
        // Обновляем список
        loadReviewsList();
    } catch (error) {
        console.error('Ошибка добавления отзыва:', error);
        showNotification('Ошибка: ' + error.message, 'error');
    }
});

// Загрузка списка отзывов
async function loadReviewsList() {
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = '<p style="opacity: 0.7;">⏳ Загрузка...</p>';
    
    try {
        const { query, orderBy, limit: limitFunc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, orderBy('timestamp', 'desc'), limitFunc(20));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            reviewsList.innerHTML = '<p style="opacity: 0.7;">Нет отзывов в базе данных</p>';
            return;
        }
        
        reviewsList.innerHTML = '';
        
        // Проверяем роль текущего пользователя
        const isOwner = currentUser && currentUser.role === 'владелец';
        
        snapshot.forEach((docSnapshot) => {
            const review = docSnapshot.data();
            const reviewDiv = document.createElement('div');
            reviewDiv.style.cssText = 'background: rgba(255, 255, 255, 0.05); padding: 1rem; margin-bottom: 0.8rem; border-radius: 8px; border-left: 3px solid #10b981;';
            
            const date = review.timestamp ? review.timestamp.toDate().toLocaleString('ru-RU') : 'Неизвестно';
            
            // Кнопка удаления только для владельца
            const deleteButton = isOwner 
                ? `<button class="btn-danger" onclick="deleteReview('${docSnapshot.id}')" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">🗑️ Удалить</button>`
                : `<span style="opacity: 0.5; font-size: 0.8rem;">🔒 Только владелец</span>`;
            
            reviewDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <strong style="font-size: 1rem;">👤 ${review.username}</strong>
                    ${deleteButton}
                </div>
                <p style="margin: 0.5rem 0; opacity: 0.9;">${review.text}</p>
                <small style="opacity: 0.7;">🎮 ${review.service}</small><br>
                <small style="opacity: 0.6;">📅 ${date}</small>
            `;
            
            reviewsList.appendChild(reviewDiv);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        reviewsList.innerHTML = '<p style="color: #ef4444;">❌ Ошибка загрузки: ' + error.message + '</p>';
    }
}

// Удаление отзыва
window.deleteReview = async function(reviewId) {
    // Проверка прав доступа
    if (!currentUser || currentUser.role !== 'владелец') {
        showNotification('Только владелец может удалять отзывы!', 'error');
        return;
    }
    
    showConfirm('Вы уверены, что хотите удалить этот отзыв?', async () => {
        try {
            await deleteDoc(doc(db, 'reviews', reviewId));
            showNotification('Отзыв удален!', 'success');
            loadReviewsList();
        } catch (error) {
            console.error('Ошибка удаления отзыва:', error);
            showNotification('Ошибка: ' + error.message, 'error');
        }
    });
};

// Кнопка обновления списка отзывов
document.getElementById('loadReviewsBtn')?.addEventListener('click', loadReviewsList);


// Очистка чата из админ панели
document.getElementById('adminClearChatBtn')?.addEventListener('click', async () => {
    console.log('Кнопка очистки нажата');
    console.log('currentUser:', currentUser);
    console.log('currentUser.userData:', currentUser?.userData);
    console.log('role:', currentUser?.userData?.role);
    
    if (!currentUser || !currentUser.userData || currentUser.userData.role !== 'владелец') {
        console.log('Доступ запрещен');
        showNotification('Только владелец может очистить чат', 'error');
        return;
    }
    
    console.log('Доступ разрешен, показываем подтверждение');
    
    showConfirm(
        'Вы уверены, что хотите удалить ВСЕ сообщения из чата? Это действие нельзя отменить!',
        async () => {
            // Подтверждено - очищаем чат
            try {
                console.log('Начинаем очистку чата');
                const chatCollection = collection(db, 'chat');
                const snapshot = await getDocs(chatCollection);
                
                console.log('Найдено сообщений:', snapshot.size);
                
                const deletePromises = [];
                snapshot.forEach((docSnapshot) => {
                    deletePromises.push(deleteDoc(doc(db, 'chat', docSnapshot.id)));
                });
                
                await Promise.all(deletePromises);
                
                console.log('Чат очищен успешно');
                showNotification(`Успешно удалено ${deletePromises.length} сообщений из чата`, 'success');
                loadChatStats();
            } catch (error) {
                console.error('Ошибка при очистке чата:', error);
                showNotification('Не удалось очистить чат: ' + error.message, 'error');
            }
        },
        () => {
            // Отменено
            console.log('Очистка отменена пользователем');
            showNotification('Очистка чата отменена', 'info');
        }
    );
});

// Загрузка статистики чата
async function loadChatStats() {
    try {
        const chatCollection = collection(db, 'chat');
        const snapshot = await getDocs(chatCollection);
        
        const statsDiv = document.getElementById('chatStats');
        statsDiv.innerHTML = `
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">
                <strong>Всего сообщений:</strong> ${snapshot.size}
            </p>
            <p style="opacity: 0.7; font-size: 0.9rem;">
                Последнее обновление: ${new Date().toLocaleString('ru-RU')}
            </p>
        `;
    } catch (error) {
        console.error('Ошибка загрузки статистики чата:', error);
        document.getElementById('chatStats').innerHTML = '<p style="color: #ef4444;">Ошибка загрузки статистики</p>';
    }
}

// Загружаем статистику при открытии вкладки чата
document.querySelector('[data-tab="chat"]')?.addEventListener('click', () => {
    loadChatStats();
});


// ============================================
// УПРАВЛЕНИЕ ЗАКАЗАМИ
// ============================================

// Загрузка заказов
async function loadOrders() {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const orders = [];
        snapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        displayOrders(orders);
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ef4444;">Ошибка загрузки заказов</td></tr>';
        }
    }
}

// Отображение заказов
function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; opacity: 0.7;">Нет заказов</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        
        // Статус
        let statusBadge = '';
        let statusColor = '';
        if (order.completed) {
            statusBadge = '✅ Выполнен';
            statusColor = '#22c55e';
        } else if (order.paymentConfirmed) {
            statusBadge = '⏳ Ожидает выполнения';
            statusColor = '#f59e0b';
        } else {
            statusBadge = '❌ Ожидает оплаты';
            statusColor = '#ef4444';
        }
        
        // Дата
        const date = order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString('ru-RU') : 'Неизвестно';
        
        // Кнопки действий
        let actionsHTML = '';
        if (order.paymentConfirmed && !order.completed) {
            actionsHTML = `
                <button class="btn-action btn-success" onclick="completeOrder('${order.id}')" title="Подтвердить выполнение">
                    ✅ Выполнить
                </button>
            `;
        } else if (order.completed) {
            actionsHTML = `<span style="opacity: 0.5;">Завершен</span>`;
        } else {
            actionsHTML = `<span style="opacity: 0.5;">Ожидает оплаты</span>`;
        }
        
        // Кнопка просмотра деталей
        actionsHTML += `
            <button class="btn-action btn-info" onclick="viewOrderDetails('${order.id}')" title="Просмотр деталей" style="margin-left: 0.5rem;">
                👁️
            </button>
        `;
        
        row.innerHTML = `
            <td style="font-family: monospace; font-size: 0.85rem;">${order.id.substring(0, 8)}...</td>
            <td>${order.firstName} ${order.lastName}</td>
            <td>${order.productName}</td>
            <td style="font-weight: bold; color: #4ade80;">${order.amount}₽</td>
            <td><span style="color: ${statusColor}; font-weight: bold;">${statusBadge}</span></td>
            <td style="font-size: 0.85rem;">${date}</td>
            <td>${actionsHTML}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Подтверждение выполнения заказа
window.completeOrder = async function(orderId) {
    if (!confirm('Вы уверены, что хотите подтвердить выполнение этого заказа?\n\nПокупатель получит уведомление и сможет оставить отзыв.')) {
        return;
    }
    
    try {
        // Получаем данные заказа
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        const orderData = orderDoc.data();
        
        // Обновляем статус заказа
        await updateDoc(doc(db, 'orders', orderId), {
            completed: true,
            completedAt: serverTimestamp()
        });
        
        // Отправляем уведомление покупателю в чат
        if (orderData.chatId) {
            const messagesRef = collection(db, 'chats', orderData.chatId, 'messages');
            await addDoc(messagesRef, {
                text: `✅ Ваш заказ выполнен!\n\n📦 ${orderData.productName}\n💰 ${orderData.amount}₽\n\nСпасибо за покупку! Покупайте чаще у нас! 🎉\n\n⭐ Оставьте отзыв о покупке:\n${window.location.origin}/leave-review.html?orderId=${orderId}`,
                userId: 'system',
                displayName: 'Система',
                timestamp: serverTimestamp()
            });
            
            // Обновляем последнее сообщение в чате
            const chatDoc = await getDoc(doc(db, 'chats', orderData.chatId));
            const chatData = chatDoc.data();
            const buyerUserId = orderData.userId || 'anonymous';
            
            await updateDoc(doc(db, 'chats', orderData.chatId), {
                lastMessage: '✅ Ваш заказ выполнен!',
                lastMessageTime: serverTimestamp(),
                [`unreadCount.${buyerUserId}`]: (chatData.unreadCount?.[buyerUserId] || 0) + 1
            });
        }
        
        alert('✅ Заказ успешно выполнен!\n\nПокупатель получил уведомление.');
        loadOrders(); // Перезагружаем список заказов
    } catch (error) {
        console.error('Ошибка выполнения заказа:', error);
        alert('❌ Произошла ошибка при выполнении заказа');
    }
};

// Просмотр деталей заказа
window.viewOrderDetails = async function(orderId) {
    try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        const orderData = orderDoc.data();
        
        const date = orderData.createdAt ? new Date(orderData.createdAt.toDate()).toLocaleString('ru-RU') : 'Неизвестно';
        const paymentDate = orderData.paymentConfirmedAt ? new Date(orderData.paymentConfirmedAt.toDate()).toLocaleString('ru-RU') : 'Не подтверждена';
        const completedDate = orderData.completedAt ? new Date(orderData.completedAt.toDate()).toLocaleString('ru-RU') : 'Не выполнен';
        
        let status = '';
        if (orderData.completed) {
            status = '✅ Выполнен';
        } else if (orderData.paymentConfirmed) {
            status = '⏳ Ожидает выполнения';
        } else {
            status = '❌ Ожидает оплаты';
        }
        
        const details = `
📦 ДЕТАЛИ ЗАКАЗА

🆔 ID: ${orderId}

👤 ПОКУПАТЕЛЬ:
Имя: ${orderData.firstName} ${orderData.lastName}
Email: ${orderData.email || 'Не указан'}

📦 ТОВАР:
${orderData.productName}
Цена: ${orderData.amount}₽

📊 СТАТУС: ${status}

📅 ДАТЫ:
Создан: ${date}
Оплачен: ${paymentDate}
Выполнен: ${completedDate}

💬 Чат: ${orderData.chatId ? 'Создан' : 'Не создан'}
⭐ Отзыв: ${orderData.reviewSubmitted ? 'Оставлен' : 'Не оставлен'}
        `;
        
        alert(details);
    } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
        alert('❌ Ошибка загрузки деталей заказа');
    }
};
