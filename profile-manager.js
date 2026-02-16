// Менеджер профилей пользователей
class ProfileManager {
    constructor() {
        this.db = firebase.firestore();
        this.storage = firebase.storage();
        this.currentUserProfile = null;
    }

    // Создание профиля при регистрации
    async createProfile(userId, email) {
        try {
            const profileData = {
                email: email,
                displayName: email.split('@')[0],
                bio: '',
                role: 'user',
                avatarUrl: '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('users').doc(userId).set(profileData);
            return { success: true, profile: profileData };
        } catch (error) {
            console.error('Ошибка создания профиля:', error);
            return { success: false, message: 'Ошибка создания профиля' };
        }
    }

    // Получение профиля пользователя
    async getProfile(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            
            if (doc.exists) {
                this.currentUserProfile = { id: doc.id, ...doc.data() };
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
            await this.db.collection('users').doc(userId).update({
                displayName: displayName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, message: 'Никнейм обновлен' };
        } catch (error) {
            console.error('Ошибка обновления никнейма:', error);
            return { success: false, message: 'Ошибка обновления никнейма' };
        }
    }

    // Обновление описания
    async updateBio(userId, bio) {
        try {
            await this.db.collection('users').doc(userId).update({
                bio: bio,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, message: 'Описание обновлено' };
        } catch (error) {
            console.error('Ошибка обновления описания:', error);
            return { success: false, message: 'Ошибка обновления описания' };
        }
    }

    // Загрузка аватара
    async uploadAvatar(userId, file) {
        try {
            // Проверка размера файла (максимум 2MB)
            if (file.size > 2 * 1024 * 1024) {
                return { success: false, message: 'Файл слишком большой (максимум 2MB)' };
            }

            // Проверка типа файла
            if (!file.type.startsWith('image/')) {
                return { success: false, message: 'Можно загружать только изображения' };
            }

            // Загрузка в Storage
            const storageRef = this.storage.ref();
            const avatarRef = storageRef.child(`avatars/${userId}/${Date.now()}_${file.name}`);
            
            await avatarRef.put(file);
            const downloadURL = await avatarRef.getDownloadURL();

            // Обновление URL в профиле
            await this.db.collection('users').doc(userId).update({
                avatarUrl: downloadURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, message: 'Аватар обновлен', url: downloadURL };
        } catch (error) {
            console.error('Ошибка загрузки аватара:', error);
            return { success: false, message: 'Ошибка загрузки аватара' };
        }
    }

    // Удаление аккаунта
    async deleteAccount(userId) {
        try {
            // Удаление профиля из Firestore
            await this.db.collection('users').doc(userId).delete();
            
            // Удаление аккаунта из Authentication
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
            await this.db.collection('users').doc(userId).update({
                role: role,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, message: 'Роль обновлена' };
        } catch (error) {
            console.error('Ошибка обновления роли:', error);
            return { success: false, message: 'Ошибка обновления роли' };
        }
    }

    // Получение всех пользователей (для администраторов)
    async getAllUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            const users = [];
            
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });

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
