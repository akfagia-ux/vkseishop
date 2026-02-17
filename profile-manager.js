// Менеджер профилей пользователей (localStorage + ImgBB)
class ProfileManager {
    constructor() {
        // API ключ ImgBB (бесплатный)
        this.imgbbApiKey = '718bfc6d20fe6c4889b3680c1dd00e7c';
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
            
            const profileData = {
                email: email,
                displayName: email.split('@')[0],
                bio: '',
                role: 'user',
                avatarUrl: '',
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

    // Загрузка аватара через ImgBB
    async uploadAvatar(userId, file) {
        try {
            // Проверка размера файла (максимум 5MB для ImgBB)
            if (file.size > 5 * 1024 * 1024) {
                return { success: false, message: 'Файл слишком большой (максимум 5MB)' };
            }

            // Проверка типа файла
            if (!file.type.startsWith('image/')) {
                return { success: false, message: 'Можно загружать только изображения' };
            }

            // Создаем FormData для отправки
            const formData = new FormData();
            formData.append('image', file);

            // Загружаем на ImgBB
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${this.imgbbApiKey}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                const imageUrl = data.data.url;
                
                // Сохраняем URL в профиле
                const profiles = this.getProfiles();
                if (profiles[userId]) {
                    profiles[userId].avatarUrl = imageUrl;
                    profiles[userId].updatedAt = new Date().toISOString();
                    this.saveProfiles(profiles);
                }

                return { success: true, message: 'Аватар обновлен', url: imageUrl };
            } else {
                return { success: false, message: 'Ошибка загрузки на сервер' };
            }
        } catch (error) {
            console.error('Ошибка загрузки аватара:', error);
            return { success: false, message: 'Ошибка загрузки аватара' };
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
            'user': 'Пользователь',
            'admin': 'Администратор',
            'moderator': 'Модератор',
            'vip': 'VIP'
        };
        return roles[role] || 'Пользователь';
    }
}

// Создаем глобальный экземпляр
const profileManager = new ProfileManager();
