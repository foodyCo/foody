import sys

with open('/home/jeka/foodyFront/frontend/src/app/actions/post.ts', 'r') as f:
    content = f.read()

content = content.replace('''export async function getTags() {
    try {
        const data = await apiRequest("/tags/");''', '''export async function getTags(accessToken?: string) {
    try {
        const options: any = {};
        if (accessToken) options.headers = { "Authorization": `Bearer ${accessToken}` };
        const data = await apiRequest("/tags/", options);''')

content = content.replace('''export async function getCategories() {
    try {
        const data = await apiRequest("/categories/");''', '''export async function getCategories(accessToken?: string) {
    try {
        const options: any = {};
        if (accessToken) options.headers = { "Authorization": `Bearer ${accessToken}` };
        const data = await apiRequest("/categories/", options);''')

with open('/home/jeka/foodyFront/frontend/src/app/actions/post.ts', 'w') as f:
    f.write(content)
