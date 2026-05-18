# Foody API — Frontend Developer Guide

> Base URL: `http://localhost:8000` (dev) / `https://api.foody.example.com` (prod)
> All endpoints are prefixed with `/api/v1/`
> Interactive docs (Swagger UI): `GET /api/docs/`
> OpenAPI schema (JSON): `GET /api/schema/`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users & Profiles](#2-users--profiles)
3. [Posts — Feed](#3-posts--feed)
4. [Posts — Create & Edit](#4-posts--create--edit)
5. [Posts — Actions (Like, Save, Comment)](#5-posts--actions-like-save-comment)
6. [Restaurants & Dishes](#6-restaurants--dishes)
7. [Categories](#7-categories)
8. [Moderation (Staff only)](#8-moderation-staff-only)
9. [Pagination](#9-pagination)
10. [Error Responses](#10-error-responses)
11. [Post Lifecycle](#11-post-lifecycle)
12. [Type Reference](#12-type-reference)

---

## 1. Authentication

### How it works

JWT Bearer tokens. Every request that requires auth must include:

```
Authorization: Bearer <access_token>
```

### Obtain tokens

```
POST /api/v1/auth/token/
Content-Type: application/json
Permission: public
```

**Request**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response `200`**
```json
{
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci..."
}
```

- Access token lifetime: **60 minutes**
- Refresh token lifetime: **1 day**

---

### Refresh access token

```
POST /api/v1/auth/token/refresh/
Content-Type: application/json
Permission: public
```

**Request**
```json
{
  "refresh": "eyJhbGci..."
}
```

**Response `200`**
```json
{
  "access": "eyJhbGci..."
}
```

**Recommended strategy:** store both tokens in memory or `httpOnly` cookies; silently refresh the access token before it expires (proactive refresh ~5 min before expiry), or catch `401` responses and retry with a fresh token.

---

## 2. Users & Profiles

### Register

```
POST /api/v1/users/register/
Content-Type: application/json
Permission: public
```

**Request**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "Secur3P@ss",
  "password_confirm": "Secur3P@ss",
  "full_name": "John Doe"
}
```

**Response `201`**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe"
}
```

**Validation errors `400`**
```json
{
  "email": ["This field must be unique."],
  "password": ["This password is too common."]
}
```

---

### Get / update current user profile

```
GET  /api/v1/users/me/
PATCH /api/v1/users/me/
Permission: IsAuthenticated
```

**Response / PATCH body** (all fields optional on PATCH)
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "bio_text": "Food lover from Moscow",
  "avatar": "http://localhost:8000/media/avatars/john.jpg",
  "birth_date": "1995-06-15",
  "date_joined": "2026-01-10T09:00:00Z"
}
```

To upload an avatar use `multipart/form-data` with field `avatar`.

---

## 3. Posts — Feed

### List approved posts (public feed)

```
GET /api/v1/posts/
Permission: IsAuthenticated (unauthenticated gets 401)
Pagination: cursor-based
```

**Query parameters**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by dish name or restaurant name |
| `cursor` | string | Opaque cursor from previous response |

**Response `200`**
```json
{
  "next": "http://localhost:8000/api/v1/posts/?cursor=cD01MA==",
  "previous": null,
  "results": [ /* Post[] */ ]
}
```

When `next` is `null` — you've reached the end of the feed.

---

### Retrieve single post

```
GET /api/v1/posts/{id}/
Permission: IsAuthenticated
```

Returns a single `Post` object (see [Type Reference](#12-type-reference)).

---

### Current user's posts (all statuses)

```
GET /api/v1/posts/my/
Permission: IsAuthenticated
Pagination: cursor-based
```

Shows the current user's own posts regardless of moderation status (`pending`, `approved`, `rejected`).
The `status` field is always present here.

---

### Saved posts

```
GET /api/v1/posts/saved/
Permission: IsAuthenticated
Pagination: cursor-based
```

Returns only `approved` posts that the current user has saved.

---

### Posts by a specific user

```
GET /api/v1/posts/user_posts/?user_id=42
Permission: IsAuthenticated
Pagination: cursor-based
```

Returns only `approved` posts by the target user.

**Error `400`** if `user_id` is missing.

---

## 4. Posts — Create & Edit

### Create post

```
POST /api/v1/posts/
Content-Type: multipart/form-data
Permission: IsAuthenticated
```

**Fields**

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `description` | yes | string | Post body text |
| `dish_name` | yes | string (max 50) | Auto-lowercased and trimmed on the server |
| `rating` | yes | float `0.0 – 10.0` | Your rating for this dish |
| `restaurant_id` | one of two | integer | Use existing restaurant |
| `restaurant_name` | one of two | string (max 255) | Auto-creates restaurant if not found; trimmed on server |
| `restaurant_address` | no | string (max 100) | Used only when creating a new restaurant |
| `price` | no | decimal string | Must be ≥ 0, e.g. `"12.99"` |
| `uploaded_images` | no | file[] | List of image files (`multipart`) |
| `tags_list` | no | string[] | Tag names; pass as repeated fields `tags_list=a&tags_list=b` |

> You must provide either `restaurant_id` **or** `restaurant_name`. Not both, not neither.

**Response `201`** — the created `Post` object with `status: "pending"`.

The post enters the moderation queue and is **not publicly visible** until a moderator approves it.

---

### Edit post

```
PATCH /api/v1/posts/{id}/
Content-Type: application/json or multipart/form-data
Permission: IsAuthenticated (author only)
```

Any post can be edited by its author. After editing, the post status resets to `"pending"` and re-enters the moderation queue.

**Editable fields**

| Field | Notes |
|-------|-------|
| `description` | |
| `price` | |
| `tags_list` | Replaces all existing tags |

Fields that **cannot** be changed after creation: `dish_name`, `restaurant_id`, `restaurant_name`, `rating`, `uploaded_images`.

After a successful edit the post status resets to `"pending"` and re-enters the moderation queue.

**Response `200`** — the updated `Post` object.

---

### Delete post

```
DELETE /api/v1/posts/{id}/
Permission: IsAuthenticated (author) or staff
```

**Response `204 No Content`**

---

## 5. Posts — Actions (Like, Save, Comment)

All toggle actions return the current state after the toggle.

### Like / unlike

```
POST /api/v1/posts/{id}/like/
Permission: IsAuthenticated
```

**Response `200`**
```json
{ "liked": true }
```
or
```json
{ "liked": false }
```

---

### Save / unsave

```
POST /api/v1/posts/{id}/save_post/
Permission: IsAuthenticated
```

**Response `200`**
```json
{ "saved": true }
```

---

### List comments

```
GET /api/v1/posts/{id}/comments/
Permission: IsAuthenticated
Pagination: cursor-based
```

Only works on `approved` posts. Returns `404` for `pending` or `rejected` posts.

**Response `200`**
```json
{
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 2,
      "username": "john_doe",
      "text": "Looks amazing!",
      "created_at": "2026-03-26T12:00:00Z"
    }
  ]
}
```

---

### Post comment

```
POST /api/v1/posts/{id}/comments/
Content-Type: application/json
Permission: IsAuthenticated
```

**Request**
```json
{ "text": "I need to try this!" }
```

**Response `201`**
```json
{
  "id": 5,
  "user": 3,
  "username": "jane_doe",
  "text": "I need to try this!",
  "created_at": "2026-03-26T15:30:00Z"
}
```

---

## 6. Restaurants & Dishes

These are **read-only** endpoints. Restaurants and dishes are created automatically when a post is submitted.

### List restaurants

```
GET /api/v1/restaurants/
Permission: IsAuthenticated
Pagination: page-based
```

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter by restaurant name |
| `page` | integer | Page number |

**Response `200`**
```json
{
  "count": 120,
  "next": "http://localhost:8000/api/v1/restaurants/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "KFC",
      "address": "Lenina 1",
      "categories": [
        { "id": 2, "name": "Fast Food" }
      ]
    }
  ]
}
```

---

### List dishes

```
GET /api/v1/dishes/
Permission: IsAuthenticated
Pagination: page-based
```

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter by dish name |
| `restaurant_id` | integer | Filter dishes by restaurant |
| `page` | integer | Page number |

**Response `200`**
```json
{
  "count": 45,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 10,
      "name": "zinger burger",
      "restaurant": 1,
      "categories": []
    }
  ]
}
```

---

## 7. Categories

Categories are managed by staff. Regular users can only read.

### List categories

```
GET /api/v1/categories/
Permission: IsAuthenticated
```

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter by name |

**Response `200`**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    { "id": 1, "name": "Italian" },
    { "id": 2, "name": "Fast Food" }
  ]
}
```

---

### Create / update / delete category (staff only)

```
POST   /api/v1/categories/           Permission: IsAdminUser
PATCH  /api/v1/categories/{id}/      Permission: IsAdminUser
DELETE /api/v1/categories/{id}/      Permission: IsAdminUser
```

---

## 8. Moderation (Staff only)

All moderation endpoints require `is_staff = true`. Regular users receive `403`.

### Pending queue

```
GET /api/v1/moderation/
Permission: IsAdminUser
Pagination: page-based (default 10 per page)
```

Returns posts with `status = "pending"`, ordered oldest-first (FIFO queue).

---

### Approve post

```
POST /api/v1/moderation/{id}/approve/
Permission: IsAdminUser
```

**Response `200`**
```json
{ "status": "approved" }
```

Post becomes publicly visible immediately.

---

### Reject post

```
POST /api/v1/moderation/{id}/reject/
Content-Type: application/json
Permission: IsAdminUser
```

**Request** (optional)
```json
{ "rejection_reason": "Inappropriate content" }
```

**Response `200`**
```json
{ "status": "rejected" }
```

The rejection reason is stored server-side for future notifications but is **not returned** in post API responses.

---

## 9. Pagination

### Cursor pagination (feeds, comments)

Used by: `GET /posts/`, `/posts/my/`, `/posts/saved/`, `/posts/user_posts/`, `/posts/{id}/comments/`

```json
{
  "next": "http://localhost:8000/api/v1/posts/?cursor=cD01MA==",
  "previous": null,
  "results": []
}
```

- Pass the entire `next` URL (or just the `cursor` param) to fetch the next page.
- When `next` is `null` there are no more results.
- Do **not** try to construct cursors manually — they are opaque.
- Default page size: **20**. Not configurable by the client.

### Page-number pagination (restaurants, dishes, categories, moderation)

```json
{
  "count": 120,
  "next": "http://localhost:8000/api/v1/restaurants/?page=2",
  "previous": null,
  "results": []
}
```

- Use `?page=N` to navigate.
- Default page size: **20** (moderation queue: **10**).

---

## 10. Error Responses

### Standard field validation error (`400`)

```json
{
  "field_name": ["Error message."],
  "another_field": ["Another error."]
}
```

### Non-field validation error (`400`)

```json
{
  "non_field_errors": ["Error message."]
}
```

or for custom errors from serializer:

```json
{
  "restaurant": ["Необходимо передать restaurant_id или restaurant_name."]
}
```

### Authentication errors

| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid/expired token |
| `403` | Authenticated but not authorised (e.g. editing someone else's post, non-staff hitting moderation) |

### Not found / gone

| Status | Meaning |
|--------|---------|
| `404` | Object not found, OR trying to comment on a non-approved post |

---

## 11. Post Lifecycle

```
User submits post
       |
       v
  status = "pending"   ← visible to author only (GET /posts/my/)
       |
  Moderator reviews (GET /moderation/)
       |
   ┌───┴───┐
   |       |
approve   reject
   |       |
   v       v
"approved" "rejected"
   |           |
Visible      Visible to
to all       author only

Author can edit any post → status resets to "pending"
```

**Rules for the frontend:**

- In `GET /posts/my/` — always show `status` badge so the user knows the state.
- In the public feed (`GET /posts/`) — only `approved` posts are returned; no need to filter client-side.
- After PATCH on a post — expect `status` to reset to `"pending"` in the response.
- The `status` field is present on all post responses, but it is most relevant in `my/` and moderation contexts.

---

## 12. Type Reference

### `Post`

```ts
interface Post {
  id: number;
  user: PostAuthor;
  restaurant: number;         // FK id
  restaurant_name: string;
  dish: number;               // FK id
  dish_name: string;
  description: string;
  price: string | null;       // decimal string, e.g. "12.99"
  created_at: string;         // ISO 8601
  images: PostImage[];
  statistics: PostStatistics;
  tags: Tag[];
  is_liked: boolean;
  is_saved: boolean;
  status: "pending" | "approved" | "rejected";
}
```

### `PostAuthor`

```ts
interface PostAuthor {
  id: number;
  username: string;
  avatar: string | null;      // full URL or null
}
```

### `PostImage`

```ts
interface PostImage {
  id: number;
  image: string;              // full URL
  uploaded_at: string;        // ISO 8601
}
```

### `PostStatistics`

```ts
interface PostStatistics {
  likes_count: number;
  saves_count: number;
  comments_count: number;
  rating: number;             // 0.0 – 10.0, average of all reviews
}
```

### `Tag`

```ts
interface Tag {
  id: number;
  name: string;
}
```

### `Restaurant`

```ts
interface Restaurant {
  id: number;
  name: string;
  address: string;
  categories: Category[];
}
```

### `Dish`

```ts
interface Dish {
  id: number;
  name: string;               // always lowercase (server-normalized)
  restaurant: number;         // FK id
  categories: Category[];
}
```

### `Category`

```ts
interface Category {
  id: number;
  name: string;
}
```

### `Comment`

```ts
interface Comment {
  id: number;
  user: number;               // FK id
  username: string;
  text: string;
  created_at: string;         // ISO 8601
}
```

### `User` (profile)

```ts
interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  bio_text: string;
  avatar: string | null;      // full URL or null
  birth_date: string | null;  // "YYYY-MM-DD"
  date_joined: string;        // ISO 8601
}
```

---

## Notes

- **Image uploads** always use `multipart/form-data`. For any request with images, do not send `Content-Type: application/json`.
- **Repeated form fields for arrays** — when using `multipart/form-data`, send list fields as repeated keys: `tags_list=italian&tags_list=vegan`.
- **Media files** — image URLs are absolute and already include the host. Render them directly in `<img src="...">`.
- **Rating** — displayed as `statistics.rating` (server-calculated average). The value a user submits when creating a post goes into `rating` (write-only), which creates a `PostReview`. These are different: one is input, the other is the computed average.
- **Dish names** — always come back lowercased (`"zinger burger"`, not `"Zinger Burger"`). Format for display on the client if needed.
- **CORS** — `localhost:3000` and `localhost:5173` are whitelisted. For other dev ports update the backend `.env`.
