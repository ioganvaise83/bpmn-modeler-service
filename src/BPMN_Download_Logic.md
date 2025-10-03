# Логика работы кнопки "⬇️ Скачать BPMN"

## Обзор
Кнопка "⬇️ Скачать BPMN" позволяет пользователю скачать текущую BPMN диаграмму в формате XML файла.

## Изначальное состояние кнопки

### Почему кнопка неактивна изначально:
```html
<li><a id="js-download-diagram" href="#">⬇️ Скачать BPMN</a></li>
```

**Причины неактивности:**
1. **Отсутствует атрибут `class="active"`** - кнопка визуально выделяется только при наличии этого класса
2. **Пустой href="#"** - ссылка указывает на текущую страницу, не инициируя скачивание
3. **Отсутствует атрибут `download`** - без этого атрибута браузер не поймет, что нужно скачать файл

## Активация кнопки

### Функция `setEncoded()`
```javascript
function setEncoded(link, name, data) {
  const encodedData = encodeURIComponent(data);
  if (data) {
    link.classList.add('active');
    link.setAttribute('href', 'data:text/xml;charset=UTF-8,' + encodedData);
    link.setAttribute('download', name);
  } else {
    link.classList.remove('active');
  }
}
```

**Что происходит при активации:**
1. **Добавляется класс `active`** - кнопка становится визуально активной
2. **Устанавливается data URL** - `href` содержит полные данные диаграммы в формате:
   ```
   data:text/xml;charset=UTF-8,<закодированные_данные>
   ```
3. **Добавляется атрибут `download`** - указывает имя файла при скачивании

## Механизм скачивания

### Принцип работы:
1. **Data URL схема** - `data:text/xml;charset=UTF-8,<данные>`
   - `data:` - указывает, что данные встроены в URL
   - `text/xml` - MIME тип содержимого
   - `charset=UTF-8` - кодировка символов
   - `<данные>` - закодированные XML данные диаграммы

2. **Автоматическое скачивание** - при клике браузер:
   - Распознает атрибут `download="diagram.bpmn"`
   - Предлагает сохранить файл с указанным именем
   - Создает файл с полным содержимым диаграммы

## Момент и контекст вызова функции `setEncoded()`

### Автоматический вызов через событие `commandStack.changed`

Функция `setEncoded()` вызывается **автоматически** при любом изменении диаграммы через механизм событий BPMN модельера:

#### 1. Установка слушателя событий (`setupUI()`)
```javascript
// Инициализируем modeler и устанавливаем слушатель событий
await initializeModeler();
modeler.on('commandStack.changed', exportArtifacts);
```

**Что происходит:**
- `modeler.on()` - подписывается на внутренние события BPMN модельера
- `'commandStack.changed'` - событие срабатывает при любом изменении диаграммы
- `exportArtifacts` - функция-обработчик, которая будет вызвана

#### 2. Момент вызова `exportArtifacts()`
Функция вызывается в следующих ситуациях:
- **Добавление элемента** на диаграмму (задача, шлюз, событие и т.д.)
- **Удаление элемента** с диаграммы
- **Перемещение элемента** по холсту
- **Изменение свойств** элемента (название, параметры)
- **Соединение/отсоединение** элементов
- **Любая другая модификация** диаграммы

#### 3. Debounce механизм (задержка 500мс)
```javascript
const exportArtifacts = debounce(async () => {
  // ... логика экспорта ...
}, 500);
```

**Зачем нужна задержка:**
- **Предотвращает избыточные вызовы** при множественных быстрых изменениях
- **Группирует операции** - если пользователь делает несколько изменений подряд, экспорт выполнится только один раз
- **Экономит ресурсы** - не вызывает `modeler.saveXML()` при каждом мелком изменении
- **Улучшает UX** - кнопки активируются только после завершения всех изменений

### Конкретные места вызова `setEncoded()`

#### Успешное выполнение экспорта BPMN:
```javascript
try {
  const result = await modeler.saveXML({ format: true });
  const { xml, warnings } = result;

  // Валидация данных
  if (typeof xml !== 'string') {
    throw new Error(`XML должен быть строкой, а не ${typeof xml}`);
  }

  if (!xml.trim()) {
    throw new Error('XML пустой — возможно, диаграмма не содержит элементов.');
  }

  // ✅ АКТИВАЦИЯ КНОПКИ
  setEncoded(document.querySelector('#js-download-diagram'), 'diagram.bpmn', xml);
} catch (err) {
  // ❌ ДЕАКТИВАЦИЯ КНОПКИ ПРИ ОШИБКЕ
  setEncoded(document.querySelector('#js-download-diagram'), 'diagram.bpmn', null);
}
```

#### Обработка ошибок экспорта BPMN:
```javascript
} catch (err) {
  console.error('Ошибка при сохранении XML:', err);
  // Деактивация кнопки при любой ошибке
  setEncoded(document.querySelector('#js-download-diagram'), 'diagram.bpmn', null);
}
```

#### Аналогичный механизм для SVG:
```javascript
try {
  const { svg } = await modeler.saveSVG();
  // Активация кнопки скачивания SVG
  setEncoded(document.querySelector('#js-download-svg'), 'diagram.svg', svg);
} catch (err) {
  console.error('Ошибка при сохранении SVG:', err);
  // Деактивация кнопки при ошибке
  setEncoded(document.querySelector('#js-download-svg'), 'diagram.svg', null);
}
```

## Последовательность вызова функций

### 1. Инициализация (`setupUI()`)
```javascript
// Инициализируем modeler и устанавливаем слушатель событий
await initializeModeler();
modeler.on('commandStack.changed', exportArtifacts);
```

### 2. Загрузка диаграммы (`loadDiagram()` → `openDiagram()`)
```javascript
// При успешной загрузке диаграммы
document.querySelector('#save-button').disabled = false;
```

### 3. Автоматический вызов `exportArtifacts()`
При любом изменении диаграммы (`commandStack.changed`):
```javascript
const exportArtifacts = debounce(async () => {
  // ... обработка ошибок ...

  try {
    const result = await modeler.saveXML({ format: true });
    const { xml, warnings } = result;

    // Проверки корректности XML
    if (typeof xml !== 'string') {
      throw new Error(`XML должен быть строкой, а не ${typeof xml}`);
    }

    if (!xml.trim()) {
      throw new Error('XML пустой — возможно, диаграмма не содержит элементов.');
    }

    // Активация кнопки скачивания
    setEncoded(document.querySelector('#js-download-diagram'), 'diagram.bpmn', xml);
  } catch (err) {
    // Деактивация кнопки при ошибке
    setEncoded(document.querySelector('#js-download-diagram'), 'diagram.bpmn', null);
  }
}, 500);
```

## Чтение диаграммы с экрана

### Метод `modeler.saveXML()`
```javascript
const result = await modeler.saveXML({ format: true });
```

**Что делает этот метод:**
1. **Считывает текущее состояние** - извлекает все элементы диаграммы с холста
2. **Преобразует в XML** - конвертирует визуальные элементы в BPMN 2.0 XML формат
3. **Форматирует** - добавляет отступы и переносы строк для читаемости
4. **Возвращает результат** в виде объекта:
   ```javascript
   {
     xml: "<?xml version='1.0' encoding='UTF-8'?><bpmn:definitions>...</bpmn:definitions>",
     warnings: [] // массив предупреждений (если есть)
   }
   ```

### Параметры метода:
- **`format: true`** - включает форматирование XML (отступы, переносы строк)
- **Без параметров** - возвращает компактный XML без форматирования

## Обработка ошибок

### Сценарии деактивации кнопки:

1. **Ошибка инициализации modeler:**
   ```javascript
   if (!modeler) {
     console.log('⚠️ Моделировщик не инициализирован, пропускаем экспорт XML');
     return;
   }
   ```

2. **Пустая диаграмма:**
   ```javascript
   if (!xml.trim()) {
     throw new Error('XML пустой — возможно, диаграмма не содержит элементов.');
   }
   ```

3. **Некорректный тип данных:**
   ```javascript
   if (typeof xml !== 'string') {
     throw new Error(`XML должен быть строкой, а не ${typeof xml}`);
   }
   ```

## Полный цикл работы

### Пример последовательности действий:

1. **Пользователь загружает диаграмму** → `loadDiagram()` → `openDiagram()`
2. **Диаграмма отображается на холсте** → `modeler.importXML()`
3. **Любое изменение диаграммы** → событие `commandStack.changed`
4. **Автоматический вызов** → `exportArtifacts()` (с задержкой 500мс)
5. **Чтение диаграммы** → `modeler.saveXML({ format: true })`
6. **Активация кнопки** → `setEncoded(link, 'diagram.bpmn', xml)`
7. **Пользователь кликает** → браузер скачивает файл `diagram.bpmn`

## Технические особенности

### Debounce механизм:
```javascript
const exportArtifacts = debounce(async () => {
  // функция exportArtifacts
}, 500);
```

- **Предотвращает избыточные вызовы** при множественных быстрых изменениях
- **Задержка 500мс** - дает время на завершение всех изменений
- **Экономит ресурсы** - не вызывает экспорт при каждом мелком изменении

### Data URL ограничения:
- **Размер файла** - ограничен длиной URL (обычно несколько МБ)
- **Кодирование** - `encodeURIComponent()` экранирует специальные символы
- **Совместимость** - работает во всех современных браузерах

## Заключение

Кнопка "⬇️ Скачать BPMN" представляет собой удобный механизм экспорта диаграммы, который автоматически активируется при наличии корректной диаграммы и позволяет скачать её одним кликом в формате BPMN 2.0 XML.
