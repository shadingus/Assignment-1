# Assignment 1 - "Yappers" Video/Chat System

## Flynn McCooke - s5307477

### Organisation of Git Repository
Upon initialisation, I created a `dev` branch to use as my development branch when developing the system.
Each time I would reach what I considered a key milestone in the system's progress, I would push that `dev` build to the `main` branch.
Updates were frequent and ranged in scale, varying from updates as small as singular CSS line changes, to full features being implemented across consecutive updates.
These updates were never specific to the frontend or backend. Whatever I felt like working on was whatever got updated.

### Description of Data Structures
In the client side, there are multiple data structures that represent `users`, `groups`, `channels`, and `messages`.
These structures are directly managed within Angular `components` and `LocalStorage`:
1. Users:
    - The `User` interface in the client defines the structure of a `user`, which includes an `id`, `username`, `email`, `password`, `role`, and the `groups` that the user belongs to.
2. Groups:
    - The `Group` interface defines a `group`, which contains a unique `id`, `name`, and an array of `channels`.
3. Channels:
    - The `Channels` interface represents an individual conversation space within a group. Each channel holds an array of `messages`.
4. Messages:
    - Within each channel is an array of messages. Each message contains the `username` of the sender and the contents of the message.
On the server side, the application currently manages the same entities, but handles them with JSON objects in memory.
1. Users:
    - Users are stored in an array on the server, represented as JSON objects. The `user` object includes an `id`, `username`, `email`, `password`, `role`, and a list of `groups`.
2. Groups (Handled explicitly in the frontend):
    - Once implemented into the backend in A2, groups will follow a similar format on the server, where each group contains an `id`, `name`, and array of `channels`.
3. Channels (same current functionality as groups):
    - Channels will be represented as an array within each group, containing an `id`, `name`, and `messages`.
4. Messages:
    - Messages are stored as objects within the `messages` array inside each `channel`.
The server currently only handles the user registration. For the sake of static functionality, registration was the only function created to be fully operational on the backend.
This way, users can freely log in and out of the system, with the backend verifying that each user was created correctly and that the login implementation works as intended.
1. User Registration (`'/register'`):
    - When a new user is created by the `Super Admin`, their data (`username`, `email`, `password`, `role`, and `groups`) is sent to the server via a `POST` request. The server generates a new `user ID` and stores the user in the `users` array.

### Angular Architecture

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
