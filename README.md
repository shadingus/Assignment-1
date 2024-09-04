# Assignment 1 - "Yappers" Video/Chat System

## Flynn McCooke - s5307477

### Organisation of Git Repository
Upon initialisation, I created a `dev` branch to use as my development branch when developing the system.
Each time I would reach what I considered a key milestone in the system's progress, I would push that `dev` build to the `main` branch.
Updates were frequent and ranged in scale, varying from updates as small as singular CSS line changes, to full features being implemented across consecutive updates.
These updates were never specific to the frontend or backend. Whatever I felt like working on was whatever got updated.

### Description of Data Structures

#### In the client side, there are multiple data structures that represent `users`, `groups`, `channels`, and `messages`. These structures are directly managed within Angular `components`, `localStorage`, and `sessionStorage`:

1. Users:
    - The `User` interface within the `DashboardComponent` in the client defines the structure of a `user`, which includes an `id`, `username`, `email`, `password`, `role`, and the `groups` that the user belongs to.
    - In the `LoginComponent`, a list of users is retrieved and stored in LocalStorage via the `LocalStorageService`.
    - This list of users contains objects that follow the User interface structure.
2. Groups:
    - The `Group` interface defines a `group`, which contains a unique `id`, `name`, and an array of `channels`.
3. Channels:
    - The `Channels` interface represents an individual conversation space within a group. Each channel holds an array of `messages`.
4. Messages:
    - Within each channel is an array of messages. Each message contains the `username` of the sender and the contents of the message.
5. Session Management:
    - Upon successful login, the authenticated user’s data (retrieved from `LocalStorage`) is stored in `sessionStorage`.
    - This allows the user’s session to persist across different pages of the application during their browsing session.
6. User Authentication Operation:
    - The `onLogin()` method handles the authentication. It checks the entered `username` and `password` against the list of users in `LocalStorage`.
    - If a match is found, it logs in the `user` by saving their details in `sessionStorage` and redirects them to the dashboard.

#### On the server side, the application currently manages the same entities, but handles them with JSON objects in memory.

1. Users:
    - Users are stored in an array on the server, represented as JSON objects. The `user` object includes an `id`, `username`, `email`, `password`, `role`, and a list of `groups`.
2. Groups (Handled explicitly in the frontend):
    - Once implemented into the backend in A2, groups will follow a similar format on the server, where each group contains an `id`, `name`, and array of `channels`.
3. Channels (same current functionality as groups):
    - Channels will be represented as an array within each group, containing an `id`, `name`, and `messages`.
4. Messages:
    - Messages are stored as objects within the `messages` array inside each `channel`.

#### The server currently only handles the user registration. For the sake of static functionality, registration was the only function created to be fully operational on the backend. This way, users can freely log in and out of the system, with the backend verifying that each user was created correctly and that the login implementation works as intended.

1. User Registration (`'/register'`):
    - When a new user is created by the `Super Admin`, their data (`username`, `email`, `password`, `role`, and `groups`) is sent to the server via a `POST` request. The server generates a new `user ID` and stores the user in the `users` array.

### Angular Architecture

1. Login Component:
    - Handles user login functionality. It captures the user’s credentials (`username` and `password`), authenticates them against stored data, and manages navigation to the dashboard.
2. Dashboard Component:
    - Displays user-specific data, such as `groups`, `channels`, and `messages`. It allows the user to interact with the system, such as sending `messages`, managing `groups`, and promoting other `users` (for admins).
3. LocalStorageService:
    - A custom service that handles data persistence by interacting with the browser's `LocalStorage`. It provides methods to retrieve and store data (e.g., `users`, `groups`) for use across the application.
4. Routing:
    - After successfully logging in via the `LoginComponent`, the user is routed to the `DashboardComponent` using the `Router`.

### Node Server Architecture

1. Modules:
    - `Express`: Used to set up the server and define routes for handling HTTP requests.
    - `CORS`: Middleware to enable Cross-Origin Resource Sharing, allowing requests from different domains.
    - `Body-Parser`: Middleware to handle parsing of incoming request bodies (e.g., form data and JSON).
    - `Path`: Provides utilities for working with file and directory paths, such as serving static files.
2. Functions:
    - `app.get('/')`: Handles the GET request to serve the main index.html file.
    - `app.post('/register')`: Handles user registration by capturing form data (username, email, password, etc.), creating a new user, and adding it to the in-memory users array.
3. Files:
    - The `server.js` file serves static files from a specified path (staticPath), which points to the frontend (Angular build) directory.
4. Global Variables:
    - `users`: An in-memory array storing user objects (id, username, email, password, role, groups) that simulates user data storage.
