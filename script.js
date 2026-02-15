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
};

closeBtn.onclick = () => {
    chatModal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target === chatModal) {
        chatModal.style.display = 'none';
    }
    if (event.target === teamModal) {
        teamModal.style.display = 'none';
    }
    if (event.target === topBuyersModal) {
        topBuyersModal.style.display = 'none';
    }
};

// Модальное окно работников
const teamModal = document.getElementById('teamModal');
const openTeamBtn = document.getElementById('openTeamBtn');
const closeTeamBtn = document.querySelector('.close-team');

openTeamBtn.onclick = (e) => {
    e.preventDefault();
    teamModal.style.display = 'block';
};

closeTeamBtn.onclick = () => {
    teamModal.style.display = 'none';
};

// Модальное окно лучших покупателей
const topBuyersModal = document.getElementById('topBuyersModal');
const openTopBuyersBtn = document.getElementById('openTopBuyersBtn');
const closeBuyersBtn = document.querySelector('.close-buyers');

openTopBuyersBtn.onclick = (e) => {
    e.preventDefault();
    topBuyersModal.style.display = 'block';
};

closeBuyersBtn.onclick = () => {
    topBuyersModal.style.display = 'none';
};

// Чат с ботом
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

// Команды бота
const botCommands = {
    '!vksei': 'Vksei - ютубер и стример. Создатель VkseiShop! 🎮',
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
