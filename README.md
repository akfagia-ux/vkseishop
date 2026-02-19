# VkesiShop - Инструкция по настройке

Сайт для продажи услуг GTA 5 RP и Steam с системой регистрации и админ-панелью.

---

## 📋 Шаг 1: Создание проекта Firebase

1. Перейдите на сайт [Firebase Console](https://console.firebase.google.com/)
2. Нажмите **"Добавить проект"** (Add project)
3. Введите название проекта: **VkesiShop**
4. Отключите Google Analytics (не обязательно для этого проекта)
5. Нажмите **"Создать проект"**
6. Дождитесь создания проекта и нажмите **"Продолжить"**

---

## 🔐 Шаг 2: Настройка Authentication (Авторизация)

1. В левом меню выберите **"Build"** → **"Authentication"**
2. Нажмите **"Get started"** (Начать)
3. Включите **Email/Password**:
   - Нажмите на **"Email/Password"**
   - Включите первый переключатель **"Enable"**
   - Нажмите **"Save"** (Сохранить)
4. Включите **Google**:
   - Нажмите на **"Google"**
   - Включите переключатель **"Enable"**
   - Введите название проекта и ваш email
   - Нажмите **"Save"** (Сохранить)

---

## 💾 Шаг 3: Создание Firestore Database

1. В левом меню выберите **"Build"** → **"Firestore Database"**
2. Нажмите **"Create database"** (Создать базу данных)
3. Выберите режим **"Start in test mode"** (Начать в тестовом режиме)
4. Выберите регион: **europe-west** (или ближайший к вам)
5. Нажмите **"Enable"** (Включить)

### Настройка правил безопасности:

1. Перейдите на вкладку **"Rules"** (Правила)
2. Замените весь текст на следующий:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
      allow update: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['модератор', 'администратор', 'владелец']);
    }
    
    match /tickets/{ticketId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['модератор', 'администратор', 'владелец']);
      allow delete: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'владелец');
    }
  }
}
```

3. Нажмите **"Publish"** (Опубликовать)

---

## ⚙️ Шаг 4: Получение конфигурации Firebase

### ВАРИАНТ 1 - Через главную страницу:
1. Открой Firebase Console: https://console.firebase.google.com/
2. Выбери свой проект **VkesiShop**
3. На главной странице (Project Overview) увидишь надпись **"Get started by adding Firebase to your app"**
4. Нажми на иконку **</>** (это веб-приложение)
5. Введи название: **VkesiShop**
6. **НЕ СТАВЬ ГАЛОЧКУ** на "Also set up Firebase Hosting"
7. Нажми **"Register app"**
8. Скопируй код который появится

### ВАРИАНТ 2 - Если уже создавал приложение:
1. В левом меню нажми на **шестеренку** ⚙️ (она рядом с "Project Overview")
2. Выбери **"Настройки проекта"** или **"Project settings"**
3. Прокрути вниз до раздела **"Ваши приложения"** или **"Your apps"**
4. Если там уже есть веб-приложение - увидишь код конфигурации
5. Если нет - нажми **</>** чтобы добавить

### ВАРИАНТ 3 - Самый простой:
1. Перейди по ссылке: https://console.firebase.google.com/project/ВАШ_ПРОЕКТ_ID/settings/general
2. Замени **ВАШ_ПРОЕКТ_ID** на название твоего проекта
3. Прокрути вниз - там будет код

### Код будет выглядеть так:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "vkesishop.firebaseapp.com",
  projectId: "vkesishop",
  storageBucket: "vkesishop.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

## 📝 Шаг 5: Вставка конфигурации в код

1. Откройте файл **`js/firebase-config.js`** в вашем проекте
2. Найдите строки:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

3. Замените эти значения на ваши из Firebase Console
4. Сохраните файл

---

## 🚀 Шаг 6: Запуск сайта

### Вариант 1: Простой способ (двойной клик)
- Просто откройте файл **`index.html`** двойным кликом в браузере

### Вариант 2: Локальный сервер (рекомендуется)

**Если у вас установлен Python:**
```bash
python -m http.server 8000
```

**Если у вас установлен Node.js:**
```bash
npx http-server -p 8000
```

Затем откройте в браузере: **http://localhost:8000**

---

## 👤 Шаг 7: Создание первого администратора

1. Откройте сайт и зарегистрируйтесь
2. Перейдите в Firebase Console → **Firestore Database**
3. Найдите коллекцию **"users"**
4. Найдите вашего пользователя (по email)
5. Нажмите на документ и измените поле **"role"** с **"покупатель"** на **"владелец"**
6. Обновите страницу сайта - теперь у вас есть доступ к админ-панели!

---

## 📂 Структура проекта

```
vkesishop/
├── index.html          # Главная страница
├── services.html       # Страница услуг
├── support.html        # Страница поддержки (НОВОЕ!)
├── admin.html          # Админ-панель
├── css/
│   └── style.css       # Стили сайта
├── js/
│   ├── firebase-config.js  # Конфигурация Firebase (НАСТРОИТЬ!)
│   ├── auth.js            # Авторизация
│   ├── admin.js           # Админ-панель
│   └── support.js         # Система поддержки (НОВОЕ!)
└── README.md           # Эта инструкция
```

---

## ✨ Функционал сайта

✅ **Регистрация и вход:**
- Через Email/Password
- Через Google аккаунт

✅ **Система ролей:**
- Покупатель (по умолчанию)
- VIP
- Hard
- Модератор 🛡️ (доступ к админ-панели, бан пользователей ниже ранга)
- Администратор 👨‍💼 (полный доступ кроме выдачи роли владельца)
- Владелец 👑 (полный доступ)

✅ **Профиль пользователя:**
- Редактирование никнейма
- Редактирование описания

✅ **Админ-панель (для модераторов и выше):**
- Просмотр всех пользователей
- Изменение ролей (с ограничениями по рангу)
- Бан/разбан пользователей (только ниже по рангу)
- Выдача скидок
- Модераторы не могут банить/управлять модераторами и выше

✅ **Система поддержки:**
- Создание тикетов всеми пользователями
- Жалобы на пользователей (username и email)
- Ответы на тикеты от модераторов и выше
- Закрытие тикетов персоналом
- Фильтрация тикетов (все/открытые/закрытые)

✅ **Страница услуг:**
- Отсижу деморган GTA 5 RP
- Скрипт на деморган GTA 5 RP
- Пополнение Steam аккаунта RUB
- Прочие услуги

✅ **Отзывы клиентов** на главной странице

---

## 🆘 Частые проблемы

### Проблема: "Firebase is not defined"
**Решение:** Убедитесь, что вы правильно вставили конфигурацию в `js/firebase-config.js`

### Проблема: "Permission denied" при регистрации
**Решение:** Проверьте правила безопасности Firestore (Шаг 3)

### Проблема: Не работает вход через Google
**Решение:** Убедитесь, что вы включили Google Authentication (Шаг 2)

### Проблема: Сайт не открывается
**Решение:** Используйте локальный сервер (Шаг 6, Вариант 2)

---

## 📞 Контакты

**Владелец:** Елизар Макаров  
**Email:** rilikov2000@mail.ru

---

## 🎨 Дизайн

Сайт выполнен в фиолетово-синей цветовой гамме с градиентами и эффектами размытия (backdrop-filter).

---

**Готово! Ваш сайт VkesiShop настроен и готов к работе! 🎉**
