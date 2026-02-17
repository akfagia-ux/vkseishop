// Генерация отзывов
const reviews = [
    { author: 'Игрок123', rating: 5, text: 'Отличная работа! Быстро отсидел деморган, рекомендую!' },
    { author: 'ProGamer', rating: 5, text: 'Купил аккаунт Steam, все отлично работает. Спасибо!' },
    { author: 'RPшник', rating: 5, text: 'Скрипт на деморган просто огонь! Экономит кучу времени.' },
    { author: 'Максим', rating: 5, text: 'Быстро, качественно, недорого. Буду обращаться еще!' },
    { author: 'Андрей_RP', rating: 5, text: 'Отсидел деморган за 2 часа, очень доволен сервисом!' },
    { author: 'Владислав', rating: 5, text: 'Профессиональный подход, всем советую!' }
];

const reviewsContainer = document.getElementById('reviewsContainer');

reviews.forEach(review => {
    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-card';
    reviewCard.innerHTML = `
        <div class="review-header">
            <span class="review-author">${review.author}</span>
            <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
        </div>
        <p class="review-text">${review.text}</p>
    `;
    reviewsContainer.appendChild(reviewCard);
});

// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Модальное окно чата
const chatModal = document.getElementById('chatModal');
const openChatBtn = document.getElementById('openChatBtn');
const closeBtn = document.querySelector('.close');

if (openChatBtn) {
    openChatBtn.onclick = (e) => {
        e.preventDefault();
        chatModal.style.display = 'block';
        setTimeout(() => chatModal.classList.add('show'), 10);
    };
}

if (closeBtn) {
    closeBtn.onclick = () => {
        chatModal.classList.remove('show');
        setTimeout(() => chatModal.style.display = 'none', 300);
    };
}

// Чат с ботом
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

// Команды бота
const botCommands = {
    '!vksei': 'Vksei - ютубер и стример. Создатель Vkesi Shop! 🎮',
    '!цена': 'Все цены указаны при нажатии на услугу. Перейди в раздел "Услуги" и выбери интересующую тебя услугу! 💰',
    '!redux': 'Redux by vksei: https://t.me/reduxx67 📱'
};

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotResponse(userMessage) {
    const message = userMessage.trim().toLowerCase();
    
    // Проверяем команды
    if (botCommands[message]) {
        return botCommands[message];
    }
    
    // Если команда не найдена
    if (message.startsWith('!')) {
        return 'Неизвестная команда. Доступные команды: !vksei, !цена, !redux';
    }
    
    // Обычное сообщение
    return 'Используй команды: !vksei, !цена, !redux для получения информации! 😊';
}

function sendMessage() {
    const message = chatInput.value.trim();
    
    if (message) {
        addMessage(message, true);
        chatInput.value = '';
        
        setTimeout(() => {
            const response = getBotResponse(message);
            addMessage(response, false);
        }, 500);
    }
}

chatSend.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});


// Модальное окно Fortnite заказа
const fortniteOrderBtn = document.querySelector('.fortnite-order-btn');
const fortniteModal = document.getElementById('fortniteModal');
const closeFortnite = document.querySelector('.close-fortnite');

if (fortniteOrderBtn) {
    fortniteOrderBtn.onclick = () => {
        fortniteModal.style.display = 'block';
        setTimeout(() => fortniteModal.classList.add('show'), 10);
    };
}

if (closeFortnite) {
    closeFortnite.onclick = () => {
        fortniteModal.classList.remove('show');
        setTimeout(() => fortniteModal.style.display = 'none', 300);
    };
}

// Обработка формы Fortnite
const fortniteForm = document.getElementById('fortniteForm');
if (fortniteForm) {
    fortniteForm.onsubmit = (e) => {
        e.preventDefault();
        
        const vbucks = document.getElementById('vbucksAmount').value;
        const login = document.getElementById('epicLogin').value;
        const agreed = document.getElementById('agreeTerms').checked;
        
        if (!vbucks || !login || !agreed) {
            alert('Пожалуйста, заполните все поля и согласитесь с условиями');
            return;
        }
        
        // Показываем загрузку
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.classList.add('show');
        
        // Закрываем форму
        const modal = document.getElementById('fortniteModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
        
        // Через 3 секунды показываем успех
        setTimeout(() => {
            loadingOverlay.classList.remove('show');
            alert('✅ Заказ принят! Ожидайте обработки. Не забудьте отправить чек оплаты в Telegram: @vksei7');
            fortniteForm.reset();
        }, 3000);
    };
}

// Закрытие модальных окон при клике вне их
window.addEventListener('click', (event) => {
    const chatModal = document.getElementById('chatModal');
    const fortniteModal = document.getElementById('fortniteModal');
    const authModal = document.getElementById('authModal');
    
    if (event.target === chatModal) {
        chatModal.classList.remove('show');
        setTimeout(() => chatModal.style.display = 'none', 300);
    }
    
    if (event.target === fortniteModal) {
        fortniteModal.classList.remove('show');
        setTimeout(() => fortniteModal.style.display = 'none', 300);
    }
    
    if (event.target === authModal) {
        authModal.classList.remove('show');
        setTimeout(() => authModal.style.display = 'none', 300);
        const authError = document.getElementById('authError');
        if (authError) authError.textContent = '';
    }
});

// Анимация открытия чата (дублирование удалено)


// Система регистрации/входа (Firebase Authentication)
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.initAuthListener();
    }

    // Слушатель изменения состояния авторизации
    initAuthListener() {
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateUI();
        });
    }

    // Регистрация
    async register(email, password) {
        try {
            // Проверка длины пароля
            if (password.length < 6) {
                return { success: false, message: 'Пароль должен быть минимум 6 символов' };
            }

            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            return { success: true, message: 'Регистрация успешна!', user: userCredential.user };
        } catch (error) {
            let message = 'Ошибка регистрации';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = 'Пользователь с таким email уже существует';
                    break;
                case 'auth/invalid-email':
                    message = 'Неверный формат email';
                    break;
                case 'auth/weak-password':
                    message = 'Слишком слабый пароль';
                    break;
                case 'auth/network-request-failed':
                    message = 'Ошибка сети. Проверьте подключение к интернету';
                    break;
                default:
                    message = error.message;
            }
            
            return { success: false, message };
        }
    }

    // Вход
    async login(email, password) {
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true, message: 'Вход выполнен!', user: userCredential.user };
        } catch (error) {
            let message = 'Ошибка входа';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'Пользователь не найден';
                    break;
                case 'auth/wrong-password':
                    message = 'Неверный пароль';
                    break;
                case 'auth/invalid-email':
                    message = 'Неверный формат email';
                    break;
                case 'auth/network-request-failed':
                    message = 'Ошибка сети. Проверьте подключение к интернету';
                    break;
                default:
                    message = error.message;
            }
            
            return { success: false, message };
        }
    }

    // Вход через Google
    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            const result = await firebase.auth().signInWithPopup(provider);
            return { success: true, message: 'Вход через Google выполнен!', user: result.user };
        } catch (error) {
            let message = 'Ошибка входа через Google';
            
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    message = 'Окно входа было закрыто';
                    break;
                case 'auth/popup-blocked':
                    message = 'Всплывающее окно заблокировано браузером';
                    break;
                case 'auth/network-request-failed':
                    message = 'Ошибка сети. Проверьте подключение к интернету';
                    break;
                case 'auth/cancelled-popup-request':
                    message = 'Запрос отменен';
                    break;
                default:
                    message = error.message;
            }
            
            return { success: false, message };
        }
    }

    // Выход
    async logout() {
        try {
            await firebase.auth().signOut();
            return { success: true, message: 'Выход выполнен' };
        } catch (error) {
            return { success: false, message: 'Ошибка выхода' };
        }
    }

    // Обновление UI
    async updateUI() {
        const userStatus = document.getElementById('userStatus');
        const userNavAvatar = document.getElementById('userNavAvatar');
        const authForm = document.getElementById('authForm');
        const userProfile = document.getElementById('userProfile');
        const userEmailDisplay = document.getElementById('userEmail');

        if (this.currentUser) {
            // Загружаем профиль пользователя
            const profileResult = await profileManager.getProfile(this.currentUser.uid);
            
            if (profileResult.success) {
                const profile = profileResult.profile;
                const displayName = profile.displayName || this.currentUser.email.split('@')[0];
                
                // Показываем аватарку в навигации
                if (userNavAvatar) {
                    const firstLetter = displayName.charAt(0).toUpperCase();
                    const avatarUrl = profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&size=40&background=cc0000&color=fff&bold=true`;
                    userNavAvatar.src = avatarUrl;
                    userNavAvatar.style.display = 'block';
                    userNavAvatar.title = displayName;
                }
                
                // Скрываем текст "Войти"
                if (userStatus) {
                    userStatus.style.display = 'none';
                }
                
                if (authForm) authForm.style.display = 'none';
                if (userProfile) {
                    userProfile.style.display = 'block';
                    
                    // Обновляем информацию в профиле
                    if (userEmailDisplay) userEmailDisplay.textContent = this.currentUser.email;
                    
                    const profileDisplayName = document.getElementById('profileDisplayName');
                    const profileRole = document.getElementById('profileRole');
                    const profileAvatar = document.getElementById('profileAvatar');
                    const displayNameInput = document.getElementById('displayNameInput');
                    const bioInput = document.getElementById('bioInput');
                    const registrationDate = document.getElementById('registrationDate');
                    
                    if (profileDisplayName) profileDisplayName.textContent = displayName;
                    if (profileRole) {
                        profileRole.textContent = profileManager.getRoleName(profile.role);
                        profileRole.className = `profile-role role-${profile.role}`;
                    }
                    if (profileAvatar) {
                        // Если аватарки нет, генерируем с первой буквой
                        if (profile.avatarUrl) {
                            profileAvatar.src = profile.avatarUrl;
                        } else {
                            const firstLetter = displayName.charAt(0).toUpperCase();
                            profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&size=200&background=cc0000&color=fff&bold=true`;
                        }
                    }
                    if (displayNameInput) displayNameInput.value = displayName;
                    if (bioInput) bioInput.value = profile.bio || '';
                    if (registrationDate && profile.createdAt) {
                        const date = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
                        registrationDate.textContent = date.toLocaleDateString('ru-RU');
                    }
                }
            }
        } else {
            // Показываем текст "Войти"
            if (userStatus) {
                userStatus.textContent = 'Войти';
                userStatus.style.display = 'inline';
                userStatus.classList.remove('logged-in');
            }
            
            // Скрываем аватарку
            if (userNavAvatar) {
                userNavAvatar.style.display = 'none';
            }
            
            if (authForm) authForm.style.display = 'block';
            if (userProfile) userProfile.style.display = 'none';
        }
    }

    // Проверка авторизации
    isLoggedIn() {
        return this.currentUser !== null;
    }
}

// Инициализация системы авторизации
const auth = new AuthSystem();

// Модальное окно авторизации
const authModal = document.getElementById('authModal');
const openAuthBtn = document.getElementById('openAuthBtn');
const closeAuth = document.querySelector('.close-auth');
const authForm = document.getElementById('authForm');
const switchAuthBtn = document.getElementById('switchAuth');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const switchText = document.getElementById('switchText');
const authError = document.getElementById('authError');
const logoutBtn = document.getElementById('logoutBtn');

let isLoginMode = true;

// Открытие модального окна
if (openAuthBtn) {
    openAuthBtn.onclick = (e) => {
        e.preventDefault();
        authModal.style.display = 'block';
        setTimeout(() => authModal.classList.add('show'), 10);
    };
}

// Закрытие модального окна
if (closeAuth) {
    closeAuth.onclick = () => {
        authModal.classList.remove('show');
        setTimeout(() => authModal.style.display = 'none', 300);
        authError.textContent = '';
    };
}

// Переключение между входом и регистрацией
if (switchAuthBtn) {
    switchAuthBtn.onclick = (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            authTitle.textContent = 'Вход';
            authSubmitBtn.textContent = 'Войти';
            switchText.textContent = 'Нет аккаунта?';
            switchAuthBtn.textContent = 'Зарегистрироваться';
        } else {
            authTitle.textContent = 'Регистрация';
            authSubmitBtn.textContent = 'Зарегистрироваться';
            switchText.textContent = 'Уже есть аккаунт?';
            switchAuthBtn.textContent = 'Войти';
        }
        authError.textContent = '';
    };
}

// Обработка формы
if (authForm) {
    authForm.onsubmit = async (e) => {
        e.preventDefault();
        authError.textContent = '';
        
        // Отключаем кнопку во время обработки
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = 'Обработка...';
        
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        
        let result;
        if (isLoginMode) {
            result = await auth.login(email, password);
        } else {
            result = await auth.register(email, password);
        }
        
        // Включаем кнопку обратно
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isLoginMode ? 'Войти' : 'Зарегистрироваться';
        
        if (result.success) {
            authForm.reset();
            authModal.classList.remove('show');
            setTimeout(() => authModal.style.display = 'none', 300);
        } else {
            authError.textContent = result.message;
        }
    };
}

// Выход
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        await auth.logout();
        authModal.classList.remove('show');
        setTimeout(() => authModal.style.display = 'none', 300);
    };
}

// Вход через Google
const googleSignInBtn = document.getElementById('googleSignInBtn');
if (googleSignInBtn) {
    googleSignInBtn.onclick = async () => {
        authError.textContent = '';
        googleSignInBtn.disabled = true;
        googleSignInBtn.textContent = 'Загрузка...';
        
        const result = await auth.loginWithGoogle();
        
        googleSignInBtn.disabled = false;
        googleSignInBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18" style="margin-right: 10px;">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Войти через Google
        `;
        
        if (result.success) {
            authModal.classList.remove('show');
            setTimeout(() => authModal.style.display = 'none', 300);
        } else {
            authError.textContent = result.message;
        }
    };
}


// Обработчики профиля
document.addEventListener('DOMContentLoaded', () => {
    // Переключение вкладок профиля
    const profileTabs = document.querySelectorAll('.profile-tab');
    profileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Убираем active у всех вкладок
            profileTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
            
            // Добавляем active к выбранной
            tab.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });

    // Сохранение никнейма
    const saveDisplayNameBtn = document.getElementById('saveDisplayNameBtn');
    if (saveDisplayNameBtn) {
        saveDisplayNameBtn.addEventListener('click', async () => {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const displayName = document.getElementById('displayNameInput').value.trim();
            if (!displayName) {
                alert('Введите никнейм');
                return;
            }

            saveDisplayNameBtn.disabled = true;
            saveDisplayNameBtn.textContent = 'Сохранение...';

            const result = await profileManager.updateDisplayName(user.uid, displayName);
            
            saveDisplayNameBtn.disabled = false;
            saveDisplayNameBtn.textContent = 'Сохранить';

            if (result.success) {
                alert('✅ Никнейм обновлен!');
                auth.updateUI();
            } else {
                alert('❌ ' + result.message);
            }
        });
    }

    // Сохранение описания
    const saveBioBtn = document.getElementById('saveBioBtn');
    if (saveBioBtn) {
        saveBioBtn.addEventListener('click', async () => {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const bio = document.getElementById('bioInput').value.trim();

            saveBioBtn.disabled = true;
            saveBioBtn.textContent = 'Сохранение...';

            const result = await profileManager.updateBio(user.uid, bio);
            
            saveBioBtn.disabled = false;
            saveBioBtn.textContent = 'Сохранить';

            if (result.success) {
                alert('✅ Описание обновлено!');
            } else {
                alert('❌ ' + result.message);
            }
        });
    }

    // Удаление аккаунта
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            const user = firebase.auth().currentUser;
            if (!user) return;

            const confirmation = confirm('⚠️ Вы уверены, что хотите удалить аккаунт? Это действие необратимо!');
            if (!confirmation) return;

            const doubleConfirmation = confirm('⚠️ ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ! Все ваши данные будут удалены навсегда. Продолжить?');
            if (!doubleConfirmation) return;

            deleteAccountBtn.disabled = true;
            deleteAccountBtn.textContent = 'Удаление...';

            const result = await profileManager.deleteAccount(user.uid);

            if (result.success) {
                alert('✅ Аккаунт удален');
                window.location.reload();
            } else {
                deleteAccountBtn.disabled = false;
                deleteAccountBtn.textContent = 'Удалить аккаунт';
                
                if (result.requiresReauth) {
                    alert('❌ Для удаления аккаунта необходимо войти заново. Пожалуйста, выйдите и войдите снова.');
                } else {
                    alert('❌ ' + result.message);
                }
            }
        });
    }
});
