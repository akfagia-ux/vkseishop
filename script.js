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
    
    if (event.target === chatModal) {
        chatModal.classList.remove('show');
        setTimeout(() => chatModal.style.display = 'none', 300);
    }
    
    if (event.target === fortniteModal) {
        fortniteModal.classList.remove('show');
        setTimeout(() => fortniteModal.style.display = 'none', 300);
    }
});

// Анимация открытия чата (дублирование удалено)


// Система регистрации/входа (localStorage)
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
        this.updateUI();
    }

    // Загрузка текущего пользователя
    loadCurrentUser() {
        const userEmail = localStorage.getItem('currentUser');
        if (userEmail) {
            this.currentUser = userEmail;
        }
    }

    // Регистрация
    register(email, password) {
        // Проверка длины пароля
        if (password.length < 6) {
            return { success: false, message: 'Пароль должен быть минимум 6 символов' };
        }

        // Проверка существования пользователя
        const users = this.getUsers();
        if (users[email]) {
            return { success: false, message: 'Пользователь с таким email уже существует' };
        }

        // Сохранение пользователя
        users[email] = {
            password: btoa(password), // Простое кодирование (не безопасно для реального использования!)
            registeredAt: new Date().toISOString()
        };
        localStorage.setItem('users', JSON.stringify(users));
        
        // Автоматический вход
        this.currentUser = email;
        localStorage.setItem('currentUser', email);
        this.updateUI();

        return { success: true, message: 'Регистрация успешна!' };
    }

    // Вход
    login(email, password) {
        const users = this.getUsers();
        const user = users[email];

        if (!user) {
            return { success: false, message: 'Пользователь не найден' };
        }

        if (atob(user.password) !== password) {
            return { success: false, message: 'Неверный пароль' };
        }

        this.currentUser = email;
        localStorage.setItem('currentUser', email);
        this.updateUI();

        return { success: true, message: 'Вход выполнен!' };
    }

    // Выход
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
    }

    // Получение всех пользователей
    getUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : {};
    }

    // Обновление UI
    updateUI() {
        const userStatus = document.getElementById('userStatus');
        const authForm = document.getElementById('authForm');
        const userProfile = document.getElementById('userProfile');
        const userEmailDisplay = document.getElementById('userEmail');

        if (this.currentUser) {
            userStatus.textContent = this.currentUser.split('@')[0];
            userStatus.classList.add('logged-in');
            if (authForm) authForm.style.display = 'none';
            if (userProfile) {
                userProfile.style.display = 'block';
                userEmailDisplay.textContent = this.currentUser;
            }
        } else {
            userStatus.textContent = 'Войти';
            userStatus.classList.remove('logged-in');
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
    authForm.onsubmit = (e) => {
        e.preventDefault();
        authError.textContent = '';
        
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        
        let result;
        if (isLoginMode) {
            result = auth.login(email, password);
        } else {
            result = auth.register(email, password);
        }
        
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
    logoutBtn.onclick = () => {
        auth.logout();
        authModal.classList.remove('show');
        setTimeout(() => authModal.style.display = 'none', 300);
    };
}

// Закрытие при клике вне окна
window.addEventListener('click', (event) => {
    if (event.target === authModal) {
        authModal.classList.remove('show');
        setTimeout(() => authModal.style.display = 'none', 300);
        authError.textContent = '';
    }
});
