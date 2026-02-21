// Система управления отзывами с Firebase

import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, limit, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Загрузка отзывов из Firebase
export async function loadReviewsFromFirebase() {
    try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(reviewsRef, orderBy('timestamp', 'desc'), limit(12));
        const snapshot = await getDocs(q);
        
        const reviews = [];
        snapshot.forEach((doc) => {
            reviews.push({ id: doc.id, ...doc.data() });
        });
        
        return reviews;
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        return [];
    }
}

// Отображение отзывов на странице
export function displayReviews(reviews) {
    const reviewsGrid = document.querySelector('.reviews-grid');
    if (!reviewsGrid) return;
    
    // Сохраняем оригинальные отзывы из HTML (если еще не сохранены)
    if (!window.originalReviewsHTML) {
        window.originalReviewsHTML = reviewsGrid.innerHTML;
    }
    
    // Очищаем только динамические отзывы
    const dynamicReviews = reviewsGrid.querySelectorAll('.review-card.dynamic');
    dynamicReviews.forEach(card => card.remove());
    
    // Добавляем новые отзывы из Firebase в начало
    const fragment = document.createDocumentFragment();
    
    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card dynamic';
        
        const timeAgo = formatTimeAgo(review.timestamp?.toDate() || new Date(review.date));
        
        reviewCard.innerHTML = `
            <div class="review-header">
                <span class="username">${escapeHtml(review.username)}</span>
                <span class="stars">⭐⭐⭐⭐⭐</span>
            </div>
            <p class="review-text">${escapeHtml(review.text)}</p>
            <p class="review-date">${timeAgo}</p>
            <p class="review-service">${escapeHtml(review.service)}</p>
        `;
        
        fragment.appendChild(reviewCard);
    });
    
    // Вставляем новые отзывы в начало
    reviewsGrid.insertBefore(fragment, reviewsGrid.firstChild);
}

// Форматирование времени
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    const dateStr = date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long' 
    });
    const timeStr = date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let timeAgo = '';
    
    if (diffDays > 0) {
        timeAgo = `${diffDays} ${getDayWord(diffDays)} назад`;
    } else if (diffHours > 0) {
        timeAgo = `${diffHours} ${getHourWord(diffHours)} назад`;
    } else if (diffMinutes > 0) {
        timeAgo = `${diffMinutes} ${getMinuteWord(diffMinutes)} назад`;
    } else {
        timeAgo = 'только что';
    }
    
    return `${dateStr} в ${timeStr}, ${timeAgo}`;
}

function getHourWord(hours) {
    const lastDigit = hours % 10;
    const lastTwoDigits = hours % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'часов';
    if (lastDigit === 1) return 'час';
    if (lastDigit >= 2 && lastDigit <= 4) return 'часа';
    return 'часов';
}

function getDayWord(days) {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'дней';
    if (lastDigit === 1) return 'день';
    if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
    return 'дней';
}

function getMinuteWord(minutes) {
    const lastDigit = minutes % 10;
    const lastTwoDigits = minutes % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'минут';
    if (lastDigit === 1) return 'минута';
    if (lastDigit >= 2 && lastDigit <= 4) return 'минуты';
    return 'минут';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Добавление отзыва в Firebase
export async function addReviewToFirebase(reviewData) {
    try {
        const reviewsRef = collection(db, 'reviews');
        await addDoc(reviewsRef, {
            username: reviewData.username,
            text: reviewData.text,
            service: reviewData.service,
            date: reviewData.date,
            timestamp: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Ошибка добавления отзыва:', error);
        return false;
    }
}

// Инициализация отзывов при загрузке страницы
export async function initReviews() {
    const reviews = await loadReviewsFromFirebase();
    
    // Показываем отзывы из Firebase (если есть)
    if (reviews.length > 0) {
        displayReviews(reviews);
    }
    // Если отзывов нет в Firebase, оставляем статичные отзывы из HTML
    
    // Обновляем время каждую минуту
    setInterval(async () => {
        const updatedReviews = await loadReviewsFromFirebase();
        if (updatedReviews.length > 0) {
            displayReviews(updatedReviews);
        }
    }, 60000);
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviews);
} else {
    initReviews();
}
