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

openChatBtn.onclick = (e) => {
    e.preventDefault();
    chatModal.style.display = 'block';
    chatModal.classList.add('show');
    setTimeout(() => {
        chatModal.classList.remove('show');
    }, 400);
};

closeBtn.onclick = () => {
    chatModal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target === chatModal) {
        chatModal.style.display = 'none';
    }
};

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


// Анимация при скролле
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Наблюдаем за секциями
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.services, .reviews, .team');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(section);
    });
});


// Анимация оформления заказа
function showOrderAnimation(serviceName, redirectUrl) {
    // Создаем оверлей если его нет
    let overlay = document.getElementById('orderOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'orderOverlay';
        overlay.className = 'order-overlay';
        overlay.innerHTML = `
            <div class="order-content">
                <h2>Оформление заказа</h2>
                <div class="order-spinner"></div>
                <div class="order-checkmark">
                    <svg viewBox="0 0 52 52">
                        <circle class="checkmark-circle" cx="26" cy="26" r="25"/>
                        <path class="checkmark-check" d="M14 27l7 7 16-16"/>
                    </svg>
                </div>
                <p class="order-message">Подготовка заказа...</p>
                <p class="order-redirect"></p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    const spinner = overlay.querySelector('.order-spinner');
    const checkmark = overlay.querySelector('.order-checkmark');
    const message = overlay.querySelector('.order-message');
    const redirect = overlay.querySelector('.order-redirect');
    
    // Показываем оверлей
    overlay.classList.add('show');
    spinner.style.display = 'block';
    checkmark.classList.remove('show');
    message.textContent = 'Подготовка заказа...';
    redirect.textContent = '';
    
    // Через 1.5 секунды показываем галочку
    setTimeout(() => {
        spinner.style.display = 'none';
        checkmark.classList.add('show');
        message.textContent = 'Заказ оформлен!';
        redirect.textContent = 'Перенаправление на страницу оплаты...';
        
        // Через 1 секунду перенаправляем
        setTimeout(() => {
            window.open(redirectUrl, '_blank');
            overlay.classList.remove('show');
        }, 1000);
    }, 1500);
}

// Добавляем обработчики на кнопки услуг
document.addEventListener('DOMContentLoaded', () => {
    const serviceButtons = document.querySelectorAll('.service-card .btn');
    
    serviceButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const url = button.getAttribute('href');
            const serviceName = button.closest('.service-card').querySelector('h3').textContent;
            showOrderAnimation(serviceName, url);
        });
    });
});
