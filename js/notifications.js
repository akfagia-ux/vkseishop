// Система красивых уведомлений

// Показать уведомление
export function showNotification(message, type = 'success') {
    // Удаляем предыдущее уведомление если есть
    const existing = document.querySelector('.custom-notification');
    if (existing) {
        existing.remove();
    }
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Показать модальное окно подтверждения
export function showConfirm(message, onConfirm, onCancel) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'custom-confirm-modal';
    modal.innerHTML = `
        <div class="custom-confirm-overlay"></div>
        <div class="custom-confirm-content">
            <div class="custom-confirm-icon">⚠️</div>
            <div class="custom-confirm-message">${message}</div>
            <div class="custom-confirm-buttons">
                <button class="custom-confirm-btn cancel">Отмена</button>
                <button class="custom-confirm-btn confirm">Подтвердить</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Анимация появления
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Обработчики кнопок
    const cancelBtn = modal.querySelector('.cancel');
    const confirmBtn = modal.querySelector('.confirm');
    
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    };
    
    cancelBtn.addEventListener('click', () => {
        closeModal();
        if (onCancel) onCancel();
    });
    
    confirmBtn.addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
    });
    
    // Закрытие по клику на overlay
    modal.querySelector('.custom-confirm-overlay').addEventListener('click', () => {
        closeModal();
        if (onCancel) onCancel();
    });
}

// Добавляем стили
const style = document.createElement('style');
style.textContent = `
    .custom-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        background: rgba(30, 30, 30, 0.98);
        border: 2px solid rgba(100, 100, 100, 0.3);
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .custom-notification.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .custom-notification.success {
        border-color: rgba(16, 185, 129, 0.5);
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
    }
    
    .custom-notification.error {
        border-color: rgba(239, 68, 68, 0.5);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        color: #fff;
    }
    
    .notification-icon {
        font-size: 1.5rem;
    }
    
    .notification-message {
        font-size: 1rem;
        font-weight: 500;
    }
    
    .custom-confirm-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .custom-confirm-modal.show {
        opacity: 1;
    }
    
    .custom-confirm-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
    }
    
    .custom-confirm-content {
        position: relative;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
        padding: 2rem;
        border-radius: 20px;
        max-width: 450px;
        width: 90%;
        border: 2px solid rgba(100, 100, 100, 0.3);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        text-align: center;
        transform: scale(0.9);
        transition: transform 0.3s ease;
    }
    
    .custom-confirm-modal.show .custom-confirm-content {
        transform: scale(1);
    }
    
    .custom-confirm-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    .custom-confirm-message {
        color: #fff;
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }
    
    .custom-confirm-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }
    
    .custom-confirm-btn {
        padding: 0.8rem 2rem;
        border-radius: 10px;
        border: none;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .custom-confirm-btn.cancel {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .custom-confirm-btn.cancel:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
    }
    
    .custom-confirm-btn.confirm {
        background: linear-gradient(45deg, #10b981, #059669);
        color: #fff;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }
    
    .custom-confirm-btn.confirm:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
    }
    
    @media (max-width: 768px) {
        .custom-notification {
            top: 10px;
            right: 10px;
            left: 10px;
            padding: 0.8rem 1rem;
        }
        
        .notification-icon {
            font-size: 1.2rem;
        }
        
        .notification-message {
            font-size: 0.9rem;
        }
        
        .custom-confirm-content {
            padding: 1.5rem;
        }
        
        .custom-confirm-buttons {
            flex-direction: column;
        }
        
        .custom-confirm-btn {
            width: 100%;
        }
    }
`;
document.head.appendChild(style);
