export const MOCK_DIAGRAM = `@startuml
title Демонстрация всех элементов PlantUML

' ── Все типы участников ──────────────────────────────────────
actor       "Actor"       as actor
boundary    "Boundary"    as boundary
control     "Control"     as control
entity      "Entity"      as entity
database    "Database"    as db
collections "Collections" as coll
queue       "Queue"       as queue
participant "Participant" as part

' ── Боксы (группировка участников) ──────────────────────────
box "Frontend"
  participant "Browser" as browser
  participant "UI Layer" as ui
end box

box "Backend"
  participant "API"     as api
  participant "Worker"  as worker
end box

== Типы стрелок ==

actor ->    boundary : Сплошная →
actor -->   control  : Пунктирная -->
actor ->>   entity   : Сплошная ->>
actor -->>  db       : Пунктирная -->>
actor ->o   coll     : С кружком ->o
actor ->x   queue    : С крестом ->x
actor -\\   part     : Асинхронная -\\
actor --\\  browser  : Пунктир асинхронная --\\
actor /->   ui       : Нижняя /->
actor /-->  api      : Нижняя пунктир /-->
actor //->  worker   : Двойная нижняя //->`  + `

== Примечания (Notes) ==

note left of actor      : Примечание\\nслева
note right of boundary  : Примечание\\nсправа
note over control, entity : Примечание над\\nнесколькими участниками

actor -> boundary : Сообщение с примечанием
note right : Короткое примечание к сообщению

== Активация ==

actor -> api : Запрос
activate api

api -> worker : Делегирование
activate worker

worker --> api : Результат
deactivate worker

api --> actor : Ответ
deactivate api

== Группы ==

alt Успешный сценарий
  actor -> api : GET /data
  api --> actor : 200 OK
else Ошибка авторизации
  actor -> api : GET /data
  api --> actor : 401 Unauthorized
else Ошибка сервера
  api --> actor : 500 Server Error
end

opt Необязательный шаг
  actor -> ui : Показать детали
end

loop Каждые 5 секунд
  browser -> api : Polling
  api --> browser : Данные
end

par Параллельно
  actor -> api    : Запрос A
  actor -> worker : Запрос B
end

break При критической ошибке
  api -> actor : Notify error
  actor -> actor : Логировать
end

critical Критическая секция
  api -> db : Транзакция
end

== Задержки и разделители ==

...Пауза 3 сек...

|||

== Нумерация ==

autonumber 10 10
actor -> api    : Шаг 1
api   -> worker : Шаг 2
autonumber stop

== Ссылка на другую диаграмму ==

ref over api, worker
  Подробнее: Worker Flow v2.0
end ref

== Возврат ==

actor ->  api : Прямой вызов
return Немедленный возврат

@enduml`;
