const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN || '8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY';
const bot = new Telegraf(BOT_TOKEN);

// Настройки администратора
const ADMIN_USERNAME = 'k13_way';

// База данных в памяти (сбросится при перезапуске Render)
const users = {}; // Хранение балансов и статистики: { 'username': { balance: 0, deals_count: 0 } }
const deals = {}; // Хранение сделок: { '123456': { seller: 'id', buyer: 'id', status: 'created', amount: 1000 } }
const userStates = {}; // Хранение шагов ввода: { 'chat_id': 'waiting_for_deal_id' }

// Функция инициализации пользователя, если его нет в базе
const initUser = (username) => {
  if (!username) return;
  if (!users[username]) {
    users[username] = { balance: 0, deals_count: 0, success_deals: 0 };
  }
};

// Главный текст меню
const getWelcomeText = () => {
  return `Добро пожаловать 👋\n\n` +
    `✅ *PlayerOk* — специализированный маркетплейс и торговый гарант по обеспечению полной безопасности внебиржевых сделок.\n\n` +
    `🥇 Автоматизированный алгоритм исполнения.\n` +
    `🔎 Скорость, верификация и защита.\n` +
    `💳 Удобный и моментальный вывод средств.\n\n` +
    `• Комиссия сервиса: 1%\n` +
    `• Режим работы системы: 24/7\n` +
    `• Главный модератор: @sw1zyy01\n\n` +
    `🛡️ Выберите нужный раздел ниже:`;
};

// Главная инлайн-клавиатура
const getMainKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💳 Баланс', 'menu_balance'), Markup.button.callback('🤝 Создать сделку', 'menu_create')],
    [Markup.button.callback('🛡️ Безопасность', 'menu_safety'), Markup.button.callback('👨‍💻 Поддержка', 'menu_support')]
  ]);
};

// Старт бота
bot.start((ctx) => {
  initUser(ctx.from.username);
  delete userStates[ctx.chat.id]; // Сброс состояний
  return ctx.replyWithMarkdown(getWelcomeText(), getMainKeyboard());
});

// Кнопка: Баланс
bot.action('menu_balance', (ctx) => {
  const username = ctx.from.username || 'no_user';
  initUser(username);
  const user = users[username] || { balance: 0, deals_count: 0, success_deals: 0 };

  const balanceText = 
    `💳 *Личный кабинет пользователя* \`@${username}\`\n\n` +
    `💰 *Баланс:* ${user.balance.toFixed(2)} руб.\n` +
    `🔒 *Заморожено в сделках:* 0.00 руб.\n\n` +
    `📊 *Статистика профиля:*\n` +
    `• Всего сделок: ${user.deals_count}\n` +
    `• Успешных сделок: ${user.success_deals}\n` +
    `• Споров/Арбитражей: 0\n\n` +
    `✨ Ваш аккаунт полностью верифицирован системой Гаранта.`;

  return ctx.editMessageText(balanceText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'to_main_menu')]])
  }).catch(() => {});
});

// Кнопка: Поддержка
bot.action('menu_support', (ctx) => {
  const supportText = 
    `👨‍💻 *Служба поддержки PlayerOk*\n\n` +
    `Если у вас возникли вопросы по поводу проведения сделки, оплаты или вывода средств, наш главный модератор всегда готов помочь.\n\n` +
    `🚩 Пожалуйста, не передавайте свои личные данные третьим лицам.\n\n` +
    `✍️ *Связь с модератором:* @sw1zyy01`;

  return ctx.editMessageText(supportText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'to_main_menu')]])
  }).catch(() => {});
});

// Кнопка: Безопасность
bot.action('menu_safety', (ctx) => {
  const safetyText = 
    `🛡️ *Правила безопасности PlayerOk*\n\n` +
    `1. *Всегда проводите оплату внутри бота.* Прямые переводы на карты или кошельки продавца лишают вас защиты Гаранта.\n` +
    `2. *Не подтверждайте выполнение сделки*, пока лично не проверите полученный товар или услугу.\n` +
    `3. *Общение по сделке* должно проходить исключительно в чате Гаранта. Скриншоты переписок из других мест не принимаются арбитражем.\n\n` +
    `✅ Соблюдение этих правил гарантирует 100% возврат средств в случае обмана.`;

  return ctx.editMessageText(safetyText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'to_main_menu')]])
  }).catch(() => {});
});

// Кнопка: Создать сделку
bot.action('menu_create', (ctx) => {
  delete userStates[ctx.chat.id];
  const createText = `🤝 *Создание новой безопасной сделки*\n\nВыберите вашу роль в текущей торговой операции:`;
  
  return ctx.editMessageText(createText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🛒 Я покупаю', 'role_buyer'), Markup.button.callback('📦 Я продаю', 'role_seller')],
      [Markup.button.callback('⬅️ В главное меню', 'to_main_menu')]
    ])
  }).catch(() => {});
});

// Роль: Я продаю (Генерация сделки)
bot.action('role_seller', (ctx) => {
  const username = ctx.from.username;
  if (!username) {
    return ctx.answerCbQuery('❌ Для создания сделки у вас должен быть установлен @username в настройках Telegram!', { show_alert: true });
  }
  
  initUser(username);
  const dealId = Math.floor(100000 + Math.random() * 900000); // 6 знаков
  deals[dealId] = { status: 'created', seller: username, buyer: null, amount: 1000, chat_id_seller: ctx.chat.id };

  const sellerText = 
    `📦 *Вы создали сделку как ПРОДАВЕЦ*\n\n` +
    `🆔 *Номер сделки:* \`${dealId}\`\n` +
    `💰 *Сумма сделки по умолчанию:* 1 000 руб.\n\n` +
    `💡 *Инструкция для покупателя:*\n` +
    `Передайте этот код покупателю. Он должен нажать «Создать сделку» $\rightarrow$ «Я покупаю» и отправить код боту в чат.\n\n` +
    `🔄 *Ожидайте подключения покупателя...*`;

  return ctx.editMessageText(sellerText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Обновить статус сделки', `refresh_seller_${dealId}`)],
      [Markup.button.callback('⬅️ Назад', 'menu_create')]
    ])
  }).catch(() => {});
});

// Обновление статуса для продавца
bot.action(/^refresh_seller_(.+)$/, (ctx) => {
  const dealId = ctx.match[1];
  const deal = deals[dealId];
  
  if (!deal) return ctx.answerCbQuery('Сделка не найдена.');

  if (deal.status === 'accepted') {
    return ctx.editMessageText(`🔔 *Покупатель @${deal.buyer} подключился к сделке #${dealId}!*\n\nОжидайте, пока он внесет оплату на баланс гаранта.`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Проверить оплату', `refresh_seller_${dealId}`)]])
    }).catch(() => {});
  }
  
  if (deal.status === 'paid') {
    return ctx.editMessageText(`💰 *Покупатель ОПЛАТИЛ сделку #${dealId}!*\n\nДеньги заморожены гарантом. Вам необходимо передать товар покупателю.\nПосле передачи нажмите кнопку ниже:`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `goods_sent_${dealId}`)]])
    }).catch(() => {});
  }

  if (deal.status === 'completed') {
    return ctx.editMessageText(`🎉 *Сделка #${dealId} успешно завершена!*\n\nПокупатель подтвердил получение. Деньги зачислены на ваш баланс (виртуально).`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'to_main_menu')]])
    }).catch(() => {});
  }

  return ctx.answerCbQuery('Покупатель еще не совершил новых действий.', { show_alert: false });
});

// Роль: Я покупаю (Ввод ID сделки)
bot.action('role_buyer', (ctx) => {
  userStates[ctx.chat.id] = 'waiting_for_deal_id';
  
  return ctx.editMessageText(`🛒 *Вход в сделку как ПОКУПАТЕЛЬ*\n\nВведите 6-значный **номер сделки**, который вам скинул продавец, прямо в этот чат текстом:`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Отмена', 'menu_create')]])
  }).catch(() => {});
});

// Обработка текстовых сообщений (Ввод ID и админка)
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text.trim();
  const username = ctx.from.username;

  // 1. Логика ввода ID сделки покупателем
  if (userStates[chatId] === 'waiting_for_deal_id') {
    if (!username) {
      delete userStates[chatId];
      return ctx.reply('❌ У вас должен быть установлен @username в настройках Telegram.');
    }
    
    const dealId = text;
    const deal = deals[dealId];

    if (!deal || deal.status !== 'created') {
      return ctx.reply('❌ Сделка с таким ID не найдена или уже занята. Попробуйте ввести еще раз или нажмите /start для отмены.');
    }

    // Связываем покупателя со сделкой
    deal.buyer = username;
    deal.status = 'accepted';
    deal.chat_id_buyer = chatId;
    delete userStates[chatId];

    // Уведомляем продавца (если он еще в боте)
    if (deal.chat_id_seller) {
      bot.telegram.sendMessage(deal.chat_id_seller, `🔔 К вашей сделке #${dealId} подключился покупатель @${username}!`).catch(() => {});
    }

    return ctx.replyWithMarkdown(`🤝 *Вы успешно подключились к сделке #${dealId}!*\n\n*Продавец:* @${deal.seller}\n*Сумма к оплате:* ${deal.amount} руб.\n\nНажмите кнопку ниже для симуляции оплаты через внутренний баланс:`, 
      Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить сделку', `pay_${dealId}`)]])
    );
  }

  // 2. Логика админ-команды на выдачу баланса (Пример: /setbal username 500)
  if (text.startsWith('/setbal') && username === ADMIN_USERNAME) {
    const args = text.split(' ');
    if (args.length < 3) {
      return ctx.reply('Используйте: /setbal [юзернейм_без_собачки] [сумма]');
    }
    const targetUser = args[1].replace('@', '');
    const amount = parseFloat(args[2]);

    if (isNaN(amount)) return ctx.reply('Неверная сумма.');

    initUser(targetUser);
    users[targetUser].balance = amount;

    return ctx.reply(`✅ Баланс пользователя @${targetUser} успешно изменен на ${amount} руб.`);
  }
});

// Покупатель оплачивает сделки
bot.action(/^pay_(.+)$/, (ctx) => {
  const dealId = ctx.match[1];
  const deal = deals[dealId];

  if (!deal) return ctx.answerCbQuery('Сделка не найдена.');

  deal.status = 'paid';
  
  if (deal.chat_id_seller) {
