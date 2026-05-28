require('dotenv').config();

// PostgreSQL connection
require('./src/config/db');

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const hospitalRoutes = require('./src/routes/hospitalRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

const app = express();

const PORT =
  process.env.PORT || 3000;

/* -----------------------------
   Middleware
----------------------------- */

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(cookieParser());

/* -----------------------------
   Static Frontend
----------------------------- */

app.use(
  express.static(
    path.join(
      __dirname,
      'public'
    )
  )
);

/* -----------------------------
   API Routes
----------------------------- */

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/hospitals',
  hospitalRoutes
);

app.use(
  '/api/bookings',
  bookingRoutes
);

app.use(
  '/api/reviews',
  reviewRoutes
);

/* -----------------------------
   Frontend Routes
----------------------------- */

app.get('/', (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      'public',
      'index.html'
    )
  );
});

app.get(
  '/search',
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        'public',
        'search.html'
      )
    );
  }
);

app.get(
  '/hospital/:id',
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        'public',
        'hospital.html'
      )
    );
  }
);

app.get('/admin', (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      'public',
      'admin.html'
    )
  );
});

app.get('/login', (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      'public',
      'login.html'
    )
  );
});

app.get(
  '/register',
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        'public',
        'register.html'
      )
    );
  }
);

/* -----------------------------
   Health Check
----------------------------- */

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      status: 'ok',
      database:
        'connected'
    });
  }
);

/* -----------------------------
   Global Error Handler
----------------------------- */

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      err.stack
    );

    res.status(500).json({
      error:
        'Something went wrong on the server!'
    });
  }
);

/* -----------------------------
   Start Server
----------------------------- */

app.listen(PORT, () => {
  console.log(
    '========================================'
  );

  console.log(
    '   MediLink Server Running Successfully'
  );

  console.log(
    `   Local URL: http://localhost:${PORT}`
  );

  console.log(
    '========================================'
  );
});