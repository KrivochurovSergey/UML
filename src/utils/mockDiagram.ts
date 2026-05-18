export const MOCK_DIAGRAM = `@startuml
actor User
participant "Web App" as App
participant "Auth Service" as Auth
database "Database" as DB

User -> App: Ввод логина и пароля
activate App

App -> Auth: POST /login (credentials)
activate Auth

Auth -> DB: SELECT user WHERE email = ?
activate DB
DB --> Auth: Данные пользователя
deactivate DB

alt Учётные данные верны
    Auth -> Auth: Генерация JWT-токена
    Auth --> App: 200 OK + token
    App --> User: Перенаправление в личный кабинет
else Неверные данные
    Auth --> App: 401 Unauthorized
    App --> User: Сообщение об ошибке
end

deactivate Auth
deactivate App
@enduml`;
