# CORS Configuration Guide

## Problem
When making requests from `localhost:3000` to AWS API Gateway, you're getting CORS errors because the API Gateway endpoint doesn't allow cross-origin requests from your local development server.

## Solution: Configure CORS on API Gateway

Your AWS API Gateway endpoint needs to return the following CORS headers:

### Required Headers for OPTIONS (Preflight) Request:
- `Access-Control-Allow-Origin: http://localhost:3000` (or `*` for all origins - not recommended for production)
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
- `Access-Control-Allow-Credentials: true` (REQUIRED when using `credentials: 'include'`)

### Required Headers for Actual Request Response:
- `Access-Control-Allow-Origin: http://localhost:3000` (must match the exact origin, not `*` when using credentials)
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Expose-Headers: Set-Cookie` (if setting cookies)

## How to Configure in AWS API Gateway

### Option 1: Enable CORS in API Gateway Console
1. Go to your API Gateway in AWS Console
2. Select your API and the resource (`/auth/v1/exchange-token`)
3. Click "Actions" → "Enable CORS"
4. Configure:
   - Access-Control-Allow-Origin: `http://localhost:3000`
   - Access-Control-Allow-Headers: `Content-Type`
   - Access-Control-Allow-Methods: `POST, OPTIONS`
   - Access-Control-Allow-Credentials: `true`
5. Deploy the API

### Option 2: Configure in Lambda Function Response
If you're handling CORS in your Lambda function, ensure it returns:

```javascript
// For OPTIONS request (preflight)
if (event.httpMethod === 'OPTIONS') {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: '',
  };
}

// For actual POST request
return {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(responseData),
};
```

## Important Notes

1. **When using `credentials: 'include'`**, the `Access-Control-Allow-Origin` header **cannot** be `*`. It must be the specific origin (`http://localhost:3000`).

2. **For production**, you'll need to add your production domain to the allowed origins:
   - `https://sample-react-site-rho.vercel.app`

3. **Multiple origins**: If you need to support multiple origins, you can check the `Origin` header in your Lambda and return the appropriate value.

## Testing

After configuring CORS, test the endpoint:
```bash
curl -X OPTIONS https://b1vxqylf5h.execute-api.us-east-1.amazonaws.com/auth/v1/exchange-token \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

You should see the CORS headers in the response.

