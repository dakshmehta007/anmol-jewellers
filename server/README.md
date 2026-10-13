# Anmol Jewellers API (Express + MongoDB)

    cd server
    npm install
    cp .env.example .env      (Windows: copy .env.example .env) then fill in MONGODB_URI and JWT_SECRET
    npm run dev

Check it works: open http://localhost:5000/api/health  ->  {"ok":true}

Endpoints
- POST /api/auth/signup | /login | /logout, GET /api/auth/me
- POST /api/selections, GET /api/selections   (login required)
