const { Telegraf, Markup } = require('telegraf');
const http = require('http');

// Ваш токен бота
const BOT_TOKEN = process.env.BOT_TOKEN || '8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY';
const bot = new Telegraf(BOT_TOKEN);

// Временное хранилище сделок в памяти
const deals = {};

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

// Команда /start
bot.start((ctx) => {
  return ctx.replyWithMarkdown(getWelcomeText(), getMainKeyboard());
});

// Кнопка: Баланс
bot.action('menu_balance', (ctx) => {
  const balanceText = 
    `💳 *Личный кабинет пользователя*\n\n` +
    `💰 *Баланс:* 0.00 руб.\n` +
    `🔒 *Заморожено в сделках:* 0.00 руб.\n\n` +
    `📊 *Статистика профиля:*\n` +
    `• Всего сделок: 0\n` +
    `• Успешных сделок: 0\n` +
    `• Споров/Арбитражей: 0\n\n` +
    `✨ Ваш аккаунт полностью верифицирован системой Гаранта.`;

  return ctx.editMessageText(balanceText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'to_main_menu')]])
  });
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
  });
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
  });
});

// Кнопка: Создать сделку
bot.action('menu_create', (ctx) => {
  const createText = `🤝 *Создание новой безопасной сделки*\n\nВыберите вашу роль в текущей торговой операции:`;
  
  return ctx.editMessageText(createText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🛒 Я покупаю', 'role_buyer'), Markup.button.callback('📦 Я продаю', 'role_seller')],
      [Markup.button.callback('⬅️ В главное меню', 'to_main_menu')]
    ])
  });
});

// Роль: Я продаю
bot.action('role_seller', (ctx) => {
  const dealId = Math.floor(100000 + Math.random() * 900000); // Генерируем 6-значный ID
  deals[dealId] = { status: 'created', seller: ctx.from.username || 'k13_way', buyer: null };

  const sellerText = 
    `📦 *Вы создали сделку как ПРОДАВЕЦ*\n\n` +
    `🆔 *Номер сделки:* \`${dealId}\`\n\n` +
    `💡 *Как передать сделку покупателю?*\n` +
    `Скопируйте текст ниже и отправьте его второму участнику:\n\n` +
    `\`Привет! Переходи в бота @${ctx.botInfo.username}, нажимай «Создать сделку» -> «Я покупаю» и введи код сделки: ${dealId}\``;

  return ctx.editMessageText(sellerText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Проверить принятие (Тест для @k13_way)', `test_accept_${dealId}`)],
      [Markup.button.callback('⬅️ Назад', 'menu_create')]
    ])
  });
});

// Роль: Я покупаю
bot.action('role_buyer', (ctx) => {
  const buyerText = 
    `🛒 *Вы вошли как ПОКУПАТЕЛЬ*\n\n` +
    `Чтобы подключиться к сделке, продавец должен прислать вам специальный 6-значный код.\n\n` +
    `*Для симуляции процесса (теста)* нажмите кнопку ниже, система автоматически подключит вас к случайной тестовой сделке.`;

  return ctx.editMessageText(buyerText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔌 Подключиться к сделке (Тест)', 'test_buyer_connect')],
      [Markup.button.callback('⬅️ Назад', 'menu_create')]
    ])
  });
});

// ТЕСТОВЫЙ ШАГ: Покупатель подключается
bot.action('test_buyer_connect', (ctx) => {
  const mockDealId = Math.floor(100000 + Math.random() * 900000);
  deals[mockDealId] = { status: 'accepted', seller: 'seller_username', buyer: ctx.from.username || 'k13_way' };

  const text = 
    `🤝 *Сделка #${mockDealId} успешно принята!*\n\n` +
    `ℹ️ Ожидайте, пока продавец подтвердит готовность. Или вы можете сразу внести оплату на баланс гаранта.\n\n` +
    `💰 Сумма к оплате: *1 000 руб.*`;

  return ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('💳 Оплатить внутренним балансом', `pay_${mockDealId}`)]
    ])
  });
});

// ТЕСТОВЫЙ ШАГ: Симуляция для продавца (что покупатель принял сделку)
bot.action(/^test_accept_(.+)$/, (ctx) => {
  const dealId = ctx.match[1];
  const text = 
    `🔔 *Уведомление по сделке #${dealId}*\n\n` +
    `Покупатель принял вашу сделку и перешел к этапу оплаты!\n` +
    `Ожидайте системного уведомления о зачислении средств на баланс Гаранта.`;

  return ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('🔄 Симулировать оплату', `simulate_pay_${dealId}`)]])
  });
});

// ТЕСТОВЫЙ ШАГ: Покупатель жмет "Оплатить"
bot.action(/^pay_(.+)$/, (ctx) => {
  const dealId = ctx.match[1];
  const text = 
    `✅ *Сделка #${dealId} успешно оплачена!*\n\n` +
    `Деньги заморожены на балансе Гаранта PlayerOk.\n` +
    `Продавцу отправлено уведомление. Ожидайте передачу товара/доступа.`;

  return ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('🎁 Подтвердить получение товара', `confirm_receive_${dealId}`)]])
  });
});

// ТЕСТОВЫЙ ШАГ: Продавец видит, что оплачено, и жмет "Передать товар"
bot.action(/^simulate_pay_(.+)$/, (ctx) => {
  const dealId = ctx.match[1];
  const text = 
    `💰 *Баланс Гаранта по сделке #${dealId} пополнен!*\n\n` +
    `Покупатель внес средства. Вам необходимо передать товар (данные от аккаунта/предмет) покупателю в личные сообщения или удобным способом.\n\n` +
    `После передачи нажмите кнопку ниже:`;

  return ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `goods_sent_${dealId}`)]])
  });
});

// ТЕСТОВЫЙ ШАГ: Продавец отправил товар
bot.action(/^goods_sent_(.+)$/, (ctx) => {
  const dealId = ctx.match[1];
  return ctx.editMessageText(`✅ Вы подтвердили передачу товара по сделке #${dealId}. Ожидаем подтверждения от покупателя для выплаты средств.`, {
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'to_main_menu')]])
  });
});

// ТЕСТОВЫЙ ШАГ: Покупатель подтверждает получение
bot.action(/^confirm_receive_(.+)$/, (ctx) => {
  const dealId = ctx.match[1];
  const text = 
    `🎉 *Сделка #${dealId} успешно завершена!*\n\n` +
    `Вы подтвердили получение товара. Деньги успешно переведены на баланс продавца.\n\n` +
    `Спасибо, что выбираете гарант-сервис *PlayerOk*!`;

  return ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'to_main_menu')]])
  });
});

// Возврат в главное меню
bot.action('to_main_menu', (ctx) => {
  return ctx.editMessageText(getWelcomeText(), {
    parse_mode: 'Markdown',
    ...getMainKeyboard()
  });
});

// Запуск бота
bot.launch().then(() => {
  console.log('Робот-гарант успешно запущен!');
});

// HTTP-сервер для прохождения проверки портов Render.com
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Telegram Bot is active\n');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT);
