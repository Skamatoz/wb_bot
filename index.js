const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api'); // Библиотека для работы с Telegram Bot API

// Вводные данные
const TELEGRAM_BOT_TOKEN = '7088533899:AAH2xVh85SQ-E54B29udN013d6lXzVRKcS8';
const TELEGRAM_CHAT_ID = '-4561945946';

const url = 'https://supplies-api.wildberries.ru/api/v1/acceptance/coefficients';
const options = {
  headers: {
    'Authorization': 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQwODAxdjEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTczOTQwNzE3NywiaWQiOiIyOWQ2OThjMS01NGYxLTQ2ZjUtOTRhNS1hMDlhOWYwZWZmZjkiLCJpaWQiOjM5ODMxMDM5LCJvaWQiOjUzNDI3MSwicyI6MTA3Niwic2lkIjoiNDVhZWYzZTUtYWRkMy00NmY4LTk1YWYtNWY5ZWM4YTJjYmMxIiwidCI6ZmFsc2UsInVpZCI6Mzk4MzEwMzl9.q8O0PlFg19FfgIOYybBSPM9v5YQf6r85rSQtCwiZxkEFOQAFI48Js-tM7Igil_K1KdqDt000EXEUgAaYeNbUIA'
  }
};

const warehouseNames = [
  "Электросталь", "Коледино", "Подольск", "Белые столбы", "Обухово", 
  "СЦ обухово 2", "СЦ Пушкино", "Чашниково", "Тула", "Краснодар", 
  "Казань", "Екатеринбург", "СЦ Шушары", "Санкт-Петербург"
];

const allowedBoxTypes = [
  "Монопаллеты", "Короба"
];

// Множество для хранения уникальных записей
const uniqueEntries = new Set();

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

// Обработчик ошибок
function handleError(error) {
  console.error('Error:', error.message || error);
}

// Функция для обработки и отправки данных
async function fetchAndSend() {
  try {
    // Запрос данных
    const response = await axios.get(url, options);
    const data = response.data;

    // Фильтрация данных
    const filteredData = data.filter(item => 
        item.coefficient >= 0 && item.coefficient <= 10 &&  // Проверка диапазона от 0 до 10
        warehouseNames.includes(item.warehouseName) &&      // Проверка имени склада
        allowedBoxTypes.includes(item.boxTypeName)          // Проверка типа упаковки
      );

    // Список для сообщений
    let messages = [];

    filteredData.forEach(item => {
      // Создание уникального ключа для записи
      const entryKey = `${item.warehouseName}-${item.boxTypeName}-${item.coefficient}-${item.date}`;

      // Проверка на уникальность
      if (!uniqueEntries.has(entryKey)) {
        uniqueEntries.add(entryKey);
        messages.push(
          `Есть свободный слот!\n` +
          `Дата: ${item.date}\n` +
          `Коэффициент: ${item.coefficient}\n` +
          `Склад: ${item.warehouseName}\n` +
          `Тип поставки: ${item.boxTypeName}`
        );
      }
    });

    // Если есть новые сообщения
    if (messages.length > 0) {
      // Отправка сообщений в Telegram
      await bot.sendMessage(TELEGRAM_CHAT_ID, messages.join('\n\n'));
      console.log('Сообщение отправлено в Телеграм');
    } else {
      console.log('Нет данных для отправки');
    }
  } catch (error) {
    handleError(error);
  }
}

// Запуск функции каждую 10 секунд
setInterval(fetchAndSend, 10000);

// Запуск функции сразу при старте
fetchAndSend();
