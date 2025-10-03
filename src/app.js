import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

import './style.css';

import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import diagramXML from '../resources/newDiagram.bpmn';

const container = $('#js-drop-zone');

let modeler = null;

// Инициализация modeler
async function initializeModeler() {
  try {
    const canvasElement = document.querySelector('#js-canvas');
    if (!canvasElement) {
      throw new Error('Элемент canvas не найден');
    }

    modeler = new BpmnModeler({
      container: canvasElement,
    });

    // Ждем пока modeler будет готов
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('✅ Моделировщик BPMN инициализирован');
    return modeler;
  } catch (err) {
    console.error('❌ Ошибка инициализации моделировщика:', err);
    throw err;
  }
}

// --- Основные функции ---

async function openDiagram(xml) {
  try {
    // Проверяем, что modeler инициализирован
    if (!modeler) {
      await initializeModeler();
    }

    await modeler.importXML(xml);
    container.removeClass('with-error').addClass('with-diagram');
    // document.querySelector('#save-button').disabled = false;
    // document.querySelector('#save-scheme-button')?.disabled = false;
  } catch (err) {
    container.removeClass('with-diagram').addClass('with-error');
    container.find('.error pre').text(err.message);
    console.error('Ошибка при импорте схемы:', err);
  }
}

// Новая функция для кнопки "💽 Сохранить схему"
async function saveScheme() {
  try {
    console.log('🔍 Начало сохранения схемы через кнопку 💽...');

    // Проверяем, что modeler инициализирован
    if (!modeler) {
      throw new Error('Моделировщик BPMN не инициализирован');
    }

    // Получаем XML диаграммы с canvas
    console.log('📄 Получение XML с canvas...');
    const result = await modeler.saveXML({ format: true });

    // Проверяем результат
    if (!result) {
      throw new Error('Не удалось получить данные диаграммы с canvas');
    }

    const { xml, warnings } = result;

    // Валидация XML
    if (!xml || typeof xml !== 'string' || !xml.trim()) {
      throw new Error('Диаграмма пуста или содержит некорректные данные');
    }

    console.log('✅ XML получен с canvas, длина:', xml.length, 'символов');

    if (warnings && Array.isArray(warnings) && warnings.length > 0) {
      console.warn('⚠️ Предупреждения при получении диаграммы:', warnings);
    }

    // Отправляем на сервер
    console.log('📤 Отправка диаграммы на сервер...');
    const response = await fetch('http://localhost:8081/diagram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: xml
    });

    console.log('📥 Ответ сервера:', response.status, response.statusText);

    // Получаем текст ответа
    const responseText = await response.text();
    console.log('📄 Текст ответа сервера:', responseText);

    if (!response.ok) {
      let errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
      if (responseText) {
        errorMessage += ` - ${responseText}`;
      }
      throw new Error(errorMessage);
    }

    console.log('✅ Схема успешно сохранена на сервер!');
    alert('✅ Схема успешно сохранена на сервер!');

  } catch (error) {
    console.error('❌ Ошибка при сохранении схемы:', error);

    // Детализированное сообщение об ошибке для пользователя
    let userMessage = 'Не удалось сохранить схему.\n\n';

    if (error.message.includes('Моделировщик BPMN не инициализирован')) {
      userMessage += '❌ Моделировщик не готов. Перезагрузите страницу.\n\n';
    } else if (error.message.includes('Диаграмма пуста')) {
      userMessage += '❌ Диаграмма пуста. Добавьте элементы перед сохранением.\n\n';
    } else if (error.message.includes('fetch') || error.message.includes('Network')) {
      userMessage += '❌ Ошибка соединения с сервером.\n';
      userMessage += 'Проверьте подключение к интернету и работу backend сервера.\n\n';
    } else if (error.message.includes('404')) {
      userMessage += '❌ Сервер не найден (404).\n';
      userMessage += 'Проверьте адрес сервера: http://localhost:8081\n\n';
    } else if (error.message.includes('500')) {
      userMessage += '❌ Ошибка на сервере (500).\n';
      userMessage += 'Проверьте логи backend сервера.\n\n';
    } else {
      userMessage += `❌ Неизвестная ошибка: ${error.message}\n\n`;
    }

    userMessage += `Технические детали:\n${error.message}`;

    alert(userMessage);
  }
}

async function loadDiagram() {
  $('.message.intro').hide();

  try {
    const res = await fetch('http://localhost:8081/diagram');
    if (!res.ok) throw new Error('Ошибка загрузки с сервера');
    const xml = await res.text();
    await openDiagram(xml);
    console.log('Схема загружена с сервера');
  } catch (err) {
    console.error('Ошибка при загрузке схемы, загружаю по умолчанию:', err);
    await openDiagram(diagramXML);
  }
}

function registerFileDrop(container, callback) {
  function handleFileSelect(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  const element = container.get(0);
  element.addEventListener('dragover', handleDragOver, false);
  element.addEventListener('drop', handleFileSelect, false);
}

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

function debounce(fn, timeout) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(fn, timeout);
  };
}

const exportArtifacts = debounce(async () => {
  try {
    // Проверяем, что modeler инициализирован
    if (!modeler) {
      console.log('⚠️ Моделировщик не инициализирован, пропускаем экспорт');
      return;
    }

    const { svg } = await modeler.saveSVG();
    setEncoded(document.querySelector('#js-download-svg'), 'diagram.svg', svg);
  } catch (err) {
    console.error('Ошибка при сохранении SVG:', err);
    setEncoded(document.querySelector('#js-download-svg'), 'diagram.svg', null);
  }

  try {
    // Проверяем, что modeler инициализирован
    if (!modeler) {
      console.log('⚠️ Моделировщик не инициализирован, пропускаем экспорт XML');
      return;
    }

    const result = await modeler.saveXML({ format: true });

    // Сначала проверим, что вообще что-то вернулось
    if (!result) {
      console.error('⚠️ saveXML вернул undefined');
      throw new Error('saveXML не вернул данные — возможно, диаграмма пуста или модель не загружена.');
    }

    // Теперь можно безопасно достать xml
    const { xml, warnings } = result;

    // Проверим xml отдельно
    if (typeof xml !== 'string') {
      console.error('⚠️ saveXML вернул некорректный тип xml:', typeof xml, result);
      throw new Error(`XML должен быть строкой, а не ${typeof xml}`);
    }

    if (!xml.trim()) {
      console.error('⚠️ saveXML вернул пустой XML:', xml);
      throw new Error('XML пустой — возможно, диаграмма не содержит элементов.');
    }

    setEncoded(document.querySelector('#js-download-diagram'), 'diagram.bpmn', xml);
  } catch (err) {
    console.error('Ошибка при сохранении XML:', err);
    setEncoded(document.querySelector('#js-download-diagram'), 'diagram.bpmn', null);
  }
}, 500);

// --- Инициализация UI ---

async function setupUI() {
  if (!window.FileList || !window.FileReader) {
    alert(
      'Ваш браузер не поддерживает drag and drop. Используйте современные браузеры, например Chrome или Firefox.'
    );
  } else {
    registerFileDrop(container, openDiagram);
  }

  document.querySelector('#js-create-diagram')?.addEventListener('click', (e) => {
    e.preventDefault();
    openDiagram(diagramXML);
    $('.message.intro').hide();
  });

  document.querySelector('#save-scheme-button')?.addEventListener('click', saveScheme);
  document.querySelector('#load-button')?.addEventListener('click', loadDiagram);

  document.querySelectorAll('.buttons a').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (!el.classList.contains('active')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });

  // Инициализируем modeler и устанавливаем слушатель событий только после инициализации
  try {
    await initializeModeler();
    modeler.on('commandStack.changed', exportArtifacts);
    console.log('✅ UI настроен и моделировщик готов к работе');
  } catch (err) {
    console.error('❌ Ошибка при настройке UI:', err);
  }
}

// --- Старт ---

window.addEventListener('DOMContentLoaded', async () => {
  await setupUI();
  // await (); // Загружаем схему с сервера или по умолчанию
});
