import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const modal = document.getElementById('authModal');
const authBtn = document.getElementById('authBtn');
const closeBtn = document.getElementById('closeAuthModal');
const tabBtns = document.querySelectorAll('.tab-btn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Открытие модального окна
if (authBtn) {
    authBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
    });
}

// Закрытие модального окна
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Переключение вкладок
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (btn.dataset.tab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    });
});

// Регистрация
const registerBtn = document.getElementById('registerBtn');
if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        const name = document.getElementById('registerName').value.trim();
        const username = document.getElementById('registerUsername').value.toLowerCase().trim();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const errorDiv = document.getElementById('registerError');

        errorDiv.classList.remove('show');
        errorDiv.textContent = '';

        // Валидация username
        if (username && !/^[a-z0-9_]+$/.test(username)) {
            errorDiv.textContent = '❌ Username может содержать только латиницу, цифры и _';
            errorDiv.classList.add('show');
            return;
        }

        try {
            // Проверка уникальности username
            if (username) {
                const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('username', '==', username));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    errorDiv.textContent = '❌ Этот username уже занят';
                    errorDiv.classList.add('show');
                    return;
                }
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                displayName: name,
                username: username || '',
                email: email,
                role: 'покупатель',
                bio: '',
                banned: false,
                discount: 0,
                createdAt: new Date()
            });

            modal.style.display = 'none';
            location.reload();
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                errorDiv.textContent = '❌ Эта почта уже зарегистрирована. Попробуйте войти.';
            } else if (error.code === 'auth/weak-password') {
                errorDiv.textContent = '❌ Пароль слишком слабый. Минимум 6 символов.';
            } else if (error.code === 'auth/invalid-email') {
                errorDiv.textContent = '❌ Неверный формат email.';
            } else {
                errorDiv.textContent = '❌ Ошибка: ' + error.message;
            }
            errorDiv.classList.add('show');
        }
    });
}

// Вход
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        errorDiv.classList.remove('show');
        errorDiv.textContent = '';

        try {
            await signInWithEmailAndPassword(auth, email, password);
            
            // Проверяем бан сразу после входа
            const user = auth.currentUser;
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            
            if (userData.banned) {
                errorDiv.textContent = '🚫 Ваш аккаунт заблокирован администратором';
                errorDiv.classList.add('show');
                await signOut(auth);
                return;
            }
            
            modal.style.display = 'none';
            location.reload();
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                errorDiv.textContent = '❌ Пользователь не найден. Зарегистрируйтесь.';
            } else if (error.code === 'auth/wrong-password') {
                errorDiv.textContent = '❌ Неверный пароль.';
            } else if (error.code === 'auth/invalid-email') {
                errorDiv.textContent = '❌ Неверный формат email.';
            } else if (error.code === 'auth/invalid-credential') {
                errorDiv.textContent = '❌ Неверный email или пароль.';
            } else {
                errorDiv.textContent = '❌ Ошибка: ' + error.message;
            }
            errorDiv.classList.add('show');
        }
    });
}

// Вход через Google
const provider = new GoogleAuthProvider();

const googleLoginBtn = document.getElementById('googleLoginBtn');
const googleRegisterBtn = document.getElementById('googleRegisterBtn');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        const errorDiv = document.getElementById('loginError');
        errorDiv.classList.remove('show');
        
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                // Создаем временный профиль
                await setDoc(doc(db, 'users', user.uid), {
                    displayName: user.displayName,
                    email: user.email,
                    role: 'покупатель',
                    bio: '',
                    banned: false,
                    discount: 0,
                    createdAt: new Date(),
                    needsSetup: true
                });
                
                // Показываем окно настройки профиля
                modal.style.display = 'none';
                document.getElementById('setupDisplayName').value = user.displayName || '';
                document.getElementById('setupUsername').value = '';
                document.getElementById('setupProfileModal').style.display = 'block';
                return;
            }
            
            // Проверяем бан
            const userData = userDoc.data();
            if (userData && userData.banned) {
                errorDiv.textContent = '🚫 Ваш аккаунт заблокирован администратором';
                errorDiv.classList.add('show');
                await signOut(auth);
                return;
            }

            modal.style.display = 'none';
            location.reload();
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                errorDiv.textContent = '❌ Окно входа было закрыто.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                return;
            } else {
                errorDiv.textContent = '❌ Ошибка входа через Google.';
            }
            errorDiv.classList.add('show');
        }
    });
}

if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', async () => {
        const errorDiv = document.getElementById('registerError');
        errorDiv.classList.remove('show');
        
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                // Создаем временный профиль
                await setDoc(doc(db, 'users', user.uid), {
                    displayName: user.displayName,
                    email: user.email,
                    role: 'покупатель',
                    bio: '',
                    banned: false,
                    discount: 0,
                    createdAt: new Date(),
                    needsSetup: true
                });
                
                // Показываем окно настройки профиля
                modal.style.display = 'none';
                document.getElementById('setupDisplayName').value = user.displayName || '';
                document.getElementById('setupUsername').value = '';
                document.getElementById('setupProfileModal').style.display = 'block';
                return;
            }

            modal.style.display = 'none';
            location.reload();
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                errorDiv.textContent = '❌ Окно регистрации было закрыто.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                return;
            } else {
                errorDiv.textContent = '❌ Ошибка регистрации через Google.';
            }
            errorDiv.classList.add('show');
        }
    });
}

// Проверка состояния авторизации
onAuthStateChanged(auth, async (user) => {
    const authBtn = document.getElementById('authBtn');
    const profileLink = document.getElementById('profileLink');
    const adminLink = document.getElementById('adminLink');

    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        let userData = userDoc.data();

        // Автоматическое исправление роли для старых пользователей
        if (!userData || userData.role === 'user' || !userData.role) {
            await setDoc(doc(db, 'users', user.uid), {
                displayName: userData?.displayName || user.displayName || 'Пользователь',
                email: user.email,
                role: 'покупатель',
                bio: userData?.bio || '',
                banned: userData?.banned || false,
                discount: userData?.discount || 0,
                createdAt: userData?.createdAt || new Date()
            });
            // Перезагружаем данные
            const updatedDoc = await getDoc(doc(db, 'users', user.uid));
            userData = updatedDoc.data();
        }

        if (userData.banned) {
            const banReason = userData.banReason || 'Причина не указана';
            // Показываем сообщение о бане
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, rgba(138, 43, 226, 0.9) 0%, rgba(75, 0, 130, 0.9) 100%);
                ">
                    <div style="
                        background: rgba(239, 68, 68, 0.9);
                        padding: 3rem;
                        border-radius: 20px;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        max-width: 500px;
                    ">
                        <div style="font-size: 5rem; margin-bottom: 1rem;">🚫</div>
                        <h1 style="color: white; font-size: 2rem; margin-bottom: 1rem;">Аккаунт заблокирован</h1>
                        <p style="color: rgba(255, 255, 255, 0.9); font-size: 1.1rem; margin-bottom: 1rem;">
                            Ваш аккаунт был заблокирован администратором
                        </p>
                        <div style="
                            background: rgba(0, 0, 0, 0.3);
                            padding: 1rem;
                            border-radius: 10px;
                            margin-bottom: 2rem;
                            border-left: 4px solid rgba(255, 255, 255, 0.5);
                        ">
                            <p style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem; margin-bottom: 0.5rem;">
                                <strong>Причина:</strong>
                            </p>
                            <p style="color: white; font-size: 1rem;">
                                ${banReason}
                            </p>
                        </div>
                        <button onclick="window.location.href='index.html'" style="
                            background: white;
                            color: #ef4444;
                            padding: 1rem 2rem;
                            border: none;
                            border-radius: 10px;
                            font-size: 1rem;
                            font-weight: bold;
                            cursor: pointer;
                            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
                        ">
                            Вернуться на главную
                        </button>
                    </div>
                </div>
            `;
            await signOut(auth);
            return;
        }

        // Скрываем кнопку "Войти" и показываем "Профиль"
        if (authBtn) authBtn.style.display = 'none';
        if (profileLink) profileLink.style.display = 'block';

        if (adminLink && ['модератор', 'администратор', 'владелец'].includes(userData.role)) {
            adminLink.style.display = 'block';
        }
    } else {
        // Показываем кнопку "Войти" и скрываем "Профиль"
        if (authBtn) {
            authBtn.style.display = 'block';
            authBtn.textContent = 'Войти';
        }
        if (profileLink) profileLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
});

// Выход
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut(auth);
        window.location.href = 'index.html';
    });
}


// Автоматическое открытие регистрации если есть #register в URL
if (window.location.hash === '#register') {
    setTimeout(() => {
        if (authBtn) {
            authBtn.click();
            setTimeout(() => {
                const registerTab = document.querySelector('[data-tab="register"]');
                if (registerTab) registerTab.click();
            }, 100);
        }
    }, 500);
}
