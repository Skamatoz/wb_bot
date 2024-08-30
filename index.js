const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api'); // Библиотека для работы с Telegram Bot API

// Вводные данные(Спец обновление)
const TELEGRAM_BOT_TOKEN = '1452701861:AAGlAsFmU70vK06BqoiiOpEpR09MBeQCYtA';
const TELEGRAM_CHAT_ID = '-1001177909512';

const url = 'https://supplies-api.wildberries.ru/api/v1/acceptance/coefficients';
const options = {
  headers: {
    'Authorization': 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjQwODE5djEiLCJ0eXAiOiJKV1QifQ.eyJlbnQiOjEsImV4cCI6MTc0MDQ1NTUxNywiaWQiOiI1N2I0NDE3Yi0zMmRjLTQwYTYtYTdmNC04M2Y5ZmJkMGFlMzAiLCJpaWQiOjEyNzQyMzM5OSwib2lkIjozOTQwMjA1LCJzIjoxMDI0LCJzaWQiOiI0MGE2YTFhZi00ZWIzLTQ5NmEtOGNmNC0xZWVjODg4ZjQ1YjQiLCJ0IjpmYWxzZSwidWlkIjoxMjc0MjMzOTl9.9A6g0KZxCkqAr2DH3PvzfeB9RNovUv5fYI3mIOUhAmFbDcaTZTxhISEhDRxP8Mu5v0nGSgXwHhFE_Pa5zttqPQ'
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

// Функция для форматирования даты
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0'); // Получаем день
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Получаем месяц (январь - 0, поэтому +1)
  return `${day}.${month}`; // Возвращаем дату в формате ДД.ММ
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

        const formattedDate = formatDate(item.date); // Форматирование даты

        messages.push(
          `Есть свободный слот!\n` +
          `Дата: ${formattedDate}\n` +  // Использование отформатированной даты
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
