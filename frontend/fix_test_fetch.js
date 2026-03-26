async function run() {
    const res = await fetch('http://backend:8000/api/v1/posts/?restaurant_id=12', { headers: { 'Authorization': 'Bearer asd' }, cache: 'no-store' });
    console.log(res.status, await res.text());
}
run();
