export interface User {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    bio?: string;
    stats?: {
        posts: number;
        followers: number;
        following: number;
    };
}

export interface Restaurant {
    id: string;
    name: string;
    username?: string;
    location: { lat: number; lng: number };
    address: string;
}

export interface Dish {
    id: string;
    type: "user_post" | "restaurant_dish";
    imageUrl: string;
    images: string[];
    title: string;
    description: string;
    userRating: number;
    matchScore: number;
    author: User;
    restaurant: Restaurant;
    stats: {
        likes: number;
        comments?: number; // Optional: number of comments on the dish
        calories: number;
        protein: number;
        fat: number;
        carbs: number;
    };
    tags: string[];
    createdAt: string;
    reviewCount?: number;
    latestPost?: any;
    isLiked?: boolean;
    isSaved?: boolean;
}

export const MOCK_USERS: User[] = [
    { id: "u1", name: "Alex Foodie", avatar: "https://i.pravatar.cc/150?u=u1" },
    { id: "u2", name: "Maria Taste", avatar: "https://i.pravatar.cc/150?u=u2" },
    { id: "u3", name: "John Chef", avatar: "https://i.pravatar.cc/150?u=u3" },
];

export const MOCK_RESTAURANTS: Restaurant[] = [
    { id: "r1", name: "Burger King", location: { lat: 55.7, lng: 37.6 }, address: "Lenina St, 10" },
    { id: "r2", name: "Sushi Master", location: { lat: 55.75, lng: 37.62 }, address: "Pushkina St, 5" },
    { id: "r3", name: "Pizza Hut", location: { lat: 55.72, lng: 37.58 }, address: "Tverskaya St, 22" },
];

export const MOCK_DISHES: Dish[] = [
    {
        id: "1",
        type: "user_post",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"
        ],
        title: "Juicy Cheeseburger",
        description: "The best burger I've ever had! The cheese is melting perfectly.",
        userRating: 9,
        matchScore: 98,
        author: MOCK_USERS[0],
        restaurant: MOCK_RESTAURANTS[0],
        stats: { likes: 120, comments: 10, calories: 850, protein: 45, fat: 50, carbs: 60 },
        tags: ["burger", "meat", "fastfood"],
        createdAt: "2023-10-25T12:00:00Z",
    },
    {
        id: "2",
        type: "user_post",
        imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80"
        ],
        title: "California Roll",
        description: "Fresh and delicious sushi. Highly recommend!",
        userRating: 8,
        matchScore: 85,
        author: MOCK_USERS[1],
        restaurant: MOCK_RESTAURANTS[1],
        stats: { likes: 85, comments: 5, calories: 320, protein: 12, fat: 8, carbs: 45 },
        tags: ["sushi", "japanese", "seafood"],
        createdAt: "2023-10-24T18:30:00Z",
    },
    {
        id: "3",
        type: "user_post",
        imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=800&q=80"
        ],
        title: "Pepperoni Pizza",
        description: "Classic pepperoni with extra cheese. Can't go wrong.",
        userRating: 10,
        matchScore: 92,
        author: MOCK_USERS[2],
        restaurant: MOCK_RESTAURANTS[2],
        stats: { likes: 210, comments: 20, calories: 1200, protein: 50, fat: 60, carbs: 110 },
        tags: ["pizza", "italian", "cheese"],
        createdAt: "2023-10-26T14:15:00Z",
    },
    {
        id: "4",
        type: "user_post",
        imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"
        ],
        title: "BBQ Ribs",
        description: "Fall-off-the-bone tender ribs with a smoky BBQ sauce.",
        userRating: 9,
        matchScore: 78,
        author: MOCK_USERS[0],
        restaurant: MOCK_RESTAURANTS[0],
        stats: { likes: 150, comments: 15, calories: 950, protein: 60, fat: 55, carbs: 30 },
        tags: ["bbq", "meat", "dinner"],
        createdAt: "2023-10-23T19:00:00Z",
    },
    {
        id: "5",
        type: "user_post",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
        images: [
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
        ],
        title: "Healthy Salad Bowl",
        description: "A refreshing mix of greens, avocado, and quinoa.",
        userRating: 7,
        matchScore: 65,
        author: MOCK_USERS[1],
        restaurant: MOCK_RESTAURANTS[1],
        stats: { likes: 45, comments: 8, calories: 350, protein: 10, fat: 15, carbs: 40 },
        tags: ["healthy", "vegan", "salad"],
        createdAt: "2023-10-27T10:00:00Z",
    },
];
export const CATEGORIES = [
    "Все",
    "Бургеры",
    "Суши",
    "Пицца",
    "Рамен",
    "Шаурма",
    "Хот-дог",
    "Наггетсы",
    "Bubble Tea",
    "Стейки",
    "Паста",
    "Салаты",
    "Десерты",
    "Напитки",
    "Завтраки",
    "Кофе"
];
