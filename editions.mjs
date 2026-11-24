export const editions = {
  nb: {
    question: 'Er det fredag?',
    yes: 'JA',
    no: 'NEI',
    lines: [
      'Mandag har fått sin egen dag. Den kan vente.',
      'Én ting av gangen. Kaffe er en ting.',
      'En helt vanlig tirsdag. Ta deg en brødskive.',
      'Halvveis. Selv om lista ble lengre.',
      'Fredag har en god PR-avdeling.',
      'Tacoen spør ikke hvor mye du fikk gjort.',
      'Du trenger ikke være flink på en lørdag.',
    ],
    untilFriday: 'Til fredag kl. 00:00',
    untilBeer: 'Fredagsøl kl. 16:00',
    beer: 'Nå er det fredagsøl!',
    units: ['dager', 'timer', 'minutter', 'sekunder'],
    zone: 'Sted og språk',
    automatic: 'Her · Norsk',
    cities: { 'Europe/Oslo': 'Oslo', 'Europe/London': 'London', 'Asia/Tokyo': 'Tokyo' },
    light: 'Lys modus',
    dark: 'Mørk modus',
    api: 'Fredags-API',
    game: 'Spill: Fang fredag',
    elsewhere: (city, time) => `Det er fredag i ${city} · ${time}`,
  },
  en: {
    question: 'Is it Friday?',
    yes: 'YES',
    no: 'NO',
    lines: [
      'Tomorrow already has a whole day to itself.',
      'One thing at a time. Coffee is a thing.',
      'The plot can wait. Have a little snack.',
      'Halfway. Even if your list got longer.',
      'Tomorrow has a very good publicist.',
      'The weekend doesn’t need a status update.',
      'You don’t have to be good at Saturday.',
    ],
    untilFriday: 'Until Friday · midnight',
    untilBeer: 'Friday drinks · 4 PM',
    beer: 'It’s Friday o’clock.',
    units: ['days', 'hours', 'minutes', 'seconds'],
    zone: 'Location and language',
    automatic: 'Here · English',
    cities: { 'Europe/Oslo': 'Oslo', 'Europe/London': 'London', 'Asia/Tokyo': 'Tokyo' },
    light: 'Light mode',
    dark: 'Dark mode',
    api: 'Friday API',
    game: 'Play Catch Friday',
    elsewhere: (city, time) => `It’s Friday in ${city} · ${time}`,
  },
  ja: {
    question: '金曜日ですか？',
    yes: 'はい',
    no: 'いいえ',
    lines: [
      '月曜の心配は、月曜の仕事。',
      'ひとつずつ。コーヒーもひとつに数えていい。',
      '何も起きない日も、当たりです。',
      'やることは増えたけど、週の半分は過ぎました。',
      '金曜日、予告編だけでこの人気。',
      'おつかれさま。週末に進捗報告はいりません。',
      '二度寝に目標設定はいりません。',
    ],
    untilFriday: '金曜日の午前0時まで',
    untilBeer: '金曜日の午後4時まで',
    beer: 'ひと足先に、週末気分。',
    units: ['日', '時間', '分', '秒'],
    zone: '地域と言語',
    automatic: '現在地 · 日本語',
    cities: { 'Europe/Oslo': 'オスロ', 'Europe/London': 'ロンドン', 'Asia/Tokyo': '東京' },
    light: 'ライトモード',
    dark: 'ダークモード',
    api: '金曜日 API',
    game: '金曜日をつかまえろ',
    elsewhere: (city, time) => `${city}はもう金曜日 · ${time}`,
  },
};

export const places = {
  oslo: { language: 'nb', timeZone: 'Europe/Oslo', label: 'Oslo · Norsk' },
  london: { language: 'en', timeZone: 'Europe/London', label: 'London · English' },
  tokyo: { language: 'ja', timeZone: 'Asia/Tokyo', label: '東京 · 日本語' },
};

export function pickLanguage(locales, fallback = 'en') {
  for (const locale of locales) {
    const [code] = locale.trim().toLowerCase().split('-');
    if (code === 'ja' || code === 'en') return code;
    if (['nb', 'nn', 'no'].includes(code)) return 'nb';
  }
  return fallback;
}

export function placeLabel(timeZone, language) {
  return editions[language].cities[timeZone] ?? timeZone.split('/').at(-1).replaceAll('_', ' ');
}
