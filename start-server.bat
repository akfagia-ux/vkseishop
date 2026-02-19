@echo off
echo Запуск сервера VkesiShop...
echo.
echo Открой в браузере: http://localhost:8000
echo.
echo Для остановки нажми Ctrl+C
echo.
python -m http.server 8000
pause
