// Создание плавающей кнопки сообщений
function initFloatingMessagesBtn() {
    const btn = document.createElement('button');
    btn.className = 'floating-messages-btn';
    btn.innerHTML = '💬';
    btn.title = 'Сообщения';
    btn.id = 'floatingMessagesBtn';
    
    btn.addEventListener('click', () => {
        const modal = document.getElementById('modalMessagesOverlay');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
    
    document.body.appendChild(btn);
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingMessagesBtn);
} else {
    initFloatingMessagesBtn();
}
