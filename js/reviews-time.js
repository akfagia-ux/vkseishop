// Динамическое обновление времени в отзывах

// Базовые даты для каждого отзыва (когда был оставлен отзыв)
const reviewsData = [
    {
        username: 'Sexapility',
        baseDate: new Date('2026-02-19T19:30:00'), // Вчера в 19:30
        service: 'Steam, 400 ₽'
    },
    {
        username: 'CelestieHorn',
        baseDate: new Date('2026-02-18T18:13:00'), // 18 февраля в 18:13
        service: 'Discord, 10 ₽'
    },
    {
        username: 'Darkergame',
        baseDate: new Date('2026-02-17T11:49:00'), // 17 февраля в 11:49
        service: 'Telegram, 10 ₽'
    },
    {
        username: 'xdead113',
        baseDate: new Date('2026-02-16T20:37:00'), // 16 февраля в 20:37
        service: 'Minecraft, 10 ₽'
    },
    {
        username: 'TireksShop',
        baseDate: new Date('2026-02-16T18:56:00'), // 16 февраля в 18:56
        service: 'Discord, 10 ₽'
    },
    {
        username: 'Leontev101',
        baseDate: new Date('2026-02-14T22:42:00'), // 14 февраля в 22:42
        service: 'Discord, 10 ₽'
    },
    {
        username: 'ProGamer2024',
        baseDate: new Date('2026-02-13T15:30:00'), // 13 февраля в 15:30
        service: 'Discord, 10 ₽'
    },
    {
        username: 'MegaUser777',
        baseDate: new Date('2026-02-12T14:20:00'), // 12 февраля в 14:20
        service: 'GTA 5 RP, SAMP, 100 ₽'
    },
    {
        username: 'CoolDude123',
        baseDate: new Date('2026-02-11T13:45:00'), // 11 февраля в 13:45
        service: 'Minecraft, 10 ₽'
    },
    {
        username: 'BestBuyer2026',
        baseDate: new Date('2026-02-10T18:10:00'), // 10 февраля в 18:10
        service: 'Discord, 10 ₽'
    },
    {
        username: 'FastGamer',
        baseDate: new Date('2026-02-09T16:55:00'), // 9 февраля в 16:55
        service: 'Discord, 10 ₽'
    },
    {
        username: 'HappyClient',
        baseDate: new Date('2026-02-08T15:30:00'), // 8 февраля в 15:30
        service: 'Telegram, 10 ₽'
    }
];

// Функция для форматирования времени
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    // Форматируем дату и время
    const dateStr = date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long' 
    });
    const timeStr = date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let timeAgo = '';
    
    if (diffMonths > 0) {
        timeAgo = `${diffMonths} ${getMonthWord(diffMonths)} назад`;
    } else if (diffWeeks > 0) {
        timeAgo = `${diffWeeks} ${getWeekWord(diffWeeks)} назад`;
    } else if (diffDays > 0) {
        timeAgo = `${diffDays} ${getDayWord(diffDays)} назад`;
    } else if (diffHours > 0) {
        timeAgo = `${diffHours} ${getHourWord(diffHours)} назад`;
    } else if (diffMinutes > 0) {
        timeAgo = `${diffMinutes} ${getMinuteWord(diffMinutes)} назад`;
    } else {
        timeAgo = 'только что';
    }
    
    // Возвращаем формат: "18 февраля в 18:13, 2 дня назад"
    return `${dateStr} в ${timeStr}, ${timeAgo}`;
}

// Функции для правильного склонения слов
function getHourWord(hours) {
    const lastDigit = hours % 10;
    const lastTwoDigits = hours % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'часов';
    }
    if (lastDigit === 1) {
        return 'час';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'часа';
    }
    return 'часов';
}

function getDayWord(days) {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'дней';
    }
    if (lastDigit === 1) {
        return 'день';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'дня';
    }
    return 'дней';
}

function getWeekWord(weeks) {
    const lastDigit = weeks % 10;
    const lastTwoDigits = weeks % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'недель';
    }
    if (lastDigit === 1) {
        return 'неделя';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'недели';
    }
    return 'недель';
}

function getMonthWord(months) {
    const lastDigit = months % 10;
    const lastTwoDigits = months % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'месяцев';
    }
    if (lastDigit === 1) {
        return 'месяц';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'месяца';
    }
    return 'месяцев';
}

function getMinuteWord(minutes) {
    const lastDigit = minutes % 10;
    const lastTwoDigits = minutes % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'минут';
    }
    if (lastDigit === 1) {
        return 'минута';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'минуты';
    }
    return 'минут';
}

// Функция обновления всех отзывов
function updateReviewTimes() {
    const reviewCards = document.querySelectorAll('.review-card');
    
    reviewCards.forEach((card, index) => {
        if (index >= reviewsData.length) return;
        
        const reviewData = reviewsData[index];
        const dateElement = card.querySelector('.review-date');
        
        if (dateElement) {
            dateElement.textContent = formatTimeAgo(reviewData.baseDate);
        }
    });
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateReviewTimes();
        // Обновляем каждую минуту
        setInterval(updateReviewTimes, 60000);
    });
} else {
    updateReviewTimes();
    // Обновляем каждую минуту
    setInterval(updateReviewTimes, 60000);
}
