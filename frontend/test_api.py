import requests

url = "http://127.0.0.1:8000/api/v1/posts/"
data = {
    "dish_name": "Test Dish",
    "description": "",
    "taste": 5.0,
    "appearance": 5.0,
    "satiety": 5.0,
    "restaurant_name": "Test Rest"
}

# We need a token or we can just send the request to see validation errors (HTTP 401 maybe, but let's mock the user or hit a public endpoint if possible to see if it responds with "This field is required" or "Unauthorized" first)
response = requests.post(url, data=data)
print(response.status_code)
print(response.text)
