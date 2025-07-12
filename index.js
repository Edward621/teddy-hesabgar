const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start((ctx) =>
  ctx.reply(
    '👋 سلام‌ بچه‌های گل، اسم و مقدار هزینه رو به روش زیر برای من بفرستید تا براتون‌ سهم هر نفر رو حساب کنم:\n\nnastaran 500 golnaz 210 shahrad 199\n'
  )
);

bot.on('text', (ctx) => {
  const words = ctx.message.text.trim().split(/\s+/);
  if (words.length < 4 || words.length % 2 !== 0) {
    return ctx.reply('نه، اینطوری بنویس:\n\nnastaran 500 golnaz 210 shahrad 199\n');
  }

  // Parse name-amount pairs
  const entries = [];
  for (let i = 0; i < words.length; i += 2) {
    const name = words[i];
    const amount = parseFloat(words[i + 1]);
    if (!name || isNaN(amount)) {
      return ctx.reply('🚫 Please make sure each name is followed by a number, like: golnaz 300');
    }
    entries.push({ name, spent: amount });
  }

  const total = entries.reduce((sum, e) => sum + e.spent, 0);
  const perPerson = total / entries.length;

  const balances = entries.map((e) => ({
    ...e,
    balance: +(e.spent - perPerson).toFixed(2),
  }));

  const creditors = balances.filter((b) => b.balance > 0);
  const debtors = balances.filter((b) => b.balance < 0);
  const transactions = [];

  for (let debtor of debtors) {
    for (let creditor of creditors) {
      if (debtor.balance === 0) break;
      const amount = Math.min(creditor.balance, -debtor.balance);
      if (amount > 0) {
        transactions.push(
          `${debtor.name} Pays ${amount.toFixed(2)}$ to ${creditor.name}`
        );
        creditor.balance -= amount;
        debtor.balance += amount;
      }
    }
  }

  const breakdown = balances
    .map(
      (b) =>
        `${b.name}:  ${b.spent}$ `
    )
    .join('\n');

  ctx.reply(
    `🧾 TOTAL: ${total}$\n💰 Per preson: ${perPerson.toFixed(
      2
    )}$\n\n${breakdown}\n\n📤 Settlement:\n${transactions.join('\n')}`
  );
});

bot.launch();
console.log('🚀 Bot running!');