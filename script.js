// Элементы DOM
const modal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const closeBtn = document.querySelector('.close');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const switchAuth = document.getElementById('switchAuth');
const switchText = document.getElementById('switchText');
const authError = document.getElementById('authError');
const userProfile = document.getElementById('userProfile');
const userStatus = document.getElementById('userStatus');
const logoutBtn = document.getElementById('logoutBtn');

let isLoginMode = true;

// Модальное окно
loginBtn.onclick = () => {
    modal.style.display = 'block';
};

closeBtn.onclick = () => {
    modal.style.display = 'none';
    authError.textContent = '';
};

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
        authError.textContent = '';
    }
};

// Переключение между входом и регистрацией
switchAuth.onclick = (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        authTitle.textContent = 'Вход';
        authSubmitBtn.textContent = 'Войти';
        switchText.textContent = 'Нет аккаунта?';
        switchAuth.textContent = 'Зарегистрироваться';
    } else {
        authTitle.textContent = 'Регистрация';
        authSubmitBtn.textContent = 'Зарегистрироваться';
        switchText.textContent = 'Уже есть аккаунт?';
        switchAuth.textContent = 'Войти';
    }
    authError.textContent = '';
};

// Обработка формы
authForm.onsubmit = async (e) => {
    e.preventDefault();
    authError.textContent = '';
    
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    try {
        if (isLoginMode) {
            // Вход
            await auth.signInWithEmailAndPassword(email, password);
            showSuccess('Вы успешно вошли!');
        } else {
            // Регистрация
            await auth.createUserWithEmailAndPassword(email, password);
            showSuccess('Регистрация успешна!');
        }
        
        authForm.reset();
        modal.style.display = 'none';
    } catch (error) {
        showError(error);
    }
};

// Выход
logoutBtn.onclick = async () => {
    try {
        await auth.signOut();
        modal.style.display = 'none';
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
};

// Отслеживание состояния пользователя
auth.onAuthStateChanged((user) => {
    if (user) {
        // Пользователь вошел
        userStatus.textContent = user.email;
        document.getElementById('userEmail').textContent = user.email;
        authForm.style.display = 'none';
        userProfile.style.display = 'block';
    } else {
        // Пользователь вышел
        userStatus.textContent = 'Войти';
        authForm.style.display = 'flex';
        userProfile.style.display = 'none';
    }
});

// Показать ошибку
function showError(error) {
    let message = 'Произошла ошибка';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'Этот email уже используется';
            break;
        case 'auth/invalid-email':
            message = 'Неверный формат email';
            break;
        case 'auth/weak-password':
            message = 'Пароль слишком слабый (минимум 6 символов)';
            break;
        case 'auth/user-not-found':
            message = 'Пользователь не найден';
            break;
        case 'auth/wrong-password':
            message = 'Неверный пароль';
            break;
        default:
            message = error.message;
    }
    
    authError.textContent = message;
}

// Показать успех
function showSuccess(message) {
    authError.style.color = '#4ade80';
    authError.textContent = message;
    setTimeout(() => {
        authError.textContent = '';
        authError.style.color = '#ef4444';
    }, 3000);
}

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
        if (href !== '#' && href !== '#loginBtn') {
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
