// Оптимизация для мобильных устройств

// Определение мобильного устройства
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Определение слабого устройства
let isLowPerformance = false;

// Проверка производительности устройства
function detectPerformance() {
    // Проверяем количество ядер процессора
    const cores = navigator.hardwareConcurrency || 2;
    
    // Проверяем память (если доступно)
    const memory = navigator.deviceMemory || 4;
    
    // Проверяем connection (если доступно)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection ? connection.effectiveType : '4g';
    
    // Определяем слабое устройство
    isLowPerformance = (
        cores <= 2 || 
        memory <= 2 || 
        effectiveType === 'slow-2g' || 
        effectiveType === '2g' ||
        (isMobile && cores <= 4 && memory <= 3)
    );
    
    // Тест производительности (простой)
    const start = performance.now();
    let sum = 0;
    for (let i = 0; i < 100000; i++) {
        sum += Math.sqrt(i);
    }
    const duration = performance.now() - start;
    
    // Если тест занял больше 50ms - устройство слабое
    if (duration > 50) {
        isLowPerformance = true;
    }
    
    return isLowPerformance;
}

// Запускаем определение производительности
detectPerformance();

// Применяем режим низкой производительности
if (isLowPerformance) {
    document.documentElement.classList.add('low-performance-mode');
    console.log('Low performance mode enabled');
    
    // Отключаем некоторые тяжелые функции
    if (window.CSS && CSS.supports('backdrop-filter', 'blur(10px)')) {
        // Отключаем backdrop-filter через CSS
        const style = document.createElement('style');
        style.textContent = `
            * {
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Добавляем класс для мобильных устройств
if (isMobile || isTouch) {
    document.documentElement.classList.add('mobile-device');
}

// Оптимизация скроллинга с debounce
let ticking = false;
let lastScrollY = window.scrollY;

function optimizeScroll() {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            lastScrollY = window.scrollY;
            ticking = false;
        });
        ticking = true;
    }
}

if (isMobile || isLowPerformance) {
    window.addEventListener('scroll', optimizeScroll, { passive: true });
}

// Предотвращение двойного тапа для зума (только на определенных элементах)
if (isTouch) {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            // Разрешаем двойной тап только на изображениях и ссылках
            if (!e.target.matches('img, a')) {
                e.preventDefault();
            }
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// Оптимизация производительности модальных окон
function optimizeModal(modalElement) {
    if (!modalElement) return;
    
    // Используем will-change для оптимизации анимаций
    modalElement.style.willChange = 'transform, opacity';
    
    // Убираем will-change после анимации
    modalElement.addEventListener('transitionend', () => {
        modalElement.style.willChange = 'auto';
    }, { once: true });
}

// Применяем оптимизацию ко всем модальным окнам
document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('.modal, .modal-chat-overlay, .modal-messages-overlay');
    modals.forEach(optimizeModal);
});

// Оптимизация для виртуальной клавиатуры на мобильных
if (isMobile) {
    let originalHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight;
        
        // Клавиатура открылась
        if (currentHeight < originalHeight * 0.75) {
            document.body.classList.add('keyboard-open');
        } else {
            document.body.classList.remove('keyboard-open');
            originalHeight = currentHeight;
        }
    });
}

// Debounce функция для оптимизации событий
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle функция для оптимизации событий
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Экспортируем утилиты
window.mobileOptimization = {
    isMobile,
    isTouch,
    isLowPerformance,
    debounce,
    throttle,
    optimizeModal
};

// Оптимизация памяти - очистка неиспользуемых элементов
if (isMobile) {
    // Очищаем кэш при уходе со страницы
    window.addEventListener('pagehide', () => {
        // Очищаем все таймеры
        const highestTimeoutId = setTimeout(() => {});
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
    });
}

// Оптимизация для iOS Safari
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    // Фикс для 100vh на iOS
    const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', debounce(setVH, 100));
    
    // Предотвращаем bounce эффект
    document.body.addEventListener('touchmove', (e) => {
        if (e.target.closest('.modal-content, .modal-chat-messages, .messages-chat-body')) {
            return; // Разрешаем скролл внутри модальных окон
        }
        
        const scrollable = e.target.closest('[style*="overflow"]');
        if (!scrollable) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Оптимизация изображений - ленивая загрузка
if ('IntersectionObserver' in window && isMobile) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    // Наблюдаем за всеми изображениями с data-src
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    });
}

console.log('Mobile optimization loaded:', { isMobile, isTouch });
