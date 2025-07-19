# Poster Dashboard API Documentation

===========================
🔐 Authentication APIs
===========================

## POST   /api/auth/register
- **Description**: Register user
- **Body**: { name, email, password }

## POST   /api/auth/login
- **Description**: Login user
- **Body**: { email, password }

## GET    /api/auth/profile
- **Description**: Get logged-in user profile

## GET    /api/auth/logout
- **Description**: Logout user


===========================
🖼️ Poster APIs
===========================

## POST   /api/posters/upload
- **Description**: Upload poster with placeholders
- **Form-Data**:
    - image (file)
    - category (string)
    - placeholders (JSON string)

## GET    /api/posters/:category/:customerId
- **Description**: Get posters by category with customized customer data

### Example Placeholders:
```json
[
  { "key": "companyName", "x": 50, "y": 100 },
  { "key": "whatsapp", "x": 150, "y": 200 }
]
```


===========================
👤 Customer APIs
===========================

## POST   /api/customers/add
- **Description**: Add a new customer
- **Form-Data**:
    - companyName
    - logo (file)
    - website
    - whatsapp


===========================
🗓️ Schedule APIs
===========================

## POST   /api/schedules/create
- **Description**: Create a schedule for posters
- **Body**:
    - customerId
    - posterId
    - category
    - dates (array of strings)

## GET    /api/schedules/customer/:customerId
- **Description**: Get all schedules for a customer

### Example Dates:
```json
["2025-05-02", "2025-05-05"]
```


===========================
📊 Dashboard API
===========================

## GET    /api/dashboard/
- **Description**: Get dashboard metrics


===========================
✅ Sample POSTER Upload via POSTMAN
===========================

## POST /api/posters/upload
- **Form-Data**:
    - image: [file]
    - category: Festival
    - placeholders:
      ```json
      [
        { "key": "companyName", "x": 100, "y": 200 },
        { "key": "whatsapp", "x": 150, "y": 300 }
      ]
      ```

### Response:
```json
{
  "message": "Poster uploaded successfully",
  "poster": {
    "_id": "xxx",
    "category": "Festival",
    "imageUrl": "uploads/poster.jpg",
    "placeholders": [...]
  }
}
```


===========================
✅ Sample GET Poster with Customer Data
===========================

## GET /api/posters/Festival/66400bd1a1b...

### Response:
```json
[
  {
    "_id": "posterId",
    "imageUrl": "uploads/poster.jpg",
    "category": "Festival",
    "customizedData": {
      "companyName": {
        "value": "Acme Ltd",
        "x": 100,
        "y": 200
      },
      "whatsapp": {
        "value": "+91-9999999999",
        "x": 150,
        "y": 300
      }
    }
  }
]
```


===========================
🌐 How to Call Backend APIs from Frontend
===========================

### Example: Fetching Posters by Category and Customer ID

Here’s how you can call the backend API from the frontend using `fetch` in JavaScript:

```javascript
const fetchPosters = async (category, customerId) => {
  try {
    const response = await fetch(`/api/posters/${category}/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posters');
    }

    const data = await response.json();
    console.log('Posters:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Example usage
fetchPosters('Festival', '66400bd1a1b...');
```

### Example: Uploading a Poster

Here’s how you can upload a poster using `FormData`:

```javascript
const uploadPoster = async (file, category, placeholders) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('category', category);
  formData.append('placeholders', JSON.stringify(placeholders));

  try {
    const response = await fetch('/api/posters/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload poster');
    }

    const data = await response.json();
    console.log('Upload Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Example usage
const file = document.querySelector('#posterFile').files[0];
const category = 'Festival';
const placeholders = [
  { key: 'companyName', x: 100, y: 200 },
  { key: 'whatsapp', x: 150, y: 300 },
];
uploadPoster(file, category, placeholders);
```

### Notes:
- Replace `/api` with the full backend URL if the frontend and backend are hosted on different domains.
- Use a library like `axios` if you prefer a more feature-rich HTTP client.