import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const searchInput = document.getElementById('globalSearch');
const searchResults = document.getElementById('searchResults');

// Список услуг для поиска
const services = [
    // GTA 5 RP
    { name: 'Отсижу деморган GTA 5 RP', category: 'GTA 5 RP', url: 'https://funpay.com/lots/offer?id=63844588' },
    { name: 'Скрипт на деморган GTA 5 RP', category: 'GTA 5 RP', url: 'https://funpay.com/lots/offer?id=63880150' },
    
    // AFK Arena
    { name: 'Гайд неукротимое пламя', category: 'AFK Arena', url: 'https://funpay.com/lots/offer?id=63876634' },
    
    // Adobe
    { name: 'Файл для дизайнеров', category: 'Adobe', url: 'https://funpay.com/lots/offer?id=63844918' },
    
    // Amazing RP
    { name: 'Аккаунт Amazing RP сервер Black', category: 'Amazing RP', url: 'https://funpay.com/lots/offer?id=64021831' },
    { name: 'Отсижу тюрьму за вас', category: 'Amazing RP', url: 'https://funpay.com/lots/offer?id=63846356' },
    
    // Black Russia
    { name: 'Аккаунт Black Russia 17 lvl', category: 'Black Russia', url: 'https://funpay.com/lots/offer?id=64021150' },
    { name: 'Отсижу за вас в тюрьме', category: 'Black Russia', url: 'https://funpay.com/lots/offer?id=63886726' },
    
    // Brawl Stars
    { name: 'Аккаунт Brawl Stars 9к кубков', category: 'Brawl Stars', url: 'https://funpay.com/lots/offer?id=63710021' },
    
    // Discord
    { name: 'Стану участником Discord канала', category: 'Discord', url: 'https://funpay.com/lots/offer?id=63845101' },
    
    // Minecraft
    { name: 'Конфиг на Nursultan Client 1.16.5', category: 'Minecraft', url: 'https://funpay.com/lots/offer?id=63845203' },
    
    // Roblox
    { name: 'Ла вакка сатурно сатурнито', category: 'Roblox', url: 'https://funpay.com/lots/offer?id=64062550' },
    { name: 'Танко черепаха', category: 'Roblox', url: 'https://funpay.com/lots/offer?id=64062278' },
    
    // Steam
    { name: 'Пополнение Steam аккаунта RUB', category: 'Steam', url: 'https://funpay.com/lots/offer?id=64343163' }
];

let searchTimeout;

searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length === 0) {
        searchResults.classList.remove('show');
        return;
    }
    
    searchTimeout = setTimeout(() => {
        performSearch(query);
    }, 300);
});

searchInput?.addEventListener('focus', () => {
    if (searchInput.value.trim().length > 0) {
        searchResults.classList.add('show');
    }
});

document.addEventListener('click', (e) => {
    if (!searchInput?.contains(e.target) && !searchResults?.contains(e.target)) {
        searchResults?.classList.remove('show');
    }
});

async function performSearch(query) {
    searchResults.innerHTML = '<div style="padding: 1rem; text-align: center; color: #b0b0b0;">⏳ Поиск...</div>';
    searchResults.classList.add('show');
    
    const users = await searchUsers(query);
    const matchedServices = searchServices(query);
    
    if (users.length === 0 && matchedServices.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">😔 Ничего не найдено</div>';
        return;
    }
    
    let html = '';
    
    // Показываем пользователей
    if (users.length > 0) {
        html += '<div class="search-category">';
        html += '<div class="search-category-title">👥 Пользователи</div>';
        users.forEach(user => {
            const avatarStyle = user.avatarUrl 
                ? `background-image: url(${user.avatarUrl}); background-size: cover; background-position: center;`
                : '';
            const avatarIcon = user.avatarUrl ? '' : '👤';
            
            html += `
                <div class="search-item" onclick="viewUserProfile('${user.id}')">
                    <div class="search-item-user">
                        <div class="search-item-avatar" style="${avatarStyle}">${avatarIcon}</div>
                        <div class="search-item-info">
                            <div class="search-item-name">${user.displayName || 'Без имени'}</div>
                            <div class="search-item-username">@${user.username}</div>
                        </div>
                        <div style="color: #b0b0b0; font-size: 0.8rem;">${user.role}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Показываем услуги
    if (matchedServices.length > 0) {
        html += '<div class="search-category">';
        html += '<div class="search-category-title">🎮 Услуги</div>';
        matchedServices.forEach(service => {
            html += `
                <div class="search-item" onclick="window.open('${service.url}', '_blank')">
                    <div class="search-item-service">
                        <div>
                            <div class="search-item-service-name">${service.name}</div>
                            <div style="font-size: 0.75rem; color: #b0b0b0; margin-top: 0.2rem;">${service.category}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    searchResults.innerHTML = html;
}

async function searchUsers(query) {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        const users = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.username && data.username.toLowerCase().includes(query)) {
                users.push({
                    id: doc.id,
                    ...data
                });
            }
        });
        
        return users.slice(0, 5); // Максимум 5 пользователей
    } catch (error) {
        console.error('Ошибка поиска пользователей:', error);
        return [];
    }
}

function searchServices(query) {
    return services.filter(service => 
        service.name.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query)
    ).slice(0, 5); // Максимум 5 услуг
}

// Функция просмотра профиля пользователя
window.viewUserProfile = function(userId) {
    searchResults.classList.remove('show');
    searchInput.value = '';
    
    // Показываем модальное окно с профилем пользователя
    showUserProfileModal(userId);
};

async function showUserProfileModal(userId) {
    try {
        const userDoc = await getDocs(collection(db, 'users'));
        let userData = null;
        
        userDoc.forEach(doc => {
            if (doc.id === userId) {
                userData = doc.data();
            }
        });
        
        if (!userData) {
            alert('Пользователь не найден');
            return;
        }
        
        // Формируем интеграции
        let integrationsHTML = '';
        const integrations = [];
        
        if (userData.steamId) {
            integrations.push({
                icon: `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10c-4.6 0-8.45-3.08-9.64-7.27l3.83 1.58a2.84 2.84 0 0 0 2.78 2.27c1.56 0 2.83-1.27 2.83-2.83v-.13l3.4-2.43h.08c2.08 0 3.77-1.69 3.77-3.77s-1.69-3.77-3.77-3.77-3.78 1.69-3.78 3.77v.05l-2.37 3.46-.16-.01c-.59 0-1.14.18-1.59.49L2 11.2C2.43 6.05 6.73 2 12 2M8.28 17.17c.8.33 1.72-.04 2.05-.84.33-.8-.05-1.71-.83-2.04l-1.28-.53c.49-.18 1.04-.19 1.56.03.53.21.94.62 1.15 1.15.22.52.22 1.1 0 1.62-.43 1.08-1.7 1.6-2.78 1.15-1.08-.43-1.6-1.7-1.15-2.78l1.28.53c-.17.41-.02.88.38 1.05.4.17.88.02 1.05-.38.17-.4.02-.88-.38-1.05-.4-.17-.88-.02-1.05.38zm6.17-7.88c0 1.39-1.13 2.52-2.52 2.52s-2.52-1.13-2.52-2.52 1.13-2.52 2.52-2.52 2.52 1.13 2.52 2.52zm-4.4 0c0 1.04.84 1.89 1.89 1.89s1.89-.85 1.89-1.89c0-1.04-.84-1.89-1.89-1.89s-1.89.85-1.89 1.89z"/></svg>`,
                name: 'Steam',
                url: `https://steamcommunity.com/profiles/${userData.steamId}`,
                value: userData.steamId
            });
        }
        if (userData.youtubeUrl) {
            integrations.push({
                icon: `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
                name: 'YouTube',
                url: userData.youtubeUrl,
                value: userData.youtubeUrl
            });
        }
        if (userData.discordTag) {
            integrations.push({
                icon: `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
                name: 'Discord',
                url: null,
                value: userData.discordTag
            });
        }
        if (userData.telegramUrl) {
            integrations.push({
                icon: `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
                name: 'Telegram',
                url: userData.telegramUrl,
                value: userData.telegramUrl
            });
        }
        
        if (integrations.length > 0) {
            integrationsHTML = '<div class="profile-integrations-view">';
            integrations.forEach(int => {
                if (int.url) {
                    integrationsHTML += `
                        <a href="${int.url}" target="_blank" class="integration-link" title="${int.name}">
                            <span class="integration-icon">${int.icon}</span>
                            <span class="integration-name">${int.name}</span>
                        </a>
                    `;
                } else {
                    integrationsHTML += `
                        <div class="integration-link" style="cursor: default;" title="${int.name}: ${int.value}">
                            <span class="integration-icon">${int.icon}</span>
                            <span class="integration-name">${int.name}</span>
                        </div>
                    `;
                }
            });
            integrationsHTML += '</div>';
        }
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        // Формируем HTML баннера
        const bannerStyle = userData.bannerUrl 
            ? `background-image: url(${userData.bannerUrl}); background-size: cover; background-position: center;`
            : 'background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);';
        
        // Формируем HTML аватара
        const avatarStyle = userData.avatarUrl
            ? `background-image: url(${userData.avatarUrl}); background-size: cover; background-position: center;`
            : 'background: linear-gradient(135deg, #2d2d2d, #404040);';
        
        const avatarIcon = userData.avatarUrl ? '' : '<span class="avatar-icon">👤</span>';
        
        modal.innerHTML = `
            <div class="modal-content profile-modal">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <div class="profile-banner" style="${bannerStyle}"></div>
                <div class="profile-header">
                    <div class="profile-avatar" style="${avatarStyle}">
                        ${avatarIcon}
                    </div>
                    <h2 class="profile-title">${userData.displayName || 'Без имени'}</h2>
                </div>
                <div class="profile-info-card">
                    <div class="info-item">
                        <span class="info-icon">📧</span>
                        <div class="info-content">
                            <span class="info-label">Email</span>
                            <span class="info-value">${userData.email || 'Не указан'}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">🆔</span>
                        <div class="info-content">
                            <span class="info-label">Username</span>
                            <span class="info-value">@${userData.username || 'Не указан'}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">⭐</span>
                        <div class="info-content">
                            <span class="info-label">Роль</span>
                            <span class="info-value role-badge">${userData.role || 'покупатель'}</span>
                        </div>
                    </div>
                    ${userData.bio ? `
                    <div class="info-item">
                        <span class="info-icon">📝</span>
                        <div class="info-content">
                            <span class="info-label">О себе</span>
                            <span class="info-value">${userData.bio}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
                ${integrationsHTML}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Закрытие по клику вне окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        alert('Ошибка загрузки профиля');
    }
}
