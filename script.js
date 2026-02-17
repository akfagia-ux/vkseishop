// Генерация отзывов
const reviews = [
    { author: 'Darkergame', rating: 5, text: '+rep лучший' },
    { author: 'xdead113', rating: 5, text: 'мясо' },
    { author: 'TireksShop', rating: 5, text: 'быстро' },
    { author: 'Leontev101', rating: 5, text: 'Топ' },
    { author: 'selleriliss', rating: 5, text: 'top' },
    { author: 'kenesy11', rating: 5, text: 'Отличный продавец, всё быстро и качественно!' }
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
        initChat();
    };
}

if (closeBtn) {
    closeBtn.onclick = () => {
        chatModal.classList.remove('show');
        setTimeout(() => chatModal.style.display = 'none', 300);
    };
}

// Инициализация чата
let chatUnsubscribe = null;

function initChat() {
    const user = firebase.auth().currentUser;
    const chatLoginRequired = document.getElementById('chatLoginRequired');
    const chatContainer = document.getElementById('chatContainer');
    const chatLoginBtn = document.getElementById('chatLoginBtn');
    
    if (!user) {
        // Показываем сообщение о необходимости входа
        chatLoginRequired.style.display = 'flex';
        chatContainer.style.display = 'none';
        
        // Обработчик кнопки входа
        if (chatLoginBtn) {
            chatLoginBtn.onclick = () => {
                chatModal.classList.remove('show');
                setTimeout(() => chatModal.style.display = 'none', 300);
                document.getElementById('openAuthBtn').click();
            };
        }
    } else {
        // Показываем чат
        chatLoginRequired.style.display = 'none';
        chatContainer.style.display = 'flex';
        loadChatMessages();
        
        // Приветствие от бота при первом открытии
        const hasSeenWelcome = sessionStorage.getItem('chatWelcomeSeen');
        if (!hasSeenWelcome) {
            sessionStorage.setItem('chatWelcomeSeen', 'true');
        }
    }
}

// Загрузка сообщений из Firestore с реал-тайм обновлениями
function loadChatMessages() {
    const chatMessages = document.getElementById('chatMessages');
    
    // Отписываемся от предыдущего слушателя, если он есть
    if (chatUnsubscribe) {
        chatUnsubscribe();
    }
    
    // Подписываемся на обновления сообщений
    chatUnsubscribe = db.collection('chatMessages')
        .orderBy('timestamp', 'asc')
        .limit(50)
        .onSnapshot((snapshot) => {
            chatMessages.innerHTML = '';
            
            snapshot.forEach((doc) => {
                const msg = doc.data();
                addMessageToChat(msg.author, msg.text, msg.timestamp, msg.userId, msg.isBot || false);
            });
            
            // Прокручиваем вниз
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, (error) => {
            console.error('Ошибка загрузки сообщений:', error);
        });
}

// Добавление сообщения в чат
function addMessageToChat(author, text, timestamp, userId, isBot = false) {
    const chatMessages = document.getElementById('chatMessages');
    const currentUser = firebase.auth().currentUser;
    const isOwnMessage = currentUser && currentUser.uid === userId;
    
    const messageDiv = document.createElement('div');
    let messageClass = 'other-message';
    if (isBot) {
        messageClass = 'bot-message';
    } else if (isOwnMessage) {
        messageClass = 'user-message';
    }
    messageDiv.className = `chat-message ${messageClass}`;
    
    const time = new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    const authorDisplay = isBot ? '🤖 ' + escapeHtml(author) : escapeHtml(author);
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-author">${authorDisplay}</span>
            <span class="message-time">${time}</span>
        </div>
        <p class="message-text">${escapeHtml(text)}</p>
    `;
    
    chatMessages.appendChild(messageDiv);
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Бот-помощник
const botResponses = {
    'помощь': 'Доступные команды:\n/помощь - список команд\n/услуги - наши услуги\n/цены - актуальные цены\n/контакты - связь с нами\n/время - текущее время работы',
    'услуги': 'Мы предлагаем:\n🎮 Fortnite V-Bucks\n🚗 GTA 5 RP услуги\n💎 Steam аккаунты\n📜 Скрипты и боты\n\nПодробнее на главной странице!',
    'цены': '💰 Актуальные цены:\n• 1000 V-Bucks - 500₽\n• 2800 V-Bucks - 1200₽\n• 5000 V-Bucks - 2000₽\n• Деморган GTA - от 300₽',
    'контакты': '📞 Связаться с нами:\n• Telegram: @vksei7\n• Email: rilikov2000@mail.ru\n• Discord: discord.gg/5Ewjje5Tw3',
    'время': 'Мы работаем 24/7! 🕐\nОтвечаем в течение 5-30 минут.',
    'привет': 'Привет! 👋 Чем могу помочь? Напиши /помощь для списка команд.',
    'здравствуй': 'Здравствуй! 👋 Чем могу помочь? Напиши /помощь для списка команд.',
    'спасибо': 'Пожалуйста! 😊 Обращайтесь, если нужна помощь!',
    'как дела': 'Отлично! Готов помочь с заказом! 💪',
    'заказ': 'Для оформления заказа:\n1. Выберите услугу на главной странице\n2. Заполните форму\n3. Оплатите по реквизитам\n4. Отправьте чек в Telegram: @vksei7'
};

async function sendBotMessage(text) {
    try {
        await db.collection('chatMessages').add({
            userId: 'bot',
            author: 'Vkesi Bot',
            text: text,
            timestamp: Date.now(),
            isBot: true
        });
    } catch (error) {
        console.error('Ошибка отправки сообщения бота:', error);
    }
}

function getBotResponse(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    // Проверяем команды с /
    if (lowerMessage.startsWith('/')) {
        const command = lowerMessage.substring(1);
        if (botResponses[command]) {
            return botResponses[command];
        }
    }
    
    // Проверяем ключевые слова
    for (const [key, response] of Object.entries(botResponses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    // Если не нашли ответ
    if (lowerMessage.includes('?')) {
        return 'Не совсем понял вопрос 🤔\nПопробуйте команду /помощь для списка доступных команд.';
    }
    
    return null;
}

// Отправка сообщения
const chatSend = document.getElementById('chatSend');
const chatInput = document.getElementById('chatInput');

async function sendChatMessage() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Блокируем кнопку отправки
    chatSend.disabled = true;
    
    try {
        // Получаем профиль пользователя
        const profileResult = await profileManager.getProfile(user.uid);
        if (!profileResult.success) {
            chatSend.disabled = false;
            return;
        }
        
        const displayName = profileResult.profile.displayName || user.email.split('@')[0];
        
        // Сохраняем сообщение в Firestore
        await db.collection('chatMessages').add({
            userId: user.uid,
            author: displayName,
            text: message,
            timestamp: Date.now(),
            isBot: false
        });
        
        // Очищаем поле ввода
        chatInput.value = '';
        
        // Проверяем, нужен ли ответ от бота
        const botResponse = getBotResponse(message);
        if (botResponse) {
            // Задержка перед ответом бота для реалистичности
            setTimeout(() => {
                sendBotMessage(botResponse);
            }, 500 + Math.random() * 1000);
        }
        
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        alert('Ошибка отправки сообщения. Попробуйте снова.');
    } finally {
        chatSend.disabled = false;
        chatInput.focus();
    }
}

if (chatSend) {
    chatSend.addEventListener('click', sendChatMessage);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
}

// Отписываемся от слушателя при закрытии чата
if (closeBtn) {
    const originalCloseHandler = closeBtn.onclick;
    closeBtn.onclick = () => {
        if (chatUnsubscribe) {
            chatUnsubscribe();
            chatUnsubscribe = null;
        }
        if (originalCloseHandler) {
            originalCloseHandler();
        } else {
            chatModal.classList.remove('show');
            setTimeout(() => chatModal.style.display = 'none', 300);
        }
    };
}


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
        const adminPanelLink = document.getElementById('adminPanelLink');

        if (this.currentUser) {
            // Загружаем профиль пользователя
            const profileResult = await profileManager.getProfile(this.currentUser.uid);
            
            if (profileResult.success) {
                const profile = profileResult.profile;
                const displayName = profile.displayName || this.currentUser.email.split('@')[0];
                
                // Показываем ссылку на админ-панель для администраторов
                if (adminPanelLink && profile.role === 'admin') {
                    adminPanelLink.style.display = 'inline';
                } else if (adminPanelLink) {
                    adminPanelLink.style.display = 'none';
                }
                
                // Показываем аватарку в навигации
                if (userNavAvatar) {
                    const firstLetter = displayName.charAt(0).toUpperCase();
                    const avatarUrl = profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&size=40&background=random&color=fff&bold=true`;
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
                            profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&size=200&background=random&color=fff&bold=true`;
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
            // Скрываем админ-панель
            if (adminPanelLink) {
                adminPanelLink.style.display = 'none';
            }
            
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


// Админ-панель
const adminModal = document.getElementById('adminModal');
const adminPanelLink = document.getElementById('adminPanelLink');
const closeAdmin = document.querySelector('.close-admin');

// Открытие админ-панели
if (adminPanelLink) {
    adminPanelLink.onclick = (e) => {
        e.preventDefault();
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        profileManager.getProfile(user.uid).then(result => {
            if (result.success && result.profile.role === 'admin') {
                adminModal.style.display = 'block';
                setTimeout(() => adminModal.classList.add('show'), 10);
                loadAdminData();
            } else {
                alert('❌ У вас нет прав доступа к админ-панели');
            }
        });
    };
}

// Закрытие админ-панели
if (closeAdmin) {
    closeAdmin.onclick = () => {
        adminModal.classList.remove('show');
        setTimeout(() => adminModal.style.display = 'none', 300);
    };
}

// Переключение вкладок админ-панели
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`admin-tab-${tabName}`).classList.add('active');
        
        if (tabName === 'stats') {
            loadStatistics();
        }
    });
});

// Загрузка данных админ-панели
async function loadAdminData() {
    await loadUsersList();
    await loadStatistics();
}

// Загрузка списка пользователей
async function loadUsersList() {
    const usersList = document.getElementById('usersList');
    const result = await profileManager.getAllUsers();
    
    if (result.success) {
        usersList.innerHTML = '';
        
        result.users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <div class="user-card-header">
                    <img src="${user.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName.charAt(0)) + '&size=50'}" alt="Avatar" class="user-card-avatar">
                    <div class="user-card-info">
                        <h4>${user.displayName}</h4>
                        <p>${user.email}</p>
                    </div>
                </div>
                <div class="user-card-body">
                    <div class="user-card-field">
                        <label>Роль:</label>
                        <select class="role-select" data-user-id="${user.id}">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                            <option value="buyer" ${user.role === 'buyer' ? 'selected' : ''}>Покупатель</option>
                            <option value="vip" ${user.role === 'vip' ? 'selected' : ''}>VIP</option>
                            <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Модератор</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                        </select>
                    </div>
                    <div class="user-card-field">
                        <label>Дата регистрации:</label>
                        <span>${new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                </div>
            `;
            usersList.appendChild(userCard);
        });
        
        // Обработчики изменения роли
        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const userId = e.target.dataset.userId;
                const newRole = e.target.value;
                
                const result = await profileManager.updateRole(userId, newRole);
                if (result.success) {
                    alert('✅ Роль успешно обновлена!');
                    // Обновляем UI если изменили свою роль
                    const currentUser = firebase.auth().currentUser;
                    if (currentUser && currentUser.uid === userId) {
                        auth.updateUI();
                    }
                } else {
                    alert('❌ ' + result.message);
                }
            });
        });
    }
}

// Поиск пользователей
const userSearch = document.getElementById('userSearch');
if (userSearch) {
    userSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.user-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    });
}

// Загрузка статистики
async function loadStatistics() {
    const result = await profileManager.getAllUsers();
    
    if (result.success) {
        const totalUsers = result.users.length;
        const totalAdmins = result.users.filter(u => u.role === 'admin').length;
        const totalVips = result.users.filter(u => u.role === 'vip').length;
        
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalAdmins').textContent = totalAdmins;
        document.getElementById('totalVips').textContent = totalVips;
    }
    
    // Подсчет сообщений в чате
    try {
        const snapshot = await db.collection('chatMessages').get();
        document.getElementById('totalMessages').textContent = snapshot.size;
    } catch (error) {
        console.error('Ошибка подсчета сообщений:', error);
    }
}

// Очистка чата
const clearChatBtn = document.getElementById('clearChatBtn');
if (clearChatBtn) {
    clearChatBtn.addEventListener('click', async () => {
        if (!confirm('⚠️ Вы уверены, что хотите удалить ВСЕ сообщения из чата?')) return;
        if (!confirm('⚠️ ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ! Это действие необратимо!')) return;
        
        try {
            const snapshot = await db.collection('chatMessages').get();
            const batch = db.batch();
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            alert('✅ Чат очищен!');
            loadStatistics();
        } catch (error) {
            console.error('Ошибка очистки чата:', error);
            alert('❌ Ошибка очистки чата');
        }
    });
}

// Отправка сообщения от бота
const sendBotMessageBtn = document.getElementById('sendBotMessageBtn');
const botMessageInput = document.getElementById('botMessageInput');

if (sendBotMessageBtn) {
    sendBotMessageBtn.addEventListener('click', async () => {
        const message = botMessageInput.value.trim();
        if (!message) {
            alert('Введите текст сообщения');
            return;
        }
        
        try {
            await sendBotMessage(message);
            botMessageInput.value = '';
            alert('✅ Сообщение отправлено!');
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            alert('❌ Ошибка отправки сообщения');
        }
    });
}


// Управление тикетами в админ-панели
let currentTicketFilter = 'all';

// Фильтры тикетов
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTicketFilter = btn.dataset.filter;
        loadAdminTickets();
    });
});

// Загрузка тикетов для админа
async function loadAdminTickets() {
    const adminTicketsList = document.getElementById('adminTicketsList');
    if (!adminTicketsList) return;
    
    try {
        let query = db.collection('supportTickets').orderBy('createdAt', 'desc');
        
        if (currentTicketFilter === 'open') {
            query = query.where('status', '==', 'open');
        } else if (currentTicketFilter === 'closed') {
            query = query.where('status', '==', 'closed');
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            adminTicketsList.innerHTML = '<p class="no-data">Нет тикетов</p>';
            return;
        }
        
        adminTicketsList.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const ticket = doc.data();
            const ticketCard = createAdminTicketCard(doc.id, ticket);
            adminTicketsList.appendChild(ticketCard);
        });
    } catch (error) {
        console.error('Ошибка загрузки тикетов:', error);
        adminTicketsList.innerHTML = '<p class="error-message">Ошибка загрузки тикетов</p>';
    }
}

// Создание карточки тикета для админа
function createAdminTicketCard(ticketId, ticket) {
    const card = document.createElement('div');
    card.className = 'admin-ticket-card';
    
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
        <div class="admin-ticket-header">
            <div>
                <h4>${escapeHtml(ticket.subject)}</h4>
                <p class="admin-ticket-user">От: ${escapeHtml(ticket.userName)} (${escapeHtml(ticket.userEmail)})</p>
            </div>
            <span class="ticket-status ${statusClass}">${statusText}</span>
        </div>
        <div class="admin-ticket-body">
            <span class="ticket-category">${categoryNames[ticket.category]}</span>
            <span class="ticket-date">📅 ${date}</span>
            <span class="ticket-messages">💬 ${messagesCount} ответов</span>
        </div>
        <div class="admin-ticket-actions">
            <button class="btn-small admin-view-ticket-btn" data-ticket-id="${ticketId}">Открыть</button>
            ${ticket.status === 'open' ? `<button class="btn-small btn-danger admin-close-ticket-btn" data-ticket-id="${ticketId}">Закрыть</button>` : ''}
        </div>
    `;
    
    // Обработчик открытия тикета
    const viewBtn = card.querySelector('.admin-view-ticket-btn');
    viewBtn.onclick = () => openAdminTicket(ticketId);
    
    // Обработчик закрытия тикета
    const closeBtn = card.querySelector('.admin-close-ticket-btn');
    if (closeBtn) {
        closeBtn.onclick = async () => {
            if (!confirm('Закрыть этот тикет?')) return;
            
            try {
                await db.collection('supportTickets').doc(ticketId).update({
                    status: 'closed',
                    updatedAt: Date.now()
                });
                alert('✅ Тикет закрыт!');
                loadAdminTickets();
                loadStatistics();
            } catch (error) {
                console.error('Ошибка закрытия тикета:', error);
                alert('❌ Ошибка закрытия тикета');
            }
        };
    }
    
    return card;
}

// Открытие тикета в админ-панели
async function openAdminTicket(ticketId) {
    try {
        const doc = await db.collection('supportTickets').doc(ticketId).get();
        if (!doc.exists) {
            alert('Тикет не найден');
            return;
        }
        
        const ticket = doc.data();
        
        // Используем функцию из support.js если она доступна
        if (typeof showTicketView === 'function') {
            showTicketView(ticketId, ticket, true);
        } else {
            alert('Откройте страницу поддержки для просмотра тикета');
        }
    } catch (error) {
        console.error('Ошибка открытия тикета:', error);
        alert('Ошибка открытия тикета');
    }
}

// Обновляем функцию loadStatistics для подсчета тикетов
const originalLoadStatistics = loadStatistics;
loadStatistics = async function() {
    await originalLoadStatistics();
    
    // Подсчет тикетов
    try {
        const snapshot = await db.collection('supportTickets').get();
        const totalTicketsEl = document.getElementById('totalTickets');
        if (totalTicketsEl) {
            totalTicketsEl.textContent = snapshot.size;
        }
    } catch (error) {
        console.error('Ошибка подсчета тикетов:', error);
    }
};

// Загружаем тикеты при открытии вкладки
document.querySelectorAll('.admin-tab').forEach(tab => {
    const originalClick = tab.onclick;
    tab.onclick = function() {
        if (originalClick) originalClick.call(this);
        
        const tabName = this.dataset.tab;
        if (tabName === 'tickets') {
            loadAdminTickets();
        }
    };
});
