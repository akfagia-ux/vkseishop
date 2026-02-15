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
        if (href !== '#') {
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

// Чат
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

// Автоответы бота
const botResponses = {
    'привет': 'Привет! Чем могу помочь?',
    'цена': 'Цены на все услуги указаны на FunPay. Нажми на интересующую услугу выше!',
    'деморган': 'Отсижу деморган на любом сервере GTA 5 RP. Быстро и качественно!',
    'аккаунт': 'Продаю свой Steam аккаунт. Все подробности по ссылке выше!',
    'скрипт': 'Скрипт на автоматическое отсиживание деморгана. Очень удобно!',
    'помощь': 'Я могу рассказать о наших услугах: деморган, аккаунты Steam, скрипты. Что тебя интересует?',
    'спасибо': 'Пожалуйста! Обращайся если будут вопросы! 😊',
    'default': 'Спасибо за сообщение! Для заказа услуг перейди по ссылкам выше или напиши мне в соцсетях!'
};

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    for (let key in botResponses) {
        if (message.includes(key)) {
            return botResponses[key];
        }
    }
    
    return botResponses['default'];
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
