# ✈️ Anga360 – Flight Search, Comparison & Airport Pickup Coordination

## 📌 Project Overview

Anga360 is a full-stack web application that brings flight options together in one place. Travellers can search for flights, compare prices and itineraries, and then coordinate airport pickup with the people waiting for them through a feature called **Trip Linking**.

The project demonstrates the use of React, FastAPI and a Supabase (PostgreSQL) database to build a functional, responsive web application that solves a real-world travel problem. It was built by the SDF-TFR18 capstone team at Moringa School.

## 🎯 Problem Statement

Finding a suitable flight means visiting many airline websites and travel platforms, and comparing the results by hand is slow. Once a flight is booked, the person collecting the traveller usually depends on repeated calls and messages to find out whether the plane has landed, is delayed, or when to leave for the airport.

Anga360 addresses both problems. It presents flight options in one interface with tools to sort, filter and compare, and Trip Linking keeps the traveller and their pickup person updated with clear, role-specific flight progress and pickup alerts. Anga360 does not sell tickets, process payments or manage reservations.

## ✨ Features

* Search one-way and round-trip flights with airport suggestions
* Validate user input before searching
* View airline, times, duration, stops and price for every result, with prices shown in Kenyan shillings
* Sort and filter results without repeating the search
* Compare up to three flights side by side
* Open a booking link to continue with the provider
* Register, log in and save flights to your own account
* Create a trip for a flight and share a short invite code with family, friends or drivers
* Follow a linked flight through clear stages (Departed, In the air, Landed, At the gate)
* "Leave now" pickup alerts and an "I'm out" update from the traveller
* Live flight positions from OpenSky Network on an interactive 3D globe
* Installable Progressive Web App with an offline banner
* Responsive design for mobile, tablet, and desktop

## 📄 Pages Included

* Home (/) – Introduces Anga360 and starts a search
* Search (/search) – Flight search form and results
* Details (/details) – Expanded information for a selected flight
* Compare (/compare) – Side-by-side comparison of selected flights
* Saved (/saved) – Flights saved to your account
* Linked Trips (/linked-trips) – Trips you are connected to, with status and role
* Live (/live) – Live flight information on the globe
* Login and Register (/login, /register) – Account pages

All pages are linked together and interact with the FastAPI backend.

## 🛠️ Technologies Used

* React 19 and Vite – Frontend interface and build tooling
* React Router – Page navigation
* Tailwind CSS – Styling and responsive layout
* CesiumJS – Interactive 3D globe
* vite-plugin-pwa – Installable app with offline support
* Python and FastAPI – Backend REST API
* Supabase (PostgreSQL) – Database, accessed through psycopg
* PyJWT and bcrypt – Token authentication and password hashing
* fast-flights and SerpApi – Google Flights data
* OpenSky Network – Live aircraft positions
* Vercel and Render – Hosting for the frontend and the backend

## 💾 Data Persistence

Accounts, saved flights, linked trips and invite codes are stored in a Supabase (PostgreSQL) database through the FastAPI backend. The base tables are created by the SQL scripts in `backend/db`, and the backend adds a few extra columns when it starts. Flight search results are fetched when needed, and the browser keeps recent searches briefly so repeat searches load quickly.

## 🚀 How to Run the Project

1. Clone the repository and open the project folder in VS Code
2. Install the frontend packages with `npm install`
3. Install the backend packages with `pip install -r backend/requirements.txt`
4. Create `backend/.env` with `DATABASE_URL` (your Supabase connection string), `JWT_SECRET` (a long random string), `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` (your OpenSky API client). Add `CORS_ORIGINS` when you deploy
5. Create the tables by running the SQL files in `backend/db` in the Supabase SQL editor
6. Start the backend from the `backend` folder with `uvicorn app:app --reload`
7. Start the frontend from the project root with `npm run dev`
8. Open the address Vite prints in your browser (usually `http://localhost:5173`)

Optional settings go in a `.env` file in the project root: `VITE_API_URL` (backend address, defaults to `http://127.0.0.1:8000`) and `VITE_CESIUM_TOKEN` (a Cesium ion token for globe imagery). Never commit `.env` files.

## 🔌 API Routes

All routes are under `/api`. Routes marked "Login" need a valid token in the `Authorization` header.

* GET /health – Check that the backend is running
* POST /api/signup – Create an account
* POST /api/login – Sign in and receive a token
* GET /api/flights – Search flights
* GET /api/rates – Exchange rates for price display
* GET /api/opensky/{kind} – Live aircraft data for the globe
* POST /api/saved-flights – Save a flight (Login)
* GET /api/saved-flights – List your saved flights (Login)
* DELETE /api/saved-flights/{key} – Remove a saved flight (Login)
* POST /api/invites – Create a trip invite code (Login)
* POST /api/invites/redeem – Join a trip with an invite code (Login)
* GET /api/trips – List your linked trips (Login)
* POST /api/trips/{trip_id}/payload – Share trip details or location (Login)
* DELETE /api/trips/{trip_id}/location/{kind} – Stop sharing a location (Login)

## ⚠️ Known Limitations

* fast-flights does not provide flight numbers or per-airline booking links
* Every SerpApi search uses part of a limited search quota
* Prices and availability can change, so every result shows when it was fetched
* No payments, ticket issuance or reservation management

## 📚 Learning Outcomes

* Building a full-stack application with React, FastAPI and PostgreSQL
* Integrating external data sources and normalising their responses
* Token-based authentication and role-based access
* Working with a 3D globe and live data
* Building an installable, offline-capable PWA
* Agile delivery with a Jira Scrum board, Git and GitHub

## 👥 Authors

* Lucky Brian Wekesa (Project Lead) - [wekesa.lucky@student.moringaschool.com](mailto:wekesa.lucky@student.moringaschool.com)
* Tedd Edwin (Scrum Master and Backend Lead) - [tedd.edwin@student.moringaschool.com](mailto:tedd.edwin@student.moringaschool.com)
* Sascha Mckayla (Frontend Lead) - [sascha.mckayla@student.moringaschool.com](mailto:sascha.mckayla@student.moringaschool.com)
* Patricia Ndung’u (Frontend Developer) - [patricia.ndungu@student.moringaschool.com](mailto:patricia.ndungu@student.moringaschool.com)

## 📦 GitHub Repository Description

A flight search, comparison and airport-pickup coordination app built with React, FastAPI and Supabase, with live flight tracking on a 3D globe.

## ✅ Final Note

This project was built as the SDF-TFR18 capstone at Moringa School and demonstrates full-stack development with external APIs, authentication and a Progressive Web App.

## 📜 License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files, to deal in the Software without restriction.