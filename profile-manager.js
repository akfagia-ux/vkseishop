// Менеджер профилей пользователей (localStorage)
class ProfileManager {
    constructor() {
        this.currentUserProfile = null;
    }

    // Получение профилей из localStorage
    getProfiles() {
        const profiles = localStorage.getItem('userProfiles');
        return profiles ? JSON.parse(profiles) : {};
    }

    // Сохранение профилей в localStorage
    saveProfiles(profiles) {
        localStorage.setItem('userProfiles', JSON.stringify(profiles));
    }

    // Создание профиля при регистрации
    async createProfile(userId, email) {
        try {
            const profiles = this.getProfiles();
            const displayName = email.split('@')[0];
            
            // Генерируем аватарку с первой буквой имени
            const firstLetter = displayName.charAt(0).toUpperCase();
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&size=200&background=random&color=fff&bold=true`;
            
            const profileData = {
                email: email,
                displayName: displayName,
                bio: '',
                role: 'buyer',
                avatarUrl: avatarUrl,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            profiles[userId] = profileData;
            this.saveProfiles(profiles);
            
            return { success: true, profile: profileData };
        } catch (error) {
            console.error('Ошибка создания профиля:', error);
            return { success: false, message: 'Ошибка создания профиля' };
        }
    }

    // Получение профиля пользователя
    async getProfile(userId) {
        try {
            const profiles = this.getProfiles();
            
            if (profiles[userId]) {
                this.currentUserProfile = { id: userId, ...profiles[userId] };
                return { success: true, profile: this.currentUserProfile };
            } else {
                // Если профиля нет, создаем его
                const user = firebase.auth().currentUser;
                if (user) {
                    return await this.createProfile(userId, user.email);
                }
                return { success: false, message: 'Профиль не найден' };
            }
        } catch (error) {
            console.error('Ошибка получения профиля:', error);
            return { success: false, message: 'Ошибка получения профиля' };
        }
    }

    // Обновление никнейма
    async updateDisplayName(userId, displayName) {
        try {
            const profiles = this.getProfiles();
            
            if (profiles[userId]) {
                profiles[userId].displayName = displayName;
                profiles[userId].updatedAt = new Date().toISOString();
                this.saveProfiles(profiles);
                return { success: true, message: 'Никнейм обновлен' };
            }
            
            return { success: false, message: 'Профиль не найден' };
        } catch (error) {
            console.error('Ошибка обновления никнейма:', error);
            return { success: false, message: 'Ошибка обновления никнейма' };
        }
    }

    // Обновление описания
    async updateBio(userId, bio) {
        try {
            const profiles = this.getProfiles();
            
            if (profiles[userId]) {
                profiles[userId].bio = bio;
                profiles[userId].updatedAt = new Date().toISOString();
                this.saveProfiles(profiles);
                return { success: true, message: 'Описание обновлено' };
            }
            
            return { success: false, message: 'Профиль не найден' };
        } catch (error) {
            console.error('Ошибка обновления описания:', error);
            return { success: false, message: 'Ошибка обновления описания' };
        }
    }

    // Удаление аккаунта
    async deleteAccount(userId) {
        try {
            // Удаление профиля из localStorage
            const profiles = this.getProfiles();
            delete profiles[userId];
            this.saveProfiles(profiles);
            
            // Удаление аккаунта из Firebase Authentication
            const user = firebase.auth().currentUser;
            if (user) {
                await user.delete();
            }

            return { success: true, message: 'Аккаунт удален' };
        } catch (error) {
            console.error('Ошибка удаления аккаунта:', error);
            
            // Если требуется повторная аутентификация
            if (error.code === 'auth/requires-recent-login') {
                return { success: false, message: 'Для удаления аккаунта необходимо войти заново', requiresReauth: true };
            }
            
            return { success: false, message: 'Ошибка удаления аккаунта' };
        }
    }

    // Обновление роли (только для администраторов)
    async updateRole(userId, role) {
        try {
            const profiles = this.getProfiles();
            
            if (profiles[userId]) {
                profiles[userId].role = role;
                profiles[userId].updatedAt = new Date().toISOString();
                this.saveProfiles(profiles);
                return { success: true, message: 'Роль обновлена' };
            }
            
            return { success: false, message: 'Профиль не найден' };
        } catch (error) {
            console.error('Ошибка обновления роли:', error);
            return { success: false, message: 'Ошибка обновления роли' };
        }
    }

    // Получение всех пользователей (для администраторов)
    async getAllUsers() {
        try {
            const profiles = this.getProfiles();
            const users = [];
            
            for (const [userId, profile] of Object.entries(profiles)) {
                users.push({ id: userId, ...profile });
            }

            return { success: true, users: users };
        } catch (error) {
            console.error('Ошибка получения пользователей:', error);
            return { success: false, message: 'Ошибка получения пользователей' };
        }
    }

    // Проверка, является ли пользователь администратором
    isAdmin() {
        return this.currentUserProfile && this.currentUserProfile.role === 'admin';
    }

    // Получение названия роли на русском
    getRoleName(role) {
        const roles = {
            'buyer': 'Покупатель',
            'user': 'Пользователь',
            'admin': 'Администратор',
            'moderator': 'Модератор',
            'vip': 'VIP'
        };
        return roles[role] || 'Покупатель';
    }
}

// Создаем глобальный экземпляр
const profileManager = new ProfileManager();
