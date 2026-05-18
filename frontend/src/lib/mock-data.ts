export type Post = {
  id: number;
  user: string;
  realName: string;
  when: string;
  dish: string;
  place: string;
  rating: number;
  price: string;
  text: string;
  tags: string[];
  photos: number;
  likes: number;
  comments: number;
  seed: number;
  // Опциональные поля для реальных данных из API (адаптер foody-front ↔ Django).
  photoUrls?: string[];
  avatarUrl?: string;
  userId?: number;
};

export type PostComment = {
  id: number | string;
  user: string;
  realName: string;
  avatarUrl?: string;
  when: string;
  text: string;
  likes: number;
  liked?: boolean;
  replyTo?: string;
  replyToCommentId?: PostComment["id"];
  clientId?: string;
  status?: "sending" | "sent" | "failed";
};

export type Palette = "fresh" | "citrus" | "dusk";
export type Density = "comfortable" | "cozy";

export type Tweaks = {
  brand: string;
  palette: Palette;
  density: Density;
};

export const DEFAULT_TWEAKS: Tweaks = {
  brand: "#2ECC71",
  palette: "fresh",
  density: "comfortable",
};

export const POSTS: Post[] = [
  {
    id: 1,
    user: "@ivanov_ivan",
    realName: "Иван Иванов",
    when: "2 ч",
    dish: "Тако с лангустином и манго",
    place: "El Camino · Никольская, 10",
    rating: 4.9,
    price: "₽680",
    text: "Шеф уговорил попробовать с тёплой сальсой — мякоть просто тает, а перчик чили работает на финале. Возьму ещё.",
    tags: ["#тако", "#морепродукты", "#центр"],
    photos: 3,
    likes: 999,
    comments: 262,
    seed: 0,
  },
  {
    id: 2,
    user: "@masha.eats",
    realName: "Маша Петрова",
    when: "5 ч",
    dish: "Маття чизкейк",
    place: "Hokkaidō · Патрики",
    rating: 4.7,
    price: "₽490",
    text: "Текстура воздушная, маття не горчит. Подача мини — на двоих маловато, заказывайте по штуке каждому.",
    tags: ["#чизкейк", "#маття", "#патрики"],
    photos: 4,
    likes: 1413,
    comments: 88,
    seed: 5,
  },
  {
    id: 3,
    user: "@kostya.cooks",
    realName: "Костя",
    when: "вчера",
    dish: "Хачапури по-аджарски",
    place: "Сулико · Кутузовский 22",
    rating: 4.8,
    price: "₽650",
    text: "Жёлток разбили прямо на лодочке. Хлеб — хрустит снаружи, тянется внутри. Лучшее в районе, проверено.",
    tags: ["#хачапури", "#грузинская", "#ужин"],
    photos: 2,
    likes: 742,
    comments: 41,
    seed: 2,
  },
  {
    id: 4,
    user: "@nikita.grill",
    realName: "Никита",
    when: "1 д",
    dish: "Стейки на углях с перечным соусом",
    place: "Firewood · Покровка, 31",
    rating: 4.9,
    price: "₽1450",
    text: "Медиум rare попали идеально: дымный край, сочная середина и соус, который хочется забрать домой.",
    tags: ["#стейки", "#мясо", "#ужин"],
    photos: 3,
    likes: 1186,
    comments: 73,
    seed: 8,
  },
];

export const COMMENTS_BY_POST_ID: Record<number, PostComment[]> = {
  1: [
    {
      id: 101,
      user: "@mike.ross",
      realName: "Mike Ross",
      when: "2 ч",
      text: "Выглядит просто потрясающе! Обязательно зайду на выходных попробовать 😋 🍹",
      likes: 14,
      liked: true,
    },
    {
      id: 102,
      user: "@anna.kim",
      realName: "Anna Kim",
      when: "5 ч",
      text: "Была там вчера, лапша действительно ручной работы, бульон очень наваристый. Рекомендую брать яйцо дополнительно!",
      likes: 8,
    },
    {
      id: 103,
      user: "@sarah.chen",
      realName: "Sarah Chen",
      when: "1 ч",
      replyTo: "@anna.kim",
      replyToCommentId: 102,
      text: "Да, яйцо у них просто отпад!",
      likes: 2,
    },
  ],
  2: [
    {
      id: 201,
      user: "@dasha.taste",
      realName: "Даша",
      when: "18 мин",
      text: "Маття прям насыщенная или скорее нежная? Хочу без лишней сладости.",
      likes: 5,
    },
    {
      id: 202,
      user: "@masha.eats",
      realName: "Маша Петрова",
      when: "12 мин",
      replyTo: "@dasha.taste",
      replyToCommentId: 201,
      text: "Скорее нежная, но вкус чая хорошо чувствуется. Сладость очень аккуратная.",
      likes: 11,
      liked: true,
    },
  ],
  3: [
    {
      id: 301,
      user: "@nino.food",
      realName: "Нино",
      when: "3 ч",
      text: "Подтверждаю, тесто у них одно из лучших в городе.",
      likes: 16,
      liked: true,
    },
    {
      id: 302,
      user: "@ilya.walks",
      realName: "Илья",
      when: "2 ч",
      text: "После такого фото придется менять планы на ужин.",
      likes: 7,
    },
  ],
  4: [
    {
      id: 401,
      user: "@vera.meat",
      realName: "Вера",
      when: "1 д",
      text: "У них еще картофель с розмарином отличный, если брать гарнир.",
      likes: 9,
    },
    {
      id: 402,
      user: "@nikita.grill",
      realName: "Никита",
      when: "23 ч",
      replyTo: "@vera.meat",
      replyToCommentId: 401,
      text: "Да, картофель тоже взял. Соус к нему отдельно просить обязательно.",
      likes: 4,
    },
  ],
};

export const POPULAR_TAGS: string[] = [
  "Рамён",
  "Суши",
  "Пицца",
  "Бургеры",
  "Паста",
  "Том-Ям",
  "Поке",
  "Шаурма",
];

export const RECENT_SEARCHES: string[] = [
  "рамен с уткой",
  "смэшбургер",
  "тирамису",
  "паста карбонара",
  "матча латте",
];
