export interface Snippet {
  label: string;
  description: string;
  code: string;
}

export interface SnippetGroup {
  title: string;
  items: Snippet[];
}

export const SNIPPET_GROUPS: SnippetGroup[] = [
  {
    title: 'Участники',
    items: [
      {
        label: 'Actor',
        description: 'Пользователь / внешняя система',
        code: 'actor "Имя" as a',
      },
      {
        label: 'Participant',
        description: 'Стандартный участник',
        code: 'participant "Имя" as p',
      },
      {
        label: 'Boundary',
        description: 'Граничный объект (UI, API)',
        code: 'boundary "Имя" as b',
      },
      {
        label: 'Control',
        description: 'Управляющий объект',
        code: 'control "Имя" as c',
      },
      {
        label: 'Entity',
        description: 'Объект предметной области',
        code: 'entity "Имя" as e',
      },
      {
        label: 'Database',
        description: 'База данных',
        code: 'database "Имя" as db',
      },
      {
        label: 'Queue',
        description: 'Очередь сообщений',
        code: 'queue "Имя" as q',
      },
    ],
  },
  {
    title: 'Стрелки',
    items: [
      {
        label: 'Синхронный вызов',
        description: 'Сплошная стрелка с ответом',
        code: 'A -> B : запрос\nB --> A : ответ',
      },
      {
        label: 'Асинхронный вызов',
        description: 'Стрелка без ожидания ответа',
        code: 'A ->> B : событие',
      },
      {
        label: 'Активация',
        description: 'Вызов с активацией объекта',
        code: 'A -> B : вызов\nactivate B\nB --> A : ответ\ndeactivate B',
      },
      {
        label: 'Self-call',
        description: 'Рекурсивный вызов',
        code: 'A -> A : внутренний вызов',
      },
    ],
  },
  {
    title: 'Группировка',
    items: [
      {
        label: 'Box',
        description: 'Группировка участников',
        code: 'box "Название"\n  participant "A" as a\n  participant "B" as b\nend box',
      },
      {
        label: 'Loop',
        description: 'Цикл',
        code: 'loop N раз\n  A -> B : итерация\nend',
      },
      {
        label: 'Alt / Else',
        description: 'Условное ветвление',
        code: 'alt успешно\n  A -> B : запрос\nelse ошибка\n  A -> B : повтор\nend',
      },
      {
        label: 'Opt',
        description: 'Опциональный блок',
        code: 'opt условие\n  A -> B : необязательный шаг\nend',
      },
      {
        label: 'Par',
        description: 'Параллельное выполнение',
        code: 'par поток 1\n  A -> B : шаг 1\nelse поток 2\n  A -> C : шаг 2\nend',
      },
      {
        label: 'Break',
        description: 'Прерывание сценария',
        code: 'break при ошибке\n  A -> B : откат\nend',
      },
    ],
  },
  {
    title: 'Оформление',
    items: [
      {
        label: 'Note',
        description: 'Примечание справа',
        code: 'note right of A\n  текст примечания\nend note',
      },
      {
        label: 'Note over',
        description: 'Примечание над участником',
        code: 'note over A, B\n  текст примечания\nend note',
      },
      {
        label: 'Разделитель',
        description: 'Горизонтальный разделитель',
        code: '== Название этапа ==',
      },
      {
        label: 'Ref',
        description: 'Ссылка на другую диаграмму',
        code: 'ref over A, B\n  см. диаграмму X\nend ref',
      },
      {
        label: 'Autonumber',
        description: 'Автонумерация сообщений',
        code: 'autonumber',
      },
      {
        label: 'Hide footbox',
        description: 'Скрыть нижние подписи',
        code: 'hide footbox',
      },
      {
        label: 'Разрез (cut)',
        description: 'Разбить диаграмму на части для экспорта',
        code: '--- cut ---',
      },
    ],
  },
];
